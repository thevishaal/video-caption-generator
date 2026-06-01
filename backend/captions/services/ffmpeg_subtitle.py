"""
Burns ASS subtitles into video using FFmpeg.
Reuses videos.utils.run_command — no subprocess duplication.
"""
import os
import shutil
import logging
import requests
from django.conf import settings
from videos.utils import run_command
from videos.models import Video

logger = logging.getLogger(__name__)

FONT_REGISTRY = {
    "Inter": "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_fvQtMwCp5SR3q0.ttf",
    "Roboto": "https://fonts.gstatic.com/s/roboto/v32/KFOlCnqEu92Fr1MmWUlfBBc4.ttf",
    "Pirata One": "https://fonts.gstatic.com/s/pirataone/v22/t5JyIRo49v2m1m1H3S7Sgw.ttf",
    "Playfair Display": "https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD7K3a3X7O2cDnyoXcQ.ttf",
    "Montserrat": "https://fonts.gstatic.com/s/montserrat/v29/JTUHjIg1_i6t8kCHKm4MV961.ttf",
    "Open Sans": "https://fonts.gstatic.com/s/opensans/v40/memvYaGs126MiZpBA-UvWbX2vVnXBbObj2OVTS-muw.ttf",
    "Courier New": None,  # Standard system font
}


def ensure_font_downloaded(font_name):
    """
    Ensures that the selected TTF font from our registry is downloaded and cached
    under media/fonts/ so FFmpeg/libass can use it dynamically via fontsdir.
    """
    font_name_clean = font_name.strip()
    matched_font = None
    for key in FONT_REGISTRY:
        if key.lower() == font_name_clean.lower():
            matched_font = key
            break

    if not matched_font:
        logger.warning(f"Selected font '{font_name}' not found in registry. Using system fonts.")
        return None

    url = FONT_REGISTRY[matched_font]
    if not url:
        return None  # System font, no download needed

    fonts_dir = os.path.join(settings.MEDIA_ROOT, "fonts")
    os.makedirs(fonts_dir, exist_ok=True)
    font_filename = f"{matched_font.replace(' ', '_')}.ttf"
    font_path = os.path.join(fonts_dir, font_filename)

    if not os.path.exists(font_path) or os.path.getsize(font_path) == 0:
        try:
            logger.info(f"Downloading font '{matched_font}' from {url}...")
            response = requests.get(url, timeout=15)
            if response.status_code == 200:
                with open(font_path, "wb") as f:
                    f.write(response.content)
                logger.info(f"Font '{matched_font}' cached successfully at {font_path}.")
            else:
                logger.error(f"Failed to download font '{matched_font}': HTTP {response.status_code}")
        except Exception as e:
            logger.error(f"Error downloading font '{matched_font}': {e}")

    return font_path if os.path.exists(font_path) else None


def _check_font_availability(font_name):
    """
    Checks if a font is downloaded or present on the system.
    """
    downloaded_path = ensure_font_downloaded(font_name)
    if downloaded_path:
        return True

    # System fallback detection
    import sys
    font_name_clean = font_name.lower().replace(" ", "").replace("-", "")
    available = False

    if sys.platform == 'win32':
        font_dirs = [
            os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts'),
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'Microsoft\\Windows\\Fonts')
        ]
        for d in font_dirs:
            if os.path.exists(d):
                try:
                    for f in os.listdir(d):
                        f_clean = f.lower().replace(" ", "").replace("-", "")
                        if font_name_clean in f_clean:
                            available = True
                            break
                except Exception:
                    pass
            if available:
                break
    else:
        font_dirs = ['/usr/share/fonts', '/usr/local/share/fonts', '~/.fonts', '~/.local/share/fonts']
        for d in font_dirs:
            path = os.path.expanduser(d)
            if os.path.exists(path):
                try:
                    for root, dirs, files in os.walk(path):
                        for f in files:
                            f_clean = f.lower().replace(" ", "").replace("-", "")
                            if font_name_clean in f_clean:
                                available = True
                                break
                        if available:
                            break
                except Exception:
                    pass
            if available:
                break

    if not available:
        logger.error(f"[FONT FAILURE]: Selected font '{font_name}' not available. Falling back to Inter.")
        return False
    return True


def register_font_windows(font_path):
    try:
        import ctypes
        gdi32 = ctypes.WinDLL('gdi32')
        # FR_PRIVATE = 0x10 makes the font visible only to this process and child processes
        res = gdi32.AddFontResourceExW(font_path, 0x10, 0)
        if res > 0:
            logger.info(f"Registered Windows session-private font '{font_path}'.")
            return True
    except Exception as e:
        logger.error(f"Error registering Windows session-private font '{font_path}': {e}")
    return False


def unregister_font_windows(font_path):
    try:
        import ctypes
        gdi32 = ctypes.WinDLL('gdi32')
        gdi32.RemoveFontResourceExW(font_path, 0x10, 0)
        logger.info(f"Unregistered Windows session-private font '{font_path}'.")
    except Exception as e:
        logger.error(f"Error unregistering Windows session-private font '{font_path}': {e}")


def burn_subtitles_into_video(
    video_path, captions, video_id,
    language="en", resolution="1280x720",
    export_format="mp4", use_translated=False,
):
    if not shutil.which("ffmpeg"):
        raise EnvironmentError("FFmpeg not found in PATH.")

    # ── Aspect Ratio & Orientation Swapping (Never force landscape) ──
    try:
        video = Video.objects.get(pk=video_id)
        if video.width and video.height:
            target_w, target_h = map(int, resolution.split("x"))
            if video.height > video.width and target_w > target_h:
                # Swap requested landscape to match portrait input orientation
                resolution = f"{target_h}x{target_w}"
            elif video.width > video.height and target_h > target_w:
                # Swap requested portrait to match landscape input orientation
                resolution = f"{target_h}x{target_w}"
    except Video.DoesNotExist:
        pass

    # Ensure selected font is downloaded and register it if on Windows
    font_name = "Inter"
    if captions:
        font_name = getattr(captions[0], "font_family", "Inter")
    
    downloaded_font_path = ensure_font_downloaded(font_name)
    registered_font = False
    import sys
    if sys.platform == 'win32' and downloaded_font_path and os.path.exists(downloaded_font_path):
        registered_font = register_font_windows(downloaded_font_path)

    try:
        ass_path = _save_ass_file(captions, video_id, language, use_translated, resolution)
        output_dir = os.path.join(settings.MEDIA_ROOT, "videos", "exports", "captions")
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{video_id}_{language}.{export_format}")

        ass_escaped = ass_path.replace("\\", "/").replace(":", "\\:")
        fonts_dir = os.path.join(settings.MEDIA_ROOT, "fonts")
        os.makedirs(fonts_dir, exist_ok=True)
        fonts_dir_escaped = fonts_dir.replace("\\", "/").replace(":", "\\:")

        target_w, target_h = map(int, resolution.split("x"))
        vf_filter = (
            f"scale=w={target_w}:h={target_h}:force_original_aspect_ratio=decrease,"
            f"pad=w={target_w}:h={target_h}:x=(ow-iw)/2:y=(oh-ih)/2:color=black,"
            f"ass=filename='{ass_escaped}':fontsdir='{fonts_dir_escaped}'"
        )

        cmd = [
            "ffmpeg", "-y", "-i", video_path,
            "-vf", vf_filter,
            "-map", "0:v:0",
            "-map", "0:a:0",
            "-map_metadata", "0",
            "-metadata:s:v:0", "rotate=0",  # Reset stream rotation tag to prevent double-rotation
            "-c:v", "libx264", "-crf", "18", "-preset", "fast",
            "-c:a", "aac", "-b:a", "192k",
            output_path,
        ]
        run_command(cmd)
        return output_path
    finally:
        # Self-cleaning private font unregistration
        if registered_font and downloaded_font_path and sys.platform == 'win32':
            unregister_font_windows(downloaded_font_path)


def _save_ass_file(captions, video_id, language, use_translated, resolution):
    ass_dir = os.path.join(settings.MEDIA_ROOT, "ass")
    os.makedirs(ass_dir, exist_ok=True)
    ass_path = os.path.join(ass_dir, f"video_{video_id}_{language}.ass")
    with open(ass_path, "w", encoding="utf-8") as f:
        f.write(_build_ass(captions, captions[0] if captions else None, use_translated, resolution))
    return ass_path


def _build_ass(captions, first, use_translated, resolution="1280x720"):
    target_w, target_h = map(int, resolution.split("x"))
    font_name = getattr(first, "font_family", "Inter") if first else "Inter"

    # Font checking & fallback
    if not _check_font_availability(font_name):
        font_name = "Inter"
        _check_font_availability(font_name)

    # Pixel-perfect scaling rule: UI baseline player height = 360px
    ui_baseline_font_size = getattr(first, "font_size", 16) if first else 16
    font_size = int(ui_baseline_font_size * (target_h / 360.0))

    font_color = _hex_to_ass_color(getattr(first, "font_color", "#FFFFFF") if first else "#FFFFFF")
    bold = 1 if getattr(first, "bold", False) else 0
    italic = 1 if getattr(first, "italic", False) else 0
    position = getattr(first, "position", "bottom-center") if first else "bottom-center"
    letter_spacing = 0

    bg_color_val = getattr(first, "background_color", "#000000") if first else "#000000"
    bg_opacity_val = getattr(first, "bg_opacity", 40) if first else 40

    if bg_opacity_val > 0:
        # BorderStyle = 3 renders an opaque solid box natively behind text
        border_style = 3
        outline = max(3, int(font_size * 0.3))  # outline acts as padding around text box
        shadow = 0
        ass_bg = _convert_bg_to_ass(bg_color_val, bg_opacity_val)
        outline_color = ass_bg
        back_color = ass_bg
    else:
        # BorderStyle = 1 is standard outline + shadow text
        border_style = 1
        outline = 0
        shadow = 0
        outline_color = "&H00000000"
        back_color = "&H00000000"

    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {target_w}
PlayResY: {target_h}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{font_color},&H000000FF,{outline_color},{back_color},{bold},{italic},0,0,100,100,{letter_spacing},0,{border_style},{outline},{shadow},5,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header.strip()]

    global_caps = getattr(first, "is_caps", False) if first else False
    margin_x = max(24, int(target_w * 0.08))
    margin_y = max(24, int(target_h * 0.08))

    alignment_map = {
        "top-left": (7, margin_x, margin_y),
        "top-center": (8, target_w // 2, margin_y),
        "top-right": (9, target_w - margin_x, margin_y),
        "bottom-left": (1, margin_x, target_h - margin_y),
        "bottom-center": (2, target_w // 2, target_h - margin_y),
        "bottom-right": (3, target_w - margin_x, target_h - margin_y),
    }

    align_tag, cx, cy = alignment_map.get(position, (2, target_w // 2, target_h - margin_y))

    for cap in captions:
        text = (cap.translated_text if use_translated and cap.translated_text else cap.original_text)
        if not text:
            continue

        text = text.strip()
        cap_is_caps = getattr(cap, "is_caps", global_caps)
        if cap_is_caps:
            text = text.upper()

        text_safe = text.replace(",", "\\,").replace("{", "\\{").replace("}", "\\}").replace("\n", "\\N")

        lines.append(
            f"Dialogue: 0,{_to_ass_time(cap.start_time)},{_to_ass_time(cap.end_time)},Default,,0,0,0,,"
            f"{{\\an{align_tag}\\pos({cx},{cy})}}{text_safe}"
        )
    return "\n".join(lines)


def _to_ass_time(seconds):
    cs = int(round(seconds * 100))
    return f"{cs//360000}:{(cs%360000)//6000:02d}:{(cs%6000)//100:02d}.{cs%100:02d}"


def _hex_to_ass_color(hex_color):
    h = str(hex_color).lstrip("#")
    return f"&H00{h[4:6]}{h[2:4]}{h[0:2]}" if len(h) == 6 else "&H00FFFFFF"


def _convert_bg_to_ass(color_str, opacity):
    try:
        opacity = int(opacity)
    except (ValueError, TypeError):
        opacity = 40
        
    opacity = max(0, min(100, opacity))
    alpha_val = int((100 - opacity) * 255 / 100)
    alpha_hex = f"{alpha_val:02X}"
    
    color_str = str(color_str).strip()
    
    if color_str.startswith("rgba"):
        try:
            inner = color_str.lstrip("rgba(").rstrip(")")
            r, g, b, _ = [p.strip() for p in inner.split(",")]
            return f"&H{alpha_hex}{int(b):02X}{int(g):02X}{int(r):02X}"
        except Exception:
            return f"&H{alpha_hex}000000"
            
    h = color_str.lstrip("#")
    if len(h) == 6:
        return f"&H{alpha_hex}{h[4:6]}{h[2:4]}{h[0:2]}"
    elif len(h) == 3:
        return f"&H{alpha_hex}{h[2]}{h[2]}{h[1]}{h[1]}{h[0]}{h[0]}"
        
    return f"&H{alpha_hex}000000"