import pytest
from datetime import timedelta
from auth_utils import create_access_token, verify_token, TokenData
from jose import jwt

def test_create_access_token():
    data = {"sub": 1, "email": "test@example.com"}
    token = create_access_token(data)
    assert token is not None
    assert isinstance(token, str)

def test_verify_token_success():
    # The verify_token looks for "sub" and "email"
    data = {"sub": "1", "email": "test@example.com"}
    token = create_access_token(data)
    token_data = verify_token(token)
    assert token_data is not None
    assert str(token_data.user_id) == "1"
    assert token_data.email == "test@example.com"

def test_verify_token_expired():
    data = {"sub": 1, "email": "test@example.com"}
    # Create an expired token by setting delta to negative
    token = create_access_token(data, expires_delta=timedelta(minutes=-1))
    token_data = verify_token(token)
    assert token_data is None

def test_verify_token_invalid():
    token = "invalid.token.string"
    token_data = verify_token(token)
    assert token_data is None

def test_verify_token_missing_fields():
    # Token with missing 'email'
    data = {"sub": 1}
    token = create_access_token(data)
    token_data = verify_token(token)
    assert token_data is None

def test_microsoft_endpoint_tenant_configuration():
    from auth_utils import MS_TOKEN_URL, MS_OBO_URL, MS_DISCOVERY_URL, MS_TENANT_ID
    # Since auth_utils evaluates these at import time, and we've already imported it,
    # we just check that the current ones match the settings (which default to 'common')
    assert f"/{MS_TENANT_ID}/" in MS_TOKEN_URL
    assert f"/{MS_TENANT_ID}/" in MS_OBO_URL
    assert f"/{MS_TENANT_ID}/" in MS_DISCOVERY_URL
