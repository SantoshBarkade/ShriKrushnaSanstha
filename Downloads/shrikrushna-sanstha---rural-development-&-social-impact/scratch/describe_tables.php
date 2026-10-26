<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
echo "=== page_sections ===\n";
foreach ($db->query("DESCRIBE page_sections")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo "{$c['Field']} ({$c['Type']}) " . ($c['Null'] === 'YES' ? 'NULL' : 'NOT NULL') . " Default: {$c['Default']}\n";
}
echo "\n=== site_pages ===\n";
foreach ($db->query("DESCRIBE site_pages")->fetchAll(PDO::FETCH_ASSOC) as $c) {
    echo "{$c['Field']} ({$c['Type']}) " . ($c['Null'] === 'YES' ? 'NULL' : 'NOT NULL') . " Default: {$c['Default']}\n";
}
