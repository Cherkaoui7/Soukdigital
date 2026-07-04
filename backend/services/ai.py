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

    async def generate_image(self, prompt: str, style: str, aspect_ratio: str, num_inference_steps: int, guidance_scale: float, num_images: int = 1, seed: int = None) -> list[bytes]:
        """
        Calls Pollinations.ai (Free alternative) to generate an image.
        Returns a list of image bytes.
        """
        import random
        import asyncio
        import urllib.parse
        
        full_prompt = prompt
        if style:
            full_prompt = f"{prompt}, in {style} style"

        width, height = self.map_aspect_ratio(aspect_ratio)
        
        async def fetch_one(i: int):
            current_seed = seed if seed else random.randint(1, 1000000) + i
            url = f"https://image.pollinations.ai/prompt/{urllib.parse.quote(full_prompt)}?width={width}&height={height}&nologo=True&seed={current_seed}"
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.get(url, headers={'User-Agent': 'Mozilla/5.0 SoukDigitalApp'})
                if resp.status_code == 200:
                    return resp.content
                else:
                    raise Exception(f"Failed to generate image from pollinations.ai (status: {resp.status_code})")
        
        tasks = [fetch_one(i) for i in range(num_images)]
        return await asyncio.gather(*tasks)

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

    # Global cache for the upscaler model
    _upscaler_model = None

    async def upscale_image(self, image_bytes: bytes, scale: int = 4) -> bytes:
        """
        Upscales an image using Real-ESRGAN (High Quality x4plus).
        """
        import cv2
        import numpy as np
        import os
        import requests
        from realesrgan import RealESRGANer
        from basicsr.archs.rrdbnet_arch import RRDBNet
        import asyncio
        
        loop = asyncio.get_event_loop()
        
        def process():
            # 1. Load image from bytes
            image_array = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
            if img is None:
                raise Exception("Failed to decode image.")
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # 2. Setup model if not already cached
            if self.__class__._upscaler_model is None:
                model_name = 'RealESRGAN_x4plus'
                model_path = f'weights/{model_name}.pth'
                
                if not os.path.exists(model_path):
                    os.makedirs("weights", exist_ok=True)
                    url = f"https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/{model_name}.pth"
                    r = requests.get(url, stream=True)
                    with open(model_path, 'wb') as f:
                        for chunk in r.iter_content(chunk_size=8192):
                            if chunk:
                                f.write(chunk)
                                
                device = 'cuda' if cv2.cuda.getCudaEnabledDeviceCount() > 0 else 'cpu'
                # Initialize high-quality RRDBNet model
                model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=4)
                
                self.__class__._upscaler_model = RealESRGANer(
                    scale=4, 
                    model_path=model_path,
                    model=model,
                    tile=0,
                    tile_pad=10,
                    pre_pad=0,
                    half=False # Use True if running out of memory on GPU
                )
            
            # 4. Process image
            output, _ = self.__class__._upscaler_model.enhance(img, outscale=scale)
            
            # 5. Convert back to bytes
            output = cv2.cvtColor(output, cv2.COLOR_RGB2BGR)
            _, buffer = cv2.imencode('.png', output)
            return buffer.tobytes()
            
        return await loop.run_in_executor(None, process)

import urllib.parse
ai_service = AIService()
