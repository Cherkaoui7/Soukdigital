import sys

from converter.svg_converter import SVGConverter
from ui.main_window import MainWindow


def main():
    """
    Main entry point for the SVG Converter application.

    Creates and runs the main application window.
    """
    # Initialize the converter
    converter = SVGConverter()

    # Create and run the main window
    app = MainWindow(converter)
    app.mainloop()


if __name__ == "__main__":
    main()
