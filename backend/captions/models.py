from django.db import models
from django.contrib.auth.models import User


# 🎥 Video Model
class Video(models.Model):
    STATUS_CHOICES = [
        ('uploaded', 'Uploaded'),
        ('processing', 'Processing'),
        ('ready', 'Ready'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE)
    video_file = models.FileField(upload_to='videos/')
    transcript = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Video {self.id}"


# 📝 Caption Model (🔥 तुम्हारा main task)
class Caption(models.Model):
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name="captions")

    start_time = models.FloatField()
    end_time = models.FloatField()

    original_text = models.TextField()
    translated_text = models.TextField(blank=True)

    language = models.CharField(max_length=10, default="en")

    font_family = models.CharField(max_length=50, default="Arial")
    font_size = models.IntegerField(default=32)
    font_color = models.CharField(max_length=20, default="#FFFFFF")
    background_color = models.CharField(max_length=30, default="rgba(0,0,0,0.6)")
    position = models.CharField(max_length=20, default="bottom-center")

    def __str__(self):
        return f"Caption {self.id} (Video {self.video.id})"


# 🎬 Export Job Model
class ExportJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]

    video = models.ForeignKey(Video, on_delete=models.CASCADE)
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE)

    export_format = models.CharField(max_length=10, default='mp4')
    resolution = models.CharField(max_length=20, default='720p')
    language = models.CharField(max_length=10, default='en')

    output_file = models.FileField(upload_to='exports/', null=True, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"ExportJob {self.id} - {self.status}"