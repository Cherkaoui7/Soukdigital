from __future__ import annotations

from typing import Any

import customtkinter as ctk

_FORMATS = ["PNG", "JPEG", "WEBP", "PDF"]
_DEFAULT_FORMAT = "PNG"
_DEFAULT_QUALITY = 90
_DEFAULT_DPI = "96"
_DEFAULT_BG_COLOR = "#FFFFFF"
_NO_PRESETS_LABEL = "— aucun —"


class SettingsPanel(ctk.CTkFrame):
    """Right-side panel exposing all conversion options.

    All preset callbacks are injected via constructor — this widget
    contains no backend logic of its own.
    """

    def __init__(
        self,
        parent,
        *,
        on_apply_preset,
        on_save_preset,
        **kwargs,
    ) -> None:
        kwargs.setdefault("width", 260)
        kwargs.setdefault("corner_radius", 0)
        super().__init__(parent, **kwargs)

        self._on_apply_preset = on_apply_preset
        self._on_save_preset = on_save_preset

        # Prevent the frame from shrinking to its children
        self.pack_propagate(False)

        # Internal StringVar / IntVar / DoubleVar for each setting
        self._format_var = ctk.StringVar(value=_DEFAULT_FORMAT)
        self._width_var = ctk.StringVar()
        self._height_var = ctk.StringVar()
        self._keep_aspect_var = ctk.BooleanVar(value=True)
        self._quality_var = ctk.DoubleVar(value=_DEFAULT_QUALITY)
        self._dpi_var = ctk.StringVar(value=_DEFAULT_DPI)
        self._bg_mode_var = ctk.StringVar(value="transparent")
        self._bg_color_var = ctk.StringVar(value=_DEFAULT_BG_COLOR)

        self._build()

    # ------------------------------------------------------------------
    # Layout helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _section_label(parent, text: str) -> ctk.CTkLabel:
        """Return a bold section-header label."""
        return ctk.CTkLabel(
            parent,
            text=text,
            font=ctk.CTkFont(weight="bold"),
            anchor="w",
        )

    # ------------------------------------------------------------------
    # Layout
    # ------------------------------------------------------------------

    def _build(self) -> None:  # noqa: PLR0915
        """Construct all setting sections inside a scrollable container."""

        PAD_X = 12
        INNER_PAD_X = (PAD_X, PAD_X)
        SECTION_PAD_Y = (14, 2)
        WIDGET_PAD_Y = (0, 6)

        scroll = ctk.CTkScrollableFrame(self, fg_color="transparent", corner_radius=0)
        scroll.pack(fill="both", expand=True)
        scroll.grid_columnconfigure(0, weight=1)

        row = 0  # running row counter inside the scrollable frame

        # ── Format ────────────────────────────────────────────────────
        self._section_label(scroll, "Format de sortie").grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=SECTION_PAD_Y
        )
        row += 1

        self._format_seg = ctk.CTkSegmentedButton(
            scroll,
            values=_FORMATS,
            variable=self._format_var,
        )
        self._format_seg.grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=WIDGET_PAD_Y
        )
        row += 1

        # ── Dimensions ────────────────────────────────────────────────
        self._section_label(scroll, "Dimensions").grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=SECTION_PAD_Y
        )
        row += 1

        dim_frame = ctk.CTkFrame(scroll, fg_color="transparent")
        dim_frame.grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=WIDGET_PAD_Y
        )
        dim_frame.grid_columnconfigure((0, 1), weight=1)
        row += 1

        self._width_entry = ctk.CTkEntry(
            dim_frame,
            placeholder_text="Largeur",
            textvariable=self._width_var,
        )
        self._width_entry.grid(row=0, column=0, sticky="ew", padx=(0, 4))

        self._height_entry = ctk.CTkEntry(
            dim_frame,
            placeholder_text="Hauteur",
            textvariable=self._height_var,
        )
        self._height_entry.grid(row=0, column=1, sticky="ew", padx=(4, 0))

        self._keep_aspect_cb = ctk.CTkCheckBox(
            scroll,
            text="Conserver les proportions",
            variable=self._keep_aspect_var,
            onvalue=True,
            offvalue=False,
        )
        self._keep_aspect_cb.grid(
            row=row, column=0, sticky="w", padx=INNER_PAD_X, pady=WIDGET_PAD_Y
        )
        row += 1

        # ── Quality / DPI ─────────────────────────────────────────────
        self._section_label(scroll, "Qualité / DPI").grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=SECTION_PAD_Y
        )
        row += 1

        quality_row = ctk.CTkFrame(scroll, fg_color="transparent")
        quality_row.grid(row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=(0, 2))
        quality_row.grid_columnconfigure(0, weight=1)
        row += 1

        self._quality_slider = ctk.CTkSlider(
            quality_row,
            from_=1,
            to=100,
            variable=self._quality_var,
            command=self._on_quality_change,
        )
        self._quality_slider.grid(row=0, column=0, sticky="ew", padx=(0, 6))

        self._quality_value_label = ctk.CTkLabel(
            quality_row,
            text=str(int(_DEFAULT_QUALITY)),
            width=32,
            anchor="e",
        )
        self._quality_value_label.grid(row=0, column=1)

        self._dpi_entry = ctk.CTkEntry(
            scroll,
            placeholder_text="DPI",
            textvariable=self._dpi_var,
        )
        self._dpi_entry.grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=WIDGET_PAD_Y
        )
        row += 1

        # ── Background ────────────────────────────────────────────────
        self._section_label(scroll, "Arrière-plan").grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=SECTION_PAD_Y
        )
        row += 1

        self._radio_transparent = ctk.CTkRadioButton(
            scroll,
            text="Transparent",
            variable=self._bg_mode_var,
            value="transparent",
            command=self._on_bg_mode_change,
        )
        self._radio_transparent.grid(
            row=row, column=0, sticky="w", padx=INNER_PAD_X, pady=(0, 2)
        )
        row += 1

        self._radio_solid = ctk.CTkRadioButton(
            scroll,
            text="Couleur unie",
            variable=self._bg_mode_var,
            value="solid",
            command=self._on_bg_mode_change,
        )
        self._radio_solid.grid(
            row=row, column=0, sticky="w", padx=INNER_PAD_X, pady=(0, 4)
        )
        row += 1

        self._bg_color_entry = ctk.CTkEntry(
            scroll,
            placeholder_text="#FFFFFF",
            textvariable=self._bg_color_var,
            state="disabled",
        )
        self._bg_color_entry.grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=WIDGET_PAD_Y
        )
        row += 1

        # ── Presets ───────────────────────────────────────────────────
        self._section_label(scroll, "Préréglage").grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=SECTION_PAD_Y
        )
        row += 1

        self._preset_menu = ctk.CTkOptionMenu(
            scroll,
            values=[_NO_PRESETS_LABEL],
        )
        self._preset_menu.grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=WIDGET_PAD_Y
        )
        row += 1

        preset_btn_row = ctk.CTkFrame(scroll, fg_color="transparent")
        preset_btn_row.grid(
            row=row, column=0, sticky="ew", padx=INNER_PAD_X, pady=(0, 16)
        )
        preset_btn_row.grid_columnconfigure((0, 1), weight=1)
        row += 1

        ctk.CTkButton(
            preset_btn_row,
            text="Appliquer",
            command=self._on_apply_click,
        ).grid(row=0, column=0, sticky="ew", padx=(0, 4))

        ctk.CTkButton(
            preset_btn_row,
            text="Enregistrer",
            fg_color="transparent",
            border_width=1,
            command=self._on_save_preset,
        ).grid(row=0, column=1, sticky="ew", padx=(4, 0))

    # ------------------------------------------------------------------
    # Internal callbacks
    # ------------------------------------------------------------------

    def _on_quality_change(self, value: float) -> None:
        self._quality_value_label.configure(text=str(int(value)))

    def _on_bg_mode_change(self) -> None:
        """Enable or disable the color entry based on the selected mode."""
        if self._bg_mode_var.get() == "solid":
            self._bg_color_entry.configure(state="normal")
        else:
            self._bg_color_entry.configure(state="disabled")

    def _on_apply_click(self) -> None:
        name = self._preset_menu.get()
        if name and name != _NO_PRESETS_LABEL:
            self._on_apply_preset(name)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_options(self) -> dict[str, Any]:
        """Return all current setting values as a plain dict.

        Keys: ``output_format``, ``width``, ``height``, ``dpi``,
        ``quality``, ``keep_aspect_ratio``, ``transparent_background``,
        ``background_color``.
        """
        transparent = self._bg_mode_var.get() == "transparent"
        return {
            "output_format": self._format_var.get(),
            "width": self._width_var.get().strip() or None,
            "height": self._height_var.get().strip() or None,
            "dpi": self._dpi_var.get().strip() or None,
            "quality": int(self._quality_var.get()),
            "keep_aspect_ratio": self._keep_aspect_var.get(),
            "transparent_background": transparent,
            "background_color": self._bg_color_var.get().strip() or _DEFAULT_BG_COLOR,
        }

    def apply_preset(self, preset: Any) -> None:
        """Apply *preset* attributes to all widgets.

        *preset* must have attributes matching the keys returned by
        :meth:`get_options`.
        """

        def _getattr(name: str, default: Any = None) -> Any:
            return getattr(preset, name, default)

        fmt = _getattr("output_format", _DEFAULT_FORMAT)
        if fmt in _FORMATS:
            self._format_var.set(fmt)

        self._width_var.set(str(_getattr("width") or ""))
        self._height_var.set(str(_getattr("height") or ""))
        self._dpi_var.set(str(_getattr("dpi") or _DEFAULT_DPI))

        quality = _getattr("quality", _DEFAULT_QUALITY)
        self._quality_var.set(float(quality))
        self._quality_value_label.configure(text=str(int(quality)))

        self._keep_aspect_var.set(bool(_getattr("keep_aspect_ratio", True)))

        transparent = _getattr("transparent_background", True)
        self._bg_mode_var.set("transparent" if transparent else "solid")
        self._on_bg_mode_change()

        bg_color = _getattr("background_color", _DEFAULT_BG_COLOR)
        self._bg_color_var.set(str(bg_color))

    def update_presets(self, names: list[str]) -> None:
        """Refresh the preset dropdown with the given *names*.

        If *names* is empty, a placeholder entry is shown instead.
        """
        if names:
            self._preset_menu.configure(values=names)
            self._preset_menu.set(names[0])
        else:
            self._preset_menu.configure(values=[_NO_PRESETS_LABEL])
            self._preset_menu.set(_NO_PRESETS_LABEL)
