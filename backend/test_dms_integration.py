import pytest
import httpx
from unittest.mock import patch, MagicMock
from sqlalchemy.orm import Session
from models import User, UserProfile
from dms_utils import DMSClient

@pytest.fixture
def mock_user():
    user = User(id=1, email="test@example.com")
    profile = UserProfile(
        user_id=1,
        dms_provider="google_drive",
        dms_oauth_token="fake_token"
    )
    user.profile = profile
    return user

@pytest.fixture
def mock_erpnext_user():
    user = User(id=2, email="erp@example.com")
    profile = UserProfile(
        user_id=2,
        dms_provider="erpnext",
        dms_api_key="fake_api_key"
    )
    user.profile = profile
    return user

@pytest.fixture
def mock_db():
    return MagicMock(spec=Session)

@pytest.mark.asyncio
async def test_list_files_google_drive(mock_user, mock_db):
    client = DMSClient(mock_user, mock_db)
    
    mock_response = MagicMock()
    mock_response.json.return_value = {"files": [{"id": "1", "name": "test_doc.docx"}]}
    mock_response.raise_for_status.return_value = None

    with patch('httpx.AsyncClient.get', return_value=mock_response) as mock_get:
        result = await client.list_files()
        
        assert result["status"] == "success"
        assert result["provider"] == "google_drive"
        assert len(result["files"]) == 1
        assert result["files"][0]["name"] == "test_doc.docx"
        
        mock_get.assert_called_once()
        args, kwargs = mock_get.call_args
        assert args[0] == "https://www.googleapis.com/drive/v3/files"
        assert kwargs["headers"]["Authorization"] == "Bearer fake_token"

@pytest.mark.asyncio
async def test_list_files_erpnext(mock_erpnext_user, mock_db):
    client = DMSClient(mock_erpnext_user, mock_db)
    
    mock_response = MagicMock()
    mock_response.json.return_value = {"data": [{"name": "file_1.txt"}]}
    mock_response.raise_for_status.return_value = None

    with patch('httpx.AsyncClient.get', return_value=mock_response) as mock_get:
        with patch('os.getenv', return_value="https://test.erpnext.com"):
            result = await client.list_files()
            
            assert result["status"] == "success"
            assert result["provider"] == "erpnext"
            assert len(result["files"]) == 1
            assert result["files"][0]["name"] == "file_1.txt"
            
            mock_get.assert_called_once()
            args, kwargs = mock_get.call_args
            assert args[0] == "https://test.erpnext.com/api/resource/File"
            assert kwargs["headers"]["Authorization"] == "token fake_api_key"

@pytest.mark.asyncio
async def test_dms_error_handling(mock_user, mock_db):
    client = DMSClient(mock_user, mock_db)
    
    mock_response = MagicMock()
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError("Auth failed", request=MagicMock(), response=mock_response)

    with patch('httpx.AsyncClient.get', return_value=mock_response):
        result = await client.list_files()
        
        assert result["status"] == "error"
        assert "Auth failed" in result["error"]
