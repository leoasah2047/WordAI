import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from rag import RAGService
from fastapi import UploadFile
import io

@pytest.fixture
def mock_qdrant():
    with patch("rag.QdrantClient") as mock:
        yield mock

@pytest.fixture
def mock_embeddings():
    with patch("rag.GoogleGenerativeAIEmbeddings") as mock:
        yield mock

def test_rag_service_init(mock_qdrant):
    service = RAGService()
    assert service.qdrant_url is not None
    assert service.collection_name == "word-gpt-plus"

def test_update_api_key(mock_qdrant, mock_embeddings):
    service = RAGService()
    with patch.object(service, "_init_embeddings") as mock_init:
        service.update_api_key("new_key")
        mock_init.assert_called_with("new_key")

@pytest.mark.asyncio
async def test_ingest_file_txt(mock_qdrant, mock_embeddings):
    service = RAGService()
    service.embeddings = MagicMock()
    service.client = MagicMock()
    service.client.collection_exists.return_value = True
    
    mock_file = AsyncMock(spec=UploadFile)
    mock_file.filename = "test.txt"
    mock_file.read.return_value = b"Hello world"
    
    with patch("rag.QdrantVectorStore") as mock_vs:
        result = await service.ingest_file(mock_file, {"user_id": 1})
        assert result["status"] == "success"
        assert "chunks_processed" in result

@pytest.mark.asyncio
async def test_query(mock_qdrant, mock_embeddings):
    service = RAGService()
    service.embeddings = MagicMock()
    service.client = MagicMock()
    
    with patch("rag.QdrantVectorStore") as mock_vs:
        mock_vs_instance = mock_vs.return_value
        mock_vs_instance.similarity_search.return_value = [MagicMock(page_content="result")]
        
        results = await service.query("test query")
        assert len(results) == 1
        assert results[0].page_content == "result"
