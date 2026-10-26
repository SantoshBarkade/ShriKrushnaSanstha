<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

echo "=== gallery_photos cols ===\n";
foreach ($db->query("DESCRIBE gallery_photos")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo "{$c['Field']}\n";
}
echo "=== reports cols ===\n";
foreach ($db->query("DESCRIBE reports")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo "{$c['Field']}\n";
}
