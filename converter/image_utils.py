import shutil
import tempfile
from pathlib import Path
from typing import Optional, Tuple

from PIL import Image

class ImageUtils:
    def resize(self, image: Image.Image, width: Optional[int] = None, height: Optional[int] = None, keep_aspect_ratio: bool = True) -> Image.Image:
        if width is None and height is None:
            return image.copy()

        original_width, original_height = image.size
        ratio = original_width / original_height

        if width is None:
            width = int(height * ratio)
        elif height is None:
            height = int(width / ratio)

        if keep_aspect_ratio:
            if width / height > ratio:
                width = int(height * ratio)
            else:
                height = int(width / ratio)

        return image.resize((width, height), Image.LANCZOS)

    def _cleanup_temp_files(self, temp_dir: str) -> None:
        try:
            shutil.rmtree(temp_dir)
        except Exception:
            pass

    def save(self, image: Image.Image, output_path: str) -> None:
        temp_dir = tempfile.mkdtemp()
        try:
            ext = Path(output_path).suffix
            if not ext:
                ext = ".png"
            temp_path = Path(temp_dir) / f"temp{ext}"
            
            # For JPEG, PIL expects the format to be "JPEG", which it infers from .jpg or .jpeg
            # but if image is RGBA, it cannot save as JPEG
            if ext.lower() in ('.jpg', '.jpeg') and image.mode in ('RGBA', 'LA'):
                image = image.convert('RGB')

            image.save(str(temp_path))
            shutil.move(str(temp_path), output_path)
        finally:
            self._cleanup_temp_files(temp_dir)
