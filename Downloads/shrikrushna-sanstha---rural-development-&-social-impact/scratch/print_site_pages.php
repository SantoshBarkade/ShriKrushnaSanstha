<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== SITE_PAGES ===\n";
foreach ($db->query("SELECT slug, title_mr, title_en, is_published FROM site_pages")->fetchAll(PDO::FETCH_ASSOC) as $p) {
    echo "Slug: {$p['slug']} | MR: {$p['title_mr']} | EN: {$p['title_en']} | Published: {$p['is_published']}\n";
}
