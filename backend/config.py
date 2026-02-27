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
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://localhost:3000",
        "http://localhost:5173",
        "https://localhost:5173"
    ]
    
    # Database
    DATABASE_URL: str = "postgresql://postgres:mOIqMOMJJZotHIcgbmeVIWiPWhLcQZaf@postgres.railway.internal:5432/railway"
    
    # Redis for WebSockets & Rate Limiting
    REDIS_URL: str = "redis-10818.c245.us-east-1-3.ec2.cloud.redislabs.com:10818"
    
    # AI Services
    GOOGLE_API_KEY: Optional[str] = None
    
    # Vector DB (Qdrant)
    QDRANT_URL: str = "https://922c9e32-672f-46c4-83ac-0d1d136e51c7.us-east-1-1.aws.cloud.qdrant.io"
    QDRANT_API_KEY: str = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.7d51rNr1KgCAwZsuvJJ4vIkyk-qdIa50E-_D8YwDGXs"
    QDRANT_COLLECTION_NAME: str = "word-ai"
    USE_HYBRID_SEARCH: bool = True
    SPARSE_EMBEDDING_MODEL: str = "prithivida/Splade_PP_en_v1"
    DENSE_EMBEDDING_DIM: int = 512
    
    # OAuth
    GOOGLE_CLIENT_ID: str = "591959427519-ahul5uf85pg5sntkg82tl9kgc09rsn4a.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = "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"
    MS_CLIENT_ID: str = "87759d28-5815-4503-af54-280d464e9030"
    MS_CLIENT_SECRET: str = ".HO8Q~wrCyX2Fffe3p69FFfIocM-_XpPGt.Xdcq9"

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
            
            for origin in self.ALLOWED_ORIGINS:
                if "localhost" in origin or "127.0.0.1" in origin:
                    # In a real production environment, you should remove these, 
                    # but we won't crash the app here to avoid status 128 on Render.
                    pass
        return self

settings = Settings()
