import pytest
from unittest.mock import MagicMock, AsyncMock, patch
from rag import RAGService
from fastapi import UploadFile
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import io

@pytest.fixture
def mock_sparse_embeddings():
    with patch("rag.SparseTextEmbedding") as mock:
        yield mock

@pytest.fixture
def mock_qdrant():
    with patch("rag.QdrantClient") as mock:
        yield mock

@pytest.fixture
def mock_embeddings():
    with patch("rag.GoogleGenerativeAIEmbeddings") as mock:
        yield mock

def test_rag_service_init(mock_qdrant, mock_sparse_embeddings):
    service = RAGService()
    assert service.qdrant_url is not None
    assert service.collection_name == "word-gpt-plus"
    assert service.use_hybrid is True

def test_update_api_key(mock_qdrant, mock_embeddings, mock_sparse_embeddings):
    service = RAGService()
    with patch.object(service, "_init_embeddings") as mock_init:
        service.update_api_key("new_key")
        mock_init.assert_called_with("new_key")

@pytest.mark.asyncio
async def test_ingest_file_txt(mock_qdrant, mock_embeddings, mock_sparse_embeddings):
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
async def test_collection_creation_dims(mock_qdrant, mock_embeddings, mock_sparse_embeddings):
    from config import settings
    service = RAGService()
    service.embeddings = MagicMock(spec=GoogleGenerativeAIEmbeddings)
    service.client = MagicMock()
    service.client.collection_exists.return_value = False
    
    # We need to mock QdrantVectorStore to avoid initialization issues during test
    with patch("rag.QdrantVectorStore"):
        service._get_vector_store()
    
    # Verify create_collection was called with correct size
    args, kwargs = service.client.create_collection.call_args
    assert kwargs["vectors_config"].size == settings.DENSE_EMBEDDING_DIM
    assert settings.DENSE_EMBEDDING_DIM == 512
