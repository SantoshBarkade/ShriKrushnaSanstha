<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo "Tables in DB: " . implode(', ', $tables) . PHP_EOL;

if (in_array('volunteers', $tables, true)) {
    echo "--- DESCRIBE volunteers ---" . PHP_EOL;
    $cols = $db->query('DESCRIBE volunteers')->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($cols, JSON_PRETTY_PRINT) . PHP_EOL;
    $count = $db->query('SELECT COUNT(*) FROM volunteers')->fetchColumn();
    echo "Total records in volunteers: " . $count . PHP_EOL;
} else {
    echo "Table 'volunteers' DOES NOT EXIST." . PHP_EOL;
}
