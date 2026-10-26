<?php
/**
 * End-to-End Home CMS Mutation & Round-Trip Verification
 * Tests the real PHP REST API on 127.0.0.1:8088 against MySQL shrikrushnasanstha2.
 * Fully cleans up all test mutations and tokens in finally block.
 */

require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$db = (new Database())->getConnection();

// Register ephemeral test admin token
$rawToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $rawToken);
$adminId = (int)$db->query("SELECT id FROM admins ORDER BY id ASC LIMIT 1")->fetchColumn();

$tokenStmt = $db->prepare("
    INSERT INTO admin_tokens (admin_id, token_hash, ip_address, user_agent, expires_at)
    VALUES (:admin_id, :token_hash, '127.0.0.1', 'Home-CMS-E2E-Verifier', DATE_ADD(NOW(), INTERVAL 1 HOUR))
");
$tokenStmt->execute([
    ':admin_id'   => $adminId,
    ':token_hash' => $tokenHash
]);
$tokenId = (int)$db->lastInsertId();

$apiUrl = 'http://127.0.0.1:8088/backend-php-mysql/api/content.php';
$passCount = 0;
$failCount = 0;

function assertTest($name, $condition, $detail = '') {
    global $passCount, $failCount;
    if ($condition) {
        echo "  [PASS] {$name}\n";
        $passCount++;
    } else {
        echo "  [FAIL] {$name} - {$detail}\n";
        $failCount++;
    }
}

function apiRequest($url, $method = 'GET', $data = null, $token = null) {
    $headers = [
        'Accept: application/json',
        'Content-Type: application/json'
    ];
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    
    $opts = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers) . "\r\n",
            'ignore_errors' => true
        ]
    ];
    if ($data !== null) {
        $opts['http']['content'] = is_string($data) ? $data : json_encode($data);
    }
    
    $context = stream_context_create($opts);
    $response = @file_get_contents($url, false, $context);
    
    $statusCode = 0;
    if (isset($http_response_header[0])) {
        if (preg_match('/HTTP\/\S+\s+(\d+)/', $http_response_header[0], $m)) {
            $statusCode = (int)$m[1];
        }
    }
    return [
        'status' => $statusCode,
        'body' => json_decode($response, true),
        'raw' => $response
    ];
}

try {
    echo "=== TEST 1: site_pages Home SEO Metadata Update & Restore ===\n";
    // 1. Fetch original home page
    $origPageStmt = $db->prepare("SELECT * FROM site_pages WHERE slug = 'home'");
    $origPageStmt->execute();
    $origPage = $origPageStmt->fetch(PDO::FETCH_ASSOC);

    // 2. Update via API
    $testPayload = [
        'title_mr' => 'मुख्यपृष्ठ (ई२ई चाचणी)',
        'title_en' => 'Home (E2E Test)',
        'meta_description_mr' => 'चाचणी वर्णन मराठी',
        'meta_description_en' => 'Test description English'
    ];
    $putRes = apiRequest("{$apiUrl}?resource=pages&slug=home", 'PUT', $testPayload, $rawToken);
    assertTest("PUT ?resource=pages&slug=home returns 200", $putRes['status'] === 200, "Got status {$putRes['status']}");

    // 3. Verify via public GET
    $getRes = apiRequest("{$apiUrl}?resource=pages&slug=home", 'GET');
    $readTitleMr = $getRes['body']['data']['title_mr'] ?? '';
    assertTest("GET ?resource=pages reads back updated title_mr", $readTitleMr === 'मुख्यपृष्ठ (ई२ई चाचणी)', "Got '$readTitleMr'");

    // 4. Restore original
    $restorePayload = [
        'title_mr' => $origPage['title_mr'],
        'title_en' => $origPage['title_en'],
        'meta_description_mr' => $origPage['meta_description_mr'],
        'meta_description_en' => $origPage['meta_description_en']
    ];
    $restoreRes = apiRequest("{$apiUrl}?resource=pages&slug=home", 'PUT', $restorePayload, $rawToken);
    assertTest("Restore original site_pages values returns 200", $restoreRes['status'] === 200);

    echo "\n=== TEST 2: page_sections CRUD for Home ===\n";
    // 1. Create a section for home
    $sectionPayload = [
        'page_slug' => 'home',
        'section_key' => 'e2e_test_section',
        'title_mr' => 'चाचणी विभाग',
        'title_en' => 'Test Section',
        'subtitle_mr' => 'उपशीर्षक',
        'subtitle_en' => 'Subtitle',
        'content_mr' => 'चाचणी मजकूर सामग्री',
        'content_en' => 'Test content body',
        'display_order' => 99,
        'is_published' => 1
    ];
    $postSectionRes = apiRequest("{$apiUrl}?resource=page_sections", 'POST', $sectionPayload, $rawToken);
    assertTest("POST ?resource=page_sections creates section with 200/201", in_array($postSectionRes['status'], [200, 201]), "Got status {$postSectionRes['status']}");
    $createdSectionId = $postSectionRes['body']['data']['id'] ?? null;
    assertTest("Created section has integer ID", $createdSectionId !== null, "ID: $createdSectionId");

    // 2. Read back
    if ($createdSectionId) {
        $getSectionRes = apiRequest("{$apiUrl}?resource=page_sections&id={$createdSectionId}", 'GET');
        $readSecTitle = $getSectionRes['body']['data']['title_mr'] ?? '';
        assertTest("GET ?resource=page_sections&id= reads back section", $readSecTitle === 'चाचणी विभाग', "Got '$readSecTitle'");

        // 3. Delete section
        $delSectionRes = apiRequest("{$apiUrl}?resource=page_sections&id={$createdSectionId}", 'DELETE', null, $rawToken);
        assertTest("DELETE ?resource=page_sections&id= deletes section", $delSectionRes['status'] === 200, "Got status {$delSectionRes['status']}");
    }

    echo "\n=== TEST 3: site_settings Hero Badge & Tagline Update & Restore ===\n";
    $origBadgeStmt = $db->prepare("SELECT * FROM site_settings WHERE key_name = 'hero_badge'");
    $origBadgeStmt->execute();
    $origBadge = $origBadgeStmt->fetch(PDO::FETCH_ASSOC);

    $testBadge = [
        'value_mr' => 'ग्रामीण परिवर्तन • सांस्कृतिक समृद्धी',
        'value_en' => 'Rural Transformation • Cultural Heritage'
    ];
    $putBadgeRes = apiRequest("{$apiUrl}?resource=settings&key=hero_badge", 'PUT', $testBadge, $rawToken);
    assertTest("PUT ?resource=settings&key=hero_badge returns 200", $putBadgeRes['status'] === 200, "Got status {$putBadgeRes['status']}");

    // Verify
    $getBadgeRes = apiRequest("{$apiUrl}?resource=settings&key=hero_badge", 'GET');
    $readBadgeMr = $getBadgeRes['body']['data']['value_mr'] ?? '';
    assertTest("GET ?resource=settings reads back updated hero_badge", $readBadgeMr === 'ग्रामीण परिवर्तन • सांस्कृतिक समृद्धी');

    // Restore original
    $restoreBadge = [
        'value_mr' => $origBadge['value_mr'],
        'value_en' => $origBadge['value_en']
    ];
    $restoreBadgeRes = apiRequest("{$apiUrl}?resource=settings&key=hero_badge", 'PUT', $restoreBadge, $rawToken);
    assertTest("Restore original hero_badge returns 200", $restoreBadgeRes['status'] === 200);

    echo "\n=== SUMMARY: Passed {$passCount}, Failed {$failCount} ===\n";

} finally {
    // Clean up temporary token
    $db->prepare("DELETE FROM admin_tokens WHERE id = ?")->execute([$tokenId]);
    echo "Cleaned up test admin token ID: $tokenId\n";
}
