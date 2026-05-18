from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    # App
    ENVIRONMENT: str = "development"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "")

    # CORS — comma-separated list of allowed origins
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Database
    DATABASE_URL: str = ""

    # Redis
    REDIS_URL: str = ""

    SUPABASE_URL: str = ""

    @property
    def db_url(self) -> str:
        return self.DATABASE_URL or self.SUPABASE_URL

    # Google Auth & External URLs
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = ""
    FRONTEND_URL: str = ""
    GOOGLE_AUTH_URL: str = ""
    GOOGLE_TOKEN_URL: str = ""
    GOOGLE_USERINFO_URL: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

settings = Settings()
