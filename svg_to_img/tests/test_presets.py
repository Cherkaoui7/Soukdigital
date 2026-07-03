import json

import pytest

from converter.presets import (
    ConversionPreset,
    PresetManager,
)


@pytest.fixture
def preset_manager(tmp_path):
    preset_file = tmp_path / "presets.json"
    return PresetManager(preset_file)


def test_conversion_preset_validation():
    # Test valid preset
    valid_preset = ConversionPreset(
        name="Valid",
        output_format="PNG",
        width=100,
        height=100,
        dpi=300,
        quality=95,
        transparent_background=True,
        keep_aspect_ratio=True,
    )
    valid_preset.validate()  # Should not raise

    # Test invalid format
    with pytest.raises(ValueError):
        invalid_format = ConversionPreset(
            name="Invalid",
            output_format="GIF",
            width=100,
            height=100,
        )
        invalid_format.validate()

    # Test invalid width
    with pytest.raises(ValueError):
        invalid_width = ConversionPreset(
            name="Invalid",
            output_format="PNG",
            width=-100,
            height=100,
        )
        invalid_width.validate()

    # Test invalid height
    with pytest.raises(ValueError):
        invalid_height = ConversionPreset(
            name="Invalid",
            output_format="PNG",
            width=100,
            height=-100,
        )
        invalid_height.validate()

    # Test invalid DPI
    with pytest.raises(ValueError):
        invalid_dpi = ConversionPreset(
            name="Invalid",
            output_format="PNG",
            width=100,
            height=100,
            dpi=-300,
        )
        invalid_dpi.validate()

    # Test invalid quality
    with pytest.raises(ValueError):
        invalid_quality = ConversionPreset(
            name="Invalid",
            output_format="PNG",
            width=100,
            height=100,
            quality=101,
        )
        invalid_quality.validate()


def test_conversion_preset_to_dict():
    preset = ConversionPreset(
        name="Test",
        output_format="PNG",
        width=100,
        height=100,
        dpi=300,
        quality=95,
        transparent_background=True,
        keep_aspect_ratio=True,
    )

    result = preset.to_dict()

    assert result == {
        "name": "Test",
        "output_format": "PNG",
        "width": 100,
        "height": 100,
        "dpi": 300,
        "quality": 95,
        "transparent_background": True,
        "keep_aspect_ratio": True,
    }


def test_conversion_preset_from_dict():
    data = {
        "name": "Test",
        "output_format": "PNG",
        "width": 100,
        "height": 100,
        "dpi": 300,
        "quality": 95,
        "transparent_background": True,
        "keep_aspect_ratio": True,
    }

    preset = ConversionPreset.from_dict(data)

    assert preset.name == "Test"
    assert preset.output_format == "PNG"
    assert preset.width == 100
    assert preset.height == 100
    assert preset.dpi == 300
    assert preset.quality == 95
    assert preset.transparent_background is True
    assert preset.keep_aspect_ratio is True


def test_preset_manager_init(preset_manager):
    assert isinstance(preset_manager, PresetManager)
    assert preset_manager._preset_file.exists()


def test_preset_manager_presets_property(preset_manager):
    # Initially empty
    preset_manager._presets = {}
    assert preset_manager.presets == {}

    # Add a preset
    preset = ConversionPreset(name="Test")
    preset_manager.add(preset)

    # Verify the property returns a copy
    presets = preset_manager.presets
    assert presets == {"Test": preset}
    assert presets is not preset_manager._presets


def test_preset_manager_names(preset_manager):
    # Initially empty
    preset_manager._presets = {}
    assert preset_manager.names() == []

    # Add presets
    preset_manager.add(ConversionPreset(name="B"))
    preset_manager.add(ConversionPreset(name="A"))
    preset_manager.add(ConversionPreset(name="C"))

    # Verify sorted order
    assert preset_manager.names() == ["A", "B", "C"]


def test_preset_manager_exists(preset_manager):
    # Initially empty
    preset_manager._presets = {}
    assert not preset_manager.exists("Test")

    # Add a preset
    preset_manager.add(ConversionPreset(name="Test"))

    # Verify existence
    assert preset_manager.exists("Test")
    assert not preset_manager.exists("Nonexistent")


def test_preset_manager_get(preset_manager):
    # Add a preset
    preset = ConversionPreset(name="Test")
    preset_manager.add(preset)

    # Verify retrieval
    assert preset_manager.get("Test") == preset

    # Verify error for nonexistent preset
    with pytest.raises(KeyError):
        preset_manager.get("Nonexistent")


def test_preset_manager_add(preset_manager):
    # Add a valid preset
    preset = ConversionPreset(name="Valid")
    preset_manager.add(preset)

    # Verify the preset was added
    assert preset_manager.exists("Valid")

    # Verify invalid preset raises ValueError
    with pytest.raises(ValueError):
        invalid_preset = ConversionPreset(
            name="Invalid",
            output_format="GIF",
        )
        preset_manager.add(invalid_preset)


def test_preset_manager_remove(preset_manager):
    # Add a preset
    preset_manager.add(ConversionPreset(name="Test"))

    # Verify removal
    assert preset_manager.remove("Test") is True
    assert not preset_manager.exists("Test")

    # Verify removal of nonexistent preset
    assert preset_manager.remove("Nonexistent") is False


def test_preset_manager_rename(preset_manager):
    # Add a preset
    preset_manager.add(ConversionPreset(name="Old"))

    # Rename the preset
    preset_manager.rename("Old", "New")

    # Verify the preset was renamed
    assert not preset_manager.exists("Old")
    assert preset_manager.exists("New")

    # Verify the preset's name was updated
    assert preset_manager.get("New").name == "New"


def test_preset_manager_save(preset_manager):
    # Add presets
    preset_manager.add(ConversionPreset(name="Preset1"))
    preset_manager.add(ConversionPreset(name="Preset2"))

    # Save presets
    preset_manager.save()

    # Verify the file was created
    assert preset_manager._preset_file.exists()

    # Verify the file content
    with preset_manager._preset_file.open("r", encoding="utf-8") as file:
        data = json.load(file)

    assert "Preset1" in data
    assert "Preset2" in data


def test_preset_manager_load(preset_manager):
    # Create a test preset file
    test_data = {
        "Preset1": {
            "name": "Preset1",
            "output_format": "PNG",
            "width": 100,
            "height": 100,
        },
        "Preset2": {
            "name": "Preset2",
            "output_format": "JPEG",
            "width": 200,
            "height": 200,
        },
    }

    with preset_manager._preset_file.open("w", encoding="utf-8") as file:
        json.dump(test_data, file)

    # Reload presets
    preset_manager._load()

    # Verify the presets were loaded
    assert preset_manager.exists("Preset1")
    assert preset_manager.exists("Preset2")

    # Verify preset values
    preset1 = preset_manager.get("Preset1")
    assert preset1.output_format == "PNG"
    assert preset1.width == 100
    assert preset1.height == 100

    preset2 = preset_manager.get("Preset2")
    assert preset2.output_format == "JPEG"
    assert preset2.width == 200
    assert preset2.height == 200


def test_preset_manager_create_default_presets(preset_manager):
    # Clear existing presets
    preset_manager._presets = {}

    # Create default presets
    preset_manager._create_default_presets()

    # Verify default presets were created
    assert preset_manager.exists("Web PNG")
    assert preset_manager.exists("Print PNG")
    assert preset_manager.exists("High Quality JPEG")
    assert preset_manager.exists("Compressed WEBP")
    assert preset_manager.exists("PDF Document")

    # Verify some preset values
    web_png = preset_manager.get("Web PNG")
    assert web_png.output_format == "PNG"
    assert web_png.width == 1024
    assert web_png.height == 1024

    print_png = preset_manager.get("Print PNG")
    assert print_png.output_format == "PNG"
    assert print_png.width == 3508
    assert print_png.height == 2480
