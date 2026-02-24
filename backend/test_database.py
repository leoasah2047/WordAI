import pytest
from sqlalchemy.orm import Session
from database import get_db, SessionLocal

def test_get_db():
    db_gen = get_db()
    db = next(db_gen)
    assert isinstance(db, Session)
    # Try to close it manually to ensure it works
    db.close()

def test_session_local():
    db = SessionLocal()
    assert isinstance(db, Session)
    db.close()
