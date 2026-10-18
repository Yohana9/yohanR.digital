#!/usr/bin/env python3
"""
Image optimizer for yohanR.digital  (run from the repo root, next to index.html)

    pip install pillow
    python optimize-images.py

What it does
  * For every PNG/JPG in assets/images (favicon folder skipped) it creates a
    resized .webp next to the original (same file name, .webp extension).
    Originals are never modified or deleted.
  * Creates assets/images/og-image.jpg (1200x630) for Telegram / WhatsApp /
    LinkedIn link previews.
Commit and upload the new .webp files and og-image.jpg together with index.html.
"""
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont, ImageOps
except ImportError:
    sys.exit("Pillow is missing. Install it with:  pip install pillow")

ROOT = Path(__file__).resolve().parent / "assets" / "images"
if not ROOT.is_dir():
    sys.exit(f"Folder not found: {ROOT}\nRun this script from the repo root (next to index.html).")


def max_width(p: Path) -> int:
    if p.name.lower().startswith("profile"):
        return 1000          # hero photo is shown at ~420px (x2 for retina)
    return 1000 if "certificates" in (x.lower() for x in p.parts) else 1200


def kb(n: int) -> str:
    return f"{n / 1024:,.0f} KB"


saved_before = saved_after = 0
for p in sorted(ROOT.rglob("*")):
    if p.suffix.lower() not in (".png", ".jpg", ".jpeg"):
        continue
    if "favicon" in (x.lower() for x in p.parts) or p.name.lower().startswith("og-image"):
        continue
    out = p.with_suffix(".webp")
    if out.exists() and out.stat().st_mtime >= p.stat().st_mtime:
        print(f"skip   {p.relative_to(ROOT)} (webp already up to date)")
        continue
    im = ImageOps.exif_transpose(Image.open(p))
    w = max_width(p)
    if im.width > w:
        im = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
    im = im.convert("RGBA" if alpha else "RGB")
    im.save(out, "WEBP", quality=80, method=6)
    b, a = p.stat().st_size, out.stat().st_size
    saved_before += b
    saved_after += a
    print(f"ok     {p.relative_to(ROOT)}: {kb(b)} -> {kb(a)}")

if saved_before:
    print(f"\nTotal: {kb(saved_before)} -> {kb(saved_after)}  "
          f"({100 - round(100 * saved_after / saved_before)}% smaller)")


# ---------- link-preview card (Telegram / WhatsApp / LinkedIn) ----------
def font(size, bold=False):
    names = (["arialbd.ttf", "Arial Bold.ttf", "DejaVuSans-Bold.ttf"] if bold
             else ["arial.ttf", "Arial.ttf", "DejaVuSans.ttf"])
    for n in names:
        try:
            return ImageFont.truetype(n, size)
        except OSError:
            pass
    try:
        return ImageFont.load_default(size)
    except TypeError:
        return ImageFont.load_default()


src = next((ROOT / n for n in ("Profile_hero.png", "Profile.png") if (ROOT / n).exists()), None)
if src:
    W, H = 1200, 630
    card = Image.new("RGB", (W, H), "#0B3C4D")
    d = ImageDraw.Draw(card)
    for x in range(W):                                   # soft left-to-right gradient
        t = x / W
        d.line([(x, 0), (x, H)], fill=(int(11 + 6 * t), int(60 + 20 * t), int(77 + 25 * t)))
    photo = ImageOps.exif_transpose(Image.open(src)).convert("RGBA")
    photo = ImageOps.contain(photo, (520, H))
    card.paste(photo, (W - photo.width - 40, H - photo.height), photo)
    d.rectangle([60, 150, 130, 156], fill="#E8B13A")
    d.text((60, 180), "Yohannes Reta", font=font(68, True), fill="white")
    d.text((60, 275), "Senior Project Management Officer", font=font(34), fill="#DCE8EA")
    d.text((60, 325), "ICT Professional  |  VMware  |  Digital Banking", font=font(26), fill="#9FC3CC")
    out = ROOT / "og-image.jpg"
    card.save(out, "JPEG", quality=82, optimize=True, progressive=True)
    print(f"\nLink preview: {out.relative_to(ROOT.parent.parent)} ({kb(out.stat().st_size)})")
else:
    print("\nNo Profile_hero.png / Profile.png found - og-image.jpg not created.")
print("\nDone. Upload the new .webp files and og-image.jpg with index.html.")