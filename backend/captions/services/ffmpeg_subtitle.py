"""
Burns ASS subtitles into video using FFmpeg.
"""
import os
import shutil
import logging
from django.conf import settings
from videos.utils import run_command
from captions.utils.ass_generator import build_ass_file

logger = logging.getLogger(__name__)

RESOLUTION_SCALE_MAP = {
    "854x480":   "854:480",
    "1280x720":  "1280:720",
    "1920x1080": "1920:1080",
    "3840x2160": "3840:2160",
}

def burn_subtitles_into_video(
    video_path: str,
    captions: list,
    video_id: str,
    language: str = "en",
    resolution: str = "1280x720",
    export_format: str = "mp4",
    use_translated: bool = False,
) -> str:
    
    if not shutil.which("ffmpeg"):
        raise EnvironmentError("FFmpeg not found in PATH.")

    # 1. Generate the ASS file in the media folder
    ass_path = build_ass_file(
        captions=captions,
        video_id=video_id,
        language=language,
        use_translated=use_translated,
        resolution=resolution,
    )

    if not os.path.exists(ass_path):
        raise RuntimeError(f"ASS file not created: {ass_path}")

    # 2. ✅ CRITICAL: Format the path strictly for FFmpeg's 'ass' filter
    # Convert to absolute path, change backslashes to forward slashes
    ass_escaped = os.path.abspath(ass_path).replace("\\", "/")
    
    # Escape the drive colon (e.g., C:/ becomes C\:/) 
    # FFmpeg uses colons to separate filter arguments, so this is mandatory on Windows.
    if len(ass_escaped) > 1 and ass_escaped[1] == ":":
        ass_escaped = ass_escaped[0] + "\\:" + ass_escaped[2:]

    logger.info("[BURN] Executing with ASS file: %s", ass_escaped)

    # 3. Setup output path
    output_dir = os.path.join(settings.MEDIA_ROOT, "videos", "exports", "captions")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"{video_id}_{language}.{export_format}")
    scale = RESOLUTION_SCALE_MAP.get(resolution, "1280:720")

    # Windows path fix: backslashes and colons break FFmpeg filters
    ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")

    # 4. Build the FFmpeg command using the 'ass' filter (NOT 'subtitles')
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
