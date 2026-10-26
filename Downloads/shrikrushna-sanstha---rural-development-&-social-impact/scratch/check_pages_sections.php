<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SITE_PAGES ===\n";
$pages = $db->query("SELECT * FROM site_pages")->fetchAll(PDO::FETCH_ASSOC);
print_r($pages);

echo "\n=== PAGE_SECTIONS ===\n";
$sections = $db->query("SELECT id, page_slug, section_key, title_mr, title_en, display_order, is_published FROM page_sections ORDER BY page_slug, display_order")->fetchAll(PDO::FETCH_ASSOC);
print_r($sections);

echo "\n=== SITE_SETTINGS ===\n";
$settings = $db->query("SELECT * FROM site_settings")->fetchAll(PDO::FETCH_ASSOC);
print_r($settings);

echo "\n=== CONTACT_INFO ===\n";
$contact = $db->query("SELECT * FROM contact_info")->fetchAll(PDO::FETCH_ASSOC);
print_r($contact);
