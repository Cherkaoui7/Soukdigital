import os
from pathlib import Path
from typing import Callable, List, Optional, Union

from PIL import Image

from converter.exceptions import ExportError


class ExportManager:
    """
    Manages the export of images to various formats.

    Handles saving images with proper file handling and format conversion.
    """

    def __init__(self):
        """Initialize the ExportManager."""
        self.supported_formats = ["png", "jpeg", "webp", "pdf"]

    def export_file(
        self,
        image: Image.Image,
        output_path: str,
        format: str,
        overwrite: Union[bool, str] = False,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> str:
        """
        Export a single image file.

        Args:
            image: PIL Image to export
            output_path: Path to save the image
            format: Output format (png, jpeg, webp, pdf)
            overwrite: Overwrite policy (False, True, "unique", "timestamp")
            progress_callback: Callback for progress updates (optional)

        Returns:
            str: Actual path where the file was saved

        Raises:
            ExportError: If export fails

        Example:
            >>> manager = ExportManager()
            >>> manager.export_file(image, "output.png", "png")
        """
        if format.lower() not in self.supported_formats:
            raise ExportError(f"Unsupported format: {format}")

        output_path = self._handle_overwrite(output_path, overwrite)

        try:
            if format.lower() == "pdf":
                # For PDF, we'll save as PNG and mention PDF in the filename
                pdf_path = output_path.replace(".pdf", ".png")
                image.save(pdf_path, format="PNG")
                return pdf_path
            else:
                image.save(output_path, format=format.upper())
                return output_path
        except Exception as e:
            raise ExportError(f"Failed to export image: {str(e)}")

    def export_batch(
        self,
        images: List[Image.Image],
        output_paths: List[str],
        format: str,
        overwrite: Union[bool, str] = False,
        progress_callback: Optional[Callable[[int, int], None]] = None,
    ) -> List[str]:
        """
        Export a batch of image files.

        Args:
            images: List of PIL Images to export
            output_paths: List of paths to save the images
            format: Output format (png, jpeg, webp, pdf)
            overwrite: Overwrite policy (False, True, "unique", "timestamp")
            progress_callback: Callback for progress updates (optional)

        Returns:
            List[str]: List of actual paths where files were saved

        Raises:
            ExportError: If export fails

        Example:
            >>> manager = ExportManager()
            >>> manager.export_batch([image1, image2], ["out1.png", "out2.png"], "png")
        """
        if len(images) != len(output_paths):
            raise ExportError("Number of images and output paths must match")

        if format.lower() not in self.supported_formats:
            raise ExportError(f"Unsupported format: {format}")

        saved_paths = []
        for i, (image, path) in enumerate(zip(images, output_paths)):
            try:
                saved_path = self.export_file(
                    image, path, format, overwrite, progress_callback
                )
                saved_paths.append(saved_path)

                if progress_callback:
                    progress_callback(i + 1, len(images))
            except Exception as e:
                raise ExportError(f"Failed to export batch: {str(e)}")

        return saved_paths

    def _handle_overwrite(self, output_path: str, overwrite: Union[bool, str]) -> str:
        """
        Handle file overwrite based on the specified policy.

        Args:
            output_path: Original output path
            overwrite: Overwrite policy (False, True, "unique", "timestamp")

        Returns:
            str: Adjusted output path based on overwrite policy

        Raises:
            ExportError: If the file exists and overwrite is False
        """
        path = Path(output_path)

        if overwrite is True:
            return str(path)
        elif overwrite == "unique":
            # Generate a unique filename
            counter = 1
            while path.exists():
                stem = path.stem
                suffix = path.suffix
                path = path.with_name(f"{stem}_{counter}{suffix}")
                counter += 1
            return str(path)
        elif overwrite == "timestamp":
            # Add timestamp to filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            stem = path.stem
            suffix = path.suffix
            path = path.with_name(f"{stem}_{timestamp}{suffix}")
            return str(path)
        else:
            # Default behavior (overwrite=False)
            if path.exists():
                raise ExportError(f"File already exists: {output_path}")
            return str(path)
