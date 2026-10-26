<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=shrikrushnasanstha2;charset=utf8mb4", "root", "Jagdamba@558");
$stmt = $pdo->query("SELECT address_mr FROM contact_info WHERE id=1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
$str = $row['address_mr'];
echo "RAW: " . $str . "\n";
echo "CODEPOINTS: ";
$chars = mb_str_split($str);
foreach ($chars as $c) {
    echo sprintf("%04X ", mb_ord($c));
}
echo "\n";
