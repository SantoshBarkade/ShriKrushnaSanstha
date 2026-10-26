Add-Type -AssemblyName System.Drawing
$logoImgPath = "public\official-sanstha-logo.png"
$img = [System.Drawing.Bitmap]::FromFile($logoImgPath)

function Crop-Image($x, $y, $w, $h, $outPath) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $img.Clone($rect, $img.PixelFormat)
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Host "Saved: $outPath"
}

# The emblem symbol only:
Crop-Image 320 40 380 290 "public\logo-symbol-hires.png"

$img.Dispose()
Write-Host "Emblem cropped"
