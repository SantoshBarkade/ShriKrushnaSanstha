<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Secure Interactive Administrator Password Management Utility
 *
 * Usage: php backend-php-mysql/bin/set_admin_password.php
 *
 * Security Constraints:
 * - Execution permitted ONLY via CLI (PHP_SAPI === 'cli').
 * - Interactive masked password entry (Windows PowerShell Read-Host -AsSecureString / Unix stty -echo).
 * - Enforces minimum 12-character strong password policy.
 * - Atomic database transaction with session revocation.
 * - Zero logging or echoing of passwords or password hashes.
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
echo " Secure Administrator Password Reset Utility" . PHP_EOL;
echo "========================================================================" . PHP_EOL . PHP_EOL;

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Throwable $e) {
    fwrite(STDERR, "Database connection failure: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

// Target database verification
$expectedDb = 'shrikrushnasanstha2';
$stmt = $db->query("SELECT DATABASE() AS cur_db");
$activeDb = $stmt ? (string)$stmt->fetchColumn() : '';

if ($activeDb !== $expectedDb) {
    fwrite(STDERR, "Error: Active database '{$activeDb}' does not match expected target '{$expectedDb}'." . PHP_EOL);
    exit(1);
}

function promptInput(string $prompt, string $default = ''): string {
    $display = $default !== '' ? "{$prompt} [{$default}]: " : "{$prompt}: ";
    echo $display;
    $input = trim((string)fgets(STDIN));
    return $input !== '' ? $input : $default;
}

function promptHiddenPassword(string $prompt): string {
    echo $prompt . ": ";
    $password = '';

    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        $cmd = 'powershell -NoProfile -Command "$sec = Read-Host -AsSecureString; if ($sec) { $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec); $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr); [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr); [Console]::Out.Write($plain) }"';
        $output = shell_exec($cmd);
        echo PHP_EOL;
        $password = rtrim($output !== null ? (string)$output : '', "\r\n");
    } else {
        shell_exec('stty -echo');
        $raw = fgets(STDIN);
        shell_exec('stty echo');
        echo PHP_EOL;
        $password = rtrim($raw !== false ? $raw : '', "\r\n");
    }

    return $password;
}

function validatePasswordPolicy(string $pwd): ?string {
    if (strlen($pwd) < 12) {
        return "Password is too short. Minimum 12 characters required.";
    }
    if (!preg_match('/[A-Z]/', $pwd)) {
        return "Password must contain at least one uppercase letter.";
    }
    if (!preg_match('/[a-z]/', $pwd)) {
        return "Password must contain at least one lowercase letter.";
    }
    if (!preg_match('/[0-9]/', $pwd) && !preg_match('/[^a-zA-Z0-9]/', $pwd)) {
        return "Password must contain at least one number or special symbol.";
    }
    return null;
}

$username = promptInput("Admin Username to Update", "chetan.nikam");

$userStmt = $db->prepare("SELECT id, username, full_name, role FROM admins WHERE username = :username LIMIT 1");
$userStmt->execute([':username' => $username]);
$admin = $userStmt->fetch(PDO::FETCH_ASSOC);

if (!$admin) {
    fwrite(STDERR, "Error: Administrator account '{$username}' was not found in '{$activeDb}'." . PHP_EOL);
    exit(1);
}

echo "Found Administrator: ID={$admin['id']}, Name={$admin['full_name']}, Role={$admin['role']}" . PHP_EOL . PHP_EOL;

// Password entry & confirmation
$password = '';
while (true) {
    $p1 = promptHiddenPassword("Enter New Password (min 12 chars, upper, lower, number/symbol)");
    
    $err = validatePasswordPolicy($p1);
    if ($err !== null) {
        echo "  [!] {$err}" . PHP_EOL;
        continue;
    }

    $p2 = promptHiddenPassword("Confirm New Password");
    if ($p1 !== $p2) {
        echo "  [!] Passwords do not match. Please try again." . PHP_EOL;
        continue;
    }

    $password = $p1;
    unset($p1, $p2);
    break;
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
unset($password);

$db->beginTransaction();

try {
    $updateStmt = $db->prepare("
        UPDATE admins 
        SET password_hash = :hash, updated_at = NOW() 
        WHERE id = :id
    ");
    $updateStmt->execute([
        ':hash' => $passwordHash,
        ':id'   => $admin['id']
    ]);

    // Revoke any existing active session tokens to enforce re-authentication
    $revokeStmt = $db->prepare("
        UPDATE admin_tokens 
        SET revoked_at = NOW() 
        WHERE admin_id = :id AND revoked_at IS NULL
    ");
    $revokeStmt->execute([':id' => $admin['id']]);

    $db->commit();
    unset($passwordHash);

    echo PHP_EOL;
    echo "------------------------------------------------------------------------" . PHP_EOL;
    echo "SUCCESS: Password updated successfully for '{$username}'!" . PHP_EOL;
    echo "All previous active sessions have been revoked." . PHP_EOL;
    echo "The administrator may now log in with the new credentials." . PHP_EOL;
    echo "------------------------------------------------------------------------" . PHP_EOL . PHP_EOL;
    exit(0);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    unset($passwordHash);
    fwrite(STDERR, "Error updating password: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
