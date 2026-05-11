"""
Burns SRT subtitles into video using FFmpeg.
Reuses videos.utils.run_command — no subprocess duplication.
"""
import os
import shutil
import logging
from django.conf import settings
from videos.utils import run_command
from captions.utils.srt_generator import save_srt_file

logger = logging.getLogger(__name__)

# Matches videos/constants.py SUPPORTED_RESOLUTIONS keys → WxH string
RESOLUTION_SCALE_MAP = {
    "854x480": "854:480",
    "1280x720": "1280:720",
    "1920x1080": "1920:1080",
    "3840x2160": "3840:2160",
}

ASS_ALIGNMENT = {
    "top-left": 7,
    "top-center": 8,
    "top-right": 9,
    "bottom-left": 1,
    "bottom-center": 2,
    "bottom-right": 3,
}


def burn_subtitles_into_video(
    video_path: str,
    captions: list,
    video_id,
    language: str = "en",
    resolution: str = "1280x720",
    export_format: str = "mp4",
    use_translated: bool = False,
) -> str:
    """
    Generates SRT, burns it into video with FFmpeg.
    Returns path to exported file saved under MEDIA_ROOT/videos/exports/captions/.
    """
    if not shutil.which("ffmpeg"):
        raise EnvironmentError("FFmpeg not found in PATH.")

    srt_path = save_srt_file(captions, video_id, language, use_translated=use_translated)
    output_dir = os.path.join(settings.MEDIA_ROOT, "videos", "exports", "captions")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{video_id}_{language}.{export_format}")

    scale = RESOLUTION_SCALE_MAP.get(resolution, "1280:720")
    style_filter = _build_subtitle_filter(captions, srt_path)

    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vf", f"scale={scale},{style_filter}",
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-c:a", "aac", "-b:a", "192k",
        output_path,
    ]

    logger.info("Burning subtitles: %s", " ".join(cmd))
    run_command(cmd)  # raises RuntimeError on failure — matches videos pattern

    return output_path


def _build_subtitle_filter(captions: list, srt_path: str) -> str:
    escaped = srt_path.replace("\\", "/").replace(":", "\\:")
    style_parts = []

    first = captions[0] if captions else None
    if first:
        color = _hex_to_ass(getattr(first, "font_color", "#FFFFFF"))
        align = ASS_ALIGNMENT.get(getattr(first, "position", "bottom-center"), 2)
        style_parts = [
            f"FontName={getattr(first, 'font_family', 'Montserrat')}",
            f"FontSize={getattr(first, 'font_size', 32)}",
            f"PrimaryColour={color}",
            f"Alignment={align}",
            f"Bold={1 if getattr(first, 'bold', False) else 0}",
            "BorderStyle=4",
            "BackColour=&H99000000",
            "Outline=0", "Shadow=0",
        ]

    force_style = ",".join(style_parts)
    if force_style:
        return f"subtitles='{escaped}':force_style='{force_style}'"
    return f"subtitles='{escaped}'"


def _hex_to_ass(hex_color: str) -> str:
    """#RRGGBB → ASS &H00BBGGRR"""
    h = hex_color.lstrip("#")
    if len(h) == 6:
        return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}"
    return "&H00FFFFFF"