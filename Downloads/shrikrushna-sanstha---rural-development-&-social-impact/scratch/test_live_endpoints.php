<?php
/**
 * Test live endpoints for page_sections and media_files using stream contexts.
 */

require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

// Create a valid temporary admin session token
$rawToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $rawToken);
$ins = $db->prepare("
    INSERT INTO admin_tokens (admin_id, token_hash, ip_address, user_agent, expires_at, revoked_at)
    VALUES (1, :th, '127.0.0.1', 'PHP-Test-Runner', DATE_ADD(NOW(), INTERVAL 1 HOUR), NULL)
");
$ins->execute([':th' => $tokenHash]);
$tokenId = (int)$db->lastInsertId();

function makeRequest(string $url, string $method = 'GET', ?array $data = null, ?string $token = null): array {
    $headers = [];
    if ($token) {
        $headers[] = "Authorization: Bearer {$token}";
    }
    if ($data !== null) {
        $headers[] = "Content-Type: application/json";
    }

    $opts = [
        'http' => [
            'method'  => $method,
            'header'  => implode("\r\n", $headers),
            'content' => $data !== null ? json_encode($data) : null,
            'ignore_errors' => true
        ]
    ];
    $context = stream_context_create($opts);
    $res = @file_get_contents($url, false, $context);
    $statusCode = 500;
    if (isset($http_response_header) && isset($http_response_header[0])) {
        if (preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) {
            $statusCode = (int)$m[1];
        }
    }
    return [
        'code' => $statusCode,
        'body' => json_decode($res, true) ?: $res
    ];
}

try {
    // 1. GET resource=all
    $r1 = makeRequest("http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=all");
    $secCount = count($r1['body']['data']['pageSections'] ?? []);
    echo "1. resource=all -> HTTP {$r1['code']}, pageSections: {$secCount}\n";

    // 2. GET resource=page_sections&page_slug=about
    $r2 = makeRequest("http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=page_sections&page_slug=about");
    $aboutCount = count($r2['body']['data'] ?? []);
    echo "2. resource=page_sections&page_slug=about -> HTTP {$r2['code']}, count: {$aboutCount}\n";

    // 3. GET resource=media_files (with Bearer token)
    $r3 = makeRequest("http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=media_files", 'GET', null, $rawToken);
    $mediaCount = count($r3['body']['data'] ?? []);
    $refCount = 0;
    if (is_array($r3['body']['data'] ?? null)) {
        foreach ($r3['body']['data'] as $m) {
            if (!empty($m['is_referenced'])) $refCount++;
        }
    }
    echo "3. resource=media_files -> HTTP {$r3['code']}, total media: {$mediaCount}, referenced: {$refCount}\n";

    // 4. Test POST page_sections
    $r4 = makeRequest("http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=page_sections", 'POST', [
        'page_slug'   => 'about',
        'section_key' => 'test_sec_temp',
        'title_mr'    => 'चाचणी विभाग',
        'title_en'    => 'Test Section',
        'content_mr'  => 'हा एक तात्पुरता चाचणी विभाग आहे.',
        'content_en'  => 'This is a temporary test section.',
        'display_order' => 99,
        'is_published'  => 1
    ], $rawToken);
    $testSecId = $r4['body']['data']['id'] ?? null;
    echo "4. POST resource=page_sections -> HTTP {$r4['code']}, created ID: {$testSecId}\n";

    // 5. Test PUT page_sections
    if ($testSecId) {
        $r5 = makeRequest("http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=page_sections&id={$testSecId}", 'PUT', [
            'title_mr'   => 'अद्ययावत चाचणी विभाग',
            'title_en'   => 'Updated Test Section'
        ], $rawToken);
        $newTitle = $r5['body']['data']['title_mr'] ?? '';
        echo "5. PUT resource=page_sections -> HTTP {$r5['code']}, new title: {$newTitle}\n";

        // 6. Test DELETE page_sections
        $r6 = makeRequest("http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=page_sections&id={$testSecId}", 'DELETE', null, $rawToken);
        echo "6. DELETE resource=page_sections -> HTTP {$r6['code']}, deleted ID: " . ($r6['body']['deleted_id'] ?? '') . "\n";
    }

    // 7. Test Media Delete Dependency Protection (attempting to delete referenced media #1)
    $r7 = makeRequest("http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=media_files&id=1", 'DELETE', null, $rawToken);
    echo "7. DELETE referenced media #1 -> HTTP {$r7['code']}, error_code: " . ($r7['body']['error_code'] ?? 'none') . "\n";

} finally {
    // Clean up temporary test token
    $db->prepare("DELETE FROM admin_tokens WHERE id = ?")->execute([$tokenId]);
}
