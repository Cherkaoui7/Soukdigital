from typing import Any, Dict, Optional
from dataclasses import dataclass
from defusedxml.ElementTree import parse as defused_parse

from converter.exceptions import MetadataError

@dataclass
class SVGMetadata:
    width: Optional[int]
    height: Optional[int]
    viewbox: Optional[str]
    element_count: int
    format: str = "svg"

class MetadataExtractor:
    def extract(self, svg_path: str) -> SVGMetadata:
        try:
            with open(svg_path, "rb") as f:
                tree = defused_parse(f)

            root = tree.getroot()
            
            width_str = root.get("width")
            height_str = root.get("height")
            viewbox = root.get("viewBox")

            width = int(float(width_str)) if width_str and width_str.replace(".", "").isdigit() else None
            height = int(float(height_str)) if height_str and height_str.replace(".", "").isdigit() else None
            
            if viewbox is None and width is not None and height is not None:
                viewbox = f"0 0 {width} {height}"

            element_count = len(list(root.iter()))

            return SVGMetadata(
                width=width,
                height=height,
                viewbox=viewbox,
                element_count=element_count
            )
        except Exception as e:
            raise MetadataError(f"Failed to extract metadata: {str(e)}")
