$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$destFooter = "C:\Users\Santosh\.gemini\antigravity\brain\8985ba1f-7878-48da-8615-e7471f6974d1\verified_footer_closeup.png"
$htmlPath = "file:///C:/Users/Santosh/Downloads/shrikrushna-sanstha---rural-development-&-social-impact/scratch/crop_footer_from_home.html"

$argFooter = "--headless=new --disable-gpu --allow-file-access-from-files --virtual-time-budget=2000 --hide-scrollbars --window-size=1440,900 --screenshot=`"$destFooter`" `"$htmlPath`""

Start-Process -FilePath $chrome -ArgumentList $argFooter -Wait
Get-Item $destFooter | Select-Object FullName, Length
