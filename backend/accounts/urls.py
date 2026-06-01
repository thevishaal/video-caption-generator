from django.urls import path
from . import views

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("verify-email/<str:token>/", views.VerifyEmailView.as_view(), name="verify-email"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("refresh-token/", views.RefreshTokenView.as_view(), name="refresh-token"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("change-password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("forgot-password/", views.ForgotPasswordView.as_view(), name="forgot-password"),
    path("reset-password/<str:token>/", views.ResetPasswordView.as_view(), name="reset-password"),
    path("resend-verification-email/", views.ResendVerificationEmailView.as_view(), name="resend-verification-email"),
    path("profile/update/", views.ProfileUpdateView.as_view(), name="profile-update"),
]
