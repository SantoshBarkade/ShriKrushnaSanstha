<?php
// Test Home Page CMS API contracts for shrikrushnasanstha2
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$db = (new Database())->getConnection();

echo "=== 1. Checking site_pages for 'home' ===\n";
$stmt = $db->prepare("SELECT slug, title_mr, title_en, meta_description_mr, meta_description_en FROM site_pages WHERE slug = 'home'");
$stmt->execute();
$homePage = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($homePage, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "=== 2. Checking page_sections for 'home' ===\n";
$stmt = $db->prepare("SELECT id, page_slug, section_key, title_mr, title_en, is_published, display_order FROM page_sections WHERE page_slug = 'home'");
$stmt->execute();
$homeSections = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Total home sections count: " . count($homeSections) . "\n";
echo json_encode($homeSections, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "=== 3. Checking site_settings for Hero ===\n";
$stmt = $db->prepare("SELECT key_name, value_mr, value_en FROM site_settings WHERE key_name IN ('hero_badge', 'sanstha_tagline', 'hero_stats_beneficiaries', 'hero_stats_villages')");
$stmt->execute();
$settings = $stmt->fetchAll(PDO::FETCH_ASSOC);
foreach ($settings as $s) {
    echo "{$s['key_name']}:\n  MR: {$s['value_mr']}\n  EN: {$s['value_en']}\n";
}
echo "\n=== 4. Checking featured videos for Home ===\n";
$stmt = $db->prepare("SELECT id, title_mr, title_en, video_url, duration_formatted, featured, published FROM videos WHERE featured = 1 AND published = 1");
$stmt->execute();
$featuredVideos = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Featured videos count: " . count($featuredVideos) . "\n";
echo json_encode($featuredVideos, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "=== 5. Checking announcements for Home ===\n";
$stmt = $db->prepare("SELECT id, title_mr, title_en, category, event_date_mr, published FROM announcements WHERE published = 1 ORDER BY display_order ASC, created_at DESC LIMIT 3");
$stmt->execute();
$announcements = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Announcements count: " . count($announcements) . "\n";
echo json_encode($announcements, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

echo "=== 6. Checking contact_info (Reg No) ===\n";
$stmt = $db->prepare("SELECT reg_no_mr, reg_no_en, email, phone FROM contact_info LIMIT 1");
$stmt->execute();
$contact = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($contact, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
