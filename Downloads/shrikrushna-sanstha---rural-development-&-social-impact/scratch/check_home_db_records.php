<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== VIDEOS TABLE ===\n";
$videos = $db->query("SELECT id, title_mr, title_en, category, duration_seconds, duration_formatted, duration_formatted_en, thumbnail_url, video_url, published, featured FROM videos")->fetchAll(PDO::FETCH_ASSOC);
print_r($videos);

echo "\n=== ANNOUNCEMENTS TABLE ===\n";
$announcements = $db->query("SELECT id, title_mr, title_en, category, event_date_mr, event_date_en, summary_mr, summary_en, cover_image_url, published FROM announcements")->fetchAll(PDO::FETCH_ASSOC);
print_r($announcements);

echo "\n=== SITE_PAGES FOR HOME ===\n";
$sitePages = $db->query("SELECT * FROM site_pages WHERE slug = 'home'")->fetchAll(PDO::FETCH_ASSOC);
print_r($sitePages);

echo "\n=== PAGE_SECTIONS FOR HOME ===\n";
$homeSections = $db->query("SELECT * FROM page_sections WHERE page_slug = 'home'")->fetchAll(PDO::FETCH_ASSOC);
print_r($homeSections);
