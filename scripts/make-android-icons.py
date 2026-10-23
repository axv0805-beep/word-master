"""从 build/icon-source.jpg 生成 Android 启动图标（legacy mipmap + 自适应图标前景）。

用法：python scripts/make-android-icons.py
图形由 scripts/iconlib.py 抠出并按几何中心对齐，避免源图软阴影导致的偏移。
"""
from pathlib import Path

from PIL import Image

from iconlib import SRC, foreground, load_graphic, plate

ROOT = Path(__file__).resolve().parent.parent
RES = ROOT / "android" / "app" / "src" / "main" / "res"

# 各密度的 legacy 图标边长（48dp）与自适应图标画布（108dp）
LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}
ADAPTIVE = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}

# 图形宽度占画布比例：legacy 大一些更醒目；自适应前景压进 66dp 安全区
LEGACY_RATIO = 0.54
FOREGROUND_RATIO = 0.45
PLATE_TOP, PLATE_BOTTOM = "#FCFEFB", "#EFF8EA"

ADAPTIVE_XML = """<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
</adaptive-icon>
"""

COLORS_XML = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">{color}</color>
</resources>
"""


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"找不到源图 {SRC}")

    graphic = load_graphic()

    for name, size in LEGACY.items():
        folder = RES / f"mipmap-{name}"
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / "ic_launcher.png"
        plate(size, graphic, LEGACY_RATIO, 0.219, PLATE_TOP, PLATE_BOTTOM).save(path, optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({size}x{size})")

    for name, size in ADAPTIVE.items():
        folder = RES / f"mipmap-{name}"
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / "ic_launcher_foreground.png"
        foreground(size, graphic, FOREGROUND_RATIO).save(path, optimize=True)
        print(f"wrote {path.relative_to(ROOT)} ({size}x{size})")

    anydpi = RES / "mipmap-anydpi-v26"
    anydpi.mkdir(parents=True, exist_ok=True)
    for filename in ("ic_launcher.xml", "ic_launcher_round.xml"):
        (anydpi / filename).write_text(ADAPTIVE_XML, encoding="utf-8")
        print(f"wrote {(anydpi / filename).relative_to(ROOT)}")

    values = RES / "values"
    values.mkdir(parents=True, exist_ok=True)
    (values / "ic_launcher_background.xml").write_text(
        COLORS_XML.format(color=PLATE_TOP), encoding="utf-8"
    )
    print(f"wrote {(values / 'ic_launcher_background.xml').relative_to(ROOT)}")


if __name__ == "__main__":
    main()
