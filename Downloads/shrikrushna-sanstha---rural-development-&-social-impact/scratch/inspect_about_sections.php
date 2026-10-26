<?php
$pdo = new PDO('mysql:host=127.0.0.1;dbname=shrikrushnasanstha2', 'root', 'Jagdamba@558');
$rows = $pdo->query('SELECT id, section_key, title_mr, subtitle_mr, display_order FROM page_sections WHERE page_slug="work"')->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($rows, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
