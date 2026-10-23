"""从 build/icon-source.jpg 生成全套应用图标（PWA / Apple Touch / favicon / Electron / 应用内 logo）。

用法：python scripts/make-icons.py
更换图标时把新图存成 build/icon-source.jpg（正方形即可，程序会自动抠出图形并居中）再跑一次。
"""
from pathlib import Path

from PIL import Image

from iconlib import SRC, load_graphic, plate

ROOT = Path(__file__).resolve().parent.parent
ICONS = ROOT / "public" / "icons"
BUILD = ROOT / "build"

# 图形宽度占画布比例：普通图标留白少一点更醒目，maskable 要压进 80% 安全区
ICON_RATIO = 0.58
MASKABLE_RATIO = 0.46
PLATE_TOP, PLATE_BOTTOM = "#FCFEFB", "#EFF8EA"


def save(image: Image.Image, size: int, path: Path) -> None:
    image.resize((size, size), Image.LANCZOS).save(path, optimize=True)
    print(f"已生成 {path.relative_to(ROOT)}")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"找不到源图 {SRC}")
    ICONS.mkdir(parents=True, exist_ok=True)
    BUILD.mkdir(parents=True, exist_ok=True)

    graphic = load_graphic()

    # PWA / Apple Touch / favicon 都是方图，圆角交给系统裁
    square = plate(1024, graphic, ICON_RATIO, 0.0, PLATE_TOP, PLATE_BOTTOM)
    save(square, 512, ICONS / "icon-512.png")
    save(square, 192, ICONS / "icon-192.png")
    save(square, 180, ICONS / "apple-touch-icon.png")
    save(square, 32, ICONS / "favicon-32.png")

    maskable = plate(1024, graphic, MASKABLE_RATIO, 0.0, PLATE_TOP, PLATE_BOTTOM)
    save(maskable, 512, ICONS / "icon-maskable-512.png")

    square.resize((64, 64), Image.LANCZOS).save(
        ICONS / "favicon.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64)]
    )
    print("已生成 public/icons/favicon.ico")

    # 应用内 logo / 引导页：自己带圆角
    save(plate(1024, graphic, ICON_RATIO, 0.219, PLATE_TOP, PLATE_BOTTOM), 512, ICONS / "logo-512.png")

    # Windows 快捷方式 / exe 图标
    square.resize((256, 256), Image.LANCZOS).save(
        BUILD / "icon.ico",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )
    print("已生成 build/icon.ico")


if __name__ == "__main__":
    main()
