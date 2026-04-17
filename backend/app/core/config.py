import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./auction.db")
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
MIN_BID_INCREMENT = int(os.getenv("MIN_BID_INCREMENT", "10000"))
MAX_ARTWORKS = int(os.getenv("MAX_ARTWORKS", "15"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com").strip().lower()
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "change-me")

# Security Hardening
ALLOWED_ORIGINS = [
    origin.strip() 
    for origin in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
]

# Production Safety Check
ENV = os.getenv("ENV", "development").lower()
if ENV == "production" and SECRET_KEY == "change-me-in-production":
    raise RuntimeError("CRITICAL SECURITY ERROR: SECRET_KEY must be changed from the default value in production.")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
EMAIL_FROM = os.getenv("EMAIL_FROM", "onboarding@resend.dev")
HUNTER_API_KEY = os.getenv("HUNTER_API_KEY", "")
HUNTER_EMAIL_VERIFY_URL = os.getenv("HUNTER_EMAIL_VERIFY_URL", "https://api.hunter.io/v2/email-verifier")


def access_token_expiry_delta() -> timedelta:
    return timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
