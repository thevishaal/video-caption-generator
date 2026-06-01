import os
import tempfile

from django.core.files import File

from .models import ExportJob, Video
from .utils import get_video_metadata, run_command, format_seconds_to_srt_time, extract_audio
from .constants import (
    VIDEO_STATUS_PROCESSING,
    VIDEO_STATUS_FAILED,
    VIDEO_STATUS_READY,
    EXPORT_STATUS_COMPLETED,
    EXPORT_STATUS_FAILED,
    EXPORT_STATUS_PROCESSING,
)


# ---------------------------------------------------------------------------
# Video metadata + audio extraction
# ---------------------------------------------------------------------------

def populate_video_metadata(video: Video) -> Video:
    """
    1. Run ffprobe → save width/height/fps/codec/duration to Video record.
    2. Extract audio (16 kHz mono WAV) → save to Video.audio_file in DB.
       The captions app reads video.audio_file.path for transcription —
       no need to re-run ffmpeg on every transcription request.
    3. Set status = VIDEO_STATUS_READY so the workflow can proceed.

    NOTE: .path works for local FileSystemStorage. For S3/GCS, download the
    original file to a temp path before calling ffprobe / ffmpeg.
    """
    # --- Step 1: probe metadata ---
    metadata = get_video_metadata(video.original_file.path)
    video.duration_seconds = metadata["duration_seconds"]
    video.width            = metadata["width"]
    video.height           = metadata["height"]
    video.fps              = metadata["fps"]
    video.codec            = metadata["codec"]

    # --- Step 2: extract and persist audio ---
    audio_dir  = tempfile.mkdtemp(prefix="audio_extract_")
    audio_path = os.path.join(audio_dir, f"{video.id}.wav")

    try:
        extract_audio(video.original_file.path, audio_path)

        if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
            raise RuntimeError(
                "Audio extraction produced no output. "
                "Check ffmpeg installation and the video file."
            )

        # Save the WAV file into Django storage (media/videos/audio/…) and
        # record it on the Video row so the captions app can access it via
        # video.audio_file.path without re-running ffmpeg.
        audio_filename = f"{video.id}.wav"
        with open(audio_path, "rb") as wav_file:
            video.audio_file.save(audio_filename, File(wav_file), save=False)

    finally:
        # Always remove the local temp file regardless of success/failure.
        if os.path.exists(audio_path):
            os.remove(audio_path)
        try:
            os.rmdir(audio_dir)
        except OSError:
            pass

    # --- Step 3: mark ready and persist everything in one save ---
    video.status = VIDEO_STATUS_READY
    video.save(update_fields=[
        "duration_seconds", "width", "height", "fps",
        "codec", "audio_file", "status", "updated_at",
    ])

    return video


# ---------------------------------------------------------------------------
# Caption helpers  (called by captions app, not directly by views)
# ---------------------------------------------------------------------------

def _get_caption_model():
    """Lazy import to avoid circular dependency between apps."""
    from captions.models import Caption
    return Caption


def build_srt_file(video: Video, language: str) -> str:
    """
    Build an SRT subtitle file from Caption records for the given video+language.
    Returns the path to a temporary .srt file.
    Raises ValueError if no captions exist for that language.
    """
    Caption  = _get_caption_model()
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
def export_video_with_captions(export_job: ExportJob) -> ExportJob:
    """
    Export a video with optional burned-in subtitles or separate SRT using ffmpeg/ass.

    Steps:
      1. Try to build styled ASS subtitles from Caption records.
      2. If caption_mode is "burned", use ASS subtitle burner to compile the video.
      3. If caption_mode is "srt" (or no captions found for "burned" fallback), output scaled clean video.
      4. Save output to ExportJob.output_file with a meaningful filename.
      5. Update status to completed / failed.
    """
    video = export_job.video
    export_job.status      = EXPORT_STATUS_PROCESSING
    export_job.error_message = ""
    export_job.save(update_fields=["status", "error_message", "updated_at"])

    # 1. Construct a meaningful export filename based on original video, language, and resolution
    from django.utils.text import slugify
    original_base = os.path.splitext(video.original_filename)[0]
    safe_base = slugify(original_base) or "video"
    res_label = export_job.resolution.split("x")[-1] + "p"
    final_name = f"{safe_base}_{export_job.language}_{res_label}.{export_job.export_format}"

    # 2. Compile video path
    output_path = None
    use_burned = (export_job.caption_mode == ExportJob.CAPTION_MODE_BURNED)

    try:
        from captions.models import Caption
        captions = list(
            Caption.objects.filter(video=video, language=export_job.language).order_by("start_time")
        )
        if not captions:
            # Fallback to the original language captions if target lang is empty
            captions = list(Caption.objects.filter(video=video).order_by("start_time"))

        if use_burned and captions:
            # --- BURNED CAPTIONS VIA STYLED ASS ---
            from captions.services.ffmpeg_subtitle import burn_subtitles_into_video
            use_translated = (
                export_job.language != video.language and
                any(c.translated_text for c in captions)
            )
            # Use the high-fidelity ASS subtitle burner
            output_path = burn_subtitles_into_video(
                video_path=video.original_file.path,
                captions=captions,
                video_id=video.id,
                language=export_job.language,
                resolution=export_job.resolution,
                export_format=export_job.export_format,
                use_translated=use_translated,
            )
        else:
            # --- CLEAN VIDEO EXPORT (SRT mode or no captions) ---
            if export_job.caption_mode == ExportJob.CAPTION_MODE_SRT and not captions:
                # SRT mode requires captions to exist — fail early
                export_job.status        = EXPORT_STATUS_FAILED
                export_job.error_message = (
                    f"No captions found for language '{export_job.language}'. "
                    "Generate captions before exporting as SRT."
                )
                export_job.save(update_fields=["status", "error_message", "updated_at"])
                return export_job

            # Render clean scaled video
            suffix = f".{export_job.export_format}"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                output_path = tmp.name

            from .utils import run_command
            
            target_w, target_h = map(int, export_job.resolution.split("x"))
            if video.height and video.width:
                if video.height > video.width and target_w > target_h:
                    target_w, target_h = target_h, target_w
                elif video.width > video.height and target_h > target_w:
                    target_w, target_h = target_h, target_w

            vf_filter = (
                f"scale=w={target_w}:h={target_h}:force_original_aspect_ratio=decrease,"
                f"pad=w={target_w}:h={target_h}:x=(ow-iw)/2:y=(oh-ih)/2:color=black"
            )

            input_path = video.original_file.path
            command = [
                "ffmpeg", "-y", "-i", input_path,
                "-vf", vf_filter,
                "-map", "0:v:0",      # first video stream
                "-map", "0:a:0",      # first audio stream
                "-map_metadata", "0", # preserve metadata
                "-metadata:s:v:0", "rotate=0", # Reset stream rotation tag to prevent double-rotation
                "-c:v", "libx264",
                "-preset", "medium",
                "-crf", "23",
                "-c:a", "aac",
                "-b:a", "192k",
                output_path,
            ]
            run_command(command)

        # 3. Save encoded file to ExportJob record
        with open(output_path, "rb") as encoded_file:
            export_job.output_file.save(final_name, File(encoded_file), save=False)

        export_job.status        = EXPORT_STATUS_COMPLETED
        export_job.error_message = ""
        export_job.save(
            update_fields=["output_file", "status", "error_message", "updated_at"]
        )

    except Exception as exc:
        export_job.status        = EXPORT_STATUS_FAILED
        export_job.error_message = str(exc)
        export_job.save(update_fields=["status", "error_message", "updated_at"])
        raise

    finally:
        # Clean up local temporary file if one was produced
        if output_path and os.path.exists(output_path):
            if hasattr(export_job.output_file, 'path') and output_path == export_job.output_file.path:
                pass
            else:
                try:
                    os.remove(output_path)
                except OSError:
                    pass

    return export_job


# ---------------------------------------------------------------------------
# Transcription  (called by captions app — reads video.audio_file saved in DB)
# ---------------------------------------------------------------------------

def transcribe_video(video: Video) -> list[dict]:
    """
    Send the already-extracted audio (video.audio_file) to Groq Whisper.
    Returns a list of segment dicts: [{start, end, text}, …]

    The audio file is saved to DB in populate_video_metadata() — the captions
    app calls this function after upload without needing to re-run ffmpeg.
    The caller (captions app) is responsible for saving Caption records.

    Raises RuntimeError if video.audio_file is not set yet.
    """
    import requests
    from django.conf import settings

    if not video.audio_file:
        raise RuntimeError(
            f"Video '{video.id}' has no audio_file saved. "
            "Ensure populate_video_metadata() completed successfully before transcribing."
        )

    # Read directly from the stored file — no temp extraction needed
    with video.audio_file.open("rb") as audio_file:
        response = requests.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
            files={"file": (f"{video.id}.wav", audio_file, "audio/wav")},
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

    data     = response.json()
    segments = data.get("segments", [])

    return [
        {
            "start": seg.get("start", 0.0),
            "end":   seg.get("end",   0.0),
            "text":  seg.get("text",  "").strip(),
        }
        for seg in segments
    ]


