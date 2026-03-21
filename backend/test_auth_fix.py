from unittest.mock import MagicMock, patch, AsyncMock
import pytest
import sys
import os

# Mock the settings before importing auth_utils
from unittest.mock import MagicMock
mock_settings = MagicMock()
mock_settings.MS_CLIENT_ID = "test-client-id"
mock_settings.MS_CLIENT_SECRET = "test-secret"
mock_settings.MS_TENANT_ID = "common"
mock_settings.JWT_SECRET_KEY = "test-key"
mock_settings.ACCESS_TOKEN_EXPIRE_MINUTES = 60

# Inject mock settings into config
import config
config.settings = mock_settings

from auth_utils import exchange_microsoft_code, exchange_microsoft_obo_token

@pytest.mark.asyncio
async def test_exchange_microsoft_code_no_secret():
    """Verify that exchange_microsoft_code does NOT send client_secret"""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"access_token": "fake-token"}
        
        # Mocking the Graph API call that follows
        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_user_resp = MagicMock()
            mock_user_resp.json.return_value = {"id": "user-id", "mail": "user@example.com"}
            mock_user_resp.raise_for_status = MagicMock()
            mock_get.return_value = mock_user_resp
            
            mock_post.return_value = mock_response
            
            await exchange_microsoft_code("fake-code", "http://localhost/callback", "fake-verifier")
            
            # Check the call arguments
            args, kwargs = mock_post.call_args
            data = kwargs.get("data")
            
            assert data["client_id"] == "test-client-id"
            assert "client_secret" not in data, "client_secret should NOT be sent for public clients"
            assert data["code"] == "fake-code"
            assert data["code_verifier"] == "fake-verifier"
            assert "scope" in data
            assert "openid" in data["scope"]

@pytest.mark.asyncio
async def test_exchange_microsoft_obo_token_no_secret():
    """Verify that exchange_microsoft_obo_token does NOT send client_secret"""
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {"access_token": "obo-token"}
        mock_post.return_value = mock_response
        
        await exchange_microsoft_obo_token("fake-assertion")
        
        args, kwargs = mock_post.call_args
        data = kwargs.get("data")
        
        assert data["client_id"] == "test-client-id"
        assert "client_secret" not in data, "client_secret should NOT be sent for public clients during OBO"
        assert data["assertion"] == "fake-assertion"
