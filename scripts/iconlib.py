"""图标合成的公共工具：从 build/icon-source.jpg 抠出绿色图形，再按需居中合成。

原脚本用「非白像素」裁边，会把源图右下角的软阴影一起算进内容，导致图形整体偏左上；
这里改成用饱和度找图形本身，再用软阈值把接近白色的底抠成透明，最后按几何中心对齐。
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "build" / "icon-source.jpg"

# 源图里板底是 (254,254,254)，图形最浅的页面约 204，取中间值做软阈值
KEY_LEVEL = 46.0


def _saturation(r: int, g: int, b: int) -> float:
    mx, mn = max(r, g, b), min(r, g, b)
    return 0.0 if mx == 0 else (mx - mn) / mx


def load_graphic() -> Image.Image:
    """返回带 alpha 的绿色图形（书本 + 嫩芽），四周按图形自身 bbox 收紧。"""
    src = Image.open(SRC).convert("RGB")
    w, h = src.size
    px = src.load()

    # 1. 用饱和度找图形 bbox，忽略白色板底与阴影
    min_x, min_y, max_x, max_y = w, h, 0, 0
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            if _saturation(r, g, b) > 0.12:
                min_x = min(min_x, x)
                max_x = max(max_x, x)
                min_y = min(min_y, y)
                max_y = max(max_y, y)
    if max_x <= min_x or max_y <= min_y:
        raise SystemExit("找不到图标图形，请检查 build/icon-source.jpg")

    # 2. 软阈值抠图：离白色越远越不透明
    graphic = Image.new("RGBA", (max_x - min_x + 1, max_y - min_y + 1), (0, 0, 0, 0))
    out = graphic.load()
    for y in range(min_y, max_y + 1):
        for x in range(min_x, max_x + 1):
            r, g, b = px[x, y]
            detail = 254 - min(r, g, b)
            alpha = max(0.0, min(1.0, (detail - 4.0) / KEY_LEVEL))
            if alpha <= 0.0:
                continue
            out[x - min_x, y - min_y] = (r, g, b, int(round(alpha * 255)))
    return graphic


def plate(size: int, graphic: Image.Image, ratio: float, radius_ratio: float, top: str, bottom: str) -> Image.Image:
    """白底圆角板 + 居中图形。ratio = 图形宽度占画布的比例。"""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bg = Image.new("RGB", (1, size))
    top_rgb, bottom_rgb = Image.new("RGB", (1, 1), top).getpixel((0, 0)), Image.new("RGB", (1, 1), bottom).getpixel((0, 0))
    for y in range(size):
        t = y / max(1, size - 1)
        bg.putpixel((0, y), tuple(int(top_rgb[i] + (bottom_rgb[i] - top_rgb[i]) * t) for i in range(3)))
    canvas.paste(bg.resize((size, size)), (0, 0))

    target_w = int(size * ratio)
    target_h = int(round(graphic.height * target_w / graphic.width))
    whole = graphic.resize((target_w, target_h), Image.LANCZOS)
    canvas.alpha_composite(whole, ((size - target_w) // 2, (size - target_h) // 2))

    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * radius_ratio), fill=255)
    canvas.putalpha(mask)
    return canvas


def foreground(size: int, graphic: Image.Image, ratio: float) -> Image.Image:
    """自适应图标前景层：透明底 + 居中的图形（不含板底）。"""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    target_w = int(size * ratio)
    target_h = int(round(graphic.height * target_w / graphic.width))
    whole = graphic.resize((target_w, target_h), Image.LANCZOS)
    canvas.alpha_composite(whole, ((size - target_w) // 2, (size - target_h) // 2))
    return canvas
