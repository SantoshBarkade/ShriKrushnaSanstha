<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SITE_PAGES ===\n";
print_r($db->query("SELECT * FROM site_pages")->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== SITE_SETTINGS ===\n";
print_r($db->query("SELECT * FROM site_settings")->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== GALLERY_ALBUMS ===\n";
print_r($db->query("SELECT * FROM gallery_albums")->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== CONTACT_INFO ===\n";
print_r($db->query("SELECT * FROM contact_info")->fetchAll(PDO::FETCH_ASSOC));

echo "\n=== REPORTS ===\n";
print_r($db->query("SELECT id, title_mr, period_mr, pdf_url FROM reports")->fetchAll(PDO::FETCH_ASSOC));
