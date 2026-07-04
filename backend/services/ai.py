import os
import httpx
from backend.core.config import settings

class AIService:
    def map_aspect_ratio(self, ratio: str) -> tuple[int, int]:
        mapping = {
            "1:1": (1024, 1024),
            "16:9": (1024, 576),
            "9:16": (576, 1024),
            "4:5": (800, 1000),
            "3:2": (1024, 683),
            "2:3": (683, 1024)
        }
        return mapping.get(ratio, (1024, 1024))

    async def generate_image(self, prompt: str, style: str, aspect_ratio: str, num_inference_steps: int, guidance_scale: float, seed: int = None) -> list[bytes]:
        """
        Calls Pollinations.ai (Free alternative) to generate an image.
        Returns a list of image bytes.
        """
        full_prompt = prompt
        if style:
            full_prompt = f"{prompt}, in {style} style"

        width, height = self.map_aspect_ratio(aspect_ratio)
        
        url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(full_prompt)}?width={width}&height={height}&nologo=True"
        if seed:
            url += f"&seed={seed}"
            
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.get(url, headers={'User-Agent': 'Mozilla/5.0 SoukDigitalApp'})
            if resp.status_code == 200:
                return [resp.content]
            else:
                raise Exception(f"Failed to generate image from pollinations.ai (status: {resp.status_code})")

    async def remove_background(self, image_bytes: bytes) -> bytes:
        """
        Removes the background from an image using rembg.
        """
        import rembg
        
        # Run rembg synchronously but in an executor to avoid blocking the event loop
        import asyncio
        loop = asyncio.get_event_loop()
        
        # We need to run it in a threadpool
        def process():
            # Using new_session to cache the model across calls if possible,
            # but simplest is just rembg.remove()
            return rembg.remove(image_bytes)
            
        result_bytes = await loop.run_in_executor(None, process)
        return result_bytes

import urllib.parse
ai_service = AIService()
