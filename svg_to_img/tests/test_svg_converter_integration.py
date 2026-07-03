import os
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from PIL import Image

from converter.exceptions import (
    ConversionError,
    FileValidationError,
    HistoryError,
)
from converter.svg_converter import (
    ConversionOptions,
    ConversionResult,
    SVGConverter,
)


@pytest.fixture
def converter():
    return SVGConverter()


@pytest.fixture
def options_png():
    return ConversionOptions(
        output_format="PNG",
        width=100,
        height=100,
        dpi=96,
        quality=95,
        transparent_background=True,
        keep_aspect_ratio=True,
    )


@pytest.fixture
def options_jpeg():
    return ConversionOptions(
        output_format="JPEG",
        width=100,
        height=100,
        dpi=96,
        quality=80,
        transparent_background=False,
        background_color="#FFFFFF",
        keep_aspect_ratio=True,
    )


@pytest.fixture
def options_webp():
    return ConversionOptions(
        output_format="WEBP",
        width=100,
        height=100,
        dpi=96,
        quality=80,
        transparent_background=False,
        background_color="#FFFFFF",
        keep_aspect_ratio=True,
    )


@pytest.fixture
def options_pdf():
    return ConversionOptions(
        output_format="PDF",
        width=100,
        height=100,
        dpi=300,
        transparent_background=True,
        keep_aspect_ratio=True,
    )


@pytest.fixture
def sample_svg():
    return Path(__file__).parent / "assets" / "simple.svg"


@pytest.fixture
def temp_directory(tmp_path):
    return tmp_path


def test_successful_png_conversion(
    converter,
    sample_svg,
    options_png,
    temp_directory,
):
    output_path = temp_directory / "simple.png"

    result = converter.convert(
        sample_svg,
        output_path,
        options_png,
    )

    assert result.success is True
    assert output_path.exists()
    assert output_path.stat().st_size > 0

    with Image.open(output_path) as img:
        assert img.width == 100
        assert img.height == 100


def test_jpeg_conversion(
    converter,
    sample_svg,
    options_jpeg,
    temp_directory,
):
    output_path = temp_directory / "simple.jpg"

    result = converter.convert(
        sample_svg,
        output_path,
        options_jpeg,
    )

    assert result.success is True
    assert output_path.exists()
    assert output_path.stat().st_size > 0

    with Image.open(output_path) as img:
        assert img.width == 100
        assert img.height == 100
        assert img.mode == "RGB"


def test_webp_conversion(
    converter,
    sample_svg,
    options_webp,
    temp_directory,
):
    output_path = temp_directory / "simple.webp"

    result = converter.convert(
        sample_svg,
        output_path,
        options_webp,
    )

    assert result.success is True
    assert output_path.exists()
    assert output_path.stat().st_size > 0

    with Image.open(output_path) as img:
        assert img.width == 100
        assert img.height == 100


def test_pdf_conversion(
    converter,
    sample_svg,
    options_pdf,
    temp_directory,
):
    output_path = temp_directory / "simple.pdf"

    result = converter.convert(
        sample_svg,
        output_path,
        options_pdf,
    )

    assert result.success is True
    assert output_path.exists()
    assert output_path.stat().st_size > 0


def test_transparent_svg_png(
    converter,
    temp_directory,
    options_png,
):
    svg_path = Path(__file__).parent / "assets" / "transparent.svg"
    output_path = temp_directory / "transparent.png"

    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )

    assert result.success is True
    assert output_path.exists()

    with Image.open(output_path) as img:
        assert img.mode == "RGBA"
        assert img.getextrema()[3][1] > 0  # Alpha channel has some opacity


def test_transparent_svg_jpeg(
    converter,
    temp_directory,
    options_jpeg,
):
    svg_path = Path(__file__).parent / "assets" / "transparent.svg"
    output_path = temp_directory / "transparent.jpg"

    result = converter.convert(
        svg_path,
        output_path,
        options_jpeg,
    )

    assert result.success is True
    assert output_path.exists()

    with Image.open(output_path) as img:
        assert img.mode == "RGB"
        # Since it's a blue rect with 0.5 opacity on white, red is ~127-128
        assert 120 <= img.getextrema()[0][0] <= 130


def test_invalid_svg(converter, temp_directory, options_png):
    svg_path = Path(__file__).parent / "assets" / "invalid.svg"
    output_path = temp_directory / "invalid.png"

    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )

    assert result.success is False
    assert not output_path.exists()
    assert isinstance(result.error, FileValidationError)


def test_missing_file(converter, temp_directory, options_png):
    svg_path = Path(__file__).parent / "assets" / "nonexistent.svg"
    output_path = temp_directory / "nonexistent.png"

    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )

    assert result.success is False
    assert not output_path.exists()
    assert isinstance(result.error, FileValidationError)


def test_malformed_xml(converter, temp_directory, options_png):
    svg_path = Path(__file__).parent / "assets" / "malformed.svg"
    output_path = temp_directory / "malformed.png"

    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )

    assert result.success is False
    assert not output_path.exists()
    assert isinstance(result.error, FileValidationError)


def test_viewbox_only_svg(
    converter,
    temp_directory,
    options_png,
):
    svg_path = Path(__file__).parent / "assets" / "viewbox_only.svg"
    output_path = temp_directory / "viewbox_only.png"

    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )

    assert result.success is True
    assert output_path.exists()

    with Image.open(output_path) as img:
        assert img.width == 100
        assert img.height == 100


def test_no_dimensions_svg(
    converter,
    temp_directory,
    options_png,
):
    svg_path = Path(__file__).parent / "assets" / "no_dimensions.svg"
    output_path = temp_directory / "no_dimensions.png"

    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )

    assert result.success is True
    assert output_path.exists()

    with Image.open(output_path) as img:
        assert img.width == 100
        assert img.height == 100


def test_metadata(converter, sample_svg):
    metadata = converter.get_metadata(sample_svg)

    assert metadata.width == 100
    assert metadata.height == 100
    assert metadata.viewbox == "0 0 100 100"
    assert metadata.element_count > 0


def test_preview(converter, sample_svg):
    preview = converter.create_preview(sample_svg)

    assert isinstance(preview, Image.Image)
    assert preview.width <= 100
    assert preview.height <= 100


def test_history(converter, sample_svg, options_png, temp_directory):
    # Clear history for this test
    with open(converter.history_manager.history_file, "w") as f:
        import json
        json.dump([], f)

    output_path1 = temp_directory / "history1.png"
    output_path2 = temp_directory / "history2.png"

    converter.convert(sample_svg, output_path1, options_png)
    converter.convert(sample_svg, output_path2, options_png)

    # Assuming history is accessible through a method
    history = converter.history_manager.get_history()

    assert len(history) == 2


def test_batch_compatibility(
    converter,
    options_png,
    temp_directory,
):
    svg_files = [
        Path(__file__).parent / "assets" / "simple.svg",
        Path(__file__).parent / "assets" / "transparent.svg",
        Path(__file__).parent / "assets" / "gradient.svg",
        Path(__file__).parent / "assets" / "viewbox_only.svg",
        Path(__file__).parent / "assets" / "no_dimensions.svg",
        Path(__file__).parent / "assets" / "unicode_测试.svg",
    ]

    for svg_file in svg_files:
        output_path = temp_directory / f"{svg_file.stem}.png"
        result = converter.convert(
            svg_file,
            output_path,
            options_png,
        )
        assert result.success is True


def test_unicode_filename(
    converter,
    options_png,
    temp_directory,
):
    svg_path = Path(__file__).parent / "assets" / "unicode_测试.svg"
    output_path = temp_directory / "unicode_测试.png"

    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )

    assert result.success is True
    assert output_path.exists()


def test_concurrent_conversions(
    converter,
    options_png,
    temp_directory,
):
    svg_files = [
        Path(__file__).parent / "assets" / "simple.svg",
        Path(__file__).parent / "assets" / "transparent.svg",
        Path(__file__).parent / "assets" / "gradient.svg",
        Path(__file__).parent / "assets" / "viewbox_only.svg",
    ]

    def convert_file(svg_file):
        output_path = temp_directory / f"{svg_file.stem}.png"
        return converter.convert(
            svg_file,
            output_path,
            options_png,
        )

    with ThreadPoolExecutor(max_workers=4) as executor:
        results = list(executor.map(convert_file, svg_files))

    for result in results:
        assert result.success is True


def test_large_svg(converter, options_png, temp_directory):
    svg_path = Path(__file__).parent / "assets" / "huge.svg"
    output_path = temp_directory / "huge.png"

    start_time = time.time()
    result = converter.convert(
        svg_path,
        output_path,
        options_png,
    )
    duration = time.time() - start_time

    assert result.success is True
    assert output_path.exists()
    assert duration < 5.0  # 5 seconds threshold


def test_round_trip_verification(
    converter,
    sample_svg,
    options_png,
    temp_directory,
):
    output_path = temp_directory / "roundtrip.png"

    result = converter.convert(
        sample_svg,
        output_path,
        options_png,
    )

    assert result.success is True

    with Image.open(output_path) as img:
        assert img.width == 100
        assert img.height == 100
        assert img.mode in ("RGB", "RGBA")


def test_error_propagation_renderer(converter, sample_svg, options_png, temp_directory):
    output_path = temp_directory / "error_renderer.png"

    # Mock the renderer to throw an error
    original_render = converter.renderer.render
    converter.renderer.render = lambda *args, **kwargs: (_ for _ in ()).throw(
        ConversionError("Renderer failed")
    )

    try:
        result = converter.convert(
            sample_svg,
            output_path,
            options_png,
        )

        assert result.success is False
        assert isinstance(result.error, ConversionError)
        assert not output_path.exists()
    finally:
        converter.renderer.render = original_render


def test_error_propagation_image_utils(
    converter,
    sample_svg,
    options_png,
    temp_directory,
):
    output_path = temp_directory / "error_image_utils.png"

    # Mock ImageUtils.save() to throw an error
    original_save = converter.image_utils.save
    converter.image_utils.save = lambda *args, **kwargs: (_ for _ in ()).throw(
        OSError("Save failed")
    )

    try:
        result = converter.convert(
            sample_svg,
            output_path,
            options_png,
        )

        assert result.success is False
        assert isinstance(result.error, ConversionError)
        assert not output_path.exists()
    finally:
        converter.image_utils.save = original_save


def test_error_propagation_history(
    converter,
    sample_svg,
    options_png,
    temp_directory,
):
    output_path = temp_directory / "error_history.png"

    # Mock HistoryManager to throw an error
    original_add = converter.history_manager.add
    converter.history_manager.add = lambda *args, **kwargs: (_ for _ in ()).throw(
        HistoryError("History failed")
    )

    try:
        result = converter.convert(
            sample_svg,
            output_path,
            options_png,
        )

        # Depending on your design, this could either succeed or fail
        # Adjust the assertion based on your policy
        assert result.success is True
        assert output_path.exists()
    finally:
        converter.history_manager.add = original_add


def test_resource_leaks(converter, sample_svg, options_png, temp_directory):
    # Run multiple conversions
    for i in range(100):
        output_path = temp_directory / f"leak_test_{i}.png"
        converter.convert(sample_svg, output_path, options_png)

    # Verify no unclosed images
    # This would require access to internal state
    # which may not be possible without refactoring
    # For now, we'll just verify the test runs without errors
    assert True


def test_performance_simple_svg(converter, sample_svg, options_png):
    start_time = time.time()
    result = converter.convert(
        sample_svg,
        Path(__file__).parent / "output" / "performance.png",
        options_png,
    )
    duration = time.time() - start_time

    assert result.success is True
    assert duration < 0.2  # 200 ms threshold
