"""
Reuses videos.utils.format_seconds_to_srt_time — no duplication of SRT time logic.
"""
import os
from django.conf import settings
from videos.utils import format_seconds_to_srt_time


def generate_srt_string(captions, use_translated: bool = False) -> str:
    lines = []
    for idx, cap in enumerate(captions, start=1):
        text = (cap.translated_text if use_translated and cap.translated_text
                else cap.original_text).strip()
        lines.append(str(idx))
        lines.append(
            f"{format_seconds_to_srt_time(cap.start_time)} --> "
            f"{format_seconds_to_srt_time(cap.end_time)}"
        )
        lines.append(text)
        lines.append("")
    return "\n".join(lines)


def save_srt_file(captions, video_id, language: str = "en", use_translated: bool = False) -> str:
    srt_dir = os.path.join(settings.MEDIA_ROOT, "srt")
    os.makedirs(srt_dir, exist_ok=True)
    filepath = os.path.join(srt_dir, f"video_{video_id}_{language}.srt")
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(generate_srt_string(captions, use_translated=use_translated))
    return filepath