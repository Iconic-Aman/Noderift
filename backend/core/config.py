from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv())

from cryptography.fernet import Fernet
from pathlib import Path

def get_or_create_secret_key() -> str:
    key_file = Path(".noderift_secret")
    
    # Check env var first
    env_key = os.getenv("SECRET_KEY")
    if env_key:
        return env_key
        
    # Check persisted file second
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
    SECRET_KEY: str = get_or_create_secret_key()

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
    OPENROUTER_MODEL: str = "cohere/north-mini-code:free"
    OPENROUTER_CHAT_MODEL: str = "openrouter/free"
    OPENROUTER_API_URL: str = "https://openrouter.ai/api/v1"




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

    model_config = SettingsConfigDict(
        env_file=find_dotenv() or ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
