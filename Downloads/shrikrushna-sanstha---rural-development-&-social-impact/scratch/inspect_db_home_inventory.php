<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

echo "=== ANNOUNCEMENTS (top 5) ===\n";
$stmt = $db->query("SELECT id, title_mr, title_en, category, display_order, published, created_at FROM announcements ORDER BY display_order ASC, created_at DESC LIMIT 5");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";

echo "=== VIDEOS (featured / top 3) ===\n";
$stmt = $db->query("SELECT id, title_mr, title_en, video_url, featured, published, duration_formatted, duration_formatted_en FROM videos ORDER BY featured DESC, id DESC LIMIT 3");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
