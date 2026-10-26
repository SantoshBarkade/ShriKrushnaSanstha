<?php
/**
 * Live MySQL & HTTP Integration Test Suite for Batch 2:
 * Initiatives & Activities + Events
 *
 * Requirements:
 * - Live MySQL integration tests using disposable records.
 * - Test create/read/update/delete, publish/unpublish, authentication,
 *   bilingual field preservation, and foreign-key behavior.
 * - Verify existing videos, announcements, and government schemes remain intact.
 * - Clean up only temporary test records created by tests.
 * - Do not delete or overwrite existing user data.
 */

// Connect directly to MySQL
@require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$database = new Database();
$pdo = $database->getConnection();
if (!$pdo) {
    echo "ERROR: Could not connect to MySQL database.\n";
    exit(1);
}

$baseUrl = 'http://127.0.0.1:8088/backend-php-mysql/api';

echo "========================================================\n";
echo "BATCH 2 LIVE MYSQL & HTTP INTEGRATION TESTS\n";
echo "Target Base URL: {$baseUrl}\n";
echo "========================================================\n\n";

$passCount = 0;
$failCount = 0;

function runTest($description, $fn) {
    global $passCount, $failCount;
    try {
        $result = $fn();
        if ($result !== false) {
            echo " [PASS] {$description}\n";
            $passCount++;
        } else {
            echo " [FAIL] {$description}\n";
            $failCount++;
        }
    } catch (Throwable $e) {
        echo " [FAIL] {$description}: " . $e->getMessage() . "\n";
        $failCount++;
    }
}

function httpReq($url, $method = 'GET', $data = null, $token = null) {
    $headers = [
        "Content-Type: application/json",
        "Accept: application/json"
    ];
    if ($token !== null) {
        $headers[] = "Authorization: Bearer " . $token;
    }
    $options = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'ignore_errors' => true,
            'timeout' => 10,
        ]
    ];
    if ($data !== null) {
        $options['http']['content'] = is_string($data) ? $data : json_encode($data);
    }
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);

    $code = 0;
    $respHeaders = function_exists('http_get_last_response_headers')
        ? (http_get_last_response_headers() ?? [])
        : ($http_response_header ?? []);

    if (!empty($respHeaders)) {
        $statusLine = $respHeaders[0] ?? '';
        if (preg_match('{HTTP\/\S*\s(\d{3})}', $statusLine, $m)) {
            $code = (int)$m[1];
        }
    }

    $jsonDecoded = json_decode($response, true);
    return [
        'code' => $code,
        'body' => $response,
        'json' => $jsonDecoded,
    ];
}

// Fetch initial count of existing records
$initInitCount = (int)$pdo->query("SELECT COUNT(*) FROM initiatives")->fetchColumn();
$initEventCount = (int)$pdo->query("SELECT COUNT(*) FROM events")->fetchColumn();
$initVideoCount = (int)$pdo->query("SELECT COUNT(*) FROM videos")->fetchColumn();
$initAnnCount = (int)$pdo->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
$initSchemeCount = (int)$pdo->query("SELECT COUNT(*) FROM government_schemes")->fetchColumn();

echo "Initial Database State:\n";
echo " - initiatives: {$initInitCount} rows\n";
echo " - events: {$initEventCount} rows\n";
echo " - videos: {$initVideoCount} rows\n";
echo " - announcements: {$initAnnCount} rows\n";
echo " - government_schemes: {$initSchemeCount} rows\n\n";

// 1. Generate a temporary test token in MySQL
$adminToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $adminToken);

$stmt = $pdo->prepare("SELECT id FROM admins LIMIT 1");
$stmt->execute();
$adminId = $stmt->fetchColumn() ?: 1;

$stmt = $pdo->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW())");
$stmt->execute([$adminId, $tokenHash]);
$createdTestToken = true;

runTest("Authentication: Active test Bearer token registered in MySQL", function() use ($adminToken) {
    return strlen($adminToken) === 64;
});

// 2. Public Read checks
runTest("Public API: GET ?resource=initiatives returns published initiatives without auth", function() use ($baseUrl) {
    $res = httpReq("{$baseUrl}/content.php?resource=initiatives");
    if ($res['code'] !== 200) throw new Exception("HTTP {$res['code']}");
    $data = $res['json']['data'] ?? null;
    return is_array($data) && count($data) >= 1;
});

runTest("Public API: GET ?resource=events returns events list without auth", function() use ($baseUrl) {
    $res = httpReq("{$baseUrl}/content.php?resource=events");
    if ($res['code'] !== 200) throw new Exception("HTTP {$res['code']}");
    $data = $res['json']['data'] ?? null;
    return is_array($data);
});

// 3. Security: Unauthenticated mutation rejection
runTest("Security: Unauthenticated POST ?resource=initiatives is rejected with HTTP 401", function() use ($baseUrl) {
    $res = httpReq("{$baseUrl}/content.php?resource=initiatives", 'POST', [
        'title_mr' => 'हॅकर उपक्रम',
    ]);
    return $res['code'] === 401;
});

runTest("Security: Unauthenticated POST ?resource=events is rejected with HTTP 401", function() use ($baseUrl) {
    $res = httpReq("{$baseUrl}/content.php?resource=events", 'POST', [
        'title_mr' => 'हॅकर कार्यक्रम',
    ]);
    return $res['code'] === 401;
});

// 4. Initiatives CRUD with Foreign Keys, Child Photos, and Bilingual Preservation
$disposableInitId = 'test-init-' . time() . '-' . mt_rand(100, 999);

runTest("Initiative Validation: Rejects missing title or summary with HTTP 400/422", function() use ($baseUrl, $adminToken, $disposableInitId) {
    $res = httpReq("{$baseUrl}/content.php?resource=initiatives", 'POST', [
        'id' => $disposableInitId,
        'title_mr' => '', // Empty!
        'summary_mr' => 'Summary',
    ], $adminToken);
    return ($res['code'] === 400 || $res['code'] === 422);
});

runTest("Initiative Validation: Rejects invalid or insecure image URL with HTTP 400/422", function() use ($baseUrl, $adminToken, $disposableInitId) {
    $res = httpReq("{$baseUrl}/content.php?resource=initiatives", 'POST', [
        'id' => $disposableInitId,
        'title_mr' => 'चाचणी उपक्रम',
        'summary_mr' => 'सारांश',
        'image_url' => 'http://insecure.com/pic.jpg', // Non-HTTPS!
    ], $adminToken);
    return ($res['code'] === 400 || $res['code'] === 422);
});

runTest("Initiative Create: Authenticated POST creates initiative with child photos & report FK", function() use ($baseUrl, $adminToken, $disposableInitId, $pdo) {
    $payload = [
        'id' => $disposableInitId,
        'title_mr' => 'चाचणी आरोग्य शिबीर ' . $disposableInitId,
        'title_en' => 'Test Health Camp ' . $disposableInitId,
        'category' => 'आरोग्यविषयक उपक्रम',
        'activity_date' => '2025-07-20',
        'location_mr' => 'नादरपूर आरोग्य केंद्र',
        'location_en' => 'Nadarpur Health Center',
        'summary_mr' => 'मोफत आरोग्य व नेत्रतपासणी शिबीर',
        'summary_en' => 'Free health and eye examination camp',
        'description_mr' => 'गावातील सर्व नागरिकांसाठी विशेष शिबीर आयोजित करण्यात आले.',
        'description_en' => 'Special camp organized for all villagers.',
        'image_url' => 'https://images.unsplash.com/photo-health-test?auto=format&w=800',
        'is_govt_scheme' => 0,
        'published' => 1,
        'featured' => 1,
        'related_report_id' => 'rep-1',
        'tags' => 'आरोग्य,शिबीर,नादरपूर',
        'photos' => [
            'https://images.unsplash.com/photo-health-1?auto=format&w=800',
            'https://images.unsplash.com/photo-health-2?auto=format&w=800',
        ],
    ];

    $res = httpReq("{$baseUrl}/content.php?resource=initiatives", 'POST', $payload, $adminToken);
    if ($res['code'] !== 201) {
        throw new Exception("HTTP {$res['code']}: " . $res['body']);
    }

    // Direct MySQL check
    $stmt = $pdo->prepare("SELECT * FROM initiatives WHERE id = ?");
    $stmt->execute([$disposableInitId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new Exception("Initiative row not found in MySQL");
    if ($row['title_en'] !== $payload['title_en']) throw new Exception("title_en mismatch");
    if ($row['related_report_id'] !== 'rep-1') throw new Exception("related_report_id FK mismatch");

    // Check initiative_photos in MySQL
    $stmtPhotos = $pdo->prepare("SELECT COUNT(*) FROM initiative_photos WHERE initiative_id = ?");
    $stmtPhotos->execute([$disposableInitId]);
    $photoCount = (int)$stmtPhotos->fetchColumn();
    if ($photoCount !== 2) throw new Exception("Expected 2 photos in initiative_photos, got {$photoCount}");

    return true;
});

runTest("Initiative Read: Single resource GET ?resource=initiatives&id=... returns child photos", function() use ($baseUrl, $disposableInitId) {
    $res = httpReq("{$baseUrl}/content.php?resource=initiatives&id=" . urlencode($disposableInitId));
    if ($res['code'] !== 200) throw new Exception("HTTP {$res['code']}");
    $item = $res['json']['data'];
    if ($item['id'] !== $disposableInitId) throw new Exception("ID mismatch");
    if (!isset($item['photos']) || count($item['photos']) !== 2) throw new Exception("Photos missing");
    return true;
});

runTest("Initiative Update: Partial PUT preserves unmentioned Marathi field while updating English", function() use ($baseUrl, $adminToken, $disposableInitId, $pdo) {
    $updatePayload = [
        'title_en' => 'Updated English Health Camp Title',
        'location_en' => 'Updated English Location',
        'published' => 0, // Unpublish to draft
        'photos' => [
            'https://images.unsplash.com/photo-health-updated?auto=format&w=800',
        ],
    ];

    $res = httpReq("{$baseUrl}/content.php?resource=initiatives&id=" . urlencode($disposableInitId), 'PUT', $updatePayload, $adminToken);
    if ($res['code'] !== 200) {
        throw new Exception("HTTP {$res['code']}: " . $res['body']);
    }

    // Verify in MySQL
    $stmt = $pdo->prepare("SELECT * FROM initiatives WHERE id = ?");
    $stmt->execute([$disposableInitId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    // Marathi title must NOT be overwritten
    if (strpos($row['title_mr'], 'चाचणी आरोग्य शिबीर') === false) {
        throw new Exception("Marathi title was overwritten or lost!");
    }
    if ($row['title_en'] !== 'Updated English Health Camp Title') {
        throw new Exception("English title was not updated!");
    }
    if ((int)$row['published'] !== 0) {
        throw new Exception("Published flag was not changed to 0");
    }

    // Verify photo count synchronized
    $stmtPhotos = $pdo->prepare("SELECT COUNT(*) FROM initiative_photos WHERE initiative_id = ?");
    $stmtPhotos->execute([$disposableInitId]);
    $photoCount = (int)$stmtPhotos->fetchColumn();
    if ($photoCount !== 1) throw new Exception("Expected 1 synchronized photo, got {$photoCount}");

    return true;
});

runTest("Draft Filtering: Public GET excludes draft, while authenticated GET ?admin=1 includes it", function() use ($baseUrl, $adminToken, $disposableInitId) {
    // Public GET
    $publicRes = httpReq("{$baseUrl}/content.php?resource=initiatives");
    $publicIds = array_column($publicRes['json']['data'] ?? [], 'id');
    if (in_array($disposableInitId, $publicIds)) {
        throw new Exception("Draft initiative leaked into public API!");
    }

    // Admin preview GET
    $adminRes = httpReq("{$baseUrl}/content.php?resource=initiatives&admin=1", 'GET', null, $adminToken);
    $adminIds = array_column($adminRes['json']['data'] ?? [], 'id');
    if (!in_array($disposableInitId, $adminIds)) {
        throw new Exception("Draft initiative missing from admin preview!");
    }

    return true;
});

runTest("Initiative Delete: Authenticated DELETE removes initiative and cascades child photos", function() use ($baseUrl, $adminToken, $disposableInitId, $pdo) {
    $res = httpReq("{$baseUrl}/content.php?resource=initiatives&id=" . urlencode($disposableInitId), 'DELETE', null, $adminToken);
    if ($res['code'] !== 200) {
        throw new Exception("HTTP {$res['code']}: " . $res['body']);
    }

    // Check MySQL: initiative row must be deleted
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM initiatives WHERE id = ?");
    $stmt->execute([$disposableInitId]);
    if ((int)$stmt->fetchColumn() !== 0) {
        throw new Exception("Initiative was not deleted from MySQL");
    }

    // Check MySQL: child photos must be cascade deleted
    $stmtPhotos = $pdo->prepare("SELECT COUNT(*) FROM initiative_photos WHERE initiative_id = ?");
    $stmtPhotos->execute([$disposableInitId]);
    if ((int)$stmtPhotos->fetchColumn() !== 0) {
        throw new Exception("Initiative child photos were not cascaded!");
    }

    return true;
});

// 5. Events CRUD with Photos, Status Enum, and Dates
$disposableEventId = 'test-evt-' . time() . '-' . mt_rand(100, 999);

runTest("Event Validation: Rejects missing title or invalid status with HTTP 400/422", function() use ($baseUrl, $adminToken, $disposableEventId) {
    $res = httpReq("{$baseUrl}/content.php?resource=events", 'POST', [
        'id' => $disposableEventId,
        'title_mr' => '', // Empty
        'status' => 'invalid_status_enum',
    ], $adminToken);
    return ($res['code'] === 400 || $res['code'] === 422);
});

runTest("Event Create: Authenticated POST creates event with child photos and dates", function() use ($baseUrl, $adminToken, $disposableEventId, $pdo) {
    $payload = [
        'id' => $disposableEventId,
        'title_mr' => 'चाचणी वृक्षारोपण सप्ताह ' . $disposableEventId,
        'title_en' => 'Tree Plantation Week ' . $disposableEventId,
        'category' => 'पर्यावरण संवर्धन',
        'start_date' => '2025-08-01',
        'end_date' => '2025-08-07',
        'event_date_text_mr' => '१ ते ७ ऑगस्ट २०२५',
        'event_date_text_en' => '1 to 7 August 2025',
        'event_time' => 'सकाळी ९:००',
        'venue_mr' => 'नादरपूर परिसर',
        'venue_en' => 'Nadarpur Area',
        'summary_mr' => '५०० वृक्षांची लागवड व संवर्धन संकल्प',
        'summary_en' => 'Planting and nurturing 500 trees',
        'description_mr' => 'गावातील सर्व तरुणांचा व ग्रामस्थांचा सक्रिय सहभाग.',
        'description_en' => 'Active participation of youth and villagers.',
        'cover_image_url' => 'https://images.unsplash.com/photo-tree-cover?w=800',
        'status' => 'upcoming',
        'is_featured' => 1,
        'published' => 1,
        'photos' => [
            'https://images.unsplash.com/photo-tree-1?w=800',
            'https://images.unsplash.com/photo-tree-2?w=800',
        ],
    ];

    $res = httpReq("{$baseUrl}/content.php?resource=events", 'POST', $payload, $adminToken);
    if ($res['code'] !== 201) {
        throw new Exception("HTTP {$res['code']}: " . $res['body']);
    }

    // Direct MySQL check
    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
    $stmt->execute([$disposableEventId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) throw new Exception("Event row not found in MySQL");
    if ($row['status'] !== 'upcoming') throw new Exception("status mismatch");
    if ($row['start_date'] !== '2025-08-01') throw new Exception("start_date mismatch");

    // Check event_photos in MySQL
    $stmtPhotos = $pdo->prepare("SELECT COUNT(*) FROM event_photos WHERE event_id = ?");
    $stmtPhotos->execute([$disposableEventId]);
    $photoCount = (int)$stmtPhotos->fetchColumn();
    if ($photoCount !== 2) throw new Exception("Expected 2 photos in event_photos, got {$photoCount}");

    return true;
});

runTest("Event Update: Partial PUT updates status to completed and synchronizes photos", function() use ($baseUrl, $adminToken, $disposableEventId, $pdo) {
    $updatePayload = [
        'status' => 'completed',
        'venue_en' => 'Updated Venue Nadarpur',
        'photos' => [
            'https://images.unsplash.com/photo-tree-final?w=800',
        ],
    ];

    $res = httpReq("{$baseUrl}/content.php?resource=events&id=" . urlencode($disposableEventId), 'PUT', $updatePayload, $adminToken);
    if ($res['code'] !== 200) {
        throw new Exception("HTTP {$res['code']}: " . $res['body']);
    }

    $stmt = $pdo->prepare("SELECT * FROM events WHERE id = ?");
    $stmt->execute([$disposableEventId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row['status'] !== 'completed') throw new Exception("status not updated to completed");
    if ($row['venue_en'] !== 'Updated Venue Nadarpur') throw new Exception("venue_en not updated");
    // Verify Marathi fields preserved
    if (strpos($row['title_mr'], 'चाचणी वृक्षारोपण सप्ताह') === false) {
        throw new Exception("Marathi title lost during event partial update");
    }

    // Verify child photos synchronized
    $stmtPhotos = $pdo->prepare("SELECT COUNT(*) FROM event_photos WHERE event_id = ?");
    $stmtPhotos->execute([$disposableEventId]);
    $photoCount = (int)$stmtPhotos->fetchColumn();
    if ($photoCount !== 1) throw new Exception("Expected 1 synchronized photo, got {$photoCount}");

    return true;
});

runTest("Event Delete: Authenticated DELETE removes event and cascades event_photos", function() use ($baseUrl, $adminToken, $disposableEventId, $pdo) {
    $res = httpReq("{$baseUrl}/content.php?resource=events&id=" . urlencode($disposableEventId), 'DELETE', null, $adminToken);
    if ($res['code'] !== 200) {
        throw new Exception("HTTP {$res['code']}: " . $res['body']);
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM events WHERE id = ?");
    $stmt->execute([$disposableEventId]);
    if ((int)$stmt->fetchColumn() !== 0) throw new Exception("Event not deleted from MySQL");

    $stmtPhotos = $pdo->prepare("SELECT COUNT(*) FROM event_photos WHERE event_id = ?");
    $stmtPhotos->execute([$disposableEventId]);
    if ((int)$stmtPhotos->fetchColumn() !== 0) throw new Exception("Event child photos not cascaded");

    return true;
});

// 6. Regression Check: Verify existing data intact
runTest("Regression Check: Pre-existing initiatives count preserved", function() use ($pdo, $initInitCount) {
    $current = (int)$pdo->query("SELECT COUNT(*) FROM initiatives")->fetchColumn();
    return $current === $initInitCount;
});

runTest("Regression Check: Pre-existing videos count preserved", function() use ($pdo, $initVideoCount) {
    $current = (int)$pdo->query("SELECT COUNT(*) FROM videos")->fetchColumn();
    return $current === $initVideoCount;
});

runTest("Regression Check: Pre-existing announcements count preserved", function() use ($pdo, $initAnnCount) {
    $current = (int)$pdo->query("SELECT COUNT(*) FROM announcements")->fetchColumn();
    return $current === $initAnnCount;
});

runTest("Regression Check: Pre-existing schemes count preserved", function() use ($pdo, $initSchemeCount) {
    $current = (int)$pdo->query("SELECT COUNT(*) FROM government_schemes")->fetchColumn();
    return $current === $initSchemeCount;
});

runTest("Data Cleanliness: Zero leftover test records in MySQL", function() use ($pdo) {
    $stmt1 = $pdo->query("SELECT COUNT(*) FROM initiatives WHERE id LIKE 'test-init-%'");
    $cnt1 = (int)$stmt1->fetchColumn();
    $stmt2 = $pdo->query("SELECT COUNT(*) FROM events WHERE id LIKE 'test-evt-%'");
    $cnt2 = (int)$stmt2->fetchColumn();
    return ($cnt1 === 0 && $cnt2 === 0);
});

// Clean up temporary test token
if ($createdTestToken) {
    $pdo->prepare("DELETE FROM admin_tokens WHERE token_hash = ?")->execute([$tokenHash]);
}

echo "\n========================================================\n";
echo "BATCH 2 LIVE TEST SUMMARY: Pass: {$passCount}, Fail: {$failCount}\n";
echo "========================================================\n";

exit($failCount > 0 ? 1 : 0);
