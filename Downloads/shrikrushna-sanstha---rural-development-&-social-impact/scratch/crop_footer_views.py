import os
from PIL import Image

dir_path = "C:/Users/Santosh/.gemini/antigravity/brain/8985ba1f-7878-48da-8615-e7471f6974d1"

# 1. Desktop CTA + Footer
desktop_img = Image.open(os.path.join(dir_path, "desktop_1440.png"))
dw, dh = desktop_img.size
print(f"Desktop 1440 size: {dw}x{dh}")

# The CTA starts around y=2150 and footer ends at dh
# Let's crop from y=2150 to bottom
cta_footer_desktop = desktop_img.crop((0, 2150, dw, dh))
desktop_out = os.path.join(dir_path, "desktop_footer_and_cta.png")
cta_footer_desktop.save(desktop_out)
print(f"Saved {desktop_out} ({cta_footer_desktop.size})")

# 2. Mobile Footer (from mobile_390.png)
mobile_img = Image.open(os.path.join(dir_path, "mobile_390.png"))
mw, mh = mobile_img.size
print(f"Mobile 390 size: {mw}x{mh}")

# The CTA starts around y=3650 and footer ends at mh
mobile_footer = mobile_img.crop((0, 3650, mw, mh))
mobile_out = os.path.join(dir_path, "mobile_footer.png")
mobile_footer.save(mobile_out)
print(f"Saved {mobile_out} ({mobile_footer.size})")
