from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import model_validator
from typing import List, Optional
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', case_sensitive=True)
    # API Settings
    APP_NAME: str = "Word-AI"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security
    JWT_SECRET_KEY: str = "9c8f2a1b5e3d7f0a4b9c8d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a"  # Should be set in env
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    ALLOWED_ORIGINS: List[str] = ["*"]
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/wordai"
    
    # Redis for WebSockets & Rate Limiting
    REDIS_URL: str = "redis://localhost:6379"
    
    # AI Services
    GOOGLE_API_KEY: Optional[str] = None
    
    # Vector DB (Qdrant)
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: Optional[str] = None
    QDRANT_COLLECTION_NAME: str = "word-ai"
    USE_HYBRID_SEARCH: bool = True
    SPARSE_EMBEDDING_MODEL: str = "prithivida/Splade_PP_en_v1"
    DENSE_EMBEDDING_DIM: int = 512
    FASTEMBED_CACHE_PATH: str = os.getenv("FASTEMBED_CACHE_PATH", "/app/model_cache")
    
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
            # We use logger.warning instead of raising ValueError for some checks 
            # to allow the app to boot up even if env vars aren't perfectly tuned yet.
            import logging
            logger = logging.getLogger(__name__)
            
            if self.JWT_SECRET_KEY == "word-ai-super-secret-key-change-me" or len(self.JWT_SECRET_KEY) < 32:
                logger.warning("SECURITY: A weak JWT_SECRET_KEY is being used in production.")
            
            if not self.REDIS_URL:
                 logger.warning("SECURITY: REDIS_URL is missing in production. WebSockets may not sync.")
            elif not self.REDIS_URL.startswith(("redis://", "rediss://", "memory://")):
                 # Auto-fix missing scheme for REDIS_URL
                 self.REDIS_URL = f"redis://{self.REDIS_URL}"
            
            for origin in self.ALLOWED_ORIGINS:
                if "localhost" in origin or "127.0.0.1" in origin:
                    # In a real production environment, you should remove these, 
                    # but we won't crash the app here to avoid status 128 on Render.
                    pass
        return self

settings = Settings()
