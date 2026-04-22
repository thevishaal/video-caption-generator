import os
import tempfile
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.db import transaction
from .constants import VIDEO_STATUS_READY


from .models import ExportJob, Video
from .utils import get_video_metadata, run_command, format_seconds_to_srt_time
from .constants import (
    EXPORT_STATUS_COMPLETED,
    EXPORT_STATUS_FAILED,
    EXPORT_STATUS_PROCESSING,
)


def populate_video_metadata(video: Video):
    metadata = get_video_metadata(video.original_file.path)
    video.duration_seconds = metadata["duration_seconds"]
    video.width = metadata["width"]
    video.height = metadata["height"]
    video.fps = metadata["fps"]
    video.codec = metadata["codec"]
    video.status = VIDEO_STATUS_READY
    video.save(update_fields=["duration_seconds", "width", "height", "fps", "codec", "status", "updated_at"])
    return video


def _get_caption_model():
    from captions.models import Caption
    return Caption


def build_srt_file(video: Video, language: str) -> str:
    Caption = _get_caption_model()

    captions = Caption.objects.filter(video=video, language=language).order_by("start_time")

    if not captions.exists():
        raise ValueError("No captions found for this video and language.")

    temp_dir = tempfile.mkdtemp(prefix="caption_srt_")
    srt_path = os.path.join(temp_dir, f"{video.id}.srt")

    with open(srt_path, "w", encoding="utf-8") as srt_file:
        for idx, caption in enumerate(captions, start=1):
            text = caption.translated_text or caption.original_text or ""
            srt_file.write(f"{idx}\n")
            srt_file.write(
                f"{format_seconds_to_srt_time(caption.start_time)} --> "
                f"{format_seconds_to_srt_time(caption.end_time)}\n"
            )
            srt_file.write(f"{text.strip()}\n\n")

    return srt_path


def export_video_with_captions(export_job: ExportJob) -> ExportJob:
    video = export_job.video
    export_job.status = EXPORT_STATUS_PROCESSING
    export_job.error_message = ""
    export_job.save(update_fields=["status", "error_message", "updated_at"])

    try:
        srt_path = build_srt_file(video=video, language=export_job.language)
        use_captions = True
    except Exception:
        use_captions = False

        suffix = f".{export_job.export_format}"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_output:
            output_path = tmp_output.name

        subtitle_path = srt_path.replace("\\", "/").replace(":", "\\:")
        input_path = video.original_file.path

        command = [
            "ffmpeg",
            "-y",
            "-i", input_path,
        ]

        if use_captions:
            subtitle_path = srt_path.replace("\\", "/").replace(":", "\\:")
            command += ["-vf", f"subtitles='{subtitle_path}'"]

        command += [
            "-s", export_job.resolution,
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "23",
            "-c:a", "aac",
            output_path,
        ]
        run_command(command)

        final_name = f"{video.id}_export.{export_job.export_format}"
        with open(output_path, "rb") as exported_file:
            export_job.output_file.save(final_name, File(exported_file), save=False)

        export_job.status = EXPORT_STATUS_COMPLETED
        export_job.error_message = ""
        export_job.save(update_fields=["output_file", "status", "error_message", "updated_at"])

        if os.path.exists(output_path):
            os.remove(output_path)

        return export_job

    except Exception as exc:
        export_job.status = EXPORT_STATUS_FAILED
        export_job.error_message = str(exc)
        export_job.save(update_fields=["status", "error_message", "updated_at"])
        raise