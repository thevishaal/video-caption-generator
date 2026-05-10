from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Video, ExportJob
from .permissions import IsVideoOwner
from .serializers import (
    VideoUploadSerializer,
    VideoPreviewSerializer,
    ExportRequestSerializer,
    ExportJobSerializer,
)
from .services import populate_video_metadata, export_video_with_captions


# ---------------------------------------------------------------------------
# Response helpers
# ---------------------------------------------------------------------------

def api_success(data=None, message="Success", http_status=status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "data":    data if data is not None else {},
            "message": message,
        },
        status=http_status,
    )


def api_error(message="Something went wrong", data=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {
            "success": False,
            "data":    data if data is not None else {},
            "message": message,
        },
        status=http_status,
    )


# ---------------------------------------------------------------------------
# Video list
# ---------------------------------------------------------------------------

class VideoListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        videos     = Video.objects.filter(owner=request.user)
        serializer = VideoPreviewSerializer(videos, many=True, context={"request": request})
        return api_success(data=serializer.data, message="Videos fetched successfully.")


# ---------------------------------------------------------------------------
# Video upload
# ---------------------------------------------------------------------------

class VideoUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VideoUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        video = serializer.save()

        # populate_video_metadata does two things in one call:
        #   1. Reads ffprobe output → saves width/height/fps/codec/duration.
        #   2. Extracts audio with ffmpeg → saves WAV to video.audio_file in DB.
        #      The captions app then reads video.audio_file for transcription
        #      without needing to re-run ffmpeg.
        # If it fails (e.g. ffmpeg not installed in dev) the video stays in
        # "uploaded" status and audio_file remains null; the captions app
        # must handle a missing audio_file gracefully.
        try:
            populate_video_metadata(video)
        except Exception:
            # Refresh so we return whatever partial state was saved
            video.refresh_from_db()

        # Always refresh before serializing so audio_file URL is included
        video.refresh_from_db()

        response_data = VideoPreviewSerializer(video, context={"request": request}).data
        return api_success(
            data=response_data,
            message="Video uploaded successfully.",
            http_status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Video preview
# ---------------------------------------------------------------------------

class VideoPreviewView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get_object(self, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(self.request, video)
        return video

    def get(self, request, pk):
        video      = self.get_object(pk)
        serializer = VideoPreviewSerializer(video, context={"request": request})
        return api_success(data=serializer.data, message="Video preview fetched successfully.")


# ---------------------------------------------------------------------------
# Video export
# ---------------------------------------------------------------------------

class VideoExportView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get_object(self, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(self.request, video)
        return video

    def post(self, request, pk):
        video = self.get_object(pk)

        if video.status != "ready":
            return api_error(
                "Video is not ready for export yet.",
                http_status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        export_job = ExportJob.objects.create(
            video         = video,
            requested_by  = request.user,
            export_format = serializer.validated_data["export_format"],
            resolution    = serializer.validated_data["resolution"],
            language      = serializer.validated_data["language"],
            caption_mode  = serializer.validated_data["caption_mode"],
        )

        try:
            export_video_with_captions(export_job)
        except Exception as exc:
            export_job.refresh_from_db()
            return api_error(
                message=f"Export failed: {str(exc)}",
                data=ExportJobSerializer(export_job, context={"request": request}).data,
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        export_job.refresh_from_db()
        return api_success(
            data=ExportJobSerializer(export_job, context={"request": request}).data,
            message="Video exported successfully.",
        )


# ---------------------------------------------------------------------------
# Export status poll  (frontend polls this to show progress bar)
# ---------------------------------------------------------------------------

class VideoExportStatusView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get(self, request, pk, export_id):
        export_job = get_object_or_404(ExportJob, pk=export_id, video_id=pk)
        self.check_object_permissions(request, export_job)
        return api_success(
            data=ExportJobSerializer(export_job, context={"request": request}).data,
            message="Export status fetched.",
        )


# ---------------------------------------------------------------------------
# Video download
# ---------------------------------------------------------------------------

class VideoDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get(self, request, pk):
        export_job = (
            ExportJob.objects
            .filter(video_id=pk, video__owner=request.user, status="completed")
            .order_by("-created_at")
            .first()
        )

        if not export_job or not export_job.output_file:
            raise Http404("No exported file found for this video.")

        response = FileResponse(
            export_job.output_file.open("rb"),
            as_attachment=True,
            filename=export_job.output_file.name.split("/")[-1],
        )
        return response
