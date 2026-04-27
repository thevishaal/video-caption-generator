from rest_framework import serializers
from .models import Caption
from .models import Video

class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'video_file']

class TranslateSerializer(serializers.Serializer):
    text = serializers.CharField()
    language = serializers.CharField()

class CaptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caption
        fields = '__all__'