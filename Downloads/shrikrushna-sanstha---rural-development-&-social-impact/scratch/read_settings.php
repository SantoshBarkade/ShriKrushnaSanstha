<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$stmt = $db->query("SELECT key_name, value_mr, value_en FROM site_settings WHERE key_name IN ('hero_badge', 'sanstha_tagline', 'beneficiaries_count', 'villages_covered')");
$settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "=== SITE SETTINGS ===\n" . json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
