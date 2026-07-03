"""
Tests for converter.metadata_extractor.MetadataExtractor.

Run from inside svg_to_img/ with:
    pytest tests/test_metadata_extractor.py
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
# Several converter sub-modules are empty placeholder files on disk and
# cairosvg may not be installed.  Stubs are injected before any converter
# import is attempted.
# ---------------------------------------------------------------------------
def _make_stub(name: str, **attrs: object) -> types.ModuleType:
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules.setdefault(name, mod)
    return mod


# cairosvg — optional C library
_cairosvg = _make_stub("cairosvg", svg2png=MagicMock(return_value=b"\x89PNG"))


from converter.exceptions import InvalidSVGError  # noqa: E402
from converter.metadata_extractor import MetadataExtractor, SVGMetadata  # noqa: E402

# ---------------------------------------------------------------------------
# Shared SVG fixtures
# ---------------------------------------------------------------------------

VALID_SVG = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
    b'<rect width="100" height="100" fill="red"/></svg>'
)
VALID_SVG_WITH_VIEWBOX = (
    b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">'
    b'<circle cx="100" cy="100" r="50"/></svg>'
)
ANIMATED_SVG = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
    b'<rect width="100" height="100">'
    b'<animate attributeName="opacity" from="1" to="0" dur="1s"/>'
    b"</rect></svg>"
)
NO_DIMS_SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
EMPTY_SVG = b""
NOT_SVG = b"<html><body>not svg</body></html>"
CORRUPT_SVG = b"<svg><unclosed"

# SVG with optional text elements.
SVG_WITH_TITLE = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
    b"<title>My Art</title>"
    b"<rect/>"
    b"</svg>"
)
SVG_WITH_DESC = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
    b"<desc>A description</desc>"
    b"<rect/>"
    b"</svg>"
)
SVG_WITH_TITLE_AND_DESC = (
    b'<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10">'
    b"<title>Full Title</title>"
    b"<desc>Full Description</desc>"
    b"<rect/>"
    b"</svg>"
)

# SVG that uses a namespace-qualified <svg:title> element.
# xml.etree.ElementTree represents "svg:title" as the bare tag "title" when
# declared with xmlns:svg="...", so this exercises the bare-tag lookup branch.
SVG_NAMESPACED_TITLE = (
    b'<svg:svg xmlns:svg="http://www.w3.org/2000/svg" width="10" height="10">'
    b"<svg:title>NS Title</svg:title>"
    b"</svg:svg>"
)

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


class TestMetadataExtractor:
    """Unit tests for MetadataExtractor.extract and .extract_file."""

    # ------------------------------------------------------------------
    # Root attributes
    # ------------------------------------------------------------------

    def test_extract_width_height(self) -> None:
        """VALID_SVG carries width='100' and height='100'."""
        extractor = MetadataExtractor()

        meta = extractor.extract(VALID_SVG)

        assert meta.width == "100"
        assert meta.height == "100"

    def test_extract_viewbox(self) -> None:
        """VALID_SVG_WITH_VIEWBOX carries viewBox='0 0 200 200'."""
        extractor = MetadataExtractor()

        meta = extractor.extract(VALID_SVG_WITH_VIEWBOX)

        assert meta.viewbox == "0 0 200 200"

    # ------------------------------------------------------------------
    # Optional text elements
    # ------------------------------------------------------------------

    def test_extract_title(self) -> None:
        """<title>My Art</title> is extracted into metadata.title."""
        extractor = MetadataExtractor()

        meta = extractor.extract(SVG_WITH_TITLE)

        assert meta.title == "My Art"

    def test_extract_description(self) -> None:
        """<desc>A description</desc> is extracted into metadata.description."""
        extractor = MetadataExtractor()

        meta = extractor.extract(SVG_WITH_DESC)

        assert meta.description == "A description"

    def test_no_title_returns_none(self) -> None:
        """VALID_SVG has no <title> element; metadata.title is None."""
        extractor = MetadataExtractor()

        meta = extractor.extract(VALID_SVG)

        assert meta.title is None

    def test_no_description_returns_none(self) -> None:
        """VALID_SVG has no <desc> element; metadata.description is None."""
        extractor = MetadataExtractor()

        meta = extractor.extract(VALID_SVG)

        assert meta.description is None

    # ------------------------------------------------------------------
    # Animation detection
    # ------------------------------------------------------------------

    def test_has_animations_true(self) -> None:
        """ANIMATED_SVG contains <animate>; has_animations is True."""
        extractor = MetadataExtractor()

        meta = extractor.extract(ANIMATED_SVG)

        assert meta.has_animations is True

    def test_has_animations_false(self) -> None:
        """VALID_SVG has no animation elements; has_animations is False."""
        extractor = MetadataExtractor()

        meta = extractor.extract(VALID_SVG)

        assert meta.has_animations is False

    # ------------------------------------------------------------------
    # Element count
    # ------------------------------------------------------------------

    def test_element_count_correct(self) -> None:
        """VALID_SVG has two elements: <svg> + <rect> = 2."""
        extractor = MetadataExtractor()

        meta = extractor.extract(VALID_SVG)

        # root.iter() yields the root element itself plus all descendants.
        assert meta.element_count == 2

    # ------------------------------------------------------------------
    # Warning on missing dimensions
    # ------------------------------------------------------------------

    def test_no_dims_logs_warning(
        self,
        caplog: pytest.LogCaptureFixture,
    ) -> None:
        """NO_DIMS_SVG triggers a WARNING log from the extractor."""
        extractor = MetadataExtractor()

        with caplog.at_level(logging.WARNING, logger="converter.metadata_extractor"):
            extractor.extract(NO_DIMS_SVG)

        warning_records = [r for r in caplog.records if r.levelno == logging.WARNING]
        assert warning_records, "Expected at least one WARNING log record."

    # ------------------------------------------------------------------
    # Error paths — extract(bytes)
    # ------------------------------------------------------------------

    def test_empty_bytes_raises(self) -> None:
        """extract(b'') raises InvalidSVGError."""
        extractor = MetadataExtractor()

        with pytest.raises(InvalidSVGError):
            extractor.extract(EMPTY_SVG)

    def test_corrupt_svg_raises(self) -> None:
        """extract(CORRUPT_SVG) raises InvalidSVGError (XML parse failure)."""
        extractor = MetadataExtractor()

        with pytest.raises(InvalidSVGError):
            extractor.extract(CORRUPT_SVG)

    # ------------------------------------------------------------------
    # Immutability of SVGMetadata
    # ------------------------------------------------------------------

    def test_metadata_is_frozen(self) -> None:
        """
        SVGMetadata is a frozen dataclass; assigning to a field raises either
        FrozenInstanceError (dataclasses) or AttributeError (slots).
        """
        extractor = MetadataExtractor()
        meta = extractor.extract(VALID_SVG)

        with pytest.raises((AttributeError, TypeError)):
            meta.width = "x"  # type: ignore[misc]

    # ------------------------------------------------------------------
    # extract_file — happy path
    # ------------------------------------------------------------------

    def test_extract_file_reads_disk(self, tmp_path: Path) -> None:
        """extract_file on a valid file returns correct metadata."""
        svg_file = _write(tmp_path, "image.svg", VALID_SVG)
        extractor = MetadataExtractor()

        meta = extractor.extract_file(svg_file)

        assert isinstance(meta, SVGMetadata)
        assert meta.width == "100"
        assert meta.height == "100"

    # ------------------------------------------------------------------
    # extract_file — error paths
    # ------------------------------------------------------------------

    def test_extract_file_missing_raises(self, tmp_path: Path) -> None:
        """extract_file on a nonexistent path raises InvalidSVGError."""
        nonexistent = tmp_path / "ghost.svg"
        extractor = MetadataExtractor()

        with pytest.raises(InvalidSVGError):
            extractor.extract_file(nonexistent)

    # ------------------------------------------------------------------
    # Namespace edge cases
    # ------------------------------------------------------------------

    def test_namespaced_title(self) -> None:
        """
        An SVG using a namespace prefix on its root (svg:svg / svg:title)
        still has its title text extracted correctly.

        xml.etree.ElementTree resolves the prefixed tag to a Clark-notation
        tag when a namespace is declared, so the extractor's bare-tag fallback
        must handle this.
        """
        extractor = MetadataExtractor()

        meta = extractor.extract(SVG_NAMESPACED_TITLE)

        # The title text must be present regardless of how the namespace
        # prefix is used in the source document.
        assert meta.title == "NS Title"
