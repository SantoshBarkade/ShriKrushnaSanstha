<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== FULL EVENT ROW ===\n";
$events = $db->query("SELECT * FROM events")->fetchAll(PDO::FETCH_ASSOC);
print_r($events);

echo "\n=== ALL MEDIA FILES ASSOCIATED WITH EVENTS ===\n";
$media = $db->query("SELECT * FROM media_files WHERE file_path LIKE '%events%'")->fetchAll(PDO::FETCH_ASSOC);
print_r($media);
