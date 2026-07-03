from __future__ import annotations

import customtkinter as ctk

_VERSION = "v1.0.0"
_READY_TEXT = "Prêt"


class StatusBar(ctk.CTkFrame):
    """Thin bar at the bottom of the main window.

    Displays a status message on the left, an optional indeterminate
    progress bar in the centre, and a fixed version label on the right.
    """

    def __init__(self, parent, **kwargs) -> None:
        kwargs.setdefault("height", 28)
        kwargs.setdefault("corner_radius", 0)
        super().__init__(parent, **kwargs)

        # Prevent the frame from collapsing around its children
        self.pack_propagate(False)

        self._build()
        self.set_ready()

    # ------------------------------------------------------------------
    # Layout
    # ------------------------------------------------------------------

    def _build(self) -> None:
        """Construct the status label, progress bar, and version label."""

        PAD_X = 8
        PAD_Y = 4

        # ── Status label (stretches to fill remaining space) ───────────
        self._status_label = ctk.CTkLabel(
            self,
            text="",
            anchor="w",
            font=ctk.CTkFont(size=12),
        )
        self._status_label.pack(
            side="left", fill="x", expand=True, padx=(PAD_X, 4), pady=PAD_Y
        )

        # ── Version label (pinned to the right) ────────────────────────
        self._version_label = ctk.CTkLabel(
            self,
            text=_VERSION,
            anchor="e",
            font=ctk.CTkFont(size=11),
            text_color="gray55",
        )
        self._version_label.pack(side="right", padx=(4, PAD_X), pady=PAD_Y)

        # ── Progress bar (between status and version, hidden by default) ─
        self._progress_bar = ctk.CTkProgressBar(
            self,
            width=140,
            height=10,
            mode="indeterminate",
            indeterminate_speed=1.2,
        )
        # Not packed yet — shown on demand via show_progress()

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def set_text(self, text: str) -> None:
        """Update the status label text."""
        self._status_label.configure(text=text)

    def show_progress(self) -> None:
        """Show the progress bar in indeterminate (animated) mode.

        Safe to call multiple times; subsequent calls are no-ops if the
        bar is already visible.
        """
        if not self._progress_bar.winfo_ismapped():
            # Insert between the status label and the version label
            self._progress_bar.pack(
                side="right", padx=(4, 8), pady=6, before=self._version_label
            )
        self._progress_bar.start()

    def hide_progress(self) -> None:
        """Stop and hide the progress bar.

        Safe to call even when the bar is already hidden.
        """
        self._progress_bar.stop()
        if self._progress_bar.winfo_ismapped():
            self._progress_bar.pack_forget()

    def set_ready(self) -> None:
        """Reset to the idle state: 'Prêt' text, no progress bar."""
        self.hide_progress()
        self.set_text(_READY_TEXT)
