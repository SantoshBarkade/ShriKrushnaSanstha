<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=shrikrushnasanstha2', 'root', 'Jagdamba@558');
$rows = $pdo->query('SELECT id, title_mr, title_en, display_order FROM government_schemes ORDER BY display_order ASC')->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
