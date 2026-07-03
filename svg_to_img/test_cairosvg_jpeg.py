import io
from PIL import Image
from cairosvg import svg2png
with open("tests/assets/transparent.svg", "rb") as f:
    svg_content = f.read()

png_bytes = svg2png(bytestring=svg_content, background_color="#FFFFFF")
img = Image.open(io.BytesIO(png_bytes))
print("svg2png with #FFFFFF returned mode:", img.mode)
print("extrema:", img.getextrema())
