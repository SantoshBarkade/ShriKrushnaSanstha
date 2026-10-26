<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$action = $argv[1] ?? 'register';
$rawToken = $argv[2] ?? '';

if (!$rawToken) {
    echo "NO_TOKEN";
    exit(1);
}

$tokenHash = hash('sha256', $rawToken);

if ($action === 'register') {
    $stmt = $db->prepare("INSERT INTO admin_tokens (admin_id, token_hash, ip_address, expires_at) VALUES (1, ?, '127.0.0.1', DATE_ADD(NOW(), INTERVAL 1 HOUR))");
    $stmt->execute([$tokenHash]);
    echo "TOKEN_REGISTERED";
} elseif ($action === 'clean') {
    $stmt = $db->prepare("DELETE FROM admin_tokens WHERE token_hash = ?");
    $stmt->execute([$tokenHash]);
    echo "TOKEN_CLEANED";
}
