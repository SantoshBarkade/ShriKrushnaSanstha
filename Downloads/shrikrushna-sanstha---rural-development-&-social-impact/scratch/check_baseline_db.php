<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$annCols = $db->query("SHOW COLUMNS FROM announcements")->fetchAll(PDO::FETCH_COLUMN);
echo "announcements columns: " . implode(", ", $annCols) . "\n";
$annRows = $db->query("SELECT id, title_mr, title_en, event_date_mr, published, display_order FROM announcements ORDER BY display_order ASC, event_date_mr DESC LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
print_r($annRows);

$vidCols = $db->query("SHOW COLUMNS FROM videos")->fetchAll(PDO::FETCH_COLUMN);
echo "\nvideos columns: " . implode(", ", $vidCols) . "\n";
$vidRows = $db->query("SELECT id, title_mr, title_en, featured, published, video_url FROM videos")->fetchAll(PDO::FETCH_ASSOC);
print_r($vidRows);
