import os
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
        owner         = self.context["request"].user

        video = Video.objects.create(
            owner             = owner,
            title             = validated_data.get("title", ""),
            original_file     = uploaded_file,
            original_filename = uploaded_file.name,
            file_size         = uploaded_file.size,
            language          = validated_data.get("language", "en"),
        )
        return video


class VideoPreviewSerializer(serializers.ModelSerializer):
    """Full detail serializer returned after upload and on preview fetch."""
    preview_url    = serializers.SerializerMethodField()
    audio_file_url = serializers.SerializerMethodField()
    captions       = serializers.SerializerMethodField()

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
            # audio_file_url lets the frontend (and captions app consumers)
            # confirm the audio was extracted and stored successfully.
            "audio_file_url",
            "captions",
            "created_at",
        ]

    def get_preview_url(self, obj):
        request = self.context.get("request")
        if not obj.original_file:
            return None
        url = obj.original_file.url
        return request.build_absolute_uri(url) if request else url

    def get_audio_file_url(self, obj):
        """
        Returns the absolute URL of the stored WAV audio file.
        None if audio extraction has not completed yet.
        The captions app uses video.audio_file.path internally —
        this URL is purely informational for the API consumer.
        """
        request = self.context.get("request")
        if not obj.audio_file:
            return None
        url = obj.audio_file.url
        return request.build_absolute_uri(url) if request else url

    def get_captions(self, obj):
        """
        Inline caption data for the preview screen.
        Lazy import avoids circular dependency with the captions app.
        Returns [] gracefully if the captions app is not installed or has no data yet.
        """
        try:
            from captions.serializers import CaptionSerializer
            caps = obj.captions.all().order_by("start_time")
            return CaptionSerializer(caps, many=True).data
        except Exception:
            return []


class ExportRequestSerializer(serializers.Serializer):
    export_format = serializers.CharField(default="mp4")
    resolution    = serializers.CharField(default="1280x720")
    language      = serializers.CharField(default="en")
    caption_mode  = serializers.ChoiceField(
        choices=["burned", "srt"],
        default="burned",
    )

    def validate_export_format(self, value):
        value = value.lower()
        if value not in SUPPORTED_EXPORT_FORMATS:
            raise serializers.ValidationError(
                f"Unsupported export format '{value}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXPORT_FORMATS))}"
            )
        return value

    def validate_resolution(self, value):
        if value not in SUPPORTED_RESOLUTIONS:
            raise serializers.ValidationError(
                f"Unsupported resolution '{value}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_RESOLUTIONS))}"
            )
        return value


class ExportJobSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    caption_mode = serializers.CharField(read_only=True)
    output_file_size = serializers.SerializerMethodField()

    class Meta:
        model = ExportJob
        fields = [
            "id",
            "video",
            "export_format",
            "resolution",
            "language",
            "caption_mode",
            "status",
            "error_message",
            "download_url",
            "output_file_size",
            "created_at",
        ]

    def get_download_url(self, obj):
        request = self.context.get("request")
        if not obj.output_file or obj.status != "completed":
            return None
        url = f"/api/videos/{obj.video_id}/download/"
        return request.build_absolute_uri(url) if request else url

    def get_output_file_size(self, obj):
        if obj.output_file and obj.status == "completed":
            try:
                # Direct filesystem path check first for absolute reliability
                if hasattr(obj.output_file, 'path') and os.path.exists(obj.output_file.path):
                    return os.path.getsize(obj.output_file.path)
                return obj.output_file.size
            except Exception:
                return None
        return None



