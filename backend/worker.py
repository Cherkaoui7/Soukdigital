from celery import Celery
import asyncio
from backend.core.config import settings
from backend.db.session import SessionLocal
from backend.models.generation import ImageGeneration, GenerationStatus
from backend.services.ai import ai_service
from backend.services.storage import storage_service
from sqlalchemy.orm import Session
import datetime

celery_app = Celery(
    "souk_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.task_routes = {
    "backend.worker.generate_image_task": "main-queue"
}

@celery_app.task(name="backend.worker.generate_image_task", bind=True, max_retries=3)
def generate_image_task(self, generation_id: int):
    """
    Celery task that runs the AI image generation synchronously to avoid event loop issues in Celery,
    though it calls an async method by running the event loop.
    """
    db: Session = SessionLocal()
    generation = db.query(ImageGeneration).filter(ImageGeneration.id == generation_id).first()
    
    if not generation:
        db.close()
        return

    generation.status = GenerationStatus.PROCESSING.value
    db.commit()

    try:
        # Run async ai_service in sync context
        loop = asyncio.get_event_loop()
        if loop.is_closed():
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
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()
