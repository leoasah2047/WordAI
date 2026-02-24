from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import List, Optional
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', case_sensitive=True)
    # API Settings
    APP_NAME: str = "Word-AI Consultant Backend"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security
    JWT_SECRET_KEY: str = "word-ai-super-secret-key-change-me"  # Should be set in env
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://localhost:5173",
        "https://localhost:5173"
    ]
    
    # Database
    DATABASE_URL: str = "sqlite:///./word_ai.db"
    
    # Redis for WebSockets & Rate Limiting
    REDIS_URL: Optional[str] = None
    
    # AI Services
    GOOGLE_API_KEY: Optional[str] = None
    
    # Vector DB (Qdrant)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "word-gpt-plus"
    
    # OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    MS_CLIENT_ID: Optional[str] = None
    MS_CLIENT_SECRET: Optional[str] = None
    
    # Logging
    LOG_LEVEL: str = "INFO"

    @model_validator(mode='after')
    def enforce_production_security(self) -> 'Settings':
        if not self.DEBUG:
            if self.JWT_SECRET_KEY == "word-ai-super-secret-key-change-me" or len(self.JWT_SECRET_KEY) < 32:
                raise ValueError("A strong JWT_SECRET_KEY must be provided in production (DEBUG=False).")
            if not self.REDIS_URL:
                 raise ValueError("REDIS_URL must be provided in production for WebSocket sync.")
            if "sqlite" in self.DATABASE_URL:
                 # This is a soft warning/check, but typically Postgres is preferred
                 pass
            for origin in self.ALLOWED_ORIGINS:
                if "localhost" in origin or "127.0.0.1" in origin:
                    raise ValueError(f"Localhost origins ({origin}) are not allowed in production (DEBUG=False).")
        return self

settings = Settings()
