import os
import uuid
from backend.core.config import settings

class StorageService:
    def __init__(self):
        self.upload_dir = settings.UPLOAD_DIR

    def upload_image_bytes(self, image_bytes: bytes, extension: str = "png") -> str:
        """
        Saves image bytes to the local filesystem and returns a relative URL.
        """
        file_name = f"{uuid.uuid4()}.{extension}"
        file_path = os.path.join(self.upload_dir, file_name)
        
        with open(file_path, "wb") as f:
            f.write(image_bytes)
            
        # Return the URL path to access this file via FastAPI StaticFiles
        return f"/uploads/{file_name}"

storage_service = StorageService()
