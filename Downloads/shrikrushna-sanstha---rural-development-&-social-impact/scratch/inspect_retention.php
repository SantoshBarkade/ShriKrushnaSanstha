<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->query("SHOW EVENTS");
$events = $stmt->fetchAll(PDO::FETCH_ASSOC);
echo "Database Events (" . count($events) . "):\n";
echo json_encode($events, JSON_PRETTY_PRINT) . "\n";

$stmt2 = $db->query("SHOW TRIGGERS");
$triggers = $stmt2->fetchAll(PDO::FETCH_ASSOC);
echo "Database Triggers (" . count($triggers) . "):\n";
echo json_encode($triggers, JSON_PRETTY_PRINT) . "\n";
