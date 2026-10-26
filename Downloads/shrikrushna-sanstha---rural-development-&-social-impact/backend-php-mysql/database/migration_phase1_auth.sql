-- ============================================================================
-- SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR
-- Database Migration: Phase 1 Authentication & Authorization Hardening
-- Purpose: Add secure admin token storage (SHA-256 hashed) and login rate limiting
-- Note: DO NOT run without database administrator approval.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DATABASE SELECTION CONVENTION:
-- By default, this migration runs against the currently active database (DATABASE()).
-- If executing via CLI or phpMyAdmin without a pre-selected database,
-- uncomment the following line:
-- USE `shrikrushna_sanstha_db`;
-- ----------------------------------------------------------------------------

-- 1. Database-backed Admin Bearer Tokens Table
-- Tokens are stored as SHA-256 hashes (never plaintext) to prevent compromise if DB is exposed.
CREATE TABLE IF NOT EXISTS `admin_tokens` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL UNIQUE,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` VARCHAR(255) NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` DATETIME NULL,
  INDEX `idx_token_hash` (`token_hash`),
  INDEX `idx_admin_id` (`admin_id`),
  INDEX `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_admin_tokens_admin` 
    FOREIGN KEY (`admin_id`) 
    REFERENCES `admins` (`id`) 
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Login Rate Limiting Table
-- Tracks failed authentication attempts to prevent brute-force attacks.
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `attempted_at` DATETIME NOT NULL,
  INDEX `idx_ip_attempted` (`ip_address`, `attempted_at`),
  INDEX `idx_user_attempted` (`username`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
