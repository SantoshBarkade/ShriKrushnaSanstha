<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT * FROM site_pages WHERE slug = 'home'");
$page = $stmt->fetch(PDO::FETCH_ASSOC);
echo "=== SITE_PAGE HOME ===\n" . json_encode($page, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

$stmt2 = $db->query("SELECT * FROM contact_info WHERE id = 1");
$contact = $stmt2->fetch(PDO::FETCH_ASSOC);
echo "=== CONTACT INFO ===\n" . json_encode($contact, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
