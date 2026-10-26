<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

foreach (['site_pages', 'page_sections', 'media_files'] as $t) {
    echo "=== Table: {$t} ===\n";
    $cols = $db->query("DESCRIBE {$t}")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        echo sprintf("  %-25s %-25s Null:%-4s Key:%-4s Default:%s\n", 
            $c['Field'], $c['Type'], $c['Null'], $c['Key'], var_export($c['Default'], true)
        );
    }
    $count = $db->query("SELECT COUNT(*) FROM {$t}")->fetchColumn();
    echo "  Total Rows: {$count}\n\n";
}

// Show existing records in site_pages
echo "=== Foreign Keys ===\n";
$fks = $db->query("SELECT TABLE_NAME, CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME 
    FROM information_schema.KEY_COLUMN_USAGE 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('page_sections', 'media_files') AND REFERENCED_TABLE_NAME IS NOT NULL"
)->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($fks, JSON_PRETTY_PRINT) . "\n";
