"""
Drag-and-drop handler for the SVG Converter.

Wraps tkinterdnd2 when available and falls back gracefully when it is
not installed. The rest of the application never imports tkinterdnd2
directly — only this module does.
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Callable

logger = logging.getLogger(__name__)

# Optional dependency — tkinterdnd2 is not always installed.
try:
    import tkinterdnd2 as dnd  # type: ignore[import]

    _DND_AVAILABLE = True
except ImportError:
    _DND_AVAILABLE = False
    logger.warning(
        "tkinterdnd2 not found — drag-and-drop will be unavailable. "
        "Install it with: pip install tkinterdnd2"
    )


def is_available() -> bool:
    """Return True when drag-and-drop support is present."""
    return _DND_AVAILABLE


def register(widget, callback: Callable[[list[Path]], None]) -> None:
    """
    Register a widget to receive SVG drag-and-drop events.

    Parameters
    ----------
    widget:
        The Tk/CTk widget that should accept drops.
    callback:
        Called with a list of valid ``.svg`` Path objects whenever files
        are dropped. Non-SVG files in the drop are silently filtered out.
        Called with an empty list if no valid SVGs were dropped.
    """
    if not _DND_AVAILABLE:
        logger.debug("Drag-and-drop registration skipped (tkinterdnd2 missing).")
        return

    try:
        widget.drop_target_register(dnd.DND_FILES)  # type: ignore[attr-defined]
        widget.dnd_bind(  # type: ignore[attr-defined]
            "<<Drop>>",
            lambda event: _handle_drop(event, callback),
        )
        logger.debug("Drag-and-drop registered on %s.", widget.__class__.__name__)
    except Exception as exc:
        logger.warning("Failed to register drag-and-drop: %s", exc)


def _handle_drop(event, callback: Callable[[list[Path]], None]) -> None:
    """
    Parse the raw drop event data into a list of Paths and invoke callback.

    tkinterdnd2 delivers file paths as a brace-quoted Tcl list, e.g.:
        {/path/to/file 1.svg} /path/to/file2.svg
    """
    raw: str = event.data  # type: ignore[attr-defined]
    paths = _parse_drop_data(raw)
    svg_paths = [p for p in paths if p.suffix.lower() == ".svg" and p.is_file()]

    if not svg_paths:
        logger.debug("Drop contained no valid SVG files.")

    callback(svg_paths)


def _parse_drop_data(data: str) -> list[Path]:
    """
    Convert a raw tkinterdnd2 drop string into a list of Paths.

    Handles both brace-quoted entries (paths with spaces) and
    plain space-separated entries.
    """
    paths: list[Path] = []
    data = data.strip()

    # Tcl-list style: entries may be wrapped in braces.
    while data:
        if data.startswith("{"):
            end = data.find("}")
            if end == -1:
                # Malformed — treat the rest as one path.
                paths.append(Path(data[1:]))
                break
            paths.append(Path(data[1:end]))
            data = data[end + 1 :].strip()
        else:
            parts = data.split(" ", 1)
            paths.append(Path(parts[0]))
            data = parts[1].strip() if len(parts) > 1 else ""

    return paths
