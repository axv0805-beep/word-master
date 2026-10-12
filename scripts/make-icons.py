"""
生成 PWA 图标（favicon.svg / icon-192.png / icon-512.png）。
用法：python scripts/make-icons.py
"""
import math
import os
import struct
import zlib

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "public", "icons")

# 品牌渐变端点（与 tailwind.config.js / index.css 一致）
STOPS = [(0.0, (99, 102, 241)), (0.52, (139, 92, 246)), (1.0, (236, 72, 153))]


def lerp(a, b, t):
    return a + (b - a) * t


def gradient_at(t):
    t = max(0.0, min(1.0, t))
    for i in range(len(STOPS) - 1):
        t0, c0 = STOPS[i]
        t1, c1 = STOPS[i + 1]
        if t0 <= t <= t1:
            local = 0.0 if t1 == t0 else (t - t0) / (t1 - t0)
            return tuple(int(round(lerp(c0[k], c1[k], local))) for k in range(3))
    return STOPS[-1][1]


def rounded_rect_coverage(x, y, w, h, radius):
    """返回像素 (x,y) 在圆角矩形内的覆盖率（0..1，做 3x3 超采样）。"""
    hits = 0
    samples = 3
    for sx in range(samples):
        for sy in range(samples):
            px = x + (sx + 0.5) / samples
            py = y + (sy + 0.5) / samples
            cx = min(max(px, radius), w - radius)
            cy = min(max(py, radius), h - radius)
            if (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2:
                hits += 1
    return hits / (samples * samples)


def letter_w(x, y, w, h):
    """白色字母 W 的覆盖率（4 段折线，取各段中覆盖率最大者）。"""
    strokes = [
        ((0.24, 0.30), (0.385, 0.72)),
        ((0.385, 0.72), (0.50, 0.44)),
        ((0.50, 0.44), (0.615, 0.72)),
        ((0.615, 0.72), (0.76, 0.30)),
    ]
    px, py = x / w, y / h
    thickness = 0.062
    best = 0.0
    for (x0, y0), (x1, y1) in strokes:
        dx, dy = x1 - x0, y1 - y0
        length_sq = dx * dx + dy * dy
        t = 0.0 if length_sq == 0 else max(0.0, min(1.0, ((px - x0) * dx + (py - y0) * dy) / length_sq))
        cx, cy = x0 + t * dx, y0 + t * dy
        dist = math.hypot(px - cx, py - cy)
        best = max(best, max(0.0, min(1.0, (thickness - dist) / thickness * 3.0)))
    return best


def render_png(size, path):
    radius = size * 0.24
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            coverage = rounded_rect_coverage(x, y, size, size, radius)
            t = (x / size) * 0.55 + (y / size) * 0.45
            r, g, b = gradient_at(t)
            letter = letter_w(x, y, size, size)
            if letter > 0:
                r = int(round(lerp(r, 255, letter)))
                g = int(round(lerp(g, 255, letter)))
                b = int(round(lerp(b, 255, letter)))
            alpha = int(round(coverage * 255))
            row += bytes((r, g, b, alpha))
        rows.append(bytes(row))

    raw = b"".join(b"\x00" + row for row in rows)

    def chunk(tag, data):
        return (
            struct.pack(">I", len(data))
            + tag
            + data
            + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as fh:
        fh.write(png)


FAVICON = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366F1"/>
      <stop offset="52%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#g)"/>
  <path d="M15 19 L24 46 L32 28 L40 46 L49 19" fill="none" stroke="#fff"
        stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
"""


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    for size in (192, 512):
        target = os.path.join(OUT_DIR, f"icon-{size}.png")
        render_png(size, target)
        print(f"已生成 {os.path.relpath(target, ROOT)}")
    svg_path = os.path.join(OUT_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as fh:
        fh.write(FAVICON)
    print(f"已生成 {os.path.relpath(svg_path, ROOT)}")


if __name__ == "__main__":
    main()
