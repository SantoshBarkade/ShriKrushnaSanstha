const fs = require('fs');
const mysql = require('mysql2/promise');

const errorTerms = [
  'समरपित', 'मारगदरशन', 'परिवरतनाच्या', 'सरवांच्या', 'संवरधन',
  'कटिदध', 'कटिबध्द', 'समाजकारय', 'परयावरण', 'कलयाणकारी',
  'मारगदरशक', 'वारषिक', 'पारदरशकता', 'कारयकारिणी', 'कारयपदधती',
  'कार्यपदधती', 'संपरक', 'लोककलयाण', 'अरज', 'समृदधी', 'समृध्दी',
  'कारयक्रम', 'सारवजनिक', 'पूरवसंवाद', 'लाभारथी', 'पूरण',
  'धुळे', 'धुळे जिल्हा', 'धुळे (Dhule)', 'Dhule',
  '@@@@', '############'
];

async function auditDatabase() {
  console.log('Connecting to database shrikrushnasanstha2...');
  const { execSync } = require('child_process');
  
  // Use PHP helper to query DB
  const phpScript = `<?php
require_once 'backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();
$tables = $db->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

$errors = [];
$errorTerms = [
  'समरपित', 'मारगदरशन', 'परिवरतनाच्या', 'सरवांच्या', 'संवरधन',
  'कटिदध', 'कटिबध्द', 'समाजकारय', 'परयावरण', 'कलयाणकारी',
  'मारगदरशक', 'वारषिक', 'पारदरशकता', 'कारयकारिणी', 'कारयपदधती',
  'कार्यपदधती', 'संपरक', 'लोककलयाण', 'अरज', 'समृदधी', 'समृध्दी',
  'कारयक्रम', 'सारवजनिक', 'पूरवसंवाद', 'लाभारथी', 'पूरण',
  'धुळे', '@@@@', '############', 'पाऊले', 'पहा'
];

foreach ($tables as $t) {
  $rows = $db->query("SELECT * FROM \`$t\`")->fetchAll(PDO::FETCH_ASSOC);
  foreach ($rows as $r) {
    $json = json_encode($r, JSON_UNESCAPED_UNICODE);
    foreach ($errorTerms as $term) {
      if (strpos($json, $term) !== false) {
        $errors[] = [
          'table' => $t,
          'term' => $term,
          'id' => $r['id'] ?? $r['key'] ?? 'unknown',
          'sample' => mb_substr($json, 0, 150)
        ];
      }
    }
  }
}
echo json_encode($errors, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
`;
  fs.writeFileSync('scratch/db_audit.php', phpScript);
  const result = execSync('C:\\tools\\php8.4\\php.exe scratch/db_audit.php', { encoding: 'utf8' });
  console.log('DB Audit Results:\n', result);
  fs.writeFileSync('scratch/db_marathi_findings.json', result, 'utf8');
}

auditDatabase();
