<?php
$file = 'C:/Users/Santosh/.gemini/antigravity-ide/brain/de16229d-9b2d-4bac-b922-2802f7de1ff3/.user_uploaded/media_1792929057867.png';
$im = imagecreatefrompng($file);
$w = imagesx($im);
$h = imagesy($im);
echo "Image dimensions: {$w}x{$h}\n";

// Sample various points:
// Red roof in panel 1 (top left, symbol is around x: 250, y: 70)
// Blue base in panel 1 (top left, symbol is around x: 250, y: 160)
// Let's find dominant non-white colors in the image:
$colorCounts = [];
for ($y = 0; $y < $h; $y += 2) {
    for ($x = 0; $x < $w; $x += 2) {
        $rgb = imagecolorat($im, $x, $y);
        $r = ($rgb >> 16) & 0xFF;
        $g = ($rgb >> 8) & 0xFF;
        $b = $rgb & 0xFF;
        // Ignore white/near-white backgrounds and borders
        if ($r > 240 && $g > 240 && $b > 240) continue;
        // Quantize slightly
        $qr = round($r / 8) * 8;
        $qg = round($g / 8) * 8;
        $qb = round($b / 8) * 8;
        $hex = sprintf("#%02X%02X%02X", $qr, $qg, $qb);
        $colorCounts[$hex] = ($colorCounts[$hex] ?? 0) + 1;
    }
}
arsort($colorCounts);
echo "Dominant quantized colors:\n";
$i = 0;
foreach ($colorCounts as $hex => $count) {
    echo "  $hex: $count pixels\n";
    if (++$i >= 15) break;
}
