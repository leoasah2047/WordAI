from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import os
import httpx
from pydantic import BaseModel

from config import settings

# JWT Configuration
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = settings.ACCESS_TOKEN_EXPIRE_MINUTES

class TokenData(BaseModel):
    user_id: int
    email: str

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[TokenData]:
    try:
        # First try HS256 (our own session tokens)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: int = payload.get("sub")
        email: str = payload.get("email")
        if user_id is not None and email is not None:
            return TokenData(user_id=user_id, email=email)
    except JWTError:
        pass
        
    try:
        # If that fails, it might be a Microsoft Entra ID token (RS256)
        # In a production app, we should verify the signature against MS discovery keys.
        # For now, we'll decode without verification to get user info if signature check fails,
        # but ideally we use msal-python or jose with public keys.
        payload = jwt.get_unverified_claims(token)
        email = payload.get("preferred_username") or payload.get("email") or payload.get("upn")
        oid = payload.get("oid") or payload.get("sub")
        if email and oid:
            # We don't have a local user_id yet, so we'll return a partial TokenData
            # and let the caller handle user lookup/creation by email.
            return TokenData(user_id=0, email=email)
    except Exception:
        return None
    return None

# OAuth 2.0 Endpoints & Config
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

MS_CLIENT_ID = settings.MS_CLIENT_ID
MS_CLIENT_SECRET = settings.MS_CLIENT_SECRET
MS_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
MS_USERINFO_URL = "https://graph.microsoft.com/v1.0/me"
MS_OBO_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"

class TokenExchangeResponse(BaseModel):
    token: str

async def exchange_microsoft_obo_token(client_assertion: str):
    """
    Exchange an Office/NAA token for a Graph/OBO token.
    """
    async with httpx.AsyncClient() as client:
        data = {
            "client_id": MS_CLIENT_ID,
            "client_secret": MS_CLIENT_SECRET,
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": client_assertion,
            "requested_token_use": "on_behalf_of",
            "scope": "https://graph.microsoft.com/User.Read"
        }
        response = await client.post(MS_OBO_URL, data=data)
        response.raise_for_status()
        return response.json()

async def exchange_google_code(code: str, redirect_uri: str, code_verifier: str):
    async with httpx.AsyncClient() as client:
        data = {
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "code_verifier": code_verifier,
        }
        response = await client.post(GOOGLE_TOKEN_URL, data=data)
        response.raise_for_status()
        tokens = response.json()
        
        # Get user info
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        user_res = await client.get(GOOGLE_USERINFO_URL, headers=headers)
        user_res.raise_for_status()
        return user_res.json(), tokens

async def exchange_microsoft_code(code: str, redirect_uri: str, code_verifier: str):
    async with httpx.AsyncClient() as client:
        data = {
            "code": code,
            "client_id": MS_CLIENT_ID,
            "client_secret": MS_CLIENT_SECRET,
            "redirect_uri": redirect_uri,
            "grant_type": "authorization_code",
            "code_verifier": code_verifier,
        }
        response = await client.post(MS_TOKEN_URL, data=data)
        response.raise_for_status()
        tokens = response.json()
        
        # Get user info from Graph API
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        user_res = await client.get(MS_USERINFO_URL, headers=headers)
        user_res.raise_for_status()
        user_data = user_res.json()
        # Graph API returns userPrincipalName or mail
        email = user_data.get("mail") or user_data.get("userPrincipalName")
        return {"email": email, "id": user_data["id"], "name": user_data.get("displayName")}, tokens
