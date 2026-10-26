import os
import glob
from PIL import Image

brain_dir = r"C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1"
frames_dir = os.path.join(brain_dir, "scratch", "about_frames")

# 1. Compile GIF from frames
frame_files = sorted(glob.glob(os.path.join(frames_dir, "frame_*.png")))
print(f"Found {len(frame_files)} frames in {frames_dir}")

if frame_files:
    images = []
    for f in frame_files:
        im = Image.open(f)
        # resize slightly to optimize gif file size while keeping crisp quality
        im_resized = im.resize((900, 600), Image.Resampling.LANCZOS)
        images.append(im_resized.convert("P", palette=Image.Palette.ADAPTIVE))

    gif_path = os.path.join(brain_dir, "about_page_scroll_demonstration.gif")
    images[0].save(
        gif_path,
        save_all=True,
        append_images=images[1:],
        duration=650,
        loop=0,
        optimize=True,
    )
    print(f"Saved GIF: {gif_path} ({os.path.getsize(gif_path)} bytes)")

# 2. Crop sections from about_1440_full.png
full_path = os.path.join(brain_dir, "about_1440_full.png")
if os.path.exists(full_path):
    img = Image.open(full_path)
    w, h = img.size
    print(f"Full image dimensions: {w}x{h}")

    # Crop 1: Genesis & Vision (approx y=850 to 2200)
    crop1 = img.crop((0, min(850, h), w, min(2250, h)))
    crop1_path = os.path.join(brain_dir, "about_1440_genesis_vision.png")
    crop1.save(crop1_path)
    print(f"Saved: {crop1_path}")

    # Crop 2: Pillars & Schemes (approx y=2250 to 3650)
    crop2 = img.crop((0, min(2250, h), w, min(3650, h)))
    crop2_path = os.path.join(brain_dir, "about_1440_pillars_schemes.png")
    crop2.save(crop2_path)
    print(f"Saved: {crop2_path}")

    # Crop 3: Working Area, Dual Navigation Cards & Closing CTA (approx y=3650 to 5200)
    crop3 = img.crop((0, min(3650, h), w, min(5200, h)))
    crop3_path = os.path.join(brain_dir, "about_1440_area_cta_footer.png")
    crop3.save(crop3_path)
    print(f"Saved: {crop3_path}")
