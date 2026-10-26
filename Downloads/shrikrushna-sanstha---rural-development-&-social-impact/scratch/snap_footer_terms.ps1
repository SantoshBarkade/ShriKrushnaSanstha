$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$dest = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\verified_footer_terms.png"
$htmlPath = "file:///C:/Users/Santosh/Downloads/shrikrushna-sanstha---rural-development-&-social-impact/scratch/crop_footer_terms.html"

$arg = "--headless=new --disable-gpu --virtual-time-budget=2000 --hide-scrollbars --window-size=1440,800 --screenshot=`"$dest`" `"$htmlPath`""

Start-Process -FilePath $chrome -ArgumentList $arg -Wait
Get-Item $dest | Select-Object FullName, Length
