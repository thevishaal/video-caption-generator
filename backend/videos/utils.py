import json
import os
import subprocess
from pathlib import Path

from django.core.exceptions import ValidationError

from .constants import (
    ALLOWED_VIDEO_EXTENSIONS,
    ALLOWED_CONTENT_TYPES,
    MAX_VIDEO_SIZE_BYTES,
)


def validate_video_file(uploaded_file):
    ext = Path(uploaded_file.name).suffix.lower()

    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise ValidationError(
            f"Unsupported video format. Allowed: {', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content_type = getattr(uploaded_file, "content_type", None)
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError("Invalid content type for uploaded video.")

    if uploaded_file.size > MAX_VIDEO_SIZE_BYTES:
        raise ValidationError(
            f"Video file too large. Maximum allowed size is {MAX_VIDEO_SIZE_BYTES // (1024 * 1024)} MB."
        )


def run_command(command):
    process = subprocess.run(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        check=False,
    )
    if process.returncode != 0:
        raise RuntimeError(process.stderr.strip() or "Command execution failed.")
    return process.stdout


def get_video_metadata(file_path):
    command = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,codec_name",
        "-show_entries", "format=duration",
        "-of", "json",
        file_path,
    ]
    output = run_command(command)
    data = json.loads(output)

    stream = (data.get("streams") or [{}])[0]
    fmt = data.get("format") or {}

    fps_raw = stream.get("r_frame_rate", "0/1")
    try:
        numerator, denominator = fps_raw.split("/")
        fps = float(numerator) / float(denominator) if float(denominator) != 0 else 0.0
    except Exception:
        fps = 0.0

    return {
        "duration_seconds": float(fmt.get("duration", 0.0)),
        "width": stream.get("width"),
        "height": stream.get("height"),
        "fps": fps,
        "codec": stream.get("codec_name", ""),
    }


def format_seconds_to_srt_time(seconds):
    total_ms = int(round(seconds * 1000))
    hours = total_ms // 3600000
    minutes = (total_ms % 3600000) // 60000
    secs = (total_ms % 60000) // 1000
    millis = total_ms % 1000
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def ensure_directory(path):
    os.makedirs(path, exist_ok=True)