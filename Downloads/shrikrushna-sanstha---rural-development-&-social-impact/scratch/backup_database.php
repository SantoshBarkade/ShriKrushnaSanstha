<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$backupDir = __DIR__ . '/../backend-php-mysql/migrations';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}
$backupFile = $backupDir . '/backup_shrikrushnasanstha2_pre_phase2.sql';
$out = fopen($backupFile, 'w');

if (!$out) {
    die("Failed to open backup file for writing: {$backupFile}\n");
}

fwrite($out, "-- Backup of database `shrikrushnasanstha2`\n");
fwrite($out, "-- Generated at: " . date('Y-m-d H:i:s') . "\n\n");
fwrite($out, "SET FOREIGN_KEY_CHECKS = 0;\n\n");

$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);

foreach ($tables as $t) {
    fwrite($out, "-- --------------------------------------------------------\n");
    fwrite($out, "-- Table structure for `{$t}`\n");
    fwrite($out, "-- --------------------------------------------------------\n");
    $create = $db->query("SHOW CREATE TABLE `{$t}`")->fetch(PDO::FETCH_ASSOC);
    fwrite($out, $create['Create Table'] . ";\n\n");

    $rows = $db->query("SELECT * FROM `{$t}`")->fetchAll(PDO::FETCH_ASSOC);
    if (!empty($rows)) {
        fwrite($out, "-- Dumping data for table `{$t}` (" . count($rows) . " rows)\n");
        foreach ($rows as $row) {
            $cols = array_map(function($c) { return "`{$c}`"; }, array_keys($row));
            $vals = array_map(function($v) use ($db) {
                if ($v === null) return "NULL";
                return $db->quote($v);
            }, array_values($row));
            fwrite($out, "INSERT INTO `{$t}` (" . implode(', ', $cols) . ") VALUES (" . implode(', ', $vals) . ");\n");
        }
        fwrite($out, "\n");
    }
}

fwrite($out, "SET FOREIGN_KEY_CHECKS = 1;\n");
fclose($out);

$size = filesize($backupFile);
echo "SUCCESS: Database backup created successfully!\n";
echo "File: {$backupFile}\n";
echo "Size: {$size} bytes\n";
echo "Tables backed up: " . count($tables) . "\n";
