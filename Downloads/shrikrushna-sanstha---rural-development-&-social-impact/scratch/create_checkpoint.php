<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$backupDir = __DIR__ . '/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}
$backupFile = $backupDir . '/backup_shrikrushnasanstha2_' . date('Ymd_His') . '.sql';
$out = fopen($backupFile, 'w');
fwrite($out, "-- Checkpoint backup of shrikrushnasanstha2\n");
fwrite($out, "SET FOREIGN_KEY_CHECKS = 0;\n\n");
$tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    $create = $db->query('SHOW CREATE TABLE `' . $t . '`')->fetch(PDO::FETCH_ASSOC);
    fwrite($out, $create['Create Table'] . ";\n\n");
    $rows = $db->query('SELECT * FROM `' . $t . '`')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as $row) {
        $cols = array_map(function($c) { return '`' . $c . '`'; }, array_keys($row));
        $vals = array_map(function($v) use ($db) { return $v === null ? 'NULL' : $db->quote($v); }, array_values($row));
        fwrite($out, 'INSERT INTO `' . $t . '` (' . implode(', ', $cols) . ') VALUES (' . implode(', ', $vals) . ");\n");
    }
    fwrite($out, "\n");
}
fwrite($out, "SET FOREIGN_KEY_CHECKS = 1;\n");
fclose($out);
echo "SUCCESS: Checkpoint created at {$backupFile} (" . filesize($backupFile) . " bytes)\n";
