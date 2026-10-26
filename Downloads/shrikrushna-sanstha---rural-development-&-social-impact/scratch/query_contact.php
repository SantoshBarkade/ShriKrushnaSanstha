<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=shrikrushnasanstha2;charset=utf8mb4", "root", "Jagdamba@558");
$stmt = $pdo->query("DESCRIBE contact_info");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
$stmt2 = $pdo->query("SELECT * FROM contact_info LIMIT 2");
echo "\nDATA:\n" . json_encode($stmt2->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
