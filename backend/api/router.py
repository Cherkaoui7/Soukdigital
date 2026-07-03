from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from backend.db.session import get_db
from backend.schemas.generation import GenerationCreate, GenerationResponse
from backend.models.generation import ImageGeneration
from backend.worker import generate_image_task

router = APIRouter()

@router.post("/generate", response_model=GenerationResponse)
def create_generation(gen_in: GenerationCreate, db: Session = Depends(get_db)):
    """
    Start a new image generation task.
    """
    # Create DB record
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

    # Dispatch Celery task
    task = generate_image_task.delay(generation.id)
    
    # Save task ID
    generation.task_id = task.id
    db.commit()
    db.refresh(generation)

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
