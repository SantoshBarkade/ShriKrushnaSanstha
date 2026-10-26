Add-Type -AssemblyName System.Drawing
$refImgPath = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\.user_uploaded\media_1792937834052_a5716af8.jpg"
$img = [System.Drawing.Bitmap]::FromFile($refImgPath)

function Crop-Image($x, $y, $w, $h, $outPath) {
    $rect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
    $cropped = $img.Clone($rect, $img.PixelFormat)
    $cropped.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $cropped.Dispose()
    Write-Host "Saved: $outPath"
}

Crop-Image 580 450 102 140 "public\leaf-branch.png"
Crop-Image 0 42 90 90 "public\leaf-hero-corner.png"

$img.Dispose()
Write-Host "Leaf assets saved"
