from __future__ import annotations

import customtkinter as ctk
from PIL import Image

# Maximum display size for the preview image (width, height) in pixels.
_MAX_W = 800
_MAX_H = 600

_PLACEHOLDER_ICON = "🖼"
_PLACEHOLDER_TEXT = "Glissez un fichier SVG ici\nou utilisez Fichier → Ouvrir"
_LOADING_TEXT = "Chargement…"


def _fit_size(img_w: int, img_h: int, max_w: int, max_h: int) -> tuple[int, int]:
    """Return (width, height) scaled to fit within *max_w* × *max_h*,
    preserving the original aspect ratio."""
    if img_w <= 0 or img_h <= 0:
        return max_w, max_h
    scale = min(max_w / img_w, max_h / img_h, 1.0)
    return max(1, int(img_w * scale)), max(1, int(img_h * scale))


class PreviewPanel(ctk.CTkFrame):
    """Centre panel that displays the SVG preview image.

    Preview generation is delegated entirely to the caller via the
    *on_preview_request* callback — this widget contains no converter
    logic of its own.
    """

    def __init__(self, parent, *, on_preview_request, **kwargs) -> None:
        kwargs.setdefault("corner_radius", 8)
        super().__init__(parent, **kwargs)

        self._on_preview_request = on_preview_request

        # Current state
        self._current_ctk_image: ctk.CTkImage | None = None

        self._build()
        self.show_placeholder()

    # ------------------------------------------------------------------
    # Layout
    # ------------------------------------------------------------------

    def _build(self) -> None:
        """Construct all child widgets."""

        # Make the single column/row expand so the image label always
        # centres inside the available space.
        self.grid_rowconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=0)
        self.grid_columnconfigure(0, weight=1)

        # ── Image / placeholder label ──────────────────────────────────
        self._image_label = ctk.CTkLabel(
            self,
            text="",
            anchor="center",
        )
        self._image_label.grid(row=0, column=0, sticky="nsew", padx=16, pady=(16, 4))

        # ── Info bar ───────────────────────────────────────────────────
        self._info_bar = ctk.CTkLabel(
            self,
            text="",
            anchor="center",
            font=ctk.CTkFont(size=11),
            text_color="gray55",
            height=22,
        )
        self._info_bar.grid(row=1, column=0, sticky="ew", padx=16, pady=(0, 10))

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _set_text_state(
        self,
        icon: str,
        message: str,
        icon_size: int = 48,
    ) -> None:
        """Show a large icon above *message* in the image label area."""
        self._current_ctk_image = None
        self._image_label.configure(
            image=None,
            text=f"{icon}\n{message}",
            font=ctk.CTkFont(size=icon_size),
            compound="top",
        )
        self._info_bar.configure(text="")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def show_image(self, image: Image.Image, filename: str) -> None:
        """Display *image* scaled to fit the preview area.

        Also updates the info bar with *filename* and the image dimensions.
        """
        img_w, img_h = image.size
        disp_w, disp_h = _fit_size(img_w, img_h, _MAX_W, _MAX_H)

        self._current_ctk_image = ctk.CTkImage(
            light_image=image,
            dark_image=image,
            size=(disp_w, disp_h),
        )
        self._image_label.configure(
            image=self._current_ctk_image,
            text="",
            font=ctk.CTkFont(size=13),
        )
        self.update_info(filename, img_w, img_h)

    def show_placeholder(self) -> None:
        """Show the default drag-and-drop invitation."""
        self._set_text_state(_PLACEHOLDER_ICON, _PLACEHOLDER_TEXT, icon_size=52)

    def show_loading(self) -> None:
        """Show a loading indicator while the preview is being generated."""
        self._set_text_state("⏳", _LOADING_TEXT, icon_size=40)

    def clear(self) -> None:
        """Alias for :meth:`show_placeholder`."""
        self.show_placeholder()

    def update_info(self, filename: str, width: int, height: int) -> None:
        """Update the info bar text below the image."""
        self._info_bar.configure(text=f"{filename}  ·  {width} × {height} px")
