<?php
/**
 * Live Integration Test for Batch 3: Officials / Team and Site Pages / Settings
 * Verifies live MySQL persistence via PHP REST API on http://127.0.0.1:8088
 */

require_once 'c:/Users/Santosh/Downloads/shrikrushna-sanstha---rural-development-&-social-impact/backend-php-mysql/config/database.php';

$database = new Database();
$pdo = $database->getConnection();
if (!$pdo) {
    echo "ERROR: Could not connect to MySQL database.\n";
    exit(1);
}

// 1. Generate a temporary test token and insert its SHA-256 hash
$adminToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $adminToken);

$stmt = $pdo->prepare("SELECT id FROM admins LIMIT 1");
$stmt->execute();
$adminId = $stmt->fetchColumn() ?: 1;

$stmt = $pdo->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW())");
$stmt->execute([$adminId, $tokenHash]);
$createdTestToken = true;

$baseUrl = 'http://127.0.0.1:8088/backend-php-mysql/api/content.php';

function apiRequest($url, $method = 'GET', $token = null, $data = null) {
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

echo "=== STARTING BATCH 3 LIVE MYSQL INTEGRATION TESTS ===\n\n";

$passed = 0;
$failed = 0;

function assertTest($description, $condition, $details = '') {
    global $passed, $failed;
    if ($condition) {
        echo " [PASS] $description\n";
        $passed++;
    } else {
        echo " [FAIL] $description" . ($details ? " ($details)" : "") . "\n";
        $failed++;
    }
}

// ============================================================================
// TEST GROUP 1: OFFICIALS AUTHENTICATION & CRUD
// ============================================================================
echo "\n--- 1. OFFICIALS CRUD & AUTHENTICATION ---\n";

// 1.1 Unauthenticated POST rejection
$testOfficialId = 'off-live-test-' . time();
$unauthCreate = apiRequest("$baseUrl?resource=officials", 'POST', null, [
    'id' => $testOfficialId,
    'name_mr' => 'चाचणी अधिकारी',
    'role_mr' => 'सदस्य'
]);
assertTest("Unauthenticated official creation rejected with 401", $unauthCreate['code'] === 401);

// 1.2 Invalid Image URL rejection
$invalidImgCreate = apiRequest("$baseUrl?resource=officials", 'POST', $adminToken, [
    'id' => $testOfficialId,
    'name_mr' => 'चाचणी अधिकारी',
    'role_mr' => 'सदस्य',
    'image_url' => 'javascript:alert(1)'
]);
assertTest("Invalid image URL rejected with 400", $invalidImgCreate['code'] === 400);

// 1.3 Authenticated Create with draft status (published = 0)
$createPayload = [
    'id' => $testOfficialId,
    'name_mr' => 'श्री. सुनील पाटील',
    'name_en' => 'Shri. Sunil Patil',
    'role_mr' => 'मार्गदर्शक सदस्य',
    'role_en' => 'Advisory Member',
    'bio_mr' => 'सामाजिक कार्यातील २० वर्षांचा अनुभव.',
    'bio_en' => '20 years of experience in rural development.',
    'phone' => '+91 9822113355',
    'image_url' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    'display_order' => 15,
    'published' => 0
];

$createRes = apiRequest("$baseUrl?resource=officials", 'POST', $adminToken, $createPayload);
assertTest("Authenticated official created with 201", $createRes['code'] === 201);
assertTest("Created official returned correct name_mr", ($createRes['body']['data']['name_mr'] ?? '') === 'श्री. सुनील पाटील');
assertTest("Created official returned correct name_en", ($createRes['body']['data']['name_en'] ?? '') === 'Shri. Sunil Patil');
assertTest("Created official returned display_order 15", (int)($createRes['body']['data']['display_order'] ?? 0) === 15);
assertTest("Created official returned published = 0", (int)($createRes['body']['data']['published'] ?? 1) === 0);

// 1.4 Public GET must NOT return draft official
$publicGet = apiRequest("$baseUrl?resource=officials", 'GET', null);
$foundInPublic = false;
if (isset($publicGet['body']['data'])) {
    foreach ($publicGet['body']['data'] as $off) {
        if ($off['id'] === $testOfficialId) {
            $foundInPublic = true;
            break;
        }
    }
}
assertTest("Draft official is NOT visible in public GET endpoint", !$foundInPublic);

// 1.5 Admin GET must return draft official
$adminGet = apiRequest("$baseUrl?resource=all&admin=1", 'GET', $adminToken);
$foundInAdmin = false;
$adminOfficials = $adminGet['body']['data']['officials'] ?? ($adminGet['body']['officials'] ?? []);
foreach ($adminOfficials as $off) {
    if ($off['id'] === $testOfficialId) {
        $foundInAdmin = true;
        break;
    }
}
assertTest("Draft official IS visible in admin preview GET endpoint", $foundInAdmin);

// 1.6 Partial Update via PUT (preserve unmentioned bilingual fields)
$updatePayload = [
    'role_mr' => 'वरिष्ठ मार्गदर्शक सदस्य',
    'published' => 1
];
$updateRes = apiRequest("$baseUrl?resource=officials&id=$testOfficialId", 'PUT', $adminToken, $updatePayload);
assertTest("Official update returned 200", $updateRes['code'] === 200);
assertTest("Official updated role_mr", ($updateRes['body']['data']['role_mr'] ?? '') === 'वरिष्ठ मार्गदर्शक सदस्य');
assertTest("Official preserved role_en independently", ($updateRes['body']['data']['role_en'] ?? '') === 'Advisory Member');
assertTest("Official preserved name_en independently", ($updateRes['body']['data']['name_en'] ?? '') === 'Shri. Sunil Patil');
assertTest("Official preserved phone", ($updateRes['body']['data']['phone'] ?? '') === '+91 9822113355');
assertTest("Official preserved display_order", (int)($updateRes['body']['data']['display_order'] ?? 0) === 15);
assertTest("Official updated published to 1", (int)($updateRes['body']['data']['published'] ?? 0) === 1);

// 1.7 Public GET now returns the published official
$publicGet2 = apiRequest("$baseUrl?resource=officials", 'GET', null);
$foundInPublic2 = false;
if (isset($publicGet2['body']['data'])) {
    foreach ($publicGet2['body']['data'] as $off) {
        if ($off['id'] === $testOfficialId) {
            $foundInPublic2 = true;
            break;
        }
    }
}
assertTest("Published official is now visible in public GET endpoint", $foundInPublic2);

// 1.8 Delete Official
$deleteRes = apiRequest("$baseUrl?resource=officials&id=$testOfficialId", 'DELETE', $adminToken);
assertTest("Official deletion returned 200", $deleteRes['code'] === 200);

// Verify deleted from MySQL
$stmt = $pdo->prepare("SELECT COUNT(*) FROM officials WHERE id = ?");
$stmt->execute([$testOfficialId]);
$count = $stmt->fetchColumn();
assertTest("Official completely removed from MySQL", $count == 0);


// ============================================================================
// TEST GROUP 2: SITE SETTINGS CRUD
// ============================================================================
echo "\n--- 2. SITE SETTINGS CRUD ---\n";

// 2.1 Public GET settings
$settingsGet = apiRequest("$baseUrl?resource=settings", 'GET', null);
assertTest("Public GET /settings returned 200", $settingsGet['code'] === 200);
$settingsList = $settingsGet['body']['data'] ?? [];
$settingsByKey = [];
foreach ($settingsList as $s) {
    if (isset($s['key_name'])) {
        $settingsByKey[$s['key_name']] = $s;
    }
}
$hasHeroBadge = isset($settingsByKey['hero_badge']);
$hasTagline = isset($settingsByKey['sanstha_tagline']);
assertTest("Settings contains hero_badge key", $hasHeroBadge);
assertTest("Settings contains sanstha_tagline key", $hasTagline);

// 2.2 Unauthenticated PUT settings rejection
$unauthSetting = apiRequest("$baseUrl?resource=settings&key=hero_badge", 'PUT', null, [
    'value_mr' => 'हॅक केले'
]);
assertTest("Unauthenticated setting update rejected with 401", $unauthSetting['code'] === 401);

// 2.3 Authenticated PUT update hero_badge
$origHeroBadgeMr = $settingsByKey['hero_badge']['value_mr'] ?? 'ग्रामीण परिवर्तन आणि लोककल्याण';
$origHeroBadgeEn = $settingsByKey['hero_badge']['value_en'] ?? 'Rural Transformation & Public Welfare';

$updateSettingRes = apiRequest("$baseUrl?resource=settings&key=hero_badge", 'PUT', $adminToken, [
    'value_mr' => 'अद्ययावत ग्रामीण विकास उपक्रम',
    'value_en' => 'Updated Rural Development Initiative'
]);
assertTest("Setting update returned 200", $updateSettingRes['code'] === 200);
assertTest("Setting updated value_mr", ($updateSettingRes['body']['data']['value_mr'] ?? '') === 'अद्ययावत ग्रामीण विकास उपक्रम');
assertTest("Setting updated value_en", ($updateSettingRes['body']['data']['value_en'] ?? '') === 'Updated Rural Development Initiative');

// Verify in public GET by key
$settingsGet2 = apiRequest("$baseUrl?resource=settings&key=hero_badge", 'GET', null);
assertTest("Public GET confirms updated setting", ($settingsGet2['body']['data']['value_mr'] ?? '') === 'अद्ययावत ग्रामीण विकास उपक्रम');

// Revert to original seeded values
$revertSetting = apiRequest("$baseUrl?resource=settings&key=hero_badge", 'PUT', $adminToken, [
    'value_mr' => $origHeroBadgeMr,
    'value_en' => $origHeroBadgeEn
]);
assertTest("Reverted hero_badge setting to original", $revertSetting['code'] === 200);


// ============================================================================
// TEST GROUP 3: SITE PAGES CRUD
// ============================================================================
echo "\n--- 3. SITE PAGES CRUD ---\n";

// 3.1 Public GET pages
$pagesGet = apiRequest("$baseUrl?resource=pages", 'GET', null);
assertTest("Public GET /pages returned 200", $pagesGet['code'] === 200);
$pagesData = $pagesGet['body']['data'] ?? [];
$hasAboutPage = false;
foreach ($pagesData as $p) {
    if (($p['slug'] ?? '') === 'about') {
        $hasAboutPage = true;
        break;
    }
}
assertTest("Site pages contains seeded 'about' page", $hasAboutPage);

// 3.2 Unauthenticated PUT pages rejection
$unauthPage = apiRequest("$baseUrl?resource=pages&slug=about", 'PUT', null, [
    'title_mr' => 'हॅक'
]);
assertTest("Unauthenticated page update rejected with 401", $unauthPage['code'] === 401);

// 3.3 Authenticated PUT update 'about' metadata
$updatePageRes = apiRequest("$baseUrl?resource=pages&slug=about", 'PUT', $adminToken, [
    'meta_description_mr' => 'श्रीकृष्ण संस्थेची अधिकृत माहिती व उद्दिष्टे.',
    'meta_description_en' => 'Official details and objectives of Shrikrushna Sanstha.'
]);
assertTest("Page update returned 200", $updatePageRes['code'] === 200);
assertTest("Page updated meta_description_mr", ($updatePageRes['body']['data']['meta_description_mr'] ?? '') === 'श्रीकृष्ण संस्थेची अधिकृत माहिती व उद्दिष्टे.');


// ============================================================================
// TEST GROUP 4: REGRESSION AUDIT (ZERO DATA LOSS)
// ============================================================================
echo "\n--- 4. REGRESSION AUDIT (ZERO DATA LOSS) ---\n";

// 4.1 Officials count must be >= 4
$stmt = $pdo->query("SELECT COUNT(*) FROM officials");
$offCount = (int)$stmt->fetchColumn();
assertTest("Seeded officials intact (count: $offCount >= 4)", $offCount >= 4);

// 4.2 Videos count must be >= 4
$stmt = $pdo->query("SELECT COUNT(*) FROM videos");
$vidCount = (int)$stmt->fetchColumn();
assertTest("Batch 1 videos intact (count: $vidCount >= 4)", $vidCount >= 4);

// 4.3 Announcements count must be >= 2
$stmt = $pdo->query("SELECT COUNT(*) FROM announcements");
$annCount = (int)$stmt->fetchColumn();
assertTest("Batch 1 announcements intact (count: $annCount >= 2)", $annCount >= 2);

// 4.4 Government Schemes count must be >= 3
$stmt = $pdo->query("SELECT COUNT(*) FROM government_schemes");
$schCount = (int)$stmt->fetchColumn();
assertTest("Batch 1 schemes intact (count: $schCount >= 3)", $schCount >= 3);

// 4.5 Initiatives count must be >= 4
$stmt = $pdo->query("SELECT COUNT(*) FROM initiatives");
$initCount = (int)$stmt->fetchColumn();
assertTest("Batch 2 initiatives intact (count: $initCount >= 4)", $initCount >= 4);

// Cleanup test admin token
$stmt = $pdo->prepare("DELETE FROM admin_tokens WHERE token_hash = ?");
$stmt->execute([$tokenHash]);

echo "\n=======================================================\n";
echo "BATCH 3 LIVE INTEGRATION TEST SUMMARY:\n";
echo "Passed: $passed\n";
echo "Failed: $failed\n";
echo "=======================================================\n";

if ($failed > 0) {
    exit(1);
}
