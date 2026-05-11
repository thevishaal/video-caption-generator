from django.urls import path
from captions import views

urlpatterns = [
    # Caption generation & translation
    path("generate/", views.GenerateCaptionsView.as_view(), name="captions-generate"),
    path("translate", views.TranslateCaptionsView.as_view(), name="captions-translate"),
    path("style", views.CaptionStyleView.as_view(), name="captions-style"),

    # Caption CRUD
    path("", views.CaptionListView.as_view(), name="captions-list"),
    path("<uuid:pk>/", views.CaptionDetailView.as_view(), name="captions-detail"),

    # Export + SRT download (scoped under /api/captions/videos/<id>/...)
    path("videos/<uuid:video_id>/export", views.VideoCaptionExportView.as_view(), name="captions-export"),
    path("videos/<uuid:video_id>/download-srt", views.SRTDownloadView.as_view(), name="captions-download-srt"),
]