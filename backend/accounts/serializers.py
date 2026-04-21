from rest_framework import serializers
from .models import User
import secrets, hashlib
from .utils import generate_token, async_task, send_verification_email
from datetime import datetime, timedelta
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.conf import settings


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')

        user = User(**validated_data)
        user.set_password(password)
        
        raw_token, hashed_token = generate_token()
        user.verification_token = hashed_token
        user.verification_token_expiry = datetime.now() + timedelta(minutes=10)
        user.save()

        # send email for verification
        verification_link = f"{settings.FRONTEND_URL}/verify-email/{raw_token}"
        async_task(send_verification_email, user.email, verification_link)
        print(f"Verification token for {user.email}: {raw_token}")
        return user

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        user = authenticate(email=email, password=password)

        if not user:
            raise serializers.ValidationError("Invalid email or password.")
        
        if not user.is_verified:
            raise serializers.ValidationError("Email not verified. Please check your inbox.")
        
        refresh = RefreshToken.for_user(user)
        user.refresh_token = hashlib.sha256(str(refresh).encode()).hexdigest()
        user.save()

        return {
            'refresh_token': str(refresh),
            'access_token': str(refresh.access_token),
            'user': {
                'id': user.id,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'email': user.email
            }
        }
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email']


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()

class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True)

    