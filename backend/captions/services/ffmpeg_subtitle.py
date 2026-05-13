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
    "top": 8,
    "center": 5,
    "bottom": 2,
    "bottom-left": 1,
    "bottom-center": 2,
    "bottom-right": 3,
}


def burn_subtitles_into_video(
    video_path, captions, video_id,
    language="en", resolution="1280x720",
    export_format="mp4", use_translated=False,
):
    if not shutil.which("ffmpeg"):
        raise EnvironmentError("FFmpeg not found in PATH.")

    ass_path = _save_ass_file(captions, video_id, language, use_translated)
    output_dir = os.path.join(settings.MEDIA_ROOT, "videos", "exports", "captions")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{video_id}_{language}.{export_format}")
    scale = RESOLUTION_SCALE_MAP.get(resolution, "1280:720")

    # Windows path fix: backslashes and colons break FFmpeg filters
    ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")

    cmd = [
        "ffmpeg", "-y", "-i", video_path,
        "-vf", f"scale={scale},ass='{ass_escaped}'",
        "-c:v", "libx264", "-crf", "18", "-preset", "fast",
        "-c:a", "aac", "-b:a", "192k",
        output_path,
    ]
    run_command(cmd)
    return output_path


def _save_ass_file(captions, video_id, language, use_translated):
    ass_dir = os.path.join(settings.MEDIA_ROOT, "ass")
    os.makedirs(ass_dir, exist_ok=True)
    ass_path = os.path.join(ass_dir, f"video_{video_id}_{language}.ass")
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(_build_ass(captions, captions[0] if captions else None, use_translated))
    return ass_path


def _build_ass(captions, first, use_translated):
    font_name  = getattr(first, "font_family",       "Montserrat") if first else "Montserrat"
    font_size  = getattr(first, "font_size",          32)          if first else 32
    font_color = _hex_to_ass_color(getattr(first, "font_color",   "#FFFFFF") if first else "#FFFFFF")
    bold       = 1 if getattr(first, "bold",   False) else 0
    italic     = 1 if getattr(first, "italic", False) else 0
    alignment  = ASS_ALIGNMENT.get(getattr(first, "position", "bottom-center") if first else "bottom-center", 2)
    back_color = _rgba_to_ass_color(getattr(first, "background_color", "rgba(0,0,0,0.6)") if first else "rgba(0,0,0,0.6)")
    margin_v   = 20 if alignment in (1, 2, 3) else 10

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{font_color},&H000000FF,&H00000000,{back_color},{bold},{italic},0,0,100,100,0,0,4,0,0,{alignment},10,10,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    for cap in captions:
        text  = (cap.translated_text if use_translated and cap.translated_text else cap.original_text).strip().replace("\n", "\\N")
        lines.append(f"Dialogue: 0,{_to_ass_time(cap.start_time)},{_to_ass_time(cap.end_time)},Default,,0,0,0,,{text}")
    return "\n".join(lines)


def _to_ass_time(seconds):
    cs = int(round(seconds * 100))
    return f"{cs//360000}:{(cs%360000)//6000:02d}:{(cs%6000)//100:02d}.{cs%100:02d}"


def _hex_to_ass_color(hex_color):
    h = hex_color.lstrip("#")
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}" if len(h) == 6 else "&H00FFFFFF"


def _rgba_to_ass_color(rgba):
    try:
        inner = rgba.strip().lstrip("rgba(").rstrip(")")
        r, g, b, a = [p.strip() for p in inner.split(",")]
        alpha = int((1.0 - float(a)) * 255)
        return f"&H{alpha:02X}{int(b):02X}{int(g):02X}{int(r):02X}"
    except Exception:
        return "&H99000000"