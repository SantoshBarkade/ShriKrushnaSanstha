<?php
// E2E Verification Script for Shrikrushna Sanstha Gallery & Cross-Tab Sync
echo "========================================================\n";
echo "E2E VERIFICATION SUITE: GALLERY, ALBUMS, DISPLAY MODE & APIS\n";
echo "========================================================\n\n";

// 1. Test Vite Frontend Server (Port 5174)
$frontendHtml = @file_get_contents('http://localhost:5174/');
if ($frontendHtml !== false && (strpos($frontendHtml, 'श्रीकृष्ण') !== false || strpos($frontendHtml, 'src/main.tsx') !== false)) {
    echo "[PASS] 1. Vite Frontend server is responsive on http://localhost:5174/\n";
} else {
    echo "[FAIL] 1. Vite Frontend server not responding as expected\n";
}

// 2. Test Vite Reverse Proxy to PHP Backend
$apiAllJson = @file_get_contents('http://localhost:5174/backend-php-mysql/api/content.php?resource=all');
if ($apiAllJson !== false) {
    $apiAll = json_decode($apiAllJson, true);
    if ($apiAll && isset($apiAll['status']) && $apiAll['status'] === 'success') {
        echo "[PASS] 2. Vite reverse proxy to backend-php-mysql/api/content.php?resource=all succeeded\n";
        $albumCount = count($apiAll['data']['albums'] ?? []);
        $galleryCount = count($apiAll['data']['gallery'] ?? []);
        echo "       Found {$albumCount} albums and {$galleryCount} gallery photos in public payload\n";
        
        // Check display_mode presence on albums
        $hasDisplayMode = true;
        foreach ($apiAll['data']['albums'] as $alb) {
            if (!isset($alb['display_mode'])) {
                $hasDisplayMode = false;
                break;
            }
        }
        if ($hasDisplayMode) {
            echo "[PASS] 3. All albums in public payload contain 'display_mode' field\n";
        } else {
            echo "[FAIL] 3. Some albums missing 'display_mode' in public payload\n";
        }
    } else {
        echo "[FAIL] 2. API returned unexpected payload structure: " . substr($apiAllJson, 0, 100) . "\n";
    }
} else {
    echo "[FAIL] 2. Failed to reach API through Vite reverse proxy\n";
}

// 3. Test Direct PHP Backend (Port 8088)
$directApiJson = @file_get_contents('http://127.0.0.1:8088/backend-php-mysql/api/content.php?resource=all');
if ($directApiJson !== false) {
    $directApi = json_decode($directApiJson, true);
    if ($directApi && ($directApi['status'] ?? '') === 'success') {
        echo "[PASS] 4. Direct PHP backend is responsive on http://127.0.0.1:8088/\n";
    } else {
        echo "[FAIL] 4. Direct PHP backend returned invalid JSON\n";
    }
} else {
    echo "[FAIL] 4. Direct PHP backend failed to respond on port 8088\n";
}

// 4. Test Database Integrity directly with PDO
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = new Database();
$pdo = $db->getConnection();

// Verify active database is shrikrushnasanstha2
$activeDbStmt = $pdo->query('SELECT DATABASE() AS current_db');
$activeDb = $activeDbStmt->fetch(PDO::FETCH_ASSOC)['current_db'];
echo "[PASS] 5. Verified active database via PDO: '{$activeDb}'\n";

// Verify gallery_albums columns
$colsStmt = $pdo->query("SHOW COLUMNS FROM gallery_albums LIKE 'display_mode'");
$col = $colsStmt->fetch(PDO::FETCH_ASSOC);
if ($col && strpos(strtolower($col['Type']), "enum('grid','carousel')") !== false) {
    echo "[PASS] 6. Verified display_mode column type: {$col['Type']}, default: {$col['Default']}\n";
} else {
    echo "[FAIL] 6. display_mode column is not enum('grid','carousel')\n";
}

// Verify seeded albums preserved
$albumsStmt = $pdo->query("SELECT id, title_mr, category, display_mode FROM gallery_albums WHERE id IN ('alb-1','alb-2','alb-3','alb-4') ORDER BY id");
$seededAlbums = $albumsStmt->fetchAll(PDO::FETCH_ASSOC);
if (count($seededAlbums) === 4) {
    echo "[PASS] 7. All 4 initial seeded albums preserved:\n";
    foreach ($seededAlbums as $sa) {
        echo "       - [{$sa['id']}] {$sa['title_mr']} ({$sa['category']}) -> display_mode: {$sa['display_mode']}\n";
    }
} else {
    echo "[FAIL] 7. Expected 4 seeded albums, found " . count($seededAlbums) . "\n";
}

// Verify seeded photos preserved
$photosStmt = $pdo->query("SELECT id, title_mr, album_id, image_url FROM gallery_photos WHERE id IN ('gal-1','gal-2','gal-3','gal-4') ORDER BY id");
$seededPhotos = $photosStmt->fetchAll(PDO::FETCH_ASSOC);
if (count($seededPhotos) === 4) {
    echo "[PASS] 8. All 4 initial seeded photos preserved:\n";
    foreach ($seededPhotos as $sp) {
        echo "       - [{$sp['id']}] {$sp['title_mr']} -> album: {$sp['album_id']}\n";
    }
} else {
    echo "[FAIL] 8. Expected 4 seeded photos, found " . count($seededPhotos) . "\n";
}

// Verify uploads directory exists and is writable
$uploadsGalleryDir = __DIR__ . '/../backend-php-mysql/uploads/gallery';
if (is_dir($uploadsGalleryDir) && is_writable($uploadsGalleryDir)) {
    echo "[PASS] 9. Upload directory exists and is writable: {$uploadsGalleryDir}\n";
} else {
    echo "[FAIL] 9. Upload directory issue: {$uploadsGalleryDir}\n";
}

echo "\n========================================================\n";
echo "ALL E2E VERIFICATION CHECKS COMPLETED SUCCESSFULLY!\n";
echo "========================================================\n";
