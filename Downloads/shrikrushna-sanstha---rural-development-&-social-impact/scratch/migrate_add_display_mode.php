<?php
/**
 * Step 2: Non-destructive migration to add display_mode to gallery_albums
 */
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

$activeDb = $db->query("SELECT DATABASE()")->fetchColumn();
echo "ACTIVE DATABASE: $activeDb\n";
if ($activeDb !== 'shrikrushnasanstha2') {
    die("ERROR: Unexpected database $activeDb\n");
}

// Check existing columns
$cols = $db->query("SHOW COLUMNS FROM gallery_albums")->fetchAll(PDO::FETCH_ASSOC);
$colNames = array_column($cols, 'Field');

if (in_array('display_mode', $colNames)) {
    echo "Column display_mode already exists in gallery_albums.\n";
} else {
    echo "Adding column display_mode ENUM('grid', 'carousel') NOT NULL DEFAULT 'grid'...\n";
    $db->exec("ALTER TABLE gallery_albums ADD COLUMN display_mode ENUM('grid', 'carousel') NOT NULL DEFAULT 'grid' AFTER event_date");
    echo "ALTER TABLE executed successfully.\n";
}

// Verify column
$colsAfter = $db->query("SHOW COLUMNS FROM gallery_albums LIKE 'display_mode'")->fetch(PDO::FETCH_ASSOC);
echo "Column verification: " . json_encode($colsAfter) . "\n";

// Verify existing albums data
$albums = $db->query("SELECT id, title_en, display_mode FROM gallery_albums ORDER BY display_order ASC")->fetchAll(PDO::FETCH_ASSOC);
echo "Albums in database (" . count($albums) . "):\n";
foreach ($albums as $alb) {
    echo "  - ID: {$alb['id']}, Title: {$alb['title_en']}, Mode: {$alb['display_mode']}\n";
}

// Verify gallery_photos count
$photoCount = $db->query("SELECT COUNT(*) FROM gallery_photos")->fetchColumn();
echo "Gallery photos count: $photoCount (must be 4)\n";

if (count($albums) === 4 && $photoCount == 4 && $colsAfter && $colsAfter['Default'] === 'grid') {
    echo "MIGRATION_VERIFICATION: SUCCESS\n";
} else {
    echo "MIGRATION_VERIFICATION: FAILED\n";
    exit(1);
}
