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


def api_success(data=None, message="Success", http_status=status.HTTP_200_OK):
    return Response(
        {
            "success": True,
            "data": data if data is not None else {},
            "message": message,
        },
        status=http_status,
    )


def api_error(message="Something went wrong", data=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response(
        {
            "success": False,
            "data": data if data is not None else {},
            "message": message,
        },
        status=http_status,
    )


class VideoUploadView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def post(self, request):
        serializer = VideoUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        video = serializer.save()

        try:
            populate_video_metadata(video)
        except Exception as exc:
            video.status = "uploaded"   # keep file, just metadata failed
            video.save(update_fields=["status", "updated_at"])

        response_data = VideoPreviewSerializer(video, context={"request": request}).data
        return api_success(
            data=response_data,
            message="Video uploaded successfully.",
            http_status=status.HTTP_201_CREATED,
        )


class VideoPreviewView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get_object(self, pk, user):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(self.request, video)
        return video

    def get(self, request, pk):
        video = self.get_object(pk, request.user)
        serializer = VideoPreviewSerializer(video, context={"request": request})
        return api_success(data=serializer.data, message="Video preview fetched successfully.")
    

class VideoExportView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get_object(self, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(self.request, video)
        return video

    def post(self, request, pk):
        if video.status != "ready":
            return api_error("Video not ready for export", http_status=400)
        
        video = self.get_object(pk)

        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        export_job = ExportJob.objects.create(
            video=video,
            requested_by=request.user,
            export_format=serializer.validated_data["export_format"],
            resolution=serializer.validated_data["resolution"],
            language=serializer.validated_data["language"],
        )

        try:
            export_video_with_captions(export_job)
        except Exception as exc:
            export_job.refresh_from_db()
            data = ExportJobSerializer(export_job, context={"request": request}).data
            return api_error(
                message=f"Export failed: {str(exc)}",
                data=data,
                http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        data = ExportJobSerializer(export_job, context={"request": request}).data
        return api_success(data=data, message="Video exported successfully.")


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