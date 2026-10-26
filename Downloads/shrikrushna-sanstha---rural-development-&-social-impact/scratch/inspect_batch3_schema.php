<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = new Database();
$pdo = $db->getConnection();
$tables = ['officials', 'site_pages', 'page_sections', 'site_settings'];

foreach ($tables as $t) {
    echo "=== TABLE: $t ===\n";
    try {
        $stmt = $pdo->query("DESCRIBE $t");
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            echo sprintf("%-25s %-25s %-6s %-6s %-10s\n", $row['Field'], $row['Type'], $row['Null'], $row['Key'], $row['Default'] ?? 'NULL');
        }
        $count = $pdo->query("SELECT COUNT(*) FROM $t")->fetchColumn();
        echo "Row count: $count\n";
    } catch (Exception $e) {
        echo "Error: " . $e->getMessage() . "\n";
    }
    echo "\n";
}
