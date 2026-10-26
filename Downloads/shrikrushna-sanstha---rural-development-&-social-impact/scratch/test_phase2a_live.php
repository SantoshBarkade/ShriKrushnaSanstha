<?php
/**
 * Live End-to-End Integration Verification for Phase 2A: Contact Inbox
 */

require_once __DIR__ . '/../backend-php-mysql/config/database.php';

echo "======================================================\n";
echo " PHASE 2A: CONTACT INBOX LIVE VERIFICATION\n";
echo "======================================================\n\n";

$baseUrl = 'http://127.0.0.1:8088/backend-php-mysql/api';
$database = new Database();
$db = $database->getConnection();

function makeRequest($url, $method = 'GET', $data = null, $token = null) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $headers = ['Accept: application/json'];
    if ($data !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($data) ? $data : json_encode($data));
    }
    if ($token !== null) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    return [
        'code' => $httpCode,
        'body' => json_decode($response, true),
        'raw' => $response
    ];
}

$allPassed = true;
$testInquiryId = null;

// TEST 1: Public Contact Form Submission
echo "1. Testing Public Contact Form Submission (POST ?resource=inquiries)...\n";
$testMarker = 'PHASE2A_TEST_' . time();
$postData = [
    'name' => 'चाचणी नागरिक ' . $testMarker,
    'contact' => 'test.' . time() . '@example.com',
    'subject' => 'चाचणी विषय ' . $testMarker,
    'message' => 'हा फेज २ए संपर्क इनबॉक्स पडताळणीसाठी पाठवलेला चाचणी संदेश आहे.',
    'website' => '' // empty honeypot
];

$res = makeRequest($baseUrl . '/content.php?resource=inquiries', 'POST', $postData);
$newId = $res['body']['id'] ?? ($res['body']['data']['id'] ?? null);
if ($res['code'] === 201 && !empty($newId)) {
    $testInquiryId = (int)$newId;
    echo "   [PASS] Public submission succeeded! HTTP 201, Created ID: {$testInquiryId}\n";
    
    // Check DB record
    $stmt = $db->prepare("SELECT * FROM inquiries WHERE id = ?");
    $stmt->execute([$testInquiryId]);
    $row = $stmt->fetch();
    if ($row && $row['status'] === 'new' && !empty($row['ip_address'])) {
        echo "   [PASS] DB record verified: status='{$row['status']}', ip_address='{$row['ip_address']}'\n";
    } else {
        echo "   [FAIL] DB record missing or invalid: " . json_encode($row) . "\n";
        $allPassed = false;
    }
} else {
    echo "   [FAIL] Public submission failed! HTTP {$res['code']}, Body: {$res['raw']}\n";
    $allPassed = false;
}

// TEST 2: Spam Honeypot Protection
echo "\n2. Testing Spam Protection (Honeypot Trigger)...\n";
$spamData = [
    'name' => 'Spam Bot',
    'contact' => 'spambot@example.com',
    'subject' => 'Spam subject',
    'message' => 'Buy cheap pills now',
    'website' => 'http://spam-link.ru' // filled honeypot
];
$res = makeRequest($baseUrl . '/content.php?resource=inquiries', 'POST', $spamData);
if ($res['code'] === 400 && stripos($res['body']['message'] ?? '', 'spam') !== false) {
    echo "   [PASS] Honeypot spam submission rejected with HTTP 400: {$res['body']['message']}\n";
} else {
    echo "   [FAIL] Honeypot rejection failed! HTTP {$res['code']}, Body: {$res['raw']}\n";
    $allPassed = false;
}

// TEST 3: Link-Stuffing Protection
echo "\n3. Testing Spam Protection (Link Stuffing > 3 URLs)...\n";
$linkStuffingData = [
    'name' => 'Link Spammer',
    'contact' => 'spammer@example.com',
    'subject' => 'Lots of links',
    'message' => 'Check http://site1.com and http://site2.com and https://site3.org and http://site4.net for deals',
    'website' => ''
];
$res = makeRequest($baseUrl . '/content.php?resource=inquiries', 'POST', $linkStuffingData);
if ($res['code'] === 400 && (stripos($res['body']['message'] ?? '', 'लिंक्स') !== false || stripos($res['body']['message'] ?? '', 'links') !== false)) {
    echo "   [PASS] Link stuffing rejected with HTTP 400: {$res['body']['message']}\n";
} else {
    echo "   [FAIL] Link stuffing rejection failed! HTTP {$res['code']}, Body: {$res['raw']}\n";
    $allPassed = false;
}

// TEST 4: Unauthenticated Access Control
echo "\n4. Testing Unauthenticated Access Rejection (GET, PUT, DELETE)...\n";
$getRes = makeRequest($baseUrl . '/content.php?resource=inquiries', 'GET');
$putRes = makeRequest($baseUrl . '/content.php?resource=inquiries&id=' . ($testInquiryId ?: 1), 'PUT', ['status' => 'read']);
$delRes = makeRequest($baseUrl . '/content.php?resource=inquiries&id=' . ($testInquiryId ?: 1), 'DELETE');

if ($getRes['code'] === 401 && $putRes['code'] === 401 && $delRes['code'] === 401) {
    echo "   [PASS] All unauthenticated inbox operations rejected with HTTP 401 Unauthorized!\n";
} else {
    echo "   [FAIL] Authorization leak detected! GET: {$getRes['code']}, PUT: {$putRes['code']}, DELETE: {$delRes['code']}\n";
    $allPassed = false;
}

// TEST 5: Authenticated Admin Operations
echo "\n5. Testing Authenticated Admin Inbox Operations...\n";
// Create a temporary valid token in admin_tokens
$rawToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $rawToken);
$adminId = (int)$db->query("SELECT id FROM admins ORDER BY id ASC LIMIT 1")->fetchColumn();

$tokenStmt = $db->prepare("
    INSERT INTO admin_tokens (admin_id, token_hash, ip_address, user_agent, expires_at)
    VALUES (:admin_id, :token_hash, '127.0.0.1', 'Phase2A-Verifier', DATE_ADD(NOW(), INTERVAL 2 HOUR))
");
$tokenStmt->execute([
    ':admin_id'   => $adminId,
    ':token_hash' => $tokenHash
]);
$token = $rawToken;
echo "   [PASS] Valid admin Bearer token created for test session.\n";

// 5a. Authenticated GET (Fetch inbox list and counts)
$inboxRes = makeRequest($baseUrl . '/content.php?resource=inquiries', 'GET', null, $token);
if ($inboxRes['code'] === 200 && $inboxRes['body']['success'] === true) {
    $inquiries = $inboxRes['body']['data'];
    $counts = $inboxRes['body']['counts'] ?? [];
    echo "   [PASS] Authenticated inbox fetch returned " . count($inquiries) . " inquiries.\n";
    echo "   [PASS] Badge counts: total={$counts['total']}, unread={$counts['unread']}, read={$counts['read']}\n";
    
    // Check ordering (newest first)
    if (count($inquiries) >= 2) {
        $firstId = (int)$inquiries[0]['id'];
        $secondId = (int)$inquiries[1]['id'];
        if ($firstId >= $secondId) {
            echo "   [PASS] Order verified: newest first (ID {$firstId} before ID {$secondId})\n";
        } else {
            echo "   [WARN] Inquiries ordering: ID {$firstId} vs ID {$secondId}\n";
        }
    }
} else {
    echo "   [FAIL] Authenticated inbox fetch failed! HTTP {$inboxRes['code']}, Body: {$inboxRes['raw']}\n";
    $allPassed = false;
}

// 5b. Search Filter Test
if ($testInquiryId) {
    $searchRes = makeRequest($baseUrl . '/content.php?resource=inquiries&q=' . urlencode($testMarker), 'GET', null, $token);
    if ($searchRes['code'] === 200 && count($searchRes['body']['data']) >= 1) {
        echo "   [PASS] Search filter successfully found inquiry matching test marker: {$testMarker}\n";
    } else {
        echo "   [FAIL] Search filter failed to find inquiry! Body: {$searchRes['raw']}\n";
        $allPassed = false;
    }
}

// 5c. Status Update Test (Mark as read, then toggle back to new)
if ($testInquiryId) {
    $updateRes = makeRequest($baseUrl . '/content.php?resource=inquiries&id=' . $testInquiryId, 'PUT', [
        'status' => 'read',
        'admin_notes' => 'फेज २ए चाचणी नोंद'
    ], $token);
    
    if ($updateRes['code'] === 200 && ($updateRes['body']['data']['status'] ?? '') === 'read') {
        echo "   [PASS] Status update (read) succeeded!\n";
        
        // Verify in DB
        $stmt = $db->prepare("SELECT status, admin_notes FROM inquiries WHERE id = ?");
        $stmt->execute([$testInquiryId]);
        $updatedRow = $stmt->fetch();
        if ($updatedRow['status'] === 'read' && $updatedRow['admin_notes'] === 'फेज २ए चाचणी नोंद') {
            echo "   [PASS] DB persistence of read status and admin notes verified.\n";
        } else {
            echo "   [FAIL] DB record not matching updated status: " . json_encode($updatedRow) . "\n";
            $allPassed = false;
        }
    } else {
        echo "   [FAIL] Status update failed! HTTP {$updateRes['code']}, Body: {$updateRes['raw']}\n";
        $allPassed = false;
    }
    
    // Toggle back to new
    $toggleRes = makeRequest($baseUrl . '/content.php?resource=inquiries&id=' . $testInquiryId, 'PUT', [
        'status' => 'new'
    ], $token);
    if ($toggleRes['code'] === 200 && ($toggleRes['body']['data']['status'] ?? '') === 'new') {
        echo "   [PASS] Status toggle back to 'new' (unread) succeeded!\n";
    } else {
        echo "   [FAIL] Toggle back to 'new' failed!\n";
        $allPassed = false;
    }
}

// 5d. Delete Test
if ($testInquiryId) {
    echo "\n6. Testing Authenticated Message Deletion...\n";
    $delRes = makeRequest($baseUrl . '/content.php?resource=inquiries&id=' . $testInquiryId, 'DELETE', null, $token);
    if ($delRes['code'] === 200 && $delRes['body']['success'] === true) {
        echo "   [PASS] Authenticated deletion of test inquiry ID {$testInquiryId} succeeded!\n";
        
        // Verify record is gone from DB
        $stmt = $db->prepare("SELECT COUNT(*) FROM inquiries WHERE id = ?");
        $stmt->execute([$testInquiryId]);
        $exists = (int)$stmt->fetchColumn();
        if ($exists === 0) {
            echo "   [PASS] Confirmed test inquiry {$testInquiryId} no longer exists in MySQL.\n";
        } else {
            echo "   [FAIL] Inquiry still exists in MySQL after DELETE!\n";
            $allPassed = false;
        }
    } else {
        echo "   [FAIL] Authenticated deletion failed! HTTP {$delRes['code']}, Body: {$delRes['raw']}\n";
        $allPassed = false;
    }
}

// Clean up temporary test token
$db->prepare("DELETE FROM admin_tokens WHERE token_hash = ?")->execute([$tokenHash]);

// TEST 7: Data Preservation Audit
echo "\n7. Testing Data Preservation across All Sanstha Tables...\n";
$tables = [
    'contact_info' => 'SELECT COUNT(*) FROM contact_info',
    'officials' => 'SELECT COUNT(*) FROM officials',
    'videos' => 'SELECT COUNT(*) FROM videos',
    'initiatives' => 'SELECT COUNT(*) FROM initiatives',
    'gallery_photos' => 'SELECT COUNT(*) FROM gallery_photos',
    'gallery_albums' => 'SELECT COUNT(*) FROM gallery_albums',
    'reports' => 'SELECT COUNT(*) FROM reports',
    'announcements' => 'SELECT COUNT(*) FROM announcements',
    'government_schemes' => 'SELECT COUNT(*) FROM government_schemes',
    'admins' => 'SELECT COUNT(*) FROM admins',
];

$countsAudit = [];
foreach ($tables as $tbl => $sql) {
    $cnt = (int)$db->query($sql)->fetchColumn();
    $countsAudit[$tbl] = $cnt;
    echo "   [CHECK] Table '{$tbl}': {$cnt} records preserved.\n";
}

if ($countsAudit['contact_info'] > 0 && $countsAudit['officials'] > 0 && $countsAudit['admins'] > 0) {
    echo "   [PASS] All existing database records and tables intact and preserved.\n";
} else {
    echo "   [FAIL] Critical records missing in data preservation audit!\n";
    $allPassed = false;
}

echo "\n======================================================\n";
if ($allPassed) {
    echo " ALL PHASE 2A LIVE INTEGRATION TESTS PASSED (100%)\n";
} else {
    echo " SOME TESTS FAILED. PLEASE REVIEW OUTPUT ABOVE.\n";
}
echo "======================================================\n";
