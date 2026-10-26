$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$artifactDir = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1"
New-Item -ItemType Directory -Force -Path "$artifactDir\screenshots" | Out-Null

Write-Host "Capturing desktop screenshot (1440px)..."
& $chrome --headless=new --disable-gpu --window-size=1440,2400 --screenshot="$artifactDir\screenshots\desktop_homepage.png" "http://localhost:5173"
Start-Sleep -Seconds 2

Write-Host "Capturing tablet screenshot (768px)..."
& $chrome --headless=new --disable-gpu --window-size=768,2600 --screenshot="$artifactDir\screenshots\tablet_homepage.png" "http://localhost:5173"
Start-Sleep -Seconds 2

Write-Host "Capturing mobile screenshot (390px)..."
& $chrome --headless=new --disable-gpu --window-size=390,3000 --screenshot="$artifactDir\screenshots\mobile_homepage.png" "http://localhost:5173"
Start-Sleep -Seconds 2

Write-Host "Screenshots captured successfully in $artifactDir\screenshots!"
Get-ChildItem "$artifactDir\screenshots" | Select-Object Name, Length
