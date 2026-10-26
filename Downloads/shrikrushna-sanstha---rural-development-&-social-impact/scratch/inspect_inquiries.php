<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$rows = $db->query("SELECT id, full_name, contact_detail, subject, status, ip_address, created_at FROM inquiries")->fetchAll();
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
