from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional, Any
import os, base64, hashlib
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

from cryptography.fernet import Fernet
from pathlib import Path

def get_or_create_secret_key() -> str:
    key_file = Path(".noderift_secret")
    
    # Check persisted file first
    if key_file.exists():
        try:
            val = key_file.read_text().strip()
            # Verify if it is a valid Fernet key
            Fernet(val.encode())
            return val
        except Exception:
            pass
            
    # Generate and persist new valid Fernet key
    new_key = Fernet.generate_key().decode()
    try:
        key_file.write_text(new_key)
    except Exception:
        pass
    return new_key

class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = ""

    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def validate_secret_key(cls, v: Any) -> str:
        s = (str(v) if v is not None else "").strip()
        if not s:
            return get_or_create_secret_key()
        try:
            Fernet(s.encode())
            return s
        except Exception:
            return base64.urlsafe_b64encode(hashlib.sha256(s.encode()).digest()).decode()

    # CORS — comma-separated list of allowed origins
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    DATABASE_URL: str = ""

    # NVIDIA LLM Config
    NVIDIA_API_KEY: str = ""
    NVIDIA_API_URL: str = ""
    LLM_MODEL: str = ""
    EMBEDDING_MODEL: str = ""

    # OpenRouter Config
    OPENROUTER_API_KEY: str = ""
    OPENROUTER_MODEL: str = "meta-llama/llama-3.3-70b-instruct"
    OPENROUTER_MODEL1: str = ""
    OPENROUTER_MODEL2: str = ""
    OPENROUTER_MODEL3: str = ""
    OPENROUTER_CHAT_MODEL: str = "meta-llama/llama-3.3-70b-instruct"
    OPENROUTER_API_URL: str = "https://openrouter.ai/api/v1"

    # Groq Config
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = ""




    # Redis
    REDIS_URL: str = ""

    # Resend (feedback emails)
    RESEND_API_KEY: str = ""
    FEEDBACK_TO_EMAIL: str = ""

    @property
    def db_url(self) -> str:
        return self.DATABASE_URL

    # Google Auth & External URLs
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    GOOGLE_GMAIL_REDIRECT_URI: str = ""
    FRONTEND_URL: str = ""
    GOOGLE_AUTH_URL: str = ""
    GOOGLE_TOKEN_URL: str = ""
    GOOGLE_USERINFO_URL: str = ""

    # Slack OAuth Config
    SLACK_CLIENT_ID: str = ""
    SLACK_CLIENT_SECRET: str = ""
    SLACK_REDIRECT_URI: str = ""
    SLACK_AUTH_URL: str = "https://slack.com/oauth/v2/authorize"
    SLACK_TOKEN_URL: str = "https://slack.com/api/oauth.v2.access"

    model_config = SettingsConfigDict(
        env_file=find_dotenv() or ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
