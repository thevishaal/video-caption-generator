"""
Burns SRT subtitles into video using FFmpeg.
Reuses videos.utils.run_command — no subprocess duplication.
"""
import os
import shutil
import logging
from django.conf import settings
from videos.utils import run_command

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
    
    # Safely extract background variables and calculate exact ASS Alpha
    bg_color_val = getattr(first, "background_color", "#000000") if first else "#000000"
    bg_opacity_val = getattr(first, "bg_opacity", 40) if first else 40
    back_color = _convert_bg_to_ass(bg_color_val, bg_opacity_val)
    
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
    lines = [header.strip()]
    
    # Establish fallback baseline for ALL CAPS flag
    global_caps = getattr(first, "is_caps", False) if first else False

    for cap in captions:
        text = (cap.translated_text if use_translated and cap.translated_text else cap.original_text)
        if not text:
            continue
            
        text = text.strip()
        
        # --- FEATURE 1: ALL CAPS (Render-time only) ---
        cap_is_caps = getattr(cap, "is_caps", global_caps)
        if cap_is_caps:
            text = text.upper()
            
        # --- FEATURE 4: ASS TEXT SAFETY ---
        # Prevent curly brace/comma parsing errors in libass/ffmpeg
        text = text.replace(",", "\\,").replace("{", "\\{").replace("}", "\\}").replace("\n", "\\N")
        
        lines.append(f"Dialogue: 0,{_to_ass_time(cap.start_time)},{_to_ass_time(cap.end_time)},Default,,0,0,0,,{text}")
    return "\n".join(lines)


def _to_ass_time(seconds):
    cs = int(round(seconds * 100))
    return f"{cs//360000}:{(cs%360000)//6000:02d}:{(cs%6000)//100:02d}.{cs%100:02d}"


def _hex_to_ass_color(hex_color):
    h = str(hex_color).lstrip("#")
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}" if len(h) == 6 else "&H00FFFFFF"


def _convert_bg_to_ass(color_str, opacity):
    """
    Handles Feature 2 & 3: Background Opacity Fix & Fallbacks.
    Converts either an old rgba() string or hex string + 0-100 opacity into ASS format.
    ASS format needs strictly calculated Alpha 0-255 (0 = solid, 255 = transparent).
    """
    try:
        opacity = int(opacity)
    except (ValueError, TypeError):
        opacity = 40  # Safe fallback
        
    opacity = max(0, min(100, opacity))
    alpha_val = int((100 - opacity) * 255 / 100)
    alpha_hex = f"{alpha_val:02X}"
    
    color_str = str(color_str).strip()
    
    # Backward compatibility: Try to parse older RGBA outputs from older clients
    if color_str.startswith("rgba"):
        try:
            inner = color_str.lstrip("rgba(").rstrip(")")
            r, g, b, _ = [p.strip() for p in inner.split(",")]
            return f"&H{alpha_hex}{int(b):02X}{int(g):02X}{int(r):02X}"
        except Exception:
            return f"&H{alpha_hex}000000"
            
    # Process standard hex output
    h = color_str.lstrip("#")
    if len(h) == 6:
        return f"&H{alpha_hex}{h[4:6]}{h[2:4]}{h[0:2]}"
    elif len(h) == 3:
        return f"&H{alpha_hex}{h[2]}{h[2]}{h[1]}{h[1]}{h[0]}{h[0]}"
        
    return f"&H{alpha_hex}000000"