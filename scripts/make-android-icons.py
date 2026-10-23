"""从 build/icon-source.jpg 生成 Android 启动图标（mipmap 各密度）。"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "build" / "icon-source.jpg"
RES = ROOT / "android" / "app" / "src" / "main" / "res"

DENSITIES = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def trim_white(img: Image.Image, margin_ratio: float = 0.052) -> Image.Image:
    """按非白像素裁掉外圈白边，再留一点边距。"""
    rgb = img.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if r < 246 or g < 246 or b < 246:
                if x < min_x:
                    min_x = x
                if x > max_x:
                    max_x = x
                if y < min_y:
                    min_y = y
                if y > max_y:
                    max_y = y
    pad = int(max(max_x - min_x, max_y - min_y) * margin_ratio)
    min_x = max(0, min_x - pad)
    min_y = max(0, min_y - pad)
    max_x = min(w, max_x + pad)
    max_y = min(h, max_y + pad)
    side = max(max_x - min_x, max_y - min_y)
    cx, cy = (min_x + max_x) // 2, (min_y + max_y) // 2
    box = (cx - side // 2, cy - side // 2, cx + side // 2, cy + side // 2)
    return img.crop(box).resize((side, side), Image.LANCZOS)


def rounded(img: Image.Image, size: int, radius_ratio: float = 0.219) -> Image.Image:
    out = img.resize((size, size), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=int(size * radius_ratio), fill=255
    )
    out.putalpha(mask)
    return out


def main() -> None:
    src = Image.open(SRC)
    square = trim_white(src)
    for name, size in DENSITIES.items():
        folder = RES / f"mipmap-{name}"
        folder.mkdir(parents=True, exist_ok=True)
        rounded(square, size).save(folder / "ic_launcher.png")
        print(f"wrote {folder / 'ic_launcher.png'} ({size}x{size})")


if __name__ == "__main__":
    main()
