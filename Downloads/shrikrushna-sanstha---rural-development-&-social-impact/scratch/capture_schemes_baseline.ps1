$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$dest1 = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\schemes_baseline_1440.png"
$dest2 = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\schemes_baseline_390.png"

$arg1 = "--headless=new --disable-gpu --hide-scrollbars --window-size=1440,1200 --screenshot=`"$dest1`" http://localhost:5173/#/schemes"
$arg2 = "--headless=new --disable-gpu --hide-scrollbars --window-size=390,844 --screenshot=`"$dest2`" http://localhost:5173/#/schemes"

Write-Host "Capturing desktop 1440x1200..."
$p1 = Start-Process -FilePath $chrome -ArgumentList $arg1 -PassThru -Wait

Write-Host "Capturing mobile 390x844..."
$p2 = Start-Process -FilePath $chrome -ArgumentList $arg2 -PassThru -Wait

Write-Host "Checking captured screenshots:"
Get-Item $dest1, $dest2 | Select-Object FullName, Length
