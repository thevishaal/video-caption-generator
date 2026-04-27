from django.urls import path

from .views import (
    VideoUploadView,
    VideoPreviewView,
    CaptionCreateView,
    CaptionListView,
    VideoExportView,
    VideoDownloadView,
)

urlpatterns = [
    #  Video APIs
    path('videos/upload/', VideoUploadView.as_view(), name='video-upload'),
    path('videos/<int:pk>/', VideoPreviewView.as_view(), name='video-preview'),

    # Caption APIs
    path('videos/<int:pk>/captions/', CaptionCreateView.as_view(), name='caption-create'),
    path('videos/<int:pk>/captions/list/', CaptionListView.as_view(), name='caption-list'),

    #  Export APIs 
    path('videos/<int:pk>/export/', VideoExportView.as_view(), name='video-export'),
    path('videos/<int:pk>/download/', VideoDownloadView.as_view(), name='video-download'),
]