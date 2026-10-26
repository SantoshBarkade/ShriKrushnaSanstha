<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$cols = $db->query("DESCRIBE site_pages")->fetchAll(PDO::FETCH_ASSOC);
echo "=== COLUMNS OF site_pages ===\n";
print_r($cols);

$rows = $db->query("SELECT * FROM site_pages")->fetchAll(PDO::FETCH_ASSOC);
echo "\n=== ROWS IN site_pages ===\n";
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
