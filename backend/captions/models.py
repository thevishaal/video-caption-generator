import uuid
from django.db import models
from django.conf import settings


class Caption(models.Model):
    POSITION_CHOICES = [
        ("top-left", "Top Left"),
        ("top-center", "Top Center"),
        ("top-right", "Top Right"),
        ("bottom-left", "Bottom Left"),
        ("bottom-center", "Bottom Center"),
        ("bottom-right", "Bottom Right"),
    ]
    ALIGNMENT_CHOICES = [("left", "Left"), ("center", "Center"), ("right", "Right")]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # videos.Video uses UUIDField as PK — FK must reference it by to_field="id"
    video = models.ForeignKey(
        "videos.Video",
        on_delete=models.CASCADE,
        related_name="captions",
        to_field="id",
    )
    start_time = models.FloatField()
    end_time = models.FloatField()
    original_text = models.TextField()
    translated_text = models.TextField(blank=True, default="")
    language = models.CharField(max_length=10, default="en")

    # Style fields
    font_family = models.CharField(max_length=100, default="Montserrat")
    font_size = models.IntegerField(default=32)
    font_color = models.CharField(max_length=20, default="#FFFFFF")
    background_color = models.CharField(max_length=50, default="rgba(0,0,0,0.6)")
    position = models.CharField(max_length=20, choices=POSITION_CHOICES, default="bottom-center")
    alignment = models.CharField(max_length=10, choices=ALIGNMENT_CHOICES, default="center")
    bold = models.BooleanField(default=False)
    italic = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["start_time"]

    def __str__(self):
        return f"[{self.start_time:.2f}-{self.end_time:.2f}] {self.original_text[:40]}"
