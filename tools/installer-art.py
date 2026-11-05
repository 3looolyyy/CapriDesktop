"""
Generates the NSIS installer artwork in a Cyberpunk 2077 style (black, CP yellow, cyan, red
glitch) with Capri on the side panel. electron-builder picks these files up from assets/:

  assets/installerSidebar.bmp    164x314  welcome / finish pages
  assets/uninstallerSidebar.bmp  164x314  uninstaller welcome / finish pages
  assets/installerHeader.bmp     150x57   top-right of the other pages

Run from the repo root:  python tools/installer-art.py
"""

import os
import random
from PIL import Image, ImageDraw, ImageFont, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, 'assets')
CAPRI = os.path.join(ROOT, 'src', 'renderer', 'src', 'assets', 'capri', 'standing', 'frame_0.png')

BLACK = (10, 10, 15)
YELLOW = (252, 238, 10)
CYAN = (0, 240, 255)
RED = (255, 0, 60)
FONTS = 'C:/Windows/Fonts'


def font(name, size, variation=None):
    f = ImageFont.truetype(os.path.join(FONTS, name), size)
    if variation:
        try:
            f.set_variation_by_name(variation)
        except Exception:
            pass
    return f


def scanlines(img, every=3, strength=55):
    """Darkens every few rows (CRT look). Drawn on an overlay so the alpha actually blends."""
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(0, img.height, every):
        d.line([(0, y), (img.width, y)], fill=(0, 0, 0, strength))
    img.alpha_composite(overlay)


def glitch_slices(img, rng, count=5, max_shift=6):
    """Shifts a few thin horizontal bands sideways, like a corrupted video feed."""
    for _ in range(count):
        h = rng.randint(2, 6)
        y = rng.randint(0, img.height - h)
        band = img.crop((0, y, img.width, y + h))
        img.paste(band, (rng.randint(-max_shift, max_shift), y))


def chromatic(sprite, offset=3):
    """Red/cyan split copies behind the sprite (RGB split glitch)."""
    a = sprite.split()[3]
    w, h = sprite.size
    out = Image.new('RGBA', (w + offset * 2, h), (0, 0, 0, 0))
    red = Image.new('RGBA', sprite.size, RED + (0,))
    red.putalpha(a.point(lambda v: int(v * 0.35)))
    cyan = Image.new('RGBA', sprite.size, CYAN + (0,))
    cyan.putalpha(a.point(lambda v: int(v * 0.35)))
    out.alpha_composite(red, (0, 0))
    out.alpha_composite(cyan, (offset * 2, 0))
    out.alpha_composite(sprite, (offset, 0))
    return out


def capri_sprite(height):
    im = Image.open(CAPRI).convert('RGBA')
    im = im.crop(im.getbbox())
    w = int(im.width * height / im.height)
    return im.resize((w, height), Image.LANCZOS)


def hazard_stripes(d, box, color, gap=7, width=3):
    x0, y0, x1, y1 = box
    for x in range(x0 - (y1 - y0), x1, gap):
        d.polygon([(x, y1), (x + width, y1), (x + width + (y1 - y0), y0), (x + (y1 - y0), y0)], fill=color)


def sidebar(uninstall=False):
    rng = random.Random(2077 if not uninstall else 404)
    W, H = 164, 314
    accent = RED if uninstall else YELLOW
    img = Image.new('RGBA', (W, H), BLACK + (255,))
    d = ImageDraw.Draw(img)

    # Faint grid
    for x in range(0, W, 16):
        d.line([(x, 0), (x, H)], fill=(24, 26, 38))
    for y in range(0, H, 16):
        d.line([(0, y), (W, y)], fill=(24, 26, 38))

    # Angular title plate
    d.polygon([(0, 0), (W, 0), (W, 62), (0, 84)], fill=accent)
    title = font('bahnschrift.ttf', 25, 'Bold Condensed')
    small = font('bahnschrift.ttf', 11, 'SemiBold SemiCondensed')
    if uninstall:
        d.text((10, 10), 'CAPRI', font=title, fill=BLACK)
        d.text((10, 38), 'DISCONNECTING...', font=small, fill=BLACK)
    else:
        d.text((10, 8), 'CAPRI', font=title, fill=BLACK)
        d.text((10, 33), 'DESKTOP', font=title, fill=BLACK)
    # Cut notch + cyan edge on the plate
    d.polygon([(W - 22, 0), (W, 0), (W, 22)], fill=BLACK)
    d.line([(0, 86), (W, 64)], fill=CYAN, width=2)

    # Capri with RGB split
    sprite = chromatic(capri_sprite(166), offset=2)
    img.alpha_composite(sprite, ((W - sprite.width) // 2 + 6, H - sprite.height - 26))

    # HUD bits
    mono = font('consolab.ttf', 9)
    d = ImageDraw.Draw(img)
    d.text((8, 94), 'PROJECT://CAPRICORN', font=mono, fill=CYAN)
    d.text((8, 106), ('LINK: TERMINATED' if uninstall else 'NEURAL LINK: ONLINE'), font=mono, fill=accent)
    d.rectangle([8, 120, 60, 122], fill=RED)
    d.rectangle([64, 120, 78, 122], fill=CYAN)

    # Vertical tag on the right edge
    tag = Image.new('RGBA', (150, 12), (0, 0, 0, 0))
    ImageDraw.Draw(tag).text((0, 0), 'NIGHT CITY // 2077', font=font('consola.ttf', 9), fill=(120, 124, 150))
    tag = tag.rotate(90, expand=True)
    img.alpha_composite(tag, (W - 13, 130))

    # Hazard stripes footer
    d.rectangle([0, H - 18, W, H], fill=BLACK)
    hazard_stripes(d, (0, H - 14, W, H - 4), accent)
    d.line([(0, H - 18), (W, H - 18)], fill=accent, width=1)

    glitch_slices(img, rng, count=6, max_shift=5)
    scanlines(img)
    return img.convert('RGB')


def header():
    W, H = 150, 57
    img = Image.new('RGBA', (W, H), BLACK + (255,))
    d = ImageDraw.Draw(img)
    # Yellow angled plate on the right
    d.polygon([(30, 0), (W, 0), (W, H), (12, H)], fill=YELLOW)
    d.polygon([(30, 0), (38, 0), (20, H), (12, H)], fill=RED)
    d.text((46, 8), 'CAPRI', font=font('bahnschrift.ttf', 27, 'Bold Condensed'), fill=BLACK)
    d.text((47, 38), 'PROJECT://CAPRICORN', font=font('consolab.ttf', 8), fill=BLACK)
    d.line([(12, H - 2), (W, H - 2)], fill=CYAN, width=2)
    glitch_slices(img, random.Random(7), count=2, max_shift=3)
    return img.convert('RGB')


def main():
    sidebar(False).save(os.path.join(ASSETS, 'installerSidebar.bmp'))
    sidebar(True).save(os.path.join(ASSETS, 'uninstallerSidebar.bmp'))
    header().save(os.path.join(ASSETS, 'installerHeader.bmp'))
    print('installer art written to', ASSETS)


if __name__ == '__main__':
    main()
