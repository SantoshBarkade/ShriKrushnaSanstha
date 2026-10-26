$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
if (-not (Test-Path $chrome)) {
    $chrome = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
}

$dest2 = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\mobile_390.png"
$arg2 = "--headless=new --disable-gpu --hide-scrollbars --window-size=390,5200 --screenshot=`"$dest2`" http://localhost:5173"

$p2 = Start-Process -FilePath $chrome -ArgumentList $arg2 -PassThru -Wait
Write-Host "Mobile capture exit: $($p2.ExitCode)"
Get-Item $dest2 | Select-Object FullName, Length
