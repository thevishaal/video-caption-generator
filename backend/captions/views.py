from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Caption

import whisper
from googletrans import Translator
from decouple import config
import os

# Load from .env
model_name = config('WHISPER_MODEL', default='base')
model = whisper.load_model(model_name)

translator = Translator()


# 🎬 Generate Captions
@api_view(['POST'])
def generate_captions(request):
    video = request.FILES.get('video')

    if not video:
        return Response({"error": "Video required"}, status=400)

    file_path = f"media/{video.name}"

    # Save file
    with open(file_path, "wb+") as f:
        for chunk in video.chunks():
            f.write(chunk)

    # AI Caption
    result = model.transcribe(file_path)

    caption = Caption.objects.create(
        video=video,
        text=result['text']
    )

    return Response({
        "id": caption.id,
        "caption": result['text']
    })


# 🌍 Translate
@api_view(['POST'])
def translate_captions(request):
    text = request.data.get('text')
    lang = request.data.get('lang', 'hi')

    if not text:
        return Response({"error": "Text required"}, status=400)

    translated = translator.translate(text, dest=lang)

    return Response({
        "translated_text": translated.text
    })


# 🎨 Style
@api_view(['PUT'])
def style_captions(request):
    text = request.data.get('text')
    style = request.data.get('style')

    if not text or not style:
        return Response({"error": "Text & style required"}, status=400)

    if style == "upper":
        styled = text.upper()
    elif style == "lower":
        styled = text.lower()
    elif style == "title":
        styled = text.title()
    else:
        styled = text

    return Response({
        "styled_text": styled
    })