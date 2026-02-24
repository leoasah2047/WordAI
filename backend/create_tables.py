"""
Database Migration Script

Adds a2a_tasks table for Phase 4: Task Persistence

Run with: alembic upgrade head
Or manually: python create_tables.py
"""

from sqlalchemy import create_engine
from database import Base, engine
import models

def create_tables():
    """Create all tables including a2a_tasks"""
    print("Creating database tables...")
    
    try:
        Base.metadata.create_all(bind=engine)
        print("✓ Tables created successfully")
        print(f"✓ Created tables: {', '.join(Base.metadata.tables.keys())}")
        
    except Exception as e:
        print(f"✗ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_tables()
