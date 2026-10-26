<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = new Database();
$pdo = $db->getConnection();

echo "--- OFFICIALS ---\n";
$stmt = $pdo->query("SELECT id, name_mr, name_en, role_mr, role_en, display_order, published FROM officials ORDER BY display_order ASC");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "--- SITE_PAGES ---\n";
$stmt = $pdo->query("SELECT * FROM site_pages");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "--- PAGE_SECTIONS ---\n";
$stmt = $pdo->query("SELECT * FROM page_sections");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "--- SITE_SETTINGS ---\n";
$stmt = $pdo->query("SELECT * FROM site_settings");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
