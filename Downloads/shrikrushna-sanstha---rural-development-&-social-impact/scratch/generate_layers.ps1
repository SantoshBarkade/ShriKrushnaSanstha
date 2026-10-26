Add-Type -AssemblyName System.Drawing
$refImgPath = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\.user_uploaded\media_1792937834052_a5716af8.jpg"
$img = [System.Drawing.Bitmap]::FromFile($refImgPath)

function CropBox($x, $y, $w, $h, $name) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $img.Clone($rect, $img.PixelFormat)
    $cropped.Save("public\$name.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $cropped.Dispose()
    Write-Host "Created public\$name.jpg ($w x $h)"
}

# 1. Broad panoramic sky and hills from the top of the reference (Y: 42 to 140, X: 0 to 682)
CropBox 0 42 682 120 "hero-sky-hills"

# 2. Focused School building with students (X: 470 to 682, Y: 70 to 250)
CropBox 460 70 220 170 "hero-school-building"

# 3. High quality smiling schoolgirl (X: 340 to 540, Y: 70 to 250)
CropBox 340 70 190 180 "hero-girl-student"

# 4. Full cohesive hero artwork without text overlap (X: 335 to 682, Y: 42 to 275)
CropBox 335 42 347 233 "hero-scene-main"

# 5. Sanstha building clean crop
CropBox 38 472 237 125 "sanstha-building-art"

# 6. News Photos (Pure photographic area)
CropBox 38 652 196 52 "news-art-1"
CropBox 243 652 196 52 "news-art-2"
CropBox 448 652 196 52 "news-art-3"

$img.Dispose()
Write-Host "Layer assets generated!"
