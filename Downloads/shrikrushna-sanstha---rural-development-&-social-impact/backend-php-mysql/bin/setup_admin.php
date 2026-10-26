<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Secure Initial Administrator Provisioning CLI Script
 *
 * Usage: php backend-php-mysql/bin/setup_admin.php
 *
 * Security Constraints:
 * - Execution permitted ONLY via CLI (PHP_SAPI === 'cli').
 * - Strictly for one-time initial bootstrap; refuses execution if any admin exists.
 * - Interactive input only; refuses command-line argument credentials.
 * - Enforces minimum 12-character strong password policy.
 * - Concurrency-proof singleton enforcement via explicit admins.id = 1 PRIMARY KEY constraint.
 * - Interactive input collection occurs BEFORE opening the database transaction.
 * - Windows and Unix hidden password entry; preserves intentional password characters.
 * - Uses native password_hash(PASSWORD_DEFAULT) and atomic transaction rollback on failure.
 * - Zero logging or echoing of passwords, password hashes, or database secrets.
 */

declare(strict_types=1);

// ----------------------------------------------------------------------------
// 1. SAPI ENVIRONMENT GUARD (CLI ONLY)
// ----------------------------------------------------------------------------
if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'status' => 'error',
        'success' => false,
        'message' => 'Access Denied: This provisioning utility can only be executed via the command-line interface (CLI).'
    ], JSON_UNESCAPED_UNICODE);
    exit(1);
}

// Refuse execution with CLI arguments to prevent credentials appearing in shell history or process list
if (isset($argv) && count($argv) > 1) {
    fwrite(STDERR, PHP_EOL . "SECURITY WARNING: Command-line arguments are not accepted." . PHP_EOL);
    fwrite(STDERR, "Credentials must be entered interactively during execution." . PHP_EOL . PHP_EOL);
    fwrite(STDERR, "Usage: php " . $argv[0] . PHP_EOL . PHP_EOL);
    exit(1);
}

// ----------------------------------------------------------------------------
// 2. BOOTSTRAP DATABASE CONFIGURATION
// ----------------------------------------------------------------------------
require_once __DIR__ . '/../config/database.php';

echo PHP_EOL;
echo "========================================================================" . PHP_EOL;
echo " SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR" . PHP_EOL;
echo " Secure Initial Administrator Provisioning Utility" . PHP_EOL;
echo "========================================================================" . PHP_EOL . PHP_EOL;

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Throwable $e) {
    fwrite(STDERR, "Database connection failure: " . $e->getMessage() . PHP_EOL);
    exit(1);
}

if (!$db instanceof PDO) {
    fwrite(STDERR, "Error: Unable to establish active PDO connection." . PHP_EOL);
    exit(1);
}

// ----------------------------------------------------------------------------
// 3. TARGET DATABASE & TABLE VALIDATION
// ----------------------------------------------------------------------------
$expectedDb = getenv('DB_NAME') ?: 'shrikrushnasanstha2';

$dbCheckStmt = $db->query("SELECT DATABASE() AS cur_db");
$activeDb = $dbCheckStmt ? $dbCheckStmt->fetchColumn() : null;

if ($activeDb !== $expectedDb) {
    fwrite(STDERR, "Error: Active database '{$activeDb}' does not match expected target '{$expectedDb}'." . PHP_EOL);
    fwrite(STDERR, "Aborting setup to prevent unintended database modifications." . PHP_EOL);
    exit(1);
}

// Verify that the admins table exists before querying
$tableCheckStmt = $db->prepare("
    SELECT COUNT(*) 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = :db_name 
      AND TABLE_NAME = 'admins'
");
$tableCheckStmt->execute([':db_name' => $activeDb]);
if ((int)$tableCheckStmt->fetchColumn() === 0) {
    fwrite(STDERR, "Error: The 'admins' table does not exist in '{$activeDb}'." . PHP_EOL);
    fwrite(STDERR, "Please execute the database schema initialization first." . PHP_EOL);
    exit(1);
}

// Fast pre-check: verify if an admin already exists before prompting
$preCheckStmt = $db->query("SELECT COUNT(*) FROM admins");
$preCount = (int)($preCheckStmt ? $preCheckStmt->fetchColumn() : 0);
if ($preCount > 0) {
    fwrite(STDERR, "Refusing execution: An administrator account already exists ({$preCount} found)." . PHP_EOL);
    fwrite(STDERR, "This utility is strictly intended for initial bootstrap. Further user management must be conducted via administrative tools." . PHP_EOL . PHP_EOL);
    exit(1);
}

// ----------------------------------------------------------------------------
// 4. HELPER FUNCTIONS FOR INTERACTIVE INPUT
// ----------------------------------------------------------------------------
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
        // On Windows, use PowerShell Read-Host -AsSecureString for masked input.
        // Convert SecureString to BSTR, extract via PtrToStringAuto, and immediately zero unmanaged BSTR memory.
        $cmd = 'powershell -NoProfile -Command "$sec = Read-Host -AsSecureString; if ($sec) { $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec); $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr); [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr); [Console]::Out.Write($plain) }"';
        $output = shell_exec($cmd);
        echo PHP_EOL;
        // Strip only line endings, preserving intentional leading/trailing spaces
        $password = rtrim($output !== null ? (string)$output : '', "\r\n");
    } else {
        // On Unix-like environments, disable echo via stty
        shell_exec('stty -echo');
        $raw = fgets(STDIN);
        shell_exec('stty echo');
        echo PHP_EOL;
        // Strip only line endings, preserving intentional leading/trailing spaces
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

// ----------------------------------------------------------------------------
// 5. INTERACTIVE DATA COLLECTION & VALIDATION (OUTSIDE TRANSACTION)
// ----------------------------------------------------------------------------
echo "Target Database : {$activeDb}" . PHP_EOL;
echo "Please enter the initial administrator details:" . PHP_EOL . PHP_EOL;

// 5a. Username
$username = '';
while (true) {
    $username = promptInput("Admin Username", "admin");
    if (preg_match('/^[a-zA-Z0-9_.-]{3,64}$/', $username)) {
        break;
    }
    echo "  [!] Username must be 3-64 characters (alphanumeric, underscore, dash, or dot)." . PHP_EOL;
}

// 5b. Full Name
$fullName = '';
while (true) {
    $fullName = promptInput("Full Name (Bilingual/Marathi/English)", "श्रीमती सविता दिलीप निकम (Smt. Savita Dilip Nikam)");
    if (mb_strlen($fullName, 'UTF-8') >= 3 && mb_strlen($fullName, 'UTF-8') <= 120) {
        break;
    }
    echo "  [!] Full Name must be between 3 and 120 characters." . PHP_EOL;
}

// 5c. Role
$role = promptInput("Role Title", "Secretary / Super Admin");
if (mb_strlen($role, 'UTF-8') > 60) {
    $role = mb_substr($role, 0, 60, 'UTF-8');
}

// 5d. Password Input with Confirmation & Policy Enforcement
$password = '';
while (true) {
    $p1 = promptHiddenPassword("Enter Admin Password (min 12 chars, upper, lower, number/symbol)");
    
    $policyError = validatePasswordPolicy($p1);
    if ($policyError !== null) {
        echo "  [!] {$policyError}" . PHP_EOL;
        continue;
    }

    $p2 = promptHiddenPassword("Confirm Admin Password");
    if ($p1 !== $p2) {
        echo "  [!] Passwords do not match. Please try again." . PHP_EOL;
        continue;
    }

    $password = $p1;
    // Clear raw temporary variables
    unset($p1, $p2);
    break;
}

// ----------------------------------------------------------------------------
// 6. PASSWORD HASHING
// ----------------------------------------------------------------------------
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// Instantly scrub plaintext password from memory
unset($password);

// ----------------------------------------------------------------------------
// 7. TRANSACTION & CONCURRENCY-SAFE SINGLETON INSERTION
// ----------------------------------------------------------------------------
// Open the database transaction only after all interactive input is collected
$db->beginTransaction();

try {
    // 7a. Lock check: query existing administrator count with exclusive row/gap locks
    $countStmt = $db->query("SELECT COUNT(*) AS total FROM admins FOR UPDATE");
    $existingAdminCount = (int)($countStmt ? $countStmt->fetchColumn() : 0);

    if ($existingAdminCount > 0) {
        $db->rollBack();
        unset($passwordHash);
        fwrite(STDERR, "Refusing execution: An administrator account already exists ({$existingAdminCount} found)." . PHP_EOL);
        fwrite(STDERR, "This utility is strictly intended for initial bootstrap." . PHP_EOL . PHP_EOL);
        exit(1);
    }

    // 7b. Explicit id = 1 insertion.
    // In addition to the COUNT(*) FOR UPDATE check, explicitly inserting id = 1
    // leverages the database engine's PRIMARY KEY uniqueness constraint.
    // Even if two processes run concurrently with different usernames and staggered
    // timing, only one process can ever claim id = 1. Any competing process will
    // fail unconditionally with a primary key duplicate collision (SQLSTATE 23000 / 1062).
    $insertStmt = $db->prepare("
        INSERT INTO admins (id, username, password_hash, full_name, role)
        VALUES (1, :username, :password_hash, :full_name, :role)
    ");
    $insertStmt->execute([
        ':username'      => $username,
        ':password_hash' => $passwordHash,
        ':full_name'     => $fullName,
        ':role'          => $role,
    ]);

    $newId = (int)$db->lastInsertId();
    if ($newId === 0) {
        $newId = 1;
    }

    $db->commit();
    unset($passwordHash);

    echo PHP_EOL;
    echo "------------------------------------------------------------------------" . PHP_EOL;
    echo "SUCCESS: Initial administrator successfully provisioned!" . PHP_EOL;
    echo "  - Account ID   : {$newId}" . PHP_EOL;
    echo "  - Username     : {$username}" . PHP_EOL;
    echo "  - Full Name    : {$fullName}" . PHP_EOL;
    echo "  - Role         : {$role}" . PHP_EOL;
    echo "  - Target DB    : {$activeDb}" . PHP_EOL;
    echo "------------------------------------------------------------------------" . PHP_EOL;
    echo "Note: Keep your credentials safe. You may now log in via the Administrative Portal." . PHP_EOL . PHP_EOL;
    exit(0);

} catch (PDOException $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    unset($passwordHash);

    // Identify primary key or unique constraint violations
    $sqlState = (string)$e->getCode();
    $errorMsg = $e->getMessage();
    if ($sqlState === '23000' || str_contains($errorMsg, '1062') || str_contains($errorMsg, 'Duplicate entry') || str_contains($errorMsg, 'UNIQUE constraint failed')) {
        fwrite(STDERR, PHP_EOL . "Refusing execution: An administrator account was already provisioned concurrently (primary key id=1 or username collision)." . PHP_EOL);
    } else {
        fwrite(STDERR, PHP_EOL . "Database error provisioning administrator: " . $errorMsg . PHP_EOL);
    }
    exit(1);
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    unset($passwordHash);
    fwrite(STDERR, PHP_EOL . "Error provisioning administrator: " . $e->getMessage() . PHP_EOL);
    exit(1);
}
