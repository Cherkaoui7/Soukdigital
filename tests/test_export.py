from datetime import datetime
from unittest.mock import MagicMock

import pytest

from converter.export import (
    ExportManager,
    ExportHistory,
)


@pytest.fixture
def export_manager(tmp_path):
    output_dir = tmp_path / "output"
    return ExportManager(output_directory=output_dir)


@pytest.fixture
def svg_file(tmp_path):
    svg_content = (
        b'<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">'
        b'<rect width="100" height="100" fill="red"/></svg>'
    )
    svg_path = tmp_path / "test.svg"
    svg_path.write_bytes(svg_content)
    return svg_path


def test_export_manager_init(export_manager):
    assert isinstance(export_manager, ExportManager)
    assert export_manager.output_directory.exists()


def test_export_manager_set_output_directory(tmp_path):
    manager = ExportManager()
    new_dir = tmp_path / "new_output"
    manager.set_output_directory(new_dir)
    assert manager.get_output_directory() == new_dir
    assert new_dir.exists()


def test_export_manager_is_supported(export_manager):
    assert export_manager.is_supported("PNG") is True
    assert export_manager.is_supported("JPG") is True
    assert export_manager.is_supported("JPEG") is True
    assert export_manager.is_supported("WEBP") is True
    assert export_manager.is_supported("BMP") is True
    assert export_manager.is_supported("TIFF") is True
    assert export_manager.is_supported("ICO") is True
    assert export_manager.is_supported("GIF") is False


def test_export_manager_generate_filename(export_manager, svg_file):
    # Test with default format
    filename = export_manager.generate_filename(svg_file, "PNG")
    assert filename == export_manager.output_directory / "test.png"

    # Test with different format
    filename = export_manager.generate_filename(svg_file, "JPEG")
    assert filename == export_manager.output_directory / "test.jpeg"


def test_export_manager_generate_timestamp_filename(export_manager, svg_file):
    # Test with default format
    filename = export_manager.generate_timestamp_filename(svg_file, "PNG")
    assert filename.parent == export_manager.output_directory
    assert filename.name.startswith("test_")
    assert filename.name.endswith(".png")

    # Test with different format
    filename = export_manager.generate_timestamp_filename(svg_file, "JPEG")
    assert filename.parent == export_manager.output_directory
    assert filename.name.startswith("test_")
    assert filename.name.endswith(".jpeg")


def test_export_manager_ensure_unique_filename(export_manager, svg_file):
    # Test with non-existent file
    target_file = export_manager.output_directory / "non_existent.svg"
    filename = export_manager.ensure_unique_filename(target_file)
    assert filename == target_file

    # Test with existing file
    svg_file.touch()
    filename = export_manager.ensure_unique_filename(svg_file)
    assert filename == svg_file.parent / "test_1.svg"

    # Test with multiple existing files
    (svg_file.parent / "test_1.svg").touch()
    (svg_file.parent / "test_2.svg").touch()
    filename = export_manager.ensure_unique_filename(svg_file)
    assert filename == svg_file.parent / "test_3.svg"


def test_export_manager_export(export_manager, svg_file):
    # Test with default format
    output = export_manager.export(svg_file)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()

    # Test with different format
    output = export_manager.export(svg_file, fmt="JPEG")
    assert output == export_manager.output_directory / "test.jpeg"
    assert output.exists()

    # Test with custom filename
    output = export_manager.export(svg_file, filename="custom.png")
    assert output == export_manager.output_directory / "custom.png"
    assert output.exists()

    # Test with overwrite
    output = export_manager.export(svg_file, overwrite=True)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()

    # Test with unsupported format
    with pytest.raises(ValueError):
        export_manager.export(svg_file, fmt="GIF")


def test_export_manager_export_timestamp(export_manager, svg_file):
    # Test with default format
    output = export_manager.export_timestamp(svg_file)
    assert output.parent == export_manager.output_directory
    assert output.name.startswith("test_")
    assert output.name.endswith(".png")
    assert output.exists()

    # Test with different format
    output = export_manager.export_timestamp(svg_file, fmt="JPEG")
    assert output.parent == export_manager.output_directory
    assert output.name.startswith("test_")
    assert output.name.endswith(".jpeg")
    assert output.exists()


def test_export_manager_export_image(export_manager, svg_file):
    # Mock an image object
    image = MagicMock()
    image.save = MagicMock()

    # Test with default format
    output = export_manager.export_image(image, "test.png")
    assert output == export_manager.output_directory / "test.png"
    image.save.assert_called_once_with(
        export_manager.output_directory / "test.png",
        "PNG",
        quality=95,
    )

    # Test with different format
    output = export_manager.export_image(image, "test.jpeg", fmt="JPEG")
    assert output == export_manager.output_directory / "test.jpeg"
    image.save.assert_called_with(
        export_manager.output_directory / "test.jpeg",
        "JPEG",
        quality=95,
    )

    # Test with different quality
    output = export_manager.export_image(image, "test.png", quality=80)
    assert output == export_manager.output_directory / "test.png"
    image.save.assert_called_with(
        export_manager.output_directory / "test.png",
        "PNG",
        quality=80,
    )


def test_export_manager_quick_export_methods(export_manager, svg_file):
    # Test PNG
    output = export_manager.png(svg_file)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()

    # Test JPG
    output = export_manager.jpg(svg_file)
    assert output == export_manager.output_directory / "test.jpg"
    assert output.exists()

    # Test WEBP
    output = export_manager.webp(svg_file)
    assert output == export_manager.output_directory / "test.webp"
    assert output.exists()

    # Test BMP
    output = export_manager.bmp(svg_file)
    assert output == export_manager.output_directory / "test.bmp"
    assert output.exists()

    # Test TIFF
    output = export_manager.tiff(svg_file)
    assert output == export_manager.output_directory / "test.tiff"
    assert output.exists()

    # Test ICO
    output = export_manager.ico(svg_file)
    assert output == export_manager.output_directory / "test.ico"
    assert output.exists()


def test_export_history_init(tmp_path):
    history_file = tmp_path / "history.json"
    history = ExportHistory(history_file=history_file)
    assert isinstance(history, ExportHistory)
    assert history.history_file == history_file
    assert history_file.exists()
    assert history_file.read_text(encoding="utf-8") == "[]"


def test_export_history_load(tmp_path):
    history_file = tmp_path / "history.json"
    history_file.write_text(
        '[{"file": "test.png", "date": "2023-01-01T00:00:00"}]',
        encoding="utf-8",
    )
    history = ExportHistory(history_file=history_file)
    assert history.load() == [{"file": "test.png", "date": "2023-01-01T00:00:00"}]


def test_export_history_add(tmp_path):
    history_file = tmp_path / "history.json"
    history_file.write_text("[]", encoding="utf-8")
    history = ExportHistory(history_file=history_file)
    history.add("test.png")
    assert history.load() == [
        {
            "file": "test.png",
            "date": datetime.now().isoformat()[:19],
        }
    ]


def test_export_manager_export_multiple(export_manager, svg_file):
    # Test with multiple formats
    outputs = export_manager.export_multiple(svg_file, ["PNG", "JPEG"])
    assert len(outputs) == 2
    assert export_manager.output_directory / "test.png" in outputs
    assert export_manager.output_directory / "test.jpeg" in outputs
    assert all(output.exists() for output in outputs)


def test_export_manager_export_batch(export_manager, svg_file):
    # Create multiple SVG files
    svg_files = [
        svg_file,
        svg_file.parent / "test2.svg",
        svg_file.parent / "test3.svg",
    ]
    svg_files[1].write_bytes(svg_file.read_bytes())
    svg_files[2].write_bytes(svg_file.read_bytes())

    # Test with default format
    outputs = export_manager.export_batch(svg_files)
    assert len(outputs) == 3
    assert export_manager.output_directory / "test.png" in outputs
    assert export_manager.output_directory / "test2.png" in outputs
    assert export_manager.output_directory / "test3.png" in outputs
    assert all(output.exists() for output in outputs)

    # Test with progress callback
    progress = []

    def progress_callback(current, total):
        progress.append((current, total))

    outputs = export_manager.export_batch(
        svg_files,
        progress_callback=progress_callback,
    )
    assert progress == [(1, 3), (2, 3), (3, 3)]


def test_export_manager_export_zip(export_manager, svg_file):
    # Create multiple files
    files = [
        export_manager.export(svg_file, fmt="PNG"),
        export_manager.export(svg_file, fmt="JPEG"),
    ]

    # Test with default zip name
    zip_path = export_manager.export_zip(files)
    assert zip_path == export_manager.output_directory / "images.zip"
    assert zip_path.exists()

    # Test with custom zip name
    zip_path = export_manager.export_zip(files, zip_name="custom.zip")
    assert zip_path == export_manager.output_directory / "custom.zip"
    assert zip_path.exists()


def test_export_manager_export_hd(export_manager, svg_file):
    output = export_manager.export_hd(svg_file)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()


def test_export_manager_export_full_hd(export_manager, svg_file):
    output = export_manager.export_full_hd(svg_file)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()


def test_export_manager_export_2k(export_manager, svg_file):
    output = export_manager.export_2k(svg_file)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()


def test_export_manager_export_4k(export_manager, svg_file):
    output = export_manager.export_4k(svg_file)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()


def test_export_manager_export_8k(export_manager, svg_file):
    output = export_manager.export_8k(svg_file)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()


def test_export_manager_export_custom(export_manager, svg_file):
    output = export_manager.export_custom(svg_file, width=800, height=600)
    assert output == export_manager.output_directory / "test.png"
    assert output.exists()
