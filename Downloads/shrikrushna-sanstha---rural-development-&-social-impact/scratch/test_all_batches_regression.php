<?php
/**
 * Master Comprehensive Regression Test Suite for Batches 1, 2, and 3
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha
 */

require_once 'c:/Users/Santosh/Downloads/shrikrushna-sanstha---rural-development-&-social-impact/backend-php-mysql/config/database.php';

$database = new Database();
$pdo = $database->getConnection();
if (!$pdo) {
    echo "ERROR: Could not connect to MySQL database.\n";
    exit(1);
}

// Generate test token
$adminToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $adminToken);

$stmt = $pdo->prepare("SELECT id FROM admins LIMIT 1");
$stmt->execute();
$adminId = $stmt->fetchColumn() ?: 1;

$stmt = $pdo->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW())");
$stmt->execute([$adminId, $tokenHash]);

$baseUrl = 'http://127.0.0.1:8088/backend-php-mysql/api/content.php';

function apiReq($url, $method = 'GET', $token = null, $data = null) {
    $headers = [
        "Content-Type: application/json",
        "Accept: application/json"
    ];
    if ($token) {
        $headers[] = "Authorization: Bearer " . $token;
    }
    $options = [
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'ignore_errors' => true,
        ]
    ];
    if ($data !== null) {
        $options['http']['content'] = json_encode($data);
    }
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    $statusLine = $http_response_header[0] ?? '';
    preg_match('{HTTP\/\S*\s(\d{3})}', $statusLine, $m);
    $code = isset($m[1]) ? (int)$m[1] : 0;
    
    return ['code' => $code, 'body' => json_decode($response, true)];
}

echo "=== STARTING COMPREHENSIVE MULTI-BATCH REGRESSION AUDIT ===\n\n";

$passed = 0;
$failed = 0;

function check($desc, $cond, $details = '') {
    global $passed, $failed;
    if ($cond) {
        echo " [PASS] $desc\n";
        $passed++;
    } else {
        echo " [FAIL] $desc" . ($details ? " ($details)" : "") . "\n";
        $failed++;
    }
}

// --- BATCH 1 AUDIT ---
echo "--- BATCH 1: Videos, Announcements, Schemes ---\n";
$vidRes = apiReq("$baseUrl?resource=videos");
check("Public Videos endpoint returns HTTP 200", $vidRes['code'] === 200);
$vidCount = count($vidRes['body']['data'] ?? []);
check("Public Videos list returns expected published videos ($vidCount)", $vidCount >= 3);

$annRes = apiReq("$baseUrl?resource=announcements");
check("Public Announcements endpoint returns HTTP 200", $annRes['code'] === 200);

$schRes = apiReq("$baseUrl?resource=schemes");
check("Public Schemes endpoint returns HTTP 200", $schRes['code'] === 200);

// --- BATCH 2 AUDIT ---
echo "\n--- BATCH 2: Initiatives & Events ---\n";
$initRes = apiReq("$baseUrl?resource=initiatives");
check("Public Initiatives endpoint returns HTTP 200", $initRes['code'] === 200);
$initCount = count($initRes['body']['data'] ?? []);
check("Public Initiatives list returns expected published items ($initCount >= 4)", $initCount >= 4);

$eventsRes = apiReq("$baseUrl?resource=events");
check("Public Events endpoint returns HTTP 200", $eventsRes['code'] === 200);

// --- BATCH 3 AUDIT ---
echo "\n--- BATCH 3: Officials, Site Settings, Site Pages ---\n";
$offRes = apiReq("$baseUrl?resource=officials");
check("Public Officials endpoint returns HTTP 200", $offRes['code'] === 200);
$offCount = count($offRes['body']['data'] ?? []);
check("Public Officials list returns published officials ($offCount >= 4)", $offCount >= 4);

$setRes = apiReq("$baseUrl?resource=settings");
check("Public Settings endpoint returns HTTP 200", $setRes['code'] === 200);
$settingsList = $setRes['body']['data'] ?? [];
$setMap = [];
foreach ($settingsList as $s) {
    if (isset($s['key_name'])) $setMap[$s['key_name']] = $s;
}
check("Settings has hero_badge", isset($setMap['hero_badge']));
check("Settings has sanstha_tagline", isset($setMap['sanstha_tagline']));
check("Settings has hero_stats_beneficiaries", isset($setMap['hero_stats_beneficiaries']));
check("Settings has hero_stats_villages", isset($setMap['hero_stats_villages']));

$pageRes = apiReq("$baseUrl?resource=pages");
check("Public Pages endpoint returns HTTP 200", $pageRes['code'] === 200);
$pagesList = $pageRes['body']['data'] ?? [];
$pageSlugs = array_column($pagesList, 'slug');
check("Pages contains 'about'", in_array('about', $pageSlugs));
check("Pages contains 'privacy'", in_array('privacy', $pageSlugs));
check("Pages contains 'work'", in_array('work', $pageSlugs));

// Cleanup test token
$stmt = $pdo->prepare("DELETE FROM admin_tokens WHERE token_hash = ?");
$stmt->execute([$tokenHash]);

echo "\n=======================================================\n";
echo "REGRESSION AUDIT SUMMARY:\n";
echo "Passed: $passed\n";
echo "Failed: $failed\n";
echo "=======================================================\n";

if ($failed > 0) exit(1);
