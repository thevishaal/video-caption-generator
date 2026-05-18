from rest_framework.permissions import BasePermission


class IsVideoOwner(BasePermission):
    def has_object_permission(self, request, view, obj):
        owner = getattr(obj, "owner", None)
        if owner is not None:
            return owner == request.user

        video = getattr(obj, "video", None)
        if video is not None:
            return video.owner == request.user

        return False
    