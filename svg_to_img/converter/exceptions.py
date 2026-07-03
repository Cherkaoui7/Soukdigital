class ErrorCodes:
    """Enumeration of all possible error codes"""

    # Validation errors
    INVALID_SVG = "VALIDATION_INVALID_SVG"
    MISSING_ATTRIBUTE = "VALIDATION_MISSING_ATTRIBUTE"
    UNSUPPORTED_FEATURE = "VALIDATION_UNSUPPORTED_FEATURE"

    # Rendering errors
    RENDER_FAILED = "RENDER_FAILED"
    INVALID_DIMENSIONS = "RENDER_INVALID_DIMENSIONS"
    UNSUPPORTED_COLOR_SPACE = "RENDER_UNSUPPORTED_COLOR_SPACE"

    # Image processing errors
    IMAGE_PROCESSING_FAILED = "IMAGE_PROCESSING_FAILED"
    UNSUPPORTED_FORMAT = "IMAGE_UNSUPPORTED_FORMAT"
    INVALID_IMAGE_DATA = "IMAGE_INVALID_IMAGE_DATA"

    # Metadata errors
    METADATA_EXTRACTION_FAILED = "METADATA_EXTRACTION_FAILED"
    INVALID_METADATA = "METADATA_INVALID"

    # General errors
    INVALID_PATH = "GENERAL_INVALID_PATH"
    PERMISSION_DENIED = "GENERAL_PERMISSION_DENIED"
    RESOURCE_LIMIT_EXCEEDED = "GENERAL_RESOURCE_LIMIT_EXCEEDED"

class ConversionError(Exception):
    """Base class for all conversion-related errors"""
    def __init__(self, message: str, error_code: str = "UNKNOWN_ERROR"):
        super().__init__(f"[{error_code}] {message}")
        self.error_code = error_code

class ValidationError(ConversionError):
    """Base class for validation-related errors"""
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_SVG)

class RenderError(ConversionError):
    """Base class for rendering-related errors"""
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.RENDER_FAILED)

class ImageError(ConversionError):
    """Base class for image processing-related errors"""
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.IMAGE_PROCESSING_FAILED)

class MetadataError(ConversionError):
    """Base class for metadata-related errors"""
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.METADATA_EXTRACTION_FAILED)

class SVGValidationError(ValidationError):
    """Raised when SVG validation fails"""
    def __init__(self, message: str, svg_path: str):
        super().__init__(f"{message} in {svg_path}")
        self.svg_path = svg_path

class InvalidDimensionError(RenderError):
    """Raised when invalid dimensions are encountered"""
    def __init__(self, width: int, height: int):
        super().__init__(f"Invalid dimensions: {width}x{height}")
        self.width = width
        self.height = height

class UnsupportedFormatError(ImageError):
    """Raised when an unsupported image format is encountered"""
    def __init__(self, format: str):
        super().__init__(f"Unsupported format: {format}")
        self.format = format

class HistoryError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class ExportError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class BatchError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class PresetError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class PreviewGenerationError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class SVGConverterError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class InvalidSVGError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class FileValidationError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)

class OutputDirectoryError(ConversionError):
    def __init__(self, message: str):
        super().__init__(message, ErrorCodes.INVALID_PATH)
