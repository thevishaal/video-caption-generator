from django.urls import path

from .views import (
    VideoUploadView,
    VideoPreviewView,
    VideoExportView,
    VideoDownloadView,
)

urlpatterns = [
    path("upload/", VideoUploadView.as_view(), name="video-upload"),
    path("<uuid:pk>/preview/", VideoPreviewView.as_view(), name="video-preview"),
    path("<uuid:pk>/export/", VideoExportView.as_view(), name="video-export"),
    path("<uuid:pk>/download/", VideoDownloadView.as_view(), name="video-download"),
]
