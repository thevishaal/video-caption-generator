from rest_framework import serializers
from .models import Caption


class CaptionSerializer(serializers.ModelSerializer):
    """Used by VideoPreviewSerializer.get_captions() and all caption APIs."""
    
    # Explicitly declared to enforce validation rules at the API boundary
    is_caps = serializers.BooleanField(required=False, default=False)
    bg_opacity = serializers.IntegerField(min_value=0, max_value=100, required=False)

    class Meta:
        model = Caption
        fields = [
            "id", "video", "start_time", "end_time",
            "original_text", "translated_text", "language",
            "font_family", "font_size", "font_color", "background_color",
            "position", "alignment", "bold", "italic",
            "is_caps", "bg_opacity",  # <-- New styling fields added safely
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class GenerateCaptionsSerializer(serializers.Serializer):
    video_id = serializers.UUIDField()
    language = serializers.CharField(max_length=10, default="en")


class TranslateCaptionsSerializer(serializers.Serializer):
    video_id = serializers.UUIDField()
    target_language = serializers.CharField(max_length=10)
    caption_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False,
        help_text="Omit to translate all captions for the video."
    )


class CaptionStyleSerializer(serializers.Serializer):
    video_id = serializers.UUIDField(required=False)
    caption_ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    font_family = serializers.CharField(max_length=100, required=False)
    font_size = serializers.IntegerField(min_value=8, max_value=200, required=False)
    font_color = serializers.CharField(max_length=20, required=False)
    background_color = serializers.CharField(max_length=50, required=False)
    position = serializers.ChoiceField(
        choices=["top-left", "top-center", "top-right", "bottom-left", "bottom-center", "bottom-right"],
        required=False,
    )
    alignment = serializers.ChoiceField(choices=["left", "center", "right"], required=False)
    bold = serializers.BooleanField(required=False)
    italic = serializers.BooleanField(required=False)
    
    # --- NEW FIELDS ---
    is_caps = serializers.BooleanField(required=False, default=False)
    bg_opacity = serializers.IntegerField(min_value=0, max_value=100, required=False)