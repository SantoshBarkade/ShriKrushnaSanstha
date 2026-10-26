<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

echo "=== gallery_photos image_url ===\n";
foreach ($db->query("SELECT id, album_id, image_url FROM gallery_photos")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['image_url']}\n";
}
echo "=== reports pdf_url & file_path ===\n";
foreach ($db->query("SELECT id, title_mr, pdf_url, file_path FROM reports")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: pdf_url={$r['pdf_url']} | file_path={$r['file_path']}\n";
}
