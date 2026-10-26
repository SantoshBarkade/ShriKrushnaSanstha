<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

// Let's see current media_files entries
$current = $db->query("SELECT id, file_name, file_path FROM media_files")->fetchAll(PDO::FETCH_ASSOC);
echo "Current media_files rows:\n";
foreach ($current as $c) {
    $fullPath = dirname(__DIR__) . $c['file_path'];
    $exists = file_exists($fullPath) ? 'EXISTS' : 'MISSING ON DISK';
    echo "  #{$c['id']} {$c['file_name']} -> {$exists}\n";
}
