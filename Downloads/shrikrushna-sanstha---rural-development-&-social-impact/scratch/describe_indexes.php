<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
echo "=== page_sections indexes ===\n";
print_r($db->query("SHOW INDEX FROM page_sections")->fetchAll(PDO::FETCH_ASSOC));
echo "=== media_files indexes ===\n";
print_r($db->query("SHOW INDEX FROM media_files")->fetchAll(PDO::FETCH_ASSOC));
