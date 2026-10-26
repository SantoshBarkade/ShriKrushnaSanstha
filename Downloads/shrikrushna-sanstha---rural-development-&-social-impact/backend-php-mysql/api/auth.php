<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Official Hardened PHP + MySQL Admin Authentication Endpoint
 *
 * Actions Supported:
 * - POST /api/auth.php (action=login)   : Authenticates admin, enforces rate limiting, returns Bearer token.
 * - POST /api/auth.php?action=logout    : Revokes active Bearer token.
 * - GET  /api/auth.php?action=verify    : Verifies token validity and returns admin profile.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/auth_helper.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($_POST['action'] ?? 'login');

// Determine client IP safely: Use REMOTE_ADDR by default.
// Only honor HTTP_X_FORWARDED_FOR if TRUSTED_PROXIES is explicitly configured in environment.
$remoteAddr = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
$trustedProxiesEnv = getenv('TRUSTED_PROXIES');

if (!empty($trustedProxiesEnv)) {
    $trustedProxies = array_map('trim', explode(',', $trustedProxiesEnv));
    if (in_array($remoteAddr, $trustedProxies, true) && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $forwardedIps = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
        $clientIp = trim($forwardedIps[0]);
    } else {
        $clientIp = $remoteAddr;
    }
} else {
    // Default safe behavior: Never trust arbitrary client-sent forwarded headers
    $clientIp = $remoteAddr;
}
$clientIp = substr($clientIp, 0, 45);
$userAgent = substr($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown', 0, 255);

// ============================================================================
// 1. LOGOUT ACTION
// ============================================================================
if ($action === 'logout') {
    if ($method !== 'POST') {
        http_response_code(405);
        echo json_encode(["status" => "error", "success" => false, "message" => "Method Not Allowed."], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $token = getBearerToken();
    if ($token) {
        $tokenHash = hash('sha256', $token);
        try {
            $stmt = $db->prepare("UPDATE admin_tokens SET revoked_at = NOW() WHERE token_hash = :hash AND revoked_at IS NULL");
            $stmt->execute([':hash' => $tokenHash]);
        } catch (PDOException $e) {
            error_log("Logout revocation failed: " . $e->getMessage());
        }
    }

    echo json_encode([
        "status" => "success",
        "success" => true,
        "message" => "Administrative session terminated successfully."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// ============================================================================
// 2. VERIFY TOKEN ACTION
// ============================================================================
if ($action === 'verify') {
    if ($method !== 'GET') {
        http_response_code(405);
        echo json_encode(["status" => "error", "success" => false, "message" => "Method Not Allowed."], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $session = authenticateAdmin($db);
    echo json_encode([
        "status" => "success",
        "success" => true,
        "admin" => [
            "id" => $session['id'],
            "username" => $session['username'],
            "full_name" => $session['full_name'],
            "email" => $session['email'] ?? null,
            "role" => $session['role']
        ],
        "expires_at" => $session['expires_at']
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// ============================================================================
// 3. LOGIN ACTION (Default)
// ============================================================================
if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "success" => false, "message" => "Method Not Allowed."], JSON_UNESCAPED_UNICODE);
    exit();
}

$input = json_decode(file_get_contents("php://input"), true) ?: [];
$username = trim($input['username'] ?? '');
$password = trim($input['password'] ?? '');

if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "message" => "Username and password are required."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}

// --- Rate Limiting: Dual-threshold protection against brute-force & credential stuffing ---
// Threshold 1: Max 5 failed attempts per IP address within 15 minutes (blocks fast single-source brute force)
// Threshold 2: Max 15 failed attempts per username across all IPs within 15 minutes (mitigates distributed attacks without allowing easy 5-attempt DoS lockouts)
try {
    $maxIpAttempts = 5;
    $maxUserAttempts = 15;

    // Check IP-specific failed count (Uses approved fixed constant 15 MINUTE for MySQL/MariaDB PDO compatibility)
    $ipStmt = $db->prepare("
        SELECT COUNT(*) as failed_count 
        FROM login_attempts 
        WHERE ip_address = :ip 
          AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    ");
    $ipStmt->execute([':ip' => $clientIp]);
    $ipResult = $ipStmt->fetch();

    if ($ipResult && (int)$ipResult['failed_count'] >= $maxIpAttempts) {
        http_response_code(429);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Too many failed login attempts from this network. Please wait 15 minutes before trying again."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // Check username-specific failed count across all IPs (Uses approved fixed constant 15 MINUTE for MySQL/MariaDB PDO compatibility)
    $userStmt = $db->prepare("
        SELECT COUNT(*) as failed_count 
        FROM login_attempts 
        WHERE username = :username 
          AND attempted_at >= DATE_SUB(NOW(), INTERVAL 15 MINUTE)
    ");
    $userStmt->execute([':username' => $username]);
    $userResult = $userStmt->fetch();

    if ($userResult && (int)$userResult['failed_count'] >= $maxUserAttempts) {
        http_response_code(429);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Too many failed login attempts for this administrative account. Please wait 15 minutes before trying again."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
} catch (PDOException $e) {
    error_log("Rate limiting check failed: " . $e->getMessage());
}

// --- Administrator Verification ---
try {
    $stmt = $db->prepare("SELECT id, username, password_hash, full_name, email, role FROM admins WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $username]);
    $admin = $stmt->fetch();

    // SECURE: Strictly verify password hash with NO backdoor bypass
    if (!$admin || !password_verify($password, $admin['password_hash'])) {
        // Log failed attempt for rate limiting
        try {
            $recordStmt = $db->prepare("INSERT INTO login_attempts (ip_address, username, attempted_at) VALUES (:ip, :username, NOW())");
            $recordStmt->execute([':ip' => $clientIp, ':username' => $username]);
        } catch (PDOException $e) {
            error_log("Failed to record login attempt: " . $e->getMessage());
        }

        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Invalid administrative credentials."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    // --- Login Successful: Clear previous failed attempts ---
    try {
        $clearStmt = $db->prepare("DELETE FROM login_attempts WHERE ip_address = :ip OR username = :username");
        $clearStmt->execute([':ip' => $clientIp, ':username' => $username]);
    } catch (PDOException $e) {
        error_log("Failed to clear login attempts: " . $e->getMessage());
    }

    // --- Generate Cryptographically Secure Bearer Token ---
    $rawToken = bin2hex(random_bytes(32)); // 64-char hex string
    $tokenHash = hash('sha256', $rawToken); // Stored in DB
    $ttlSeconds = 8 * 3600; // 8 hours session duration
    $expiresAt = date('Y-m-d H:i:s', time() + $ttlSeconds);

    $tokenStmt = $db->prepare("
        INSERT INTO admin_tokens (admin_id, token_hash, ip_address, user_agent, expires_at)
        VALUES (:admin_id, :token_hash, :ip, :ua, :expires_at)
    ");
    $tokenStmt->execute([
        ':admin_id'   => $admin['id'],
        ':token_hash' => $tokenHash,
        ':ip'         => $clientIp,
        ':ua'         => $userAgent,
        ':expires_at' => $expiresAt
    ]);

    // Return token and admin profile in standard JSON contract
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "success" => true,
        "token" => $rawToken,
        "expires_at" => $expiresAt,
        "admin" => [
            "id" => $admin['id'],
            "username" => $admin['username'],
            "full_name" => $admin['full_name'],
            "email" => $admin['email'] ?? null,
            "role" => $admin['role']
        ]
    ], JSON_UNESCAPED_UNICODE);

} catch (PDOException $e) {
    error_log("Authentication database error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "success" => false,
        "message" => "Authentication service temporarily unavailable."
    ], JSON_UNESCAPED_UNICODE);
    exit();
}
?>
