<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$stmt = $db->query('SELECT id, username, email, role, full_name FROM admins');
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
