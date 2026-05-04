from rest_framework.views import APIView
from rest_framework.response import Response
from .serializers import RegisterSerializer, LoginSerializer, UserSerializer, ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer
from rest_framework import status
import hashlib
from .models import User
from django.utils import timezone
from datetime import timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from .utils import generate_token
from django.conf import settings
from .utils import async_task, send_password_reset_email, send_verification_email



class Home(APIView):
    def get(self, request):
        return Response({
            "success": True,
            "message": "Welcome to the Video Caption Generator API!"
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "User registered successfully. Please check your email for verification.",
                "data": serializer.validated_data
            }, status=status.HTTP_201_CREATED)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    def get(self, request, token):
        if not token:
            return Response({
                "success": False,
                "message": "Verification token is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        hashed_token = hashlib.sha256(token.encode()).hexdigest()

        try:
            user = User.objects.get(verification_token=hashed_token)

            if user.verification_token_expiry < timezone.now():
                return Response({
                    "success": False,
                    "message": "Verification token has expired."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if user.is_verified:
                return Response({
                    "success": False,
                    "message": "Email is already verified."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_verified = True
            user.is_active = True
            user.verification_token = None
            user.verification_token_expiry = None
            user.save()

            return Response({
                "success": True,
                "message": "Email verified successfully. You can now log in."
            }, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({
                "success": False,
                "message": "Invalid verification token."
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationEmailView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({
                "success": False,
                "message": "Email is required."
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)

            if user.is_verified:
                return Response({
                    "success": False,
                    "message": "Email is already verified."
                }, status=status.HTTP_400_BAD_REQUEST)

            raw_token, hashed_token = generate_token()
            user.verification_token = hashed_token
            user.verification_token_expiry = timezone.now() + timedelta(minutes=10)
            user.save()

            verification_link = f"{settings.FRONTEND_URL}/verify-email/{raw_token}"
            async_task(send_verification_email, user.email, verification_link)  

            print(f"Verification token for {user.email}: {raw_token}")

            return Response({
                "success": True,
                "message": "Verification email resent. Please check your inbox."
            }, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({
                "success": False,
                "message": "No user found with this email."
            }, status=status.HTTP_404_NOT_FOUND)
     



class LoginView(APIView):
    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():
            return Response({
                "success": True,
                "message": "Login successful.",
                "data": serializer.validated_data
            }, status=status.HTTP_200_OK)
        
        print("VALIDATION ERRORS:", serializer.errors)
        return Response({
            "success": False,   
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    

class RefreshTokenView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            return Response({
                "success": False,
                "message": "Refresh token is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        hashed_token = hashlib.sha256(refresh_token.encode()).hexdigest()

        try:
            user = User.objects.get(refresh_token=hashed_token)

            refresh = RefreshToken.for_user(user)
            new_access_token = str(refresh.access_token)

            user.refresh_token = hashlib.sha256(str(refresh).encode()).hexdigest()
            user.save()

            return Response({
                "success": True,
                "data": {
                    "access_token": new_access_token,
                    "refresh_token": str(refresh),
                    "user": {
                        "id": user.id,
                        "first_name": user.first_name,
                        "last_name": user.last_name,
                        "email": user.email
                    }
                }
            }, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({
                "success": False,
                "message": "Invalid refresh token."
            }, status=status.HTTP_400_BAD_REQUEST)
        

class LogoutView(APIView):
    permission_classes = [AllowAny] 
    def post(self, request):
        refresh_token = request.data.get("refresh_token")

        if not refresh_token:
            return Response({
                "success": False,
                "message": "Refresh token is required."
            }, status=status.HTTP_400_BAD_REQUEST)
        
        hashed_token = hashlib.sha256(refresh_token.encode()).hexdigest()

        try:
            user = User.objects.get(refresh_token=hashed_token)
            user.refresh_token = None
            user.save()
            return Response({
                "success": True,
                "message": "Logged out successfully."
            }, status=status.HTTP_200_OK)
        
        except User.DoesNotExist:
            return Response({
                "success": False,
                "message": "Invalid refresh token."
            }, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user

        if not user.is_verified:
            return Response({
                "success": False,
                "message": "Email not verified. Please check your inbox."
            }, status=status.HTTP_403_FORBIDDEN)

        serializer = UserSerializer(user)
        return Response({
            "success": True,
            "data": serializer.data
        }, status=status.HTTP_200_OK)
    


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        serializer = ChangePasswordSerializer(data=request.data)

        if serializer.is_valid():
            current_password = serializer.validated_data.get("current_password")

            if not user.check_password(current_password):
                return Response({
                    "success": False,
                    "message": "Current password is incorrect."
                }, status=status.HTTP_400_BAD_REQUEST)
            
            new_password = serializer.validated_data.get("new_password")
            user.set_password(new_password)
            user.save()
            return Response({
                "success": True,
                "message": "Password changed successfully."
            }, status=status.HTTP_200_OK)
        
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    

class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)

        if serializer.is_valid():
            email = serializer.validated_data.get("email")

            try:
                user = User.objects.get(email=email)

                raw_token, hashed_token = generate_token()

                user.reset_password_token = hashed_token
                user.reset_password_token_expiry = timezone.now() + timedelta(hours=1)

                user.save()

                reset_link = f"{settings.FRONTEND_URL}/reset-password/{raw_token}"
                async_task(send_password_reset_email, user.email, reset_link)
                print(f"Password reset token for {user.email}: {raw_token}")

                return Response({
                    "success": True,
                    "message": "Password reset token generated. Please check your email."
                }, status=status.HTTP_200_OK)

            except User.DoesNotExist:
                return Response({
                    "success": False,
                    "message": "No user found with this email."
                }, status=status.HTTP_404_NOT_FOUND)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
class ResetPasswordView(APIView):
    def post(self, request, token):
        serializer = ResetPasswordSerializer(data=request.data)

        if serializer.is_valid():
            new_password = serializer.validated_data.get("new_password")
            hashed_token = hashlib.sha256(token.encode()).hexdigest()

            try:
                user = User.objects.get(reset_password_token=hashed_token)

                if user.reset_password_token_expiry < timezone.now():
                    return Response({
                        "success": False,
                        "message": "Reset token has expired."
                    }, status=400)

                user.set_password(new_password)
                user.reset_password_token = None
                user.reset_password_token_expiry = None
                user.save()

                return Response({
                    "success": True,
                    "message": "Password reset successfully."
                })

            except User.DoesNotExist:
                return Response({
                    "success": False,
                    "message": "Invalid reset token."
                }, status=400)

        print("ERRORS:", serializer.errors)  # 👈 debug
        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=400)



