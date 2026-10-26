<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "\n=== 4. INITIATIVES PHOTOS ===\n";
$initiatives = $db->query("SELECT id, title_mr, image_url FROM initiatives")->fetchAll(PDO::FETCH_ASSOC);
foreach ($initiatives as $i) {
    echo "Initiative: {$i['id']} | Title: {$i['title_mr']} | Image: {$i['image_url']}\n";
}
$init_photos = $db->query("SELECT * FROM initiative_photos")->fetchAll(PDO::FETCH_ASSOC);
foreach ($init_photos as $ip) {
    echo "Init Photo: {$ip['id']} | Init ID: {$ip['initiative_id']} | Image: {$ip['image_url']}\n";
}

echo "\n=== 5. PAGE SECTIONS PHOTOS ===\n";
$sections = $db->query("SELECT id, page_slug, section_key, title_mr, image_url FROM page_sections WHERE image_url IS NOT NULL AND image_url != ''")->fetchAll(PDO::FETCH_ASSOC);
foreach ($sections as $s) {
    echo "Section: {$s['id']} | Page: {$s['page_slug']} | Key: {$s['section_key']} | Image: {$s['image_url']}\n";
}
