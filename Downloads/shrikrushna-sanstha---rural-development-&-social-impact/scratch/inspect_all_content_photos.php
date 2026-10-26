<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== 1. ANNOUNCEMENTS PHOTOS ===\n";
$announcements = $db->query("SELECT id, title_mr, cover_image_url FROM announcements")->fetchAll(PDO::FETCH_ASSOC);
foreach ($announcements as $a) {
    echo "ID: {$a['id']} | Title: {$a['title_mr']} | Cover: {$a['cover_image_url']}\n";
}

echo "\n=== 2. GALLERY ALBUMS & PHOTOS ===\n";
$albums = $db->query("SELECT id, title_mr, cover_image_url FROM gallery_albums")->fetchAll(PDO::FETCH_ASSOC);
foreach ($albums as $alb) {
    echo "Album: {$alb['id']} | Title: {$alb['title_mr']} | Cover: {$alb['cover_image_url']}\n";
}
$gphotos = $db->query("SELECT id, album_id, image_url, caption_mr FROM gallery_photos")->fetchAll(PDO::FETCH_ASSOC);
foreach ($gphotos as $gp) {
    echo "Photo: {$gp['id']} | Album: {$gp['album_id']} | Image: {$gp['image_url']} | Caption: {$gp['caption_mr']}\n";
}

echo "\n=== 3. OFFICIALS PHOTOS ===\n";
$officials = $db->query("SELECT id, name_mr, role_mr, image_url FROM officials")->fetchAll(PDO::FETCH_ASSOC);
foreach ($officials as $o) {
    echo "Official: {$o['id']} | Name: {$o['name_mr']} | Role: {$o['role_mr']} | Image: {$o['image_url']}\n";
}

echo "\n=== 4. INITIATIVES PHOTOS ===\n";
$initiatives = $db->query("SELECT id, title_mr, cover_image_url FROM initiatives")->fetchAll(PDO::FETCH_ASSOC);
foreach ($initiatives as $i) {
    echo "Initiative: {$i['id']} | Title: {$i['title_mr']} | Cover: {$i['cover_image_url']}\n";
}
$init_photos = $db->query("SELECT * FROM initiative_photos")->fetchAll(PDO::FETCH_ASSOC);
foreach ($init_photos as $ip) {
    echo "Init Photo: {$ip['id']} | Init ID: {$ip['initiative_id']} | Image: {$ip['image_url']}\n";
}

echo "\n=== 5. PAGE SECTIONS PHOTOS ===\n";
$sections = $db->query("SELECT id, page_slug, section_key, title_mr, image_url FROM page_sections WHERE image_url IS NOT NULL AND image_url != ''")->fetchAll(PDO::FETCH_ASSOC);
foreach ($sections as $s) {
    echo "Section: {$s['id']} | Page: {$s['page_slug']} | Key: {$s['section_key']} | Image: {$s['image_url']}\n";
}
