"""从 build/icon-source.jpg 生成全套应用图标（PWA / Apple Touch / favicon / Electron）。

用法：python scripts/make-icons.py
更换图标时，把新图存成 build/icon-source.jpg（正方形、图标板尽量贴边）再跑一次即可。
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "build" / "icon-source.jpg"
ICONS = ROOT / "public" / "icons"
BUILD = ROOT / "build"

# 图标板四周的白边：按短边比例裁掉，避免图标里留一圈空白
MARGIN_RATIO = 0.052


def load_plate() -> Image.Image:
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    margin = int(min(w, h) * MARGIN_RATIO)
    return img.crop((margin, margin, w - margin, h - margin))


def save_square(image: Image.Image, size: int, path: Path) -> None:
    image.resize((size, size), Image.LANCZOS).save(path, optimize=True)
    print(f"已生成 {path.relative_to(ROOT)}")


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(parents=True, exist_ok=True)

    plate = load_plate()
    base = plate.resize((1024, 1024), Image.LANCZOS)
    plate_bg = plate.getpixel((6, 6))

    save_square(base, 512, ICONS / "icon-512.png")
    save_square(base, 192, ICONS / "icon-192.png")
    save_square(base, 180, ICONS / "apple-touch-icon.png")
    save_square(base, 32, ICONS / "favicon-32.png")

    # maskable：Android 会按圆形裁切，内容压进 78% 安全区，四周补图标板底色
    maskable = Image.new("RGBA", (512, 512), plate_bg)
    maskable.alpha_composite(base.resize((400, 400), Image.LANCZOS), (56, 56))
    save_square(maskable, 512, ICONS / "icon-maskable-512.png")

    base.resize((64, 64), Image.LANCZOS).save(
        ICONS / "favicon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)]
    )
    print("已生成 public/icons/favicon.ico")

    # 圆角版，给应用内 logo / 引导页用
    rounded = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    mask = Image.new("L", (512, 512), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, 511, 511), radius=112, fill=255)
    rounded.paste(base.resize((512, 512), Image.LANCZOS), (0, 0), mask)
    rounded.save(ICONS / "logo-512.png", optimize=True)
    print("已生成 public/icons/logo-512.png")

    # Windows 快捷方式 / exe 图标
    base.resize((256, 256), Image.LANCZOS).save(
        BUILD / "icon.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("已生成 build/icon.ico")


if __name__ == "__main__":
    main()
