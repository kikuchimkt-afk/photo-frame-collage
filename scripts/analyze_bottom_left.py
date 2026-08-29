from PIL import Image

p = r"C:\Users\user\.cursor\projects\c-Users-user-Documents-GitHub-photo-frame-collage\assets\c__Users_user_AppData_Roaming_Cursor_User_workspaceStorage_ee6e11765518fd36d35d216754bb1723_images_F0BAA73D-25DC-44F1-B9D4-43A4725E9AB1-af846903-2e12-495f-8993-87f7a7066f65.jpg"
im = Image.open(p).convert("RGB")
w, h = im.size
pix = im.load()

# Left band (dog likely) vs center band brightness
print("y   left_mean  center_mean")
for y in range(700, 980, 8):
    left = [sum(pix[x, y]) / 3 for x in range(0, w // 3)]
    center = [sum(pix[x, y]) / 3 for x in range(w // 3, 2 * w // 3)]
    print(f"{y:4d}  {sum(left)/len(left):7.1f}  {sum(center)/len(center):7.1f}")
