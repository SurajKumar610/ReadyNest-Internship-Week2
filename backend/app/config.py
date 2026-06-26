import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "Sightfill"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "SUPER_SECRET_SECURITY_KEY_PLEASE_CHANGE_IN_PRODUCTION")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # DB & Cache
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sightfill.db")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    
    # Email SMTP configuration
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "noreply@sightfill.com")
    
    # Resend configuration
    RESEND_API_KEY: str = os.getenv("RESEND_API_KEY", "")

    # Quick Demo Login settings
    ALLOW_DEMO_LOGIN: bool = os.getenv("ALLOW_DEMO_LOGIN", "True").lower() in ("true", "1", "yes")
    DEMO_EMAIL: str = os.getenv("DEMO_EMAIL", "demo@sightfill.com")

settings = Settings()
