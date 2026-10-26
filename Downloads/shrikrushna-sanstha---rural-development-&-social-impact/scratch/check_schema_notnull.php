<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$cols = $db->query("SHOW COLUMNS FROM videos")->fetchAll(PDO::FETCH_ASSOC);
echo "=== VIDEOS COLUMNS ===\n";
foreach ($cols as $c) {
    echo "{$c['Field']} (Null: {$c['Null']}, Default: {$c['Default']})\n";
}

$annCols = $db->query("SHOW COLUMNS FROM announcements")->fetchAll(PDO::FETCH_ASSOC);
echo "\n=== ANNOUNCEMENTS COLUMNS ===\n";
foreach ($annCols as $c) {
    echo "{$c['Field']} (Null: {$c['Null']}, Default: {$c['Default']})\n";
}
