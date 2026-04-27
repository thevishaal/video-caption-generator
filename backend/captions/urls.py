from django.urls import path
from .views import generate_captions, translate_captions, style_captions

urlpatterns = [
    path('generate', generate_captions),
    path('translate', translate_captions),
    path('style', style_captions),
]