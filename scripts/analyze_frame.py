from PIL import Image
import statistics

p = r"C:\Users\user\.cursor\projects\c-Users-user-Documents-GitHub-photo-frame-collage\assets\c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_ee6e11765518fd36d35d216754bb1723_images_F0BAA73D-25DC-44F1-B9D4-43A4725E9AB1-af846903-2e12-495f-8993-87f7a7066f65.jpg"
im = Image.open(p).convert("RGB")
w, h = im.size
pix = im.load()
rows = []
for y in range(h):
    vals = [sum(pix[x, y]) / 3 for x in range(0, w, 4)]
    mean = sum(vals) / len(vals)
    var = statistics.pstdev(vals)
    rows.append((y, mean, var))

for y, mean, var in rows[::16]:
    print(f"y={y:4d} mean={mean:6.1f} std={var:5.1f}")

# Photo often darker / higher variance; cream banner high mean
# Mark likely photo rows
photo_like = [y for y, m, v in rows if m < 200 or v > 48]
print("photo_like first/last", photo_like[0], photo_like[-1], "count", len(photo_like))
