<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

echo "=== event_photos image_url ===\n";
foreach ($db->query("SELECT id, event_id, image_url FROM event_photos")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']} (event {$r['event_id']}): {$r['image_url']}\n";
}
echo "=== initiative_photos image_url ===\n";
foreach ($db->query("SELECT id, initiative_id, image_url FROM initiative_photos")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "{$r['id']} (init {$r['initiative_id']}): {$r['image_url']}\n";
}
