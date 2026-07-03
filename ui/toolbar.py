from __future__ import annotations

import customtkinter as ctk


class Toolbar(ctk.CTkFrame):
    """Horizontal toolbar at the top of the main window.

    All action callbacks are injected via constructor — this widget
    contains no converter logic of its own.
    """

    def __init__(
        self,
        parent,
        *,
        on_open,
        on_convert,
        on_save_as,
        on_clear,
        on_refresh,
        **kwargs,
    ) -> None:
        kwargs.setdefault("height", 48)
        kwargs.setdefault("corner_radius", 0)
        super().__init__(parent, **kwargs)

        self._on_open = on_open
        self._on_convert = on_convert
        self._on_save_as = on_save_as
        self._on_clear = on_clear
        self._on_refresh = on_refresh

        # Prevent the frame from shrinking to fit its children
        self.pack_propagate(False)

        self._build()

    # ------------------------------------------------------------------
    # Layout
    # ------------------------------------------------------------------

    def _build(self) -> None:
        """Populate the toolbar with buttons and a separator."""

        PAD_X = 6
        PAD_Y = 8
        ICON_WIDTH = 40
        LABEL_WIDTH = 90

        # ── Open ───────────────────────────────────────────────────────
        self._btn_open = ctk.CTkButton(
            self,
            text="📂  Open",
            width=LABEL_WIDTH,
            command=self._on_open,
        )
        self._btn_open.pack(side="left", padx=(PAD_X * 2, PAD_X), pady=PAD_Y)

        # ── Convert ────────────────────────────────────────────────────
        self._btn_convert = ctk.CTkButton(
            self,
            text="⚡  Convert",
            width=LABEL_WIDTH,
            fg_color=("blue", "#1f6aa5"),  # primary accent
            hover_color=("cornflower blue", "#2a7dc5"),
            command=self._on_convert,
        )
        self._btn_convert.pack(side="left", padx=PAD_X, pady=PAD_Y)

        # ── Save As ────────────────────────────────────────────────────
        self._btn_save_as = ctk.CTkButton(
            self,
            text="💾  Save As",
            width=LABEL_WIDTH,
            command=self._on_save_as,
        )
        self._btn_save_as.pack(side="left", padx=PAD_X, pady=PAD_Y)

        # ── Separator ──────────────────────────────────────────────────
        sep = ctk.CTkFrame(self, width=2, height=28, fg_color="gray40")
        sep.pack(side="left", padx=PAD_X + 2, pady=PAD_Y)
        sep.pack_propagate(False)

        # ── Clear (icon-only) ─────────────────────────────────────────
        self._btn_clear = ctk.CTkButton(
            self,
            text="🗑",
            width=ICON_WIDTH,
            command=self._on_clear,
        )
        self._btn_clear.pack(side="left", padx=PAD_X, pady=PAD_Y)

        # ── Refresh (icon-only) ───────────────────────────────────────
        self._btn_refresh = ctk.CTkButton(
            self,
            text="🔄",
            width=ICON_WIDTH,
            command=self._on_refresh,
        )
        self._btn_refresh.pack(side="left", padx=PAD_X, pady=PAD_Y)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def set_convert_enabled(self, enabled: bool) -> None:
        """Enable or disable the Convert button."""
        state = "normal" if enabled else "disabled"
        self._btn_convert.configure(state=state)

    def set_open_enabled(self, enabled: bool) -> None:
        """Enable or disable the Open button."""
        state = "normal" if enabled else "disabled"
        self._btn_open.configure(state=state)
