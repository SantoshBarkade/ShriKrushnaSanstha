$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$dir = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1"

$viewports = @(
    @{ name = "desktop_1440.png"; w = 1440; h = 3000 },
    @{ name = "tablet_768.png";    w = 768;  h = 3600 },
    @{ name = "mobile_390.png";    w = 390;  h = 4400 },
    @{ name = "mobile_360.png";    w = 360;  h = 4600 }
)

foreach ($vp in $viewports) {
    $out = Join-Path $dir $vp.name
    Write-Host "Capturing $($vp.name) ($($vp.w)x$($vp.h))..."
    $argList = @(
        "--headless=new",
        "--disable-gpu",
        "--virtual-time-budget=4000",
        "--hide-scrollbars",
        "--window-size=$($vp.w),$($vp.h)",
        "--screenshot=$out",
        "http://localhost:5173"
    )
    Start-Process -FilePath $chrome -ArgumentList $argList -Wait
}

Write-Host "All viewports captured successfully."
Get-ChildItem -Path $dir -Include *.png -Recurse | Select-Object Name, Length, LastWriteTime
