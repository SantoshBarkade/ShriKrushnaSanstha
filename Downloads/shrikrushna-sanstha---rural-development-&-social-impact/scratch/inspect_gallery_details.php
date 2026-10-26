<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

$photos = $db->query("SELECT * FROM gallery_photos WHERE id LIKE 'gal-1792578754817%'")->fetchAll(PDO::FETCH_ASSOC);
print_r($photos);
