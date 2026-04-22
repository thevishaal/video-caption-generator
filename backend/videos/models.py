import os
import uuid
from django.conf import settings
from django.db import models
from django.utils.text import slugify

from .constants import (
    VIDEO_STATUS_UPLOADED,
    VIDEO_STATUS_PROCESSING,
    VIDEO_STATUS_READY,
    VIDEO_STATUS_FAILED,
    EXPORT_STATUS_PENDING,
    EXPORT_STATUS_PROCESSING,
    EXPORT_STATUS_COMPLETED,
    EXPORT_STATUS_FAILED,
)


def upload_video_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower()
    safe_name = slugify(os.path.splitext(filename)[0]) or "video"
    return f"videos/uploads/{instance.owner_id}/{uuid.uuid4()}_{safe_name}{ext}"


def export_video_path(instance, filename):
    ext = os.path.splitext(filename)[1].lower() or ".mp4"
    return f"videos/exports/{instance.video.owner_id}/{uuid.uuid4()}{ext}"


class TimeStampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Video(TimeStampedModel):
    STATUS_CHOICES = [
        (VIDEO_STATUS_UPLOADED, "Uploaded"),
        (VIDEO_STATUS_PROCESSING, "Processing"),
        (VIDEO_STATUS_READY, "Ready"),
        (VIDEO_STATUS_FAILED, "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="videos",
    )
    title = models.CharField(max_length=255, blank=True)
    original_file = models.FileField(upload_to=upload_video_path)
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    duration_seconds = models.FloatField(default=0.0)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    fps = models.FloatField(null=True, blank=True)
    codec = models.CharField(max_length=100, blank=True)
    language = models.CharField(max_length=20, default="en")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=VIDEO_STATUS_UPLOADED)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.original_filename} ({self.owner})"


class ExportJob(TimeStampedModel):
    STATUS_CHOICES = [
        (EXPORT_STATUS_PENDING, "Pending"),
        (EXPORT_STATUS_PROCESSING, "Processing"),
        (EXPORT_STATUS_COMPLETED, "Completed"),
        (EXPORT_STATUS_FAILED, "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="export_jobs")
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="requested_exports",
    )
    export_format = models.CharField(max_length=20, default="mp4")
    resolution = models.CharField(max_length=20, default="1280x720")
    language = models.CharField(max_length=20, default="en")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=EXPORT_STATUS_PENDING)
    output_file = models.FileField(upload_to=export_video_path, null=True, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"ExportJob({self.video_id}, {self.status})"