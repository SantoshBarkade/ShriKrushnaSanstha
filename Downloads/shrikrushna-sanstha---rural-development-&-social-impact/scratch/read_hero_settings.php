<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$database = new Database();
$db = $database->getConnection();

$stmt = $db->query("SELECT * FROM site_settings WHERE key_name IN ('hero_badge', 'sanstha_tagline', 'hero_stats_beneficiaries', 'hero_stats_villages')");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
