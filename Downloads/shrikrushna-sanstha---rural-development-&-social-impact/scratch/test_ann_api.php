<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$db->query("DELETE FROM announcements WHERE id = 'ann-test-check'");

$id = 'ann-test-check';
$stmt = $db->prepare("INSERT INTO announcements (id, title_mr, title_en, event_date_mr, event_date_en, category, summary_mr, summary_en, content_mr, content_en, cover_image_url, published, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '/sanstha-building-art.jpg', 1, -99)");
$stmt->execute([
    $id,
    "नवीन शेतकरी मार्गदर्शन शिबीर २०२६",
    "New Farmers Guidance Workshop 2026",
    "१५ नोव्हेंबर २०२६",
    "15 Nov 2026",
    "कृषी विकास",
    "शेतकऱ्यांसाठी आधुनिक सेंद्रिय शेती तंत्रज्ञान कार्यशाळा.",
    "Modern organic farming workshop for rural farmers.",
    "सविस्तर माहिती.",
    "Detailed info."
]);

$res = file_get_contents('http://127.0.0.1:8088/backend-php-mysql/api/content.php');

$data = json_decode($res, true);
$ann = $data['data']['announcements'] ?? [];
echo "Total announcements in API: " . count($ann) . "\n";
foreach (array_slice($ann, 0, 3) as $a) {
    echo "ID: {$a['id']}, Title: {$a['title']}, Date: {$a['date']}, DisplayOrder: {$a['displayOrder']}\n";
}

$db->query("DELETE FROM announcements WHERE id = 'ann-test-check'");
