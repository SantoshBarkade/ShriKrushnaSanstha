<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Centralized Administrative Authentication and Authorization Helper
 * Enforces database-backed Bearer Token validation (SHA-256 hashed).
 */

require_once __DIR__ . '/../config/database.php';

/**
 * Extracts and sanitizes the Bearer token from the incoming HTTP request.
 */
function getBearerToken(): ?string {
    $header = null;

    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $header = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (isset($_SERVER['Authorization'])) {
        $header = trim($_SERVER['Authorization']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );
        if (isset($requestHeaders['Authorization'])) {
            $header = trim($requestHeaders['Authorization']);
        }
    }

    if (!empty($header) && preg_match('/^Bearer\s+([a-f0-9]{64})$/i', $header, $matches)) {
        return $matches[1];
    }

    return null;
}

/**
 * Authenticates the caller as an authorized administrator.
 * Validates token existence, expiration, and revocation against the database.
 * Terminates execution with HTTP 401 if validation fails.
 *
 * @param PDO $db Active PDO connection
 * @return array Authenticated admin record
 */
function authenticateAdmin(PDO $db): array {
    $token = getBearerToken();

    if (!$token) {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Unauthorized: Valid administrative Bearer token is required."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $tokenHash = hash('sha256', $token);

    try {
        $stmt = $db->prepare("
            SELECT t.id AS token_id, t.admin_id, t.expires_at, t.revoked_at,
                   a.id, a.username, a.full_name, a.email, a.role
            FROM admin_tokens t
            JOIN admins a ON a.id = t.admin_id
            WHERE t.token_hash = :token_hash
            LIMIT 1
        ");
        $stmt->execute([':token_hash' => $tokenHash]);
        $session = $stmt->fetch();

        if (!$session) {
            http_response_code(401);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "message" => "Unauthorized: Invalid or unknown token."
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        if (!empty($session['revoked_at'])) {
            http_response_code(401);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "message" => "Unauthorized: Token has been revoked. Please log in again."
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        if (strtotime($session['expires_at']) <= time()) {
            http_response_code(401);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "message" => "Unauthorized: Session expired. Please log in again."
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }

        return $session;
    } catch (PDOException $e) {
        error_log("Authentication validation query failed: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            "status" => "error",
            "success" => false,
            "message" => "Authentication service failure. Please contact support."
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }
}
?>
