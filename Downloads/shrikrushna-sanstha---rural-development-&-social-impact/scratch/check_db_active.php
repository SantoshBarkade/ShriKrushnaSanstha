<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "ACTIVE_DATABASE: " . $db->query("SELECT DATABASE()")->fetchColumn() . "\n";
echo "MYSQL_SERVER_VERSION: " . $db->getAttribute(PDO::ATTR_SERVER_VERSION) . "\n";
echo "HOST_INFO: " . $db->getAttribute(PDO::ATTR_CONNECTION_STATUS) . "\n";
