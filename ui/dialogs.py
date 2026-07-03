from __future__ import annotations

import tkinter.filedialog as tkfd
import tkinter.messagebox as tkmb
from pathlib import Path

import customtkinter as ctk

# ---------------------------------------------------------------------------
# Extension maps used by the save dialog
# ---------------------------------------------------------------------------

_FORMAT_FILETYPES: dict[str, list[tuple[str, str]]] = {
    "PNG": [("PNG image", "*.png"), ("All files", "*.*")],
    "JPEG": [("JPEG image", "*.jpg"), ("JPEG image", "*.jpeg"), ("All files", "*.*")],
    "WEBP": [("WebP image", "*.webp"), ("All files", "*.*")],
    "PDF": [("PDF document", "*.pdf"), ("All files", "*.*")],
}

_FORMAT_DEFAULT_EXT: dict[str, str] = {
    "PNG": ".png",
    "JPEG": ".jpg",
    "WEBP": ".webp",
    "PDF": ".pdf",
}


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def ask_open_svg() -> Path | None:
    """Open a file-picker dialog filtered to SVG files.

    Returns the chosen :class:`~pathlib.Path`, or ``None`` if the user
    cancelled.
    """
    raw = tkfd.askopenfilename(
        title="Ouvrir un fichier SVG",
        filetypes=[("SVG image", "*.svg"), ("All files", "*.*")],
    )
    if not raw:
        return None
    return Path(raw)


def ask_save_file(default_format: str = "PNG") -> Path | None:
    """Open a save-as dialog whose filters match *default_format*.

    Returns the chosen :class:`~pathlib.Path`, or ``None`` if the user
    cancelled.
    """
    fmt = default_format.upper()
    filetypes = _FORMAT_FILETYPES.get(fmt, _FORMAT_FILETYPES["PNG"])
    default_ext = _FORMAT_DEFAULT_EXT.get(fmt, ".png")

    raw = tkfd.asksaveasfilename(
        title="Enregistrer sous…",
        filetypes=filetypes,
        defaultextension=default_ext,
    )
    if not raw:
        return None
    return Path(raw)


def show_error(title: str, message: str) -> None:
    """Display a modal error dialog."""
    tkmb.showerror(title=title, message=message)


def show_success(title: str, message: str) -> None:
    """Display a modal info/success dialog."""
    tkmb.showinfo(title=title, message=message)


def ask_preset_name(existing_names: list[str]) -> str | None:
    """Prompt the user for a preset name.

    Uses :class:`customtkinter.CTkInputDialog` when it is available;
    otherwise falls back to a minimal :class:`~customtkinter.CTkToplevel`
    built from a :class:`~customtkinter.CTkEntry` and OK/Cancel buttons.

    Returns the entered name stripped of leading/trailing whitespace, or
    ``None`` if the user cancelled or left the field empty.
    """
    # -- Attempt 1: use CTkInputDialog (present in recent CTk releases) ----
    if hasattr(ctk, "CTkInputDialog"):
        dialog = ctk.CTkInputDialog(
            title="Nouveau préréglage",
            text="Nom du préréglage :",
        )
        result = dialog.get_input()
        if result is None:
            return None
        name = result.strip()
        return name if name else None

    # -- Fallback: build a minimal Toplevel --------------------------------
    return _ask_preset_name_fallback(existing_names)


# ---------------------------------------------------------------------------
# Internal fallback dialog
# ---------------------------------------------------------------------------


def _ask_preset_name_fallback(existing_names: list[str]) -> str | None:  # noqa: ARG001
    """Minimal CTkToplevel-based name-input dialog used when
    :class:`~customtkinter.CTkInputDialog` is unavailable."""

    result: list[str | None] = [None]

    top = ctk.CTkToplevel()
    top.title("Nouveau préréglage")
    top.resizable(False, False)
    top.grab_set()  # make it modal

    # ── Content ───────────────────────────────────────────────────────────
    ctk.CTkLabel(
        top,
        text="Nom du préréglage :",
        anchor="w",
    ).pack(fill="x", padx=20, pady=(18, 4))

    entry = ctk.CTkEntry(top, width=240, placeholder_text="Mon préréglage")
    entry.pack(padx=20, pady=(0, 14))
    entry.focus_set()

    # ── Buttons ───────────────────────────────────────────────────────────
    btn_frame = ctk.CTkFrame(top, fg_color="transparent")
    btn_frame.pack(fill="x", padx=20, pady=(0, 16))
    btn_frame.grid_columnconfigure((0, 1), weight=1)

    def _ok(event: object = None) -> None:  # noqa: ARG001
        name = entry.get().strip()
        result[0] = name if name else None
        top.destroy()

    def _cancel(event: object = None) -> None:  # noqa: ARG001
        top.destroy()

    ctk.CTkButton(btn_frame, text="OK", command=_ok).grid(
        row=0, column=0, sticky="ew", padx=(0, 6)
    )
    ctk.CTkButton(
        btn_frame,
        text="Annuler",
        fg_color="transparent",
        border_width=1,
        command=_cancel,
    ).grid(row=0, column=1, sticky="ew", padx=(6, 0))

    # Bind Return / Escape for keyboard UX
    top.bind("<Return>", _ok)
    top.bind("<Escape>", _cancel)

    # Centre the dialog over the active window
    top.update_idletasks()
    try:
        master = top.master  # type: ignore[attr-defined]
        x = master.winfo_rootx() + (master.winfo_width() - top.winfo_width()) // 2
        y = master.winfo_rooty() + (master.winfo_height() - top.winfo_height()) // 2
        top.geometry(f"+{x}+{y}")
    except Exception:  # noqa: BLE001
        pass  # geometry centering is best-effort

    top.wait_window()
    return result[0]
