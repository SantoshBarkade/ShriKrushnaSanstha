<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=shrikrushnasanstha2;charset=utf8mb4", "root", "Jagdamba@558");

// First verify current
$stmt = $pdo->query("SELECT address_mr, district_mr FROM contact_info WHERE id=1");
$before = $stmt->fetch(PDO::FETCH_ASSOC);
echo "BEFORE: " . json_encode($before, JSON_UNESCAPED_UNICODE) . "\n";

// Update to standardized address and district without outdated (औरंगाबाद) and without redundant (रजि. नं.: एक 14668 औ)
$update = $pdo->prepare("UPDATE contact_info SET 
    address_mr = :address_mr,
    address_en = :address_en,
    district_mr = :district_mr,
    district_en = :district_en,
    updated_at = NOW()
    WHERE id = 1");

$update->execute([
    ':address_mr' => 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, मु. पो. नादरपूर, तहसील कन्नड, जिल्हा छत्रपती संभाजीनगर, महाराष्ट्र',
    ':address_en' => 'Shrikrushna Sanskrutik and Gramin Vikas Sanstha, At Post Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar, Maharashtra',
    ':district_mr' => 'छत्रपती संभाजीनगर',
    ':district_en' => 'Chhatrapati Sambhajinagar'
]);

$stmt = $pdo->query("SELECT address_mr, district_mr, updated_at FROM contact_info WHERE id=1");
$after = $stmt->fetch(PDO::FETCH_ASSOC);
echo "AFTER: " . json_encode($after, JSON_UNESCAPED_UNICODE) . "\n";
