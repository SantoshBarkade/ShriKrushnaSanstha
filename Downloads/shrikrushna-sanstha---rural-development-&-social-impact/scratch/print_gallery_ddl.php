<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== FOREIGN KEYS ON gallery_photos ===\n";
$stmt = $db->query("
    SELECT 
        TABLE_NAME, 
        COLUMN_NAME, 
        CONSTRAINT_NAME, 
        REFERENCED_TABLE_NAME, 
        REFERENCED_COLUMN_NAME
    FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN ('gallery_photos', 'gallery_albums')
      AND REFERENCED_TABLE_NAME IS NOT NULL
");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== CREATE TABLE gallery_photos DDL ===\n";
$row = $db->query("SHOW CREATE TABLE gallery_photos")->fetch(PDO::FETCH_ASSOC);
echo $row['Create Table'] . "\n";

echo "\n=== CREATE TABLE gallery_albums DDL ===\n";
$row = $db->query("SHOW CREATE TABLE gallery_albums")->fetch(PDO::FETCH_ASSOC);
echo $row['Create Table'] . "\n";
