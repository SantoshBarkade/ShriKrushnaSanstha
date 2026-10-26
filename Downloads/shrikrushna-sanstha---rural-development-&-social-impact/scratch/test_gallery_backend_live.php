<?php
/**
 * Comprehensive Backend Integration Test for Gallery & Albums
 * Tests:
 * 1. GET ?resource=all (contains albums with display_mode and gallery)
 * 2. GET ?resource=albums & GET ?resource=gallery (& with album_id filter)
 * 3. Upload single & multi-photo with folder=gallery
 * 4. Upload security (unauthenticated 401, bad extensions)
 * 5. Authenticated Album CRUD (POST, PUT, DELETE) with display_mode 'grid'/'carousel'
 * 6. Authenticated Photo CRUD (POST single & batch, PUT, DELETE)
 * 7. Verification of seeded data preservation
 */

require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

$activeDb = $db->query("SELECT DATABASE()")->fetchColumn();
echo "Active DB: $activeDb\n";
if ($activeDb !== 'shrikrushnasanstha2') {
    die("FATAL: Wrong DB $activeDb\n");
}

// Count initial seeded data
$initialAlbumCount = (int)$db->query("SELECT COUNT(*) FROM gallery_albums")->fetchColumn();
$initialPhotoCount = (int)$db->query("SELECT COUNT(*) FROM gallery_photos")->fetchColumn();
echo "Initial seeded counts: Albums=$initialAlbumCount, Photos=$initialPhotoCount\n";

// Generate temporary admin token for tests
$adminToken = bin2hex(random_bytes(32));
$tokenHash = hash('sha256', $adminToken);
$adminId = $db->query("SELECT id FROM admins LIMIT 1")->fetchColumn() ?: 1;

$tokenStmt = $db->prepare("INSERT INTO admin_tokens (admin_id, token_hash, expires_at, created_at) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 2 HOUR), NOW())");
$tokenStmt->execute([$adminId, $tokenHash]);
$createdTokenId = $db->lastInsertId();

$baseUrl = 'http://127.0.0.1:8088/backend-php-mysql/api';

function httpRequest($url, $method = 'GET', $token = null, $data = null, $isJson = true) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

    $headers = [];
    if ($isJson) {
        $headers[] = 'Content-Type: application/json; charset=UTF-8';
        $headers[] = 'Accept: application/json';
    }
    if ($token) {
        $headers[] = 'Authorization: Bearer ' . $token;
    }
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

    if ($data !== null) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, $isJson ? json_encode($data) : $data);
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    return [
        'code' => $httpCode,
        'body' => $response,
        'json' => json_decode($response, true),
        'error' => $error
    ];
}

$uploadedFilesToClean = [];

try {
    echo "\n--- TEST 1: GET ?resource=all ---\n";
    $res = httpRequest("$baseUrl/content.php?resource=all");
    if ($res['code'] !== 200 || !isset($res['json']['data']['albums']) || !isset($res['json']['data']['gallery'])) {
        throw new Exception("GET ?resource=all failed: HTTP {$res['code']}, body: {$res['body']}");
    }
    $albums = $res['json']['data']['albums'];
    $gallery = $res['json']['data']['gallery'];
    echo "PASS: resource=all returned " . count($albums) . " albums and " . count($gallery) . " photos.\n";
    $firstAlbum = $albums[0];
    if (!isset($firstAlbum['display_mode'])) {
        throw new Exception("First album missing display_mode field!");
    }
    echo "PASS: First album has display_mode='{$firstAlbum['display_mode']}'.\n";

    echo "\n--- TEST 2: GET ?resource=albums and ?resource=gallery ---\n";
    $resAlbums = httpRequest("$baseUrl/content.php?resource=albums");
    if ($resAlbums['code'] !== 200 || count($resAlbums['json']['data']) < 4) {
        throw new Exception("GET ?resource=albums failed: " . $resAlbums['body']);
    }
    echo "PASS: GET ?resource=albums returned " . count($resAlbums['json']['data']) . " albums.\n";

    $resGallery = httpRequest("$baseUrl/content.php?resource=gallery&album_id=alb-1");
    if ($resGallery['code'] !== 200) {
        throw new Exception("GET ?resource=gallery&album_id=alb-1 failed: " . $resGallery['body']);
    }
    echo "PASS: GET ?resource=gallery with album_id filter returned " . count($resGallery['json']['data']) . " photos.\n";

    echo "\n--- TEST 3: Upload Single Image (folder=gallery) ---\n";
    // Create a 1x1 valid PNG image in scratch
    $pngData = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
    $tempImgFile = __DIR__ . '/test_dot.png';
    file_put_contents($tempImgFile, $pngData);

    $ch = curl_init("$baseUrl/upload.php");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $adminToken"]);
    $postFields = [
        'folder' => 'gallery',
        'image' => new CURLFile($tempImgFile, 'image/png', 'test_dot.png')
    ];
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    $uploadBody = curl_exec($ch);
    $uploadCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $uploadJson = json_decode($uploadBody, true);
    if ($uploadCode !== 201 || empty($uploadJson['url']) || !str_contains($uploadJson['url'], '/uploads/gallery/gal_')) {
        throw new Exception("Upload single image failed: HTTP $uploadCode, body: $uploadBody");
    }
    $uploadedUrl1 = $uploadJson['url'];
    $uploadedFilesToClean[] = __DIR__ . '/../' . ltrim($uploadedUrl1, '/');
    echo "PASS: Upload single image succeeded (HTTP 201): $uploadedUrl1\n";

    echo "\n--- TEST 4: Upload Multiple Images (folder=gallery, images[]) ---\n";
    $ch = curl_init("$baseUrl/upload.php");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $adminToken"]);
    $multiFields = [
        'folder' => 'gallery',
        'images[0]' => new CURLFile($tempImgFile, 'image/png', 'multi_1.png'),
        'images[1]' => new CURLFile($tempImgFile, 'image/png', 'multi_2.png')
    ];
    curl_setopt($ch, CURLOPT_POSTFIELDS, $multiFields);
    $multiBody = curl_exec($ch);
    $multiCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $multiJson = json_decode($multiBody, true);
    if ($multiCode !== 201 || empty($multiJson['files']) || count($multiJson['files']) !== 2) {
        throw new Exception("Multi upload failed: HTTP $multiCode, body: $multiBody");
    }
    foreach ($multiJson['files'] as $f) {
        $uploadedFilesToClean[] = __DIR__ . '/../' . ltrim($f['url'], '/');
    }
    echo "PASS: Multi upload succeeded (HTTP 201) with " . count($multiJson['files']) . " files.\n";

    echo "\n--- TEST 5: Upload Security Enforcements ---\n";
    // Unauthenticated request must return 401
    $ch = curl_init("$baseUrl/upload.php");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['image' => new CURLFile($tempImgFile, 'image/png', 'unauth.png')]);
    $unauthBody = curl_exec($ch);
    $unauthCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($unauthCode !== 401) {
        throw new Exception("Expected 401 for unauthenticated upload, got HTTP $unauthCode");
    }
    echo "PASS: Unauthenticated upload rejected with HTTP 401.\n";

    // Invalid extension / content rejection
    $fakeFile = __DIR__ . '/fake.txt';
    file_put_contents($fakeFile, "Hello World this is not an image");
    $ch = curl_init("$baseUrl/upload.php");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $adminToken"]);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['folder' => 'gallery', 'image' => new CURLFile($fakeFile, 'text/plain', 'fake.txt')]);
    $fakeBody = curl_exec($ch);
    $fakeCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    @unlink($fakeFile);
    if ($fakeCode !== 400) {
        throw new Exception("Expected 400 for fake.txt upload, got HTTP $fakeCode: $fakeBody");
    }
    echo "PASS: Invalid text file rejected with HTTP 400.\n";

    echo "\n--- TEST 6: Album CRUD with display_mode ---\n";
    // 6a. CREATE Album
    $testAlbumData = [
        'title_mr' => 'चाचणी अल्बम २०२६',
        'title_en' => 'Test Album 2026',
        'description_mr' => 'चाचणी अल्बम वर्णन',
        'description_en' => 'Test album description',
        'category' => 'शिक्षण',
        'cover_image_url' => $uploadedUrl1,
        'event_date' => '2026-05-10',
        'display_mode' => 'carousel',
        'display_order' => 99,
        'published' => 1
    ];
    $albumCreateRes = httpRequest("$baseUrl/content.php?resource=albums", 'POST', $adminToken, $testAlbumData);
    if ($albumCreateRes['code'] !== 201 || empty($albumCreateRes['json']['data']['id'])) {
        throw new Exception("Album creation failed: HTTP {$albumCreateRes['code']}, body: {$albumCreateRes['body']}");
    }
    $testAlbumId = $albumCreateRes['json']['data']['id'];
    echo "PASS: Album created with ID: $testAlbumId, display_mode='{$albumCreateRes['json']['data']['display_mode']}'.\n";

    // 6b. UPDATE Album (switch display_mode to grid)
    $albumUpdateData = [
        'id' => $testAlbumId,
        'title_mr' => 'चाचणी अल्बम अद्ययावत',
        'display_mode' => 'grid'
    ];
    $albumUpdateRes = httpRequest("$baseUrl/content.php?resource=albums&id=$testAlbumId", 'PUT', $adminToken, $albumUpdateData);
    if ($albumUpdateRes['code'] !== 200 || $albumUpdateRes['json']['data']['display_mode'] !== 'grid') {
        throw new Exception("Album update failed: HTTP {$albumUpdateRes['code']}, body: {$albumUpdateRes['body']}");
    }
    echo "PASS: Album updated successfully, display_mode switched to 'grid'.\n";

    echo "\n--- TEST 7: Photo CRUD (Single & Batch) ---\n";
    // 7a. Single Photo Create
    $singlePhotoData = [
        'album_id' => $testAlbumId,
        'title_mr' => 'चाचणी छायाचित्र १',
        'title_en' => 'Test Photo 1',
        'caption_mr' => 'कॅप्शन १',
        'image_url' => $uploadedUrl1,
        'year' => 2026,
        'featured_on_home' => 1,
        'display_order' => 1,
        'published' => 1
    ];
    $photoCreateRes = httpRequest("$baseUrl/content.php?resource=gallery", 'POST', $adminToken, $singlePhotoData);
    if ($photoCreateRes['code'] !== 201 || empty($photoCreateRes['json']['data']['id'])) {
        throw new Exception("Photo creation failed: HTTP {$photoCreateRes['code']}, body: {$photoCreateRes['body']}");
    }
    $testPhotoId1 = $photoCreateRes['json']['data']['id'];
    echo "PASS: Single photo created with ID: $testPhotoId1\n";

    // 7b. Batch Photo Create
    $batchPhotoData = [
        'photos' => [
            [
                'album_id' => $testAlbumId,
                'title_mr' => 'बॅच छायाचित्र २',
                'image_url' => $multiJson['files'][0]['url'],
                'display_order' => 2
            ],
            [
                'album_id' => $testAlbumId,
                'title_mr' => 'बॅच छायाचित्र ३',
                'image_url' => $multiJson['files'][1]['url'],
                'display_order' => 3
            ]
        ]
    ];
    $batchPhotoRes = httpRequest("$baseUrl/content.php?resource=gallery", 'POST', $adminToken, $batchPhotoData);
    if ($batchPhotoRes['code'] !== 201 || !is_array($batchPhotoRes['json']['data']) || count($batchPhotoRes['json']['data']) !== 2) {
        throw new Exception("Batch photo creation failed: HTTP {$batchPhotoRes['code']}, body: {$batchPhotoRes['body']}");
    }
    $testPhotoId2 = $batchPhotoRes['json']['data'][0]['id'];
    $testPhotoId3 = $batchPhotoRes['json']['data'][1]['id'];
    echo "PASS: Batch of 2 photos created with IDs: $testPhotoId2, $testPhotoId3\n";

    // 7c. Update Photo
    $photoUpdateData = [
        'id' => $testPhotoId1,
        'title_mr' => 'छायाचित्र १ अद्ययावत',
        'caption_mr' => 'नवीन कॅप्शन',
        'display_order' => 10
    ];
    $photoUpdateRes = httpRequest("$baseUrl/content.php?resource=gallery&id=$testPhotoId1", 'PUT', $adminToken, $photoUpdateData);
    if ($photoUpdateRes['code'] !== 200 || $photoUpdateRes['json']['data']['display_order'] != 10) {
        throw new Exception("Photo update failed: HTTP {$photoUpdateRes['code']}, body: {$photoUpdateRes['body']}");
    }
    echo "PASS: Photo updated successfully.\n";

    // 7d. Base64 rejection on photo create/update
    $b64PhotoData = [
        'title_mr' => 'हॅकर फोटो',
        'image_url' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    ];
    $b64Res = httpRequest("$baseUrl/content.php?resource=gallery", 'POST', $adminToken, $b64PhotoData);
    if ($b64Res['code'] !== 400) {
        throw new Exception("Base64 photo should be rejected with 400, got HTTP {$b64Res['code']}");
    }
    echo "PASS: Base64 image URL rejected with HTTP 400.\n";

    echo "\n--- TEST 8: DELETE operations ---\n";
    // Delete test photos
    foreach ([$testPhotoId1, $testPhotoId2, $testPhotoId3] as $pId) {
        $delPhotoRes = httpRequest("$baseUrl/content.php?resource=gallery&id=$pId", 'DELETE', $adminToken);
        if ($delPhotoRes['code'] !== 200) {
            throw new Exception("Failed to delete test photo $pId: HTTP {$delPhotoRes['code']}");
        }
    }
    echo "PASS: Test photos deleted successfully.\n";

    // Delete test album
    $delAlbumRes = httpRequest("$baseUrl/content.php?resource=albums&id=$testAlbumId", 'DELETE', $adminToken);
    if ($delAlbumRes['code'] !== 200) {
        throw new Exception("Failed to delete test album $testAlbumId: HTTP {$delAlbumRes['code']}");
    }
    echo "PASS: Test album deleted successfully.\n";

    echo "\n--- TEST 9: Verification of Seeded Data Preservation ---\n";
    $finalAlbumCount = (int)$db->query("SELECT COUNT(*) FROM gallery_albums")->fetchColumn();
    $finalPhotoCount = (int)$db->query("SELECT COUNT(*) FROM gallery_photos")->fetchColumn();
    echo "Final counts: Albums=$finalAlbumCount (was $initialAlbumCount), Photos=$finalPhotoCount (was $initialPhotoCount)\n";

    if ($finalAlbumCount !== $initialAlbumCount || $finalPhotoCount !== $initialPhotoCount) {
        throw new Exception("Count mismatch! Seeded data was disturbed.");
    }
    echo "PASS: All seeded albums and photos perfectly preserved!\n";

} finally {
    // Cleanup temporary admin token
    $db->exec("DELETE FROM admin_tokens WHERE id = $createdTokenId");
    // Cleanup temporary test files
    @unlink(__DIR__ . '/test_dot.png');
    foreach ($uploadedFilesToClean as $f) {
        if (file_exists($f)) {
            @unlink($f);
        }
    }
}

echo "\nALL_BACKEND_TESTS_PASSED: SUCCESS\n";
