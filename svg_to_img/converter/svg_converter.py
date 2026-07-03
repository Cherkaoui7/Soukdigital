from dataclasses import dataclass
from typing import Optional

from converter.exceptions import ConversionError
from converter.history import HistoryManager
from converter.image_utils import ImageUtils
from converter.metadata_extractor import MetadataExtractor
from converter.svg_renderer import SVGRenderer
from converter.svg_validator import SVGValidator


@dataclass
class ConversionOptions:
    """
    Options for SVG to image conversion.

    Attributes:
        output_format: Output image format (png, jpeg, webp, pdf)
        width: Target width in pixels (optional)
        height: Target height in pixels (optional)
        dpi: Dots per inch for the output image
        quality: Quality setting for the output image (1-100)
        keep_aspect_ratio: Whether to maintain aspect ratio during resize
        transparent_background: Whether to preserve transparency
        background_color: Background color for non-transparent areas
    """

    output_format: str = "png"
    width: Optional[int] = None
    height: Optional[int] = None
    dpi: int = 72
    quality: int = 90
    keep_aspect_ratio: bool = True
    transparent_background: bool = False
    background_color: str = "#FFFFFF"


@dataclass
class ConversionResult:
    """
    Result of an SVG to image conversion.

    Attributes:
        success: Whether the conversion succeeded
        input_path: Path to the input SVG file
        output_path: Path to the output image file
        duration: Time taken for the conversion in seconds
        width: Width of the output image in pixels
        height: Height of the output image in pixels
        output_size: Size of the output file in bytes
        output_format: Format of the output image
        error: Error message if conversion failed (optional)
    """

    success: bool
    input_path: str
    output_path: str
    duration: float
    width: int
    height: int
    output_size: int
    output_format: str
    error: Optional[str] = None


class SVGConverter:
    """
    Facade for SVG to image conversion.

    Coordinates between all conversion services and provides a simple interface for the UI.
    """

    def __init__(
        self,
        validator: Optional[SVGValidator] = None,
        renderer: Optional[SVGRenderer] = None,
        image_utils: Optional[ImageUtils] = None,
        metadata_extractor: Optional[MetadataExtractor] = None,
        history_manager: Optional[HistoryManager] = None,
    ):
        """
        Initialize the SVGConverter with optional services.

        Args:
            validator: SVGValidator instance (optional)
            renderer: SVGRenderer instance (optional)
            image_utils: ImageUtils instance (optional)
            metadata_extractor: MetadataExtractor instance (optional)
            history_manager: HistoryManager instance (optional)
        """
        self.validator = validator or SVGValidator()
        self.renderer = renderer or SVGRenderer()
        self.image_utils = image_utils or ImageUtils()
        self.metadata_extractor = metadata_extractor or MetadataExtractor()
        self.history_manager = history_manager or HistoryManager()

    def convert(
        self, source: str, destination: str, options: Optional[ConversionOptions] = None
    ) -> ConversionResult:
        """
        Convert an SVG file to an image with specified options.

        Args:
            source: Path to the input SVG file
            destination: Path to save the output image
            options: Conversion options (default: ConversionOptions())

        Returns:
            ConversionResult: Result of the conversion

        Example:
            >>> converter = SVGConverter()
            >>> result = converter.convert("input.svg", "output.png")
        """
        options = options or ConversionOptions()

        from dataclasses import asdict
        from PIL import Image
        try:
            # Validation
            self.validator.validate(source)

            # Rendering
            image = self.renderer.render(source, options)

            # Saving
            self.image_utils.save(image, destination)

            # Metadata and history
            metadata = self.metadata_extractor.extract(source)
            meta_dict = asdict(metadata)
            try:
                self.history_manager.add(str(source), str(destination), meta_dict)
            except Exception:
                pass

            return self._success_result(source, destination, meta_dict)

        except ConversionError as e:
            return self._failure_result(source, destination, e)
        except Exception as e:
            return self._failure_result(source, destination, ConversionError(str(e)))

    def _success_result(
        self, source: str, destination: str, metadata: dict
    ) -> ConversionResult:
        """
        Create a successful conversion result.

        Args:
            source: Path to the input SVG file
            destination: Path to the output image file
            metadata: Extracted metadata from the SVG

        Returns:
            ConversionResult: Successful conversion result
        """
        return ConversionResult(
            success=True,
            input_path=source,
            output_path=destination,
            duration=0.0,  # Should be measured in actual implementation
            width=metadata.get("width", 0),
            height=metadata.get("height", 0),
            output_size=0,  # Should be measured in actual implementation
            output_format=metadata.get("format", "unknown"),
        )

    def get_metadata(self, svg_path: str):
        self.validator.validate(svg_path)
        return self.metadata_extractor.extract(svg_path)
        
    def create_preview(self, svg_path: str, max_size: int = 100):
        self.validator.validate(svg_path)
        options = ConversionOptions(width=max_size, height=max_size, keep_aspect_ratio=True)
        return self.renderer.render(svg_path, options)

    def _failure_result(
        self, source: str, destination: str, error: Exception
    ) -> ConversionResult:
        """
        Create a failed conversion result.

        Args:
            source: Path to the input SVG file
            destination: Path to the output image file
            error: Exception that caused the failure

        Returns:
            ConversionResult: Failed conversion result
        """
        return ConversionResult(
            success=False,
            input_path=source,
            output_path=destination,
            duration=0.0,
            width=0,
            height=0,
            output_size=0,
            output_format="unknown",
            error=error,
        )
