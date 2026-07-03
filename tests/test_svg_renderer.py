"""
Tests for converter.svg_renderer.SVGRenderer.

Run from inside svg_to_img/ with:
    pytest tests/test_svg_renderer.py

cairosvg is mocked throughout most tests so the library does not need to be
installed.  The final integration test (test_render_dimensions_respected) uses
the real library and is skipped automatically when cairosvg is unavailable.
"""

from __future__ import annotations

import sys
import types
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest
from PIL import Image


# ---------------------------------------------------------------------------
# Early sys.modules stubs
#
# Several converter sub-modules are empty placeholder files on disk and
# cairosvg may not be installed.  Stubs are injected before any converter
# import.  Individual tests override svg2png via unittest.mock.patch.
# ---------------------------------------------------------------------------
def _make_stub(name: str, **attrs: object) -> types.ModuleType:
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules.setdefault(name, mod)
    return mod


# cairosvg — optional C library; tests patch converter.svg_renderer.cairosvg.svg2png
_cairosvg = _make_stub("cairosvg", svg2png=MagicMock(return_value=b"\x89PNG"))


from converter.exceptions import ConversionError, InvalidSVGError  # noqa: E402
from converter.svg_renderer import SVGRenderer  # noqa: E402
from PIL import Image

# ---------------------------------------------------------------------------
# Shared SVG fixtures
# ---------------------------------------------------------------------------

VALID_SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="red"/></svg>'
VALID_SVG_WITH_VIEWBOX = b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="50"/></svg>'
ANIMATED_SVG = b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100"><animate attributeName="opacity" from="1" to="0" dur="1s"/></rect></svg>'
NO_DIMS_SVG = b'<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
EMPTY_SVG = b""
NOT_SVG = b"<html><body>not svg</body></html>"
CORRUPT_SVG = b"<svg><unclosed"

# ---------------------------------------------------------------------------
# Module-level helpers / small fixtures
# ---------------------------------------------------------------------------

# The exact dotted path that SVGRenderer imports cairosvg through.
_CAIROSVG_PATCH_TARGET = "converter.svg_renderer.cairosvg.svg2png"

# Standard keyword args used in almost every render call.
_RENDER_KWARGS: dict[str, int] = {"width": 200, "height": 150, "dpi": 96}


def _make_png_bytes(width: int = 1, height: int = 1, mode: str = "RGBA") -> bytes:
    """Return real PNG-encoded bytes for a tiny solid-colour image via Pillow."""
    img = Image.new(mode, (width, height), color=(255, 0, 0, 255))
    buf = BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# A 1×1 RGBA PNG that is valid for all Pillow-decode tests.
_REAL_PNG_BYTES = _make_png_bytes()


# ---------------------------------------------------------------------------
# Test class
# ---------------------------------------------------------------------------


class TestSVGRenderer:
    """Unit tests for SVGRenderer.render_to_bytes and .render_to_image."""

    # ------------------------------------------------------------------
    # render_to_bytes — happy paths
    # ------------------------------------------------------------------

    def test_render_to_bytes_returns_bytes(self) -> None:
        """render_to_bytes returns a bytes object when cairosvg succeeds."""
        with patch(_CAIROSVG_PATCH_TARGET, return_value=_REAL_PNG_BYTES):
            renderer = SVGRenderer()
            result = renderer.render_to_bytes(VALID_SVG, **_RENDER_KWARGS)

        assert isinstance(result, bytes)

    def test_render_to_bytes_passes_params(self) -> None:
        """cairosvg.svg2png is called with the exact width, height, and dpi."""
        with patch(
            _CAIROSVG_PATCH_TARGET, return_value=_REAL_PNG_BYTES
        ) as mock_svg2png:
            renderer = SVGRenderer()
            renderer.render_to_bytes(VALID_SVG, width=320, height=240, dpi=144)

        mock_svg2png.assert_called_once_with(
            bytestring=VALID_SVG,
            output_width=320,
            output_height=240,
            dpi=144,
        )

    # ------------------------------------------------------------------
    # render_to_image — happy paths
    # ------------------------------------------------------------------

    def test_render_to_image_returns_image(self) -> None:
        """render_to_image returns a PIL Image instance."""
        with patch(_CAIROSVG_PATCH_TARGET, return_value=_REAL_PNG_BYTES):
            renderer = SVGRenderer()
            result = renderer.render_to_image(VALID_SVG, **_RENDER_KWARGS)

        assert isinstance(result, Image.Image)

    def test_render_to_image_has_correct_mode(self) -> None:
        """The returned image mode is a valid colour mode (not None, not empty)."""
        with patch(_CAIROSVG_PATCH_TARGET, return_value=_REAL_PNG_BYTES):
            renderer = SVGRenderer()
            result = renderer.render_to_image(VALID_SVG, **_RENDER_KWARGS)

        assert result.mode in {"RGBA", "RGB", "P", "L"}, (
            f"Unexpected image mode: {result.mode!r}"
        )

    # ------------------------------------------------------------------
    # render_to_bytes — error paths
    # ------------------------------------------------------------------

    def test_value_error_raises_invalid_svg(self) -> None:
        """ValueError from cairosvg is re-raised as InvalidSVGError."""
        with patch(_CAIROSVG_PATCH_TARGET, side_effect=ValueError("bad xml")):
            renderer = SVGRenderer()

            with pytest.raises(InvalidSVGError):
                renderer.render_to_bytes(CORRUPT_SVG, **_RENDER_KWARGS)

    def test_attribute_error_raises_invalid_svg(self) -> None:
        """AttributeError from cairosvg is re-raised as InvalidSVGError."""
        with patch(_CAIROSVG_PATCH_TARGET, side_effect=AttributeError("None.tree")):
            renderer = SVGRenderer()

            with pytest.raises(InvalidSVGError):
                renderer.render_to_bytes(CORRUPT_SVG, **_RENDER_KWARGS)

    def test_generic_exception_raises_conversion_error(self) -> None:
        """Any other exception from cairosvg is re-raised as ConversionError."""
        with patch(_CAIROSVG_PATCH_TARGET, side_effect=RuntimeError("cairo crash")):
            renderer = SVGRenderer()

            with pytest.raises(ConversionError):
                renderer.render_to_bytes(VALID_SVG, **_RENDER_KWARGS)

    def test_empty_bytes_raises_conversion_error(self) -> None:
        """When cairosvg returns b'', render_to_bytes raises ConversionError."""
        with patch(_CAIROSVG_PATCH_TARGET, return_value=b""):
            renderer = SVGRenderer()

            with pytest.raises(ConversionError):
                renderer.render_to_bytes(VALID_SVG, **_RENDER_KWARGS)

    # ------------------------------------------------------------------
    # render_to_image — error paths
    # ------------------------------------------------------------------

    def test_pillow_decode_failure_raises_conversion_error(self) -> None:
        """
        When render_to_bytes returns non-PNG garbage, Pillow's decode fails
        and render_to_image wraps it in ConversionError.
        """
        garbage = b"\x00\x01\x02\x03 definitely not a png"
        with patch(_CAIROSVG_PATCH_TARGET, return_value=garbage):
            renderer = SVGRenderer()

            with pytest.raises(ConversionError):
                renderer.render_to_image(VALID_SVG, **_RENDER_KWARGS)

    # ------------------------------------------------------------------
    # Integration test (skipped when cairosvg is absent)
    # ------------------------------------------------------------------

    def test_render_dimensions_respected(self) -> None:
        """
        Integration: uses the real cairosvg to render VALID_SVG and checks
        that the resulting image has the requested pixel dimensions.

        Skipped automatically when the *real* cairosvg C library is not
        installed (distinguished from our module-level stub by checking for
        a genuine callable that accepts the bytestring kwarg).
        """
        import importlib

        # Attempt to import the real cairosvg from disk (bypassing sys.modules
        # so our stub does not satisfy the check).
        try:
            spec = importlib.util.find_spec("cairosvg")
            # find_spec returns None when the package is absent.  Our stub
            # is already in sys.modules, so we look at the origin attribute:
            # a genuine install will have a file origin; our ModuleType stub
            # has origin=None.
            real_installed = spec is not None and spec.origin is not None
        except (ValueError, ModuleNotFoundError):
            real_installed = False

        if not real_installed:
            pytest.skip("cairosvg is not installed; skipping integration test.")

        renderer = SVGRenderer()
        target_w, target_h = 64, 48
        result = renderer.render_to_image(
            VALID_SVG,
            width=target_w,
            height=target_h,
            dpi=96,
        )

        assert result.width == target_w
        assert result.height == target_h
