import os
import fal_client
import httpx
from backend.core.config import settings

# Ensure fal_client uses the provided key
os.environ["FAL_KEY"] = settings.FAL_KEY

class AIService:
    def map_aspect_ratio(self, ratio: str) -> str:
        mapping = {
            "1:1": "square_hd",
            "16:9": "landscape_16_9",
            "9:16": "portrait_16_9",
            "4:5": "portrait_4_5",
            "3:2": "landscape_3_2",
            "2:3": "portrait_3_2"
        }
        return mapping.get(ratio, "square_hd")

    async def generate_image(self, prompt: str, style: str, aspect_ratio: str, num_inference_steps: int, guidance_scale: float, seed: int = None) -> list[bytes]:
        """
        Calls Fal.ai API (Flux Dev model) to generate an image.
        Returns a list of image bytes.
        """
        full_prompt = prompt
        if style:
            full_prompt = f"{prompt}, in {style} style"

        arguments = {
            "prompt": full_prompt,
            "image_size": self.map_aspect_ratio(aspect_ratio),
            "num_inference_steps": num_inference_steps,
            "guidance_scale": guidance_scale,
            "sync_mode": True,
        }
        if seed:
            arguments["seed"] = seed

        # Using fal-ai/flux/dev as the default high quality model
        # Using synchronous submission since this is already running in a Celery worker
        result = fal_client.subscribe(
            "fal-ai/flux/dev",
            arguments=arguments,
            with_logs=True
        )

        image_urls = []
        if 'images' in result:
            image_urls = [img['url'] for img in result['images']]
        
        # Download images as bytes to store them in MinIO
        image_bytes_list = []
        async with httpx.AsyncClient() as client:
            for url in image_urls:
                resp = await client.get(url)
                if resp.status_code == 200:
                    image_bytes_list.append(resp.content)

        return image_bytes_list

ai_service = AIService()
