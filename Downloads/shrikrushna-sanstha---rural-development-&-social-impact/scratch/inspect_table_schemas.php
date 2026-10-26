<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== COLUMNS OF site_settings ===\n";
$cols = $db->query("DESCRIBE site_settings")->fetchAll(PDO::FETCH_ASSOC);
print_r($cols);

echo "\n=== COLUMNS OF contact_info ===\n";
$cols = $db->query("DESCRIBE contact_info")->fetchAll(PDO::FETCH_ASSOC);
print_r($cols);

echo "\n=== COLUMNS OF videos ===\n";
$cols = $db->query("DESCRIBE videos")->fetchAll(PDO::FETCH_ASSOC);
print_r($cols);
