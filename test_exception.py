import sys
from pathlib import Path
sys.path.insert(0, ".")
from converter.svg_converter import SVGConverter, ConversionOptions
from converter.exceptions import *

c = SVGConverter()
res = c.convert(Path("tests/assets/invalid.svg"), Path("out.png"))
print("Success:", res.success)
print("Error:", type(res.error), repr(res.error))
