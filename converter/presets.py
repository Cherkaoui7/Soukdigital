import json
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional

@dataclass
class ConversionPreset:
    name: str
    output_format: str = "PNG"
    width: int = 1024
    height: int = 1024
    dpi: int = 300
    quality: int = 95
    transparent_background: bool = True
    keep_aspect_ratio: bool = True

    def validate(self):
        if self.output_format not in ["PNG", "JPEG", "JPG", "WEBP", "PDF"]:
            raise ValueError("Invalid format")
        if self.width <= 0 or self.height <= 0 or self.dpi <= 0:
            raise ValueError("Invalid dimensions")
        if not (1 <= self.quality <= 100):
            raise ValueError("Invalid quality")

    def to_dict(self):
        return {
            "name": self.name,
            "output_format": self.output_format,
            "width": self.width,
            "height": self.height,
            "dpi": self.dpi,
            "quality": self.quality,
            "transparent_background": self.transparent_background,
            "keep_aspect_ratio": self.keep_aspect_ratio,
        }

    @classmethod
    def from_dict(cls, data):
        return cls(**data)

class PresetManager:
    def __init__(self, preset_file: Path | str):
        self._preset_file = Path(preset_file)
        self._presets: Dict[str, ConversionPreset] = {}
        if self._preset_file.exists():
            self._load()
        else:
            self._create_default_presets()
            self.save()

    @property
    def presets(self):
        return self._presets.copy()

    def names(self) -> List[str]:
        return sorted(list(self._presets.keys()))

    def exists(self, name: str) -> bool:
        return name in self._presets

    def get(self, name: str) -> ConversionPreset:
        if name not in self._presets:
            raise KeyError(f"Preset {name} not found")
        return self._presets[name]

    def add(self, preset: ConversionPreset):
        preset.validate()
        self._presets[preset.name] = preset

    def remove(self, name: str) -> bool:
        if name in self._presets:
            del self._presets[name]
            return True
        return False

    def rename(self, old_name: str, new_name: str):
        if old_name in self._presets:
            preset = self._presets.pop(old_name)
            preset.name = new_name
            self._presets[new_name] = preset

    def save(self):
        self._preset_file.parent.mkdir(parents=True, exist_ok=True)
        data = {name: preset.to_dict() for name, preset in self._presets.items()}
        with self._preset_file.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=4)

    def _load(self):
        try:
            with self._preset_file.open("r", encoding="utf-8") as f:
                data = json.load(f)
            self._presets = {name: ConversionPreset.from_dict(p_data) for name, p_data in data.items()}
        except Exception:
            self._presets = {}

    def _create_default_presets(self):
        self.add(ConversionPreset(name="Web PNG", output_format="PNG", width=1024, height=1024, dpi=72))
        self.add(ConversionPreset(name="Print PNG", output_format="PNG", width=3508, height=2480, dpi=300))
        self.add(ConversionPreset(name="High Quality JPEG", output_format="JPEG", width=2048, height=2048, dpi=300, quality=100, transparent_background=False))
        self.add(ConversionPreset(name="Compressed WEBP", output_format="WEBP", width=1024, height=1024, dpi=72, quality=80))
        self.add(ConversionPreset(name="PDF Document", output_format="PDF", width=1024, height=1024, dpi=300))

