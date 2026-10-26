$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$destHeader = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\header_closeup.png"

$argHeader = "--headless=new --disable-gpu --virtual-time-budget=3000 --hide-scrollbars --window-size=650,140 --screenshot=`"$destHeader`" http://localhost:5173"

Start-Process -FilePath $chrome -ArgumentList $argHeader -Wait
Get-Item $destHeader | Select-Object FullName, Length
