<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Official Hardened PHP + MySQL Unified Content REST API
 *
 * Public Read Endpoints (GET):
 * - GET /api/content.php?resource=all            : All public website content in unified response
 * - GET /api/content.php?resource=initiatives    : Published organisation initiatives and activities
 * - GET /api/content.php?resource=officials      : Published leadership and executive board members
 * - GET /api/content.php?resource=gallery        : Published field documentary photos
 * - GET /api/content.php?resource=videos         : Published documentary video links and durations
 * - GET /api/content.php?resource=reports        : Published annual and academic reports
 * - GET /api/content.php?resource=announcements  : Published notices, events, and press announcements
 * - GET /api/content.php?resource=schemes        : Published statutory government welfare schemes
 * - GET /api/content.php?resource=contact        : Institutional headquarters contact information
 * - GET /api/content.php?resource=settings       : Public site settings, badges, and metrics
 *
 * Public Write Endpoints (POST):
 * - POST /api/content.php?resource=inquiries     : Public contact inquiry submission
 *
 * Protected Endpoints (Requires valid Authorization: Bearer <token>):
 * - Administrative mutations (POST, PUT, DELETE) scheduled for Phase 2.2B
 */

header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/auth_helper.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$resource = $_GET['resource'] ?? 'all';

/**
 * Server-side validation for video URLs (Dual Source: YouTube & Direct MP4/WebM/MOV/M4V).
 * Requires HTTPS. Validates YouTube IDs and supported direct video file extensions.
 */
function validateVideoUrlServer(string $url): array {
    $trimmed = trim($url);
    if (empty($trimmed)) {
        return ['isValid' => false, 'error' => 'व्हिडिओ लिंक आवश्यक आहे. (Video URL is required.)'];
    }

    $parsed = parse_url($trimmed);
    if (!$parsed || empty($parsed['scheme']) || empty($parsed['host'])) {
        return ['isValid' => false, 'error' => 'अवैध व्हिडिओ लिंक स्वरूप. (Invalid URL format.)'];
    }

    $scheme = strtolower($parsed['scheme']);
    if ($scheme !== 'https') {
        return ['isValid' => false, 'error' => 'सुरक्षित HTTPS व्हिडिओ लिंक आवश्यक आहे. (HTTPS URL is required.)'];
    }

    $host = strtolower($parsed['host']);
    $validYoutubeHosts = [
        'youtube.com',
        'www.youtube.com',
        'm.youtube.com',
        'youtu.be',
        'www.youtube-nocookie.com',
    ];

    if (in_array($host, $validYoutubeHosts, true)) {
        $videoId = null;
        if ($host === 'youtu.be') {
            $path = trim($parsed['path'] ?? '', '/');
            $segments = explode('/', $path);
            if (!empty($segments[0])) {
                $videoId = $segments[0];
            }
        } else {
            $path = $parsed['path'] ?? '';
            if (str_starts_with($path, '/embed/')) {
                $videoId = substr($path, 7);
            } elseif (str_starts_with($path, '/shorts/')) {
                $videoId = substr($path, 8);
            } else {
                parse_str($parsed['query'] ?? '', $queryParams);
                $videoId = $queryParams['v'] ?? null;
            }
        }

        if ($videoId !== null) {
            foreach (['&', '?', '/'] as $delim) {
                $pos = strpos($videoId, $delim);
                if ($pos !== false) {
                    $videoId = substr($videoId, 0, $pos);
                }
            }
        }

        if (empty($videoId) || !preg_match('/^[a-zA-Z0-9_\-]{11}$/', $videoId)) {
            return ['isValid' => false, 'error' => 'अवैध YouTube व्हिडिओ आयडी. (Invalid YouTube Video ID.)'];
        }

        return ['isValid' => true, 'source' => 'youtube', 'videoId' => $videoId];
    }

    // Direct Video validation:
    $path = strtolower($parsed['path'] ?? '');
    $validExts = ['.mp4', '.webm', '.mov', '.m4v'];
    $hasValidExt = false;
    foreach ($validExts as $ext) {
        if (str_ends_with($path, $ext)) {
            $hasValidExt = true;
            break;
        }
    }

    if ($hasValidExt) {
        return ['isValid' => true, 'source' => 'direct'];
    }

    return [
        'isValid' => false,
        'error' => 'केवळ अधिकृत YouTube किंवा थेट .mp4/.webm/.mov/.m4v HTTPS व्हिडिओ लिंक्स समर्थित आहेत. (Only official YouTube or direct HTTPS video links are supported.)'
    ];
}

/**
 * Server-side validation for video thumbnail / cover URLs.
 * Requires HTTPS and max length <= 500 characters.
 */
function validateThumbnailUrlServer(string $url): bool {
    $trimmed = trim($url);
    if (empty($trimmed) || mb_strlen($trimmed, 'UTF-8') > 500) {
        return false;
    }
    $parsed = parse_url($trimmed);
    if (!$parsed || empty($parsed['scheme']) || empty($parsed['host'])) {
        return false;
    }
    return strtolower($parsed['scheme']) === 'https';
}

/**
 * Server-side validation for initiatives and event images.
 * Enforces HTTPS or verified relative paths, blocks base64 blobs and unsafe protocols.
 */
function validateImageUrlServer(string $url): bool {
    $trimmed = trim($url);
    if (empty($trimmed) || mb_strlen($trimmed, 'UTF-8') > 500) {
        return false;
    }
    if (stripos($trimmed, 'data:') === 0 || stripos($trimmed, 'javascript:') === 0 || stripos($trimmed, 'file:') === 0) {
        return false;
    }
    $normalized = str_replace('\\', '/', $trimmed);
    $pathOnly = parse_url($normalized, PHP_URL_PATH) ?: $normalized;
    if (preg_match('/^\/?([a-zA-Z0-9_\-]+\/)*[a-zA-Z0-9_\-]+\.(jpg|jpeg|png|webp|gif|svg)$/i', $pathOnly)) {
        return true;
    }
    $parsed = parse_url($normalized);
    if (!$parsed || empty($parsed['scheme']) || empty($parsed['host'])) {
        return false;
    }
    return strtolower($parsed['scheme']) === 'https';
}

/**
 * Server-side validation for report PDF / document URLs or paths.
 * Enforces HTTPS, local server-relative /backend-php-mysql/uploads/reports/ paths, or placeholder '#'.
 * Blocks data:, javascript:, file: and dangerous protocols.
 */
function validatePdfUrlServer(string $url): bool {
    $trimmed = trim($url);
    if (empty($trimmed) || $trimmed === '#') {
        return true;
    }
    if (mb_strlen($trimmed, 'UTF-8') > 1000) {
        return false;
    }
    if (stripos($trimmed, 'data:') === 0 || stripos($trimmed, 'javascript:') === 0 || stripos($trimmed, 'file:') === 0) {
        return false;
    }
    // Allow server-relative uploads path for reports
    if (preg_match('/^\/?([a-zA-Z0-9_\-]+\/)*[a-zA-Z0-9_\-]+\.pdf$/i', $trimmed)) {
        return true;
    }
    $parsed = parse_url($trimmed);
    if (!$parsed || empty($parsed['scheme']) || empty($parsed['host'])) {
        return false;
    }
    return strtolower($parsed['scheme']) === 'https';
}

/**
 * Cross-table media reference tracker.
 * Identifies all database records across content tables that store this file.
 */
function getMediaReferencesHelper(PDO $db, string $fileName, string $filePath, ?string $excludeTable = null, $excludeId = null): array {
    $fn = basename($fileName ?: $filePath);
    if (empty($fn)) {
        return [];
    }

    $checks = [
        ['officials', 'image_url', 'id', 'name_mr'],
        ['initiatives', 'image_url', 'id', 'title_mr'],
        ['initiative_photos', 'image_url', 'id', 'caption_mr'],
        ['gallery_albums', 'cover_image_url', 'id', 'title_mr'],
        ['gallery_photos', 'image_url', 'id', 'caption_mr'],
        ['events', 'image_url', 'id', 'title_mr'],
        ['events', 'cover_image_url', 'id', 'title_mr'],
        ['event_photos', 'image_url', 'id', 'caption_mr'],
        ['reports', 'pdf_url', 'id', 'title_mr'],
        ['reports', 'cover_image_url', 'id', 'title_mr'],
        ['reports', 'file_path', 'id', 'title_mr'],
        ['page_sections', 'image_url', 'id', 'title_mr'],
        ['announcements', 'cover_image_url', 'id', 'title_mr'],
        ['government_schemes', 'cover_image_url', 'id', 'title_mr']
    ];

    $references = [];
    foreach ($checks as [$table, $col, $idCol, $titleCol]) {
        try {
            $sql = "SELECT {$idCol} AS id, {$titleCol} AS title FROM {$table} WHERE {$col} LIKE :pat";
            if ($excludeTable === $table && $excludeId !== null) {
                $sql .= " AND {$idCol} != :exId";
            }
            $stmt = $db->prepare($sql);
            $params = [':pat' => '%' . $fn . '%'];
            if ($excludeTable === $table && $excludeId !== null) {
                $params[':exId'] = $excludeId;
            }
            $stmt->execute($params);
            while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $references[] = [
                    'table'   => $table,
                    'column'  => $col,
                    'id'      => $r['id'],
                    'title'   => $r['title'] ?: "Record #{$r['id']}"
                ];
            }
        } catch (PDOException $e) {}
    }

    return $references;
}

/**
 * Checks if a physical file can be safely unlinked.
 * Never deletes shared files or files cataloged in media_files.
 */
function safeCleanupPhysicalFileIfUnused(PDO $db, ?string $filePath, string $excludeTable, $excludeId): bool {
    if (empty($filePath)) {
        return false;
    }
    if (str_starts_with($filePath, 'http://') || str_starts_with($filePath, 'https://')) {
        return false;
    }
    $fn = basename($filePath);
    $refs = getMediaReferencesHelper($db, $fn, $filePath, $excludeTable, $excludeId);
    if (!empty($refs)) {
        return false;
    }
    // Do not unlink files that are managed in media_files - keep them in media library as unreferenced
    try {
        $chkMedia = $db->prepare("SELECT id FROM media_files WHERE file_name = ? OR file_path LIKE ?");
        $chkMedia->execute([$fn, '%' . $fn]);
        if ($chkMedia->fetch()) {
            return false;
        }
    } catch (PDOException $e) {}

    return false;
}

switch ($method) {
    // ========================================================================
    // GET: Public Content Read
    // ========================================================================
    case 'GET':
        $allowedPublicResources = [
            'all',
            'initiatives',
            'activities',
            'events',
            'officials',
            'gallery',
            'gallery_photos',
            'albums',
            'gallery_albums',
            'videos',
            'reports',
            'announcements',
            'schemes',
            'government_schemes',
            'contact',
            'settings',
            'site_settings',
            'pages',
            'site_pages',
            'page_sections',
            'sections',
            'media_files',
            'media'
        ];

        // --- PROTECTED MEDIA FILES RESOURCE (ADMIN ONLY) ---
        if ($resource === 'media_files' || $resource === 'media') {
            $currentAdmin = authenticateAdmin($db);
            try {
                $mRows = $db->query("
                    SELECT id, file_name, original_name, file_path, file_type, mime_type,
                           file_size_bytes, alt_text_mr, alt_text_en, uploaded_by, created_at
                    FROM media_files
                    ORDER BY created_at DESC, id DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                foreach ($mRows as &$m) {
                    $refs = getMediaReferencesHelper($db, $m['file_name'], $m['file_path']);
                    $m['references'] = $refs;
                    $m['reference_count'] = count($refs);
                    $m['is_referenced'] = count($refs) > 0;
                }
                unset($m);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "data"    => $mRows
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Media fetch failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to fetch media inventory."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- PROTECTED INBOX RESOURCE (ADMIN ONLY) ---
        if ($resource === 'inquiries') {
            $currentAdmin = authenticateAdmin($db);

            try {
                $statusFilter = trim($_GET['status'] ?? '');
                if ($statusFilter === 'unread') {
                    $statusFilter = 'new';
                }
                $allowedFilterStatuses = ['new', 'read', 'replied', 'archived'];

                $searchQuery = trim($_GET['q'] ?? '');

                $where = [];
                $params = [];

                if (!empty($statusFilter) && in_array($statusFilter, $allowedFilterStatuses, true)) {
                    $where[] = "status = :status";
                    $params[':status'] = $statusFilter;
                }

                if (!empty($searchQuery)) {
                    $where[] = "(full_name LIKE :q1 OR contact_detail LIKE :q2 OR subject LIKE :q3 OR message LIKE :q4)";
                    $likeVal = '%' . $searchQuery . '%';
                    $params[':q1'] = $likeVal;
                    $params[':q2'] = $likeVal;
                    $params[':q3'] = $likeVal;
                    $params[':q4'] = $likeVal;
                }

                $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

                // Fetch inquiries ordered newest first
                $stmt = $db->prepare("
                    SELECT id, full_name, contact_detail, subject, message,
                           status, ip_address, admin_notes, replied_at, replied_by,
                           created_at, updated_at
                    FROM inquiries
                    {$whereSql}
                    ORDER BY created_at DESC, id DESC
                ");
                $stmt->execute($params);
                $inquiries = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Summary counts for inbox badges
                $countsStmt = $db->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as unread_count,
                        SUM(CASE WHEN status = 'read' THEN 1 ELSE 0 END) as read_count,
                        SUM(CASE WHEN status = 'replied' THEN 1 ELSE 0 END) as replied_count,
                        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_count
                    FROM inquiries
                ");
                $counts = $countsStmt->fetch(PDO::FETCH_ASSOC) ?: [];

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "data"    => $inquiries,
                    "counts"  => [
                        "total"    => (int)($counts['total'] ?? 0),
                        "unread"   => (int)($counts['unread_count'] ?? 0),
                        "read"     => (int)($counts['read_count'] ?? 0),
                        "replied"  => (int)($counts['replied_count'] ?? 0),
                        "archived" => (int)($counts['archived_count'] ?? 0),
                    ]
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Inquiries fetch failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to fetch inquiries."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- PROTECTED VOLUNTEERS RESOURCE (ADMIN ONLY) ---
        if ($resource === 'volunteers') {
            $currentAdmin = authenticateAdmin($db);

            try {
                $statusFilter = trim($_GET['status'] ?? '');
                $allowedFilterStatuses = ['new', 'reviewing', 'approved', 'contacted', 'declined', 'rejected', 'archived'];

                $searchQuery = trim($_GET['q'] ?? '');

                $where = [];
                $params = [];

                if (!empty($statusFilter) && in_array($statusFilter, $allowedFilterStatuses, true)) {
                    if ($statusFilter === 'declined') {
                        $where[] = "(status = 'declined' OR status = 'rejected')";
                    } else {
                        $where[] = "status = :status";
                        $params[':status'] = $statusFilter;
                    }
                }

                if (!empty($searchQuery)) {
                    $where[] = "(full_name LIKE :q1 OR phone LIKE :q2 OR email LIKE :q3 OR city_village LIKE :q4 OR district LIKE :q5 OR taluka LIKE :q6)";
                    $likeVal = '%' . $searchQuery . '%';
                    $params[':q1'] = $likeVal;
                    $params[':q2'] = $likeVal;
                    $params[':q3'] = $likeVal;
                    $params[':q4'] = $likeVal;
                    $params[':q5'] = $likeVal;
                    $params[':q6'] = $likeVal;
                }

                $whereSql = !empty($where) ? 'WHERE ' . implode(' AND ', $where) : '';

                // Fetch volunteers ordered newest first
                $stmt = $db->prepare("
                    SELECT id, full_name, phone, email, city_village, city_village as village, taluka, district,
                           age_bracket, gender, availability, occupation, areas_of_interest,
                           message, message as motivation, status, ip_address, admin_notes, created_at, updated_at
                    FROM volunteers
                    {$whereSql}
                    ORDER BY created_at DESC, id DESC
                ");
                $stmt->execute($params);
                $volunteers = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Summary counts for volunteer inbox badges
                $countsStmt = $db->query("
                    SELECT 
                        COUNT(*) as total,
                        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
                        SUM(CASE WHEN status = 'reviewing' THEN 1 ELSE 0 END) as reviewing_count,
                        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
                        SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted_count,
                        SUM(CASE WHEN status = 'declined' OR status = 'rejected' THEN 1 ELSE 0 END) as declined_count,
                        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived_count
                    FROM volunteers
                ");
                $counts = $countsStmt->fetch(PDO::FETCH_ASSOC) ?: [];

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "data"    => $volunteers,
                    "counts"  => [
                        "total"      => (int)($counts['total'] ?? 0),
                        "new"        => (int)($counts['new_count'] ?? 0),
                        "reviewing"  => (int)($counts['reviewing_count'] ?? 0),
                        "approved"   => (int)($counts['approved_count'] ?? 0),
                        "contacted"  => (int)($counts['contacted_count'] ?? 0),
                        "declined"   => (int)($counts['declined_count'] ?? 0),
                        "archived"   => (int)($counts['archived_count'] ?? 0),
                    ]
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Volunteers fetch failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to fetch volunteers."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        if (!in_array($resource, $allowedPublicResources, true)) {
            http_response_code(400);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "message" => "Invalid resource parameter."
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        try {
            // Determine if caller is requesting draft preview (?admin=1)
            $isAdminPreview = false;
            if (isset($_GET['admin']) && $_GET['admin'] === '1') {
                // Administrative preview requires active, valid, unrevoked Bearer token
                // authenticateAdmin() halts with HTTP 401 if token is missing, malformed, invalid, expired, or revoked
                authenticateAdmin($db);
                $isAdminPreview = true;
            }

            // Public queries strictly filter for published items only (published = 1)
            $publishedClause = $isAdminPreview ? "1=1" : "published = 1";

            // Helper to fetch initiatives with their child photos
            $fetchInitiatives = function() use ($db, $publishedClause) {
                $stmt = $db->query("
                    SELECT id, title_mr, title_en, category, activity_date,
                           location_mr, location_en, summary_mr, summary_en,
                           description_mr, description_en, image_url,
                           is_govt_scheme, published, featured, related_report_id,
                           tags, display_order, created_at, updated_at
                    FROM initiatives 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ");
                $initiatives = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (!empty($initiatives)) {
                    $initIds = array_column($initiatives, 'id');
                    $placeholders = implode(',', array_fill(0, count($initIds), '?'));
                    $photoStmt = $db->prepare("
                        SELECT initiative_id, image_url, caption_mr, caption_en, display_order
                        FROM initiative_photos
                        WHERE initiative_id IN ({$placeholders})
                        ORDER BY display_order ASC
                    ");
                    $photoStmt->execute($initIds);
                    $photosByInit = [];
                    while ($photo = $photoStmt->fetch(PDO::FETCH_ASSOC)) {
                        $photosByInit[$photo['initiative_id']][] = $photo;
                    }
                    foreach ($initiatives as &$init) {
                        $init['photos'] = $photosByInit[$init['id']] ?? [];
                    }
                    unset($init);
                }
                return $initiatives;
            };

            // Helper to fetch events with their child photos
            $fetchEvents = function() use ($db, $publishedClause) {
                $stmt = $db->query("
                    SELECT id, title_mr, title_en, category, start_date, end_date,
                           event_date_text_mr, event_date_text_en, event_time,
                           venue_mr, venue_en, summary_mr, summary_en,
                           description_mr, description_en, cover_image_url,
                           status, is_featured, published, display_order,
                           created_at, updated_at
                    FROM events 
                    WHERE {$publishedClause} 
                    ORDER BY start_date DESC, display_order ASC, created_at DESC
                ");
                $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

                if (!empty($events)) {
                    $eventIds = array_column($events, 'id');
                    $placeholders = implode(',', array_fill(0, count($eventIds), '?'));
                    $photoStmt = $db->prepare("
                        SELECT id, event_id, image_url, caption_mr, caption_en, display_order
                        FROM event_photos
                        WHERE event_id IN ({$placeholders})
                        ORDER BY display_order ASC
                    ");
                    $photoStmt->execute($eventIds);
                    $photosByEvent = [];
                    while ($photo = $photoStmt->fetch(PDO::FETCH_ASSOC)) {
                        $photosByEvent[$photo['event_id']][] = $photo;
                    }
                    foreach ($events as &$evt) {
                        $evt['photos'] = $photosByEvent[$evt['id']] ?? [];
                    }
                    unset($evt);
                }
                return $events;
            };

            // Unified response for ?resource=all
            if ($resource === 'all') {
                $officials = $db->query("
                    SELECT id, name_mr, name_en, role_mr, role_en, bio_mr, bio_en,
                           phone, image_url, display_order, published
                    FROM officials 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $initiatives = $fetchInitiatives();
                $events = $fetchEvents();

                $albums = $db->query("
                    SELECT id, title_mr, title_en, description_mr, description_en, category,
                           cover_image_url, event_date, display_mode, display_order, published
                    FROM gallery_albums 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $photos = $db->query("
                    SELECT id, album_id, activity_id, title_mr, title_en, caption_mr, caption_en,
                           alt_text_mr, alt_text_en, category, image_url, year, featured_on_home,
                           display_order, published
                    FROM gallery_photos 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $videos = $db->query("
                    SELECT id, title_mr, title_en, description_mr, description_en, category,
                           duration_seconds, duration_formatted, duration_formatted_en,
                           thumbnail_url, video_url, publish_date, related_activity_title,
                           display_order, published, featured
                    FROM videos 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $reports = $db->query("
                    SELECT id, title_mr, title_en, period_mr, period_en, report_date,
                           file_size, category_mr, category_en, summary_mr, summary_en,
                           pdf_url, cover_image_url, display_order, published
                    FROM reports 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $announcements = $db->query("
                    SELECT id, title_mr, title_en, event_date_mr, event_date_en,
                           is_upcoming, category, summary_mr, summary_en,
                           content_mr, content_en, cover_image_url,
                           display_order, published
                    FROM announcements 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                // Dedicated Government Welfare Schemes Catalog (Strictly segregated from initiatives)
                $schemes = $db->query("
                    SELECT id, title_mr, title_en, department_mr, department_en,
                           beneficiary_category_mr, beneficiary_category_en,
                           summary_mr, summary_en, eligibility_mr, eligibility_en,
                           documents_required_mr, documents_required_en,
                           benefits_mr, benefits_en, official_portal_url,
                           cover_image_url, display_order, published, featured
                    FROM government_schemes 
                    WHERE {$publishedClause} 
                    ORDER BY display_order ASC, created_at DESC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $contact = $db->query("
                    SELECT id, reg_no_mr, reg_no_en, secretary_name_mr, secretary_name_en,
                           phone, email, address_mr, address_en, taluka_mr, taluka_en,
                           district_mr, district_en, visiting_hours_mr, visiting_hours_en
                    FROM contact_info 
                    WHERE id = 1 
                    LIMIT 1
                ")->fetch(PDO::FETCH_ASSOC);

                $settings = $db->query("
                    SELECT key_name, category, value_mr, value_en, description 
                    FROM site_settings 
                    ORDER BY category, key_name
                ")->fetchAll(PDO::FETCH_ASSOC);

                $pagePublishedClause = $isAdminPreview ? "1=1" : "is_published = 1";
                $sitePages = $db->query("
                    SELECT slug, title_mr, title_en, meta_description_mr, meta_description_en, is_published, updated_at 
                    FROM site_pages 
                    WHERE {$pagePublishedClause}
                    ORDER BY slug ASC
                ")->fetchAll(PDO::FETCH_ASSOC);

                $pageSections = $db->query("
                    SELECT id, page_slug, section_key, title_mr, title_en, subtitle_mr, subtitle_en,
                           content_mr, content_en, image_url, image_alt_mr, image_alt_en,
                           display_order, is_published, updated_at 
                    FROM page_sections 
                    WHERE {$pagePublishedClause}
                    ORDER BY page_slug ASC, display_order ASC, id ASC
                ")->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "isAdminPreview" => $isAdminPreview,
                    "data" => [
                        "officials" => $officials,
                        "initiatives" => $initiatives,
                        "events" => $events,
                        "albums" => $albums,
                        "gallery" => $photos,
                        "videos" => $videos,
                        "reports" => $reports,
                        "announcements" => $announcements,
                        "governmentSchemes" => $schemes,
                        "contactInfo" => $contact,
                        "siteSettings" => $settings,
                        "sitePages" => $sitePages,
                        "pageSections" => $pageSections
                    ]
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Single Resource Read Support
            $resourceData = null;
            switch ($resource) {
                case 'initiatives':
                case 'activities':
                    $resourceData = $fetchInitiatives();
                    break;

                case 'events':
                    $resourceData = $fetchEvents();
                    break;

                case 'officials':
                    $resourceData = $db->query("
                        SELECT id, name_mr, name_en, role_mr, role_en, bio_mr, bio_en,
                               phone, image_url, display_order, published
                        FROM officials 
                        WHERE {$publishedClause} 
                        ORDER BY display_order ASC, created_at DESC
                    ")->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'albums':
                case 'gallery_albums':
                    $resourceData = $db->query("
                        SELECT id, title_mr, title_en, description_mr, description_en, category,
                               cover_image_url, event_date, display_mode, display_order, published
                        FROM gallery_albums 
                        WHERE {$publishedClause} 
                        ORDER BY display_order ASC, created_at DESC
                    ")->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'gallery':
                case 'gallery_photos':
                    $albumFilter = trim((string)($_GET['album_id'] ?? ''));
                    if (!empty($albumFilter)) {
                        $pStmt = $db->prepare("
                            SELECT id, album_id, activity_id, title_mr, title_en, caption_mr, caption_en,
                                   alt_text_mr, alt_text_en, category, image_url, year, featured_on_home,
                                   display_order, published
                            FROM gallery_photos 
                            WHERE ({$publishedClause}) AND album_id = :album_id
                            ORDER BY display_order ASC, created_at DESC
                        ");
                        $pStmt->execute([':album_id' => $albumFilter]);
                        $resourceData = $pStmt->fetchAll(PDO::FETCH_ASSOC);
                    } else {
                        $resourceData = $db->query("
                            SELECT id, album_id, activity_id, title_mr, title_en, caption_mr, caption_en,
                                   alt_text_mr, alt_text_en, category, image_url, year, featured_on_home,
                                   display_order, published
                            FROM gallery_photos 
                            WHERE {$publishedClause} 
                            ORDER BY display_order ASC, created_at DESC
                        ")->fetchAll(PDO::FETCH_ASSOC);
                    }
                    break;

                case 'videos':
                    $resourceData = $db->query("
                        SELECT id, title_mr, title_en, description_mr, description_en, category,
                               duration_seconds, duration_formatted, duration_formatted_en,
                               thumbnail_url, video_url, publish_date, related_activity_title,
                               display_order, published, featured
                        FROM videos 
                        WHERE {$publishedClause} 
                        ORDER BY display_order ASC, created_at DESC
                    ")->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'reports':
                    $resourceData = $db->query("
                        SELECT id, title_mr, title_en, period_mr, period_en, report_date,
                               file_size, category_mr, category_en, summary_mr, summary_en,
                               pdf_url, cover_image_url, display_order, published
                        FROM reports 
                        WHERE {$publishedClause} 
                        ORDER BY display_order ASC, created_at DESC
                    ")->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'announcements':
                    $resourceData = $db->query("
                        SELECT id, title_mr, title_en, event_date_mr, event_date_en,
                               is_upcoming, category, summary_mr, summary_en,
                               content_mr, content_en, cover_image_url,
                               display_order, published
                        FROM announcements 
                        WHERE {$publishedClause} 
                        ORDER BY display_order ASC, created_at DESC
                    ")->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'schemes':
                case 'government_schemes':
                    $resourceData = $db->query("
                        SELECT id, title_mr, title_en, department_mr, department_en,
                               beneficiary_category_mr, beneficiary_category_en,
                               summary_mr, summary_en, eligibility_mr, eligibility_en,
                               documents_required_mr, documents_required_en,
                               benefits_mr, benefits_en, official_portal_url,
                               cover_image_url, display_order, published, featured
                        FROM government_schemes 
                        WHERE {$publishedClause} 
                        ORDER BY display_order ASC, created_at DESC
                    ")->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'contact':
                    $resourceData = $db->query("
                        SELECT id, reg_no_mr, reg_no_en, secretary_name_mr, secretary_name_en,
                               phone, email, address_mr, address_en, taluka_mr, taluka_en,
                               district_mr, district_en, visiting_hours_mr, visiting_hours_en
                        FROM contact_info 
                        WHERE id = 1 
                        LIMIT 1
                    ")->fetch(PDO::FETCH_ASSOC);
                    break;

                case 'settings':
                case 'site_settings':
                    $resourceData = $db->query("
                        SELECT key_name, category, value_mr, value_en, description, updated_at 
                        FROM site_settings 
                        ORDER BY category, key_name
                    ")->fetchAll(PDO::FETCH_ASSOC);
                    break;

                case 'pages':
                case 'site_pages':
                    $pagePublishedClause = $isAdminPreview ? "1=1" : "is_published = 1";
                    $pagesList = $db->query("
                        SELECT slug, title_mr, title_en, meta_description_mr, meta_description_en, is_published, updated_at 
                        FROM site_pages 
                        WHERE {$pagePublishedClause}
                        ORDER BY slug ASC
                    ")->fetchAll(PDO::FETCH_ASSOC);

                    $targetSlug = trim((string)($_GET['slug'] ?? ($_GET['id'] ?? '')));
                    if (!empty($targetSlug)) {
                        $matched = null;
                        foreach ($pagesList as $p) {
                            if ($p['slug'] === $targetSlug) {
                                $matched = $p;
                                break;
                            }
                        }
                        if ($matched) {
                            $secStmt = $db->prepare("
                                SELECT id, page_slug, section_key, title_mr, title_en, subtitle_mr, subtitle_en,
                                       content_mr, content_en, image_url, image_alt_mr, image_alt_en, display_order, is_published, updated_at
                                FROM page_sections
                                WHERE page_slug = ? AND ({$pagePublishedClause})
                                ORDER BY display_order ASC
                            ");
                            $secStmt->execute([$targetSlug]);
                            $matched['sections'] = $secStmt->fetchAll(PDO::FETCH_ASSOC);
                            $resourceData = $matched;
                        } else {
                            $resourceData = null;
                        }
                    } else {
                        $resourceData = $pagesList;
                    }
                    break;

                case 'page_sections':
                case 'sections':
                    $pagePublishedClause = $isAdminPreview ? "1=1" : "is_published = 1";
                    $targetPage = trim((string)($_GET['page_slug'] ?? ($_GET['page'] ?? '')));
                    $targetId   = trim((string)($_GET['id'] ?? ''));

                    if (!empty($targetId) && is_numeric($targetId)) {
                        $secStmt = $db->prepare("
                            SELECT id, page_slug, section_key, title_mr, title_en, subtitle_mr, subtitle_en,
                                   content_mr, content_en, image_url, image_alt_mr, image_alt_en,
                                   display_order, is_published, updated_at
                            FROM page_sections
                            WHERE id = ? AND ({$pagePublishedClause})
                            LIMIT 1
                        ");
                        $secStmt->execute([(int)$targetId]);
                        $resourceData = $secStmt->fetch(PDO::FETCH_ASSOC) ?: null;
                    } elseif (!empty($targetPage)) {
                        $secStmt = $db->prepare("
                            SELECT id, page_slug, section_key, title_mr, title_en, subtitle_mr, subtitle_en,
                                   content_mr, content_en, image_url, image_alt_mr, image_alt_en,
                                   display_order, is_published, updated_at
                            FROM page_sections
                            WHERE page_slug = ? AND ({$pagePublishedClause})
                            ORDER BY display_order ASC, id ASC
                        ");
                        $secStmt->execute([$targetPage]);
                        $resourceData = $secStmt->fetchAll(PDO::FETCH_ASSOC);
                    } else {
                        $resourceData = $db->query("
                            SELECT id, page_slug, section_key, title_mr, title_en, subtitle_mr, subtitle_en,
                                   content_mr, content_en, image_url, image_alt_mr, image_alt_en,
                                   display_order, is_published, updated_at
                            FROM page_sections
                            WHERE {$pagePublishedClause}
                            ORDER BY page_slug ASC, display_order ASC, id ASC
                        ")->fetchAll(PDO::FETCH_ASSOC);
                    }
                    break;
            }

            // If single item ID / key / slug requested and not already filtered, filter to that item
            $filterKey = trim((string)($_GET['id'] ?? ($_GET['key'] ?? ($_GET['slug'] ?? ''))));
            if (!empty($filterKey) && is_array($resourceData) && isset($resourceData[0])) {
                foreach ($resourceData as $item) {
                    $itemId = $item['id'] ?? ($item['key_name'] ?? ($item['slug'] ?? ''));
                    if ((string)$itemId === $filterKey) {
                        $resourceData = $item;
                        break;
                    }
                }
            }

            echo json_encode([
                "status" => "success",
                "success" => true,
                "isAdminPreview" => $isAdminPreview,
                "data" => $resourceData
            ], JSON_UNESCAPED_UNICODE);
            exit();

        } catch (PDOException $e) {
            error_log("Content query failed: " . $e->getMessage());
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "message" => "Failed to retrieve public content."
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

    // ========================================================================
    // POST: Inquiries (Public) OR Administrative Creations (Protected)
    // ========================================================================
    case 'POST':
        $payload = json_decode(file_get_contents("php://input"), true) ?: [];

        // --- Public Resource: Contact Inquiries ---
        if ($resource === 'inquiries') {
            // 1. Honeypot spam protection (bots fill invisible fields)
            if (!empty($payload['website']) || !empty($payload['_gotcha']) || !empty($payload['hp_fax'])) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "success" => false,
                    "message" => "अवैध विनंती. (Submission rejected by spam filter.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // 2. Client IP resolution & rate limiting
            $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            $clientIp = substr(trim($remoteAddr), 0, 45);

            try {
                $rateStmt = $db->prepare("
                    SELECT COUNT(*) 
                    FROM inquiries 
                    WHERE ip_address = :ip 
                      AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
                ");
                $rateStmt->execute([':ip' => $clientIp]);
                $recentCount = (int)$rateStmt->fetchColumn();

                if ($recentCount >= 5) {
                    http_response_code(429);
                    echo json_encode([
                        "status" => "error",
                        "success" => false,
                        "message" => "या नेटवर्कवरून फार जलद संदेश पाठवले गेले आहेत. कृपया १५ मिनिटांनी पुन्हा प्रयत्न करा. (Too many inquiries from this network. Please wait 15 minutes.)"
                    ], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } catch (PDOException $e) {
                // If rate limit query fails, log and continue safely
                error_log("Inquiry rate limit check error: " . $e->getMessage());
            }

            // 3. Field extraction & sanitization
            $name    = substr(trim(strip_tags((string)($payload['name'] ?? ''))), 0, 150);
            $contact = substr(trim(strip_tags((string)($payload['contact'] ?? ''))), 0, 150);
            $subject = substr(trim(strip_tags((string)($payload['subject'] ?? ''))), 0, 255);
            $message = substr(trim(strip_tags((string)($payload['message'] ?? ''))), 0, 5000);

            if (mb_strlen($name) < 2) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "success" => false,
                    "message" => "कृपया तुमचे पूर्ण नाव प्रविष्ट करा (किमान २ अक्षरे). (Name must be at least 2 characters.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (mb_strlen($contact) < 5) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "success" => false,
                    "message" => "कृपया वैध संपर्क क्रमांक किंवा ईमेल पत्ता प्रविष्ट करा. (Valid phone or email required.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (mb_strlen($message) < 5) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "success" => false,
                    "message" => "कृपया सविस्तर संदेश प्रविष्ट करा (किमान ५ अक्षरे). (Message must be at least 5 characters.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // 4. Anti-spam: link stuffing detection (reject if more than 3 URLs)
            preg_match_all('#https?://#i', $message . ' ' . $subject, $urlMatches);
            if (!empty($urlMatches[0]) && count($urlMatches[0]) > 3) {
                http_response_code(400);
                echo json_encode([
                    "status" => "error",
                    "success" => false,
                    "message" => "संदेशामध्ये जास्त वेब लिंक्स अनुमत नाहीत. (Excessive links detected.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $stmt = $db->prepare("
                    INSERT INTO inquiries (full_name, contact_detail, subject, message, ip_address, status) 
                    VALUES (:name, :contact, :subject, :message, :ip, 'new')
                ");
                $stmt->execute([
                    ':name'    => $name,
                    ':contact' => $contact,
                    ':subject' => $subject,
                    ':message' => $message,
                    ':ip'      => $clientIp
                ]);

                http_response_code(201);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "id"      => (int)$db->lastInsertId(),
                    "message" => "आपला संदेश यशस्वीरित्या नोंदवला गेला आहे. (Your inquiry has been successfully registered.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Inquiry insertion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "success" => false,
                    "message" => "Failed to save inquiry. Please try again later."
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- Public Resource: Volunteer Registration ---
        if ($resource === 'volunteers') {
            // 1. Honeypot spam protection (bots fill invisible fields)
            if (!empty($payload['website']) || !empty($payload['_gotcha']) || !empty($payload['hp_fax'])) {
                // Return silent success to bot without inserting record into database
                http_response_code(200);
                echo json_encode([
                    "status"       => "success",
                    "success"      => true,
                    "reference_id" => "VOL-" . strtoupper(bin2hex(random_bytes(3))),
                    "message"      => "आपली स्वयंसेवक नोंदणी यशस्वीरित्या पूर्ण झाली आहे. (Your volunteer registration has been successfully submitted.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // 2. Client IP resolution & rate limiting
            $remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
            $clientIp = substr(trim($remoteAddr), 0, 45);

            try {
                $rateStmt = $db->prepare("
                    SELECT COUNT(*) 
                    FROM volunteers 
                    WHERE ip_address = :ip 
                      AND created_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
                ");
                $rateStmt->execute([':ip' => $clientIp]);
                $recentCount = (int)$rateStmt->fetchColumn();

                if ($recentCount >= 5) {
                    http_response_code(429);
                    echo json_encode([
                        "status" => "error",
                        "success" => false,
                        "message" => "या नेटवर्कवरून फार जलद नोंदणी विनंत्या आल्या आहेत. कृपया १५ मिनिटांनी पुन्हा प्रयत्न करा. (Too many registrations from this network. Please wait 15 minutes.)"
                    ], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } catch (PDOException $e) {
                error_log("Volunteer rate limit check error: " . $e->getMessage());
            }

            // 3. Field extraction & sanitization
            $fullName    = substr(trim(strip_tags((string)($payload['fullName'] ?? ($payload['full_name'] ?? '')))), 0, 150);
            $phone       = substr(trim(strip_tags((string)($payload['phone'] ?? ''))), 0, 30);
            $email       = substr(trim(strip_tags((string)($payload['email'] ?? ''))), 0, 150);
            $cityVillage = substr(trim(strip_tags((string)($payload['village'] ?? ($payload['city_village'] ?? '')))), 0, 100);
            $taluka      = substr(trim(strip_tags((string)($payload['taluka'] ?? 'कन्नड'))), 0, 100);
            $district    = substr(trim(strip_tags((string)($payload['district'] ?? 'छत्रपती संभाजीनगर'))), 0, 100);
            $ageBracket  = substr(trim(strip_tags((string)($payload['ageBracket'] ?? ($payload['age_bracket'] ?? '')))), 0, 30);
            $gender      = substr(trim(strip_tags((string)($payload['gender'] ?? ''))), 0, 30);
            $availability = substr(trim(strip_tags((string)($payload['availability'] ?? ''))), 0, 50);
            $occupation  = substr(trim(strip_tags((string)($payload['occupation'] ?? ''))), 0, 100);
            $message     = substr(trim(strip_tags((string)($payload['message'] ?? ($payload['motivation'] ?? '')))), 0, 5000);

            // Handle areas_of_interest: can be array or CSV string
            $rawInterests = $payload['areasOfInterest'] ?? ($payload['areas_of_interest'] ?? []);
            if (is_array($rawInterests)) {
                $sanitizedInterests = array_filter(array_map(function($item) {
                    return substr(trim(strip_tags((string)$item)), 0, 100);
                }, $rawInterests));
                $areasOfInterest = implode(', ', $sanitizedInterests);
            } else {
                $areasOfInterest = substr(trim(strip_tags((string)$rawInterests)), 0, 1000);
            }

            // 4. Structured Validation
            $validationErrors = [];
            if (mb_strlen($fullName) < 2) {
                $validationErrors['fullName'] = "कृपया तुमचे पूर्ण नाव प्रविष्ट करा (किमान २ अक्षरे). (Full name must be at least 2 characters.)";
            }

            $digitsOnly = preg_replace('/[^0-9]/', '', $phone);
            if (strlen($digitsOnly) < 10) {
                $validationErrors['phone'] = "कृपया किमान १० अंकी वैध मोबाईल क्रमांक प्रविष्ट करा. (Valid phone number with at least 10 digits required.)";
            }

            if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $validationErrors['email'] = "कृपया वैध ईमेल पत्ता प्रविष्ट करा. (Valid email format required.)";
            }

            if (mb_strlen($cityVillage) < 2) {
                $validationErrors['village'] = "कृपया तुमचे गाव किंवा शहराचे नाव प्रविष्ट करा. (Village or city name required.)";
            }

            if (empty($areasOfInterest)) {
                $validationErrors['areasOfInterest'] = "कृपया किमान एक आवडीचे कार्यक्षेत्र निवडा. (Please select at least one area of interest.)";
            }

            // Anti-spam: link stuffing detection (> 3 URLs)
            preg_match_all('#https?://#i', $message, $urlMatches);
            if (!empty($urlMatches[0]) && count($urlMatches[0]) > 3) {
                $validationErrors['message'] = "संदेशामध्ये जास्त वेब लिंक्स अनुमत नाहीत. (Excessive links detected.)";
            }

            if (!empty($validationErrors)) {
                http_response_code(400);
                echo json_encode([
                    "status"  => "error",
                    "success" => false,
                    "message" => reset($validationErrors),
                    "errors"  => $validationErrors
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $stmt = $db->prepare("
                    INSERT INTO volunteers (
                        full_name, phone, email, city_village, taluka, district,
                        age_bracket, gender, availability, occupation, areas_of_interest,
                        message, ip_address, status
                    ) VALUES (
                        :full_name, :phone, :email, :city_village, :taluka, :district,
                        :age_bracket, :gender, :availability, :occupation, :areas_of_interest,
                        :message, :ip, 'new'
                    )
                ");
                $stmt->execute([
                    ':full_name'         => $fullName,
                    ':phone'             => $phone,
                    ':email'             => !empty($email) ? $email : null,
                    ':city_village'      => $cityVillage,
                    ':taluka'            => !empty($taluka) ? $taluka : 'कन्नड',
                    ':district'          => !empty($district) ? $district : 'छत्रपती संभाजीनगर',
                    ':age_bracket'       => !empty($ageBracket) ? $ageBracket : null,
                    ':gender'            => !empty($gender) ? $gender : null,
                    ':availability'      => !empty($availability) ? $availability : null,
                    ':occupation'        => !empty($occupation) ? $occupation : null,
                    ':areas_of_interest' => $areasOfInterest,
                    ':message'           => !empty($message) ? $message : null,
                    ':ip'                => $clientIp
                ]);

                $newId = (int)$db->lastInsertId();
                $refId = "VOL-" . str_pad($newId, 4, '0', STR_PAD_LEFT);

                http_response_code(201);
                echo json_encode([
                    "status"       => "success",
                    "success"      => true,
                    "id"           => $newId,
                    "reference_id" => $refId,
                    "message"      => "आपली स्वयंसेवक नोंदणी यशस्वीरित्या पूर्ण झाली आहे. (Your volunteer registration has been successfully submitted.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Volunteer insertion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode([
                    "status" => "error",
                    "success" => false,
                    "message" => "Failed to save volunteer registration. Please try again later."
                ], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- ALL OTHER POST OPERATIONS REQUIRE VALID ADMIN AUTHENTICATION ---
        $currentAdmin = authenticateAdmin($db);

        // --- IMAGE UPLOAD RESOURCE (Phase 2) ---
        if ($resource === 'upload') {
            require __DIR__ . '/upload.php';
            exit();
        }

        // --- PAGE SECTIONS RESOURCE (POST) ---
        if ($resource === 'page_sections' || $resource === 'sections') {
            $pageSlug   = trim((string)($payload['page_slug'] ?? ($payload['pageSlug'] ?? '')));
            $sectionKey = trim((string)($payload['section_key'] ?? ($payload['sectionKey'] ?? '')));
            $titleMr    = trim((string)($payload['title_mr'] ?? ($payload['titleMr'] ?? ($payload['title'] ?? ''))));
            $titleEn    = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $subtitleMr = trim((string)($payload['subtitle_mr'] ?? ($payload['subtitleMr'] ?? '')));
            $subtitleEn = trim((string)($payload['subtitle_en'] ?? ($payload['subtitleEn'] ?? '')));
            $contentMr  = trim((string)($payload['content_mr'] ?? ($payload['contentMr'] ?? ($payload['content'] ?? ''))));
            $contentEn  = trim((string)($payload['content_en'] ?? ($payload['contentEn'] ?? '')));
            $imageUrl   = trim((string)($payload['image_url'] ?? ($payload['imageUrl'] ?? '')));
            $altMr      = trim((string)($payload['image_alt_mr'] ?? ($payload['imageAltMr'] ?? '')));
            $altEn      = trim((string)($payload['image_alt_en'] ?? ($payload['imageAltEn'] ?? '')));
            $order      = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $isPub      = isset($payload['is_published']) ? ((bool)$payload['is_published'] ? 1 : 0) : (isset($payload['isPublished']) ? ((bool)$payload['isPublished'] ? 1 : 0) : 1);

            if (empty($pageSlug)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "पृष्ठ स्लग आवश्यक आहे. (Page slug is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($titleMr) || empty($contentMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "मराठी शीर्षक आणि मजकूर आवश्यक आहेत. (Marathi title and content are required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($sectionKey)) {
                $sectionKey = 'sec_' . bin2hex(random_bytes(4));
            }

            if (!empty($imageUrl) && !validateImageUrlServer($imageUrl)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अवैध चित्र लिंक. (Invalid image URL.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                // Verify page exists
                $chkPage = $db->prepare("SELECT slug FROM site_pages WHERE slug = ?");
                $chkPage->execute([$pageSlug]);
                if (!$chkPage->fetch()) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "संबंधित मुख्य पृष्ठ अस्तित्वात नाही. (Parent page not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $ins = $db->prepare("
                    INSERT INTO page_sections 
                    (page_slug, section_key, title_mr, title_en, subtitle_mr, subtitle_en,
                     content_mr, content_en, image_url, image_alt_mr, image_alt_en, display_order, is_published)
                    VALUES (:page_slug, :section_key, :title_mr, :title_en, :subtitle_mr, :subtitle_en,
                            :content_mr, :content_en, :image_url, :alt_mr, :alt_en, :display_order, :is_pub)
                ");
                $ins->execute([
                    ':page_slug'     => $pageSlug,
                    ':section_key'   => $sectionKey,
                    ':title_mr'      => $titleMr,
                    ':title_en'      => $titleEn,
                    ':subtitle_mr'   => $subtitleMr ?: null,
                    ':subtitle_en'   => $subtitleEn ?: null,
                    ':content_mr'    => $contentMr,
                    ':content_en'    => $contentEn,
                    ':image_url'     => $imageUrl ?: null,
                    ':alt_mr'        => $altMr ?: null,
                    ':alt_en'        => $altEn ?: null,
                    ':display_order' => $order,
                    ':is_pub'        => $isPub
                ]);
                $newId = (int)$db->lastInsertId();

                $fetchNew = $db->prepare("SELECT * FROM page_sections WHERE id = ?");
                $fetchNew->execute([$newId]);
                $created = $fetchNew->fetch(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "पृष्ठ विभाग यशस्वीरित्या जोडला. (Page section created successfully.)",
                    "data"    => $created
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Page section creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "विभाग जोडताना त्रुटी आली. (Failed to create section.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- VIDEOS RESOURCE MUTATIONS (Phase 2.2B Scoped) ---
        if ($resource === 'videos') {
            $titleMr = trim((string)($payload['title_mr'] ?? ($payload['title'] ?? '')));
            $titleEn = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $descMr  = trim((string)($payload['description_mr'] ?? ($payload['description'] ?? '')));
            $descEn  = trim((string)($payload['description_en'] ?? ($payload['descriptionEn'] ?? '')));
            $cat     = trim((string)($payload['category'] ?? 'शिक्षण'));
            $vUrl    = trim((string)($payload['video_url'] ?? ($payload['videoUrl'] ?? '')));
            $tUrl    = trim((string)($payload['thumbnail_url'] ?? ($payload['thumbnailUrl'] ?? '')));
            $pDate   = trim((string)($payload['publish_date'] ?? ($payload['date'] ?? date('Y-m-d'))));
            $relAct  = trim((string)($payload['related_activity_title'] ?? ($payload['relatedActivityTitle'] ?? '')));
            $durSec  = isset($payload['duration_seconds']) ? (int)$payload['duration_seconds'] : (isset($payload['durationSeconds']) ? (int)$payload['durationSeconds'] : 180);
            $durFmt  = trim((string)($payload['duration_formatted'] ?? ($payload['durationFormatted'] ?? '०३:००')));
            $durFmtEn= trim((string)($payload['duration_formatted_en'] ?? ($payload['durationFormattedEn'] ?? '03:00')));
            $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $pub     = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;
            $feat    = isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : 0;

            if (empty($titleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ शीर्षक (मराठी) आवश्यक आहे. (Marathi title is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($titleMr, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($descMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ माहिती (मराठी) आवश्यक आहे. (Marathi description is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Independent bilingual preservation: fallback to Marathi if English not supplied
            if (empty($titleEn)) {
                $titleEn = $titleMr;
            } elseif (mb_strlen($titleEn, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($descEn)) {
                $descEn = $descMr;
            }

            // Server-side video URL validation
            $vCheck = validateVideoUrlServer($vUrl);
            if (!$vCheck['isValid']) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => $vCheck['error']], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Server-side thumbnail URL validation
            if (empty($tUrl) || !validateThumbnailUrlServer($tUrl)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS कव्हर फोटो लिंक आवश्यक आहे. (Valid HTTPS cover image URL <= 500 chars is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // ID Generation: Accept valid client-supplied ID or generate collision-proof ID
            $newId = trim((string)($payload['id'] ?? ''));
            if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{3,64}$/', $newId)) {
                $newId = 'vid-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
            }

            try {
                $insStmt = $db->prepare("
                    INSERT INTO videos (
                        id, title_mr, title_en, description_mr, description_en,
                        category, duration_seconds, duration_formatted, duration_formatted_en,
                        thumbnail_url, video_url, publish_date, related_activity_title,
                        display_order, published, featured
                    ) VALUES (
                        :id, :title_mr, :title_en, :description_mr, :description_en,
                        :category, :duration_seconds, :duration_formatted, :duration_formatted_en,
                        :thumbnail_url, :video_url, :publish_date, :related_activity_title,
                        :display_order, :published, :featured
                    )
                ");
                $insStmt->execute([
                    ':id'                   => $newId,
                    ':title_mr'             => $titleMr,
                    ':title_en'             => $titleEn,
                    ':description_mr'       => $descMr,
                    ':description_en'       => $descEn,
                    ':category'             => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':duration_seconds'     => $durSec,
                    ':duration_formatted'   => mb_substr($durFmt, 0, 32, 'UTF-8'),
                    ':duration_formatted_en'=> mb_substr($durFmtEn, 0, 32, 'UTF-8'),
                    ':thumbnail_url'        => mb_substr($tUrl, 0, 500, 'UTF-8'),
                    ':video_url'            => mb_substr($vUrl, 0, 500, 'UTF-8'),
                    ':publish_date'         => mb_substr($pDate, 0, 50, 'UTF-8'),
                    ':related_activity_title'=> !empty($relAct) ? mb_substr($relAct, 0, 255, 'UTF-8') : null,
                    ':display_order'        => $dispOrd,
                    ':published'            => $pub,
                    ':featured'             => $feat,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM videos WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $newId]);
                $createdVideo = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "व्हिडिओ यशस्वीरित्या जतन केला. (Video successfully created.)",
                    "data" => $createdVideo
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Video creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save video to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- ANNOUNCEMENTS RESOURCE MUTATIONS ---
        if ($resource === 'announcements') {
            $titleMr = trim((string)($payload['title_mr'] ?? ($payload['title'] ?? '')));
            $titleEn = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $summaryMr = trim((string)($payload['summary_mr'] ?? ($payload['summary'] ?? '')));
            $summaryEn = trim((string)($payload['summary_en'] ?? ($payload['summaryEn'] ?? '')));
            $contentMr = trim((string)($payload['content_mr'] ?? ($payload['content'] ?? '')));
            $contentEn = trim((string)($payload['content_en'] ?? ($payload['contentEn'] ?? '')));
            $category = trim((string)($payload['category'] ?? 'शिक्षण'));
            $eventDateMr = trim((string)($payload['event_date_mr'] ?? ($payload['date'] ?? '')));
            $eventDateEn = trim((string)($payload['event_date_en'] ?? ($payload['dateEn'] ?? '')));
            $isUpcoming = isset($payload['is_upcoming']) ? ((bool)$payload['is_upcoming'] ? 1 : 0) : (isset($payload['isUpcoming']) ? ((bool)$payload['isUpcoming'] ? 1 : 0) : 1);
            $coverUrl = trim((string)($payload['cover_image_url'] ?? ($payload['coverImageUrl'] ?? '')));
            $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $pub = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;

            if (empty($titleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "बातम्या / कार्यक्रम शीर्षक (मराठी) आवश्यक आहे. (Marathi title is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($titleMr, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "बातम्या / कार्यक्रम सारांश (मराठी) आवश्यक आहे. (Marathi summary is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Independent bilingual preservation: fallback to Marathi if English not supplied on insert
            if (empty($titleEn)) $titleEn = $titleMr;
            elseif (mb_strlen($titleEn, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryEn)) $summaryEn = $summaryMr;
            if (empty($contentMr)) $contentMr = $summaryMr;
            if (empty($contentEn)) $contentEn = !empty($summaryEn) ? $summaryEn : $contentMr;
            if (empty($eventDateMr)) $eventDateMr = date('Y-m-d');
            if (empty($eventDateEn)) $eventDateEn = $eventDateMr;

            // Optional cover image validation
            if (!empty($coverUrl)) {
                if (!validateThumbnailUrlServer($coverUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "कव्हर फोटोसाठी वैध HTTPS लिंक आवश्यक आहे (कमाल ५०० अक्षरे). (Valid HTTPS cover URL <= 500 chars required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } else {
                $coverUrl = null;
            }

            // Generate clean ID
            $newId = trim((string)($payload['id'] ?? ''));
            if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{3,64}$/', $newId)) {
                $newId = 'ann-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
            }

            try {
                $insStmt = $db->prepare("
                    INSERT INTO announcements (
                        id, title_mr, title_en, event_date_mr, event_date_en,
                        is_upcoming, category, summary_mr, summary_en,
                        content_mr, content_en, cover_image_url,
                        display_order, published
                    ) VALUES (
                        :id, :title_mr, :title_en, :event_date_mr, :event_date_en,
                        :is_upcoming, :category, :summary_mr, :summary_en,
                        :content_mr, :content_en, :cover_image_url,
                        :display_order, :published
                    )
                ");
                $insStmt->execute([
                    ':id'               => $newId,
                    ':title_mr'         => $titleMr,
                    ':title_en'         => $titleEn,
                    ':event_date_mr'    => mb_substr($eventDateMr, 0, 50, 'UTF-8'),
                    ':event_date_en'    => mb_substr($eventDateEn, 0, 50, 'UTF-8'),
                    ':is_upcoming'      => $isUpcoming,
                    ':category'         => mb_substr($category, 0, 100, 'UTF-8'),
                    ':summary_mr'       => $summaryMr,
                    ':summary_en'       => $summaryEn,
                    ':content_mr'       => $contentMr,
                    ':content_en'       => $contentEn,
                    ':cover_image_url'  => $coverUrl,
                    ':display_order'    => $dispOrd,
                    ':published'        => $pub,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM announcements WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $newId]);
                $createdItem = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "बातम्या / कार्यक्रम यशस्वीरित्या जतन केला. (Announcement successfully created.)",
                    "data" => $createdItem
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Announcement creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save announcement to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GOVERNMENT SCHEMES RESOURCE MUTATIONS ---
        if ($resource === 'schemes' || $resource === 'government_schemes') {
            $titleMr = trim((string)($payload['title_mr'] ?? ($payload['title'] ?? '')));
            $titleEn = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $deptMr = trim((string)($payload['department_mr'] ?? ($payload['department'] ?? '')));
            $deptEn = trim((string)($payload['department_en'] ?? ($payload['departmentEn'] ?? '')));
            $benCatMr = trim((string)($payload['beneficiary_category_mr'] ?? ($payload['beneficiaryCategory'] ?? '')));
            $benCatEn = trim((string)($payload['beneficiary_category_en'] ?? ($payload['beneficiaryCategoryEn'] ?? '')));
            $summaryMr = trim((string)($payload['summary_mr'] ?? ($payload['summary'] ?? '')));
            $summaryEn = trim((string)($payload['summary_en'] ?? ($payload['summaryEn'] ?? '')));
            $eligMr = trim((string)($payload['eligibility_mr'] ?? ($payload['eligibility'] ?? '')));
            $eligEn = trim((string)($payload['eligibility_en'] ?? ($payload['eligibilityEn'] ?? '')));
            $docsMr = trim((string)($payload['documents_required_mr'] ?? ($payload['documentsRequired'] ?? '')));
            $docsEn = trim((string)($payload['documents_required_en'] ?? ($payload['documentsRequiredEn'] ?? '')));
            $benefitsMr = trim((string)($payload['benefits_mr'] ?? ($payload['benefits'] ?? '')));
            $benefitsEn = trim((string)($payload['benefits_en'] ?? ($payload['benefitsEn'] ?? '')));
            $portalUrl = trim((string)($payload['official_portal_url'] ?? ($payload['officialPortalUrl'] ?? '')));
            $coverUrl = trim((string)($payload['cover_image_url'] ?? ($payload['coverImageUrl'] ?? '')));
            $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $pub = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;
            $feat = isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : 0;

            if (empty($titleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजनेचे नाव (मराठी) आवश्यक आहे. (Scheme title is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($titleMr, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजनेचा सारांश (मराठी) आवश्यक आहे. (Scheme summary is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Independent bilingual preservation
            if (empty($titleEn)) $titleEn = $titleMr;
            elseif (mb_strlen($titleEn, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryEn)) $summaryEn = $summaryMr;

            // Validate official portal URL if provided (must be HTTPS)
            if (!empty($portalUrl)) {
                $pParsed = parse_url($portalUrl);
                if (!$pParsed || empty($pParsed['scheme']) || strtolower($pParsed['scheme']) !== 'https' || mb_strlen($portalUrl, 'UTF-8') > 500) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अधिकृत पोर्टलसाठी वैध HTTPS लिंक आवश्यक आहे. (Valid HTTPS portal URL <= 500 chars required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } else {
                $portalUrl = null;
            }

            // Validate cover image URL if provided
            if (!empty($coverUrl)) {
                if (!validateThumbnailUrlServer($coverUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "कव्हर फोटोसाठी वैध HTTPS लिंक आवश्यक आहे. (Valid HTTPS cover URL <= 500 chars required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } else {
                $coverUrl = null;
            }

            $newId = trim((string)($payload['id'] ?? ''));
            if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{3,64}$/', $newId)) {
                $newId = 'scheme-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
            }

            try {
                $insStmt = $db->prepare("
                    INSERT INTO government_schemes (
                        id, title_mr, title_en, department_mr, department_en,
                        beneficiary_category_mr, beneficiary_category_en,
                        summary_mr, summary_en, eligibility_mr, eligibility_en,
                        documents_required_mr, documents_required_en,
                        benefits_mr, benefits_en, official_portal_url,
                        cover_image_url, display_order, published, featured
                    ) VALUES (
                        :id, :title_mr, :title_en, :department_mr, :department_en,
                        :beneficiary_category_mr, :beneficiary_category_en,
                        :summary_mr, :summary_en, :eligibility_mr, :eligibility_en,
                        :documents_required_mr, :documents_required_en,
                        :benefits_mr, :benefits_en, :official_portal_url,
                        :cover_image_url, :display_order, :published, :featured
                    )
                ");
                $insStmt->execute([
                    ':id'                       => $newId,
                    ':title_mr'                 => $titleMr,
                    ':title_en'                 => $titleEn,
                    ':department_mr'            => !empty($deptMr) ? mb_substr($deptMr, 0, 255, 'UTF-8') : null,
                    ':department_en'            => !empty($deptEn) ? mb_substr($deptEn, 0, 255, 'UTF-8') : null,
                    ':beneficiary_category_mr'  => !empty($benCatMr) ? mb_substr($benCatMr, 0, 255, 'UTF-8') : null,
                    ':beneficiary_category_en'  => !empty($benCatEn) ? mb_substr($benCatEn, 0, 255, 'UTF-8') : null,
                    ':summary_mr'               => $summaryMr,
                    ':summary_en'               => $summaryEn,
                    ':eligibility_mr'           => !empty($eligMr) ? $eligMr : null,
                    ':eligibility_en'           => !empty($eligEn) ? $eligEn : null,
                    ':documents_required_mr'    => !empty($docsMr) ? $docsMr : null,
                    ':documents_required_en'    => !empty($docsEn) ? $docsEn : null,
                    ':benefits_mr'              => !empty($benefitsMr) ? $benefitsMr : null,
                    ':benefits_en'              => !empty($benefitsEn) ? $benefitsEn : null,
                    ':official_portal_url'      => $portalUrl,
                    ':cover_image_url'          => $coverUrl,
                    ':display_order'            => $dispOrd,
                    ':published'                => $pub,
                    ':featured'                 => $feat,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM government_schemes WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $newId]);
                $createdScheme = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "शासकीय योजना यशस्वीरित्या जतन केली. (Government scheme successfully created.)",
                    "data" => $createdScheme
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Government scheme creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save scheme to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- INITIATIVES / ACTIVITIES RESOURCE CREATION ---
        if ($resource === 'initiatives' || $resource === 'activities') {
            $titleMr = trim((string)($payload['title_mr'] ?? ($payload['title'] ?? '')));
            $titleEn = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $cat = trim((string)($payload['category'] ?? 'शिक्षण'));
            $actDate = trim((string)($payload['activity_date'] ?? ($payload['date'] ?? '')));
            $locMr = trim((string)($payload['location_mr'] ?? ($payload['location'] ?? '')));
            $locEn = trim((string)($payload['location_en'] ?? ($payload['locationEn'] ?? '')));
            $summaryMr = trim((string)($payload['summary_mr'] ?? ($payload['summary'] ?? '')));
            $summaryEn = trim((string)($payload['summary_en'] ?? ($payload['summaryEn'] ?? '')));
            $descMr = trim((string)($payload['description_mr'] ?? ($payload['description'] ?? '')));
            $descEn = trim((string)($payload['description_en'] ?? ($payload['descriptionEn'] ?? '')));
            $imageUrl = trim((string)($payload['image_url'] ?? ($payload['imageUrl'] ?? '')));
            $isGovt = isset($payload['is_govt_scheme']) ? ((bool)$payload['is_govt_scheme'] ? 1 : 0) : (isset($payload['isGovernmentSchemeAwareness']) ? ((bool)$payload['isGovernmentSchemeAwareness'] ? 1 : 0) : 0);
            $pub = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;
            $feat = isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : 0;
            $relReport = trim((string)($payload['related_report_id'] ?? ($payload['relatedReportId'] ?? '')));
            $tags = $payload['tags'] ?? null;
            $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $photos = $payload['photos'] ?? ($payload['images'] ?? []);

            if (empty($titleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रमाचे नाव (मराठी) आवश्यक आहे. (Initiative title in Marathi is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($titleMr, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रम नाव २५५ अक्षरांपेक्षा कमी असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रमाचा संक्षिप्त सारांश (मराठी) आवश्यक आहे. (Initiative summary in Marathi is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Independent bilingual preservation: fallback to Marathi if English not provided
            if (empty($titleEn)) $titleEn = $titleMr;
            elseif (mb_strlen($titleEn, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryEn)) $summaryEn = $summaryMr;
            if (empty($descMr)) $descMr = $summaryMr;
            if (empty($descEn)) $descEn = $summaryEn;
            if (empty($locMr)) $locMr = 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर';
            if (empty($locEn)) $locEn = 'Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar';
            if (empty($actDate)) $actDate = date('Y-m-d');

            // Cover image validation
            if (empty($imageUrl)) {
                if (!empty($photos) && is_array($photos) && isset($photos[0])) {
                    $firstPhoto = is_array($photos[0]) ? ($photos[0]['image_url'] ?? '') : (string)$photos[0];
                    $imageUrl = trim($firstPhoto);
                }
            }
            if (empty($imageUrl) || !validateImageUrlServer($imageUrl)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS कव्हर फोटो लिंक आवश्यक आहे. (Valid HTTPS cover image URL <= 500 chars required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Validate related_report_id foreign key
            $verifiedReportId = null;
            if (!empty($relReport)) {
                $repCheck = $db->prepare("SELECT id FROM reports WHERE id = :id LIMIT 1");
                $repCheck->execute([':id' => $relReport]);
                if ($repCheck->fetch()) {
                    $verifiedReportId = $relReport;
                }
            }

            // Format tags
            $tagsStr = null;
            if (is_array($tags)) {
                $tagsStr = mb_substr(implode(', ', array_filter(array_map('trim', $tags))), 0, 255, 'UTF-8');
            } elseif (is_string($tags) && !empty(trim($tags))) {
                $tagsStr = mb_substr(trim($tags), 0, 255, 'UTF-8');
            }

            $newId = trim((string)($payload['id'] ?? ''));
            if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{3,64}$/', $newId)) {
                $newId = 'init-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
            }

            try {
                $db->beginTransaction();

                $insStmt = $db->prepare("
                    INSERT INTO initiatives (
                        id, title_mr, title_en, category, activity_date,
                        location_mr, location_en, summary_mr, summary_en,
                        description_mr, description_en, image_url,
                        is_govt_scheme, published, featured, related_report_id,
                        tags, display_order
                    ) VALUES (
                        :id, :title_mr, :title_en, :category, :activity_date,
                        :location_mr, :location_en, :summary_mr, :summary_en,
                        :description_mr, :description_en, :image_url,
                        :is_govt_scheme, :published, :featured, :related_report_id,
                        :tags, :display_order
                    )
                ");
                $insStmt->execute([
                    ':id'               => $newId,
                    ':title_mr'         => mb_substr($titleMr, 0, 255, 'UTF-8'),
                    ':title_en'         => mb_substr($titleEn, 0, 255, 'UTF-8'),
                    ':category'         => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':activity_date'    => mb_substr($actDate, 0, 50, 'UTF-8'),
                    ':location_mr'      => mb_substr($locMr, 0, 255, 'UTF-8'),
                    ':location_en'      => mb_substr($locEn, 0, 255, 'UTF-8'),
                    ':summary_mr'       => $summaryMr,
                    ':summary_en'       => $summaryEn,
                    ':description_mr'   => $descMr,
                    ':description_en'   => $descEn,
                    ':image_url'        => mb_substr($imageUrl, 0, 500, 'UTF-8'),
                    ':is_govt_scheme'   => $isGovt,
                    ':published'        => $pub,
                    ':featured'         => $feat,
                    ':related_report_id'=> $verifiedReportId,
                    ':tags'             => $tagsStr,
                    ':display_order'    => $dispOrd,
                ]);

                // Insert child photos if provided
                if (!empty($photos) && is_array($photos)) {
                    $photoIns = $db->prepare("
                        INSERT INTO initiative_photos (initiative_id, image_url, caption_mr, caption_en, display_order)
                        VALUES (:init_id, :image_url, :caption_mr, :caption_en, :display_order)
                    ");
                    $order = 1;
                    foreach ($photos as $p) {
                        $pUrl = is_array($p) ? trim((string)($p['image_url'] ?? '')) : trim((string)$p);
                        if (!empty($pUrl) && validateImageUrlServer($pUrl)) {
                            $capMr = is_array($p) ? trim((string)($p['caption_mr'] ?? '')) : null;
                            $capEn = is_array($p) ? trim((string)($p['caption_en'] ?? '')) : null;
                            $pOrder = is_array($p) && isset($p['display_order']) ? (int)$p['display_order'] : $order++;
                            $photoIns->execute([
                                ':init_id'      => $newId,
                                ':image_url'    => mb_substr($pUrl, 0, 500, 'UTF-8'),
                                ':caption_mr'   => !empty($capMr) ? mb_substr($capMr, 0, 255, 'UTF-8') : null,
                                ':caption_en'   => !empty($capEn) ? mb_substr($capEn, 0, 255, 'UTF-8') : null,
                                ':display_order'=> $pOrder,
                            ]);
                        }
                    }
                }

                $db->commit();

                // Fetch created initiative with child photos
                $fetchStmt = $db->prepare("SELECT * FROM initiatives WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $newId]);
                $createdInit = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                $photoStmt = $db->prepare("SELECT * FROM initiative_photos WHERE initiative_id = :id ORDER BY display_order ASC");
                $photoStmt->execute([':id' => $newId]);
                $createdInit['photos'] = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "उपक्रम यशस्वीरित्या जतन केला. (Initiative successfully created.)",
                    "data" => $createdInit
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                error_log("Initiative creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save initiative to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- EVENTS RESOURCE CREATION ---
        if ($resource === 'events') {
            $titleMr = trim((string)($payload['title_mr'] ?? ($payload['title'] ?? '')));
            $titleEn = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $cat = trim((string)($payload['category'] ?? 'सर्व'));
            $startDate = trim((string)($payload['start_date'] ?? ($payload['startDate'] ?? '')));
            $endDate = trim((string)($payload['end_date'] ?? ($payload['endDate'] ?? '')));
            $dateTextMr = trim((string)($payload['event_date_text_mr'] ?? ($payload['dateTextMr'] ?? '')));
            $dateTextEn = trim((string)($payload['event_date_text_en'] ?? ($payload['dateTextEn'] ?? '')));
            $eventTime = trim((string)($payload['event_time'] ?? ($payload['time'] ?? '')));
            $venueMr = trim((string)($payload['venue_mr'] ?? ($payload['venue'] ?? '')));
            $venueEn = trim((string)($payload['venue_en'] ?? ($payload['venueEn'] ?? '')));
            $summaryMr = trim((string)($payload['summary_mr'] ?? ($payload['summary'] ?? '')));
            $summaryEn = trim((string)($payload['summary_en'] ?? ($payload['summaryEn'] ?? '')));
            $descMr = trim((string)($payload['description_mr'] ?? ($payload['description'] ?? '')));
            $descEn = trim((string)($payload['description_en'] ?? ($payload['descriptionEn'] ?? '')));
            $coverUrl = trim((string)($payload['cover_image_url'] ?? ($payload['coverImageUrl'] ?? '')));
            $status = trim((string)($payload['status'] ?? 'upcoming'));
            $validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
            if (!in_array($status, $validStatuses, true)) $status = 'upcoming';
            $feat = isset($payload['is_featured']) ? ((bool)$payload['is_featured'] ? 1 : 0) : (isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : 0);
            $pub = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;
            $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $photos = $payload['photos'] ?? ($payload['images'] ?? []);

            if (empty($titleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रमाचे नाव (मराठी) आवश्यक आहे. (Event title is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($titleMr, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "नाव २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रमाचा सारांश आवश्यक आहे. (Event summary is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($startDate)) {
                $startDate = date('Y-m-d');
            } elseif (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अवैध तारीख स्वरूप (YYYY-MM-DD आवश्यक). (Invalid date format YYYY-MM-DD.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (empty($titleEn)) $titleEn = $titleMr;
            elseif (mb_strlen($titleEn, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryEn)) $summaryEn = $summaryMr;
            if (empty($descMr)) $descMr = $summaryMr;
            if (empty($descEn)) $descEn = $summaryEn;
            if (empty($venueMr)) $venueMr = 'नादरपूर, ता. कन्नड';
            if (empty($venueEn)) $venueEn = 'Nadarpur, Tahsil Kannad';

            $validatedEndDate = (!empty($endDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) ? $endDate : null;

            if (!empty($coverUrl)) {
                if (!validateImageUrlServer($coverUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS कव्हर फोटो लिंक आवश्यक आहे. (Valid HTTPS cover URL required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } else {
                $coverUrl = null;
            }

            $newId = trim((string)($payload['id'] ?? ''));
            if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{3,64}$/', $newId)) {
                $newId = 'event-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
            }

            try {
                $db->beginTransaction();

                $insStmt = $db->prepare("
                    INSERT INTO events (
                        id, title_mr, title_en, category, start_date, end_date,
                        event_date_text_mr, event_date_text_en, event_time,
                        venue_mr, venue_en, summary_mr, summary_en,
                        description_mr, description_en, cover_image_url,
                        status, is_featured, published, display_order
                    ) VALUES (
                        :id, :title_mr, :title_en, :category, :start_date, :end_date,
                        :event_date_text_mr, :event_date_text_en, :event_time,
                        :venue_mr, :venue_en, :summary_mr, :summary_en,
                        :description_mr, :description_en, :cover_image_url,
                        :status, :is_featured, :published, :display_order
                    )
                ");
                $insStmt->execute([
                    ':id'                   => $newId,
                    ':title_mr'             => mb_substr($titleMr, 0, 255, 'UTF-8'),
                    ':title_en'             => mb_substr($titleEn, 0, 255, 'UTF-8'),
                    ':category'             => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':start_date'           => $startDate,
                    ':end_date'             => $validatedEndDate,
                    ':event_date_text_mr'   => !empty($dateTextMr) ? mb_substr($dateTextMr, 0, 100, 'UTF-8') : null,
                    ':event_date_text_en'   => !empty($dateTextEn) ? mb_substr($dateTextEn, 0, 100, 'UTF-8') : null,
                    ':event_time'           => !empty($eventTime) ? mb_substr($eventTime, 0, 100, 'UTF-8') : null,
                    ':venue_mr'             => mb_substr($venueMr, 0, 255, 'UTF-8'),
                    ':venue_en'             => mb_substr($venueEn, 0, 255, 'UTF-8'),
                    ':summary_mr'           => $summaryMr,
                    ':summary_en'           => $summaryEn,
                    ':description_mr'       => $descMr,
                    ':description_en'       => $descEn,
                    ':cover_image_url'      => $coverUrl,
                    ':status'               => $status,
                    ':is_featured'          => $feat,
                    ':published'            => $pub,
                    ':display_order'        => $dispOrd,
                ]);

                // Insert event photos
                if (!empty($photos) && is_array($photos)) {
                    $photoIns = $db->prepare("
                        INSERT INTO event_photos (event_id, image_url, caption_mr, caption_en, display_order)
                        VALUES (:event_id, :image_url, :caption_mr, :caption_en, :display_order)
                    ");
                    $order = 1;
                    foreach ($photos as $p) {
                        $pUrl = is_array($p) ? trim((string)($p['image_url'] ?? ($p['imageUrl'] ?? ($p['url'] ?? '')))) : trim((string)$p);
                        if (!empty($pUrl) && validateImageUrlServer($pUrl)) {
                            $capMr = is_array($p) ? trim((string)($p['caption_mr'] ?? ($p['captionMr'] ?? ''))) : null;
                            $capEn = is_array($p) ? trim((string)($p['caption_en'] ?? ($p['captionEn'] ?? ''))) : null;
                            $pOrder = is_array($p) && isset($p['display_order']) ? (int)$p['display_order'] : (is_array($p) && isset($p['displayOrder']) ? (int)$p['displayOrder'] : $order++);
                            $photoIns->execute([
                                ':event_id'     => $newId,
                                ':image_url'    => mb_substr($pUrl, 0, 500, 'UTF-8'),
                                ':caption_mr'   => !empty($capMr) ? mb_substr($capMr, 0, 255, 'UTF-8') : null,
                                ':caption_en'   => !empty($capEn) ? mb_substr($capEn, 0, 255, 'UTF-8') : null,
                                ':display_order'=> $pOrder,
                            ]);
                        }
                    }
                }

                $db->commit();

                $fetchStmt = $db->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $newId]);
                $createdEvent = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                $photoStmt = $db->prepare("SELECT * FROM event_photos WHERE event_id = :id ORDER BY display_order ASC");
                $photoStmt->execute([':id' => $newId]);
                $createdEvent['photos'] = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "कार्यक्रम यशस्वीरित्या जतन केला. (Event successfully created.)",
                    "data" => $createdEvent
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                error_log("Event creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save event to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- OFFICIALS / TEAM RESOURCE MUTATIONS (Batch 3) ---
        if ($resource === 'officials') {
            $nameMr = trim((string)($payload['name_mr'] ?? ($payload['name'] ?? '')));
            $nameEn = trim((string)($payload['name_en'] ?? ($payload['nameEn'] ?? '')));
            $roleMr = trim((string)($payload['role_mr'] ?? ($payload['role'] ?? '')));
            $roleEn = trim((string)($payload['role_en'] ?? ($payload['roleEn'] ?? '')));
            $bioMr  = trim((string)($payload['bio_mr'] ?? ($payload['bio'] ?? '')));
            $bioEn  = trim((string)($payload['bio_en'] ?? ($payload['bioEn'] ?? '')));
            $phone  = trim((string)($payload['phone'] ?? ''));
            $imgUrl = trim((string)($payload['image_url'] ?? ($payload['imageUrl'] ?? '')));
            $dispOrd= isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $pub    = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;

            if (empty($nameMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "पदाधिकाऱ्याचे नाव (मराठी) आवश्यक आहे. (Official Marathi name is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($nameMr, 'UTF-8') > 150) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "नाव १५० अक्षरांपेक्षा लहान असावे. (Name must be <= 150 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (empty($nameEn)) {
                $nameEn = $nameMr;
            } elseif (mb_strlen($nameEn, 'UTF-8') > 150) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English name must be <= 150 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (empty($roleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "पद / भूमिका (मराठी) आवश्यक आहे. (Official Marathi role is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($roleMr, 'UTF-8') > 150) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "पद १५० अक्षरांपेक्षा लहान असावे. (Role must be <= 150 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (empty($roleEn)) {
                $roleEn = $roleMr;
            } elseif (mb_strlen($roleEn, 'UTF-8') > 150) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English role must be <= 150 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (!empty($phone) && mb_strlen($phone, 'UTF-8') > 50) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "Phone number must be <= 50 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (empty($imgUrl) || !validateImageUrlServer($imgUrl)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS फोटो लिंक आवश्यक आहे. (Valid HTTPS image URL is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // ID Generation or Validation
            $id = trim((string)($payload['id'] ?? ''));
            if (!empty($id)) {
                if (!preg_match('/^[a-zA-Z0-9_\-]{2,64}$/', $id)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "Invalid ID format."], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                $chk = $db->prepare("SELECT id FROM officials WHERE id = ?");
                $chk->execute([$id]);
                if ($chk->fetch()) {
                    http_response_code(409);
                    echo json_encode(["status" => "error", "success" => false, "message" => "An official with this ID already exists."], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } else {
                $id = 'off-' . substr(bin2hex(random_bytes(6)), 0, 10);
            }

            try {
                $stmt = $db->prepare("
                    INSERT INTO officials (
                        id, name_mr, name_en, role_mr, role_en, bio_mr, bio_en,
                        phone, image_url, display_order, published
                    ) VALUES (
                        :id, :name_mr, :name_en, :role_mr, :role_en, :bio_mr, :bio_en,
                        :phone, :image_url, :display_order, :published
                    )
                ");
                $stmt->execute([
                    ':id'           => $id,
                    ':name_mr'      => $nameMr,
                    ':name_en'      => $nameEn,
                    ':role_mr'      => $roleMr,
                    ':role_en'      => $roleEn,
                    ':bio_mr'       => $bioMr ?: null,
                    ':bio_en'       => $bioEn ?: null,
                    ':phone'        => $phone ?: null,
                    ':image_url'    => $imgUrl,
                    ':display_order'=> $dispOrd,
                    ':published'    => $pub
                ]);

                $fetchStmt = $db->prepare("
                    SELECT id, name_mr, name_en, role_mr, role_en, bio_mr, bio_en,
                           phone, image_url, display_order, published, created_at, updated_at
                    FROM officials 
                    WHERE id = ?
                ");
                $fetchStmt->execute([$id]);
                $createdOfficial = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "पदाधिकारी यशस्वीरित्या जोडले. (Official successfully created.)",
                    "data" => $createdOfficial
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Official creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save official to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GALLERY ALBUMS RESOURCE MUTATIONS ---
        if ($resource === 'albums' || $resource === 'gallery_albums') {
            $titleMr = trim((string)($payload['title_mr'] ?? ($payload['title'] ?? '')));
            $titleEn = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $descMr  = trim((string)($payload['description_mr'] ?? ($payload['description'] ?? '')));
            $descEn  = trim((string)($payload['description_en'] ?? ($payload['descriptionEn'] ?? '')));
            $cat     = trim((string)($payload['category'] ?? 'इतर'));
            $covUrl  = trim((string)($payload['cover_image_url'] ?? ($payload['coverImageUrl'] ?? '')));
            $evDate  = trim((string)($payload['event_date'] ?? ($payload['eventDate'] ?? '')));
            $dispMode= strtolower(trim((string)($payload['display_mode'] ?? ($payload['displayMode'] ?? 'grid'))));
            $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $pub     = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;

            if (empty($titleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अल्बम शीर्षक (मराठी) आवश्यक आहे. (Album Marathi title is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($titleMr, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे."], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (empty($titleEn)) {
                $titleEn = $titleMr;
            } elseif (mb_strlen($titleEn, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }

            if (!in_array($dispMode, ['grid', 'carousel'], true)) {
                $dispMode = 'grid';
            }

            if (!empty($covUrl) && !validateImageUrlServer($covUrl)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS किंवा सर्व्हर कव्हर फोटो लिंक आवश्यक आहे. Base64 समर्थित नाही."], JSON_UNESCAPED_UNICODE);
                exit();
            }

            $newId = trim((string)($payload['id'] ?? ''));
            if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{2,64}$/', $newId)) {
                $newId = 'alb-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
            }

            try {
                $insStmt = $db->prepare("
                    INSERT INTO gallery_albums (
                        id, title_mr, title_en, description_mr, description_en,
                        category, cover_image_url, event_date, display_mode,
                        display_order, published
                    ) VALUES (
                        :id, :title_mr, :title_en, :description_mr, :description_en,
                        :category, :cover_image_url, :event_date, :display_mode,
                        :display_order, :published
                    )
                ");
                $insStmt->execute([
                    ':id'               => $newId,
                    ':title_mr'         => $titleMr,
                    ':title_en'         => $titleEn,
                    ':description_mr'   => !empty($descMr) ? $descMr : null,
                    ':description_en'   => !empty($descEn) ? $descEn : null,
                    ':category'         => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':cover_image_url'  => !empty($covUrl) ? mb_substr($covUrl, 0, 500, 'UTF-8') : null,
                    ':event_date'       => !empty($evDate) ? $evDate : null,
                    ':display_mode'     => $dispMode,
                    ':display_order'    => $dispOrd,
                    ':published'        => $pub,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM gallery_albums WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $newId]);
                $createdAlbum = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "अल्बम यशस्वीरित्या तयार केला. (Album created successfully.)",
                    "data" => $createdAlbum
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Album creation failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save album to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GALLERY PHOTOS RESOURCE MUTATIONS ---
        if ($resource === 'gallery' || $resource === 'gallery_photos') {
            $isBatch = false;
            $photoItems = [];
            if (isset($payload['photos']) && is_array($payload['photos'])) {
                $isBatch = true;
                $photoItems = $payload['photos'];
            } elseif (isset($payload[0]) && is_array($payload[0])) {
                $isBatch = true;
                $photoItems = $payload;
            } else {
                $photoItems = [$payload];
            }

            if (empty($photoItems)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "कृपया किमान एक फोटो पाठवा. (Please provide at least one photo.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $db->beginTransaction();

                $insertedPhotos = [];
                $insStmt = $db->prepare("
                    INSERT INTO gallery_photos (
                        id, album_id, activity_id, title_mr, title_en, caption_mr, caption_en,
                        alt_text_mr, alt_text_en, category, image_url, year,
                        featured_on_home, display_order, published
                    ) VALUES (
                        :id, :album_id, :activity_id, :title_mr, :title_en, :caption_mr, :caption_en,
                        :alt_text_mr, :alt_text_en, :category, :image_url, :year,
                        :featured_on_home, :display_order, :published
                    )
                ");

                foreach ($photoItems as $index => $item) {
                    $imgUrl = trim((string)($item['image_url'] ?? ($item['imageUrl'] ?? '')));
                    if (empty($imgUrl) || !validateImageUrlServer($imgUrl)) {
                        $db->rollBack();
                        http_response_code(400);
                        echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS किंवा सर्व्हर फोटो लिंक आवश्यक आहे (आयटम " . ($index + 1) . "). Base64 समर्थित नाही."], JSON_UNESCAPED_UNICODE);
                        exit();
                    }

                    $albumId = trim((string)($item['album_id'] ?? ($item['albumId'] ?? '')));
                    $validAlbumId = null;
                    if (!empty($albumId)) {
                        $chkAlb = $db->prepare("SELECT id FROM gallery_albums WHERE id = ? LIMIT 1");
                        $chkAlb->execute([$albumId]);
                        if ($chkAlb->fetch()) {
                            $validAlbumId = $albumId;
                        }
                    }

                    $titleMr = trim((string)($item['title_mr'] ?? ($item['title'] ?? '')));
                    $titleEn = trim((string)($item['title_en'] ?? ($item['titleEn'] ?? '')));
                    if (empty($titleMr)) {
                        $titleMr = 'छायाचित्र ' . ($index + 1);
                    }
                    if (empty($titleEn)) {
                        $titleEn = !empty($item['titleEn']) ? trim((string)$item['titleEn']) : $titleMr;
                    }

                    $capMr   = trim((string)($item['caption_mr'] ?? ($item['caption'] ?? '')));
                    $capEn   = trim((string)($item['caption_en'] ?? ($item['captionEn'] ?? '')));
                    $altMr   = trim((string)($item['alt_text_mr'] ?? ($item['altTextMr'] ?? $titleMr)));
                    $altEn   = trim((string)($item['alt_text_en'] ?? ($item['altTextEn'] ?? $titleEn)));
                    $cat     = trim((string)($item['category'] ?? 'इतर'));
                    $year    = isset($item['year']) ? (int)$item['year'] : (int)date('Y');
                    $feat    = isset($item['featured_on_home']) ? ((bool)$item['featured_on_home'] ? 1 : 0) : (isset($item['featuredOnHome']) ? ((bool)$item['featuredOnHome'] ? 1 : 0) : 0);
                    $dispOrd = isset($item['display_order']) ? (int)$item['display_order'] : (isset($item['displayOrder']) ? (int)$item['displayOrder'] : $index);
                    $pub     = isset($item['published']) ? ((bool)$item['published'] ? 1 : 0) : 1;

                    $newId = trim((string)($item['id'] ?? ''));
                    if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{2,64}$/', $newId)) {
                        $newId = 'gal-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6) . '-' . $index;
                    }

                    $insStmt->execute([
                        ':id'               => $newId,
                        ':album_id'         => $validAlbumId,
                        ':activity_id'      => !empty($item['activity_id']) ? trim((string)$item['activity_id']) : null,
                        ':title_mr'         => mb_substr($titleMr, 0, 255, 'UTF-8'),
                        ':title_en'         => mb_substr($titleEn, 0, 255, 'UTF-8'),
                        ':caption_mr'       => !empty($capMr) ? $capMr : $titleMr,
                        ':caption_en'       => !empty($capEn) ? $capEn : $titleEn,
                        ':alt_text_mr'      => mb_substr($altMr, 0, 255, 'UTF-8'),
                        ':alt_text_en'      => mb_substr($altEn, 0, 255, 'UTF-8'),
                        ':category'         => mb_substr($cat, 0, 100, 'UTF-8'),
                        ':image_url'        => mb_substr($imgUrl, 0, 500, 'UTF-8'),
                        ':year'             => $year,
                        ':featured_on_home' => $feat,
                        ':display_order'    => $dispOrd,
                        ':published'        => $pub,
                    ]);

                    $fStmt = $db->prepare("SELECT * FROM gallery_photos WHERE id = ? LIMIT 1");
                    $fStmt->execute([$newId]);
                    $insertedPhotos[] = $fStmt->fetch(PDO::FETCH_ASSOC);
                }

                $db->commit();

                http_response_code(201);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => count($insertedPhotos) . " फोटो यशस्वीरित्या जतन केले. (" . count($insertedPhotos) . " photo(s) saved successfully.)",
                    "data"    => $isBatch ? $insertedPhotos : $insertedPhotos[0]
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                error_log("Gallery photo insertion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save photo(s) to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- REPORTS RESOURCE MUTATIONS ---
        if ($resource === 'reports') {
            $titleMr = trim((string)($payload['title_mr'] ?? ($payload['title'] ?? '')));
            $titleEn = trim((string)($payload['title_en'] ?? ($payload['titleEn'] ?? '')));
            $periodMr = trim((string)($payload['period_mr'] ?? ($payload['period'] ?? '')));
            $periodEn = trim((string)($payload['period_en'] ?? ($payload['periodEn'] ?? '')));
            $reportDate = trim((string)($payload['report_date'] ?? ($payload['date'] ?? date('Y-m-d'))));
            $fileSize = trim((string)($payload['file_size'] ?? ($payload['fileSize'] ?? 'PDF')));
            $catMr = trim((string)($payload['category_mr'] ?? ($payload['category'] ?? 'वार्षिक अहवाल')));
            $catEn = trim((string)($payload['category_en'] ?? ($payload['categoryEn'] ?? 'Annual Report')));
            $summaryMr = trim((string)($payload['summary_mr'] ?? ($payload['summary'] ?? '')));
            $summaryEn = trim((string)($payload['summary_en'] ?? ($payload['summaryEn'] ?? '')));
            $pdfUrl = trim((string)($payload['pdf_url'] ?? ($payload['pdfPlaceholderUrl'] ?? '#')));
            $coverUrl = trim((string)($payload['cover_image_url'] ?? ($payload['coverImageUrl'] ?? '')));
            $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : 0);
            $pub = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : 1;

            if (empty($titleMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल शीर्षक (मराठी) आवश्यक आहे. (Marathi report title is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($titleMr, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल शीर्षक २५५ अक्षरांपेक्षा लहान असावे. (Report title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($periodMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "आर्थिक वर्ष / कालावधी (मराठी) आवश्यक आहे. (Period/year is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (mb_strlen($periodMr, 'UTF-8') > 100) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "कालावधी १०० अक्षरांपेक्षा लहान असावा. (Period must be <= 100 characters.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (empty($summaryMr)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल सारांश (मराठी) आवश्यक आहे. (Report summary is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Independent bilingual preservation: do not overwrite English with Marathi!
            if (!empty($titleEn) && mb_strlen($titleEn, 'UTF-8') > 255) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English report title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }
            if (!empty($periodEn) && mb_strlen($periodEn, 'UTF-8') > 100) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "English period must be <= 100 characters."], JSON_UNESCAPED_UNICODE);
                exit();
            }

            // Validate PDF URL if supplied
            if (!empty($pdfUrl) && $pdfUrl !== '#') {
                if (!validatePdfUrlServer($pdfUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "वैध PDF फाइल लिंक आवश्यक आहे. (Valid PDF link or server path is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } else {
                $pdfUrl = '#';
            }

            // Validate cover image if supplied
            if (!empty($coverUrl)) {
                if (!validateImageUrlServer($coverUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "कव्हर फोटोसाठी वैध इमेज लिंक आवश्यक आहे. (Valid cover image URL is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
            } else {
                $coverUrl = null;
            }

            // ID generation: accept valid client ID or generate safe unique ID
            $newId = trim((string)($payload['id'] ?? ''));
            if (empty($newId) || !preg_match('/^[a-zA-Z0-9_\-]{3,64}$/', $newId)) {
                $newId = 'rep-' . time() . '-' . substr(bin2hex(random_bytes(4)), 0, 6);
            }

            try {
                $insStmt = $db->prepare("
                    INSERT INTO reports (
                        id, title_mr, title_en, period_mr, period_en, report_date,
                        file_size, category_mr, category_en, summary_mr, summary_en,
                        pdf_url, cover_image_url, display_order, published
                    ) VALUES (
                        :id, :title_mr, :title_en, :period_mr, :period_en, :report_date,
                        :file_size, :category_mr, :category_en, :summary_mr, :summary_en,
                        :pdf_url, :cover_image_url, :display_order, :published
                    )
                ");
                $insStmt->execute([
                    ':id'              => $newId,
                    ':title_mr'        => $titleMr,
                    ':title_en'        => $titleEn,
                    ':period_mr'       => $periodMr,
                    ':period_en'       => $periodEn,
                    ':report_date'     => $reportDate,
                    ':file_size'       => $fileSize,
                    ':category_mr'     => $catMr,
                    ':category_en'     => $catEn,
                    ':summary_mr'      => $summaryMr,
                    ':summary_en'      => $summaryEn,
                    ':pdf_url'         => $pdfUrl,
                    ':cover_image_url' => $coverUrl,
                    ':display_order'   => $dispOrd,
                    ':published'       => $pub,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM reports WHERE id = ? LIMIT 1");
                $fetchStmt->execute([$newId]);
                $createdReport = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(201);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "id"      => $newId,
                    "message" => "अहवाल यशस्वीरित्या जोडला गेला. (Report created successfully.)",
                    "data"    => $createdReport
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Report insert failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to save report to database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Administrative mutations (POST) for resource '{$resource}' are scheduled for Phase 2.2B."
        ], JSON_UNESCAPED_UNICODE);
        exit();

    // ========================================================================
    // PUT: Administrative Updates (Protected)
    // ========================================================================
    case 'PUT':
        $currentAdmin = authenticateAdmin($db);
        $payload = json_decode(file_get_contents("php://input"), true) ?: [];

        if ($resource === 'videos') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ आयडी आवश्यक आहे. (Video ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM videos WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ सापडला नाही. (Video not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Preserve existing fields on partial update
                $titleMr = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $descMr  = isset($payload['description_mr']) ? trim((string)$payload['description_mr']) : (isset($payload['description']) ? trim((string)$payload['description']) : $existing['description_mr']);
                $descEn  = isset($payload['description_en']) ? trim((string)$payload['description_en']) : (isset($payload['descriptionEn']) ? trim((string)$payload['descriptionEn']) : $existing['description_en']);
                $cat     = isset($payload['category']) ? trim((string)$payload['category']) : $existing['category'];
                $vUrl    = isset($payload['video_url']) ? trim((string)$payload['video_url']) : (isset($payload['videoUrl']) ? trim((string)$payload['videoUrl']) : $existing['video_url']);
                $tUrl    = isset($payload['thumbnail_url']) ? trim((string)$payload['thumbnail_url']) : (isset($payload['thumbnailUrl']) ? trim((string)$payload['thumbnailUrl']) : $existing['thumbnail_url']);
                $pDate   = isset($payload['publish_date']) ? trim((string)$payload['publish_date']) : (isset($payload['date']) ? trim((string)$payload['date']) : $existing['publish_date']);
                $relAct  = isset($payload['related_activity_title']) ? trim((string)$payload['related_activity_title']) : (isset($payload['relatedActivityTitle']) ? trim((string)$payload['relatedActivityTitle']) : $existing['related_activity_title']);
                $durSec  = isset($payload['duration_seconds']) ? (int)$payload['duration_seconds'] : (isset($payload['durationSeconds']) ? (int)$payload['durationSeconds'] : (int)$existing['duration_seconds']);
                $durFmt  = isset($payload['duration_formatted']) ? trim((string)$payload['duration_formatted']) : (isset($payload['durationFormatted']) ? trim((string)$payload['durationFormatted']) : $existing['duration_formatted']);
                $durFmtEn= isset($payload['duration_formatted_en']) ? trim((string)$payload['duration_formatted_en']) : (isset($payload['durationFormattedEn']) ? trim((string)$payload['durationFormattedEn']) : $existing['duration_formatted_en']);
                $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $pub     = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];
                $feat    = isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : (int)$existing['featured'];

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ शीर्षक (मराठी) आवश्यक आहे. (Marathi title is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (mb_strlen($titleMr, 'UTF-8') > 255 || mb_strlen($titleEn, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($descMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ माहिती (मराठी) आवश्यक आहे. (Marathi description is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Server-side video URL validation if changed
                $vCheck = validateVideoUrlServer($vUrl);
                if (!$vCheck['isValid']) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => $vCheck['error']], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Server-side thumbnail URL validation if changed
                if (!empty($tUrl) && !validateThumbnailUrlServer($tUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS कव्हर फोटो लिंक आवश्यक आहे. (Valid HTTPS cover image URL <= 500 chars is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $upStmt = $db->prepare("
                    UPDATE videos SET
                        title_mr = :title_mr,
                        title_en = :title_en,
                        description_mr = :description_mr,
                        description_en = :description_en,
                        category = :category,
                        duration_seconds = :duration_seconds,
                        duration_formatted = :duration_formatted,
                        duration_formatted_en = :duration_formatted_en,
                        thumbnail_url = :thumbnail_url,
                        video_url = :video_url,
                        publish_date = :publish_date,
                        related_activity_title = :related_activity_title,
                        display_order = :display_order,
                        published = :published,
                        featured = :featured
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'                   => $id,
                    ':title_mr'             => $titleMr,
                    ':title_en'             => $titleEn,
                    ':description_mr'       => $descMr,
                    ':description_en'       => $descEn,
                    ':category'             => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':duration_seconds'     => $durSec,
                    ':duration_formatted'   => mb_substr($durFmt, 0, 32, 'UTF-8'),
                    ':duration_formatted_en'=> mb_substr($durFmtEn, 0, 32, 'UTF-8'),
                    ':thumbnail_url'        => mb_substr($tUrl, 0, 500, 'UTF-8'),
                    ':video_url'            => mb_substr($vUrl, 0, 500, 'UTF-8'),
                    ':publish_date'         => mb_substr($pDate, 0, 50, 'UTF-8'),
                    ':related_activity_title'=> !empty($relAct) ? mb_substr($relAct, 0, 255, 'UTF-8') : null,
                    ':display_order'        => $dispOrd,
                    ':published'            => $pub,
                    ':featured'             => $feat,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM videos WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedVideo = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "व्हिडिओ माहिती अद्ययावत केली. (Video successfully updated.)",
                    "data" => $updatedVideo
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Video update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update video in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- ANNOUNCEMENTS RESOURCE UPDATE ---
        if ($resource === 'announcements') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "बातम्या / कार्यक्रम आयडी आवश्यक आहे. (Announcement ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM announcements WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "बातम्या / कार्यक्रम सापडला नाही. (Announcement not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $titleMr = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $summaryMr = isset($payload['summary_mr']) ? trim((string)$payload['summary_mr']) : (isset($payload['summary']) ? trim((string)$payload['summary']) : $existing['summary_mr']);
                $summaryEn = isset($payload['summary_en']) ? trim((string)$payload['summary_en']) : (isset($payload['summaryEn']) ? trim((string)$payload['summaryEn']) : $existing['summary_en']);
                $contentMr = isset($payload['content_mr']) ? trim((string)$payload['content_mr']) : (isset($payload['content']) ? trim((string)$payload['content']) : $existing['content_mr']);
                $contentEn = isset($payload['content_en']) ? trim((string)$payload['content_en']) : (isset($payload['contentEn']) ? trim((string)$payload['contentEn']) : $existing['content_en']);
                $category = isset($payload['category']) ? trim((string)$payload['category']) : $existing['category'];
                $eventDateMr = isset($payload['event_date_mr']) ? trim((string)$payload['event_date_mr']) : (isset($payload['date']) ? trim((string)$payload['date']) : $existing['event_date_mr']);
                $eventDateEn = isset($payload['event_date_en']) ? trim((string)$payload['event_date_en']) : (isset($payload['dateEn']) ? trim((string)$payload['dateEn']) : $existing['event_date_en']);
                $isUpcoming = isset($payload['is_upcoming']) ? ((bool)$payload['is_upcoming'] ? 1 : 0) : (isset($payload['isUpcoming']) ? ((bool)$payload['isUpcoming'] ? 1 : 0) : (int)$existing['is_upcoming']);
                $coverUrl = isset($payload['cover_image_url']) ? trim((string)$payload['cover_image_url']) : (isset($payload['coverImageUrl']) ? trim((string)$payload['coverImageUrl']) : $existing['cover_image_url']);
                $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $pub = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक (मराठी) आवश्यक आहे. (Marathi title is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (mb_strlen($titleMr, 'UTF-8') > 255 || mb_strlen($titleEn, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($summaryMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "सारांश (मराठी) आवश्यक आहे. (Marathi summary is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                if (!empty($coverUrl)) {
                    if (!validateThumbnailUrlServer($coverUrl)) {
                        http_response_code(400);
                        echo json_encode(["status" => "error", "success" => false, "message" => "कव्हर फोटोसाठी वैध HTTPS लिंक आवश्यक आहे. (Valid HTTPS cover URL required.)"], JSON_UNESCAPED_UNICODE);
                        exit();
                    }
                } else {
                    $coverUrl = null;
                }

                $upStmt = $db->prepare("
                    UPDATE announcements SET
                        title_mr = :title_mr,
                        title_en = :title_en,
                        event_date_mr = :event_date_mr,
                        event_date_en = :event_date_en,
                        is_upcoming = :is_upcoming,
                        category = :category,
                        summary_mr = :summary_mr,
                        summary_en = :summary_en,
                        content_mr = :content_mr,
                        content_en = :content_en,
                        cover_image_url = :cover_image_url,
                        display_order = :display_order,
                        published = :published
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'               => $id,
                    ':title_mr'         => $titleMr,
                    ':title_en'         => $titleEn,
                    ':event_date_mr'    => mb_substr($eventDateMr, 0, 50, 'UTF-8'),
                    ':event_date_en'    => mb_substr($eventDateEn, 0, 50, 'UTF-8'),
                    ':is_upcoming'      => $isUpcoming,
                    ':category'         => mb_substr($category, 0, 100, 'UTF-8'),
                    ':summary_mr'       => $summaryMr,
                    ':summary_en'       => $summaryEn,
                    ':content_mr'       => $contentMr,
                    ':content_en'       => $contentEn,
                    ':cover_image_url'  => $coverUrl,
                    ':display_order'    => $dispOrd,
                    ':published'        => $pub,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM announcements WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedItem = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "बातम्या / कार्यक्रम अद्ययावत केला. (Announcement successfully updated.)",
                    "data" => $updatedItem
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Announcement update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update announcement in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GOVERNMENT SCHEMES RESOURCE UPDATE ---
        if ($resource === 'schemes' || $resource === 'government_schemes') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजना आयडी आवश्यक आहे. (Scheme ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM government_schemes WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजना सापडली नाही. (Government scheme not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $titleMr = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $deptMr = isset($payload['department_mr']) ? trim((string)$payload['department_mr']) : (isset($payload['department']) ? trim((string)$payload['department']) : $existing['department_mr']);
                $deptEn = isset($payload['department_en']) ? trim((string)$payload['department_en']) : (isset($payload['departmentEn']) ? trim((string)$payload['departmentEn']) : $existing['department_en']);
                $benCatMr = isset($payload['beneficiary_category_mr']) ? trim((string)$payload['beneficiary_category_mr']) : (isset($payload['beneficiaryCategory']) ? trim((string)$payload['beneficiaryCategory']) : $existing['beneficiary_category_mr']);
                $benCatEn = isset($payload['beneficiary_category_en']) ? trim((string)$payload['beneficiary_category_en']) : (isset($payload['beneficiaryCategoryEn']) ? trim((string)$payload['beneficiaryCategoryEn']) : $existing['beneficiary_category_en']);
                $summaryMr = isset($payload['summary_mr']) ? trim((string)$payload['summary_mr']) : (isset($payload['summary']) ? trim((string)$payload['summary']) : $existing['summary_mr']);
                $summaryEn = isset($payload['summary_en']) ? trim((string)$payload['summary_en']) : (isset($payload['summaryEn']) ? trim((string)$payload['summaryEn']) : $existing['summary_en']);
                $eligMr = isset($payload['eligibility_mr']) ? trim((string)$payload['eligibility_mr']) : (isset($payload['eligibility']) ? trim((string)$payload['eligibility']) : $existing['eligibility_mr']);
                $eligEn = isset($payload['eligibility_en']) ? trim((string)$payload['eligibility_en']) : (isset($payload['eligibilityEn']) ? trim((string)$payload['eligibilityEn']) : $existing['eligibility_en']);
                $docsMr = isset($payload['documents_required_mr']) ? trim((string)$payload['documents_required_mr']) : (isset($payload['documentsRequired']) ? trim((string)$payload['documentsRequired']) : $existing['documents_required_mr']);
                $docsEn = isset($payload['documents_required_en']) ? trim((string)$payload['documents_required_en']) : (isset($payload['documentsRequiredEn']) ? trim((string)$payload['documentsRequiredEn']) : $existing['documents_required_en']);
                $benefitsMr = isset($payload['benefits_mr']) ? trim((string)$payload['benefits_mr']) : (isset($payload['benefits']) ? trim((string)$payload['benefits']) : $existing['benefits_mr']);
                $benefitsEn = isset($payload['benefits_en']) ? trim((string)$payload['benefits_en']) : (isset($payload['benefitsEn']) ? trim((string)$payload['benefitsEn']) : $existing['benefits_en']);
                $portalUrl = isset($payload['official_portal_url']) ? trim((string)$payload['official_portal_url']) : (isset($payload['officialPortalUrl']) ? trim((string)$payload['officialPortalUrl']) : $existing['official_portal_url']);
                $coverUrl = isset($payload['cover_image_url']) ? trim((string)$payload['cover_image_url']) : (isset($payload['coverImageUrl']) ? trim((string)$payload['coverImageUrl']) : $existing['cover_image_url']);
                $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $pub = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];
                $feat = isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : (int)$existing['featured'];

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजनेचे नाव (मराठी) आवश्यक आहे. (Scheme title is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (mb_strlen($titleMr, 'UTF-8') > 255 || mb_strlen($titleEn, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($summaryMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजनेचा सारांश (मराठी) आवश्यक आहे. (Scheme summary is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                if (!empty($portalUrl)) {
                    $pParsed = parse_url($portalUrl);
                    if (!$pParsed || empty($pParsed['scheme']) || strtolower($pParsed['scheme']) !== 'https' || mb_strlen($portalUrl, 'UTF-8') > 500) {
                        http_response_code(400);
                        echo json_encode(["status" => "error", "success" => false, "message" => "अधिकृत पोर्टलसाठी वैध HTTPS लिंक आवश्यक आहे. (Valid HTTPS portal URL <= 500 chars required.)"], JSON_UNESCAPED_UNICODE);
                        exit();
                    }
                } else {
                    $portalUrl = null;
                }

                if (!empty($coverUrl)) {
                    if (!validateThumbnailUrlServer($coverUrl)) {
                        http_response_code(400);
                        echo json_encode(["status" => "error", "success" => false, "message" => "कव्हर फोटोसाठी वैध HTTPS लिंक आवश्यक आहे. (Valid HTTPS cover URL required.)"], JSON_UNESCAPED_UNICODE);
                        exit();
                    }
                } else {
                    $coverUrl = null;
                }

                $upStmt = $db->prepare("
                    UPDATE government_schemes SET
                        title_mr = :title_mr,
                        title_en = :title_en,
                        department_mr = :department_mr,
                        department_en = :department_en,
                        beneficiary_category_mr = :beneficiary_category_mr,
                        beneficiary_category_en = :beneficiary_category_en,
                        summary_mr = :summary_mr,
                        summary_en = :summary_en,
                        eligibility_mr = :eligibility_mr,
                        eligibility_en = :eligibility_en,
                        documents_required_mr = :documents_required_mr,
                        documents_required_en = :documents_required_en,
                        benefits_mr = :benefits_mr,
                        benefits_en = :benefits_en,
                        official_portal_url = :official_portal_url,
                        cover_image_url = :cover_image_url,
                        display_order = :display_order,
                        published = :published,
                        featured = :featured
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'                       => $id,
                    ':title_mr'                 => $titleMr,
                    ':title_en'                 => $titleEn,
                    ':department_mr'            => !empty($deptMr) ? mb_substr($deptMr, 0, 255, 'UTF-8') : null,
                    ':department_en'            => !empty($deptEn) ? mb_substr($deptEn, 0, 255, 'UTF-8') : null,
                    ':beneficiary_category_mr'  => !empty($benCatMr) ? mb_substr($benCatMr, 0, 255, 'UTF-8') : null,
                    ':beneficiary_category_en'  => !empty($benCatEn) ? mb_substr($benCatEn, 0, 255, 'UTF-8') : null,
                    ':summary_mr'               => $summaryMr,
                    ':summary_en'               => $summaryEn,
                    ':eligibility_mr'           => !empty($eligMr) ? $eligMr : null,
                    ':eligibility_en'           => !empty($eligEn) ? $eligEn : null,
                    ':documents_required_mr'    => !empty($docsMr) ? $docsMr : null,
                    ':documents_required_en'    => !empty($docsEn) ? $docsEn : null,
                    ':benefits_mr'              => !empty($benefitsMr) ? $benefitsMr : null,
                    ':benefits_en'              => !empty($benefitsEn) ? $benefitsEn : null,
                    ':official_portal_url'      => $portalUrl,
                    ':cover_image_url'          => $coverUrl,
                    ':display_order'            => $dispOrd,
                    ':published'                => $pub,
                    ':featured'                 => $feat,
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM government_schemes WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedScheme = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "शासकीय योजना अद्ययावत केली. (Government scheme successfully updated.)",
                    "data" => $updatedScheme
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Government scheme update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update scheme in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- INITIATIVES / ACTIVITIES RESOURCE UPDATE ---
        if ($resource === 'initiatives' || $resource === 'activities') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रम आयडी आवश्यक आहे. (Initiative ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM initiatives WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रम सापडला नाही. (Initiative not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Preserve independent Marathi and English fields on partial update
                $titleMr  = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn  = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $cat      = isset($payload['category']) ? trim((string)$payload['category']) : $existing['category'];
                $actDate  = isset($payload['activity_date']) ? trim((string)$payload['activity_date']) : (isset($payload['date']) ? trim((string)$payload['date']) : $existing['activity_date']);
                $locMr    = isset($payload['location_mr']) ? trim((string)$payload['location_mr']) : (isset($payload['location']) ? trim((string)$payload['location']) : $existing['location_mr']);
                $locEn    = isset($payload['location_en']) ? trim((string)$payload['location_en']) : (isset($payload['locationEn']) ? trim((string)$payload['locationEn']) : $existing['location_en']);
                $summaryMr= isset($payload['summary_mr']) ? trim((string)$payload['summary_mr']) : (isset($payload['summary']) ? trim((string)$payload['summary']) : $existing['summary_mr']);
                $summaryEn= isset($payload['summary_en']) ? trim((string)$payload['summary_en']) : (isset($payload['summaryEn']) ? trim((string)$payload['summaryEn']) : $existing['summary_en']);
                $descMr   = isset($payload['description_mr']) ? trim((string)$payload['description_mr']) : (isset($payload['description']) ? trim((string)$payload['description']) : $existing['description_mr']);
                $descEn   = isset($payload['description_en']) ? trim((string)$payload['description_en']) : (isset($payload['descriptionEn']) ? trim((string)$payload['descriptionEn']) : $existing['description_en']);
                $imageUrl = isset($payload['image_url']) ? trim((string)$payload['image_url']) : (isset($payload['imageUrl']) ? trim((string)$payload['imageUrl']) : $existing['image_url']);
                $isGovt   = isset($payload['is_govt_scheme']) ? ((bool)$payload['is_govt_scheme'] ? 1 : 0) : (isset($payload['isGovernmentSchemeAwareness']) ? ((bool)$payload['isGovernmentSchemeAwareness'] ? 1 : 0) : (int)$existing['is_govt_scheme']);
                $pub      = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];
                $feat     = isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : (int)$existing['featured'];
                $dispOrd  = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);

                // Related report ID handling with FK integrity
                $relReport = isset($payload['related_report_id']) ? trim((string)$payload['related_report_id']) : (isset($payload['relatedReportId']) ? trim((string)$payload['relatedReportId']) : $existing['related_report_id']);
                $verifiedReportId = null;
                if (!empty($relReport)) {
                    $repCheck = $db->prepare("SELECT id FROM reports WHERE id = :id LIMIT 1");
                    $repCheck->execute([':id' => $relReport]);
                    if ($repCheck->fetch()) {
                        $verifiedReportId = $relReport;
                    }
                }

                // Tags handling
                $tagsStr = $existing['tags'];
                if (array_key_exists('tags', $payload)) {
                    $tags = $payload['tags'];
                    if (is_array($tags)) {
                        $tagsStr = mb_substr(implode(', ', array_filter(array_map('trim', $tags))), 0, 255, 'UTF-8');
                    } elseif (is_string($tags) && !empty(trim($tags))) {
                        $tagsStr = mb_substr(trim($tags), 0, 255, 'UTF-8');
                    } else {
                        $tagsStr = null;
                    }
                }

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रमाचे नाव (मराठी) आवश्यक आहे. (Initiative title is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (mb_strlen($titleMr, 'UTF-8') > 255 || mb_strlen($titleEn, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "नाव २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($summaryMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रमाचा सारांश आवश्यक आहे. (Summary is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (!empty($imageUrl) && !validateImageUrlServer($imageUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS कव्हर फोटो लिंक आवश्यक आहे. (Valid HTTPS cover image URL required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $db->beginTransaction();

                $upStmt = $db->prepare("
                    UPDATE initiatives SET
                        title_mr = :title_mr,
                        title_en = :title_en,
                        category = :category,
                        activity_date = :activity_date,
                        location_mr = :location_mr,
                        location_en = :location_en,
                        summary_mr = :summary_mr,
                        summary_en = :summary_en,
                        description_mr = :description_mr,
                        description_en = :description_en,
                        image_url = :image_url,
                        is_govt_scheme = :is_govt_scheme,
                        published = :published,
                        featured = :featured,
                        related_report_id = :related_report_id,
                        tags = :tags,
                        display_order = :display_order
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'               => $id,
                    ':title_mr'         => mb_substr($titleMr, 0, 255, 'UTF-8'),
                    ':title_en'         => mb_substr($titleEn, 0, 255, 'UTF-8'),
                    ':category'         => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':activity_date'    => mb_substr($actDate, 0, 50, 'UTF-8'),
                    ':location_mr'      => mb_substr($locMr, 0, 255, 'UTF-8'),
                    ':location_en'      => mb_substr($locEn, 0, 255, 'UTF-8'),
                    ':summary_mr'       => $summaryMr,
                    ':summary_en'       => $summaryEn,
                    ':description_mr'   => $descMr,
                    ':description_en'   => $descEn,
                    ':image_url'        => mb_substr($imageUrl, 0, 500, 'UTF-8'),
                    ':is_govt_scheme'   => $isGovt,
                    ':published'        => $pub,
                    ':featured'         => $feat,
                    ':related_report_id'=> $verifiedReportId,
                    ':tags'             => $tagsStr,
                    ':display_order'    => $dispOrd,
                ]);

                // Synchronize child photos if photos array provided in payload
                if (isset($payload['photos']) || isset($payload['images'])) {
                    $photos = $payload['photos'] ?? ($payload['images'] ?? []);
                    if (is_array($photos)) {
                        $delPhoto = $db->prepare("DELETE FROM initiative_photos WHERE initiative_id = :id");
                        $delPhoto->execute([':id' => $id]);

                        $photoIns = $db->prepare("
                            INSERT INTO initiative_photos (initiative_id, image_url, caption_mr, caption_en, display_order)
                            VALUES (:init_id, :image_url, :caption_mr, :caption_en, :display_order)
                        ");
                        $order = 1;
                        foreach ($photos as $p) {
                            $pUrl = is_array($p) ? trim((string)($p['image_url'] ?? '')) : trim((string)$p);
                            if (!empty($pUrl) && validateImageUrlServer($pUrl)) {
                                $capMr = is_array($p) ? trim((string)($p['caption_mr'] ?? '')) : null;
                                $capEn = is_array($p) ? trim((string)($p['caption_en'] ?? '')) : null;
                                $pOrder = is_array($p) && isset($p['display_order']) ? (int)$p['display_order'] : $order++;
                                $photoIns->execute([
                                    ':init_id'      => $id,
                                    ':image_url'    => mb_substr($pUrl, 0, 500, 'UTF-8'),
                                    ':caption_mr'   => !empty($capMr) ? mb_substr($capMr, 0, 255, 'UTF-8') : null,
                                    ':caption_en'   => !empty($capEn) ? mb_substr($capEn, 0, 255, 'UTF-8') : null,
                                    ':display_order'=> $pOrder,
                                ]);
                            }
                        }
                    }
                }

                $db->commit();

                $fetchStmt = $db->prepare("SELECT * FROM initiatives WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedInit = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                $photoStmt = $db->prepare("SELECT * FROM initiative_photos WHERE initiative_id = :id ORDER BY display_order ASC");
                $photoStmt->execute([':id' => $id]);
                $updatedInit['photos'] = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "उपक्रम माहिती अद्ययावत केली. (Initiative successfully updated.)",
                    "data" => $updatedInit
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                error_log("Initiative update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update initiative in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- EVENTS RESOURCE UPDATE ---
        if ($resource === 'events') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रम आयडी आवश्यक आहे. (Event ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रम सापडला नाही. (Event not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $titleMr  = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn  = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $cat      = isset($payload['category']) ? trim((string)$payload['category']) : $existing['category'];
                $startDate= isset($payload['start_date']) ? trim((string)$payload['start_date']) : (isset($payload['startDate']) ? trim((string)$payload['startDate']) : $existing['start_date']);
                $endDate  = array_key_exists('end_date', $payload) ? trim((string)$payload['end_date']) : (array_key_exists('endDate', $payload) ? trim((string)$payload['endDate']) : $existing['end_date']);
                $dateTextMr= isset($payload['event_date_text_mr']) ? trim((string)$payload['event_date_text_mr']) : (isset($payload['dateTextMr']) ? trim((string)$payload['dateTextMr']) : $existing['event_date_text_mr']);
                $dateTextEn= isset($payload['event_date_text_en']) ? trim((string)$payload['event_date_text_en']) : (isset($payload['dateTextEn']) ? trim((string)$payload['dateTextEn']) : $existing['event_date_text_en']);
                $eventTime= isset($payload['event_time']) ? trim((string)$payload['event_time']) : (isset($payload['time']) ? trim((string)$payload['time']) : $existing['event_time']);
                $venueMr  = isset($payload['venue_mr']) ? trim((string)$payload['venue_mr']) : (isset($payload['venue']) ? trim((string)$payload['venue']) : $existing['venue_mr']);
                $venueEn  = isset($payload['venue_en']) ? trim((string)$payload['venue_en']) : (isset($payload['venueEn']) ? trim((string)$payload['venueEn']) : $existing['venue_en']);
                $summaryMr= isset($payload['summary_mr']) ? trim((string)$payload['summary_mr']) : (isset($payload['summary']) ? trim((string)$payload['summary']) : $existing['summary_mr']);
                $summaryEn= isset($payload['summary_en']) ? trim((string)$payload['summary_en']) : (isset($payload['summaryEn']) ? trim((string)$payload['summaryEn']) : $existing['summary_en']);
                $descMr   = isset($payload['description_mr']) ? trim((string)$payload['description_mr']) : (isset($payload['description']) ? trim((string)$payload['description']) : $existing['description_mr']);
                $descEn   = isset($payload['description_en']) ? trim((string)$payload['description_en']) : (isset($payload['descriptionEn']) ? trim((string)$payload['descriptionEn']) : $existing['description_en']);
                $coverUrl = isset($payload['cover_image_url']) ? trim((string)$payload['cover_image_url']) : (isset($payload['coverImageUrl']) ? trim((string)$payload['coverImageUrl']) : $existing['cover_image_url']);
                $status   = isset($payload['status']) ? trim((string)$payload['status']) : $existing['status'];
                $validStatuses = ['upcoming', 'ongoing', 'completed', 'cancelled'];
                if (!in_array($status, $validStatuses, true)) $status = $existing['status'];
                $feat     = isset($payload['is_featured']) ? ((bool)$payload['is_featured'] ? 1 : 0) : (isset($payload['featured']) ? ((bool)$payload['featured'] ? 1 : 0) : (int)$existing['is_featured']);
                $pub      = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];
                $dispOrd  = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रमाचे नाव (मराठी) आवश्यक आहे. (Event title is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (mb_strlen($titleMr, 'UTF-8') > 255 || mb_strlen($titleEn, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "नाव २५५ अक्षरांपेक्षा लहान असावे. (Title must be <= 255 characters.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($summaryMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रमाचा सारांश आवश्यक आहे. (Summary is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (!empty($startDate) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $startDate)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अवैध तारीख स्वरूप. (Invalid date format.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                $validatedEndDate = (!empty($endDate) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $endDate)) ? $endDate : null;

                if (!empty($coverUrl) && !validateImageUrlServer($coverUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS कव्हर फोटो लिंक आवश्यक आहे. (Valid HTTPS cover URL required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $db->beginTransaction();

                $upStmt = $db->prepare("
                    UPDATE events SET
                        title_mr = :title_mr,
                        title_en = :title_en,
                        category = :category,
                        start_date = :start_date,
                        end_date = :end_date,
                        event_date_text_mr = :event_date_text_mr,
                        event_date_text_en = :event_date_text_en,
                        event_time = :event_time,
                        venue_mr = :venue_mr,
                        venue_en = :venue_en,
                        summary_mr = :summary_mr,
                        summary_en = :summary_en,
                        description_mr = :description_mr,
                        description_en = :description_en,
                        cover_image_url = :cover_image_url,
                        status = :status,
                        is_featured = :is_featured,
                        published = :published,
                        display_order = :display_order
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'                   => $id,
                    ':title_mr'             => mb_substr($titleMr, 0, 255, 'UTF-8'),
                    ':title_en'             => mb_substr($titleEn, 0, 255, 'UTF-8'),
                    ':category'             => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':start_date'           => $startDate,
                    ':end_date'             => $validatedEndDate,
                    ':event_date_text_mr'   => !empty($dateTextMr) ? mb_substr($dateTextMr, 0, 100, 'UTF-8') : null,
                    ':event_date_text_en'   => !empty($dateTextEn) ? mb_substr($dateTextEn, 0, 100, 'UTF-8') : null,
                    ':event_time'           => !empty($eventTime) ? mb_substr($eventTime, 0, 100, 'UTF-8') : null,
                    ':venue_mr'             => mb_substr($venueMr, 0, 255, 'UTF-8'),
                    ':venue_en'             => mb_substr($venueEn, 0, 255, 'UTF-8'),
                    ':summary_mr'           => $summaryMr,
                    ':summary_en'           => $summaryEn,
                    ':description_mr'       => $descMr,
                    ':description_en'       => $descEn,
                    ':cover_image_url'      => !empty($coverUrl) ? mb_substr($coverUrl, 0, 500, 'UTF-8') : null,
                    ':status'               => $status,
                    ':is_featured'          => $feat,
                    ':published'            => $pub,
                    ':display_order'        => $dispOrd,
                ]);

                if (isset($payload['photos']) || isset($payload['images'])) {
                    $photos = $payload['photos'] ?? ($payload['images'] ?? []);
                    if (is_array($photos)) {
                        $delPhoto = $db->prepare("DELETE FROM event_photos WHERE event_id = :id");
                        $delPhoto->execute([':id' => $id]);

                        $photoIns = $db->prepare("
                            INSERT INTO event_photos (event_id, image_url, caption_mr, caption_en, display_order)
                            VALUES (:event_id, :image_url, :caption_mr, :caption_en, :display_order)
                        ");
                        $order = 1;
                        foreach ($photos as $p) {
                            $pUrl = is_array($p) ? trim((string)($p['image_url'] ?? ($p['imageUrl'] ?? ($p['url'] ?? '')))) : trim((string)$p);
                            if (!empty($pUrl) && validateImageUrlServer($pUrl)) {
                                $capMr = is_array($p) ? trim((string)($p['caption_mr'] ?? ($p['captionMr'] ?? ''))) : null;
                                $capEn = is_array($p) ? trim((string)($p['caption_en'] ?? ($p['captionEn'] ?? ''))) : null;
                                $pOrder = is_array($p) && isset($p['display_order']) ? (int)$p['display_order'] : (is_array($p) && isset($p['displayOrder']) ? (int)$p['displayOrder'] : $order++);
                                $photoIns->execute([
                                    ':event_id'     => $id,
                                    ':image_url'    => mb_substr($pUrl, 0, 500, 'UTF-8'),
                                    ':caption_mr'   => !empty($capMr) ? mb_substr($capMr, 0, 255, 'UTF-8') : null,
                                    ':caption_en'   => !empty($capEn) ? mb_substr($capEn, 0, 255, 'UTF-8') : null,
                                    ':display_order'=> $pOrder,
                                ]);
                            }
                        }
                    }
                }

                $db->commit();

                $fetchStmt = $db->prepare("SELECT * FROM events WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedEvent = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                $photoStmt = $db->prepare("SELECT * FROM event_photos WHERE event_id = :id ORDER BY display_order ASC");
                $photoStmt->execute([':id' => $id]);
                $updatedEvent['photos'] = $photoStmt->fetchAll(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "कार्यक्रम माहिती अद्ययावत केली. (Event successfully updated.)",
                    "data" => $updatedEvent
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                if ($db->inTransaction()) {
                    $db->rollBack();
                }
                error_log("Event update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update event in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- OFFICIALS / TEAM RESOURCE MUTATIONS (Batch 3) ---
        if ($resource === 'officials') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "पदाधिकारी आयडी आवश्यक आहे. (Official ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM officials WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "पदाधिकारी सापडले नाहीत. (Official not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Preserve Marathi and English fields independently on partial updates
                $nameMr = isset($payload['name_mr']) ? trim((string)$payload['name_mr']) : (isset($payload['name']) ? trim((string)$payload['name']) : $existing['name_mr']);
                $nameEn = isset($payload['name_en']) ? trim((string)$payload['name_en']) : (isset($payload['nameEn']) ? trim((string)$payload['nameEn']) : $existing['name_en']);
                $roleMr = isset($payload['role_mr']) ? trim((string)$payload['role_mr']) : (isset($payload['role']) ? trim((string)$payload['role']) : $existing['role_mr']);
                $roleEn = isset($payload['role_en']) ? trim((string)$payload['role_en']) : (isset($payload['roleEn']) ? trim((string)$payload['roleEn']) : $existing['role_en']);
                $bioMr  = isset($payload['bio_mr']) ? trim((string)$payload['bio_mr']) : (isset($payload['bio']) ? trim((string)$payload['bio']) : $existing['bio_mr']);
                $bioEn  = isset($payload['bio_en']) ? trim((string)$payload['bio_en']) : (isset($payload['bioEn']) ? trim((string)$payload['bioEn']) : $existing['bio_en']);
                $phone  = isset($payload['phone']) ? trim((string)$payload['phone']) : $existing['phone'];
                $dispOrd= isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $pub    = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];

                if (empty($nameMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "पदाधिकाऱ्याचे नाव (मराठी) रिक्त असू शकत नाही."], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($roleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "पदाधिकाऱ्याचे पद (मराठी) रिक्त असू शकत नाही."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $imgUrl = $existing['image_url'];
                if (isset($payload['image_url']) || isset($payload['imageUrl'])) {
                    $testUrl = trim((string)($payload['image_url'] ?? $payload['imageUrl']));
                    if (!empty($testUrl)) {
                        if (!validateImageUrlServer($testUrl)) {
                            http_response_code(400);
                            echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS फोटो लिंक आवश्यक आहे. (Valid HTTPS image URL is required.)"], JSON_UNESCAPED_UNICODE);
                            exit();
                        }
                        $imgUrl = $testUrl;
                    }
                }

                $updateStmt = $db->prepare("
                    UPDATE officials 
                    SET name_mr = :name_mr,
                        name_en = :name_en,
                        role_mr = :role_mr,
                        role_en = :role_en,
                        bio_mr = :bio_mr,
                        bio_en = :bio_en,
                        phone = :phone,
                        image_url = :image_url,
                        display_order = :display_order,
                        published = :published
                    WHERE id = :id
                ");

                $updateStmt->execute([
                    ':id'           => $id,
                    ':name_mr'      => $nameMr,
                    ':name_en'      => $nameEn,
                    ':role_mr'      => $roleMr,
                    ':role_en'      => $roleEn,
                    ':bio_mr'       => $bioMr ?: null,
                    ':bio_en'       => $bioEn ?: null,
                    ':phone'        => $phone ?: null,
                    ':image_url'    => $imgUrl,
                    ':display_order'=> $dispOrd,
                    ':published'    => $pub
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM officials WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedOfficial = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "पदाधिकारी माहिती यशस्वीरित्या अद्ययावत केली. (Official successfully updated.)",
                    "data" => $updatedOfficial
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Official update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update official in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- SITE SETTINGS MUTATIONS (Batch 3) ---
        if ($resource === 'settings' || $resource === 'site_settings') {
            $key = trim((string)($_GET['key'] ?? ($_GET['id'] ?? ($payload['key_name'] ?? ($payload['key'] ?? '')))));
            if (empty($key)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "सेटिंग की आवश्यक आहे. (Setting key is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM site_settings WHERE key_name = :key LIMIT 1");
                $checkStmt->execute([':key' => $key]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "सेटिंग सापडले नाही. (Setting key not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Preserve independent Marathi and English values on partial update
                $valMr = isset($payload['value_mr']) ? trim((string)$payload['value_mr']) : (isset($payload['valueMr']) ? trim((string)$payload['valueMr']) : (isset($payload['value']) ? trim((string)$payload['value']) : $existing['value_mr']));
                $valEn = isset($payload['value_en']) ? trim((string)$payload['value_en']) : (isset($payload['valueEn']) ? trim((string)$payload['valueEn']) : $existing['value_en']);
                $desc  = isset($payload['description']) ? trim((string)$payload['description']) : $existing['description'];

                $updateStmt = $db->prepare("
                    UPDATE site_settings 
                    SET value_mr = :val_mr,
                        value_en = :val_en,
                        description = :desc
                    WHERE key_name = :key
                ");
                $updateStmt->execute([
                    ':key'    => $key,
                    ':val_mr' => $valMr,
                    ':val_en' => $valEn,
                    ':desc'   => $desc
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM site_settings WHERE key_name = :key LIMIT 1");
                $fetchStmt->execute([':key' => $key]);
                $updatedSetting = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "वेबसाईट सेटिंग अद्ययावत केले. (Setting successfully updated.)",
                    "data" => $updatedSetting
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Setting update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update setting in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- SITE PAGES MUTATIONS (Batch 3) ---
        if ($resource === 'pages' || $resource === 'site_pages') {
            $slug = trim((string)($_GET['slug'] ?? ($_GET['id'] ?? ($payload['slug'] ?? ''))));
            if (empty($slug)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "पृष्ठ स्लग आवश्यक आहे. (Page slug is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM site_pages WHERE slug = :slug LIMIT 1");
                $checkStmt->execute([':slug' => $slug]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "पृष्ठ सापडले नाही. (Page not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Preserve independent Marathi and English metadata on partial updates
                $titleMr = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['titleMr']) ? trim((string)$payload['titleMr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']));
                $titleEn = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $metaMr  = isset($payload['meta_description_mr']) ? trim((string)$payload['meta_description_mr']) : (isset($payload['metaDescriptionMr']) ? trim((string)$payload['metaDescriptionMr']) : $existing['meta_description_mr']);
                $metaEn  = isset($payload['meta_description_en']) ? trim((string)$payload['meta_description_en']) : (isset($payload['metaDescriptionEn']) ? trim((string)$payload['metaDescriptionEn']) : $existing['meta_description_en']);
                $isPub   = isset($payload['is_published']) ? ((bool)$payload['is_published'] ? 1 : 0) : (isset($payload['isPublished']) ? ((bool)$payload['isPublished'] ? 1 : 0) : (int)$existing['is_published']);

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "पृष्ठाचे शीर्षक (मराठी) रिक्त असू शकत नाही."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $updateStmt = $db->prepare("
                    UPDATE site_pages 
                    SET title_mr = :title_mr,
                        title_en = :title_en,
                        meta_description_mr = :meta_mr,
                        meta_description_en = :meta_en,
                        is_published = :is_pub
                    WHERE slug = :slug
                ");
                $updateStmt->execute([
                    ':slug'     => $slug,
                    ':title_mr' => $titleMr,
                    ':title_en' => $titleEn,
                    ':meta_mr'  => $metaMr ?: null,
                    ':meta_en'  => $metaEn ?: null,
                    ':is_pub'   => $isPub
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM site_pages WHERE slug = :slug LIMIT 1");
                $fetchStmt->execute([':slug' => $slug]);
                $updatedPage = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "पृष्ठ माहिती यशस्वीरित्या अद्ययावत केली. (Page successfully updated.)",
                    "data" => $updatedPage
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Page update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update page in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- PAGE SECTIONS RESOURCE UPDATES (PUT) ---
        if ($resource === 'page_sections' || $resource === 'sections') {
            $id = (int)($_GET['id'] ?? ($payload['id'] ?? 0));
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "विभाग आयडी आवश्यक आहे. (Section ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $chkStmt = $db->prepare("SELECT * FROM page_sections WHERE id = ?");
                $chkStmt->execute([$id]);
                $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);
                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "विभाग सापडला नाही. (Section not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Bilingual independence - strictly preserve language fields without cross-contamination
                $titleMr    = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['titleMr']) ? trim((string)$payload['titleMr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']));
                $titleEn    = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $subtitleMr = isset($payload['subtitle_mr']) ? trim((string)$payload['subtitle_mr']) : (isset($payload['subtitleMr']) ? trim((string)$payload['subtitleMr']) : $existing['subtitle_mr']);
                $subtitleEn = isset($payload['subtitle_en']) ? trim((string)$payload['subtitle_en']) : (isset($payload['subtitleEn']) ? trim((string)$payload['subtitleEn']) : $existing['subtitle_en']);
                $contentMr  = isset($payload['content_mr']) ? trim((string)$payload['content_mr']) : (isset($payload['contentMr']) ? trim((string)$payload['contentMr']) : (isset($payload['content']) ? trim((string)$payload['content']) : $existing['content_mr']));
                $contentEn  = isset($payload['content_en']) ? trim((string)$payload['content_en']) : (isset($payload['contentEn']) ? trim((string)$payload['contentEn']) : $existing['content_en']);
                $imageUrl   = isset($payload['image_url']) ? trim((string)$payload['image_url']) : (isset($payload['imageUrl']) ? trim((string)$payload['imageUrl']) : $existing['image_url']);
                $altMr      = isset($payload['image_alt_mr']) ? trim((string)$payload['image_alt_mr']) : (isset($payload['imageAltMr']) ? trim((string)$payload['imageAltMr']) : $existing['image_alt_mr']);
                $altEn      = isset($payload['image_alt_en']) ? trim((string)$payload['image_alt_en']) : (isset($payload['imageAltEn']) ? trim((string)$payload['imageAltEn']) : $existing['image_alt_en']);
                $order      = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $isPub      = isset($payload['is_published']) ? ((bool)$payload['is_published'] ? 1 : 0) : (isset($payload['isPublished']) ? ((bool)$payload['isPublished'] ? 1 : 0) : (int)$existing['is_published']);

                if (empty($titleMr) || empty($contentMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "मराठी शीर्षक आणि मजकूर रिक्त असू शकत नाहीत."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                if (!empty($imageUrl) && !validateImageUrlServer($imageUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अवैध चित्र लिंक. (Invalid image URL.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $upd = $db->prepare("
                    UPDATE page_sections
                    SET title_mr = :title_mr,
                        title_en = :title_en,
                        subtitle_mr = :subtitle_mr,
                        subtitle_en = :subtitle_en,
                        content_mr = :content_mr,
                        content_en = :content_en,
                        image_url = :image_url,
                        image_alt_mr = :alt_mr,
                        image_alt_en = :alt_en,
                        display_order = :display_order,
                        is_published = :is_pub,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $upd->execute([
                    ':id'            => $id,
                    ':title_mr'      => $titleMr,
                    ':title_en'      => $titleEn,
                    ':subtitle_mr'   => $subtitleMr ?: null,
                    ':subtitle_en'   => $subtitleEn ?: null,
                    ':content_mr'    => $contentMr,
                    ':content_en'    => $contentEn,
                    ':image_url'     => $imageUrl ?: null,
                    ':alt_mr'        => $altMr ?: null,
                    ':alt_en'        => $altEn ?: null,
                    ':display_order' => $order,
                    ':is_pub'        => $isPub
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM page_sections WHERE id = ?");
                $fetchStmt->execute([$id]);
                $updatedSection = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "विभाग यशस्वीरित्या अद्ययावत केला. (Section updated successfully.)",
                    "data"    => $updatedSection
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Page section update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "विभाग अद्ययावत करताना त्रुटी आली."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- MEDIA FILES RESOURCE UPDATES (PUT) ---
        if ($resource === 'media_files' || $resource === 'media') {
            $id = (int)($_GET['id'] ?? ($payload['id'] ?? 0));
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "मीडिया आयडी आवश्यक आहे."], JSON_UNESCAPED_UNICODE);
                exit();
            }
            try {
                $chkStmt = $db->prepare("SELECT * FROM media_files WHERE id = ?");
                $chkStmt->execute([$id]);
                $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);
                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "मीडिया फाइल सापडली नाही."], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                $altMr = isset($payload['alt_text_mr']) ? trim((string)$payload['alt_text_mr']) : (isset($payload['altTextMr']) ? trim((string)$payload['altTextMr']) : $existing['alt_text_mr']);
                $altEn = isset($payload['alt_text_en']) ? trim((string)$payload['alt_text_en']) : (isset($payload['altTextEn']) ? trim((string)$payload['altTextEn']) : $existing['alt_text_en']);

                $upd = $db->prepare("UPDATE media_files SET alt_text_mr = :mr, alt_text_en = :en WHERE id = :id");
                $upd->execute([':mr' => $altMr ?: null, ':en' => $altEn ?: null, ':id' => $id]);

                $fetchStmt = $db->prepare("SELECT * FROM media_files WHERE id = ?");
                $fetchStmt->execute([$id]);
                $updated = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "मीडिया माहिती अद्ययावत केली. (Media metadata updated.)",
                    "data"    => $updated
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Media update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "मीडिया अद्ययावत करताना त्रुटी आली."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GALLERY ALBUMS RESOURCE UPDATES ---
        if ($resource === 'albums' || $resource === 'gallery_albums') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अल्बम आयडी आवश्यक आहे. (Album ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $chkStmt = $db->prepare("SELECT * FROM gallery_albums WHERE id = :id LIMIT 1");
                $chkStmt->execute([':id' => $id]);
                $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अल्बम सापडला नाही. (Album not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $titleMr = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $descMr  = isset($payload['description_mr']) ? trim((string)$payload['description_mr']) : (isset($payload['description']) ? trim((string)$payload['description']) : $existing['description_mr']);
                $descEn  = isset($payload['description_en']) ? trim((string)$payload['description_en']) : (isset($payload['descriptionEn']) ? trim((string)$payload['descriptionEn']) : $existing['description_en']);
                $cat     = isset($payload['category']) ? trim((string)$payload['category']) : $existing['category'];
                $covUrl  = isset($payload['cover_image_url']) ? trim((string)$payload['cover_image_url']) : (isset($payload['coverImageUrl']) ? trim((string)$payload['coverImageUrl']) : $existing['cover_image_url']);
                $evDate  = isset($payload['event_date']) ? trim((string)$payload['event_date']) : (isset($payload['eventDate']) ? trim((string)$payload['eventDate']) : $existing['event_date']);
                $dispMode= isset($payload['display_mode']) ? strtolower(trim((string)$payload['display_mode'])) : (isset($payload['displayMode']) ? strtolower(trim((string)$payload['displayMode'])) : $existing['display_mode']);
                $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $pub     = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अल्बम शीर्षक (मराठी) रिक्त असू शकत नाही."], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (mb_strlen($titleMr, 'UTF-8') > 255 || mb_strlen($titleEn, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शीर्षक २५५ अक्षरांपेक्षा लहान असावे."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                if (!in_array($dispMode, ['grid', 'carousel'], true)) {
                    $dispMode = 'grid';
                }

                if (!empty($covUrl) && !validateImageUrlServer($covUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS किंवा सर्व्हर कव्हर फोटो लिंक आवश्यक आहे. Base64 समर्थित नाही."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $upStmt = $db->prepare("
                    UPDATE gallery_albums SET
                        title_mr = :title_mr,
                        title_en = :title_en,
                        description_mr = :description_mr,
                        description_en = :description_en,
                        category = :category,
                        cover_image_url = :cover_image_url,
                        event_date = :event_date,
                        display_mode = :display_mode,
                        display_order = :display_order,
                        published = :published
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'               => $id,
                    ':title_mr'         => $titleMr,
                    ':title_en'         => $titleEn,
                    ':description_mr'   => !empty($descMr) ? $descMr : null,
                    ':description_en'   => !empty($descEn) ? $descEn : null,
                    ':category'         => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':cover_image_url'  => !empty($covUrl) ? mb_substr($covUrl, 0, 500, 'UTF-8') : null,
                    ':event_date'       => !empty($evDate) ? $evDate : null,
                    ':display_mode'     => $dispMode,
                    ':display_order'    => $dispOrd,
                    ':published'        => $pub,
                ]);

                $fStmt = $db->prepare("SELECT * FROM gallery_albums WHERE id = :id LIMIT 1");
                $fStmt->execute([':id' => $id]);
                $updatedAlbum = $fStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "अल्बम यशस्वीरित्या अद्ययावत केला. (Album updated successfully.)",
                    "data"    => $updatedAlbum
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Album update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update album in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GALLERY PHOTOS RESOURCE UPDATES ---
        if ($resource === 'gallery' || $resource === 'gallery_photos') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "फोटो आयडी आवश्यक आहे. (Photo ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $chkStmt = $db->prepare("SELECT * FROM gallery_photos WHERE id = :id LIMIT 1");
                $chkStmt->execute([':id' => $id]);
                $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "फोटो सापडला नाही. (Photo not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $titleMr = isset($payload['title_mr']) ? trim((string)$payload['title_mr']) : (isset($payload['title']) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn = isset($payload['title_en']) ? trim((string)$payload['title_en']) : (isset($payload['titleEn']) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $capMr   = isset($payload['caption_mr']) ? trim((string)$payload['caption_mr']) : (isset($payload['caption']) ? trim((string)$payload['caption']) : $existing['caption_mr']);
                $capEn   = isset($payload['caption_en']) ? trim((string)$payload['caption_en']) : (isset($payload['captionEn']) ? trim((string)$payload['captionEn']) : $existing['caption_en']);
                $altMr   = isset($payload['alt_text_mr']) ? trim((string)$payload['alt_text_mr']) : (isset($payload['altTextMr']) ? trim((string)$payload['altTextMr']) : $existing['alt_text_mr']);
                $altEn   = isset($payload['alt_text_en']) ? trim((string)$payload['alt_text_en']) : (isset($payload['altTextEn']) ? trim((string)$payload['altTextEn']) : $existing['alt_text_en']);
                $cat     = isset($payload['category']) ? trim((string)$payload['category']) : $existing['category'];
                $imgUrl  = isset($payload['image_url']) ? trim((string)$payload['image_url']) : (isset($payload['imageUrl']) ? trim((string)$payload['imageUrl']) : $existing['image_url']);
                $year    = isset($payload['year']) ? (int)$payload['year'] : (int)$existing['year'];
                $feat    = isset($payload['featured_on_home']) ? ((bool)$payload['featured_on_home'] ? 1 : 0) : (isset($payload['featuredOnHome']) ? ((bool)$payload['featuredOnHome'] ? 1 : 0) : (int)$existing['featured_on_home']);
                $dispOrd = isset($payload['display_order']) ? (int)$payload['display_order'] : (isset($payload['displayOrder']) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $pub     = isset($payload['published']) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];

                $albumId = array_key_exists('album_id', $payload) ? trim((string)$payload['album_id']) : (array_key_exists('albumId', $payload) ? trim((string)$payload['albumId']) : $existing['album_id']);
                $validAlbumId = null;
                if (!empty($albumId)) {
                    $chkAlb = $db->prepare("SELECT id FROM gallery_albums WHERE id = ? LIMIT 1");
                    $chkAlb->execute([$albumId]);
                    if ($chkAlb->fetch()) {
                        $validAlbumId = $albumId;
                    }
                }

                if (empty($titleMr)) {
                    $titleMr = $existing['title_mr'];
                }
                if (empty($imgUrl) || !validateImageUrlServer($imgUrl)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "वैध HTTPS किंवा सर्व्हर फोटो लिंक आवश्यक आहे. Base64 समर्थित नाही."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $upStmt = $db->prepare("
                    UPDATE gallery_photos SET
                        album_id = :album_id,
                        title_mr = :title_mr,
                        title_en = :title_en,
                        caption_mr = :caption_mr,
                        caption_en = :caption_en,
                        alt_text_mr = :alt_text_mr,
                        alt_text_en = :alt_text_en,
                        category = :category,
                        image_url = :image_url,
                        year = :year,
                        featured_on_home = :featured_on_home,
                        display_order = :display_order,
                        published = :published
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'               => $id,
                    ':album_id'         => $validAlbumId,
                    ':title_mr'         => mb_substr($titleMr, 0, 255, 'UTF-8'),
                    ':title_en'         => mb_substr($titleEn, 0, 255, 'UTF-8'),
                    ':caption_mr'       => ($capMr !== '') ? $capMr : $existing['caption_mr'],
                    ':caption_en'       => ($capEn !== '') ? $capEn : $existing['caption_en'],
                    ':alt_text_mr'      => mb_substr($altMr ?: $titleMr, 0, 255, 'UTF-8'),
                    ':alt_text_en'      => mb_substr($altEn ?: $titleEn, 0, 255, 'UTF-8'),
                    ':category'         => mb_substr($cat, 0, 100, 'UTF-8'),
                    ':image_url'        => mb_substr($imgUrl, 0, 500, 'UTF-8'),
                    ':year'             => $year,
                    ':featured_on_home' => $feat,
                    ':display_order'    => $dispOrd,
                    ':published'        => $pub,
                ]);

                $fStmt = $db->prepare("SELECT * FROM gallery_photos WHERE id = :id LIMIT 1");
                $fStmt->execute([':id' => $id]);
                $updatedPhoto = $fStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "फोटो माहिती यशस्वीरित्या अद्ययावत केली. (Photo updated successfully.)",
                    "data"    => $updatedPhoto
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Photo update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update photo in database."], JSON_UNESCAPED_UNICODE);
            }
        }

        // --- REPORTS RESOURCE MUTATIONS (PUT) ---
        if ($resource === 'reports') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल आयडी आवश्यक आहे. (Report ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM reports WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल सापडला नाही. (Report not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $titleMr = array_key_exists('title_mr', $payload) ? trim((string)$payload['title_mr']) : (array_key_exists('title', $payload) ? trim((string)$payload['title']) : $existing['title_mr']);
                $titleEn = array_key_exists('title_en', $payload) ? trim((string)$payload['title_en']) : (array_key_exists('titleEn', $payload) ? trim((string)$payload['titleEn']) : $existing['title_en']);
                $periodMr = array_key_exists('period_mr', $payload) ? trim((string)$payload['period_mr']) : (array_key_exists('period', $payload) ? trim((string)$payload['period']) : $existing['period_mr']);
                $periodEn = array_key_exists('period_en', $payload) ? trim((string)$payload['period_en']) : (array_key_exists('periodEn', $payload) ? trim((string)$payload['periodEn']) : $existing['period_en']);
                $reportDate = array_key_exists('report_date', $payload) ? trim((string)$payload['report_date']) : (array_key_exists('date', $payload) ? trim((string)$payload['date']) : $existing['report_date']);
                $fileSize = array_key_exists('file_size', $payload) ? trim((string)$payload['file_size']) : (array_key_exists('fileSize', $payload) ? trim((string)$payload['fileSize']) : $existing['file_size']);
                $catMr = array_key_exists('category_mr', $payload) ? trim((string)$payload['category_mr']) : (array_key_exists('category', $payload) ? trim((string)$payload['category']) : $existing['category_mr']);
                $catEn = array_key_exists('category_en', $payload) ? trim((string)$payload['category_en']) : (array_key_exists('categoryEn', $payload) ? trim((string)$payload['categoryEn']) : $existing['category_en']);
                $summaryMr = array_key_exists('summary_mr', $payload) ? trim((string)$payload['summary_mr']) : (array_key_exists('summary', $payload) ? trim((string)$payload['summary']) : $existing['summary_mr']);
                $summaryEn = array_key_exists('summary_en', $payload) ? trim((string)$payload['summary_en']) : (array_key_exists('summaryEn', $payload) ? trim((string)$payload['summaryEn']) : $existing['summary_en']);
                $pdfUrl = array_key_exists('pdf_url', $payload) ? trim((string)$payload['pdf_url']) : (array_key_exists('pdfPlaceholderUrl', $payload) ? trim((string)$payload['pdfPlaceholderUrl']) : $existing['pdf_url']);
                $coverUrl = array_key_exists('cover_image_url', $payload) ? trim((string)$payload['cover_image_url']) : (array_key_exists('coverImageUrl', $payload) ? trim((string)$payload['coverImageUrl']) : $existing['cover_image_url']);
                $dispOrd = array_key_exists('display_order', $payload) ? (int)$payload['display_order'] : (array_key_exists('displayOrder', $payload) ? (int)$payload['displayOrder'] : (int)$existing['display_order']);
                $pub = array_key_exists('published', $payload) ? ((bool)$payload['published'] ? 1 : 0) : (int)$existing['published'];

                if (empty($titleMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल शीर्षक (मराठी) आवश्यक आहे. (Marathi report title is required.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (mb_strlen($titleMr, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल शीर्षक २५५ अक्षरांपेक्षा लहान असावे."], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($periodMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "आर्थिक वर्ष / कालावधी (मराठी) आवश्यक आहे."], JSON_UNESCAPED_UNICODE);
                    exit();
                }
                if (empty($summaryMr)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल सारांश (मराठी) आवश्यक आहे."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                if (!empty($titleEn) && mb_strlen($titleEn, 'UTF-8') > 255) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "English report title must be <= 255 characters."], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                if (!empty($pdfUrl) && $pdfUrl !== '#') {
                    if (!validatePdfUrlServer($pdfUrl)) {
                        http_response_code(400);
                        echo json_encode(["status" => "error", "success" => false, "message" => "वैध PDF फाइल लिंक आवश्यक आहे."], JSON_UNESCAPED_UNICODE);
                        exit();
                    }
                } else {
                    $pdfUrl = '#';
                }

                if (!empty($coverUrl)) {
                    if (!validateImageUrlServer($coverUrl)) {
                        http_response_code(400);
                        echo json_encode(["status" => "error", "success" => false, "message" => "कव्हर फोटोसाठी वैध इमेज लिंक आवश्यक आहे."], JSON_UNESCAPED_UNICODE);
                        exit();
                    }
                } else {
                    $coverUrl = null;
                }

                $upStmt = $db->prepare("
                    UPDATE reports SET
                        title_mr = :title_mr,
                        title_en = :title_en,
                        period_mr = :period_mr,
                        period_en = :period_en,
                        report_date = :report_date,
                        file_size = :file_size,
                        category_mr = :cat_mr,
                        category_en = :cat_en,
                        summary_mr = :summary_mr,
                        summary_en = :summary_en,
                        pdf_url = :pdf_url,
                        cover_image_url = :cover_url,
                        display_order = :disp_ord,
                        published = :pub,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $upStmt->execute([
                    ':id'          => $id,
                    ':title_mr'    => $titleMr,
                    ':title_en'    => $titleEn,
                    ':period_mr'   => $periodMr,
                    ':period_en'   => $periodEn,
                    ':report_date' => $reportDate,
                    ':file_size'   => $fileSize,
                    ':cat_mr'      => $catMr,
                    ':cat_en'      => $catEn,
                    ':summary_mr'  => $summaryMr,
                    ':summary_en'  => $summaryEn,
                    ':pdf_url'     => $pdfUrl,
                    ':cover_url'   => $coverUrl,
                    ':disp_ord'    => $dispOrd,
                    ':pub'         => $pub,
                ]);

                $fStmt = $db->prepare("SELECT * FROM reports WHERE id = :id LIMIT 1");
                $fStmt->execute([':id' => $id]);
                $updatedReport = $fStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "अहवाल यशस्वीरित्या अद्ययावत केला. (Report updated successfully.)",
                    "data"    => $updatedReport
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Report update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update report in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- CONTACT INFORMATION MUTATIONS (PUT) ---
        if ($resource === 'contact' || $resource === 'contact_info') {
            try {
                $checkStmt = $db->query("SELECT * FROM contact_info WHERE id = 1 LIMIT 1");
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    $db->exec("INSERT INTO contact_info (id) VALUES (1)");
                    $checkStmt = $db->query("SELECT * FROM contact_info WHERE id = 1 LIMIT 1");
                    $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
                }

                $phone = array_key_exists('phone', $payload) ? trim((string)$payload['phone']) : $existing['phone'];
                $email = array_key_exists('email', $payload) ? trim((string)$payload['email']) : $existing['email'];
                $addressMr = array_key_exists('address_mr', $payload) ? trim((string)$payload['address_mr']) : (array_key_exists('address', $payload) ? trim((string)$payload['address']) : $existing['address_mr']);
                $addressEn = array_key_exists('address_en', $payload) ? trim((string)$payload['address_en']) : (array_key_exists('addressEn', $payload) ? trim((string)$payload['addressEn']) : $existing['address_en']);
                $talukaMr = array_key_exists('taluka_mr', $payload) ? trim((string)$payload['taluka_mr']) : (array_key_exists('taluka', $payload) ? trim((string)$payload['taluka']) : $existing['taluka_mr']);
                $talukaEn = array_key_exists('taluka_en', $payload) ? trim((string)$payload['taluka_en']) : (array_key_exists('talukaEn', $payload) ? trim((string)$payload['talukaEn']) : $existing['taluka_en']);
                $districtMr = array_key_exists('district_mr', $payload) ? trim((string)$payload['district_mr']) : (array_key_exists('district', $payload) ? trim((string)$payload['district']) : $existing['district_mr']);
                $districtEn = array_key_exists('district_en', $payload) ? trim((string)$payload['district_en']) : (array_key_exists('districtEn', $payload) ? trim((string)$payload['districtEn']) : $existing['district_en']);
                $hoursMr = array_key_exists('visiting_hours_mr', $payload) ? trim((string)$payload['visiting_hours_mr']) : (array_key_exists('visitingHours', $payload) ? trim((string)$payload['visitingHours']) : $existing['visiting_hours_mr']);
                $hoursEn = array_key_exists('visiting_hours_en', $payload) ? trim((string)$payload['visiting_hours_en']) : (array_key_exists('visitingHoursEn', $payload) ? trim((string)$payload['visitingHoursEn']) : $existing['visiting_hours_en']);
                $regNoMr = array_key_exists('reg_no_mr', $payload) ? trim((string)$payload['reg_no_mr']) : (array_key_exists('regNoMr', $payload) ? trim((string)$payload['regNoMr']) : $existing['reg_no_mr']);
                $regNoEn = array_key_exists('reg_no_en', $payload) ? trim((string)$payload['reg_no_en']) : (array_key_exists('regNoEn', $payload) ? trim((string)$payload['regNoEn']) : $existing['reg_no_en']);
                $secNameMr = array_key_exists('secretary_name_mr', $payload) ? trim((string)$payload['secretary_name_mr']) : (array_key_exists('secretaryNameMr', $payload) ? trim((string)$payload['secretaryNameMr']) : $existing['secretary_name_mr']);
                $secNameEn = array_key_exists('secretary_name_en', $payload) ? trim((string)$payload['secretary_name_en']) : (array_key_exists('secretaryNameEn', $payload) ? trim((string)$payload['secretaryNameEn']) : $existing['secretary_name_en']);

                // Validation: if email provided, ensure safe format
                if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अवैध ईमेल पत्ता स्वरूप. (Invalid email format.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $upStmt = $db->prepare("
                    UPDATE contact_info SET
                        reg_no_mr = :reg_no_mr,
                        reg_no_en = :reg_no_en,
                        secretary_name_mr = :sec_mr,
                        secretary_name_en = :sec_en,
                        phone = :phone,
                        email = :email,
                        address_mr = :addr_mr,
                        address_en = :addr_en,
                        taluka_mr = :tal_mr,
                        taluka_en = :tal_en,
                        district_mr = :dist_mr,
                        district_en = :dist_en,
                        visiting_hours_mr = :hours_mr,
                        visiting_hours_en = :hours_en,
                        updated_at = NOW()
                    WHERE id = 1
                ");
                $upStmt->execute([
                    ':reg_no_mr'  => substr((string)$regNoMr, 0, 100),
                    ':reg_no_en'  => substr((string)$regNoEn, 0, 100),
                    ':sec_mr'     => substr((string)$secNameMr, 0, 150),
                    ':sec_en'     => substr((string)$secNameEn, 0, 150),
                    ':phone'      => substr((string)$phone, 0, 150),
                    ':email'      => substr((string)$email, 0, 150),
                    ':addr_mr'    => (string)$addressMr,
                    ':addr_en'    => (string)$addressEn,
                    ':tal_mr'     => substr((string)$talukaMr, 0, 100),
                    ':tal_en'     => substr((string)$talukaEn, 0, 100),
                    ':dist_mr'    => substr((string)$districtMr, 0, 100),
                    ':dist_en'    => substr((string)$districtEn, 0, 100),
                    ':hours_mr'   => substr((string)$hoursMr, 0, 150),
                    ':hours_en'   => substr((string)$hoursEn, 0, 150),
                ]);

                $fStmt = $db->query("
                    SELECT id, reg_no_mr, reg_no_en, secretary_name_mr, secretary_name_en,
                           phone, email, address_mr, address_en, taluka_mr, taluka_en,
                           district_mr, district_en, visiting_hours_mr, visiting_hours_en
                    FROM contact_info WHERE id = 1 LIMIT 1
                ");
                $updatedContact = $fStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "संपर्क माहिती यशस्वीरित्या अद्ययावत केली. (Contact details updated successfully.)",
                    "data"    => $updatedContact
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Contact update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update contact details in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- INQUIRIES RESOURCE MUTATIONS (PUT) ---
        if ($resource === 'inquiries') {
            $id = filter_var($_GET['id'] ?? ($payload['id'] ?? null), FILTER_VALIDATE_INT);
            if (!$id || $id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध संदेश आयडी आवश्यक आहे. (Valid inquiry ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM inquiries WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "संदेश आढळला नाही. (Inquiry not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $newStatus = trim((string)($payload['status'] ?? $existing['status']));
                if ($newStatus === 'unread') {
                    $newStatus = 'new';
                }
                $allowedStatuses = ['new', 'read', 'replied', 'archived'];
                if (!in_array($newStatus, $allowedStatuses, true)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अवैध स्थिती मूल्य. (Invalid status value.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $adminNotes = isset($payload['admin_notes']) ? trim((string)$payload['admin_notes']) : $existing['admin_notes'];
                
                $repliedAt = $existing['replied_at'];
                $repliedBy = $existing['replied_by'];
                if ($newStatus === 'replied' && empty($repliedAt)) {
                    $repliedAt = date('Y-m-d H:i:s');
                    $repliedBy = $currentAdmin['id'] ?? null;
                }

                $updateStmt = $db->prepare("
                    UPDATE inquiries 
                    SET status = :status,
                        admin_notes = :admin_notes,
                        replied_at = :replied_at,
                        replied_by = :replied_by,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $updateStmt->execute([
                    ':id'          => $id,
                    ':status'      => $newStatus,
                    ':admin_notes' => $adminNotes,
                    ':replied_at'  => $repliedAt,
                    ':replied_by'  => $repliedBy
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM inquiries WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedInquiry = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "संदेश स्थिती अद्ययावत केली. (Inquiry status updated successfully.)",
                    "data"    => $updatedInquiry
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Inquiry update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update inquiry in database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- PROTECTED VOLUNTEERS RESOURCE MUTATIONS (PUT) ---
        if ($resource === 'volunteers') {
            $id = filter_var($_GET['id'] ?? ($payload['id'] ?? null), FILTER_VALIDATE_INT);
            if (!$id || $id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध स्वयंसेवक आयडी आवश्यक आहे. (Valid volunteer ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT * FROM volunteers WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "स्वयंसेवक नोंद आढळली नाही. (Volunteer record not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $newStatus = trim((string)($payload['status'] ?? $existing['status']));
                $allowedStatuses = ['new', 'reviewing', 'approved', 'contacted', 'declined', 'rejected', 'archived'];
                if (!in_array($newStatus, $allowedStatuses, true)) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अवैध स्थिती मूल्य. (Invalid status value.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $adminNotes = isset($payload['admin_notes']) ? trim((string)$payload['admin_notes']) : $existing['admin_notes'];

                $updateStmt = $db->prepare("
                    UPDATE volunteers 
                    SET status = :status,
                        admin_notes = :admin_notes,
                        updated_at = NOW()
                    WHERE id = :id
                ");
                $updateStmt->execute([
                    ':id'          => $id,
                    ':status'      => $newStatus,
                    ':admin_notes' => $adminNotes
                ]);

                $fetchStmt = $db->prepare("SELECT * FROM volunteers WHERE id = :id LIMIT 1");
                $fetchStmt->execute([':id' => $id]);
                $updatedVolunteer = $fetchStmt->fetch(PDO::FETCH_ASSOC);

                http_response_code(200);
                echo json_encode([
                    "status"  => "success",
                    "success" => true,
                    "message" => "स्वयंसेवक स्थिती अद्ययावत केली. (Volunteer status updated successfully.)",
                    "data"    => $updatedVolunteer
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Volunteer update failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to update volunteer record."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Administrative mutations (PUT) for resource '{$resource}' are scheduled for Phase 2.2B."
        ], JSON_UNESCAPED_UNICODE);
        exit();

    // ========================================================================
    // DELETE: Administrative Deletions (Protected)
    // ========================================================================
    case 'DELETE':
        $currentAdmin = authenticateAdmin($db);
        $payload = json_decode(file_get_contents("php://input"), true) ?: [];

        if ($resource === 'videos') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ आयडी आवश्यक आहे. (Video ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id FROM videos WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                if (!$checkStmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "व्हिडिओ सापडला नाही. (Video not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM videos WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "व्हिडिओ यशस्वीरित्या हटवला. (Video successfully deleted.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Video deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete video from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- ANNOUNCEMENTS RESOURCE DELETION ---
        if ($resource === 'announcements') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "बातम्या / कार्यक्रम आयडी आवश्यक आहे. (Announcement ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id FROM announcements WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                if (!$checkStmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "बातम्या / कार्यक्रम सापडला नाही. (Announcement not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM announcements WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "बातम्या / कार्यक्रम यशस्वीरित्या हटवला. (Announcement successfully deleted.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Announcement deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete announcement from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GOVERNMENT SCHEMES RESOURCE DELETION ---
        if ($resource === 'schemes' || $resource === 'government_schemes') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजना आयडी आवश्यक आहे. (Scheme ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id FROM government_schemes WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                if (!$checkStmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "शासकीय योजना सापडली नाही. (Government scheme not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM government_schemes WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "शासकीय योजना यशस्वीरित्या हटवली. (Government scheme successfully deleted.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Government scheme deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete scheme from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- INITIATIVES / ACTIVITIES RESOURCE DELETION ---
        if ($resource === 'initiatives' || $resource === 'activities') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रम आयडी आवश्यक आहे. (Initiative ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id FROM initiatives WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                if (!$checkStmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "उपक्रम सापडला नाही. (Initiative not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM initiatives WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "उपक्रम यशस्वीरित्या हटवला. (Initiative successfully deleted.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Initiative deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete initiative from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- EVENTS RESOURCE DELETION ---
        if ($resource === 'events') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रम आयडी आवश्यक आहे. (Event ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id FROM events WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                if (!$checkStmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "कार्यक्रम सापडला नाही. (Event not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM events WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "कार्यक्रम यशस्वीरित्या हटवला. (Event successfully deleted.)"
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Event deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete event from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- OFFICIALS / TEAM RESOURCE MUTATIONS (Batch 3) ---
        if ($resource === 'officials') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "पदाधिकारी आयडी आवश्यक आहे. (Official ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id, name_mr FROM officials WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "पदाधिकारी सापडले नाहीत. (Official not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM officials WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status" => "success",
                    "success" => true,
                    "message" => "पदाधिकारी यशस्वीरित्या हटवले. (Official successfully deleted.)",
                    "deleted_id" => $id
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Official deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete official from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GALLERY ALBUMS RESOURCE DELETIONS ---
        if ($resource === 'albums' || $resource === 'gallery_albums') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अल्बम आयडी आवश्यक आहे. (Album ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id, title_mr FROM gallery_albums WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अल्बम सापडला नाही. (Album not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Delete album record. Note: FK on gallery_photos sets album_id = NULL
                $delStmt = $db->prepare("DELETE FROM gallery_albums WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status"     => "success",
                    "success"    => true,
                    "message"    => "अल्बम यशस्वीरित्या हटवला. (Album successfully deleted.)",
                    "deleted_id" => $id
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Album deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete album from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- GALLERY PHOTOS RESOURCE DELETIONS ---
        if ($resource === 'gallery' || $resource === 'gallery_photos') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "फोटो आयडी आवश्यक आहे. (Photo ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id, title_mr FROM gallery_photos WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "फोटो सापडला नाही. (Photo not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM gallery_photos WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status"     => "success",
                    "success"    => true,
                    "message"    => "फोटो यशस्वीरित्या हटवला. (Photo successfully deleted.)",
                    "deleted_id" => $id
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Photo deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete photo from database."], JSON_UNESCAPED_UNICODE);
            }
        }

        // --- REPORTS RESOURCE DELETION ---
        if ($resource === 'reports') {
            $id = trim((string)($_GET['id'] ?? ($payload['id'] ?? '')));
            if (empty($id)) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल आयडी आवश्यक आहे. (Report ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id, title_mr FROM reports WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "अहवाल सापडला नाही. (Report not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM reports WHERE id = :id");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status"     => "success",
                    "success"    => true,
                    "message"    => "अहवाल यशस्वीरित्या हटवला. (Report successfully deleted.)",
                    "deleted_id" => $id
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Report deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete report from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- INQUIRIES RESOURCE DELETION (DELETE) ---
        if ($resource === 'inquiries') {
            $id = filter_var($_GET['id'] ?? ($payload['id'] ?? null), FILTER_VALIDATE_INT);
            if (!$id || $id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध संदेश आयडी आवश्यक आहे. (Valid inquiry ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id FROM inquiries WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "संदेश आढळला नाही. (Inquiry not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM inquiries WHERE id = :id LIMIT 1");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status"     => "success",
                    "success"    => true,
                    "message"    => "संदेश यशस्वीरित्या हटवला. (Inquiry deleted successfully.)",
                    "deleted_id" => $id
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Inquiry deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete inquiry from database."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- PROTECTED VOLUNTEERS RESOURCE MUTATIONS (DELETE) ---
        if ($resource === 'volunteers') {
            $id = filter_var($_GET['id'] ?? ($payload['id'] ?? null), FILTER_VALIDATE_INT);
            if (!$id || $id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "वैध स्वयंसेवक आयडी आवश्यक आहे. (Valid volunteer ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $checkStmt = $db->prepare("SELECT id FROM volunteers WHERE id = :id LIMIT 1");
                $checkStmt->execute([':id' => $id]);
                $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "स्वयंसेवक नोंद आढळली नाही. (Volunteer record not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                $delStmt = $db->prepare("DELETE FROM volunteers WHERE id = :id LIMIT 1");
                $delStmt->execute([':id' => $id]);

                http_response_code(200);
                echo json_encode([
                    "status"     => "success",
                    "success"    => true,
                    "message"    => "स्वयंसेवक नोंद यशस्वीरित्या हटवली. (Volunteer deleted successfully.)",
                    "deleted_id" => $id
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Volunteer deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete volunteer record."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- PAGE SECTIONS RESOURCE MUTATIONS (DELETE) ---
        if ($resource === 'page_sections' || $resource === 'sections') {
            $id = (int)($_GET['id'] ?? ($payload['id'] ?? 0));
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "विभाग आयडी आवश्यक आहे. (Section ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $chkStmt = $db->prepare("SELECT * FROM page_sections WHERE id = ?");
                $chkStmt->execute([$id]);
                $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "विभाग सापडला नाही. (Section not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Check and handle physical image safely
                if (!empty($existing['image_url'])) {
                    safeCleanupPhysicalFileIfUnused($db, $existing['image_url'], 'page_sections', $id);
                }

                $delStmt = $db->prepare("DELETE FROM page_sections WHERE id = ?");
                $delStmt->execute([$id]);

                http_response_code(200);
                echo json_encode([
                    "status"     => "success",
                    "success"    => true,
                    "message"    => "विभाग यशस्वीरित्या हटवला. (Section deleted successfully.)",
                    "deleted_id" => $id
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Section deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "विभाग हटवताना त्रुटी आली."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        // --- MEDIA FILES RESOURCE MUTATIONS (DELETE with Dependency Check) ---
        if ($resource === 'media_files' || $resource === 'media') {
            $id = (int)($_GET['id'] ?? ($payload['id'] ?? 0));
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(["status" => "error", "success" => false, "message" => "मीडिया आयडी आवश्यक आहे. (Media ID is required.)"], JSON_UNESCAPED_UNICODE);
                exit();
            }

            try {
                $chkStmt = $db->prepare("SELECT * FROM media_files WHERE id = ?");
                $chkStmt->execute([$id]);
                $existing = $chkStmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    http_response_code(404);
                    echo json_encode(["status" => "error", "success" => false, "message" => "मीडिया फाइल सापडली नाही. (Media file not found.)"], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // Reference / dependency tracking check across all content tables
                $refs = getMediaReferencesHelper($db, $existing['file_name'], $existing['file_path']);
                if (!empty($refs)) {
                    $refDetails = [];
                    foreach ($refs as $r) {
                        $refDetails[] = "{$r['table']} ({$r['title']})";
                    }
                    $refListStr = implode(', ', array_slice($refDetails, 0, 5));

                    http_response_code(409); // 409 Conflict
                    echo json_encode([
                        "status"     => "error",
                        "success"    => false,
                        "error_code" => "MEDIA_IN_USE",
                        "message"    => "ही फाइल सध्या वेबसाइटवरील मजकुरात वापरली जात असल्याने हटवता येत नाही. संदर्भ: {$refListStr}. कृपया आधी संबंधित घटकातून फाइल काढा.",
                        "message_en" => "Cannot delete media because it is currently referenced by content: {$refListStr}. Please remove the reference first.",
                        "references" => $refs
                    ], JSON_UNESCAPED_UNICODE);
                    exit();
                }

                // If not referenced: safely delete from media_files and unlink physical file if within uploads dir
                $delStmt = $db->prepare("DELETE FROM media_files WHERE id = ?");
                $delStmt->execute([$id]);

                $fileUnlinked = false;
                $targetRel = $existing['file_path'];
                $uploadsRoot = realpath(__DIR__ . '/../uploads');
                $fullPhysical = realpath(__DIR__ . '/../../' . ltrim($targetRel, '/'));

                if ($fullPhysical && is_file($fullPhysical) && str_starts_with($fullPhysical, $uploadsRoot)) {
                    $fileUnlinked = @unlink($fullPhysical);
                }

                http_response_code(200);
                echo json_encode([
                    "status"        => "success",
                    "success"       => true,
                    "message"       => "मीडिया फाइल यशस्वीरित्या हटवली. (Media file deleted successfully.)",
                    "deleted_id"    => $id,
                    "file_unlinked" => $fileUnlinked
                ], JSON_UNESCAPED_UNICODE);
                exit();
            } catch (PDOException $e) {
                error_log("Media deletion failed: " . $e->getMessage());
                http_response_code(500);
                echo json_encode(["status" => "error", "success" => false, "message" => "Failed to delete media."], JSON_UNESCAPED_UNICODE);
                exit();
            }
        }

        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Administrative mutations (DELETE) for resource '{$resource}' are scheduled for Phase 2.2B."
        ], JSON_UNESCAPED_UNICODE);
        exit();

    default:
        http_response_code(405);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Method Not Allowed."
        ], JSON_UNESCAPED_UNICODE);
        exit();
}
?>
