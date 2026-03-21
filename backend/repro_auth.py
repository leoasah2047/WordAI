import sys
import os
from jose import jwt, JWTError

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from auth_utils import create_access_token, verify_token
from config import settings

def test_auth():
    print(f"Testing with SECRET_KEY: {settings.JWT_SECRET_KEY[:10]}...")
    
    # Test internal session token
    user_id = 1
    email = "test@example.com"
    token = create_access_token(data={"sub": user_id, "email": email})
    print(f"Created token: {token[:20]}...")
    
    # Debug decode manually
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=["HS256"])
        print(f"Manual decode payload: {payload}")
        print(f"sub type: {type(payload.get('sub'))}")
        print(f"email type: {type(payload.get('email'))}")
    except JWTError as e:
        print(f"Manual decode failed: {e}")

    verified = verify_token(token)
    if verified:
        print(f"Token verified: user_id={verified.user_id}, email={verified.email}")
    else:
        print("Token verification failed!")

if __name__ == "__main__":
    test_auth()
