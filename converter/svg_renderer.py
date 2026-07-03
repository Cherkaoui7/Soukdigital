from typing import Optional
from io import BytesIO

from cairosvg import svg2pdf, svg2png
from typing import TYPE_CHECKING

from PIL import Image

from converter.exceptions import RenderError

if TYPE_CHECKING:
    from converter.svg_converter import ConversionOptions

class SVGRenderer:
    def render(self, svg_path: str, options: "ConversionOptions") -> Image.Image:
        try:
            if options.output_format.lower() == "pdf":
                return self._render_to_pdf(svg_path, options)
            else:
                return self._render_to_image(svg_path, options)
        except Exception as e:
            raise RenderError(f"Rendering failed: {str(e)}")

    def _render_to_image(self, svg_path: str, options: "ConversionOptions") -> Image.Image:
        with open(svg_path, "rb") as f:
            svg_content = f.read()

        # If transparent_background is requested AND format supports it (like PNG), no background.
        # But wait, if transparent_background is True, we don't apply background_color.
        bg_color = None if options.transparent_background else options.background_color

        png_bytes = svg2png(
            bytestring=svg_content,
            write_to=None,
            output_width=options.width,
            output_height=options.height,
            dpi=options.dpi,
            background_color=bg_color,
        )

        image = Image.open(BytesIO(png_bytes))

        # PNG can be RGBA.
        # JPEG does not support RGBA. We convert non-PNG formats to RGB.
        if options.output_format.upper() != "PNG":
            if image.mode in ('RGBA', 'LA'):
                # composite against a white background if no bg_color was applied
                bg = Image.new("RGB", image.size, options.background_color or "#FFFFFF")
                bg.paste(image, mask=image.split()[-1])
                image = bg
            else:
                image = image.convert("RGB")
        
        return image

    def _render_to_pdf(self, svg_path: str, options: "ConversionOptions") -> Image.Image:
        with open(svg_path, "rb") as f:
            svg_content = f.read()

        bg_color = None if options.transparent_background else options.background_color

        pdf_bytes = svg2pdf(
            bytestring=svg_content,
            write_to=None,
            output_width=options.width,
            output_height=options.height,
            dpi=options.dpi,
            background_color=bg_color,
        )

        return Image.new("RGB", (800, 600), color="white")
