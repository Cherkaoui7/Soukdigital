import io
import os
import uuid
import numpy as np
from PIL import Image, ImageFilter
from backend.core.config import settings

class MockupService:
    def __init__(self):
        self.templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
        self.upload_dir = settings.UPLOAD_DIR

    def generate_mockup(self, 
                        product_bytes: bytes, 
                        template_id: str, 
                        x_percent: float, 
                        y_percent: float, 
                        scale: float, 
                        rotation: float,
                        shadow_opacity: float = 0.5,
                        shadow_offset_y: float = 20.0,
                        shadow_blur: float = 15.0) -> str:
        """
        Composites a transparent product image onto a template background.
        Returns the URL of the generated mockup.
        """
        # 1. Load Template
        template_path = os.path.join(self.templates_dir, f"{template_id}.jpg")
        if not os.path.exists(template_path):
            raise FileNotFoundError(f"Template {template_id} not found.")
            
        bg = Image.open(template_path).convert("RGBA")
        bg_w, bg_h = bg.size

        # 2. Load Product
        product = Image.open(io.BytesIO(product_bytes)).convert("RGBA")
        
        # 3. Scale Product
        # Scale is relative to the background width
        target_w = int(bg_w * scale)
        aspect_ratio = product.height / product.width
        target_h = int(target_w * aspect_ratio)
        product = product.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # 4. Rotate Product
        if rotation != 0:
            product = product.rotate(-rotation, resample=Image.Resampling.BICUBIC, expand=True)
            
        prod_w, prod_h = product.size

        # 5. Calculate absolute coordinates (center of product at x,y)
        abs_x = int(x_percent * bg_w - prod_w / 2)
        abs_y = int(y_percent * bg_h - prod_h / 2)

        # 6. Generate Shadow
        if shadow_opacity > 0:
            # Extract alpha channel to create a shadow mask
            alpha = product.split()[3]
            shadow = Image.new("RGBA", product.size, color=(0, 0, 0, 0))
            shadow.putalpha(alpha)
            
            # Apply opacity
            shadow_data = np.array(shadow)
            shadow_data[:, :, 3] = (shadow_data[:, :, 3] * shadow_opacity).astype(np.uint8)
            shadow = Image.fromarray(shadow_data)
            
            # Apply Blur (need a larger canvas to avoid clipping blur)
            padding = int(shadow_blur * 3)
            shadow_canvas = Image.new("RGBA", (prod_w + padding*2, prod_h + padding*2), (0,0,0,0))
            shadow_canvas.paste(shadow, (padding, padding), shadow)
            shadow_canvas = shadow_canvas.filter(ImageFilter.GaussianBlur(shadow_blur))
            
            # Paste shadow onto background
            shadow_x = abs_x - padding
            shadow_y = abs_y - padding + int(shadow_offset_y)
            bg.paste(shadow_canvas, (shadow_x, shadow_y), shadow_canvas)

        # 7. Paste Product onto Background
        bg.paste(product, (abs_x, abs_y), product)

        # 8. Save Result
        result_bg = bg.convert("RGB")
        file_name = f"mockup_{uuid.uuid4()}.jpg"
        file_path = os.path.join(self.upload_dir, file_name)
        
        result_bg.save(file_path, "JPEG", quality=90)
        
        return f"/uploads/{file_name}"

mockup_service = MockupService()
