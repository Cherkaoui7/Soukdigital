"""Preview generation service."""

from __future__ import annotations

import logging
from pathlib import Path

from PIL import Image

from .exceptions import PreviewGenerationError
from .image_utils import ImageUtils
from .svg_renderer import SVGRenderer

logger = logging.getLogger(__name__)

# Default bounding box for generated previews.
PREVIEW_SIZE: tuple[int, int] = (400, 400)

# DPI used when rasterising SVGs for preview purposes.  A lower value than
# the full-quality render keeps preview generation fast.
_PREVIEW_DPI: int = 96


class PreviewGenerator:
    """
    Generates small, fast preview images from SVG bytes or files.

    The generator delegates rendering to an :class:`SVGRenderer` instance
    and optional post-processing to :class:`ImageUtils`.  All errors are
    wrapped in :class:`PreviewGenerationError` so callers receive a single,
    predictable exception type.

    Parameters
    ----------
    renderer:
        SVG-to-image renderer.  A new :class:`SVGRenderer` is created when
        ``None`` is passed (the default).
    image_utils:
        Image utility class used for thumbnail resizing.  Defaults to the
        built-in :class:`ImageUtils`.
    """

    def __init__(
        self,
        renderer: SVGRenderer | None = None,
        image_utils: type[ImageUtils] = ImageUtils,
    ) -> None:
        self._renderer = renderer or SVGRenderer()
        self._image_utils = image_utils

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def generate(
        self,
        svg_bytes: bytes,
        *,
        width: int = PREVIEW_SIZE[0],
        height: int = PREVIEW_SIZE[1],
    ) -> Image.Image:
        """
        Render *svg_bytes* and return a thumbnail-sized Pillow ``Image``.

        The SVG is rendered at the requested *width* × *height* and then
        fitted inside the same bounding box using :meth:`ImageUtils.thumbnail`
        so that the aspect ratio is always preserved.

        Parameters
        ----------
        svg_bytes:
            Raw SVG document bytes.
        width:
            Maximum width of the generated preview in pixels.
            Defaults to :data:`PREVIEW_SIZE` width (400).
        height:
            Maximum height of the generated preview in pixels.
            Defaults to :data:`PREVIEW_SIZE` height (400).

        Returns
        -------
        Image.Image
            Preview image; mode is typically ``RGBA``.

        Raises
        ------
        PreviewGenerationError
            When rendering or post-processing fails for any reason.
        """

        if not svg_bytes:
            raise PreviewGenerationError(
                "<bytes>",
                "Cannot generate a preview from empty SVG bytes.",
            )

        logger.info(
            "Generating preview: max %dx%d @ %d dpi.",
            width,
            height,
            _PREVIEW_DPI,
        )

        try:
            image: Image.Image = self._renderer.render_to_image(
                svg_bytes,
                width=width,
                height=height,
                dpi=_PREVIEW_DPI,
            )
        except Exception as exc:
            logger.error("SVG rendering failed during preview generation: %s", exc)
            raise PreviewGenerationError(
                "<bytes>",
                f"Rendering error: {exc}",
            ) from exc

        # Fit the rendered image inside the requested bounding box.
        # ImageUtils.thumbnail accepts a single `maximum` value, so we
        # use the larger of the two dimensions to preserve aspect ratio.
        maximum = max(width, height)
        try:
            image = self._image_utils.thumbnail(image, maximum=maximum)
        except Exception as exc:
            # Thumbnail failure is non-fatal if we already have a rendered
            # image; log a warning and fall back to the unscaled render.
            logger.warning(
                "Thumbnail resize failed (%s); using raw render instead.",
                exc,
            )

        logger.info(
            "Preview generated successfully: %dx%d mode=%s.",
            image.width,
            image.height,
            image.mode,
        )
        return image

    def generate_from_file(self, path: str | Path) -> Image.Image:
        """
        Read an SVG file from disk and generate a preview image.

        Parameters
        ----------
        path:
            Filesystem path to the ``.svg`` file.

        Returns
        -------
        Image.Image
            Preview image.

        Raises
        ------
        PreviewGenerationError
            When the file cannot be read, or when preview generation fails.
        """

        path = Path(path).resolve()

        logger.info("Generating preview from file: '%s'.", path.name)

        try:
            svg_bytes = path.read_bytes()
        except OSError as exc:
            logger.error("Cannot read SVG file '%s': %s", path, exc)
            raise PreviewGenerationError(
                path,
                f"File could not be read: {exc}",
            ) from exc

        try:
            return self.generate(svg_bytes)
        except PreviewGenerationError:
            # Already the right type — just re-raise with the real file path
            # so the caller gets a meaningful message.
            raise
        except Exception as exc:
            logger.error(
                "Unexpected error generating preview for '%s': %s",
                path.name,
                exc,
            )
            raise PreviewGenerationError(
                path,
                f"Unexpected error: {exc}",
            ) from exc
