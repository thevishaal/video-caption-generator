from pathlib import Path

ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".mov", ".mkv", ".webm"}
ALLOWED_CONTENT_TYPES = {
    "video/mp4",
    "video/quicktime",
    "video/x-matroska",
    "video/webm",
}

MAX_VIDEO_SIZE_MB = 200
MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024

VIDEO_UPLOAD_DIR = "videos/uploads/"
VIDEO_EXPORT_DIR = "videos/exports/"
VIDEO_TEMP_DIR = "videos/temp/"

DEFAULT_EXPORT_FORMAT = "mp4"
DEFAULT_RESOLUTION = "1280x720"

EXPORT_STATUS_PENDING = "pending"
EXPORT_STATUS_PROCESSING = "processing"
EXPORT_STATUS_COMPLETED = "completed"
EXPORT_STATUS_FAILED = "failed"

VIDEO_STATUS_UPLOADED = "uploaded"
VIDEO_STATUS_PROCESSING = "processing"
VIDEO_STATUS_READY = "ready"
VIDEO_STATUS_FAILED = "failed"

SUPPORTED_EXPORT_FORMATS = {"mp4"}
SUPPORTED_RESOLUTIONS = {"1280x720", "1920x1080", "854x480"}