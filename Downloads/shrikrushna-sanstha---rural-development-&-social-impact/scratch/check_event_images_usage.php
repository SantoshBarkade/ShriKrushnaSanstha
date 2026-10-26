<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

$targets = [
    'evt_03eeefe495cda0a8a24f',
    'evt_bf28d44a652542413ded',
    'evt_a4cd0d907017da23c2fa'
];

echo "=== CHECKING REFERENCES ACROSS ALL TABLES ===\n";
$tables = $db->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $table) {
    $cols = $db->query("SHOW COLUMNS FROM `$table`")->fetchAll(PDO::FETCH_COLUMN);
    foreach ($cols as $col) {
        foreach ($targets as $target) {
            $stmt = $db->prepare("SELECT COUNT(*) FROM `$table` WHERE `$col` LIKE :term");
            $stmt->execute(['term' => "%$target%"]);
            $count = $stmt->fetchColumn();
            if ($count > 0) {
                echo "Found in Table: $table | Column: $col | Target: $target | Count: $count\n";
            }
        }
    }
}
