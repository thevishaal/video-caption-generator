from rest_framework import serializers

from .models import Video, ExportJob
from .utils import validate_video_file
from .constants import SUPPORTED_EXPORT_FORMATS, SUPPORTED_RESOLUTIONS


class VideoUploadSerializer(serializers.ModelSerializer):
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Video
        fields = ["id", "file", "title", "language"]
        read_only_fields = ["id"]

    def validate_file(self, value):
        validate_video_file(value)
        return value

    def create(self, validated_data):
        uploaded_file = validated_data.pop("file")
        owner = self.context["request"].user

        video = Video.objects.create(
            owner=owner,
            title=validated_data.get("title", ""),
            original_file=uploaded_file,
            original_filename=uploaded_file.name,
            file_size=uploaded_file.size,
            language=validated_data.get("language", "en"),
        )
        return video


class VideoListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing multiple videos."""

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "original_filename",
            "file_size",
            "duration_seconds",
            "language",
            "status",
            "created_at",
        ]


class VideoPreviewSerializer(serializers.ModelSerializer):
    """Full detail serializer with an absolute preview URL."""
    preview_url = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "original_filename",
            "file_size",
            "duration_seconds",
            "width",
            "height",
            "fps",
            "codec",
            "language",
            "status",
            "preview_url",
            "created_at",
        ]

    def get_preview_url(self, obj):
        request = self.context.get("request")
        if not obj.original_file:
            return None
        url = obj.original_file.url
        return request.build_absolute_uri(url) if request else url


class ExportRequestSerializer(serializers.Serializer):
    export_format = serializers.CharField(default="mp4")
    resolution = serializers.CharField(default="1280x720")
    language = serializers.CharField(default="en")

    def validate_export_format(self, value):
        value = value.lower()
        if value not in SUPPORTED_EXPORT_FORMATS:
            raise serializers.ValidationError(
                f"Unsupported export format '{value}'. "
                f"Supported: {', '.join(SUPPORTED_EXPORT_FORMATS)}"
            )
        return value

    def validate_resolution(self, value):
        if value not in SUPPORTED_RESOLUTIONS:
            raise serializers.ValidationError(
                f"Unsupported resolution '{value}'. "
                f"Supported: {', '.join(SUPPORTED_RESOLUTIONS)}"
            )
        return value


class ExportJobSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()

    class Meta:
        model = ExportJob
        fields = [
            "id",
            "video",
            "export_format",
            "resolution",
            "language",
            "status",
            "error_message",
            "download_url",
            "created_at",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        if not obj.output_file or obj.status != "completed":
            return None
        # Build the download URL using the video's pk
        url = f"/api/videos/{obj.video_id}/download/"
        return request.build_absolute_uri(url) if request else url