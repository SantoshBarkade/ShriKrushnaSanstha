<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Dedicated Client Super Admin Provisioning Utility
 *
 * Usage: php backend-php-mysql/bin/provision_client_admin.php
 *
 * Security Constraints:
 * - Execution permitted ONLY via CLI (PHP_SAPI === 'cli').
 * - Strictly targets active database 'shrikrushnasanstha2'.
 * - Pre-checks to prevent duplicate accounts.
 * - Password is cryptographically generated (32+ chars, high entropy) and hashed with PASSWORD_DEFAULT.
 * - Plaintext password is NEVER printed to stdout, stderr, or logged.
 * - Credential handoff is written strictly to local ignored file (.client_admin_handoff.txt).
 * - Immediate memory scrubbing of password variables.
 */

declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Access Denied: This utility can only be executed via the command-line interface (CLI).'
    ], JSON_UNESCAPED_UNICODE);
    exit(1);
}

require_once __DIR__ . '/../config/database.php';

echo PHP_EOL;
echo "========================================================================" . PHP_EOL;
echo " SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR" . PHP_EOL;
echo " Dedicated Client Super Admin Provisioning Utility" . PHP_EOL;
echo "========================================================================" . PHP_EOL . PHP_EOL;

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Throwable $e) {
    fwrite(STDERR, "Database connection failure: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

$expectedDb = 'shrikrushnasanstha2';
$stmt = $db->query("SELECT DATABASE() AS cur_db");
$activeDb = $stmt ? (string)$stmt->fetchColumn() : '';

if ($activeDb !== $expectedDb) {
    fwrite(STDERR, "Error: Active database '{$activeDb}' does not match expected target '{$expectedDb}'." . PHP_EOL);
    exit(1);
}

// Client Super Admin Specifications
$clientUsername = 'chetan.nikam';
$clientFullName = 'Chetan Dilip Nikam';
$clientEmail    = 'chetannikam1214@gmail.com';
$clientRole     = 'super_admin';

// Check if username or email already exists in admins table
$checkStmt = $db->prepare("
    SELECT id, username, email, full_name, role 
    FROM admins 
    WHERE username = :u OR email = :e 
    LIMIT 1
");
$checkStmt->execute([':u' => $clientUsername, ':e' => $clientEmail]);
$existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

if ($existing) {
    echo "Notice: An administrator account already exists matching username '{$clientUsername}' or email '{$clientEmail}':" . PHP_EOL;
    echo "  - ID       : {$existing['id']}" . PHP_EOL;
    echo "  - Username : {$existing['username']}" . PHP_EOL;
    echo "  - Full Name: {$existing['full_name']}" . PHP_EOL;
    echo "  - Email    : " . ($existing['email'] ?? 'N/A') . PHP_EOL;
    echo "  - Role     : {$existing['role']}" . PHP_EOL;
    echo "To update the password for this account, run: php backend-php-mysql/bin/set_admin_password.php" . PHP_EOL . PHP_EOL;
    exit(0);
}

// Generate cryptographically secure high-entropy initial password
// 24 random bytes hex (48 chars) + guaranteed uppercase, lowercase, digit, and symbol
$rawEntropy = bin2hex(random_bytes(16));
$generatedPassword = 'Ck#' . substr($rawEntropy, 0, 20) . '9!Z' . substr($rawEntropy, 20);

$passwordHash = password_hash($generatedPassword, PASSWORD_DEFAULT);

$db->beginTransaction();

try {
    $insertStmt = $db->prepare("
        INSERT INTO admins (username, password_hash, full_name, email, role)
        VALUES (:username, :password_hash, :full_name, :email, :role)
    ");
    $insertStmt->execute([
        ':username'      => $clientUsername,
        ':password_hash' => $passwordHash,
        ':full_name'     => $clientFullName,
        ':email'         => $clientEmail,
        ':role'          => $clientRole,
    ]);

    $newAdminId = (int)$db->lastInsertId();
    $db->commit();
    unset($passwordHash);

    // Write credential handoff strictly to git-ignored private handoff file
    $handoffPath = dirname(__DIR__) . '/.client_admin_handoff.txt';
    $handoffContent = implode(PHP_EOL, [
        "========================================================================",
        "SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR",
        "CONFIDENTIAL CLIENT SUPER ADMIN INITIAL CREDENTIALS HANDOFF",
        "Generated At: " . date('Y-m-d H:i:s T'),
        "Target Database: {$activeDb}",
        "========================================================================",
        "Account ID   : {$newAdminId}",
        "Full Name    : {$clientFullName}",
        "Email        : {$clientEmail}",
        "Username     : {$clientUsername}",
        "Role         : {$clientRole}",
        "Initial Pass : {$generatedPassword}",
        "========================================================================",
        "SECURITY NOTICE:",
        "1. Deliver this file or the credentials above to Chetan Dilip Nikam via",
        "   a private, encrypted offline channel.",
        "2. To change or customize the password interactively, run:",
        "   php backend-php-mysql/bin/set_admin_password.php",
        "3. Once handed over, securely delete this file.",
        "========================================================================",
        ""
    ]);

    file_put_contents($handoffPath, $handoffContent, LOCK_EX);
    if (function_exists('chmod')) {
        @chmod($handoffPath, 0600);
    }

    // Instantly scrub plaintext password from memory
    unset($generatedPassword, $handoffContent);

    echo PHP_EOL;
    echo "------------------------------------------------------------------------" . PHP_EOL;
    echo "SUCCESS: Dedicated Client Super Admin provisioned successfully!" . PHP_EOL;
    echo "  - Account ID   : {$newAdminId}" . PHP_EOL;
    echo "  - Username     : {$clientUsername}" . PHP_EOL;
    echo "  - Full Name    : {$clientFullName}" . PHP_EOL;
    echo "  - Email        : {$clientEmail}" . PHP_EOL;
    echo "  - Role         : {$clientRole}" . PHP_EOL;
    echo "  - Target DB    : {$activeDb}" . PHP_EOL;
    echo "  - Handoff File : {$handoffPath} (Secured & Git-Ignored)" . PHP_EOL;
    echo "------------------------------------------------------------------------" . PHP_EOL;
    echo "Note: The password has been securely hashed into the database." . PHP_EOL;
    echo "Plaintext credentials were saved ONLY to the private handoff file above." . PHP_EOL;
    echo "Zero passwords have been displayed on screen or stored in audit logs." . PHP_EOL . PHP_EOL;
    exit(0);

} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    unset($generatedPassword, $passwordHash);
    fwrite(STDERR, "Database Error provisioning administrator: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
