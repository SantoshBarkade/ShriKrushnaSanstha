-- ============================================================================
-- SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR
-- Database Migration: Phase 2.1 — Schema Expansion & Entity Relationships
-- File: backend-php-mysql/database/migration_phase2_schema.sql
--
-- Target Database: shrikrushna_sanstha_db
-- Supported Engines: MySQL 5.7+, MySQL 8.0+, MySQL 8.4 LTS, MariaDB 10.3+
-- Default Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
--
-- PURPOSE:
-- Expand database schema to support all Phase 2 functional modules:
-- 1. Officials (Board & Office Bearers)
-- 2. Gallery Albums & Album-to-Photo Hierarchy
-- 3. Gallery Photos enhancements (album_id, alt text, featured_on_home)
-- 4. Volunteers (Private inquiries & applications, separate from public content)
-- 5. Site Pages & Page Sections (Editable CMS pages like About, Working Areas)
-- 6. Site Settings & Global Config (Homepage text, header/footer configuration)
-- 7. Initiatives & Multiple Photos per Activity (initiative_photos)
-- 8. Government Welfare Schemes (Dedicated structured catalog)
-- 9. Announcements enhancements (cover_image_url, display_order)
-- 10. Calendar Events & Event Photos (Workshops, camps, meetings)
-- 11. Reports & PDF Documents enhancements (cover_image_url, file_path)
-- 12. YouTube Video Gallery enhancements (bilingual duration, related activity)
-- 13. Contact Inquiries tracking (status, admin_notes, replied_at, replied_by)
-- 14. Media Metadata (media_files: file paths, mime types, sizes, uploader)
--
-- SAFETY & IDEMPOTENCY GUARANTEES:
-- - 100% NON-DESTRUCTIVE: Does NOT drop, truncate, or overwrite existing tables.
-- - IDEMPOTENT: Safe to run on fresh databases OR populated existing databases.
-- - SAFE COLUMN ADDITIONS: Uses temporary stored procedures that check
--   information_schema before adding columns, indexes, or foreign keys.
-- - NO BASE64 IN DB: Stores file paths and metadata only.
-- - NO UNNECESSARY PERSONAL DATA: No volunteer ID-proof uploads or sensitive KYC.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- DATABASE SELECTION CONVENTION:
-- By default, this migration runs against the currently active database (DATABASE()).
-- If executing via CLI or phpMyAdmin without a pre-selected database,
-- uncomment the following line:
-- USE `shrikrushna_sanstha_db`;
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- SECTION 0: TEMPORARY STORED PROCEDURES FOR IDEMPOTENT SCHEMA MODIFICATIONS
-- (These will be automatically dropped at the end of this migration file)
-- ----------------------------------------------------------------------------

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_phase2_add_column_if_missing`$$
CREATE PROCEDURE `sp_phase2_add_column_if_missing`(
    IN in_table_name VARCHAR(64),
    IN in_column_name VARCHAR(64),
    IN in_column_def TEXT
)
BEGIN
    DECLARE col_count INT;
    SELECT COUNT(*) INTO col_count
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = in_table_name
      AND COLUMN_NAME = in_column_name;

    IF col_count = 0 THEN
        SET @sql_stmt = CONCAT('ALTER TABLE `', in_table_name, '` ADD COLUMN `', in_column_name, '` ', in_column_def);
        PREPARE stmt FROM @sql_stmt;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DROP PROCEDURE IF EXISTS `sp_phase2_add_index_if_missing`$$
CREATE PROCEDURE `sp_phase2_add_index_if_missing`(
    IN in_table_name VARCHAR(64),
    IN in_index_name VARCHAR(64),
    IN in_index_def TEXT
)
BEGIN
    DECLARE idx_count INT;
    SELECT COUNT(*) INTO idx_count
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = in_table_name
      AND INDEX_NAME = in_index_name;

    IF idx_count = 0 THEN
        SET @sql_stmt = CONCAT('ALTER TABLE `', in_table_name, '` ADD INDEX `', in_index_name, '` ', in_index_def);
        PREPARE stmt FROM @sql_stmt;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DROP PROCEDURE IF EXISTS `sp_phase2_add_fk_if_missing`$$
CREATE PROCEDURE `sp_phase2_add_fk_if_missing`(
    IN in_table_name VARCHAR(64),
    IN in_fk_name VARCHAR(64),
    IN in_fk_def TEXT
)
BEGIN
    DECLARE fk_count INT;
    SELECT COUNT(*) INTO fk_count
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = in_table_name
      AND CONSTRAINT_NAME = in_fk_name
      AND CONSTRAINT_TYPE = 'FOREIGN KEY';

    IF fk_count = 0 THEN
        SET @sql_stmt = CONCAT('ALTER TABLE `', in_table_name, '` ADD CONSTRAINT `', in_fk_name, '` ', in_fk_def);
        PREPARE stmt FROM @sql_stmt;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$

DELIMITER ;

-- ----------------------------------------------------------------------------
-- SECTION 1: OFFICIALS TABLE (Board & Executive Office Bearers)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `officials` (
  `id` VARCHAR(64) PRIMARY KEY,
  `name_mr` VARCHAR(150) NOT NULL,
  `name_en` VARCHAR(150) NOT NULL,
  `role_mr` VARCHAR(150) NOT NULL,
  `role_en` VARCHAR(150) NOT NULL,
  `bio_mr` TEXT NULL,
  `bio_en` TEXT NULL,
  `phone` VARCHAR(50) NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `published` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_officials_published` (`published`),
  INDEX `idx_officials_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 2: GALLERY ALBUMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `gallery_albums` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `description_mr` TEXT NULL,
  `description_en` TEXT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'सर्व',
  `cover_image_url` VARCHAR(500) NOT NULL,
  `event_date` VARCHAR(50) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `published` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_albums_category` (`category`),
  INDEX `idx_albums_published` (`published`),
  INDEX `idx_albums_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 3: GALLERY PHOTOS ENHANCEMENTS (album_id, alt text, home toggle)
-- ----------------------------------------------------------------------------
CALL sp_phase2_add_column_if_missing('gallery_photos', 'album_id', 'VARCHAR(64) NULL AFTER `id`');
CALL sp_phase2_add_column_if_missing('gallery_photos', 'activity_id', 'VARCHAR(64) NULL AFTER `album_id`');
CALL sp_phase2_add_column_if_missing('gallery_photos', 'alt_text_mr', 'VARCHAR(255) NULL AFTER `caption_en`');
CALL sp_phase2_add_column_if_missing('gallery_photos', 'alt_text_en', 'VARCHAR(255) NULL AFTER `alt_text_mr`');
CALL sp_phase2_add_column_if_missing('gallery_photos', 'featured_on_home', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER `year`');
CALL sp_phase2_add_column_if_missing('gallery_photos', 'display_order', 'INT NOT NULL DEFAULT 0 AFTER `featured_on_home`');
CALL sp_phase2_add_column_if_missing('gallery_photos', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');

CALL sp_phase2_add_index_if_missing('gallery_photos', 'idx_photos_album', '(`album_id`)');
CALL sp_phase2_add_index_if_missing('gallery_photos', 'idx_photos_activity', '(`activity_id`)');
CALL sp_phase2_add_index_if_missing('gallery_photos', 'idx_photos_home', '(`published`, `featured_on_home`)');
CALL sp_phase2_add_index_if_missing('gallery_photos', 'idx_photos_category', '(`category`)');
CALL sp_phase2_add_index_if_missing('gallery_photos', 'idx_photos_order', '(`display_order`)');

CALL sp_phase2_add_fk_if_missing('gallery_photos', 'fk_gallery_photos_album', 'FOREIGN KEY (`album_id`) REFERENCES `gallery_albums` (`id`) ON DELETE SET NULL');
CALL sp_phase2_add_fk_if_missing('gallery_photos', 'fk_gallery_photos_activity', 'FOREIGN KEY (`activity_id`) REFERENCES `initiatives` (`id`) ON DELETE SET NULL');

-- ----------------------------------------------------------------------------
-- SECTION 4: VOLUNTEERS TABLE (Private Administrative Submissions)
-- Kept separate from public website content. No ID-proof/Aadhaar required.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `volunteers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(150) NULL,
  `city_village` VARCHAR(100) NOT NULL,
  `taluka` VARCHAR(100) NOT NULL DEFAULT 'कन्नड',
  `district` VARCHAR(100) NOT NULL DEFAULT 'छत्रपती संभाजीनगर',
  `occupation` VARCHAR(100) NULL,
  `areas_of_interest` VARCHAR(255) NOT NULL,
  `message` TEXT NULL,
  `status` ENUM('new', 'contacted', 'approved', 'rejected', 'archived') NOT NULL DEFAULT 'new',
  `admin_notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_volunteers_status` (`status`),
  INDEX `idx_volunteers_phone` (`phone`),
  INDEX `idx_volunteers_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 5: EDITABLE INFORMATIONAL PAGES & SECTIONS (CMS Pages)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_pages` (
  `slug` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `meta_description_mr` VARCHAR(500) NULL,
  `meta_description_en` VARCHAR(500) NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `page_sections` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `page_slug` VARCHAR(64) NOT NULL,
  `section_key` VARCHAR(64) NOT NULL,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `subtitle_mr` VARCHAR(255) NULL,
  `subtitle_en` VARCHAR(255) NULL,
  `content_mr` LONGTEXT NOT NULL,
  `content_en` LONGTEXT NOT NULL,
  `image_url` VARCHAR(500) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_sections_page` (`page_slug`),
  INDEX `idx_sections_lookup` (`page_slug`, `section_key`),
  INDEX `idx_sections_order` (`display_order`),
  CONSTRAINT `fk_page_sections_page`
    FOREIGN KEY (`page_slug`)
    REFERENCES `site_pages` (`slug`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 6: HOMEPAGE CONTENT & WEBSITE SETTINGS (Key-Value Config)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `key_name` VARCHAR(64) PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `value_mr` TEXT NULL,
  `value_en` TEXT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_settings_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 7: INITIATIVES ENHANCEMENTS & MULTIPLE PHOTOS PER ACTIVITY
-- ----------------------------------------------------------------------------
CALL sp_phase2_add_column_if_missing('initiatives', 'related_report_id', 'VARCHAR(64) NULL AFTER `featured`');
CALL sp_phase2_add_column_if_missing('initiatives', 'tags', 'VARCHAR(255) NULL AFTER `related_report_id`');
CALL sp_phase2_add_column_if_missing('initiatives', 'display_order', 'INT NOT NULL DEFAULT 0 AFTER `tags`');
CALL sp_phase2_add_column_if_missing('initiatives', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');

CALL sp_phase2_add_index_if_missing('initiatives', 'idx_initiatives_published', '(`published`, `featured`)');
CALL sp_phase2_add_index_if_missing('initiatives', 'idx_initiatives_category', '(`category`)');
CALL sp_phase2_add_index_if_missing('initiatives', 'idx_initiatives_scheme', '(`is_govt_scheme`)');
CALL sp_phase2_add_index_if_missing('initiatives', 'idx_initiatives_order', '(`display_order`)');

CALL sp_phase2_add_fk_if_missing('initiatives', 'fk_initiatives_report', 'FOREIGN KEY (`related_report_id`) REFERENCES `reports` (`id`) ON DELETE SET NULL');

-- Child table supporting multiple photos per activity
CREATE TABLE IF NOT EXISTS `initiative_photos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `initiative_id` VARCHAR(64) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `caption_mr` VARCHAR(255) NULL,
  `caption_en` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_init_photos_init` (`initiative_id`),
  INDEX `idx_init_photos_order` (`display_order`),
  CONSTRAINT `fk_initiative_photos_parent`
    FOREIGN KEY (`initiative_id`)
    REFERENCES `initiatives` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 8: GOVERNMENT WELFARE SCHEMES (Dedicated Structured Catalog)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `government_schemes` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `department_mr` VARCHAR(255) NULL,
  `department_en` VARCHAR(255) NULL,
  `beneficiary_category_mr` VARCHAR(255) NULL,
  `beneficiary_category_en` VARCHAR(255) NULL,
  `summary_mr` TEXT NOT NULL,
  `summary_en` TEXT NOT NULL,
  `eligibility_mr` TEXT NULL,
  `eligibility_en` TEXT NULL,
  `documents_required_mr` TEXT NULL,
  `documents_required_en` TEXT NULL,
  `benefits_mr` TEXT NULL,
  `benefits_en` TEXT NULL,
  `official_portal_url` VARCHAR(500) NULL,
  `cover_image_url` VARCHAR(500) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `published` TINYINT(1) NOT NULL DEFAULT 1,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_schemes_published` (`published`, `featured`),
  INDEX `idx_schemes_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 9: ANNOUNCEMENTS ENHANCEMENTS
-- ----------------------------------------------------------------------------
CALL sp_phase2_add_column_if_missing('announcements', 'cover_image_url', 'VARCHAR(500) NULL AFTER `content_en`');
CALL sp_phase2_add_column_if_missing('announcements', 'display_order', 'INT NOT NULL DEFAULT 0 AFTER `cover_image_url`');
CALL sp_phase2_add_column_if_missing('announcements', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');

CALL sp_phase2_add_index_if_missing('announcements', 'idx_announcements_published', '(`published`, `is_upcoming`)');
CALL sp_phase2_add_index_if_missing('announcements', 'idx_announcements_order', '(`display_order`)');

-- ----------------------------------------------------------------------------
-- SECTION 10: EVENTS TABLE & MULTIPLE PHOTOS PER EVENT
-- Calendar events, workshops, health camps, and public meetings
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `events` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'सर्व',
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `event_date_text_mr` VARCHAR(100) NULL,
  `event_date_text_en` VARCHAR(100) NULL,
  `event_time` VARCHAR(100) NULL,
  `venue_mr` VARCHAR(255) NOT NULL DEFAULT 'नादरपूर, ता. कन्नड',
  `venue_en` VARCHAR(255) NOT NULL DEFAULT 'Nadarpur, Tahsil Kannad',
  `summary_mr` TEXT NOT NULL,
  `summary_en` TEXT NOT NULL,
  `description_mr` LONGTEXT NULL,
  `description_en` LONGTEXT NULL,
  `cover_image_url` VARCHAR(500) NULL,
  `status` ENUM('upcoming', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'upcoming',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `published` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_events_status` (`status`),
  INDEX `idx_events_start` (`start_date`),
  INDEX `idx_events_published` (`published`, `is_featured`),
  INDEX `idx_events_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Child table supporting multiple photos per event
CREATE TABLE IF NOT EXISTS `event_photos` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `event_id` VARCHAR(64) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `caption_mr` VARCHAR(255) NULL,
  `caption_en` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_evt_photos_event` (`event_id`),
  INDEX `idx_evt_photos_order` (`display_order`),
  CONSTRAINT `fk_event_photos_parent`
    FOREIGN KEY (`event_id`)
    REFERENCES `events` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 11: REPORTS & PDF DOCUMENTS ENHANCEMENTS
-- ----------------------------------------------------------------------------
CALL sp_phase2_add_column_if_missing('reports', 'cover_image_url', 'VARCHAR(500) NULL AFTER `pdf_url`');
CALL sp_phase2_add_column_if_missing('reports', 'file_path', 'VARCHAR(500) NULL AFTER `cover_image_url`');
CALL sp_phase2_add_column_if_missing('reports', 'display_order', 'INT NOT NULL DEFAULT 0 AFTER `file_path`');
CALL sp_phase2_add_column_if_missing('reports', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');

CALL sp_phase2_add_index_if_missing('reports', 'idx_reports_published', '(`published`)');
CALL sp_phase2_add_index_if_missing('reports', 'idx_reports_order', '(`display_order`)');

-- ----------------------------------------------------------------------------
-- SECTION 12: YOUTUBE VIDEO GALLERY ENHANCEMENTS
-- ----------------------------------------------------------------------------
CALL sp_phase2_add_column_if_missing('videos', 'duration_formatted_en', "VARCHAR(32) DEFAULT '03:00' AFTER `duration_formatted`");
CALL sp_phase2_add_column_if_missing('videos', 'related_activity_title', 'VARCHAR(255) NULL AFTER `featured`');
CALL sp_phase2_add_column_if_missing('videos', 'display_order', 'INT NOT NULL DEFAULT 0 AFTER `related_activity_title`');
CALL sp_phase2_add_column_if_missing('videos', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');

CALL sp_phase2_add_index_if_missing('videos', 'idx_videos_published', '(`published`, `featured`)');
CALL sp_phase2_add_index_if_missing('videos', 'idx_videos_category', '(`category`)');
CALL sp_phase2_add_index_if_missing('videos', 'idx_videos_order', '(`display_order`)');

-- ----------------------------------------------------------------------------
-- SECTION 13: CONTACT INQUIRIES & ADMINISTRATIVE STATUS TRACKING
-- ----------------------------------------------------------------------------
CALL sp_phase2_add_column_if_missing('inquiries', 'status', "ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new' AFTER `message`");
CALL sp_phase2_add_column_if_missing('inquiries', 'admin_notes', 'TEXT NULL AFTER `status`');
CALL sp_phase2_add_column_if_missing('inquiries', 'replied_at', 'DATETIME NULL AFTER `admin_notes`');
CALL sp_phase2_add_column_if_missing('inquiries', 'replied_by', 'INT UNSIGNED NULL AFTER `replied_at`');
CALL sp_phase2_add_column_if_missing('inquiries', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`');

CALL sp_phase2_add_index_if_missing('inquiries', 'idx_inquiries_status', '(`status`)');
CALL sp_phase2_add_index_if_missing('inquiries', 'idx_inquiries_created', '(`created_at`)');

CALL sp_phase2_add_fk_if_missing('inquiries', 'fk_inquiries_replied_admin', 'FOREIGN KEY (`replied_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL');

-- ----------------------------------------------------------------------------
-- SECTION 14: MEDIA METADATA TABLE (Uploaded Images & Documents Tracking)
-- Strictly stores file paths and metadata. NO binary data or Base64 in database.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `media_files` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `file_name` VARCHAR(255) NOT NULL,
  `original_name` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_type` ENUM('image', 'document', 'other') NOT NULL DEFAULT 'image',
  `mime_type` VARCHAR(100) NOT NULL,
  `file_size_bytes` INT UNSIGNED NOT NULL,
  `alt_text_mr` VARCHAR(255) NULL,
  `alt_text_en` VARCHAR(255) NULL,
  `uploaded_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_media_type` (`file_type`),
  INDEX `idx_media_uploader` (`uploaded_by`),
  INDEX `idx_media_created` (`created_at`),
  CONSTRAINT `fk_media_uploaded_admin`
    FOREIGN KEY (`uploaded_by`)
    REFERENCES `admins` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- SECTION 15: SEED INITIAL ESSENTIAL DATA FOR NEW TABLES (IDEMPOTENT)
-- ----------------------------------------------------------------------------

-- 1. Officials
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `image_url`, `display_order`, `published`) VALUES
('off-1', 'श्रीमती सविता दिलीप निकम', 'Smt. Savita Dilip Nikam', 'सचिव व मुख्य प्रवर्तक', 'Secretary & Chief Promoter', 'ग्रामीण विकास, महिला सक्षमीकरण, CSC बाल विद्यालय व शासकीय योजनांच्या तळागाळातील अंमलबजावणीसाठी समर्पित नेतृत्व.', 'Dedicated leadership in rural development, women empowerment, CSC Bal Vidyalaya, and grassroots welfare scheme implementation.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', 1, 1),
('off-2', 'श्री. दिलीप निकम', 'Shri. Dilip Nikam', 'अध्यक्ष व मार्गदर्शक', 'President & Mentor', 'नादरपूर व छत्रपती संभाजीनगर जिल्ह्यात शैक्षणिक, सांस्कृतिक, कृषी व सामाजिक उपक्रमांचे नियोजन व मार्गदर्शन.', 'Guiding educational, cultural, agricultural, and social development initiatives across Nadarpur and Chhatrapati Sambhajinagar.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 2, 1),
('off-3', 'श्री. राजेश पाटील', 'Shri. Rajesh Patil', 'उपाध्यक्ष', 'Vice President', 'पर्यावरण संवर्धन, औषधी वृक्षारोपण आणि शेतकरी कौशल्य विकास कार्यशाळांचे समन्वय.', 'Coordinating environmental conservation, medicinal tree plantation drives, and farmer skill workshops.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 3, 1),
('off-4', 'श्रीमती अनिता देशमुख', 'Smt. Anita Deshmukh', 'कोषाध्यक्ष', 'Treasurer', 'महिला बचत गट, सूक्ष्म वित्त नियोजन आणि शालेय व्यवस्थापन समिती (SMC) समन्वय.', 'Leading women self-help groups, micro-savings initiatives, and School Management Committee (SMC) coordination.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', 4, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- 2. Default Gallery Albums
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `display_order`, `published`) VALUES
('alb-1', 'CSC बाल विद्यालय व मॉडेल लर्निंग लॅब', 'CSC Bal Vidyalaya & Model Learning Lab', 'नादरपूर येथील बाल विद्यालयातील खेळातून आनंददायी शिक्षण व वर्ग उपक्रम.', 'Joyful learning through games and interactive model lab sessions at Nadarpur.', 'शिक्षण', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', 1, 1),
('alb-2', 'शासकीय योजना जनजागृती व मार्गदर्शन शिबिरे', 'Government Welfare Schemes Guidance Camps', 'संजय गांधी निराधार, श्रावणबाळ, ई-श्रम व शेतकरी समृद्धी योजना मार्गदर्शन सत्रे.', 'Grassroots orientation sessions for social security pensions and artisan cards.', 'शासकीय योजना जनजागृती', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', 2, 1),
('alb-3', 'आरोग्य तपासणी, योग व व्यसनमुक्ती शिबिरे', 'Medical Checkup, Yoga & De-Addiction Camps', 'मोफत नेत्र तपासणी, रक्तदाब, मधुमेह व योग-प्राणायाम सत्रे.', 'Free medical diagnostic camps and wellness yoga sessions across rural blocks.', 'आरोग्यविषयक उपक्रम', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 3, 1),
('alb-4', 'पर्यावरण रक्षण व औषधी वृक्षारोपण मोहीम', 'Environmental Conservation & Tree Plantation', 'देशी व औषधी झाडांची लागवड आणि नैसर्गिक संसाधन संवर्धन उपक्रम.', 'Community-driven native and medicinal sapling plantation drives in Kannad block.', 'पर्यावरण संवर्धन', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 4, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- 3. Core Informational CMS Pages
INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`) VALUES
('about', 'संस्थेविषयी परिचय व ध्येय', 'About Sanstha & Mission', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था नादरपूर, ता. कन्नड — उद्देश, ध्येय आणि कार्यपद्धती.', 'History, mission, and leadership of Shrikrushna Sanstha at Nadarpur, Tahsil Kannad.', 1),
('work', 'कार्यक्षेत्र व सामाजिक उपक्रम', 'Working Areas & Impact', 'नादरपूर, कन्नड व छत्रपती संभाजीनगर जिल्ह्यातील सामाजिक व शैक्षणिक कार्यक्षेत्र.', 'Core working areas and community development impact across rural Maharashtra.', 1),
('privacy', 'गोपनीयता धोरण', 'Privacy Policy', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेचे अधिकृत गोपनीयता धोरण.', 'Official privacy policy and personal data protection principles.', 1)
ON DUPLICATE KEY UPDATE `slug` = `slug`;

-- 4. Key Site Settings
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`) VALUES
('sanstha_tagline', 'general', 'ग्रामीण भागातील शिक्षण, सांस्कृतिक संवर्धन, आरोग्य व सामाजिक विकासासाठी कटिबद्ध', 'Committed to rural education, cultural heritage, healthcare, and social empowerment', 'Official motto / tagline'),
('hero_badge', 'hero', 'महाराष्ट्र शासन नोंदणीकृत संस्था | रजि. नं. एक 14668 (औ)', 'Govt. of Maharashtra Registered Sanstha | Reg. No. Ek 14668 (A)', 'Badge on top of homepage hero banner'),
('hero_stats_beneficiaries', 'hero', '५०००+ नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच', '5000+ Citizens & Students Reached', 'Key statistical metric for homepage'),
('hero_stats_villages', 'hero', '२५+ ग्रामपंचायतींमध्ये थेट उपक्रम विस्तार', '25+ Gram Panchayats Covered', 'Working village coverage metric')
ON DUPLICATE KEY UPDATE `key_name` = `key_name`;

-- 5. Government Welfare Schemes Catalog (Safe Initial Seeds)
INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `official_portal_url`, `published`, `featured`) VALUES
('scheme-sanjay-gandhi', 'संजय गांधी निराधार अनुदान योजना', 'Sanjay Gandhi Niradhar Financial Assistance Scheme', 'सामाजिक न्याय व विशेष सहाय्य विभाग', 'Department of Social Justice and Special Assistance', 'निराधार, अंध, अपंग, अनाथ मुले व दुर्धर आजारी व्यक्ती', 'Destitute, blind, disabled, orphans, and critically ill', 'दारिद्र्यरेषेखालील अथवा अल्प उत्पन्न असलेल्या निराधार व्यक्तींना मासिक आर्थिक सहाय्य.', 'Monthly financial assistance to destitute citizens living below poverty line.', 'https://sjsa.maharashtra.gov.in', 1, 1),
('scheme-shravanbal', 'श्रावणबाळ सेवा राज्य निवृत्तीवेतन योजना', 'Shravanbal Seva State Pension Scheme', 'सामाजिक न्याय विभाग, महाराष्ट्र शासन', 'Department of Social Justice, Govt. of Maharashtra', '६५ वर्षे व त्यावरील ज्येष्ठ नागरिक (BPL कुटुंब)', 'Senior citizens aged 65 and above (BPL)', '६५ वर्षे व त्यावरील निराधार व दारिद्र्यरेषेखालील वृद्धांना दरमहा निवृत्तीवेतन.', 'Monthly state pension for underprivileged elderly citizens aged 65 and above.', 'https://sjsa.maharashtra.gov.in', 1, 1),
('scheme-eshram', 'ई-श्रम कामगार कार्ड नोंदणी अभियान', 'e-Shram Unorganized Worker Card Drive', 'कामगार व रोजगार मंत्रालय, भारत सरकार', 'Ministry of Labour and Employment, Govt. of India', 'असंघटित क्षेत्रातील कामगार, शेतमजूर, बांधकाम कामगार', 'Unorganized sector workers, farm laborers, construction workers', 'असंघटित क्षेत्रातील कामगारांना सामाजिक सुरक्षा योजना, विमा आणि थेट लाभासाठी राष्ट्रीय डेटाबेस नोंदणी.', 'National unorganized workers database facilitating social security and insurance coverage.', 'https://eshram.gov.in', 1, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ----------------------------------------------------------------------------
-- SECTION 16: CLEANUP TEMPORARY STORED PROCEDURES
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS `sp_phase2_add_column_if_missing`;
DROP PROCEDURE IF EXISTS `sp_phase2_add_index_if_missing`;
DROP PROCEDURE IF EXISTS `sp_phase2_add_fk_if_missing`;

-- ============================================================================
-- END OF MIGRATION: Phase 2.1 Schema Expansion
-- All tables and relationships are now prepared for Phase 2 API integration.
-- ============================================================================
