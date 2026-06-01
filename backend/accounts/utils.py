import logging
import secrets
import hashlib
import threading
from django.conf import settings
from django.core.mail import send_mail
import requests

logger = logging.getLogger(__name__)



def generate_token():
    raw_token = secrets.token_hex(32)  # 64-char random token
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
    return raw_token, hashed_token


def async_task(func, *args, **kwargs):
    thread = threading.Thread(target=func, args=args, kwargs=kwargs)
    thread.daemon = True 
    thread.start()

def send_verification_email(email, verification_link):
    url = "https://api.brevo.com/v3/smtp/email"

    payload = {
        "sender": {
            "name": settings.DOMAIN_NAME,
            "email": settings.DEFAULT_FROM_EMAIL
        },
        "to": [{"email": email}],
        "subject": "Verify Your Email Address",
        "htmlContent": f"""
            <h2>Email Verification</h2>
            <p>Click below to verify your account:</p>
            <a href="{verification_link}">Verify Email</a>
        """
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": settings.BREVO_API_KEY
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 201:
        logger.info("Verification email sent successfully.")
    else:
        logger.error(f"Verification email failed: {response.text}")

def send_password_reset_email(email, reset_link):
    url = "https://api.brevo.com/v3/smtp/email"

    payload = {
        "sender": {
            "name": settings.DOMAIN_NAME,
            "email": settings.DEFAULT_FROM_EMAIL
        },
        "to": [{"email": email}],
        "subject": "Password Reset Request",
        "htmlContent": f"""
            <h2>Password Reset</h2>
            <p>Click below to reset your password:</p>
            <a href="{reset_link}">Reset Password</a>
        """
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": settings.BREVO_API_KEY
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 201:
        logger.info("Password reset email sent successfully.")
    else:
        logger.error(f"Password reset email failed: {response.text}")