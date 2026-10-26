<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "=== DATABASE TABLES & ROW COUNTS ===\n";
$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    $count = $db->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
    echo str_pad($t, 25) . " : $count rows\n";
}

echo "\n=== DETAILED COLUMNS PER TABLE ===\n";
foreach ($tables as $t) {
    echo "\n--- TABLE: $t ---\n";
    $cols = $db->query("DESCRIBE `$t`")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $c) {
        $null = $c['Null'] === 'YES' ? 'NULL' : 'NOT NULL';
        $key = !empty($c['Key']) ? "[{$c['Key']}]" : "";
        $default = $c['Default'] !== null ? "DEFAULT '{$c['Default']}'" : "";
        echo "  " . str_pad($c['Field'], 20) . " " . str_pad($c['Type'], 20) . " $null $key $default\n";
    }
}
