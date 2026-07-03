from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Enum
from sqlalchemy.sql import func
import enum
from backend.db.session import Base

class GenerationStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ImageGeneration(Base):
    __tablename__ = "image_generations"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, index=True, nullable=True) # Celery task ID
    
    # Prompt settings
    prompt = Column(String, nullable=False)
    negative_prompt = Column(String, nullable=True)
    style = Column(String, nullable=True)
    aspect_ratio = Column(String, nullable=True)
    quality = Column(String, nullable=True)
    
    # Advanced settings
    seed = Column(Integer, nullable=True)
    guidance_scale = Column(Float, nullable=True)
    num_inference_steps = Column(Integer, nullable=True)
    num_images = Column(Integer, default=1)
    
    # Results
    status = Column(String, default=GenerationStatus.PENDING.value)
    result_urls = Column(JSON, nullable=True) # List of MinIO URLs
    error_message = Column(String, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
