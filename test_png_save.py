import io
from PIL import Image

img = Image.new("RGBA", (100, 100), (255, 0, 0, 255))
buf = io.BytesIO()
img.save(buf, format="PNG")
buf.seek(0)
img2 = Image.open(buf)
print("Saved as RGBA, loaded as:", img2.mode)
