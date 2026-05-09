import logging
import os

from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from videos.models import Video
from videos.permissions import IsVideoOwner

from captions.models import Caption
from captions.serializers import (
    CaptionSerializer,
    CaptionStyleSerializer,
    GenerateCaptionsSerializer,
    TranslateCaptionsSerializer,
)
from captions.services.transcription import get_transcription_segments
from captions.services.translation import translate_captions
from captions.services.ffmpeg_subtitle import burn_subtitles_into_video
from captions.utils.segmentation import build_caption_segments
from captions.utils.srt_generator import save_srt_file

logger = logging.getLogger(__name__)


# ── Response helpers (mirror videos.views pattern) ───────────────────────────

def api_success(data=None, message="Success", http_status=status.HTTP_200_OK):
    return Response(
        {"success": True, "data": data if data is not None else {}, "message": message},
        status=http_status,
    )


def api_error(message="Something went wrong", data=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {"success": False, "data": data if data is not None else {}, "message": message},
        status=http_status,
    )


# ── Generate captions ─────────────────────────────────────────────────────────

class GenerateCaptionsView(APIView):
    """POST /api/captions/generate"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = GenerateCaptionsSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        video = get_object_or_404(Video, pk=ser.validated_data["video_id"], owner=request.user)
        language = ser.validated_data["language"]

        if video.status != "ready":
            return api_error("Video not ready. Upload must complete before generating captions.")

        try:
            groq_segments = get_transcription_segments(video)
        except RuntimeError as e:
            return api_error(str(e), http_status=status.HTTP_502_BAD_GATEWAY)

        segments = build_caption_segments(groq_segments)

        # Replace captions for this video+language
        Caption.objects.filter(video=video, language=language).delete()
        captions = Caption.objects.bulk_create([
            Caption(
                video=video,
                start_time=seg["start_time"],
                end_time=seg["end_time"],
                original_text=seg["original_text"],
                language=language,
            )
            for seg in segments
        ])

        return api_success(
            data=CaptionSerializer(captions, many=True).data,
            message=f"{len(captions)} captions generated.",
            http_status=status.HTTP_201_CREATED,
        )


# ── Translate captions ────────────────────────────────────────────────────────

class TranslateCaptionsView(APIView):
    """POST /api/captions/translate"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = TranslateCaptionsSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        video = get_object_or_404(Video, pk=ser.validated_data["video_id"], owner=request.user)
        target_language = ser.validated_data["target_language"]
        caption_ids = ser.validated_data.get("caption_ids")

        qs = Caption.objects.filter(video=video)
        if caption_ids:
            qs = qs.filter(id__in=caption_ids)
        qs = qs.order_by("start_time")

        if not qs.exists():
            return api_error("No captions found. Generate captions first.", http_status=status.HTTP_404_NOT_FOUND)

        texts = [c.original_text for c in qs]
        try:
            translated = translate_captions(texts, target_language)
        except Exception as e:
            return api_error(f"Translation failed: {e}", http_status=status.HTTP_502_BAD_GATEWAY)

        updated = []
        for cap, trans in zip(qs, translated):
            cap.translated_text = trans
            cap.language = target_language
            updated.append(cap)
        Caption.objects.bulk_update(updated, ["translated_text", "language"])

        return api_success(
            data=CaptionSerializer(updated, many=True).data,
            message=f"{len(updated)} captions translated to '{target_language}'.",
        )


# ── Style update ──────────────────────────────────────────────────────────────

class CaptionStyleView(APIView):
    """PUT /api/captions/style"""
    permission_classes = [IsAuthenticated]

    STYLE_FIELDS = [
        "font_family", "font_size", "font_color", "background_color",
        "position", "alignment", "bold", "italic",
    ]

    def put(self, request):
        ser = CaptionStyleSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        caption_ids = data.get("caption_ids")
        video_id = data.get("video_id")

        if caption_ids:
            qs = Caption.objects.filter(id__in=caption_ids, video__owner=request.user)
        elif video_id:
            qs = Caption.objects.filter(video_id=video_id, video__owner=request.user)
        else:
            return api_error("Provide caption_ids or video_id.")

        update_kwargs = {f: data[f] for f in self.STYLE_FIELDS if f in data}
        if not update_kwargs:
            return api_error("No style fields provided.")

        count = qs.update(**update_kwargs)
        return api_success(
            data={"updated_fields": list(update_kwargs.keys()), "count": count},
            message=f"Style applied to {count} captions.",
        )


# ── Caption CRUD ──────────────────────────────────────────────────────────────

class CaptionListView(APIView):
    """GET /api/captions/?video_id=<uuid>"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        video_id = request.query_params.get("video_id")
        if not video_id:
            return api_error("video_id query param required.")
        qs = Caption.objects.filter(video_id=video_id, video__owner=request.user).order_by("start_time")
        return api_success(data=CaptionSerializer(qs, many=True).data)


class CaptionDetailView(APIView):
    """GET / PUT / DELETE /api/captions/<uuid>/"""
    permission_classes = [IsAuthenticated]

    def _get(self, pk, user):
        return get_object_or_404(Caption, pk=pk, video__owner=user)

    def get(self, request, pk):
        return api_success(data=CaptionSerializer(self._get(pk, request.user)).data)

    def put(self, request, pk):
        caption = self._get(pk, request.user)
        ser = CaptionSerializer(caption, data=request.data, partial=True)
        ser.is_valid(raise_exception=True)
        ser.save()
        return api_success(data=ser.data, message="Caption updated.")

    def delete(self, request, pk):
        self._get(pk, request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ── Export (burn subtitles) ───────────────────────────────────────────────────

class VideoCaptionExportView(APIView):
    """
    POST /api/captions/videos/<uuid:video_id>/export
    Burns captions into the video using FFmpeg.
    Uses videos.ExportJob for status tracking.
    """
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def post(self, request, video_id):
        from videos.models import ExportJob
        from videos.serializers import ExportRequestSerializer, ExportJobSerializer

        video = get_object_or_404(Video, pk=video_id)
        self.check_object_permissions(request, video)

        if video.status != "ready":
            return api_error("Video not ready for export.")

        ser = ExportRequestSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        language = data["language"]
        use_translated = language != video.language

        captions = list(
            Caption.objects.filter(video=video, language=language).order_by("start_time")
        )
        if not captions:
            captions = list(Caption.objects.filter(video=video).order_by("start_time"))
        if not captions:
            return api_error("No captions found. Generate captions first.")

        # Create ExportJob using the existing videos model
        job = ExportJob.objects.create(
            video=video,
            requested_by=request.user,
            export_format=data["export_format"],
            resolution=data["resolution"],
            language=language,
            caption_mode=data["caption_mode"],
            status="processing",
        )

        try:
            output_path = burn_subtitles_into_video(
                video_path=video.original_file.path,
                captions=captions,
                video_id=video.id,
                language=language,
                resolution=data["resolution"],
                export_format=data["export_format"],
                use_translated=use_translated,
            )
            # Save output into ExportJob.output_file
            from django.core.files import File
            with open(output_path, "rb") as f:
                job.output_file.save(
                    f"{video.id}_captioned.{data['export_format']}",
                    File(f),
                    save=False,
                )
            job.status = "completed"
            job.save(update_fields=["output_file", "status", "updated_at"])

        except Exception as e:
            job.status = "failed"
            job.error_message = str(e)
            job.save(update_fields=["status", "error_message", "updated_at"])
            return api_error(f"Export failed: {e}", http_status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return api_success(
            data=ExportJobSerializer(job, context={"request": request}).data,
            message="Video exported with captions.",
        )


# ── SRT download ──────────────────────────────────────────────────────────────

class SRTDownloadView(APIView):
    """GET /api/captions/videos/<uuid:video_id>/download-srt?language=en&translated=true"""
    permission_classes = [IsAuthenticated]

    def get(self, request, video_id):
        video = get_object_or_404(Video, pk=video_id, owner=request.user)
        language = request.query_params.get("language", video.language)
        use_translated = request.query_params.get("translated", "false").lower() == "true"

        captions = Caption.objects.filter(video=video, language=language).order_by("start_time")
        if not captions.exists():
            captions = Caption.objects.filter(video=video).order_by("start_time")
        if not captions.exists():
            return api_error("No captions found.", http_status=status.HTTP_404_NOT_FOUND)

        srt_path = save_srt_file(captions, video.id, language, use_translated=use_translated)
        response = FileResponse(
            open(srt_path, "rb"),
            content_type="application/x-subrip",
            as_attachment=True,
            filename=f"captions_{video.id}_{language}.srt",
        )
        return response