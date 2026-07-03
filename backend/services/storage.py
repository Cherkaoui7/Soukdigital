import io
import uuid
from minio import Minio
from backend.core.config import settings

class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket_name = settings.MINIO_BUCKET_NAME
        self._ensure_bucket()

    def _ensure_bucket(self):
        if not self.client.bucket_exists(self.bucket_name):
            self.client.make_bucket(self.bucket_name)

    def upload_image_bytes(self, image_bytes: bytes, extension: str = "png") -> str:
        """
        Uploads image bytes to MinIO and returns the URL.
        """
        file_name = f"{uuid.uuid4()}.{extension}"
        
        self.client.put_object(
            self.bucket_name,
            file_name,
            data=io.BytesIO(image_bytes),
            length=len(image_bytes),
            content_type=f"image/{extension}"
        )
        
        # Return a URL that the frontend can use to access the image.
        # Assuming frontend accesses it directly or via a proxy
        protocol = "https" if settings.MINIO_SECURE else "http"
        return f"{protocol}://{settings.MINIO_ENDPOINT}/{self.bucket_name}/{file_name}"

storage_service = StorageService()
