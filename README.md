# SVG Converter

A desktop application for converting SVG files to images.

## Features
- Convert SVG files to PNG
- Modern GUI using CustomTkinter
- Presets and history support

## Installation
1. Install Python 3.10+
2. Install dependencies: `pip install -r requirements.txt`

## Running
Run `python app.py`

## Testing
1. Install dev dependencies: `pip install -r requirements-dev.txt`
2. Run `pytest tests/`

## Building the Executable
1. Install dev dependencies
2. Run `pyinstaller --noconfirm --onedir --windowed --name "SVG Converter" app.py`