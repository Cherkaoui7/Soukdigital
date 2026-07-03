from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from backend.models.generation import GenerationStatus

class GenerationCreate(BaseModel):
    prompt: str = Field(..., min_length=1, description="The text prompt to generate image from")
    negative_prompt: Optional[str] = Field(None, description="What to avoid in the image")
    style: Optional[str] = Field(None, description="Image style e.g. Photorealistic, Luxury")
    aspect_ratio: Optional[str] = Field("1:1", description="Aspect ratio e.g. 1:1, 16:9")
    quality: Optional[str] = Field("HD", description="Quality e.g. HD, 2K, 4K")
    seed: Optional[int] = Field(None, description="Seed for reproducible generation")
    guidance_scale: Optional[float] = Field(7.5, description="How closely to follow the prompt")
    num_inference_steps: Optional[int] = Field(30, description="Number of denoising steps")
    num_images: Optional[int] = Field(1, ge=1, le=8, description="Number of images to generate")

class GenerationResponse(BaseModel):
    id: int
    status: str
    prompt: str
    result_urls: Optional[List[str]] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
