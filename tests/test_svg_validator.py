"""
Tests for converter.svg_validator.SVGValidator.

Run from inside svg_to_img/ with:
    pytest tests/test_svg_validator.py
"""

from __future__ import annotations

import logging
import sys
import types
from pathlib import Path
from unittest.mock import MagicMock

import pytest


# ---------------------------------------------------------------------------
# Early sys.modules stubs
#
# Several converter sub-modules are empty placeholder files on disk
# (history.py, batch.py, presets.py) and the cairosvg library may not be
# installed.  converter/__init__.py imports from all of them, so we inject
# lightweight stubs before any converter import is attempted.
# ---------------------------------------------------------------------------
def _make_stub(name: str, **attrs: object) -> types.ModuleType:
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules.setdefault(name, mod)
    return mod


# cairosvg — optional C library
_cairosvg = _make_stub("cairosvg", svg2png=MagicMock(return_value=b"\x89PNG"))


from converter.exceptions import FileValidationError, InvalidSVGError  # noqa: E402
from converter.svg_validator import SVGValidator  # noqa: E402

# ---------------------------------------------------------------------------
# Shared SVG fixtures (bytes literals used throughout all test files)
# ---------------------------------------------------------------------------

VALID_SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>'
VALID_SVG_WITH_VIEWBOX = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="50"/></svg>'
ANIMATED_SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100"><animate attributeName="opacity" from="1" to="0" dur="1s"/></rect></svg>'
NO_DIMS_SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
EMPTY_SVG = b""
NOT_SVG = b"<html><body>not svg</body></html>"
CORRUPT_SVG = b"<svg><unclosed"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _write(tmp_path: Path, filename: str, content: bytes) -> Path:
    """Write *content* to *tmp_path / filename* and return the full path."""
    p = tmp_path / filename
    p.write_bytes(content)
    return p


# ---------------------------------------------------------------------------
# Test class
# ---------------------------------------------------------------------------


class TestSVGValidator:
    """Unit tests for SVGValidator.validate_file and .validate_bytes."""

    # ------------------------------------------------------------------
    # validate_file — happy paths
    # ------------------------------------------------------------------

    def test_valid_file_returns_path(self, tmp_path: Path) -> None:
        """validate_file on a well-formed SVG returns a Path object."""
        svg_file = _write(tmp_path, "image.svg", VALID_SVG)
        validator = SVGValidator()

        result = validator.validate_file(svg_file)

        assert isinstance(result, Path)

    def test_valid_file_is_resolved(self, tmp_path: Path) -> None:
        """The returned path must be absolute (fully resolved)."""
        svg_file = _write(tmp_path, "image.svg", VALID_SVG)
        validator = SVGValidator()

        result = validator.validate_file(svg_file)

        assert result.is_absolute()

    def test_viewbox_svg_passes(self, tmp_path: Path) -> None:
        """An SVG that uses viewBox instead of width/height is still valid."""
        svg_file = _write(tmp_path, "viewbox.svg", VALID_SVG_WITH_VIEWBOX)
        validator = SVGValidator()

        # Should not raise.
        result = validator.validate_file(svg_file)

        assert isinstance(result, Path)

    def test_case_insensitive_extension(self, tmp_path: Path) -> None:
        """Uppercase .SVG extension is accepted (case-insensitive check)."""
        svg_file = _write(tmp_path, "IMAGE.SVG", VALID_SVG)
        validator = SVGValidator()

        result = validator.validate_file(svg_file)

        assert isinstance(result, Path)

    def test_unicode_filename(self, tmp_path: Path) -> None:
        """Files with non-ASCII names (Arabic) are accepted."""
        svg_file = _write(tmp_path, "ملف.svg", VALID_SVG)
        validator = SVGValidator()

        result = validator.validate_file(svg_file)

        assert isinstance(result, Path)

    # ------------------------------------------------------------------
    # validate_file — error paths
    # ------------------------------------------------------------------

    def test_missing_file_raises(self, tmp_path: Path) -> None:
        """A nonexistent path raises FileValidationError."""
        nonexistent = tmp_path / "ghost.svg"
        validator = SVGValidator()

        with pytest.raises(FileValidationError):
            validator.validate_file(nonexistent)

    def test_directory_raises(self, tmp_path: Path) -> None:
        """Passing a directory (not a file) raises FileValidationError."""
        validator = SVGValidator()

        with pytest.raises(FileValidationError):
            validator.validate_file(tmp_path)

    def test_wrong_extension_raises(self, tmp_path: Path) -> None:
        """A valid SVG content saved with a .png extension raises FileValidationError."""
        png_file = _write(tmp_path, "image.png", VALID_SVG)
        validator = SVGValidator()

        with pytest.raises(FileValidationError):
            validator.validate_file(png_file)

    def test_empty_file_raises(self, tmp_path: Path) -> None:
        """An empty .svg file raises InvalidSVGError."""
        empty_file = _write(tmp_path, "empty.svg", EMPTY_SVG)
        validator = SVGValidator()

        with pytest.raises(InvalidSVGError):
            validator.validate_file(empty_file)

    def test_not_svg_file_raises(self, tmp_path: Path) -> None:
        """A .svg file whose content is HTML raises InvalidSVGError."""
        html_file = _write(tmp_path, "not_svg.svg", NOT_SVG)
        validator = SVGValidator()

        with pytest.raises(InvalidSVGError):
            validator.validate_file(html_file)

    # ------------------------------------------------------------------
    # validate_file — warning paths
    # ------------------------------------------------------------------

    def test_no_dimensions_logs_warning(
        self,
        tmp_path: Path,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """validate_file on an SVG without width/height/viewBox logs a WARNING."""
        no_dims_file = _write(tmp_path, "no_dims.svg", NO_DIMS_SVG)
        validator = SVGValidator()

        with caplog.at_level(logging.WARNING, logger="converter.svg_validator"):
            validator.validate_file(no_dims_file)

        warning_records = [r for r in caplog.records if r.levelno == logging.WARNING]
        assert warning_records, "Expected at least one WARNING log record."

    # ------------------------------------------------------------------
    # validate_bytes — happy paths
    # ------------------------------------------------------------------

    def test_valid_bytes_passes(self) -> None:
        """validate_bytes on well-formed SVG bytes does not raise."""
        validator = SVGValidator()
        # Should complete without raising any exception.
        validator.validate_bytes(VALID_SVG)

    # ------------------------------------------------------------------
    # validate_bytes — error paths
    # ------------------------------------------------------------------

    def test_empty_bytes_raises(self) -> None:
        """validate_bytes on empty bytes raises InvalidSVGError."""
        validator = SVGValidator()

        with pytest.raises(InvalidSVGError):
            validator.validate_bytes(EMPTY_SVG)

    def test_not_svg_bytes_raises(self) -> None:
        """validate_bytes on HTML bytes raises InvalidSVGError."""
        validator = SVGValidator()

        with pytest.raises(InvalidSVGError):
            validator.validate_bytes(NOT_SVG)
