import os
import glob
from PIL import Image

frames_dir = os.path.join(os.path.dirname(__file__), 'hero_frames')
out_gif = "C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1/hero_parallax_demonstration.gif"

files = sorted(glob.glob(os.path.join(frames_dir, 'frame_*.png')))
if not files:
    print("No frames found!")
    exit(1)

print(f"Loading {len(files)} frames...")
images = []
for f in files:
    im = Image.open(f)
    # Resize slightly for smaller file size while retaining crystal clarity
    im_resized = im.resize((960, 480), Image.Resampling.LANCZOS)
    images.append(im_resized.convert('P', palette=Image.Palette.ADAPTIVE))

# Save animated GIF
images[0].save(
    out_gif,
    save_all=True,
    append_images=images[1:],
    duration=120,
    loop=0,
    optimize=True
)

file_size = os.path.getsize(out_gif)
print(f"GIF generated successfully: {out_gif} ({file_size} bytes)")
