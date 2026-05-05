from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
GEN = ROOT / "assets" / "generated"
SHOW = ROOT / "assets" / "showcase"

CREAM = (244, 243, 240)
INK = (50, 50, 50)
MUTED = (114, 106, 100)
CRIMSON = (190, 26, 47)
GRAY = (136, 136, 136)


def font(size: int, bold: bool = False, serif: bool = False) -> ImageFont.FreeTypeFont:
    candidates = []
    if serif:
        candidates += [
            "C:/Windows/Fonts/BASKVILL.TTF",
            "C:/Windows/Fonts/georgia.ttf",
            "C:/Windows/Fonts/times.ttf",
        ]
    if bold:
        candidates += [
            "C:/Windows/Fonts/arialbd.ttf",
            "C:/Windows/Fonts/seguisb.ttf",
        ]
    candidates += [
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/segoeui.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            pass
    return ImageFont.load_default()


SERIF_24 = font(24, serif=True)
SERIF_30 = font(30, serif=True)
SERIF_42 = font(42, serif=True)
SERIF_58 = font(58, serif=True)
SANS_20 = font(20)
SANS_26 = font(26)
SANS_32 = font(32, bold=True)
SANS_42 = font(42, bold=True)


def new_canvas(w: int = 1600, h: int = 1000, bg=CREAM) -> Image.Image:
    img = Image.new("RGB", (w, h), bg)
    px = img.load()
    random.seed(42 + w + h)
    for _ in range(w * h // 75):
        x = random.randrange(w)
        y = random.randrange(h)
        delta = random.choice([-7, -5, -3, 3, 5])
        r, g, b = px[x, y]
        px[x, y] = tuple(max(0, min(255, c + delta)) for c in (r, g, b))
    return img


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)


def text_center(draw: ImageDraw.ImageDraw, xy, text: str, fnt, fill=INK) -> None:
    x, y = xy
    box = draw.textbbox((0, 0), text, font=fnt)
    draw.text((x - (box[2] - box[0]) / 2, y - (box[3] - box[1]) / 2), text, font=fnt, fill=fill)


def wrap(draw: ImageDraw.ImageDraw, text: str, fnt, max_width: int) -> list[str]:
    words = text.split()
    lines: list[str] = []
    line = ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textlength(trial, font=fnt) <= max_width:
            line = trial
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def arrow(draw, start, end, fill=CRIMSON, width=8) -> None:
    draw.line([start, end], fill=fill, width=width)
    sx, sy = start
    ex, ey = end
    ang = math.atan2(ey - sy, ex - sx)
    head = 24
    pts = [
        (ex, ey),
        (ex - head * math.cos(ang - 0.45), ey - head * math.sin(ang - 0.45)),
        (ex - head * math.cos(ang + 0.45), ey - head * math.sin(ang + 0.45)),
    ]
    draw.polygon(pts, fill=fill)


def circle_arrow(draw, box, fill=CRIMSON, width=8) -> None:
    draw.arc(box, 25, 350, fill=fill, width=width)
    cx = (box[0] + box[2]) / 2
    cy = (box[1] + box[3]) / 2
    rx = (box[2] - box[0]) / 2
    ry = (box[3] - box[1]) / 2
    t = math.radians(350)
    ex = cx + rx * math.cos(t)
    ey = cy + ry * math.sin(t)
    ang = t + math.pi / 2
    head = 24
    draw.polygon(
        [
            (ex, ey),
            (ex - head * math.cos(ang - 0.45), ey - head * math.sin(ang - 0.45)),
            (ex - head * math.cos(ang + 0.45), ey - head * math.sin(ang + 0.45)),
        ],
        fill=fill,
    )


def icon(draw, kind: str, cx: int, cy: int, color=INK, scale: float = 1.0) -> None:
    r = int(38 * scale)
    if kind == "question":
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), outline=color, width=5)
        text_center(draw, (cx, cy - 3), "?", font(int(56 * scale), bold=True, serif=True), color)
    elif kind == "tap":
        draw.rounded_rectangle((cx - 24, cy - 34, cx + 24, cy + 34), 8, outline=color, width=4)
        draw.line((cx - 70, cy + 42, cx - 12, cy + 4), fill=color, width=6)
        draw.ellipse((cx - 9, cy - 1, cx + 10, cy + 18), outline=color, width=4)
    elif kind == "check":
        draw.line((cx - 42, cy, cx - 8, cy + 35, cx + 52, cy - 40), fill=color, width=8, joint="curve")
    elif kind == "pencil":
        draw.line((cx - 45, cy + 36, cx + 35, cy - 44), fill=color, width=12)
        draw.polygon([(cx + 35, cy - 44), (cx + 55, cy - 58), (cx + 49, cy - 32)], fill=color)
    elif kind == "eye":
        draw.arc((cx - 58, cy - 32, cx + 58, cy + 32), 200, 340, fill=color, width=5)
        draw.arc((cx - 58, cy - 32, cx + 58, cy + 32), 20, 160, fill=color, width=5)
        draw.ellipse((cx - 13, cy - 13, cx + 13, cy + 13), fill=color)
    elif kind == "bubble":
        draw.rounded_rectangle((cx - 48, cy - 30, cx + 48, cy + 26), 18, outline=color, width=5)
        draw.polygon([(cx - 12, cy + 26), (cx - 34, cy + 48), (cx + 16, cy + 26)], outline=color)
    elif kind == "heart":
        draw.ellipse((cx - 32, cy - 30, cx, cy + 2), outline=color, width=5)
        draw.ellipse((cx, cy - 30, cx + 32, cy + 2), outline=color, width=5)
        draw.polygon([(cx - 32, cy - 8), (cx + 32, cy - 8), (cx, cy + 48)], outline=color)


def draw_paper_card(draw, box, title, body, border=GRAY, fill=(252, 251, 247)) -> None:
    x1, y1, x2, y2 = box
    draw.rounded_rectangle((x1 + 10, y1 + 14, x2 + 10, y2 + 14), 12, fill=(222, 219, 211))
    draw.rounded_rectangle(box, 12, fill=fill, outline=border, width=5)
    draw.text((x1 + 34, y1 + 36), title, font=SERIF_42, fill=INK)
    y = y1 + 120
    for line in wrap(draw, body, SERIF_30, x2 - x1 - 70):
        draw.text((x1 + 34, y), line, font=SERIF_30, fill=MUTED)
        y += 42


def s01() -> None:
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.text((360, 58), "Activities end. Loops teach.", font=SERIF_58, fill=INK)
    d.line((800, 150, 800, 870), fill=(190, 184, 176), width=3)
    text_center(d, (400, 190), "ACTIVITY", SERIF_42)
    text_center(d, (1200, 190), "LOOP", SERIF_42)
    xs = [215, 400, 585]
    for k, x in zip(["question", "tap", "check"], xs):
        icon(d, k, x, 440, INK)
    arrow(d, (275, 440), (342, 440), INK, 5)
    arrow(d, (460, 440), (527, 440), INK, 5)
    arrow(d, (640, 440), (735, 440), INK, 5)
    text_center(d, (400, 640), "begins, ends, leaves no trace.", SERIF_24, MUTED)
    pts = [(1200, 290), (1350, 440), (1200, 610), (1050, 440)]
    circle_arrow(d, (1000, 250, 1400, 650), CRIMSON, 8)
    for k, (x, y) in zip(["question", "tap", "bubble", "pencil"], pts):
        icon(d, k, x, y, CRIMSON)
    text_center(d, (1200, 708), "begins, ends, returns, teaches.", SERIF_24, MUTED)
    save(img, GEN / "s01-loop-vs-activity.png")


def s02() -> None:
    img = new_canvas()
    d = ImageDraw.Draw(img)
    d.line((220, 104, 1380, 104), fill=(194, 184, 174), width=3)
    d.text((595, 54), "D1 · Design Problem Statement", font=SERIF_30, fill=MUTED)
    cards = [
        ((290, 165, 720, 465), "LEARNER", "first-year stats students, no calculus.", CRIMSON),
        ((880, 165, 1310, 465), "CONTEXT", "200-seat lecture, mid-semester, 50-min slot.", GRAY),
        ((290, 540, 720, 840), "CONSTRAINT", "15 minutes max, no extra software, runs in the LMS.", GRAY),
        ((880, 540, 1310, 840), "SHIFT", "intuition for variance, not formula recall.", CRIMSON),
    ]
    for box, title, body, border in cards:
        draw_paper_card(d, box, title, body, border)
    text_center(d, (800, 930), "State the gap before you propose the bridge.", SERIF_30, MUTED)
    save(img, GEN / "s02-d1-cards.png")


def s04() -> None:
    img = new_canvas()
    d = ImageDraw.Draw(img)
    text_center(d, (800, 72), "Anatomy of a Learning Loop.", SERIF_58)
    center = (800, 515)
    circle_arrow(d, (500, 215, 1100, 815), CRIMSON, 9)
    nodes = {
        "SIGNAL": ("eye", 800, 220, "specific, not general", (1035, 185)),
        "ACTION": ("tap", 1100, 515, "small enough to actually try", (1180, 470)),
        "FEEDBACK": ("bubble", 800, 815, "under 200ms", (985, 860)),
        "REVISE": ("pencil", 500, 515, "not optional", (250, 555)),
    }
    for label, (kind, x, y, note, npos) in nodes.items():
        icon(d, kind, x, y, CRIMSON)
        text_center(d, (x, y + 82), label, SERIF_24, INK)
        d.line((x, y, npos[0], npos[1]), fill=(130, 125, 118), width=2)
        d.text(npos, note, font=SERIF_24, fill=MUTED)
    d.line((740, 515, 770, 515, 790, 465, 820, 565, 850, 515, 900, 515), fill=INK, width=5)
    text_center(d, (800, 600), "the part that has to feel right.", SERIF_24, MUTED)
    save(img, GEN / "s04-loop-anatomy.png")


def s05() -> None:
    img = new_canvas()
    d = ImageDraw.Draw(img)
    text_center(d, (800, 70), "UDL x Game Design Crosswalk.", SERIF_58)
    text_center(d, (800, 123), "Where do your mechanics already cover multiple means? Where are the holes?", SERIF_24, MUTED)
    x0, y0 = 265, 200
    cell_w, cell_h = 365, 205
    cols = ["REPRESENTATION", "ACTION & EXPRESSION", "ENGAGEMENT"]
    rows = ["RECOGNITION", "STRATEGIC", "AFFECTIVE"]
    for i, c in enumerate(cols):
        text_center(d, (x0 + i * cell_w + cell_w / 2, y0 - 42), c, SERIF_24)
    for i, r in enumerate(rows):
        d.text((72, y0 + i * cell_h + 82), r, font=SERIF_24, fill=INK)
    for r in range(3):
        for c in range(3):
            box = (x0 + c * cell_w, y0 + r * cell_h, x0 + (c + 1) * cell_w, y0 + (r + 1) * cell_h)
            if (r, c) in [(0, 2), (2, 1)]:
                d.rounded_rectangle((box[0] + 18, box[1] + 18, box[2] - 18, box[3] - 18), 18, fill=(238, 199, 204), outline=CRIMSON, width=4)
                d.text((box[0] + 235, box[1] + 24), "design hits", font=SANS_20, fill=CRIMSON)
            d.rectangle(box, outline=(194, 184, 174), width=3)
            cx, cy = int((box[0] + box[2]) / 2), int((box[1] + box[3]) / 2)
            kinds = ["bubble", "pencil", "question", "check", "tap", "heart", "eye", "bubble", "check"]
            icon(d, kinds[r * 3 + c], cx, cy, INK, .75)
    save(img, GEN / "s05-udl-grid.png")


def s10() -> None:
    img = Image.new("RGB", (1600, 1000), (202, 164, 116))
    d = ImageDraw.Draw(img)
    for y in range(0, 1000, 38):
        d.line((0, y, 1600, y + random.randint(-8, 8)), fill=(170, 132, 92), width=2)
    d.rounded_rectangle((410, 250, 1190, 720), 18, fill=(248, 244, 232), outline=(90, 70, 55), width=3)
    for i in range(8):
        x = 455 + (i % 4) * 175
        y = 300 + (i // 4) * 175
        d.rounded_rectangle((x, y, x + 135, y + 118), 8, fill=(255, 253, 245), outline=(80, 80, 76), width=2)
        d.line((x + 20, y + 34, x + 115, y + 34), fill=INK, width=2)
        d.line((x + 20, y + 62, x + 96, y + 62), fill=MUTED, width=2)
        if i < 7:
            arrow(d, (x + 138, y + 58), (x + 168, y + 58), INK, 3)
    notes = [("v1", (210, 520), (255, 248, 196)), ("v2", (685, 135), (245, 203, 208)), ("v3", (1210, 575), (244, 220, 165))]
    for t, (x, y), col in notes:
        d.rounded_rectangle((x, y, x + 155, y + 115), 10, fill=col, outline=(155, 135, 105), width=2)
        text_center(d, (x + 78, y + 58), t, SERIF_42, INK)
    arrow(d, (365, 555), (680, 190), (92, 76, 62), 4)
    arrow(d, (840, 195), (1210, 625), (92, 76, 62), 4)
    d.ellipse((120, 690, 300, 850), outline=(120, 88, 66), width=8)
    d.ellipse((150, 715, 275, 825), outline=(120, 88, 66), width=4)
    d.line((675, 180, 905, 365), fill=(120, 82, 44), width=16)
    d.polygon([(905, 365), (940, 395), (890, 388)], fill=(48, 38, 28))
    d.ellipse((1310, 705, 1465, 860), fill=(230, 226, 214), outline=INK, width=5)
    d.line((1387, 782, 1428, 745), fill=INK, width=5)
    d.line((1387, 782, 1355, 815), fill=CRIMSON, width=4)
    d.rounded_rectangle((145, 95, 410, 330), 12, fill=(246, 240, 226), outline=(120, 100, 80), width=3)
    d.line((180, 150, 365, 150), fill=INK, width=2)
    d.line((180, 190, 320, 190), fill=INK, width=2)
    d.ellipse((248, 220, 335, 265), outline=CRIMSON, width=4)
    img = img.filter(ImageFilter.GaussianBlur(.2))
    save(img, GEN / "s10-revise-cycle.png")


def s11() -> None:
    img = new_canvas()
    d = ImageDraw.Draw(img)
    text_center(d, (800, 62), "From media to instrument.", SERIF_58)
    text_center(d, (800, 115), "Same content, different verb.", SERIF_24, MUTED)
    d.line((800, 165, 800, 870), fill=(194, 184, 174), width=3)
    text_center(d, (400, 190), "WATCH / READ", SERIF_42)
    text_center(d, (1200, 190), "INTERROGATE / RESPOND", SERIF_42)
    for i, y in enumerate([285, 430, 575]):
        d.rounded_rectangle((230, y, 570, y + 105), 8, outline=GRAY, width=4)
        if i == 0:
            d.polygon([(370, y + 30), (370, y + 78), (420, y + 54)], fill=GRAY)
        else:
            for yy in range(y + 28, y + 82, 20):
                d.line((270, yy, 530, yy), fill=GRAY, width=3)
    text_center(d, (400, 760), "passive.", SERIF_30, MUTED)
    arrow(d, (690, 505), (910, 505), CRIMSON, 12)
    text_center(d, (800, 458), "transform", SERIF_30, CRIMSON)
    for i, y in enumerate([285, 430, 575]):
        d.rounded_rectangle((1030, y, 1370, y + 105), 8, outline=CRIMSON, width=4)
        if i == 0:
            d.line((1075, y + 82, 1320, y + 82), fill=CRIMSON, width=4)
            for x in [1140, 1265]:
                d.ellipse((x - 9, y + 73, x + 9, y + 91), fill=CRIMSON)
                d.rounded_rectangle((x - 35, y - 25, x + 40, y + 12), 10, outline=CRIMSON, width=3)
                text_center(d, (x + 2, y - 8), "why?", SANS_20, CRIMSON)
        else:
            d.rectangle((1075, y + 31, 1225, y + 45), fill=(238, 199, 204))
            d.rounded_rectangle((1240, y + 23, 1338, y + 64), 12, outline=CRIMSON, width=3)
            d.line((1085, y + 78, 1175, y + 78), fill=CRIMSON, width=3)
    text_center(d, (1200, 760), "active.", SERIF_30, MUTED)
    save(img, GEN / "s11-media-to-instrument.png")


def screenshot_frame(title: str, path: Path, bg=(250, 250, 250), accent=CRIMSON, draw_body=None) -> None:
    img = Image.new("RGB", (1600, 1000), (26, 28, 32))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((80, 70, 1520, 930), 18, fill=bg)
    d.rounded_rectangle((80, 70, 1520, 130), 18, fill=(238, 238, 238))
    for i, c in enumerate([(230, 90, 90), (240, 190, 70), (80, 185, 95)]):
        d.ellipse((112 + i * 28, 92, 130 + i * 28, 110), fill=c)
    d.rounded_rectangle((250, 88, 1120, 114), 10, fill=(255, 255, 255), outline=(215, 215, 215))
    d.text((270, 91), title, font=SANS_20, fill=(80, 80, 80))
    if draw_body:
        draw_body(d)
    save(img, path)


def showcase() -> None:
    def hex_body(d):
        d.rectangle((80, 130, 1520, 930), fill=(12, 15, 27))
        cx, cy, r = 800, 520, 285
        pts = [(cx + r * math.cos(math.radians(60 * i + 30)), cy + r * math.sin(math.radians(60 * i + 30))) for i in range(6)]
        d.line(pts + [pts[0]], fill=(120, 210, 255), width=8)
        for i in range(12):
            x = 420 + (i * 97) % 690
            y = 260 + (i * 73) % 460
            col = [(255, 93, 112), (95, 220, 255), (255, 218, 102)][i % 3]
            d.ellipse((x - 22, y - 22, x + 22, y + 22), fill=col)
            d.line((x, y, x + 38, y - 26), fill=col, width=4)
        d.text((150, 165), "HEX BOUNCE", font=SANS_42, fill=(238, 246, 255))

    screenshot_frame("inferent.io/playground", SHOW / "hex-bounce.png", draw_body=hex_body)

    def nonogram_body(d):
        d.rectangle((80, 130, 1520, 930), fill=(251, 249, 244))
        d.text((155, 170), "I/O 2026 Nonogram", font=SANS_42, fill=INK)
        x0, y0, s = 510, 265, 58
        clues = ["3", "1 1", "5", "2", "4", "1 2", "3", "2 1"]
        for i in range(8):
            d.text((x0 + i * s + 18, y0 - 46), clues[i % len(clues)], font=SANS_20, fill=MUTED)
            d.text((x0 - 78, y0 + i * s + 18), clues[(i + 2) % len(clues)], font=SANS_20, fill=MUTED)
        filled = {(0, 1), (0, 2), (1, 4), (2, 0), (2, 1), (2, 2), (2, 3), (2, 4), (3, 6), (4, 2), (4, 3), (4, 4), (5, 1), (5, 5), (6, 4), (6, 5), (7, 3)}
        for r in range(8):
            for c in range(8):
                box = (x0 + c * s, y0 + r * s, x0 + (c + 1) * s, y0 + (r + 1) * s)
                d.rectangle(box, fill=(35, 35, 35) if (r, c) in filled else (255, 255, 255), outline=(160, 160, 160), width=2)

    screenshot_frame("io.google/2026/puzzle/date-reveal", SHOW / "nonogram.png", draw_body=nonogram_body)

    def gem_body(d):
        d.rectangle((80, 130, 1520, 930), fill=(0, 128, 128))
        for i, name in enumerate(["My Computer", "Recycle Bin", "Notepad", "Paint", "Minesweeper"]):
            y = 170 + i * 110
            d.rectangle((135, y, 190, y + 55), fill=(226, 226, 226), outline=(40, 40, 40), width=2)
            d.text((115, y + 65), name, font=SANS_20, fill=(255, 255, 255))
        d.rectangle((410, 230, 1090, 720), fill=(192, 192, 192), outline=(20, 20, 20), width=4)
        d.rectangle((410, 230, 1090, 270), fill=(0, 0, 128))
        d.text((430, 238), "Minesweeper", font=SANS_26, fill=(255, 255, 255))
        x0, y0, s = 510, 330, 42
        for r in range(8):
            for c in range(10):
                col = (235, 235, 235) if (r + c) % 4 else (185, 185, 185)
                d.rectangle((x0 + c * s, y0 + r * s, x0 + (c + 1) * s, y0 + (r + 1) * s), fill=col, outline=(120, 120, 120))
        d.rectangle((80, 880, 1520, 930), fill=(192, 192, 192))
        d.rectangle((105, 887, 205, 923), fill=(28, 135, 55), outline=(50, 50, 50))
        d.text((125, 892), "Start", font=SANS_20, fill=(255, 255, 255))
        d.text((1425, 895), "11:42", font=SANS_20, fill=INK)

    screenshot_frame("AI Studio Gemini 95", SHOW / "gemini-95.png", draw_body=gem_body)

    def cats_body(d):
        d.rectangle((80, 130, 1520, 930), fill=(247, 179, 168))
        d.text((650, 170), "Tiny Cats", font=SANS_42, fill=INK)
        d.rounded_rectangle((460, 235, 1140, 292), 18, fill=(255, 255, 255))
        d.text((495, 250), "Explain -> photosynthesis.", font=SANS_26, fill=MUTED)
        caps = ["light catches leaf", "leaf makes food", "cat drinks water"]
        for i, cap in enumerate(caps):
            x = 260 + i * 380
            d.rounded_rectangle((x, 350, x + 300, 700), 24, fill=(255, 255, 255))
            d.ellipse((x + 85, 435, x + 215, 565), fill=(255, 222, 200), outline=INK, width=3)
            d.polygon([(x + 105, 445), (x + 128, 395), (x + 148, 450)], fill=(255, 222, 200), outline=INK)
            d.polygon([(x + 190, 445), (x + 170, 395), (x + 150, 450)], fill=(255, 222, 200), outline=INK)
            d.line((x + 150, 545, x + 132, 590), fill=INK, width=3)
            d.line((x + 150, 545, x + 172, 590), fill=INK, width=3)
            text_center(d, (x + 150, 748), cap, SANS_26, INK)

    screenshot_frame("AI Studio Tiny Cats", SHOW / "tiny-cats.png", draw_body=cats_body)

    def video_body(d):
        d.rectangle((80, 130, 1520, 930), fill=(16, 47, 30))
        d.text((155, 175), "Video Toys", font=SANS_42, fill=(235, 255, 240))
        d.text((155, 230), "Turn a video into an interactive app", font=SANS_26, fill=(190, 230, 200))
        d.rounded_rectangle((205, 330, 835, 710), 24, fill=(30, 82, 45), outline=(105, 200, 125), width=4)
        d.polygon([(455, 430), (455, 610), (615, 520)], fill=(235, 255, 240))
        for i, t in enumerate(["chapter map", "concept probe", "try it"]):
            d.rounded_rectangle((960, 350 + i * 120, 1330, 425 + i * 120), 18, fill=(235, 255, 240))
            d.text((990, 372 + i * 120), t, font=SANS_26, fill=(16, 47, 30))

    screenshot_frame("AI Studio Video Toys", SHOW / "video-toys.png", draw_body=video_body)

    def p5_body(d):
        d.rectangle((80, 130, 1520, 930), fill=(255, 246, 235))
        d.rectangle((120, 160, 760, 880), fill=(38, 38, 43))
        d.text((150, 190), "p5.js Playground", font=SANS_32, fill=(255, 255, 255))
        code = ["function setup() {", "  createCanvas(640, 640);", "}", "function draw() {", "  background(250, 235, 210);", "  orbit.loop();", "}"]
        for i, line in enumerate(code):
            d.text((150, 260 + i * 48), line, font=SANS_26, fill=(245, 207, 128) if i % 2 else (155, 220, 255))
        d.rectangle((790, 160, 1480, 880), fill=(249, 230, 205))
        for i in range(24):
            x = 870 + int(240 * math.cos(i * .7))
            y = 520 + int(240 * math.sin(i * .7))
            d.ellipse((x, y, x + 38, y + 38), fill=[(232, 133, 58), (156, 21, 38), (40, 120, 180)][i % 3])
        d.rounded_rectangle((985, 785, 1285, 835), 18, fill=(255, 255, 255), outline=(156, 21, 38), width=3)
        d.text((1018, 797), "Run sketch", font=SANS_26, fill=(156, 21, 38))

    screenshot_frame("AI Studio p5.js Playground", SHOW / "p5js.png", draw_body=p5_body)


def hero() -> None:
    img = new_canvas(2520, 1080)
    d = ImageDraw.Draw(img)
    d.polygon([(130, 765), (1040, 410), (1995, 770), (1055, 1040)], fill=(220, 184, 136), outline=(160, 130, 96))
    cards = [(430, 650), (610, 585), (795, 660), (560, 780), (905, 770), (745, 875)]
    for i, (x, y) in enumerate(cards):
        d.polygon([(x, y), (x + 210, y - 70), (x + 350, y + 10), (x + 135, y + 80)], fill=(255, 252, 242), outline=(94, 82, 70), width=3)
        if i == 2:
            d.line((x + 80, y - 8, x + 230, y - 55), fill=CRIMSON, width=7)
        d.line((x + 60, y + 10, x + 220, y - 43), fill=INK, width=2)
    d.polygon([(980, 460), (1320, 335), (1640, 455), (1300, 585)], fill=(252, 248, 234), outline=INK, width=3)
    for i in range(4):
        d.rectangle((1085 + i * 120, 410, 1155 + i * 120, 455), outline=INK, width=2)
    d.line((1160, 455, 1230, 508, 1350, 400, 1460, 455), fill=INK, width=3)
    d.polygon([(350, 520), (520, 455), (690, 520), (520, 585)], fill=(245, 203, 208), outline=INK, width=2)
    d.text((458, 505), "loop", font=SANS_42, fill=CRIMSON)
    d.polygon([(1510, 650), (1810, 560), (2005, 650), (1710, 755)], fill=(72, 72, 78), outline=INK, width=4)
    d.rectangle((1650, 620, 1865, 665), fill=(54, 54, 59))
    d.rectangle((1735, 594, 1790, 690), fill=CRIMSON)
    d.ellipse((1585, 620, 1665, 700), fill=(35, 35, 38))
    d.ellipse((1848, 620, 1928, 700), fill=(35, 35, 38))
    d.ellipse((260, 900, 430, 1045), fill=(170, 120, 85), outline=(95, 68, 52), width=4)
    for i, col in enumerate([(70, 50, 30), (120, 82, 44), CRIMSON]):
        d.line((1110 + i * 55, 835, 1290 + i * 55, 780), fill=col, width=16)
    save(img, ROOT / "assets" / "hero-bg.png")


def main() -> None:
    GEN.mkdir(parents=True, exist_ok=True)
    SHOW.mkdir(parents=True, exist_ok=True)
    s01()
    s02()
    s04()
    s05()
    s10()
    s11()
    showcase()
    hero()


if __name__ == "__main__":
    main()
