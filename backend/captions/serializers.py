from rest_framework import serializers
from .models import Video, Caption, ExportJob


# 🎥 Video Upload
class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'video_file']


# 🎥 Video Preview
class VideoPreviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = ['id', 'video_file', 'transcript', 'status']


#  Caption Serializer 
class CaptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Caption
        fields = '__all__'


# 🎬 Export Request
class ExportRequestSerializer(serializers.Serializer):
    export_format = serializers.CharField()
    resolution = serializers.CharField()
    language = serializers.CharField()


# 🎬 Export Job Response
class ExportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExportJob
        fields = '__all__'