from concurrent.futures import ThreadPoolExecutor
from typing import Callable, List, Optional

from converter.exceptions import BatchError
from converter.svg_converter import ConversionOptions, ConversionResult, SVGConverter


class BatchProcessor:
    """
    Processes batches of SVG files for conversion.

    Handles parallel processing of multiple SVG files with progress tracking.
    """

    def __init__(self, converter: SVGConverter):
        """
        Initialize the BatchProcessor.

        Args:
            converter: SVGConverter instance to use for conversions
        """
        self.converter = converter
        self._cancelled = False

    def process(
        self,
        svg_paths: List[str],
        options: Optional[ConversionOptions] = None,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> List[ConversionResult]:
        """
        Process a batch of SVG files for conversion.

        Args:
            svg_paths: List of paths to SVG files to convert
            options: Conversion options (default: ConversionOptions())
            progress_callback: Callback function for progress updates (optional)

        Returns:
            List[ConversionResult]: List of conversion results

        Raises:
            BatchError: If batch processing fails

        Example:
            >>> processor = BatchProcessor(SVGConverter())
            >>> results = processor.process(["file1.svg", "file2.svg"])
        """
        options = options or ConversionOptions()
        results = []
        self._cancelled = False

        try:
            with ThreadPoolExecutor() as executor:
                futures = []
                for i, svg_path in enumerate(svg_paths):
                    if self._cancelled:
                        break

                    # Determine output path (simple implementation - adjust as needed)
                    output_path = svg_path.replace(".svg", f".{options.output_format}")

                    # Submit conversion task
                    future = executor.submit(
                        self._convert_file, svg_path, output_path, options
                    )
                    futures.append(future)

                    # Update progress
                    if progress_callback:
                        progress_callback(i + 1, len(svg_paths))

                # Collect results
                for future in futures:
                    if self._cancelled:
                        results.append(self._cancelled_result())
                    else:
                        results.append(future.result())

        except Exception as e:
            raise BatchError(f"Batch processing failed: {str(e)}")

        return results

    def _convert_file(
        self, svg_path: str, output_path: str, options: ConversionOptions
    ) -> ConversionResult:
        """
        Convert a single SVG file.

        Args:
            svg_path: Path to the SVG file to convert
            output_path: Path to save the output image
            options: Conversion options

        Returns:
            ConversionResult: Result of the conversion
        """
        if self._cancelled:
            return self._cancelled_result()

        return self.converter.convert(svg_path, output_path, options)

    def _cancelled_result(self) -> ConversionResult:
        """Create a cancelled conversion result."""
        return ConversionResult(
            success=False,
            input_path="",
            output_path="",
            duration=0.0,
            width=0,
            height=0,
            output_size=0,
            output_format="unknown",
            error="Conversion cancelled",
        )

    def cancel(self) -> None:
        """Cancel the current batch processing."""
        self._cancelled = True
