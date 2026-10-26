-- Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
-- Migration: Add `email` Column to `admins` Table
-- Target Database: shrikrushnasanstha2

ALTER TABLE `admins`
  ADD COLUMN `email` VARCHAR(150) NULL UNIQUE AFTER `full_name`;
