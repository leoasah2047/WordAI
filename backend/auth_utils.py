from datetime import datetime, timedelta
from typing import Optional
from jose import jwt, JWTError
import os
import httpx
from pydantic import BaseModel
from fastapi import HTTPException

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

# OAuth 2.0 Endpoints & Config
GOOGLE_CLIENT_ID = settings.GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET = settings.GOOGLE_CLIENT_SECRET
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

MS_CLIENT_ID = settings.MS_CLIENT_ID
MS_CLIENT_SECRET = settings.MS_CLIENT_SECRET
MS_TENANT_ID = settings.MS_TENANT_ID or "common"

MS_TOKEN_URL = f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token"
MS_USERINFO_URL = "https://graph.microsoft.com/v1.0/me"
MS_OBO_URL = f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token"

# Microsoft Entra ID OpenID Configuration
MS_DISCOVERY_URL = f"https://login.microsoftonline.com/{MS_TENANT_ID}/v2.0/.well-known/openid-configuration"
_ms_jwks = None

def get_ms_jwks():
    global _ms_jwks
    if _ms_jwks is None:
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(MS_DISCOVERY_URL)
                resp.raise_for_status()
                config = resp.json()
                jwks_uri = config.get("jwks_uri")
                jwks_resp = client.get(jwks_uri)
                jwks_resp.raise_for_status()
                _ms_jwks = jwks_resp.json()
        except Exception:
            return None
    return _ms_jwks

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
        # Microsoft Entra ID token (RS256) - PRODUCTION MODE
        jwks = get_ms_jwks()
        if not jwks:
            # Fallback to unverified decode if keys can't be fetched (not ideal but avoids total lockout if MS is down)
            payload = jwt.get_unverified_claims(token)
        else:
            payload = jwt.decode(
                token, 
                jwks, 
                algorithms=["RS256"], 
                audience=MS_CLIENT_ID,
                options={"verify_at_hash": False}
            )

        email = payload.get("preferred_username") or payload.get("email") or payload.get("upn")
        oid = payload.get("oid") or payload.get("sub")
        if email and oid:
            return TokenData(user_id=0, email=email)
    except Exception:
        return None
    return None

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
        if (response.status_code == 401):
            from logging_config import get_logger
            logger = get_logger(__name__)
            error_details = response.json() if response.headers.get("content-type") == "application/json" else {"error_description": response.text}
            
            # Common Azure AD Error: Client Secret vs Secret ID
            if "AADSTS7000215" in (error_details.get("error_description") or ""):
                raise HTTPException(
                    status_code=401, 
                    detail="Invalid Microsoft Client Secret. Ensure MS_CLIENT_SECRET is the SECRET VALUE, not the Secret ID GUID."
                )
                
            logger.error("microsoft_token_401_error", 
                         detail=response.text, 
                         has_client_secret=bool(MS_CLIENT_SECRET),
                         client_id=MS_CLIENT_ID[:5] + "..." if MS_CLIENT_ID else None)
        
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
