-- ============================================================================
-- SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR
-- Database Migration: Phase 2B — Volunteer Registration Schema Expansion
-- File: backend-php-mysql/database/migration_phase2b_volunteers.sql
--
-- Safety & Idempotency:
-- - 100% NON-DESTRUCTIVE: Existing columns and tables are preserved.
-- - Adds missing columns for Phase 2B volunteer registration requirements.
-- ============================================================================

-- 1. Add age_bracket column
ALTER TABLE `volunteers` 
  ADD COLUMN IF NOT EXISTS `age_bracket` VARCHAR(30) NULL DEFAULT NULL AFTER `district`;

-- 2. Add gender column
ALTER TABLE `volunteers` 
  ADD COLUMN IF NOT EXISTS `gender` VARCHAR(30) NULL DEFAULT NULL AFTER `age_bracket`;

-- 3. Add availability column
ALTER TABLE `volunteers` 
  ADD COLUMN IF NOT EXISTS `availability` VARCHAR(50) NULL DEFAULT NULL AFTER `gender`;

-- 4. Add ip_address column for rate-limiting and audit
ALTER TABLE `volunteers` 
  ADD COLUMN IF NOT EXISTS `ip_address` VARCHAR(45) NULL DEFAULT NULL AFTER `status`;

-- 5. Expand areas_of_interest to TEXT
ALTER TABLE `volunteers` 
  MODIFY COLUMN `areas_of_interest` TEXT NOT NULL;

-- 6. Expand status ENUM to support required workflow states (new, reviewing, approved, contacted, declined, rejected, archived)
ALTER TABLE `volunteers` 
  MODIFY COLUMN `status` ENUM('new', 'reviewing', 'approved', 'contacted', 'declined', 'rejected', 'archived') NOT NULL DEFAULT 'new';
