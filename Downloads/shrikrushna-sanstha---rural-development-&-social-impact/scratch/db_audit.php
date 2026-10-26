<?php
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
  $rows = $db->query("SELECT * FROM `$t`")->fetchAll(PDO::FETCH_ASSOC);
  foreach ($rows as $r) {
    $json = json_encode($r, JSON_UNESCAPED_UNICODE);
    foreach ($errorTerms as $term) {
      if (strpos($json, $term) !== false) {
        $errors[] = [
          'table' => $t,
          'term' => $term,
          'id' => $r['id'] ?? $r['key'] ?? 'unknown',
          'fullRow' => $r
        ];
      }
    }
  }
}
echo json_encode($errors, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
file_put_contents('scratch/db_marathi_findings.json', json_encode($errors, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
