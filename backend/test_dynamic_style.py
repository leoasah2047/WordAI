import pytest
import asyncio
from unittest.mock import MagicMock, patch, AsyncMock
from langchain_core.documents import Document

# Mock dependencies before importing main
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

import os
if not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = "fake_key"

# Now we can import the function to test
from main import extract_style_instruction

@pytest.mark.asyncio
async def test_extract_style_instruction_no_docs():
    # Test fallback when no documents are provided
    author = "UnknownAuthor"
    result = await extract_style_instruction(author, [], "fake_key")
    assert "STYLE: PROFESSIONAL & STANDARD" in result
    assert f"({author})" in result

@pytest.mark.asyncio
@patch("main.ChatGoogleGenerativeAI")
async def test_extract_style_instruction_with_docs(mock_llm_class):
    # Setup mock LLM
    mock_llm_instance = MagicMock()
    mock_llm_class.return_value = mock_llm_instance
    
    # Mock response
    mock_response = MagicMock()
    mock_response.content = """STYLE: JURIDICAL ELITE (GAK)
- Tone: Formal
- Vocabulary: Latinate
- Structure: Complex
- Formatting: Numbered
- Focus: Compliance"""
    mock_llm_instance.ainvoke = AsyncMock(return_value=mock_response)
    
    author = "GAK"
    docs = [Document(page_content="The party of the first part shall herewith consider...")]
    
    result = await extract_style_instruction(author, docs, "fake_key")
    
    assert "STYLE: JURIDICAL ELITE (GAK)" in result
    assert "- Tone: Formal" in result
    mock_llm_instance.ainvoke.assert_called_once()
    
@pytest.mark.asyncio
@patch("main.ChatGoogleGenerativeAI")
async def test_extract_style_instruction_error_fallback(mock_llm_class):
    # Setup mock LLM to raise an error
    mock_llm_instance = MagicMock()
    mock_llm_class.return_value = mock_llm_instance
    mock_llm_instance.ainvoke = AsyncMock(side_effect=Exception("LLM Failure"))
    
    author = "GAK"
    docs = [Document(page_content="Some sample text")]
    
    result = await extract_style_instruction(author, docs, "fake_key")
    
    # Should fallback to standard style
    assert "STYLE: PROFESSIONAL & STANDARD" in result
