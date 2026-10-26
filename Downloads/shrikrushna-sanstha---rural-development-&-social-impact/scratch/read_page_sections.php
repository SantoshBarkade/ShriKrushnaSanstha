<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$cols = $db->query("DESCRIBE page_sections")->fetchAll(PDO::FETCH_ASSOC);
echo "=== COLUMNS OF page_sections ===\n";
print_r($cols);

$rows = $db->query("SELECT * FROM page_sections")->fetchAll(PDO::FETCH_ASSOC);
echo "\n=== ROWS IN page_sections ===\n";
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
