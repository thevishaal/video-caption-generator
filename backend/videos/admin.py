from django.contrib import admin
from .models import Video, ExportJob


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "owner",
        "original_filename",
        "duration_seconds",
        "status",
        "created_at",
    )
    search_fields = ("original_filename", "owner__email")
    list_filter = ("status", "language", "created_at")


@admin.register(ExportJob)
class ExportJobAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "video",
        "requested_by",
        "export_format",
        "resolution",
        "status",
        "created_at",
    )
    list_filter = ("status", "export_format", "resolution", "created_at")
