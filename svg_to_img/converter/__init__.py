"""
SVG Converter — public package API.
"""

from .exceptions import (
    ConversionError,
    UnsupportedFormatError,
)
from .history import HistoryItem, HistoryManager
from .image_utils import ImageUtils
from .metadata_extractor import MetadataExtractor
from .preview_generator import PreviewGenerator
from .svg_converter import ConversionOptions, ConversionResult, SVGConverter
from .svg_renderer import SVGRenderer
from .svg_validator import SVGValidator

__all__ = [
    # Facade + dataclasses
    "SVGConverter",
    "ConversionOptions",
    "ConversionResult",
    # Services
    "SVGValidator",
    "SVGRenderer",
    "ImageUtils",
    "MetadataExtractor",
    "PreviewGenerator",
    "HistoryManager",
    # Supporting types

    "HistoryItem",

    # Exceptions
    "ConversionError",
    "UnsupportedFormatError",
]
