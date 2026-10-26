<?php
try {
  $pdo = new PDO('mysql:host=127.0.0.1;dbname=shrikrushnasanstha2', 'root', 'Jagdamba@558');
  $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
  foreach ($tables as $t) {
    try {
      $rows = $pdo->query('SELECT * FROM `' . $t . '`')->fetchAll(PDO::FETCH_ASSOC);
      $json = json_encode($rows, JSON_UNESCAPED_UNICODE);
      if (strpos($json, '@@@@') !== false) {
        echo "FOUND @@@@ in table: $t\n";
        foreach ($rows as $r) {
          if (strpos(json_encode($r, JSON_UNESCAPED_UNICODE), '@@@@') !== false) {
            echo "  Row: " . json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
          }
        }
      }
      if (strpos($json, '############') !== false) {
        echo "FOUND ############ in table: $t\n";
        foreach ($rows as $r) {
          if (strpos(json_encode($r, JSON_UNESCAPED_UNICODE), '############') !== false) {
            echo "  Row: " . json_encode($r, JSON_UNESCAPED_UNICODE) . "\n";
          }
        }
      }
    } catch (Exception $ex) {
      // ignore
    }
  }
  echo "DB Search complete.\n";
} catch (Exception $e) {
  echo "Error: " . $e->getMessage() . "\n";
}
