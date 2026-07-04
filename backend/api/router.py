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
                num_images=generation.num_images,
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
                num_images=generation.num_images,
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

from fastapi import UploadFile, File, Form

@router.post("/remove-background")
async def remove_background(file: UploadFile = File(...)):
    """
    Remove background from uploaded image.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    image_bytes = await file.read()
    
    try:
        # Run AI service to remove background
        result_bytes = await ai_service.remove_background(image_bytes)
        
        # Save locally using storage_service
        url = storage_service.upload_image_bytes(result_bytes)
        
        return {"url": url, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

@router.post("/upscale-image")
async def upscale_image(
    file: UploadFile = File(...),
    scale: int = Form(4)
):
    try:
        contents = await file.read()
        # Scale can be 2 or 4, pass it to the upscaler
        result_bytes = await ai_service.upscale_image(contents, scale=scale)
        
        # Save to static uploads and return URL
        url = storage_service.upload_image_bytes(result_bytes, extension="png")
        return {"url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image upscaling failed: {str(e)}")

@router.post("/generate-mockup")
async def generate_mockup(
    file: UploadFile = File(...),
    template_id: str = Form(...),
    x_percent: float = Form(...),
    y_percent: float = Form(...),
    scale: float = Form(...),
    rotation: float = Form(0.0),
    shadow_opacity: float = Form(0.5)
):
    try:
        from backend.services.mockup import mockup_service
        contents = await file.read()
        
        # Generate the composite image
        url = mockup_service.generate_mockup(
            product_bytes=contents,
            template_id=template_id,
            x_percent=x_percent,
            y_percent=y_percent,
            scale=scale,
            rotation=rotation,
            shadow_opacity=shadow_opacity
        )
        return {"url": url}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mockup generation failed: {str(e)}")

@router.post("/upload-custom-template")
async def upload_custom_template(file: UploadFile = File(...)):
    """
    Upload a custom template image for mockups.
    Returns the generated template ID and URL.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
        
    image_bytes = await file.read()
    try:
        url = storage_service.upload_image_bytes(image_bytes)
        # The filename acts as the template_id (e.g. uuid-1234.png)
        template_id = url.split("/")[-1]
        return {"id": template_id, "url": url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Custom template upload failed: {str(e)}")
