-- Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
-- Rollback Migration: Remove `email` Column from `admins` Table
-- Target Database: shrikrushnasanstha2

ALTER TABLE `admins`
  DROP COLUMN `email`;
