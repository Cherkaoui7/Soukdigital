from io import BytesIO

from defusedxml.ElementTree import ParseError
from defusedxml.ElementTree import parse as defused_parse

from converter.exceptions import FileValidationError, InvalidSVGError


class SVGValidator:
    """
    Validates SVG files for proper structure and content.

    Uses defusedxml for secure XML parsing to prevent XML entity expansion attacks.
    """

    def validate_bytes(self, svg_bytes: bytes) -> None:
        """
        Validate SVG content using defusedxml.

        Args:
            svg_bytes: Bytes of SVG content to validate

        Raises:
            ValidationError: If the SVG is invalid or malformed

        Example:
            >>> validator = SVGValidator()
            >>> validator.validate_bytes(b'<svg></svg>')
        """
        try:
            defused_parse(BytesIO(svg_bytes))
        except ParseError as e:
            raise FileValidationError(f"Invalid SVG: {str(e)}")

    def validate(self, svg_path: str) -> None:
        """
        Validate SVG file using defusedxml.

        Args:
            svg_path: Path to the SVG file to validate

        Raises:
            ValidationError: If the SVG is invalid or malformed
            FileNotFoundError: If the file does not exist

        Example:
            >>> validator = SVGValidator()
            >>> validator.validate("input.svg")
        """
        try:
            with open(svg_path, "rb") as f:
                self.validate_bytes(f.read())
        except FileNotFoundError:
            raise FileValidationError("File not found")
