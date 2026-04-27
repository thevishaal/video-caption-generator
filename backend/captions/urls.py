from django.urls import path
from .views import VideoProcessView, TranslateView, SubtitleView

urlpatterns = [
    path('process/', VideoProcessView.as_view()),
    path('translate/', TranslateView.as_view()),
    path('subtitle/<int:pk>/', SubtitleView.as_view()),
]