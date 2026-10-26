import os
from PIL import Image

ref_path = "C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/.user_uploaded/media_1792937834052_a5716af8.jpg"
out_path = "C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/ref_footer_crop.png"

im = Image.open(ref_path)
w, h = im.size
print(f"Reference Image 1 size: {w}x{h}")

# The footer is in the bottom ~25% of the image
crop_box = (0, int(h * 0.72), w, h)
footer_crop = im.crop(crop_box)
footer_crop.save(out_path)
print(f"Cropped footer saved to {out_path} ({footer_crop.size})")
