<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->query("SHOW CREATE TABLE inquiries");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo $row['Create Table'] . PHP_EOL;
