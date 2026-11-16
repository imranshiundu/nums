from PIL import Image
import os

d = '/tmp/frames'
files = sorted(f for f in os.listdir(d) if f.endswith('.png'))
print(files)

# group into batches of 4 -> 2x2 grid
for bi in range(0, len(files), 4):
    batch = files[bi:bi+4]
    imgs = [Image.open(os.path.join(d, f)) for f in batch]
    w = max(i.width for i in imgs)
    h = max(i.height for i in imgs)
    grid = Image.new('RGB', (w*2+12, h*2+12), (255, 0, 255))
    pos = [(4, 4), (w+8, 4), (4, h+8), (w+8, h+8)]
    for k, im in enumerate(imgs):
        if im.width != w or im.height != h:
            im = im.resize((w, h))
        grid.paste(im, pos[k])
    out = os.path.join(d, f'm{bi//4+1}.jpg')
    grid.save(out, quality=80)
    print(out, grid.size)
