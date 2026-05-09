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
    """
    Calls the existing videos.services.transcribe_video().
    Returns list of dicts: [{start, end, text}, ...]
    Raises RuntimeError if audio_file is not set on the Video record.
    """
    if not video.audio_file:
        raise RuntimeError(
            f"Video '{video.id}' has no extracted audio. "
            "Ensure the video was uploaded and processed successfully (status='ready')."
        )
    return transcribe_video(video)