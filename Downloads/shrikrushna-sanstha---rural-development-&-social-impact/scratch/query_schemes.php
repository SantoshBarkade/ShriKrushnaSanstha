<?php
$pdo = new PDO("mysql:host=127.0.0.1;dbname=shrikrushnasanstha2;charset=utf8mb4", "root", "Jagdamba@558");
$stmt = $pdo->query("SELECT id, title_mr, title_en, department_mr, published FROM government_schemes ORDER BY id");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
