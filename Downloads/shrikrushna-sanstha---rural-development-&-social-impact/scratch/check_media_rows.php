<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
print_r($db->query("SELECT id, file_name, file_path FROM media_files")->fetchAll(PDO::FETCH_ASSOC));
