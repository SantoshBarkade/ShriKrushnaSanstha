<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Dedicated Protected Image Upload Endpoint
 *
 * Security Enforcements:
 * - Requires active, unrevoked administrative Bearer token
 * - 5 MB file size limit
 * - Extension whitelist: jpg, jpeg, png, webp
 * - Binary magic bytes verification (signatures: JPEG, PNG, WebP)
 * - getimagesize verification for dimensions and true image type
 * - finfo MIME type verification without deprecated function calls
 * - Polyglot / executable script injection scanning
 * - Isolated non-executable storage: /backend-php-mysql/uploads/officials/
 * - Cryptographically random unique filenames (off_<hex>.<ext>)
 * - Persistent server-relative URL returned for database storage
 */

// Prevent PHP warnings, notices, or deprecations from corrupting JSON output
ini_set('display_errors', '0');
error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);

// Start output buffer to capture and cleanly discard any unintended output
ob_start();

/**
 * Cleanly sends a JSON response with proper headers and status code.
 */
function sendJsonResponse(int $statusCode, array $data): void {
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    while (ob_get_level()) { ob_end_clean(); }
    http_response_code(204);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(405, [
        'status' => 'error',
        'success' => false,
        'message' => 'केवळ POST विनंत्या समर्थित आहेत. (Only POST requests are supported.)'
    ]);
}

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/auth_helper.php';

try {
    $database = new Database();
    $db = $database->getConnection();
    // Enforce administrative authentication
    $admin = authenticateAdmin($db);
} catch (Exception $e) {
    sendJsonResponse(500, [
        'status' => 'error',
        'success' => false,
        'message' => 'डेटाबेस प्रमाणीकरण त्रुटी. (Database authentication error.)'
    ]);
}

// Resolve target folder and security prefix
$requestedFolder = trim((string)($_POST['folder'] ?? $_GET['folder'] ?? 'officials'));
$allowedFolders = [
    'officials'     => ['prefix' => 'off_', 'sub' => 'officials'],
    'gallery'       => ['prefix' => 'gal_', 'sub' => 'gallery'],
    'announcements' => ['prefix' => 'ann_', 'sub' => 'announcements'],
    'events'        => ['prefix' => 'evt_', 'sub' => 'events'],
    'initiatives'   => ['prefix' => 'ini_', 'sub' => 'initiatives'],
    'reports'       => ['prefix' => 'rep_', 'sub' => 'reports'],
];
if (!isset($allowedFolders[$requestedFolder])) {
    $requestedFolder = 'officials';
}
$folderConfig = $allowedFolders[$requestedFolder];
$targetSubdir = $folderConfig['sub'];
$filePrefix = $folderConfig['prefix'];

// Ensure target upload directory exists
$targetDir = realpath(__DIR__ . '/..') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . $targetSubdir;
if (!is_dir($targetDir)) {
    if (!@mkdir($targetDir, 0755, true)) {
        sendJsonResponse(500, [
            'status' => 'error',
            'success' => false,
            'message' => 'अपलोड डिरेक्टरी तयार करता आली नाही. (Failed to create upload destination.)'
        ]);
    }
}

/**
 * Validates and securely stores a single uploaded image file.
 * Returns array with success=true and metadata, or success=false and error message.
 */
function processSingleUpload(array $file, string $targetDir, string $filePrefix, string $targetSubdir): array {
    $origName = (string)($file['name'] ?? 'unknown');

    if (!isset($file['error'])) {
        return ['success' => false, 'error' => 'अवैध फाइल रचना.', 'original_name' => $origName];
    }

    switch ($file['error']) {
        case UPLOAD_ERR_OK:
            break;
        case UPLOAD_ERR_INI_SIZE:
        case UPLOAD_ERR_FORM_SIZE:
            return ['success' => false, 'error' => 'फाइल आकार सर्व्हर मर्यादेपेक्षा जास्त आहे.', 'original_name' => $origName];
        case UPLOAD_ERR_PARTIAL:
            return ['success' => false, 'error' => 'फाइल पूर्णपणे अपलोड झाली नाही.', 'original_name' => $origName];
        case UPLOAD_ERR_NO_FILE:
            return ['success' => false, 'error' => 'कोणतीही फाइल पाठवली नाही.', 'original_name' => $origName];
        default:
            return ['success' => false, 'error' => 'फाइल अपलोड त्रुटी (Code: ' . $file['error'] . ').', 'original_name' => $origName];
    }

    $tmpPath = $file['tmp_name'];
    if (!is_uploaded_file($tmpPath) || !file_exists($tmpPath)) {
        return ['success' => false, 'error' => 'अवैध अपलोड विनंती.', 'original_name' => $origName];
    }

    // 1. Whitelist extension from original filename
    $rawExt = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
    $isPdfTarget = ($targetSubdir === 'reports' || $filePrefix === 'rep_');
    $allowedExts = $isPdfTarget ? ['jpg', 'jpeg', 'png', 'webp', 'pdf'] : ['jpg', 'jpeg', 'png', 'webp'];
    if (!in_array($rawExt, $allowedExts, true)) {
        $allowedMsg = $isPdfTarget
            ? 'केवळ PDF, JPG, PNG किंवा WebP फॉरमॅट समर्थित आहेत. (Only PDF, JPG, PNG or WebP formats are supported.)'
            : 'केवळ JPG, PNG किंवा WebP फॉरमॅट समर्थित आहेत.';
        return ['success' => false, 'error' => $allowedMsg, 'original_name' => $origName];
    }

    $isPdf = ($rawExt === 'pdf');

    // Size limit: 15MB for PDF, 5MB for images
    $maxSizeBytes = $isPdf ? (15 * 1024 * 1024) : (5 * 1024 * 1024);
    if ($file['size'] > $maxSizeBytes || $file['size'] <= 0) {
        $limitMsg = $isPdf
            ? 'PDF फाइल आकार १५MB पेक्षा जास्त असू शकत नाही. (PDF size must not exceed 15MB.)'
            : 'फाइल आकार ५MB पेक्षा जास्त असू शकत नाही.';
        return ['success' => false, 'error' => $limitMsg, 'original_name' => $origName];
    }

    // 2. Binary magic bytes signature check
    $handle = @fopen($tmpPath, 'rb');
    if (!$handle) {
        return ['success' => false, 'error' => 'फाइल वाचता आली नाही.', 'original_name' => $origName];
    }
    $headerBytes = fread($handle, 16);
    $fileContentSample = $headerBytes . fread($handle, 4096);
    fclose($handle);

    // 3. Scan for malicious embedded scripts / PHP code inside file
    if (preg_match('/<\?(?:php|=)/i', $fileContentSample) ||
        preg_match('/<script\b/i', $fileContentSample) ||
        (!$isPdf && preg_match('/<svg\b/i', $fileContentSample))) {
        return ['success' => false, 'error' => 'अवैध किंवा असुरक्षित फाइल सामग्री आढळली.', 'original_name' => $origName];
    }

    // Handle PDF upload
    if ($isPdf) {
        // PDF verification: Signature must be %PDF-
        if (strncmp($headerBytes, "%PDF-", 5) !== 0) {
            return [
                'success' => false,
                'error' => 'अवैध PDF फाइल स्वाक्षरी. केवळ अस्सल PDF दस्तऐवज समर्थित आहेत. (Invalid PDF file signature.)',
                'original_name' => $origName
            ];
        }

        // MIME type check via finfo
        if (extension_loaded('fileinfo')) {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $detectedMime = $finfo->file($tmpPath);
            $allowedPdfMimes = ['application/pdf', 'application/x-pdf', 'application/acrobat'];
            if (!in_array($detectedMime, $allowedPdfMimes, true)) {
                return [
                    'success' => false,
                    'error' => 'अवैध PDF MIME प्रकार: ' . htmlspecialchars((string)$detectedMime),
                    'original_name' => $origName
                ];
            }
        }

        // Cryptographically safe unique filename
        $randomHex = bin2hex(random_bytes(10));
        $safeFilename = $filePrefix . $randomHex . '.pdf';
        $destinationPath = $targetDir . DIRECTORY_SEPARATOR . $safeFilename;

        if (!@move_uploaded_file($tmpPath, $destinationPath)) {
            return ['success' => false, 'error' => 'PDF फाइल साठवण्यात त्रुटी.', 'original_name' => $origName];
        }

        $serverRelativeUrl = '/backend-php-mysql/uploads/' . $targetSubdir . '/' . $safeFilename;

        return [
            'success'       => true,
            'url'           => $serverRelativeUrl,
            'filename'      => $safeFilename,
            'size'          => $file['size'],
            'width'         => null,
            'height'        => null,
            'mime'          => 'application/pdf',
            'original_name' => $origName
        ];
    }

    // Handle Image upload
    $isJpeg = (strncmp($headerBytes, "\xFF\xD8\xFF", 3) === 0);
    $isPng  = (strncmp($headerBytes, "\x89PNG\r\n\x1a\n", 8) === 0);
    $isWebp = (strlen($headerBytes) >= 12 &&
               strncmp($headerBytes, 'RIFF', 4) === 0 &&
               substr($headerBytes, 8, 4) === 'WEBP');

    if (!$isJpeg && !$isPng && !$isWebp) {
        return ['success' => false, 'error' => 'अवैध इमेज फाइल स्वाक्षरी. केवळ वास्तविक चित्रे समर्थित आहेत.', 'original_name' => $origName];
    }

    // 4. finfo MIME type check
    if (extension_loaded('fileinfo')) {
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $detectedMime = $finfo->file($tmpPath);
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!in_array($detectedMime, $allowedMimes, true)) {
            return ['success' => false, 'error' => 'अवैध इमेज MIME प्रकार: ' . htmlspecialchars((string)$detectedMime), 'original_name' => $origName];
        }
    }

    // 5. getimagesize check for dimensions and true image type
    $imageSize = @getimagesize($tmpPath);
    if (!$imageSize || empty($imageSize[0]) || empty($imageSize[1])) {
        return ['success' => false, 'error' => 'चित्र वाचता आले नाही किंवा फाइल भ्रष्ट आहे.', 'original_name' => $origName];
    }

    $imageType = $imageSize[2];
    $cleanExt = 'jpg';
    if ($imageType === IMAGETYPE_PNG && $isPng) {
        $cleanExt = 'png';
    } elseif ($imageType === IMAGETYPE_WEBP && $isWebp) {
        $cleanExt = 'webp';
    } elseif ($imageType === IMAGETYPE_JPEG && $isJpeg) {
        $cleanExt = 'jpg';
    } else {
        return ['success' => false, 'error' => 'इमेज प्रकार विसंगती आढळली.', 'original_name' => $origName];
    }

    // 6. Cryptographically safe unique filename
    $randomHex = bin2hex(random_bytes(10));
    $safeFilename = $filePrefix . $randomHex . '.' . $cleanExt;
    $destinationPath = $targetDir . DIRECTORY_SEPARATOR . $safeFilename;

    if (!@move_uploaded_file($tmpPath, $destinationPath)) {
        return ['success' => false, 'error' => 'इमेज फाइल साठवण्यात त्रुटी.', 'original_name' => $origName];
    }

    $serverRelativeUrl = '/backend-php-mysql/uploads/' . $targetSubdir . '/' . $safeFilename;

    return [
        'success'       => true,
        'url'           => $serverRelativeUrl,
        'filename'      => $safeFilename,
        'size'          => $file['size'],
        'width'         => $imageSize[0],
        'height'        => $imageSize[1],
        'original_name' => $origName
    ];
}

// Check for multi-file upload under 'images' or 'files'
$isMultiUpload = false;
$filesToProcess = [];

if (isset($_FILES['images']) && is_array($_FILES['images']['name'])) {
    $isMultiUpload = true;
    $names = $_FILES['images']['name'];
    $types = $_FILES['images']['type'] ?? [];
    $tmpNames = $_FILES['images']['tmp_name'] ?? [];
    $errors = $_FILES['images']['error'] ?? [];
    $sizes = $_FILES['images']['size'] ?? [];
    $count = count($names);
    for ($i = 0; $i < $count; $i++) {
        $filesToProcess[] = [
            'name'     => $names[$i],
            'type'     => $types[$i] ?? '',
            'tmp_name' => $tmpNames[$i] ?? '',
            'error'    => $errors[$i] ?? UPLOAD_ERR_NO_FILE,
            'size'     => $sizes[$i] ?? 0
        ];
    }
} elseif (isset($_FILES['files']) && is_array($_FILES['files']['name'])) {
    $isMultiUpload = true;
    $names = $_FILES['files']['name'];
    $types = $_FILES['files']['type'] ?? [];
    $tmpNames = $_FILES['files']['tmp_name'] ?? [];
    $errors = $_FILES['files']['error'] ?? [];
    $sizes = $_FILES['files']['size'] ?? [];
    $count = count($names);
    for ($i = 0; $i < $count; $i++) {
        $filesToProcess[] = [
            'name'     => $names[$i],
            'type'     => $types[$i] ?? '',
            'tmp_name' => $tmpNames[$i] ?? '',
            'error'    => $errors[$i] ?? UPLOAD_ERR_NO_FILE,
            'size'     => $sizes[$i] ?? 0
        ];
    }
} else {
    // Single file upload under 'image', 'file', or single 'images'
    $singleFile = $_FILES['image'] ?? ($_FILES['file'] ?? ($_FILES['images'] ?? null));
    if ($singleFile && isset($singleFile['error'])) {
        $filesToProcess[] = $singleFile;
    }
}

if (empty($filesToProcess)) {
    sendJsonResponse(400, [
        'status' => 'error',
        'success' => false,
        'message' => 'कृपया अपलोड करण्यासाठी फाइल निवडा. (Please choose a file to upload.)'
    ]);
}

$uploadedResults = [];
$failedResults = [];

foreach ($filesToProcess as $fileItem) {
    $res = processSingleUpload($fileItem, $targetDir, $filePrefix, $targetSubdir);
    if ($res['success']) {
        // Automatically register in media_files table
        try {
            $isPdf = str_ends_with(strtolower($res['filename']), '.pdf');
            $fileType = $isPdf ? 'document' : 'image';
            $mime = $res['mime'] ?? ($isPdf ? 'application/pdf' : 'image/jpeg');
            $insMedia = $db->prepare("
                INSERT INTO media_files 
                (file_name, original_name, file_path, file_type, mime_type, file_size_bytes, uploaded_by)
                VALUES (:fn, :orig, :fp, :ft, :mime, :size, :up)
            ");
            $insMedia->execute([
                ':fn'   => $res['filename'],
                ':orig' => $res['original_name'],
                ':fp'   => $res['url'],
                ':ft'   => $fileType,
                ':mime' => $mime,
                ':size' => $res['size'],
                ':up'   => $admin['id'] ?? null
            ]);
            $res['media_id'] = (int)$db->lastInsertId();
        } catch (PDOException $e) {
            error_log("Failed to register upload in media_files: " . $e->getMessage());
        }

        $uploadedResults[] = $res;
    } else {
        $failedResults[] = $res;
    }
}

if (empty($uploadedResults)) {
    // All files failed
    sendJsonResponse(400, [
        'status'  => 'error',
        'success' => false,
        'message' => 'सर्व फाइल्सचे अपलोड अयशस्वी झाले. (All file uploads failed.)',
        'errors'  => $failedResults
    ]);
}

// At least one file succeeded
$firstSuccess = $uploadedResults[0];
$isPartial = !empty($failedResults);
$isPdfSuccess = (isset($firstSuccess['mime']) && $firstSuccess['mime'] === 'application/pdf') ||
                str_ends_with(strtolower((string)($firstSuccess['url'] ?? '')), '.pdf');
$successMessage = $isPdfSuccess
    ? 'PDF दस्तऐवज यशस्वीरित्या अपलोड झाला. (PDF document uploaded successfully.)'
    : (count($uploadedResults) . ' फाइल यशस्वीरित्या अपलोड झाली. (' . count($uploadedResults) . ' file(s) uploaded successfully.)');

sendJsonResponse(201, [
    'status'   => 'success',
    'success'  => true,
    'message'  => $successMessage,
    'url'      => $firstSuccess['url'],
    'filename' => $firstSuccess['filename'],
    'media_id' => $firstSuccess['media_id'] ?? null,
    'size'     => $firstSuccess['size'],
    'width'    => $firstSuccess['width'],
    'height'   => $firstSuccess['height'],
    'files'    => $uploadedResults,
    'errors'   => $failedResults,
    'partial'  => $isPartial
]);
