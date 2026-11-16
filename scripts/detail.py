from PIL import Image

d = '/tmp/frames'
# f_005: pink 8 starburst; f_001: green 4 close; f_016: orange 2s; f_007: 8 with apples
sheet = Image.new('RGB', (760, 1100), (255, 0, 255))

im5 = Image.open(f'{d}/f_005.png')   # pink 8 full
im1 = Image.open(f'{d}/f_001.png')   # green 4 closeup
im16 = Image.open(f'{d}/f_016.png')  # orange 2 faces
im7 = Image.open(f'{d}/f_007.png')   # apples

# pink 8 tower crop (center column)
c1 = im5.crop((140, 60, 330, 420)).resize((190, 360))
sheet.paste(c1, (10, 10))
# green 4 closeup
c2 = im1.crop((40, 0, 360, 360)).resize((320, 360))
sheet.paste(c2, (220, 10))
# orange 2 faces (bottom half)
c3 = im16.crop((0, 700, 360, 1000)).resize((360, 300))
sheet.paste(c3, (10, 400))
# apples grid
c4 = im7.crop((0, 700, 200, 950)).resize((200, 250))
sheet.paste(c4, (390, 400))
# 8 with octopus arms on seesaw (f_009)
im9 = Image.open(f'{d}/f_009.png')
c5 = im9.crop((180, 200, 360, 400)).resize((270, 300))
sheet.paste(c5, (10, 730))
# starburst equation (f_010)
im10 = Image.open(f'{d}/f_010.png')
c6 = im10.crop((0, 180, 360, 470)).resize((360, 290))
sheet.paste(c6, (300, 730))

sheet.save('/tmp/frames/detail.jpg', quality=85)
print('ok', sheet.size)
