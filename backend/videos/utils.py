import json
import os
import subprocess
from pathlib import Path

from rest_framework.exceptions import ValidationError

from .constants import (
    ALLOWED_VIDEO_EXTENSIONS,
    ALLOWED_CONTENT_TYPES,
    MAX_VIDEO_SIZE_BYTES,
    MAX_VIDEO_SIZE_MB,
)


def validate_video_file(uploaded_file):
    """Validate extension, content type, and file size of an uploaded video."""
    ext = Path(uploaded_file.name).suffix.lower()

    if ext not in ALLOWED_VIDEO_EXTENSIONS:
        raise ValidationError(
            f"Unsupported video format '{ext}'. Allowed: "
            f"{', '.join(sorted(ALLOWED_VIDEO_EXTENSIONS))}"
        )

    content_type = getattr(uploaded_file, "content_type", None)
    if content_type and content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationError(
            f"Invalid content type '{content_type}' for uploaded video."
        )

    if uploaded_file.size > MAX_VIDEO_SIZE_BYTES:
        raise ValidationError(
            f"Video file too large. Maximum allowed size is {MAX_VIDEO_SIZE_MB} MB."
        )


def run_command(command: list[str]) -> str:
    """Run a shell command and return stdout. Raises RuntimeError on failure."""
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


def get_video_metadata(file_path: str) -> dict:
    """
    Use ffprobe to extract video stream metadata and duration.
    Returns a dict with: duration_seconds, width, height, fps, codec.
    """
    command = [
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "stream=width,height,r_frame_rate,codec_name,tags,side_data",
        "-show_entries", "format=duration",
        "-of", "json",
        file_path,
    ]
    output = run_command(command)
    data = json.loads(output)

    stream = (data.get("streams") or [{}])[0]
    fmt = data.get("format") or {}

    # Detect rotation metadata to swap display dimensions for portrait videos
    tags = stream.get("tags", {})
    rotate = 0
    if "rotate" in tags:
        try:
            rotate = abs(int(tags["rotate"]))
        except ValueError:
            pass

    side_data_list = stream.get("side_data_list", [])
    for side_data in side_data_list:
        if "rotation" in side_data:
            try:
                rotate = abs(int(side_data["rotation"]))
            except ValueError:
                pass
        elif side_data.get("side_data_type") == "Display Matrix":
            try:
                rotate = abs(int(side_data.get("rotation", 0)))
            except ValueError:
                pass

    width = stream.get("width")
    height = stream.get("height")

    if rotate in [90, 270] and width and height:
        width, height = height, width

    fps_raw = stream.get("r_frame_rate", "0/1")
    try:
        numerator, denominator = fps_raw.split("/")
        fps = float(numerator) / float(denominator) if float(denominator) != 0 else 0.0
    except Exception:
        fps = 0.0

    return {
        "duration_seconds": float(fmt.get("duration", 0.0)),
        "width": width,
        "height": height,
        "fps": fps,
        "codec": stream.get("codec_name", ""),
    }


def extract_audio(video_path: str, output_audio_path: str) -> str:
    """
    Extract audio from a video file using ffmpeg.
    Saves as a 16kHz mono WAV (optimal for Groq Whisper transcription).
    Returns the output audio path.
    """
    command = [
        "ffmpeg",
        "-y",
        "-i", video_path,
        "-vn",               # no video
        "-acodec", "pcm_s16le",
        "-ar", "16000",      # 16kHz sample rate for Whisper
        "-ac", "1",          # mono channel
        output_audio_path,
    ]
    run_command(command)
    return output_audio_path


def format_seconds_to_srt_time(seconds: float) -> str:
    """Convert float seconds to SRT timestamp format: HH:MM:SS,mmm"""
    total_ms = int(round(seconds * 1000))
    hours = total_ms // 3600000
    minutes = (total_ms % 3600000) // 60000
    secs = (total_ms % 60000) // 1000
    millis = total_ms % 1000
    return f"{hours:02}:{minutes:02}:{secs:02},{millis:03}"


def ensure_directory(path: str) -> None:
    """Create directory if it doesn't exist."""
    os.makedirs(path, exist_ok=True)
