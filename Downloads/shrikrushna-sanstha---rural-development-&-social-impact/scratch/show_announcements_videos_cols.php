<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

echo "=== ANNOUNCEMENTS COLUMNS ===\n";
$stmt = $db->query("SHOW COLUMNS FROM announcements");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n";

echo "=== VIDEOS COLUMNS ===\n";
$stmt = $db->query("SHOW COLUMNS FROM videos");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT) . "\n";
