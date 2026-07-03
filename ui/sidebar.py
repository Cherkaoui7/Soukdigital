from __future__ import annotations

from pathlib import Path
from typing import Any

import customtkinter as ctk


class Sidebar(ctk.CTkFrame):
    """Left panel showing recent files and conversion history.

    All interaction callbacks are injected via constructor — this widget
    contains no backend or converter logic of its own.
    """

    def __init__(
        self,
        parent,
        *,
        on_file_select,
        on_history_clear,
        **kwargs,
    ) -> None:
        kwargs.setdefault("width", 220)
        kwargs.setdefault("corner_radius", 0)
        super().__init__(parent, **kwargs)

        self._on_file_select = on_file_select
        self._on_history_clear = on_history_clear

        # Prevent the frame from shrinking to its children
        self.pack_propagate(False)

        self._build()

    # ------------------------------------------------------------------
    # Layout
    # ------------------------------------------------------------------

    def _build(self) -> None:
        """Construct all child widgets."""

        SECTION_PAD_X = 8
        SECTION_PAD_Y = (10, 2)

        # ── Recent files section ───────────────────────────────────────
        ctk.CTkLabel(
            self,
            text="Fichiers récents",
            font=ctk.CTkFont(weight="bold"),
            anchor="w",
        ).pack(fill="x", padx=SECTION_PAD_X, pady=SECTION_PAD_Y)

        self._recent_frame = ctk.CTkScrollableFrame(
            self,
            label_text="",
            height=160,
            corner_radius=6,
        )
        self._recent_frame.pack(fill="x", padx=SECTION_PAD_X, pady=(0, 6))
        self._recent_frame.grid_columnconfigure(0, weight=1)

        # ── Separator ──────────────────────────────────────────────────
        sep = ctk.CTkFrame(self, height=2, fg_color="gray40")
        sep.pack(fill="x", padx=SECTION_PAD_X, pady=4)

        # ── History section ────────────────────────────────────────────
        ctk.CTkLabel(
            self,
            text="Historique",
            font=ctk.CTkFont(weight="bold"),
            anchor="w",
        ).pack(fill="x", padx=SECTION_PAD_X, pady=SECTION_PAD_Y)

        self._history_frame = ctk.CTkScrollableFrame(
            self,
            label_text="",
            corner_radius=6,
        )
        self._history_frame.pack(
            fill="both", expand=True, padx=SECTION_PAD_X, pady=(0, 6)
        )
        self._history_frame.grid_columnconfigure(0, weight=1)

        # ── Clear history button ───────────────────────────────────────
        ctk.CTkButton(
            self,
            text="Effacer l'historique",
            command=self._on_history_clear,
            height=30,
            fg_color="transparent",
            border_width=1,
        ).pack(fill="x", padx=SECTION_PAD_X, pady=(0, 10))

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _clear_frame(self, frame: ctk.CTkScrollableFrame) -> None:
        """Destroy all child widgets inside a scrollable frame."""
        for widget in frame.winfo_children():
            widget.destroy()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def update_recent(self, files: list[Path]) -> None:
        """Rebuild the recent-files list from *files*.

        Each entry becomes a full-width, left-aligned button whose click
        calls ``on_file_select(path)``.
        """
        self._clear_frame(self._recent_frame)

        if not files:
            ctk.CTkLabel(
                self._recent_frame,
                text="Aucun fichier récent",
                text_color="gray60",
                anchor="w",
            ).grid(row=0, column=0, sticky="ew", padx=4, pady=2)
            return

        for row, path in enumerate(files):
            # Capture path in the default-argument closure to avoid late binding
            btn = ctk.CTkButton(
                self._recent_frame,
                text=path.name,
                anchor="w",
                fg_color="transparent",
                hover_color=("gray80", "gray30"),
                text_color=("gray10", "gray90"),
                command=lambda p=path: self._on_file_select(p),
                height=28,
            )
            btn.grid(row=row, column=0, sticky="ew", padx=2, pady=1)

    def update_history(self, items: list[Any]) -> None:
        """Rebuild the conversion history list from *items*.

        Each item is expected to expose the following attributes:
        - ``source_file``      — ``Path`` (or path-like) of the source SVG
        - ``success``          — ``bool`` indicating whether conversion succeeded
        - ``output_format``    — ``str`` format label, e.g. ``"PNG"``
        - ``duration_seconds`` — ``float`` elapsed conversion time
        """
        self._clear_frame(self._history_frame)

        if not items:
            ctk.CTkLabel(
                self._history_frame,
                text="Aucune conversion",
                text_color="gray60",
                anchor="w",
            ).grid(row=0, column=0, sticky="ew", padx=4, pady=2)
            return

        for row, item in enumerate(items):
            source = Path(item.source_file)
            status_icon = "✓" if item.success else "✗"
            status_color = "#2ecc71" if item.success else "#e74c3c"
            duration_text = f"{item.duration_seconds:.2f}s"

            entry_frame = ctk.CTkFrame(
                self._history_frame,
                fg_color="transparent",
            )
            entry_frame.grid(row=row, column=0, sticky="ew", padx=2, pady=2)
            entry_frame.grid_columnconfigure(0, weight=1)

            # Status icon
            ctk.CTkLabel(
                entry_frame,
                text=status_icon,
                text_color=status_color,
                width=20,
                anchor="center",
                font=ctk.CTkFont(weight="bold"),
            ).grid(row=0, column=1, padx=(0, 4))

            # Filename + format
            ctk.CTkLabel(
                entry_frame,
                text=source.name,
                anchor="w",
                font=ctk.CTkFont(size=12),
            ).grid(row=0, column=0, sticky="ew")

            # Format + duration on second line
            ctk.CTkLabel(
                entry_frame,
                text=f"{item.output_format}  ·  {duration_text}",
                text_color="gray60",
                anchor="w",
                font=ctk.CTkFont(size=11),
            ).grid(row=1, column=0, columnspan=2, sticky="ew")
