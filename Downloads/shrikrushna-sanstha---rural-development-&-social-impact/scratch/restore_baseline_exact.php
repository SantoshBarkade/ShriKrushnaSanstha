<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$stmt = $db->prepare("UPDATE site_pages SET title_mr = 'मुख्यपृष्ठ', title_en = 'Home', meta_description_mr = 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था मुख्यपृष्ठ', meta_description_en = 'Shrikrushna Sanstha Official Homepage' WHERE slug = 'home'");
$stmt->execute();

$stmt2 = $db->prepare("UPDATE contact_info SET reg_no_mr = 'रजि. नं.: एक 14668 (औ)', reg_no_en = 'Reg. No.: Ek 14668 (A)' WHERE id = 1");
$stmt2->execute();

$stmt3 = $db->query("SELECT COUNT(*) as count FROM page_sections WHERE page_slug = 'home'");
$row3 = $stmt3->fetch(PDO::FETCH_ASSOC);

echo "CLEANUP_SUCCESS. Home sections count: " . $row3['count'] . "\n";
