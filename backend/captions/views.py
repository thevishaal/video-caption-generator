from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import Video, ExportJob, Caption
from .permissions import IsVideoOwner
from .serializers import (
    VideoUploadSerializer,
    VideoPreviewSerializer,
    ExportRequestSerializer,
    ExportJobSerializer,
    CaptionSerializer,
)
from .services import populate_video_metadata, export_video_with_captions


#  Common Response
def api_success(data=None, message="Success", http_status=status.HTTP_200_OK):
    return Response({
        "success": True,
        "data": data if data else {},
        "message": message
    }, status=http_status)


def api_error(message="Error", data=None, http_status=status.HTTP_400_BAD_REQUEST):
    return Response({
        "success": False,
        "data": data if data else {},
        "message": message
    }, status=http_status)


#  Upload Video
class VideoUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = VideoUploadSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        video = serializer.save(owner=request.user)

        try:
            populate_video_metadata(video)
        except Exception:
            video.status = "uploaded"
            video.save()

        data = VideoPreviewSerializer(video).data
        return api_success(data, "Video uploaded successfully", status.HTTP_201_CREATED)


#  Preview Video
class VideoPreviewView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(request, video)

        data = VideoPreviewSerializer(video).data
        return api_success(data, "Video fetched successfully")


#  Create Caption 
class CaptionCreateView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def post(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(request, video)

        serializer = CaptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        serializer.save(video=video)

        return api_success(serializer.data, "Caption added successfully")


#  Get Captions
class CaptionListView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(request, video)

        captions = video.captions.all()
        data = CaptionSerializer(captions, many=True).data

        return api_success(data, "Captions fetched")


#  Export Video
class VideoExportView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def post(self, request, pk):
        video = get_object_or_404(Video, pk=pk)
        self.check_object_permissions(request, video)

        if video.status != "ready":
            return api_error("Video not ready", http_status=400)

        serializer = ExportRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        export_job = ExportJob.objects.create(
            video=video,
            requested_by=request.user,
            export_format=serializer.validated_data["export_format"],
            resolution=serializer.validated_data["resolution"],
            language=serializer.validated_data["language"],
            status="processing"
        )

        try:
            #  MAIN FUNCTION (तुम्हारा काम)
            export_video_with_captions(export_job)
        except Exception as e:
            export_job.status = "failed"
            export_job.save()
            return api_error(str(e), http_status=500)

        data = ExportJobSerializer(export_job).data
        return api_success(data, "Video exported successfully")


# ⬇Download Video
class VideoDownloadView(APIView):
    permission_classes = [IsAuthenticated, IsVideoOwner]

    def get(self, request, pk):
        job = ExportJob.objects.filter(
            video_id=pk,
            requested_by=request.user,
            status="completed"
        ).last()

        if not job or not job.output_file:
            raise Http404("File not found")

        return FileResponse(
            job.output_file.open("rb"),
            as_attachment=True,
            filename=job.output_file.name.split("/")[-1]
        )