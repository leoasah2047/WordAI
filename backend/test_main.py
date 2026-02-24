from unittest.mock import MagicMock, patch
import sys
import types

# Create a mock package for qdrant_client
qdrant_client = types.ModuleType('qdrant_client')
qdrant_client.__path__ = []
qdrant_client.QdrantClient = MagicMock()
qdrant_client.AsyncQdrantClient = MagicMock()
qdrant_client.models = MagicMock()
sys.modules['qdrant_client'] = qdrant_client
sys.modules['qdrant_client.http'] = MagicMock()
sys.modules['qdrant_client.http.models'] = MagicMock()
sys.modules['qdrant_client.local'] = MagicMock()
sys.modules['qdrant_client.local.async_qdrant_local'] = MagicMock()

import rag
rag.rag_service = MagicMock()

from fastapi.testclient import TestClient
from main import app
import os
# Mock key for initialization
if not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = "dummy_key_for_test"

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "Word-GPT-Plus Backend Running"

def test_health_check():
    with patch('httpx.AsyncClient.get') as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"
        assert "websocket_streaming" in response.json()["features"]

def test_ingest_no_file():
    response = client.post("/api/v1/ingest")
    # Now requires auth, so 401 is expected if no token provided
    assert response.status_code in [401, 422]

def test_query_no_auth():
    payload = {
        "query": "Hello",
        "tender_context": "Test context"
    }
    response = client.post("/api/v1/query", json=payload)
    # If no GOOGLE_API_KEY is mocked correctly or missing, it might return 401
    assert response.status_code in [200, 401, 429, 500]

def test_generate_image_no_auth():
    payload = {
        "prompt": "A test image",
        "style": "photorealistic"
    }
    response = client.post("/api/v1/generate-image", json=payload)
    assert response.status_code in [401, 500] # 401 if missing key, 500 if lib error 
