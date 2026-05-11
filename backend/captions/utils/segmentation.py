"""
Converts Groq segment dicts [{start, end, text}] into clean caption dicts.
Splits segments that exceed MAX_CHARS or MAX_DURATION for readability.
"""
from typing import List, Dict

MAX_CHARS = 80
MAX_DURATION = 5.0  # seconds


def build_caption_segments(groq_segments: List[Dict]) -> List[Dict]:
    captions = []
    for seg in groq_segments:
        text = seg.get("text", "").strip()
        if not text:
            continue
        duration = seg["end"] - seg["start"]
        if len(text) > MAX_CHARS or duration > MAX_DURATION:
            captions.extend(_split(seg))
        else:
            captions.append({
                "start_time": round(seg["start"], 3),
                "end_time": round(seg["end"], 3),
                "original_text": text,
            })
    return captions


def _split(seg: Dict) -> List[Dict]:
    words = seg["text"].strip().split()
    total_words = len(words)
    if not total_words:
        return []

    total_duration = seg["end"] - seg["start"]
    chunk_words = max(1, int(MAX_CHARS / max(1, sum(len(w) for w in words) / total_words)))
    chunks = [words[i:i + chunk_words] for i in range(0, total_words, chunk_words)]

    result = []
    elapsed = 0.0
    for chunk in chunks:
        proportion = len(chunk) / total_words
        duration = round(total_duration * proportion, 3)
        start = round(seg["start"] + elapsed, 3)
        end = min(round(start + duration, 3), seg["end"])
        elapsed += duration
        result.append({
            "start_time": start,
            "end_time": end,
            "original_text": " ".join(chunk),
        })
    return result