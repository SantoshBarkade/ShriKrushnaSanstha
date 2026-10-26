$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$destDir = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1"

$views = @(
    @{ name = "schemes_1440_desktop.png"; w = 1440; h = 1800 },
    @{ name = "schemes_1280_laptop.png";  w = 1280; h = 1800 },
    @{ name = "schemes_768_tablet.png";   w = 768;  h = 2200 },
    @{ name = "schemes_390_mobile.png";   w = 390;  h = 2800 },
    @{ name = "schemes_360_mobile.png";   w = 360;  h = 2800 }
)

foreach ($v in $views) {
    $target = Join-Path $destDir $v.name
    $arg = "--headless=new --disable-gpu --hide-scrollbars --window-size=$($v.w),$($v.h) --screenshot=`"$target`" http://localhost:5173/#/schemes"
    Write-Host "Capturing $($v.name) ($($v.w)x$($v.h))..."
    $proc = Start-Process -FilePath $chrome -ArgumentList $arg -PassThru -Wait
}

Write-Host "Captured Viewport Screenshots:"
Get-ChildItem -Path $destDir -Filter "schemes_*.png" | Select-Object Name, Length, LastWriteTime
