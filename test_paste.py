from PIL import Image

with Image.new("RGB", (100, 100), (255, 255, 255)) as bg:
    with Image.new("RGBA", (100, 100), (0, 0, 255, 128)) as fg:
        bg.paste(fg, mask=fg)
        print("Pasted red extrema:", bg.getextrema()[0])
