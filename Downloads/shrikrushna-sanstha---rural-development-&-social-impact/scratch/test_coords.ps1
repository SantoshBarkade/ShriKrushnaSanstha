Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Bitmap]::FromFile("C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\.user_uploaded\media_1792937834052_a5716af8.jpg")

function CropBox($x, $y, $w, $h, $name) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $img.Clone($rect, $img.PixelFormat)
    $cropped.Save("public\$name.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $cropped.Dispose()
    Write-Host "Created public\$name.jpg ($w x $h)"
}

# 1. Clean Hero visual on the right:
# Exclude the left text. Start at X: 345 to 682 (width: 337). Y: 42 to 285 (height: 243).
CropBox 345 42 337 243 "hero-visual-art"

# 2. Clean Sanstha building with official board:
# X: 38 to 275 = 237, Y: 472 to 597 = 125
CropBox 38 472 237 125 "sanstha-building-art"

# 3. Pure News Photos (strictly the photo region, excluding the date text at bottom):
# Height is 52px so only the photo is captured!
CropBox 38 652 196 52 "news-art-1"
CropBox 243 652 196 52 "news-art-2"
CropBox 448 652 196 52 "news-art-3"

$img.Dispose()
Write-Host "Re-cropped pure photography assets successfully!"
