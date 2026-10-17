#!/usr/bin/env python3
"""Render assets/og-card.png, the 1200x630 image LinkedIn, X and Slack show when
the site is shared. Run it by hand when the headshot or headline changes:

    python3 -m venv /tmp/ogv && /tmp/ogv/bin/pip install pillow
    /tmp/ogv/bin/python src/scripts/og-image.py

The card reuses the graph's palette (#070a13 background, #3abff8 accent) and the
committed headshot assets/bryan-focht.jpg.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
PHOTO = ROOT / "assets" / "bryan-focht.jpg"
OUT = ROOT / "assets" / "og-card.png"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")

W, H = 1200, 630
BG, BG2 = (7, 10, 19), (13, 21, 38)
TXT, DIM, ACCENT = (219, 230, 245), (154, 172, 196), (58, 191, 248)
SKILL, CRED = (167, 139, 250), (251, 191, 36)


def font(name, size):
    return ImageFont.truetype(str(FONT_DIR / name), size)


img = Image.new("RGB", (W, H), BG)
d = ImageDraw.Draw(img)

# Soft vertical gradient so the card is not a flat black slab.
for y in range(H):
    t = y / H
    d.line([(0, y), (W, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(BG2, BG)))

# A faint constellation on the right, echoing the knowledge graph.
nodes = [(1040, 60, 8, ACCENT), (1140, 40, 6, SKILL), (1170, 150, 7, CRED), (1080, 130, 10, ACCENT),
         (1120, 230, 6, SKILL), (1165, 330, 8, ACCENT), (1090, 420, 6, CRED), (1150, 500, 7, SKILL),
         (1070, 580, 5, ACCENT), (1160, 600, 6, CRED)]
edges = [(0, 1), (1, 2), (0, 3), (3, 4), (2, 4), (4, 5), (5, 6), (6, 7), (7, 8), (7, 9), (8, 9), (3, 2)]
layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ld = ImageDraw.Draw(layer)
for a, b in edges:
    ld.line([nodes[a][:2], nodes[b][:2]], fill=(120, 150, 200, 70), width=2)
for x, y, r, c in nodes:
    ld.ellipse([x - r, y - r, x + r, y + r], fill=c + (170,))
layer = layer.filter(ImageFilter.GaussianBlur(0.6))
img.paste(layer, (0, 0), layer)
d = ImageDraw.Draw(img)

# Headshot in a ring, left side.
size = 300
photo = Image.open(PHOTO).convert("RGB").resize((size, size), Image.LANCZOS)
mask = Image.new("L", (size * 4, size * 4), 0)
ImageDraw.Draw(mask).ellipse([0, 0, size * 4 - 1, size * 4 - 1], fill=255)
mask = mask.resize((size, size), Image.LANCZOS)
px, py = 90, (H - size) // 2
ring = 6
d.ellipse([px - ring, py - ring, px + size + ring, py + size + ring], fill=ACCENT)
img.paste(photo, (px, py), mask)
d = ImageDraw.Draw(img)

# Text block.
x = px + size + 70
name_f = font("Arial Bold.ttf", 74)
sub_f = font("Arial.ttf", 34)
small_f = font("Arial.ttf", 26)
d.text((x, 185), "Bryan Focht", font=name_f, fill=TXT)
d.text((x, 285), "Engineering Executive · Cloud & AI", font=sub_f, fill=ACCENT)
d.text((x, 345), "25+ years building enterprise commerce platforms,", font=small_f, fill=DIM)
d.text((x, 381), "cloud infrastructure and AI agents.", font=small_f, fill=DIM)
d.line([(x, 440), (x + 120, 440)], fill=(120, 150, 200), width=2)
d.text((x, 460), "bfocht.github.io  ·  interactive career graph", font=small_f, fill=DIM)

img.save(OUT, optimize=True)
print("wrote", OUT, img.size, OUT.stat().st_size, "bytes")
