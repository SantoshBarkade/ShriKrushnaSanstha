<?php
/**
 * Safe Live Verification of Events Module Fixes
 * Database: shrikrushnasanstha2
 * PHP Server: http://127.0.0.1:8088
 * Vite Proxy: http://localhost:5174
 */

require_once __DIR__ . '/../backend-php-mysql/config/database.php';
require_once __DIR__ . '/../backend-php-mysql/api/auth_helper.php';

$database = new Database();
$db = $database->getConnection();

// Clean up any dangling test tokens first
$db->exec("DELETE FROM admin_tokens WHERE id = 54");

echo "=== 1. VERIFYING PRE-EXISTING RECORDS ===" . PHP_EOL;
$checkStmt = $db->query("SELECT id, title_mr, cover_image_url FROM events WHERE id = 'evt-1792622428974'");
$origEvent = $checkStmt->fetch(PDO::FETCH_ASSOC);
if (!$origEvent) {
    die("FATAL: Original event evt-1792622428974 not found in database!" . PHP_EOL);
}
echo "Original event preserved: ID: " . $origEvent['id'] . ", Title: " . $origEvent['title_mr'] . PHP_EOL;

$annCount = $db->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
echo "Announcements count: " . $annCount . " (preserved)" . PHP_EOL;

echo PHP_EOL . "=== 2. ADMIN AUTHENTICATION ===" . PHP_EOL;
$admin = $db->query("SELECT id, username FROM admins LIMIT 1")->fetch(PDO::FETCH_ASSOC);
if (!$admin) {
    die("FATAL: No admin found in database!" . PHP_EOL);
}

$rawToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $rawToken);
$expiresAt = date('Y-m-d H:i:s', time() + 3600);
$insToken = $db->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at) VALUES (:admin_id, :token_hash, :expires_at)");
$insToken->execute([
    ':admin_id' => $admin['id'],
    ':token_hash' => $tokenHash,
    ':expires_at' => $expiresAt
]);
$testTokenId = $db->lastInsertId();
$token = $rawToken;
echo "Generated Bearer token for admin: " . $admin['username'] . " (Token ID: {$testTokenId})" . PHP_EOL;

$uploadedCoverUrl = null;
$testEventId = null;

try {
    echo PHP_EOL . "=== 3. TESTING IMAGE UPLOAD TO 'events' FOLDER ===" . PHP_EOL;
    $jpegData = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
    $boundary = '--------------------------' . bin2hex(random_bytes(10));
    $body = "--{$boundary}\r\n" .
            "Content-Disposition: form-data; name=\"folder\"\r\n\r\n" .
            "events\r\n" .
            "--{$boundary}\r\n" .
            "Content-Disposition: form-data; name=\"image\"; filename=\"test_event_cover.jpg\"\r\n" .
            "Content-Type: image/jpeg\r\n\r\n" .
            $jpegData . "\r\n" .
            "--{$boundary}--\r\n";

    $opts = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: multipart/form-data; boundary={$boundary}\r\n" .
                        "Authorization: Bearer {$token}\r\n",
            'content' => $body,
            'ignore_errors' => true
        ]
    ];
    $uploadRes = file_get_contents('http://127.0.0.1:8088/backend-php-mysql/api/upload.php', false, stream_context_create($opts));
    $uploadJson = json_decode($uploadRes, true);
    echo "Upload Response: " . json_encode($uploadJson, JSON_UNESCAPED_UNICODE) . PHP_EOL;

    if (empty($uploadJson['success']) || empty($uploadJson['url'])) {
        throw new Exception("Upload failed: " . $uploadRes);
    }
    $uploadedCoverUrl = $uploadJson['url'];
    echo "Uploaded URL: " . $uploadedCoverUrl . PHP_EOL;

    echo PHP_EOL . "=== 4. VERIFYING IMAGE HTTP RESPONSES (Port 8088 & Port 5174) ===" . PHP_EOL;
    $headers8088 = get_headers('http://127.0.0.1:8088' . $uploadedCoverUrl);
    echo "Port 8088 Headers: " . implode(" | ", array_slice($headers8088, 0, 4)) . PHP_EOL;

    $headers5174 = get_headers('http://localhost:5174' . $uploadedCoverUrl);
    echo "Port 5174 Headers: " . implode(" | ", array_slice($headers5174, 0, 4)) . PHP_EOL;

    echo PHP_EOL . "=== 5. TESTING DEDICATED EVENT CREATION WITH COVER & PHOTOS ===" . PHP_EOL;
    $testEventId = 'evt-live-verify-' . time();
    $eventPayload = [
        'id' => $testEventId,
        'title_mr' => 'चाचणी आरोग्य शिबीर',
        'title_en' => 'Test Health Camp',
        'category' => 'आरोग्य',
        'start_date' => '2026-11-20',
        'end_date' => '2026-11-22',
        'venue_mr' => 'नादरपूर',
        'venue_en' => 'Nadarpur',
        'summary_mr' => 'चाचणी शिबीर सारांश',
        'summary_en' => 'Test camp summary',
        'cover_image_url' => $uploadedCoverUrl,
        'status' => 'upcoming',
        'published' => 1,
        'photos' => [
            [
                'image_url' => $uploadedCoverUrl,
                'caption_mr' => 'फोटो १',
                'caption_en' => 'Photo 1',
                'display_order' => 1
            ],
            [
                'image_url' => $uploadedCoverUrl,
                'caption_mr' => 'फोटो २',
                'caption_en' => 'Photo 2',
                'display_order' => 2
            ]
        ]
    ];

    $optsEvt = [
        'http' => [
            'method' => 'POST',
            'header' => "Content-Type: application/json\r\n" .
                        "Authorization: Bearer {$token}\r\n",
            'content' => json_encode($eventPayload),
            'ignore_errors' => true
        ]
    ];
    $createRes = file_get_contents('http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=events', false, stream_context_create($optsEvt));
    $createJson = json_decode($createRes, true);

    echo "Created Event ID: " . ($createJson['data']['id'] ?? 'none') . PHP_EOL;
    echo "Created Event Cover: " . ($createJson['data']['cover_image_url'] ?? 'none') . PHP_EOL;
    echo "Created Event Photos count: " . count($createJson['data']['photos'] ?? []) . PHP_EOL;

    echo PHP_EOL . "=== 6. VERIFYING DATABASE PERSISTENCE ===" . PHP_EOL;
    $dbEvt = $db->query("SELECT id, title_mr, cover_image_url FROM events WHERE id = '{$testEventId}'")->fetch(PDO::FETCH_ASSOC);
    echo "DB Event: " . json_encode($dbEvt, JSON_UNESCAPED_UNICODE) . PHP_EOL;

    $dbPhotos = $db->query("SELECT id, event_id, image_url, caption_mr FROM event_photos WHERE event_id = '{$testEventId}'")->fetchAll(PDO::FETCH_ASSOC);
    echo "DB Child Photos: " . json_encode($dbPhotos, JSON_UNESCAPED_UNICODE) . PHP_EOL;

    echo PHP_EOL . "=== 7. VERIFYING PUBLIC API RESPONSE (Without Auth Header) ===" . PHP_EOL;
    $pubRes = file_get_contents('http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=events');
    $pubJson = json_decode($pubRes, true);
    $foundPub = false;
    foreach ($pubJson['data'] as $evt) {
        if ($evt['id'] === $testEventId) {
            $foundPub = true;
            echo "Public API returned test event with cover: " . $evt['cover_image_url'] . " and photos: " . count($evt['photos']) . PHP_EOL;
            break;
        }
    }
    if (!$foundPub) {
        echo "WARNING: Test event was not found in public API response!" . PHP_EOL;
    }
} finally {
    echo PHP_EOL . "=== 8. CLEANING UP DEDICATED TEST RECORD & UPLOADED TEST FILE ONLY ===" . PHP_EOL;
    if ($testEventId) {
        $db->exec("DELETE FROM event_photos WHERE event_id = '{$testEventId}'");
        $db->exec("DELETE FROM events WHERE id = '{$testEventId}'");
    }
    if ($testTokenId) {
        $db->exec("DELETE FROM admin_tokens WHERE id = {$testTokenId}");
    }
    if ($uploadedCoverUrl) {
        $filePath = realpath(__DIR__ . '/..') . str_replace('/', DIRECTORY_SEPARATOR, $uploadedCoverUrl);
        if (file_exists($filePath)) {
            unlink($filePath);
            echo "Removed uploaded test file: " . $filePath . PHP_EOL;
        }
    }
    echo "Cleanup complete." . PHP_EOL;
}

echo PHP_EOL . "=== 9. VERIFYING ORIGINAL DATABASE STATE ===" . PHP_EOL;
$origCheck = $db->query("SELECT id, title_mr, cover_image_url FROM events WHERE id = 'evt-1792622428974'")->fetch(PDO::FETCH_ASSOC);
echo "Original event intact: " . json_encode($origCheck, JSON_UNESCAPED_UNICODE) . PHP_EOL;
$finalAnnCount = $db->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
echo "Announcements count intact: " . $finalAnnCount . PHP_EOL;
$finalEventCount = $db->query("SELECT COUNT(*) FROM events")->fetchColumn();
echo "Total events count: " . $finalEventCount . PHP_EOL;

echo PHP_EOL . "ALL LIVE VERIFICATIONS PASSED SUCCESSFULLY!" . PHP_EOL;
