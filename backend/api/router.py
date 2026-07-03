from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import datetime
import asyncio

from backend.db.session import get_db, SessionLocal
from backend.schemas.generation import GenerationCreate, GenerationResponse
from backend.models.generation import ImageGeneration, GenerationStatus
from backend.services.ai import ai_service
from backend.services.storage import storage_service

router = APIRouter()

def process_image_generation(generation_id: int):
    """
    Background task to process image generation using Fal.ai and save locally.
    """
    db: Session = SessionLocal()
    generation = db.query(ImageGeneration).filter(ImageGeneration.id == generation_id).first()
    
    if not generation:
        db.close()
        return

    generation.status = GenerationStatus.PROCESSING.value
    db.commit()

    try:
        # Run async ai_service in sync context (BackgroundTasks run in separate thread)
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
            
        image_bytes_list = loop.run_until_complete(
            ai_service.generate_image(
                prompt=generation.prompt,
                style=generation.style,
                aspect_ratio=generation.aspect_ratio,
                num_inference_steps=generation.num_inference_steps,
                guidance_scale=generation.guidance_scale,
                seed=generation.seed
            )
        )
        loop.close()

        urls = []
        for img_bytes in image_bytes_list:
            url = storage_service.upload_image_bytes(img_bytes)
            urls.append(url)

        generation.result_urls = urls
        generation.status = GenerationStatus.COMPLETED.value
        generation.completed_at = datetime.datetime.utcnow()
        db.commit()

    except Exception as e:
        generation.status = GenerationStatus.FAILED.value
        generation.error_message = str(e)
        generation.completed_at = datetime.datetime.utcnow()
        db.commit()
    finally:
        db.close()

@router.post("/generate", response_model=GenerationResponse)
def create_generation(gen_in: GenerationCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Start a new image generation task.
    """
    generation = ImageGeneration(
        prompt=gen_in.prompt,
        negative_prompt=gen_in.negative_prompt,
        style=gen_in.style,
        aspect_ratio=gen_in.aspect_ratio,
        quality=gen_in.quality,
        seed=gen_in.seed,
        guidance_scale=gen_in.guidance_scale,
        num_inference_steps=gen_in.num_inference_steps,
        num_images=gen_in.num_images
    )
    db.add(generation)
    db.commit()
    db.refresh(generation)

    # Use FastAPI BackgroundTasks instead of Celery
    background_tasks.add_task(process_image_generation, generation.id)

    return generation

@router.get("/generations/{generation_id}", response_model=GenerationResponse)
def get_generation(generation_id: int, db: Session = Depends(get_db)):
    """
    Get the status and result of a specific generation.
    """
    generation = db.query(ImageGeneration).filter(ImageGeneration.id == generation_id).first()
    if not generation:
        raise HTTPException(status_code=404, detail="Generation not found")
    
    return generation

@router.get("/generations", response_model=List[GenerationResponse])
def list_generations(skip: int = 0, limit: int = 20, db: Session = Depends(get_db)):
    """
    List past generations.
    """
    generations = db.query(ImageGeneration).order_by(ImageGeneration.created_at.desc()).offset(skip).limit(limit).all()
    return generations
