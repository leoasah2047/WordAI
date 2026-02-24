import os
import httpx
from sqlalchemy.orm import Session
import models
from logging_config import get_logger

logger = get_logger(__name__)

class DMSClient:
    """
    Bridge client to handle connections to various DMS providers
    using user-specific API keys and tokens.
    """
    def __init__(self, user: models.User, db: Session):
        self.user = user
        self.db = db
        self.profile = user.profile
        
        if not self.profile:
            raise ValueError("User profile not found. Please complete onboarding.")

    def get_credentials(self):
        """Retrieve the appropriate credentials for the user's DMS provider."""
        provider = self.profile.dms_provider
        
        if provider == "google_drive":
            return {
                "provider": "google_drive",
                "token": self.profile.dms_oauth_token
            }
        elif provider == "erpnext":
            return {
                "provider": "erpnext",
                "api_key": self.profile.dms_api_key
            }
        else:
            return {
                "provider": None,
                "message": "No DMS provider configured"
            }

    async def list_files(self, folder_path: str = None, limit: int = 20):
        """List files from the configured DMS."""
        creds = self.get_credentials()
        if not creds.get("provider"):
             return {"error": creds.get("message")}
             
        logger.info(f"Listing files from {creds['provider']} for user {self.user.id}")
        
        try:
            async with httpx.AsyncClient() as client:
                if creds["provider"] == "google_drive":
                    headers = {"Authorization": f"Bearer {creds['token']}"}
                    query = f"'{folder_path or 'root'}' in parents and trashed = false"
                    params = {"q": query, "pageSize": limit, "fields": "files(id, name, mimeType)"}
                    resp = await client.get("https://www.googleapis.com/drive/v3/files", headers=headers, params=params)
                    resp.raise_for_status()
                    return {"status": "success", "provider": "google_drive", "files": resp.json().get("files", [])}
                elif creds["provider"] == "erpnext":
                    headers = {"Authorization": f"token {creds['api_key']}"}
                    params = {"limit_page_length": limit}
                    # The host must be defined in the environment or user profile for ERPNext
                    host = os.getenv("ERPNEXT_HOST", "https://erpnext.example.com")
                    resp = await client.get(f"{host}/api/resource/File", headers=headers, params=params)
                    resp.raise_for_status()
                    return {"status": "success", "provider": "erpnext", "files": resp.json().get("data", [])}
        except Exception as e:
            logger.error(f"DMS list_files error: {str(e)}")
            return {"status": "error", "error": str(e), "message": f"Failed to list files from {creds['provider']}"}

    async def read_file(self, file_id: str):
        """Read a file's content from the configured DMS."""
        creds = self.get_credentials()
        if not creds.get("provider"):
             return {"error": creds.get("message")}

        logger.info(f"Reading file {file_id} from {creds['provider']} for user {self.user.id}")
        
        try:
            async with httpx.AsyncClient() as client:
                if creds["provider"] == "google_drive":
                    headers = {"Authorization": f"Bearer {creds['token']}"}
                    params = {"alt": "media"}
                    resp = await client.get(f"https://www.googleapis.com/drive/v3/files/{file_id}", headers=headers, params=params)
                    resp.raise_for_status()
                    # Return base64 or raw text depending on usage, returning text for now
                    return {"status": "success", "content": resp.text}
                elif creds["provider"] == "erpnext":
                    headers = {"Authorization": f"token {creds['api_key']}"}
                    host = os.getenv("ERPNEXT_HOST", "https://erpnext.example.com")
                    resp = await client.get(f"{host}/api/method/frappe.core.api.file.download_file", headers=headers, params={"file_url": file_id})
                    resp.raise_for_status()
                    return {"status": "success", "content": resp.text}
        except Exception as e:
            logger.error(f"DMS read_file error: {str(e)}")
            return {"status": "error", "error": str(e), "message": f"Failed to read file from {creds['provider']}"}
