<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
foreach ($db->query("DESCRIBE media_files")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo "{$c['Field']} ({$c['Type']}) " . ($c['Null'] === 'YES' ? 'NULL' : 'NOT NULL') . " Default: {$c['Default']}\n";
}
