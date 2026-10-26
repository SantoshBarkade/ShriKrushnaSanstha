<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Reversible Database Migration: Add `email` Column to `admins` Table
 *
 * Target Database: shrikrushnasanstha2
 *
 * Usage:
 *   Apply migration:  php backend-php-mysql/migrations/add_email_to_admins.php up
 *   Rollback:         php backend-php-mysql/migrations/add_email_to_admins.php down
 */

declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

class AddEmailToAdminsMigration {
    private PDO $db;
    private string $activeDb;
    private const EXPECTED_DB = 'shrikrushnasanstha2';

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();

        $stmt = $this->db->query("SELECT DATABASE() AS cur_db");
        $this->activeDb = (string)($stmt ? $stmt->fetchColumn() : '');

        if ($this->activeDb !== self::EXPECTED_DB) {
            throw new RuntimeException("Migration aborted: Active database '{$this->activeDb}' does not match expected target '" . self::EXPECTED_DB . "'.");
        }
    }

    private function hasEmailColumn(): bool {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) 
            FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = :db_name 
              AND TABLE_NAME = 'admins' 
              AND COLUMN_NAME = 'email'
        ");
        $stmt->execute([':db_name' => $this->activeDb]);
        return (int)$stmt->fetchColumn() > 0;
    }

    public function up(): bool {
        echo "Applying migration: Adding `email` column to `admins` table...\n";
        if ($this->hasEmailColumn()) {
            echo "Notice: `email` column already exists in `admins` table. No action taken.\n";
            return true;
        }

        $sql = "ALTER TABLE admins ADD COLUMN email VARCHAR(150) NULL UNIQUE AFTER full_name";
        $this->db->exec($sql);
        echo "SUCCESS: `email` column successfully added to `admins` table in database '{$this->activeDb}'.\n";
        return true;
    }

    public function down(): bool {
        echo "Reverting migration: Dropping `email` column from `admins` table...\n";
        if (!$this->hasEmailColumn()) {
            echo "Notice: `email` column does not exist in `admins` table. No action taken.\n";
            return true;
        }

        $sql = "ALTER TABLE admins DROP COLUMN email";
        $this->db->exec($sql);
        echo "SUCCESS: `email` column successfully dropped from `admins` table in database '{$this->activeDb}'.\n";
        return true;
    }
}

// CLI Execution handler
if (PHP_SAPI === 'cli') {
    try {
        $migration = new AddEmailToAdminsMigration();
        $action = $argv[1] ?? 'up';

        if (strtolower($action) === 'down') {
            $migration->down();
        } else {
            $migration->up();
        }
    } catch (Throwable $e) {
        fwrite(STDERR, "Migration Error: " . $e->getMessage() . PHP_EOL);
        exit(1);
    }
}
