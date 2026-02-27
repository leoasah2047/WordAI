"""
Test A2A Protocol Endpoints

Run with: pytest test_a2a.py -v
"""

import os
os.environ["DEBUG"] = "True"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-at-least-32-chars-long-12345"

import pytest
from fastapi.testclient import TestClient
from main import app
import uuid

client = TestClient(app)


from unittest.mock import patch, MagicMock

def test_health_check():
    """Test basic health endpoint"""
    with patch('httpx.AsyncClient.get') as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"status": "healthy", "features": ["websocket_streaming", "rag_integration"]}
        mock_get.return_value = mock_response
        
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert "websocket_streaming" in response.json()["features"]
        assert "rag_integration" in response.json()["features"]


def test_a2a_rpc_task_send():
    """Test A2A tasks/send endpoint"""
    task_id = str(uuid.uuid4())
    
    request_data = {
        "jsonrpc": "2.0",
        "method": "tasks/send",
        "params": {
            "id": task_id,
            "message": {
                "role": "user",
                "content": "Write a brief summary of cloud computing"
            },
            "metadata": {
                "functionArea": "Technology",
                "styleAuthor": "Professional",
                "language": "English",
                "source": "test"
            }
        },
        "id": 1
    }
    
    response = client.post("/a2a/rpc", json=request_data)
    
    assert response.status_code == 200
    result = response.json()
    
    # Verify JSON-RPC response structure
    assert result["jsonrpc"] == "2.0"
    assert result["id"] == 1
    assert "result" in result
    
    # Verify task structure
    task = result["result"]
    assert task["id"] == task_id
    assert "status" in task
    assert task["status"]["state"] in ["pending", "in_progress"]
    assert "history" in task
    assert len(task["history"]) == 1
    assert task["history"][0]["role"] == "user"


def test_a2a_rpc_task_get():
    """Test A2A tasks/get endpoint"""
    # First create a task
    task_id = str(uuid.uuid4())
    
    send_request = {
        "jsonrpc": "2.0",
        "method": "tasks/send",
        "params": {
            "id": task_id,
            "message": {
                "role": "user",
                "content": "Test query"
            }
        },
        "id": 1
    }
    
    client.post("/a2a/rpc", json=send_request)
    
    # Then retrieve it
    get_request = {
        "jsonrpc": "2.0",
        "method": "tasks/get",
        "params": {
            "id": task_id
        },
        "id": 2
    }
    
    response = client.post("/a2a/rpc", json=get_request)
    
    assert response.status_code == 200
    result = response.json()
    
    assert result["jsonrpc"] == "2.0"
    assert "result" in result
    
    task = result["result"]
    assert task["id"] == task_id


def test_a2a_rpc_invalid_method():
    """Test A2A endpoint with invalid method"""
    request_data = {
        "jsonrpc": "2.0",
        "method": "invalid/method",
        "params": {},
        "id": 1
    }
    
    response = client.post("/a2a/rpc", json=request_data)
    
    assert response.status_code == 200
    result = response.json()
    
    assert result["jsonrpc"] == "2.0"
    assert "error" in result
    assert result["error"]["code"] == -32601
    assert "Method not found" in result["error"]["message"]


def test_a2a_rpc_invalid_params():
    """Test A2A endpoint with invalid parameters"""
    request_data = {
        "jsonrpc": "2.0",
        "method": "tasks/send",
        "params": {
            # Missing required fields
        },
        "id": 1
    }
    
    response = client.post("/a2a/rpc", json=request_data)
    
    assert response.status_code == 200
    result = response.json()
    
    assert result["jsonrpc"] == "2.0"
    assert "error" in result
    assert result["error"]["code"] == -32602


def test_a2a_rpc_task_cancel():
    """Test A2A tasks/cancel endpoint"""
    # Create a task first
    task_id = str(uuid.uuid4())
    
    send_request = {
        "jsonrpc": "2.0",
        "method": "tasks/send",
        "params": {
            "id": task_id,
            "message": {
                "role": "user",
                "content": "Long running task"
            }
        },
        "id": 1
    }
    
    client.post("/a2a/rpc", json=send_request)
    
    # Cancel it
    cancel_request = {
        "jsonrpc": "2.0",
        "method": "tasks/cancel",
        "params": {
            "id": task_id
        },
        "id": 2
    }
    
    response = client.post("/a2a/rpc", json=cancel_request)
    
    assert response.status_code == 200
    result = response.json()
    
    assert result["jsonrpc"] == "2.0"
    
    # Note: This might fail if task completes before cancellation
    # In production, you'd need proper async handling


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
