import json
import logging
import os
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

LANGUAGE_NAMES = {
    "en": "English", "hi": "Hindi", "es": "Spanish", "fr": "French",
    "de": "German", "ar": "Arabic", "pt": "Portuguese",
    "ja": "Japanese", "ko": "Korean", "zh": "Chinese",
}
TRANSLATION_MODEL = getattr(settings, "GROQ_TRANSLATION_MODEL", "llama3-70b-8192")


def translate_captions(texts: list[str], target_language: str) -> list[str]:
    """
    Translates caption strings to target_language via Groq LLM.
    Batches in chunks of 50. Falls back to originals on partial failure.
    """
    lang_name = LANGUAGE_NAMES.get(target_language, target_language)
    results = []
    for i in range(0, len(texts), 50):
        chunk = texts[i:i + 50]
        results.extend(_translate_chunk(chunk, lang_name))
    return results


def _translate_chunk(texts: list[str], lang_name: str) -> list[str]:
    numbered = "\n".join(f"{i + 1}. {t}" for i, t in enumerate(texts))
    prompt = (
        f"Translate the following numbered subtitle lines to {lang_name}.\n"
        f"Return ONLY a JSON array of translated strings in the same order.\n"
        f"No explanations, no markdown fences.\n\n{numbered}"
    )
    
    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.2,
            },
            timeout=60,
        )
        response.raise_for_status()
        
        # Safely extract raw text
        raw = response.json().get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
        # Robustly strip markdown code fences if model includes them
        if raw.startswith("```"):
            raw = raw.strip("`").strip()
            if raw.lower().startswith("json"):
                raw = raw[4:].strip()
        
        # Parse JSON
        try:
            translated = json.loads(raw)
        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed for translation chunk: {e}. Raw: {raw[:100]}...")
            return texts  # Cannot iterate through broken JSON; full chunk fallback required
            
        # Ensure we have a list to work with
        if not isinstance(translated, list):
            logger.warning(f"Translation model returned {type(translated).__name__} instead of a list.")
            return texts

        # Enforce exact length and apply per-item fallback
        results = []
        for i, original_text in enumerate(texts):
            # Check if the translated index exists and contains a valid string
            if i < len(translated) and translated[i]:
                results.append(str(translated[i]))
            else:
                # Fallback to the original text if missing or empty
                logger.warning(f"Missing translation for item {i}. Falling back to original.")
                results.append(original_text)
                
        return results

    except Exception as e:
        logger.error(f"Translation chunk failed with exception: {e}")
        return texts  # fallback: return originals unchanged