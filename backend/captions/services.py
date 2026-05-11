import os
from moviepy.editor import VideoFileClip, TextClip, CompositeVideoClip
from django.conf import settings


def export_video_with_captions(export_job):
    video = export_job.video
    video_path = video.video_file.path

    captions = video.captions.all()

    output_dir = os.path.join(settings.MEDIA_ROOT, "exports")
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"video_{video.id}.mp4")

    clip = VideoFileClip(video_path)

    subtitle_clips = []

    for cap in captions:
        text = cap.translated_text if cap.translated_text else cap.original_text

        try:
            txt_clip = TextClip(
                text,
                fontsize=cap.font_size or 32,
                color=cap.font_color or "white",
                bg_color="black",
                method="caption",
                size=(clip.w - 100, None)
            )
        except Exception:
            # fallback अगर error आए
            txt_clip = TextClip(
                text,
                fontsize=32,
                color="white",
                method="caption",
                size=(clip.w - 100, None)
            )

        txt_clip = (
            txt_clip
            .set_start(cap.start_time)
            .set_end(cap.end_time)
            .set_position(("center", "bottom"))
        )

        subtitle_clips.append(txt_clip)

    # 🔥 IMPORTANT FIX
    final = CompositeVideoClip([clip] + subtitle_clips)

    final.write_videofile(
        output_path,
        codec="libx264",
        audio_codec="aac"
    )

    export_job.output_file.name = os.path.relpath(output_path, settings.MEDIA_ROOT)
    export_job.status = "completed"
    export_job.save()

    return output_path