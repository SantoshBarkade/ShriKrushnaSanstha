<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SHOW DATABASES ===\n";
$dbs = $db->query("SHOW DATABASES")->fetchAll(PDO::FETCH_COLUMN);
print_r($dbs);
