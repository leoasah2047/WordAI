import pytest
from models import User, UserProfile, TaskModel
from sqlalchemy.orm import Session
from datetime import datetime

def test_create_user(db_session: Session):
    user = User(email="test@example.com", provider="google", provider_id="google123")
    db_session.add(user)
    db_session.commit()
    
    saved_user = db_session.query(User).filter_by(email="test@example.com").first()
    assert saved_user is not None
    assert saved_user.id is not None
    assert saved_user.provider == "google"

def test_create_user_profile(db_session: Session):
    user = User(email="test_profile@example.com", provider="microsoft", provider_id="ms123")
    db_session.add(user)
    db_session.commit()
    
    profile = UserProfile(user_id=user.id, identity="Scholar", default_context={"tone": "Academic"})
    db_session.add(profile)
    db_session.commit()
    
    saved_profile = db_session.query(UserProfile).filter_by(user_id=user.id).first()
    assert saved_profile is not None
    assert saved_profile.identity == "Scholar"
    assert saved_profile.user.email == "test_profile@example.com"

def test_create_task_model(db_session: Session):
    task = TaskModel(
        id="task_123",
        status_state="pending",
        status_message="Initializing",
        history=[{"role": "user", "content": "hello"}],
        artifacts=[{"type": "text", "content": "result"}]
    )
    db_session.add(task)
    db_session.commit()
    
    saved_task = db_session.query(TaskModel).filter_by(id="task_123").first()
    assert saved_task is not None
    assert saved_task.status_state == "pending"
    assert len(saved_task.history) == 1
    assert saved_task.created_at is not None
