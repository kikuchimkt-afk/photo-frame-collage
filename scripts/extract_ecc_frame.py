from PIL import Image
import json
import os

src = r"C:\Users\user\.cursor\projects\c-Users-user-Documents-GitHub-photo-frame-collage\assets\c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_ee6e11765518fd36d35d216754bb1723_images_F0BAA73D-25DC-44F1-B9D4-43A4725E9AB1-af846903-2e12-495f-8993-87f7a7066f65.jpg"
out_dir = r"C:\Users\user\Documents\GitHub\photo-frame-collage\public\frames"

im = Image.open(src).convert("RGBA")
w, h = im.size
src_px = im.load()

TOP_END = 118
PHOTO_BOTTOM = 946
DOG_TOP = 755
DOG_RIGHT = 265

cream_rgb = im.getpixel((w // 2, 108))[:3]
cream = cream_rgb + (255,)
transparent = (0, 0, 0, 0)


def is_dog_like(r: int, g: int, b: int) -> bool:
    # yellow / orange fur
    if r > 165 and g > 125 and b < 170 and (r - b) > 35:
        return True
    # cream knit sweater
    if r > 195 and g > 185 and b > 155 and abs(r - g) < 45 and (r - b) < 70:
        return True
    # green shorts / clover / leaves
    if g > 95 and g >= r + 12 and g >= b + 12:
        return True
    # dark linework / nose / eyes
    if r < 55 and g < 55 and b < 55:
        return True
    # book page / chick yellow
    if r > 210 and g > 190 and b > 120 and (r - b) > 20:
        return True
    # soft cheek / ear shadow warm brown
    if 120 < r < 190 and 80 < g < 150 and b < 110 and (r - b) > 40:
        return True
    return False


def is_grayish_photo(r: int, g: int, b: int) -> bool:
    mx, mn = max(r, g, b), min(r, g, b)
    sat = mx - mn
    mean = (r + g + b) / 3
    return sat < 40 and 35 < mean < 210


# --- thumb / solid frame (cream hole, no child) ---
thumb = Image.new("RGBA", (w, h), cream)
# paste header
thumb.paste(im.crop((0, 0, w, TOP_END)), (0, 0))
# paste cream footer strip
thumb.paste(im.crop((0, PHOTO_BOTTOM, w, h)), (0, PHOTO_BOTTOM))
# paste cleaned dog onto cream
tp = thumb.load()
for y in range(DOG_TOP, h):
    for x in range(0, min(DOG_RIGHT + 50, w)):
        r, g, b, a = src_px[x, y]
        if y >= PHOTO_BOTTOM:
            # footer already pasted; keep dog pixels that overlap footer too
            if is_dog_like(r, g, b):
                tp[x, y] = (r, g, b, 255)
        else:
            if is_dog_like(r, g, b):
                tp[x, y] = (r, g, b, 255)
            else:
                tp[x, y] = cream

# --- overlay: transparent photo window ---
overlay = Image.new("RGBA", (w, h), transparent)
# header opaque
overlay.paste(im.crop((0, 0, w, TOP_END)), (0, 0))
# footer cream strip
overlay.paste(im.crop((0, PHOTO_BOTTOM, w, h)), (0, PHOTO_BOTTOM))
op = overlay.load()
for y in range(DOG_TOP, h):
    for x in range(0, min(DOG_RIGHT + 50, w)):
        r, g, b, a = src_px[x, y]
        if y >= PHOTO_BOTTOM:
            if is_dog_like(r, g, b):
                op[x, y] = (r, g, b, 255)
        else:
            if is_dog_like(r, g, b):
                op[x, y] = (r, g, b, 255)
            # else leave transparent so user photo shows, OR put cream under dog only
            # Prefer cream plate under dog so photo doesn't show through gaps in fur
            elif x < DOG_RIGHT - 10:
                op[x, y] = cream

# Fill cream under-dog plate more solidly for nicer silhouette
for y in range(DOG_TOP, PHOTO_BOTTOM):
    for x in range(0, DOG_RIGHT - 10):
        if op[x, y][3] == 0:
            op[x, y] = cream
        r, g, b, a = op[x, y]
        if a and is_grayish_photo(r, g, b):
            op[x, y] = cream

top = thumb.crop((0, 0, w, TOP_END))
bottom = thumb.crop((0, DOG_TOP, w, h))

os.makedirs(out_dir, exist_ok=True)
top.save(os.path.join(out_dir, "ecc-daigakumae-top.png"))
bottom.save(os.path.join(out_dir, "ecc-daigakumae-bottom.png"))
overlay.save(os.path.join(out_dir, "ecc-daigakumae-overlay.png"))
thumb.save(os.path.join(out_dir, "ecc-daigakumae-thumb.png"))

meta = {
    "id": "ecc-daigakumae",
    "name": "ECCジュニア大学前教室",
    "width": w,
    "height": h,
    "topEnd": TOP_END,
    "dogTop": DOG_TOP,
    "photoBottom": PHOTO_BOTTOM,
    "photoTopRatio": TOP_END / h,
    "photoBottomRatio": PHOTO_BOTTOM / h,
    "cream": list(cream_rgb),
    "overlay": "/frames/ecc-daigakumae-overlay.png",
    "thumb": "/frames/ecc-daigakumae-thumb.png",
}
with open(os.path.join(out_dir, "ecc-daigakumae.json"), "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, indent=2)

print("done", meta)
