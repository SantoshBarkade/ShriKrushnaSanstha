$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$dest = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\full_home_with_footer.png"

$arg = "--headless=new --disable-gpu --virtual-time-budget=3000 --hide-scrollbars --window-size=1440,6500 --screenshot=`"$dest`" http://localhost:5173"

Start-Process -FilePath $chrome -ArgumentList $arg -Wait
Get-Item $dest | Select-Object FullName, Length
