<?php
/**
 * Executes Phase 2B Volunteers Schema Migration safely and idempotently.
 */

require_once __DIR__ . '/../backend-php-mysql/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Running Phase 2B Volunteers Migration...\n";

// Helper to check if column exists
function columnExists(PDO $db, string $table, string $column): bool {
    $stmt = $db->prepare("
        SELECT COUNT(*) 
        FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = :table 
          AND COLUMN_NAME = :col
    ");
    $stmt->execute([':table' => $table, ':col' => $column]);
    return (int)$stmt->fetchColumn() > 0;
}

// Helper to check if index exists
function indexExists(PDO $db, string $table, string $indexName): bool {
    $stmt = $db->prepare("
        SELECT COUNT(*) 
        FROM information_schema.STATISTICS 
        WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = :table 
          AND INDEX_NAME = :idx
    ");
    $stmt->execute([':table' => $table, ':idx' => $indexName]);
    return (int)$stmt->fetchColumn() > 0;
}

try {
    // 1. Add age_bracket column
    if (!columnExists($db, 'volunteers', 'age_bracket')) {
        echo "Adding column 'age_bracket'...\n";
        $db->exec("ALTER TABLE `volunteers` ADD COLUMN `age_bracket` VARCHAR(30) NULL DEFAULT NULL AFTER `district`");
    } else {
        echo "Column 'age_bracket' already exists.\n";
    }

    // 2. Add gender column
    if (!columnExists($db, 'volunteers', 'gender')) {
        echo "Adding column 'gender'...\n";
        $db->exec("ALTER TABLE `volunteers` ADD COLUMN `gender` VARCHAR(30) NULL DEFAULT NULL AFTER `age_bracket`");
    } else {
        echo "Column 'gender' already exists.\n";
    }

    // 3. Add availability column
    if (!columnExists($db, 'volunteers', 'availability')) {
        echo "Adding column 'availability'...\n";
        $db->exec("ALTER TABLE `volunteers` ADD COLUMN `availability` VARCHAR(50) NULL DEFAULT NULL AFTER `gender`");
    } else {
        echo "Column 'availability' already exists.\n";
    }

    // 4. Add ip_address column
    if (!columnExists($db, 'volunteers', 'ip_address')) {
        echo "Adding column 'ip_address'...\n";
        $db->exec("ALTER TABLE `volunteers` ADD COLUMN `ip_address` VARCHAR(45) NULL DEFAULT NULL AFTER `status`");
    } else {
        echo "Column 'ip_address' already exists.\n";
    }

    // 5. Expand areas_of_interest to TEXT
    echo "Modifying 'areas_of_interest' to TEXT...\n";
    $db->exec("ALTER TABLE `volunteers` MODIFY COLUMN `areas_of_interest` TEXT NOT NULL");

    // 6. Expand status ENUM
    echo "Updating 'status' ENUM...\n";
    $db->exec("ALTER TABLE `volunteers` MODIFY COLUMN `status` ENUM('new', 'reviewing', 'approved', 'contacted', 'declined', 'rejected', 'archived') NOT NULL DEFAULT 'new'");

    // 7. Add index for ip_address and created_at
    if (!indexExists($db, 'volunteers', 'idx_volunteers_ip_created')) {
        echo "Adding index 'idx_volunteers_ip_created'...\n";
        $db->exec("CREATE INDEX `idx_volunteers_ip_created` ON `volunteers` (`ip_address`, `created_at`)");
    } else {
        echo "Index 'idx_volunteers_ip_created' already exists.\n";
    }

    echo "\n[SUCCESS] Phase 2B Migration completed successfully!\n";

    // Describe volunteers table
    $cols = $db->query("DESCRIBE `volunteers`")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($cols, JSON_PRETTY_PRINT) . PHP_EOL;

} catch (Throwable $e) {
    echo "\n[ERROR] Migration failed: " . $e->getMessage() . PHP_EOL;
    exit(1);
}
