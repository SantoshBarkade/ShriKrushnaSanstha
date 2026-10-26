<?php
/**
 * Step 1: Reconfirm Database and Create Full Verified Backup
 */
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

$activeDb = $db->query("SELECT DATABASE()")->fetchColumn();
echo "RECONFIRMED ACTIVE DATABASE: $activeDb\n";

if ($activeDb !== 'shrikrushnasanstha2') {
    echo "FATAL: Active database is '$activeDb', expected 'shrikrushnasanstha2'. Aborting.\n";
    exit(1);
}

$backupDir = __DIR__ . '/../scratch/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0755, true);
}

$timestamp = date('Ymd_His');
$backupFile = $backupDir . "/backup_shrikrushnasanstha2_{$timestamp}.sql";

echo "Creating backup at: $backupFile\n";

$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$sqlDump = "-- Shrikrushna Sanstha Database Backup\n";
$sqlDump .= "-- Database: $activeDb\n";
$sqlDump .= "-- Created at: " . date('Y-m-d H:i:s') . "\n\n";
$sqlDump .= "SET FOREIGN_KEY_CHECKS = 0;\n\n";

$totalRows = 0;
foreach ($tables as $table) {
    // Structure
    $createRow = $db->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
    $sqlDump .= "DROP TABLE IF EXISTS `$table`;\n";
    $sqlDump .= $createRow['Create Table'] . ";\n\n";

    // Data
    $rows = $db->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
    $rowCount = count($rows);
    $totalRows += $rowCount;

    if ($rowCount > 0) {
        $cols = array_keys($rows[0]);
        $escapedCols = array_map(function($c) { return "`$c`"; }, $cols);
        $colList = implode(', ', $escapedCols);

        foreach ($rows as $row) {
            $vals = [];
            foreach ($cols as $col) {
                $val = $row[$col];
                if ($val === null) {
                    $vals[] = 'NULL';
                } else {
                    $vals[] = $db->quote($val);
                }
            }
            $sqlDump .= "INSERT INTO `$table` ($colList) VALUES (" . implode(', ', $vals) . ");\n";
        }
        $sqlDump .= "\n";
    }
    echo "  - Table `$table`: $rowCount rows backed up.\n";
}

$sqlDump .= "SET FOREIGN_KEY_CHECKS = 1;\n";

file_put_contents($backupFile, $sqlDump);

$backupSize = filesize($backupFile);
echo "\nBackup created successfully!\n";
echo "File size: " . number_format($backupSize) . " bytes\n";
echo "Total tables: " . count($tables) . "\n";
echo "Total rows: $totalRows\n";

if ($backupSize < 5000) {
    echo "FATAL: Backup file suspiciously small ($backupSize bytes). Aborting.\n";
    exit(1);
}

echo "BACKUP_VERIFICATION: PASSED\n";
