from PIL import Image

p = r"C:\Users\user\.cursor\projects\c-Users-user-Documents-GitHub-photo-frame-collage\assets\c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_ee6e11765518fd36d35d216754bb1723_images_F0BAA73D-25DC-44F1-B9D4-43A4725E9AB1-af846903-2e12-495f-8993-87f7a7066f65.jpg"
im = Image.open(p).convert("RGB")
w, h = im.size
pix = im.load()

# edge strength: difference from previous row (center band)
print("row deltas near likely boundaries:")
for y in range(90, 160):
    prev = [sum(pix[x, y - 1]) / 3 for x in range(w // 4, 3 * w // 4)]
    cur = [sum(pix[x, y]) / 3 for x in range(w // 4, 3 * w // 4)]
    d = sum(abs(a - b) for a, b in zip(prev, cur)) / len(cur)
    mean = sum(cur) / len(cur)
    print(f"y={y:4d} delta={d:6.1f} mean={mean:6.1f}")

print("--- bottom ---")
for y in range(900, 1024):
    prev = [sum(pix[x, y - 1]) / 3 for x in range(w // 4, 3 * w // 4)]
    cur = [sum(pix[x, y]) / 3 for x in range(w // 4, 3 * w // 4)]
    d = sum(abs(a - b) for a, b in zip(prev, cur)) / len(cur)
    mean = sum(cur) / len(cur)
    if y % 2 == 0:
        print(f"y={y:4d} delta={d:6.1f} mean={mean:6.1f}")
