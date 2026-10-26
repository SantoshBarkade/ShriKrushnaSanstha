Add-Type -AssemblyName System.Drawing
$refImgPath = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\.user_uploaded\media_1792937834052_a5716af8.jpg"
$logoImgPath = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\.user_uploaded\media_1792937837587_934bcbd9.png"

# Copy official logo
Copy-Item $logoImgPath -Destination "public\official-sanstha-logo.png" -Force

$img = [System.Drawing.Bitmap]::FromFile($refImgPath)
Write-Host "Ref Image loaded: $($img.Width) x $($img.Height)"

function Crop-Image($x, $y, $w, $h, $outPath) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $img.Clone($rect, $img.PixelFormat)
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    $cropped.Dispose()
    Write-Host "Saved: $outPath"
}

# 1. Hero right visual (Girl, School, Landscape)
Crop-Image 260 42 420 250 "public\hero-composite.jpg"

# 2. Hero Background Landscape only (sky, hills, birds)
Crop-Image 0 42 682 250 "public\hero-landscape-bg.jpg"

# 3. About Sanstha Building photo
Crop-Image 38 475 240 126 "public\sanstha-building.jpg"

# 4. News 1: School education
Crop-Image 40 655 195 60 "public\news-education.jpg"

# 5. News 2: Health camp
Crop-Image 245 655 195 60 "public\news-health.jpg"

# 6. News 3: Cultural performance
Crop-Image 448 655 195 60 "public\news-culture.jpg"

# 7. CTA Banner landscape strip
Crop-Image 0 770 682 100 "public\landscape-cta-bg.jpg"

$img.Dispose()
Write-Host "All assets cropped successfully!"
