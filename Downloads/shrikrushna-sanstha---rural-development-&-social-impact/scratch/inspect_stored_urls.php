<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

echo "=== officials image_url ===\n";
foreach ($db->query("SELECT id, name_mr, image_url FROM officials")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['image_url']}\n";
}
echo "=== initiatives image_url ===\n";
foreach ($db->query("SELECT id, title_mr, image_url FROM initiatives")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['image_url']}\n";
}
echo "=== gallery_albums cover_image_url ===\n";
foreach ($db->query("SELECT id, title_mr, cover_image_url FROM gallery_albums")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['cover_image_url']}\n";
}
echo "=== gallery_photos photo_url ===\n";
foreach ($db->query("SELECT id, album_id, photo_url FROM gallery_photos")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['photo_url']}\n";
}
echo "=== events image_url ===\n";
foreach ($db->query("SELECT id, title_mr, image_url FROM events")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['image_url']}\n";
}
echo "=== event_photos image_url ===\n";
foreach ($db->query("SELECT id, event_id, image_url FROM event_photos")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['image_url']}\n";
}
echo "=== reports file_url ===\n";
foreach ($db->query("SELECT id, title_mr, file_url FROM reports")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']}: {$r['file_url']}\n";
}
