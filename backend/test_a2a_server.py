import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from a2a_server import A2AServer, TaskSendParams, Message, Role, TaskState, Artifact
from models import User, TaskModel
from sqlalchemy.orm import Session
import uuid
from datetime import datetime

@pytest.fixture
def server():
    return A2AServer()

@pytest.mark.asyncio
async def test_handle_task_send_new(server, db_session: Session):
    params = TaskSendParams(
        id=str(uuid.uuid4()),
        message=Message(role=Role.USER, content="Hello"),
        metadata={"functionArea": "Legal"}
    )
    
    # Mocking _process_task to avoid LLM calls
    with patch.object(server, "_process_task", new_callable=AsyncMock) as mock_process:
        task = await server.handle_task_send(params, db_session)
        
        assert task.id == params.id
        assert task.status.state == TaskState.PENDING
        
        # Verify it was saved to DB
        db_task = db_session.query(TaskModel).filter_by(id=params.id).first()
        assert db_task is not None
        assert db_task.status_state == "pending"
        mock_process.assert_called_once()

@pytest.mark.asyncio
async def test_handle_task_send_existing(server, db_session: Session):
    task_id = str(uuid.uuid4())
    # Create existing task in DB
    db_task = TaskModel(id=task_id, history=[{"role": "user", "content": "Initial"}])
    db_session.add(db_task)
    db_session.commit()
    
    params = TaskSendParams(
        id=task_id,
        message=Message(role=Role.USER, content="Second message")
    )
    
    with patch.object(server, "_process_task", new_callable=AsyncMock):
        task = await server.handle_task_send(params, db_session)
        assert len(task.history) == 2
        assert task.history[1].content == "Second message"

@pytest.mark.asyncio
async def test_handle_task_get(server, db_session: Session):
    task_id = "task_get_test"
    db_task = TaskModel(id=task_id, status_state="completed", history=[{"role": "user", "content": "test"}])
    db_session.add(db_task)
    db_session.commit()
    
    from a2a_server import TaskQueryParams
    params = TaskQueryParams(id=task_id)
    task = await server.handle_task_get(params, db_session)
    
    assert task.id == task_id
    assert task.status.state == TaskState.COMPLETED

@pytest.mark.asyncio
async def test_handle_task_cancel(server, db_session: Session):
    task_id = "task_cancel_test"
    db_task = TaskModel(id=task_id, status_state="in_progress")
    db_session.add(db_task)
    db_session.commit()
    
    with patch("a2a_server.ws_manager.update_status", new_callable=AsyncMock):
        task = await server.handle_task_cancel(task_id, db_session)
        assert task.status.state == TaskState.CANCELLED
        
        db_task_refreshed = db_session.query(TaskModel).filter_by(id=task_id).first()
        assert db_task_refreshed.status_state == "cancelled"

