from django.urls import path

from .views import (
    VideoListView,
    VideoUploadView,
    VideoPreviewView,
    VideoExportView,
    VideoExportStatusView,
    VideoDownloadView,
)

urlpatterns = [
    path("", VideoListView.as_view(), name="video-list"),
    path("upload/", VideoUploadView.as_view(), name="video-upload"),
    path("<uuid:pk>/preview/", VideoPreviewView.as_view(), name="video-preview"),
    path("<uuid:pk>/export/", VideoExportView.as_view(), name="video-export"),
    path("<uuid:pk>/export/<uuid:export_id>/status/", VideoExportStatusView.as_view(), name="video-export-status"),
    path("<uuid:pk>/download/", VideoDownloadView.as_view(), name="video-download"),
]
