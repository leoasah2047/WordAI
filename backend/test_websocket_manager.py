import pytest
import asyncio
from unittest.mock import AsyncMock, MagicMock
from websocket_manager import WebSocketManager

@pytest.mark.asyncio
async def test_connect():
    manager = WebSocketManager()
    mock_ws = AsyncMock()
    task_id = "test_task"
    
    await manager.connect(task_id, mock_ws)
    
    assert task_id in manager.active_connections
    assert mock_ws in manager.active_connections[task_id]
    mock_ws.accept.assert_called_once()

@pytest.mark.asyncio
async def test_disconnect():
    manager = WebSocketManager()
    mock_ws = AsyncMock()
    task_id = "test_task"
    
    await manager.connect(task_id, mock_ws)
    manager.disconnect(task_id, mock_ws)
    
    assert task_id not in manager.active_connections
    mock_ws.accept.assert_called_once()

@pytest.mark.asyncio
async def test_broadcast_to_task():
    manager = WebSocketManager()
    mock_ws = AsyncMock()
    task_id = "test_task"
    message = {"type": "test", "data": "hello"}
    
    await manager.connect(task_id, mock_ws)
    await manager.broadcast_to_task(task_id, message)
    
    mock_ws.send_json.assert_called_with(message)

@pytest.mark.asyncio
async def test_broadcast_error_cleanup():
    manager = WebSocketManager()
    mock_ws = AsyncMock()
    mock_ws.send_json.side_effect = Exception("Send failed")
    task_id = "test_task"
    
    await manager.connect(task_id, mock_ws)
    await manager.broadcast_to_task(task_id, {"some": "data"})
    
    # Should be disconnected after error
    assert task_id not in manager.active_connections

@pytest.mark.asyncio
async def test_stream_llm_chunk():
    manager = WebSocketManager()
    mock_ws = AsyncMock()
    task_id = "test_task"
    chunk = "test chunk"
    
    await manager.connect(task_id, mock_ws)
    await manager.stream_llm_chunk(task_id, chunk)
    
    # Verify send_json was called with a chunk type message
    args, kwargs = mock_ws.send_json.call_args
    assert args[0]["type"] == "chunk"
    assert args[0]["content"] == chunk

@pytest.mark.asyncio
async def test_get_connection_count():
    manager = WebSocketManager()
    mock_ws1 = AsyncMock()
    mock_ws2 = AsyncMock()
    task_id = "test_task"
    
    await manager.connect(task_id, mock_ws1)
    await manager.connect(task_id, mock_ws2)
    
    assert manager.get_connection_count(task_id) == 2
    
    manager.disconnect(task_id, mock_ws1)
    assert manager.get_connection_count(task_id) == 1
