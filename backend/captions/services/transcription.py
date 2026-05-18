"""
Delegates to videos.services.transcribe_video() which already handles:
- Reading video.audio_file (WAV saved in DB by populate_video_metadata)
- Calling Groq Whisper API
- Returning [{start, end, text}, ...]
"""
import logging

from videos.services import transcribe_video

logger = logging.getLogger(__name__)


def get_transcription_segments(video) -> list[dict]:
    if not video.audio_file:
        raise RuntimeError(
            f"Video '{video.id}' has no extracted audio."
        )

    segments = transcribe_video(video)

    # 👇 THIS IS THE MAGIC FIX
    segments = split_long_segments(segments, max_words=6)

    return segments


import re
def split_long_segments(segments, max_words=8):
    new_segments = []

    sentence_endings = re.compile(r'[.!?]')

    for seg in segments:
        text = seg["text"].strip()
        start = seg["start"]
        end = seg["end"]

        # Step 1: split by punctuation first (natural break)
        parts = sentence_endings.split(text)
        puncts = sentence_endings.findall(text)

        words_timeline = text.split()
        total_words = len(words_timeline)

        if total_words == 0:
            continue

        time_per_word = (end - start) / total_words
        word_index = 0

        for i, part in enumerate(parts):
            part_words = part.strip().split()
            if not part_words:
                continue

            # Step 2: further split if too long
            for j in range(0, len(part_words), max_words):
                chunk_words = part_words[j:j + max_words]

                chunk_start = start + (word_index * time_per_word)
                chunk_end = start + ((word_index + len(chunk_words)) * time_per_word)

                text_chunk = " ".join(chunk_words)

                # add punctuation back if exists
                if i < len(puncts):
                    text_chunk += puncts[i]

                new_segments.append({
                    "start": round(chunk_start, 2),
                    "end": round(chunk_end, 2),
                    "text": text_chunk.strip()
                })

                word_index += len(chunk_words)

    return new_segments