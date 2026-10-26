<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=shrikrushnasanstha2;charset=utf8mb4", "root", "Jagdamba@558");
$stmt = $pdo->query("SELECT * FROM contact_info WHERE id=1");
$row = $stmt->fetch(PDO::FETCH_ASSOC);
echo json_encode($row, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
