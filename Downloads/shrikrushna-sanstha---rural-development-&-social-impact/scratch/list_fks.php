<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$sql = "SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'shrikrushnasanstha2' AND REFERENCED_TABLE_NAME IS NOT NULL";
print_r($db->query($sql)->fetchAll(PDO::FETCH_ASSOC));
