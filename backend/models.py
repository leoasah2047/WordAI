from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Float, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    provider = Column(String, nullable=False)  # 'google' or 'microsoft'
    provider_id = Column(String, unique=True, index=True, nullable=False)
    
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    tasks = relationship("TaskModel", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    identity = Column(String)  # Professional Writer, Student, etc.
    default_context = Column(JSON)  # { "tone": "Formal", "etc": "..." }
    nexus_profile = Column(JSON, default={}) # Stores Nexus 5 metrics
    
    # Credentials
    dms_provider = Column(String, nullable=True) # 'google_drive' or 'erpnext'
    dms_api_key = Column(String, nullable=True) # For ERPNext
    dms_oauth_token = Column(String, nullable=True) # For Google Drive
    gemini_api_key = Column(String, nullable=True) # User's personal Gemini Key
    
    user = relationship("User", back_populates="profile")

class TaskModel(Base):
    """Database model for A2A tasks with persistence"""
    __tablename__ = "a2a_tasks"
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(String, nullable=True, index=True)
    
    # Task status
    status_state = Column(String, default="pending", index=True)  # pending, in_progress, completed, failed, cancelled
    status_message = Column(String, nullable=True)
    status_progress = Column(Float, default=0.0)
    
    # Task data
    history = Column(JSON, default=[])  # Message history
    artifacts = Column(JSON, default=[])  # Task outputs
    task_metadata = Column(JSON, default={})  # Custom metadata
    context_sources = Column(JSON, default=[])  # RAG context references
   
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="tasks")
