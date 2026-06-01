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
from .tasks import run_in_background


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

        # Extract video metadata and audio WAV synchronously since it's fast
        # and enables seamless immediately transition to the captions step.
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
# Video export (Asynchronous background task)
# ---------------------------------------------------------------------------

class VideoExportView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get_object(self, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(self.request, video)
        return video

    def get(self, request, pk):
        video = self.get_object(pk)
        
        # Query parameters to retrieve option-specific export job
        resolution = request.query_params.get("resolution")
        export_format = request.query_params.get("export_format")
        language = request.query_params.get("language")
        caption_mode = request.query_params.get("caption_mode")
        
        jobs = ExportJob.objects.filter(video=video)
        if resolution:
            jobs = jobs.filter(resolution=resolution)
        if export_format:
            jobs = jobs.filter(export_format=export_format)
        if language:
            jobs = jobs.filter(language=language)
        if caption_mode:
            jobs = jobs.filter(caption_mode=caption_mode)
            
        latest_job = jobs.order_by("-created_at").first()
        if not latest_job:
            return api_success(data=None, message="No matching export jobs found.")

        serializer = ExportJobSerializer(latest_job, context={"request": request})
        return api_success(data=serializer.data, message="Latest matching export job fetched.")

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
            status        = "processing"
        )

        # Offload slow render to our ThreadPool background runner
        run_in_background(export_video_with_captions, export_job)

        return api_success(
            data=ExportJobSerializer(export_job, context={"request": request}).data,
            message="Video export started in the background.",
            http_status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Export status poll (frontend polls this to show progress bar)
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
