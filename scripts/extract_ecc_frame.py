from PIL import Image, ImageDraw
import json
import os

src = r"C:\Users\user\.cursor\projects\c-Users-user-Documents-GitHub-photo-frame-collage\assets\c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_ee6e11765518fd36d35d216754bb1723_images_F0BAA73D-25DC-44F1-B9D4-43A4725E9AB1-af846903-2e12-495f-8993-87f7a7066f65.jpg"
out_dir = r"C:\Users\user\Documents\GitHub\photo-frame-collage\public\frames"

im = Image.open(src).convert("RGBA")
w, h = im.size

TOP_END = 118
PHOTO_BOTTOM = 946
DOG_TOP = 760
DOG_RIGHT = 255

cream_rgb = im.getpixel((w // 2, 108))[:3]
footer_cream = im.getpixel((w // 2, PHOTO_BOTTOM + 20))[:3]
transparent = (0, 0, 0, 0)


def is_mascot_pixel(r: int, g: int, b: int) -> bool:
    mean = (r + g + b) / 3
    # gray carpet / asphalt
    if abs(r - g) < 28 and abs(g - b) < 28 and abs(r - b) < 28 and 30 < mean < 200:
        return False
    # cream / white bg
    if r > 235 and g > 225 and b > 195:
        return False
    # yellow / orange fur (main body)
    if r >= 150 and g >= 110 and b <= 165 and (r - b) >= 30 and (r - g) > -10:
        return True
    # cream sweater
    if r > 190 and g > 180 and b > 150 and abs(r - g) < 40:
        return True
    # green shorts / clover (not neon tags: require not too dark)
    if 90 < g < 200 and g >= r + 18 and g >= b + 18 and mean > 80:
        return True
    # dark facial features
    if mean < 45 and max(r, g, b) < 60:
        return True
    # book / chick
    if r > 200 and g > 170 and b < 160 and (r - b) > 40:
        return True
    if r > 220 and g > 210 and b > 160 and (r - b) < 80:
        return True
    return False


# Fixed bands
top = im.crop((0, 0, w, TOP_END))
bottom = im.crop((0, PHOTO_BOTTOM, w, h)).copy()
bp = bottom.load()
# Only scrub obvious dog feet on far left of footer
for y in range(bottom.size[1]):
    for x in range(0, 110):
        r, g, b, a = bp[x, y]
        if is_mascot_pixel(r, g, b) and not (r > 230 and g > 220 and b > 190):
            bp[x, y] = footer_cream + (255,)

# Mascot region
mascot_full = im.crop((0, DOG_TOP, DOG_RIGHT, h)).copy()
mp = mascot_full.load()
mw, mh = mascot_full.size
for y in range(mh):
    for x in range(mw):
        r, g, b, a = mp[x, y]
        # hanging toy tags sit above the head — drop non-fur in upper band
        if y < 35 and not (
            r >= 150 and g >= 110 and b <= 165 and (r - b) >= 30
        ):
            mp[x, y] = transparent
            continue
        if is_mascot_pixel(r, g, b):
            mp[x, y] = (r, g, b, 255)
        else:
            mp[x, y] = transparent

bbox = mascot_full.getbbox()
mascot = mascot_full.crop(bbox) if bbox else mascot_full

# Thumb
thumb = Image.new("RGBA", (w, h), cream_rgb + (255,))
thumb.paste(top, (0, 0))
thumb.paste(bottom, (0, PHOTO_BOTTOM))
mx = 10
my = PHOTO_BOTTOM - mascot.size[1] + 36
thumb.paste(mascot, (mx, my), mascot)

overlay = Image.new("RGBA", (w, h), transparent)
overlay.paste(top, (0, 0))
overlay.paste(bottom, (0, PHOTO_BOTTOM))

os.makedirs(out_dir, exist_ok=True)
top.save(os.path.join(out_dir, "ecc-daigakumae-top.png"))
bottom.save(os.path.join(out_dir, "ecc-daigakumae-bottom.png"))
mascot.save(os.path.join(out_dir, "ecc-daigakumae-mascot.png"))
overlay.save(os.path.join(out_dir, "ecc-daigakumae-overlay.png"))
thumb.save(os.path.join(out_dir, "ecc-daigakumae-thumb.png"))

meta = {
    "id": "ecc-daigakumae",
    "kind": "banded",
    "width": w,
    "height": h,
    "topEnd": TOP_END,
    "photoBottom": PHOTO_BOTTOM,
    "photoTopRatio": TOP_END / h,
    "photoBottomRatio": PHOTO_BOTTOM / h,
    "cream": list(cream_rgb),
    "topBand": "/frames/ecc-daigakumae-top.png",
    "bottomBand": "/frames/ecc-daigakumae-bottom.png",
    "mascot": "/frames/ecc-daigakumae-mascot.png",
    "mascotDefault": {
        "x": mx / w,
        "y": my / h,
        "scale": mascot.size[0] / w,
    },
    "thumb": "/frames/ecc-daigakumae-thumb.png",
}
with open(os.path.join(out_dir, "ecc-daigakumae.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

print("top", top.size, "bottom", bottom.size, "mascot", mascot.size)
print(meta["mascotDefault"])
