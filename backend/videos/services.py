import os
import tempfile

from django.core.files import File

from .models import ExportJob, Video
from .utils import get_video_metadata, run_command, format_seconds_to_srt_time, extract_audio
from .constants import (
    VIDEO_STATUS_READY,
    VIDEO_STATUS_FAILED,
    EXPORT_STATUS_COMPLETED,
    EXPORT_STATUS_FAILED,
    EXPORT_STATUS_PROCESSING,
)


# ---------------------------------------------------------------------------
# Video metadata
# ---------------------------------------------------------------------------

def populate_video_metadata(video: Video) -> Video:
    """
    Run ffprobe on the uploaded file and update the Video record.
    Sets status to 'ready' on success, 'failed' on error.
    NOTE: .path only works with local FileSystemStorage. For S3/GCS, download
    the file to a temp path first before calling ffprobe.
    """
    metadata = get_video_metadata(video.original_file.path)
    video.duration_seconds = metadata["duration_seconds"]
    video.width = metadata["width"]
    video.height = metadata["height"]
    video.fps = metadata["fps"]
    video.codec = metadata["codec"]
    video.status = VIDEO_STATUS_READY
    video.save(
        update_fields=[
            "duration_seconds", "width", "height", "fps",
            "codec", "status", "updated_at",
        ]
    )
    return video


# ---------------------------------------------------------------------------
# Caption helpers
# ---------------------------------------------------------------------------

def _get_caption_model():
    """Lazy import to avoid circular dependency between apps."""
    from captions.models import Caption
    return Caption


def build_srt_file(video: Video, language: str) -> str:
    """
    Build an SRT subtitle file from Caption records for the given video+language.
    Returns the path to the temporary .srt file.
    Raises ValueError if no captions exist.
    """
    Caption = _get_caption_model()
    captions = Caption.objects.filter(
        video=video, language=language
    ).order_by("start_time")

    if not captions.exists():
        raise ValueError(
            f"No captions found for video '{video.id}' in language '{language}'."
        )

    temp_dir = tempfile.mkdtemp(prefix="caption_srt_")
    srt_path = os.path.join(temp_dir, f"{video.id}.srt")

    with open(srt_path, "w", encoding="utf-8") as srt_file:
        for idx, caption in enumerate(captions, start=1):
            text = (caption.translated_text or caption.original_text or "").strip()
            srt_file.write(f"{idx}\n")
            srt_file.write(
                f"{format_seconds_to_srt_time(caption.start_time)} --> "
                f"{format_seconds_to_srt_time(caption.end_time)}\n"
            )
            srt_file.write(f"{text}\n\n")

    return srt_path


# ---------------------------------------------------------------------------
# Export pipeline
# ---------------------------------------------------------------------------

def export_video_with_captions(export_job: ExportJob) -> ExportJob:
    """
    Export a video with optional burned-in subtitles using ffmpeg.

    Steps:
      1. Try to build an SRT file from Caption records.
      2. Run ffmpeg to encode the video (with or without subtitles).
      3. Save the output file to ExportJob.output_file.
      4. Update status to 'completed' or 'failed'.
    """
    video = export_job.video
    export_job.status = EXPORT_STATUS_PROCESSING
    export_job.error_message = ""
    export_job.save(update_fields=["status", "error_message", "updated_at"])

    srt_path = None
    use_captions = False

    # Step 1: Try to build SRT — non-fatal if captions don't exist yet
    try:
        srt_path = build_srt_file(video=video, language=export_job.language)
        use_captions = True
    except Exception:
        # No captions yet; export the raw video without subtitles
        use_captions = False

    # Step 2: Build and run ffmpeg command
    suffix = f".{export_job.export_format}"
    output_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_output:
            output_path = tmp_output.name

        input_path = video.original_file.path

        command = [
            "ffmpeg",
            "-y",
            "-i", input_path,
        ]

        if use_captions and srt_path:
            # Escape path for ffmpeg subtitles filter (handles Windows paths too)
            subtitle_path = srt_path.replace("\\", "/").replace(":", "\\:")
            command += ["-vf", f"subtitles='{subtitle_path}'"]

        command += [
            "-map", "0:v:0",   # video stream
            "-map", "0:a:0",   # audio stream 

            "-s", export_job.resolution,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",

            "-c:a", "aac",
            "-b:a", "192k",    # better audio bitrate

            output_path,
        ]

        run_command(command)

        # Step 3: Save output file to ExportJob record
        final_name = f"{video.id}_export.{export_job.export_format}"
        with open(output_path, "rb") as exported_file:
            export_job.output_file.save(final_name, File(exported_file), save=False)

        export_job.status = EXPORT_STATUS_COMPLETED
        export_job.error_message = ""
        export_job.save(
            update_fields=["output_file", "status", "error_message", "updated_at"]
        )

    except Exception as exc:
        export_job.status = EXPORT_STATUS_FAILED
        export_job.error_message = str(exc)
        export_job.save(update_fields=["status", "error_message", "updated_at"])
        raise

    finally:
        # Step 4: Clean up temp files
        if output_path and os.path.exists(output_path):
            os.remove(output_path)
        if srt_path and os.path.exists(srt_path):
            srt_dir = os.path.dirname(srt_path)
            os.remove(srt_path)
            # Remove the temp dir if empty
            try:
                os.rmdir(srt_dir)
            except OSError:
                pass

    return export_job


# ---------------------------------------------------------------------------
# Transcription pipeline (Groq Whisper)
# ---------------------------------------------------------------------------

def transcribe_video(video: Video) -> list[dict]:
    """
    Extract audio from the video and send it to Groq's Whisper API.
    Returns a list of segment dicts with keys:
      start, end, text
    The caller (captions app) is responsible for saving Caption records.
    """
    import requests
    from django.conf import settings

    audio_dir = tempfile.mkdtemp(prefix="audio_extract_")
    audio_path = os.path.join(audio_dir, f"{video.id}.wav")

    try:
        extract_audio(video.original_file.path, audio_path)

        with open(audio_path, "rb") as audio_file:
            response = requests.post(
                "https://api.groq.com/openai/v1/audio/transcriptions",
                headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                files={"file": (os.path.basename(audio_path), audio_file, "audio/wav")},
                data={
                    "model": "whisper-large-v3-turbo",
                    "response_format": "verbose_json",
                    "language": video.language,
                },
                timeout=120,
            )

        if response.status_code != 200:
            raise RuntimeError(
                f"Groq transcription failed ({response.status_code}): {response.text}"
            )

        data = response.json()
        segments = data.get("segments", [])

        # Normalize to a consistent shape
        return [
            {
                "start": seg.get("start", 0.0),
                "end": seg.get("end", 0.0),
                "text": seg.get("text", "").strip(),
            }
            for seg in segments
        ]

    finally:
        if os.path.exists(audio_path):
            os.remove(audio_path)
        try:
            os.rmdir(audio_dir)
        except OSError:
            pass


def translate_caption_text(text: str, target_language: str) -> str:
    """
    Translate a single caption string into target_language using Groq LLM.
    Returns the translated string.
    """
    import requests
    from django.conf import settings

    prompt = (
        f"Translate the following subtitle text into {target_language}. "
        f"Return ONLY the translated text with no explanation or quotes.\n\n"
        f"Text: {text}"
    )

    response = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {settings.GROQ_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": "llama3-8b-8192",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
        },
        timeout=30,
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Groq translation failed ({response.status_code}): {response.text}"
        )

    return response.json()["choices"][0]["message"]["content"].strip()
