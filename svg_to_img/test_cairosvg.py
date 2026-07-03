import io
from PIL import Image
from cairosvg import svg2png
with open("tests/assets/simple.svg", "rb") as f:
    svg_content = f.read()

png_bytes = svg2png(bytestring=svg_content, background_color=None)
img = Image.open(io.BytesIO(png_bytes))
print("svg2png returned mode:", img.mode)
