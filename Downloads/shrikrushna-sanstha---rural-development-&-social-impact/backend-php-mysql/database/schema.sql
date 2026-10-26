-- ============================================================================
-- SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA, NADARPUR
-- Official MySQL Database Master Schema & Seed Data (UTF8MB4 Marathi & English)
-- Location: At Post Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar, MH
-- Registration No.: Ek 14668 (A) | रजि. नं.: एक 14668 (औ)
-- Promoter & Secretary: Smt. Savita Dilip Nikam
-- Target Engine: MySQL 5.7+ / 8.0+ / 8.4 LTS / MariaDB 10.3+
-- Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ============================================================================

-- CREATE DATABASE IF NOT EXISTS `shrikrushna_sanstha_db`
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;

-- USE `shrikrushna_sanstha_db`;

-- ============================================================================
-- 1. AUTHORIZED ADMINISTRATORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(64) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(120) NOT NULL,
  `role` VARCHAR(60) DEFAULT 'Secretary / Super Admin',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Admin Account: Insecure default seed removed.
-- Use the secure CLI setup utility (backend-php-mysql/bin/setup_admin.php)
-- to initialize the first administrator account safely without hardcoded credentials.
-- INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `role`)
-- VALUES (1, 'admin', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'श्रीमती सविता दिलीप निकम (Smt. Savita Dilip Nikam)', 'Secretary / Administrator')
-- ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 2. OFFICIALS & EXECUTIVE BOARD TABLE
-- ============================================================================
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

INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `image_url`, `display_order`, `published`) VALUES
('off-1', 'श्रीमती सविता दिलीप निकम', 'Smt. Savita Dilip Nikam', 'सचिव व मुख्य प्रवर्तक', 'Secretary & Chief Promoter', 'ग्रामीण विकास, महिला सक्षमीकरण, CSC बाल विद्यालय व शासकीय योजनांच्या तळागाळातील अंमलबजावणीसाठी समर्पित नेतृत्व.', 'Dedicated leadership in rural development, women empowerment, CSC Bal Vidyalaya, and grassroots welfare scheme implementation.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', 1, 1),
('off-2', 'श्री. दिलीप निकम', 'Shri. Dilip Nikam', 'अध्यक्ष व मार्गदर्शक', 'President & Mentor', 'नादरपूर व छत्रपती संभाजीनगर जिल्ह्यात शैक्षणिक, सांस्कृतिक, कृषी व सामाजिक उपक्रमांचे नियोजन व मार्गदर्शन.', 'Guiding educational, cultural, agricultural, and social development initiatives across Nadarpur and Chhatrapati Sambhajinagar.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', 2, 1),
('off-3', 'श्री. राजेश पाटील', 'Shri. Rajesh Patil', 'उपाध्यक्ष', 'Vice President', 'पर्यावरण संवर्धन, औषधी वृक्षारोपण आणि शेतकरी कौशल्य विकास कार्यशाळांचे समन्वय.', 'Coordinating environmental conservation, medicinal tree plantation drives, and farmer skill workshops.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', 3, 1),
('off-4', 'श्रीमती अनिता देशमुख', 'Smt. Anita Deshmukh', 'कोषाध्यक्ष', 'Treasurer', 'महिला बचत गट, सूक्ष्म वित्त नियोजन आणि शालेय व्यवस्थापन समिती (SMC) समन्वय.', 'Leading women self-help groups, micro-savings initiatives, and School Management Committee (SMC) coordination.', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', 4, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 3. PUBLIC REPORTS & PDF DISCLOSURES TABLE
-- (Defined before initiatives to satisfy optional foreign key relationship)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `reports` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `period_mr` VARCHAR(100) NOT NULL,
  `period_en` VARCHAR(100) NOT NULL,
  `report_date` VARCHAR(50) NOT NULL,
  `file_size` VARCHAR(50) DEFAULT '1.8 MB PDF',
  `category_mr` VARCHAR(100) NOT NULL,
  `category_en` VARCHAR(100) NOT NULL,
  `summary_mr` TEXT NOT NULL,
  `summary_en` TEXT NOT NULL,
  `pdf_url` TEXT NOT NULL,
  `cover_image_url` VARCHAR(500) NULL,
  `file_path` VARCHAR(500) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `published` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_reports_published` (`published`),
  INDEX `idx_reports_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `reports` (`id`, `title_mr`, `title_en`, `period_mr`, `period_en`, `report_date`, `file_size`, `category_mr`, `category_en`, `summary_mr`, `summary_en`, `pdf_url`, `published`) VALUES
('rep-1', 'संस्थेचा वार्षिक कार्य अहवाल व परिचय पुस्तिका', 'Institutional Profile & Annual Activity Report', 'वर्ष २०२४-२५', 'Year 2024-25', '२०२५-०३-१५', '1.8 MB PDF', 'वार्षिक अहवाल', 'Annual Report', 'नादरपूर व छत्रपती संभाजीनगर जिल्ह्यात राबवलेले CSC बाल विद्यालय, श्रीकृष्ण संगीत प्रशिक्षण केंद्र, RTE २५% शिक्षण, आरोग्य शिबिरे व वृक्षारोपण उपक्रमांचा सविस्तर आढावा.', 'Comprehensive overview of working area programs across Nadarpur, Kannad, and Chhatrapati Sambhajinagar including CSC Bal Vidyalaya, Music Training Center, and health camps.', '#', 1),
('rep-2', 'सर्व शिक्षा अभियान, SMC बैठका व RTE २५% प्रवेश प्रक्रिया अहवाल', 'Sarva Shiksha Abhiyan, SMC Meetings & RTE 25% Admission Report', 'शैक्षणिक वर्ष २०२४-२५', 'Academic Year 2024-25', '२०२५-०१-१०', '1.2 MB PDF', 'शैक्षणिक अहवाल', 'Education Report', 'शालेय व्यवस्थापन समिती (SMC) मासिक बैठका, पालक-समुदाय संवाद आणि आर.टी.ई. मित्रांच्या सहभागातून राबवलेल्या शैक्षणिक उपक्रमांचा अहवाल.', 'Evaluation of School Management Committee (SMC) monthly meetings, parent-community mobilization, Model Lab outcomes, and RTE 25% admissions.', '#', 1),
('rep-3', 'आरोग्य शिबिरे, पर्यावरण संवर्धन व महिला सक्षमीकरण उपक्रम अहवाल', 'Health Camps, Environment Conservation & Women Empowerment Report', 'वर्ष २०२३-२४', 'Year 2023-24', '२०२४-०६-२५', '2.1 MB PDF', 'उपक्रम अहवाल', 'Activity Report', 'कन्नड व छत्रपती संभाजीनगर जिल्ह्यातील आरोग्य व नेत्रतपासणी शिबिरे, व्यसनमुक्ती अभियान, औषधी वृक्षारोपण आणि महिला बचत गट कार्यशाळांचा अहवाल.', 'Record of preventative health & de-addiction camps, medicinal plantations, and women self-help group workshops.', '#', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 4. INITIATIVES & CORE ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `initiatives` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `activity_date` VARCHAR(50) NOT NULL,
  `location_mr` VARCHAR(255) DEFAULT 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर',
  `location_en` VARCHAR(255) DEFAULT 'Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar',
  `summary_mr` TEXT NOT NULL,
  `summary_en` TEXT NOT NULL,
  `description_mr` LONGTEXT NOT NULL,
  `description_en` LONGTEXT NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `is_govt_scheme` TINYINT(1) DEFAULT 0,
  `published` TINYINT(1) DEFAULT 1,
  `featured` TINYINT(1) DEFAULT 0,
  `related_report_id` VARCHAR(64) NULL,
  `tags` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_initiatives_published` (`published`, `featured`),
  INDEX `idx_initiatives_category` (`category`),
  INDEX `idx_initiatives_scheme` (`is_govt_scheme`),
  INDEX `idx_initiatives_order` (`display_order`),
  CONSTRAINT `fk_initiatives_report`
    FOREIGN KEY (`related_report_id`)
    REFERENCES `reports` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`) VALUES
('init-1', 'CSC बाल विद्यालय, मॉडेल लर्निंग लॅब व RTE २५% सर्व शिक्षा अभियान', 'CSC Bal Vidyalaya, Model Learning Lab & RTE 25% Education Drive', 'शिक्षण', '२०२५-०१-१५', 'नादरपूर व कन्नड तालुका, जि. छत्रपती संभाजीनगर', 'Nadarpur & Kannad Block, Dist. Chhatrapati Sambhajinagar', 'खेळातून शिक्षण (Laugh, Play, Enjoy), मॉडेल लॅबद्वारे अक्षर-अंक-आकार-रंग ज्ञान, शालेय व्यवस्थापन समिती (SMC) मासिक बैठका आणि आर.टी.ई. मित्रांच्या सहकार्याने १००% शालेय उपस्थिती अभियान.', 'Joyful activity-based schooling at CSC Bal Vidyalaya, Model Lab games (Alphabets, Numbers, Shapes, Colors), monthly School Management Committee (SMC) meetings across 60%–80% schools, and RTE 25% admission facilitation.', 'राष्ट्रीय शैक्षणिक धोरणानुसार व शासनाच्या मार्गदर्शक तत्त्वांनुसार संस्थेने नादरपूर येथे CSC बाल विद्यालय व मॉडेल लॅब सुरू केली आहे. मुलांना भीतीमुक्त, आनंदी व खेळकर वातावरणात कथा, कविता, गाणी आणि अभिनयातून शिक्षण दिले जाते.', 'Entered into the mainstream education movement with full preparation, our Sanstha operates CSC Bal Vidyalaya and a dedicated Model Lab teaching children through interactive games, stories, songs, and gestures.', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80', 0, 1, 1, 'rep-1', 'CSC बाल विद्यालय, RTE २५% प्रवेश'),
('init-2', 'शासकीय कल्याणकारी योजना जनजागृती व थेट लाभ मार्गदर्शन कक्ष', 'Government Welfare Schemes Awareness & Direct Benefit Guidance', 'शासकीय योजना जनजागृती', '२०२५-०२-०१', 'नादरपूर व छत्रपती संभाजीनगर जिल्हा ग्रामपंचायत क्षेत्र', 'Nadarpur & Chhatrapati Sambhajinagar Gram Panchayats', 'बायोमेट्रिक आधार, संजय गांधी निराधार, श्रावणबाळ सेवा, इंदिरा गांधी निवृत्तीवेतन, ई-श्रम कामगार कार्ड, हस्तकला कारागीर कार्ड व शेतकरी समृद्धी योजनांचा तळागाळातील नागरिकांना थेट लाभ.', 'Comprehensive study and grassroots facilitation for Biometric Aadhaar, Sanjay Gandhi Niradhar, Shravanbal Seva, Indira Gandhi National Pension Schemes, e-Shram Card, Artisan Card, and Farmer Prosperity Schemes.', 'केंद्र व राज्य शासनाच्या विविध योजना तळागाळातील शेवटच्या घटकापर्यंत पोहोचाव्यात यासाठी आमची संस्था सर्व योजनांचा सखोल अभ्यास करून शेतकरी, कामगार, महिला, मुले व वृद्धांना थेट लाभ मिळवून देते.', 'Our organization conducts a thorough study of terms, eligibility, and documentation requirements to connect farmers, workers, women, children, and seniors directly with statutory government welfare schemes.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80', 1, 1, 1, 'rep-2', 'संजय गांधी निराधार, श्रावणबाळ योजना'),
('init-3', 'श्रीकृष्ण संगीत प्रशिक्षण केंद्र व सांस्कृतिक कला संवर्धन उपक्रम', 'Shrikrishna Music Training Center & Cultural Arts Promotion', 'सामाजिक कल्याण', '२०२४-१२-१०', 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर', 'Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar', 'ग्रामीण भागातील उदयोन्मुख कलाकारांना प्रोत्साहन देण्यासाठी श्रीकृष्ण संगीत प्रशिक्षण केंद्राची स्थापना; गायन, वादन, नाट्य व लोककला कार्यक्रमांचे आयोजन.', 'Promoting Maharashtra’s rich cultural heritage and rural artists through the Shrikrishna Music Training Center, organizing vocal music, instrumental, drama, and folk art programs.', 'ग्रामीण मातीतील विविध कलाप्रकार आणि कलाकारांना व्यासपीठ व प्रोत्साहन देण्यासाठी संस्थेने नादरपूर येथे श्रीकृष्ण संगीत प्रशिक्षण केंद्र स्थापन केले आहे.', 'Through Shrikrushna Sanskrutik va Gramin Vikas Sanstha at Nadarpur, we continuously promote rural artists and cultural traditions by operating the Shrikrishna Music Training Center.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', 0, 1, 1, NULL, 'संगीत विद्यालय, सांस्कृतिक संवर्धन'),
('init-4', 'मोफत आरोग्य तपासणी, व्यसनमुक्ती, योग शिबिरे व कोविड-१९ अन्न सुरक्षा', 'Free Medical Camps, De-Addiction, Yoga & COVID-19 Food Relief', 'आरोग्यविषयक उपक्रम', '२०२४-११-२०', 'कन्नड व छत्रपती संभाजीनगर ग्रामीण विभाग', 'Kannad & Chhatrapati Sambhajinagar Rural Belt', '‘आरोग्य हीच खरी संपत्ती’ या ब्रीदवाक्यानुसार तज्ज्ञ डॉक्टरांमार्फत नेत्रतपासणी, रक्तदाब, मधुमेह, व्यसनमुक्ती व योग-प्राणायाम शिबिरे तसेच आपत्ती काळात अन्नधान्य वाटप.', 'Guided by "Health is Wealth", organizing expert eye check-ups, BP & sugar diagnostics, de-addiction & yoga-pranayama camps, alongside rural food distribution.', '‘आरोग्य हीच खरी संपत्ती’ हे ब्रीद मानून संस्थेमार्फत तज्ज्ञ डॉक्टरांच्या सहकार्याने डोळ्यांची तपासणी, रक्तदाब (BP), शुगर तपासणी, व्यसनमुक्ती शिबिरे आणि योग-प्राणायाम शिबिरे आयोजित केली जातात.', 'Our Sanstha organizes regular medical camps with expert doctors covering eye check-ups, blood pressure, diabetes screening, de-addiction counseling, and Yoga-Pranayama sessions.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', 0, 1, 1, 'rep-3', 'आरोग्य शिबीर, नेत्र व रक्तदाब तपासणी')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 5. INITIATIVE PHOTOS TABLE (Multiple Photos per Activity)
-- ============================================================================
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

INSERT INTO `initiative_photos` (`id`, `initiative_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`) VALUES
(1, 'init-1', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', 'CSC बाल विद्यालय वर्गखोली', 'CSC Bal Vidyalaya Classroom', 1),
(2, 'init-1', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', 'विद्यार्थी खेळ व मॉडेल लॅब सत्र', 'Student play & model lab session', 2),
(3, 'init-2', 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80', 'शासकीय योजना थेट अर्ज मार्गदर्शन', 'Direct scheme application assistance', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 6. GALLERY ALBUMS TABLE
-- ============================================================================
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

INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `display_order`, `published`) VALUES
('alb-1', 'CSC बाल विद्यालय व मॉडेल लर्निंग लॅब', 'CSC Bal Vidyalaya & Model Learning Lab', 'नादरपूर येथील बाल विद्यालयातील खेळातून आनंददायी शिक्षण व वर्ग उपक्रम.', 'Joyful learning through games and interactive model lab sessions at Nadarpur.', 'शिक्षण', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', 1, 1),
('alb-2', 'शासकीय योजना जनजागृती व मार्गदर्शन शिबिरे', 'Government Welfare Schemes Guidance Camps', 'संजय गांधी निराधार, श्रावणबाळ, ई-श्रम व शेतकरी समृद्धी योजना मार्गदर्शन सत्रे.', 'Grassroots orientation sessions for social security pensions and artisan cards.', 'शासकीय योजना जनजागृती', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', 2, 1),
('alb-3', 'आरोग्य तपासणी, योग व व्यसनमुक्ती शिबिरे', 'Medical Checkup, Yoga & De-Addiction Camps', 'मोफत नेत्र तपासणी, रक्तदाब, मधुमेह व योग-प्राणायाम सत्रे.', 'Free medical diagnostic camps and wellness yoga sessions across rural blocks.', 'आरोग्यविषयक उपक्रम', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 3, 1),
('alb-4', 'पर्यावरण रक्षण व औषधी वृक्षारोपण मोहीम', 'Environmental Conservation & Tree Plantation', 'देशी व औषधी झाडांची लागवड आणि नैसर्गिक संसाधन संवर्धन उपक्रम.', 'Community-driven native and medicinal sapling plantation drives in Kannad block.', 'पर्यावरण संवर्धन', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 4, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 7. GALLERY PHOTOS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `gallery_photos` (
  `id` VARCHAR(64) PRIMARY KEY,
  `album_id` VARCHAR(64) NULL,
  `activity_id` VARCHAR(64) NULL,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `caption_mr` TEXT NOT NULL,
  `caption_en` TEXT NOT NULL,
  `alt_text_mr` VARCHAR(255) NULL,
  `alt_text_en` VARCHAR(255) NULL,
  `category` VARCHAR(100) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `year` INT DEFAULT 2025,
  `featured_on_home` TINYINT(1) NOT NULL DEFAULT 0,
  `display_order` INT NOT NULL DEFAULT 0,
  `published` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_photos_album` (`album_id`),
  INDEX `idx_photos_activity` (`activity_id`),
  INDEX `idx_photos_home` (`published`, `featured_on_home`),
  INDEX `idx_photos_category` (`category`),
  INDEX `idx_photos_order` (`display_order`),
  CONSTRAINT `fk_gallery_photos_album`
    FOREIGN KEY (`album_id`)
    REFERENCES `gallery_albums` (`id`)
    ON DELETE SET NULL,
  CONSTRAINT `fk_gallery_photos_activity`
    FOREIGN KEY (`activity_id`)
    REFERENCES `initiatives` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `gallery_photos` (`id`, `album_id`, `activity_id`, `title_mr`, `title_en`, `caption_mr`, `caption_en`, `alt_text_mr`, `alt_text_en`, `category`, `image_url`, `year`, `featured_on_home`, `published`) VALUES
('gal-1', 'alb-1', 'init-1', 'CSC बाल विद्यालय व मॉडेल लर्निंग लॅब — आनंददायी शिक्षण', 'CSC Bal Vidyalaya & Model Learning Lab Interactive Session', 'नादरपूर येथील CSC बाल विद्यालयात खेळ, गाणी आणि गोष्टींच्या माध्यमातून अक्षर व अंक ज्ञान शिकताना विद्यार्थी.', 'Students at CSC Bal Vidyalaya learning alphabets, numbers, shapes, and colors through interactive games and storytelling.', 'CSC बाल विद्यालयातील विद्यार्थी वर्गात शिकताना', 'Students learning in CSC Bal Vidyalaya classroom', 'शिक्षण', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', 2025, 1, 1),
('gal-2', 'alb-2', 'init-2', 'शासकीय योजना व RTE २५% प्रवेश मार्गदर्शन सत्र', 'Government Welfare Schemes & RTE 25% Guidance Session', 'संजय गांधी निराधार, श्रावणबाळ, ई-श्रम कार्ड व RTE २५% प्रवेश प्रक्रियेसाठी ग्रामस्थांना मार्गदर्शन करताना संस्थेचे पदाधिकारी.', 'Sanstha office bearers guiding villagers on Sanjay Gandhi Niradhar, Shravanbal, e-Shram Card, and RTE 25% admissions.', 'ग्रामस्थ व स्वयंसेवक शासकीय योजनांची माहिती घेताना', 'Villagers consulting volunteers regarding government welfare schemes', 'शासकीय योजना जनजागृती', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', 2025, 1, 1),
('gal-3', 'alb-3', 'init-4', 'मोफत नेत्र, रक्तदाब व मधुमेह आरोग्य तपासणी शिबीर', 'Free Eye, Blood Pressure & Diabetes Medical Camp', 'तज्ज्ञ डॉक्टरांच्या पथकामार्फत ग्रामीण भागातील ज्येष्ठ नागरिक व महिलांची आरोग्य तपासणी व समुपदेशन.', 'Expert doctors conducting eye check-ups, BP diagnostics, and wellness counseling for rural elders and women.', 'ज्येष्ठ नागरिकांची आरोग्य तपासणी सुरू असताना', 'Senior citizen receiving medical checkup at rural health camp', 'आरोग्यविषयक उपक्रम', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 2024, 1, 1),
('gal-4', 'alb-4', NULL, 'औषधी व देशी वृक्ष लागवड लोकसहभाग मोहीम', 'Medicinal & Indigenous Tree Plantation Drive', 'पर्यावरण संवर्धन व नैसर्गिक समतोलासाठी कन्नड तालुक्यात वृक्षारोपण करताना संस्थेचे स्वयंसेवक व ग्रामस्थ.', 'Volunteers and villagers planting medicinal and indigenous saplings to conserve nature and groundwater.', 'झाडे लावताना संस्थेचे कार्यकर्ते व ग्रामस्थ', 'Volunteers planting native saplings in rural Maharashtra', 'पर्यावरण संवर्धन', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', 2024, 1, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 8. YOUTUBE VIDEO GALLERY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `videos` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `description_mr` TEXT NOT NULL,
  `description_en` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `duration_seconds` INT DEFAULT 180,
  `duration_formatted` VARCHAR(32) DEFAULT '०३:००',
  `duration_formatted_en` VARCHAR(32) DEFAULT '03:00',
  `thumbnail_url` VARCHAR(500) NOT NULL,
  `video_url` VARCHAR(500) NOT NULL,
  `publish_date` VARCHAR(50) NOT NULL,
  `related_activity_title` VARCHAR(255) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `published` TINYINT(1) DEFAULT 1,
  `featured` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_videos_published` (`published`, `featured`),
  INDEX `idx_videos_category` (`category`),
  INDEX `idx_videos_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `videos` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `duration_seconds`, `duration_formatted`, `duration_formatted_en`, `thumbnail_url`, `video_url`, `publish_date`, `published`, `featured`, `related_activity_title`) VALUES
('vid-1', 'CSC बाल विद्यालय व सर्व शिक्षा अभियान — आनंददायी शिक्षण उपक्रम', 'CSC Bal Vidyalaya & Sarva Shiksha Abhiyan — Joyful Learning Documentary', 'नादरपूर येथील CSC बाल विद्यालय, मॉडेल लॅब आणि शालेय व्यवस्थापन समिती (SMC) बैठकांद्वारे ग्रामीण शिक्षणाचा दर्जा उंचावणाऱ्या कार्याची प्रत्यक्ष झलक.', 'Field documentary showcasing playful learning at CSC Bal Vidyalaya, Model Lab activities, and village SMC parent meetings.', 'शिक्षण', 195, '०३:१५', '03:15', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', '२०२५-०१-२०', 1, 1, 'CSC बाल विद्यालय, मॉडेल लर्निंग लॅब व RTE २५% सर्व शिक्षा अभियान'),
('vid-2', 'शासकीय योजना जनजागृती — निराधार, श्रावणबाळ, ई-श्रम व शेतकरी समृद्धी', 'Government Welfare Schemes — Direct Benefit & Documentation Guide', 'तळागाळातील नागरिकांना संजय गांधी निराधार, इंदिरा गांधी निवृत्तीवेतन, बायोमेट्रिक आधार व ई-श्रम कामगार कार्डचा थेट लाभ मिळवून देणाऱ्या शिबिराचे चित्रीकरण.', 'Practical orientation explaining eligibility criteria and paperwork support for state pensions, e-Shram, and farmer welfare schemes.', 'शासकीय योजना जनजागृती', 150, '०२:३०', '02:30', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=640&q=75', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', '२०२५-०२-०५', 1, 0, 'शासकीय कल्याणकारी योजना जनजागृती व थेट लाभ मार्गदर्शन कक्ष'),
('vid-3', 'औषधी वृक्षारोपण, आरोग्य शिबीर व ग्रामविकास लोकसहभाग क्षणचित्रे', 'Medicinal Plantation, Health Camps & Rural Development Moments', 'ग्रामस्थांच्या सहभागातून औषधी झाडांची लागवड, मोफत आरोग्य व नेत्रतपासणी शिबीर आणि शेतकरी कौशल्य कार्यशाळेचे माहितीपट दृश्य.', 'Participatory footage of villagers planting medicinal trees, attending health checkup camps, and agricultural workshops.', 'पर्यावरण संवर्धन', 165, '०२:४५', '02:45', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=640&q=75', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoy.mp4', '२०२४-०८-१५', 1, 0, 'पर्यावरण संवर्धन, नैसर्गिक संसाधन जतन व औषधी वृक्षारोपण मोहीम')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 9. ANNOUNCEMENTS TABLE (News, Circulars, Urgent Notices)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `event_date_mr` VARCHAR(50) NOT NULL,
  `event_date_en` VARCHAR(50) NOT NULL,
  `is_upcoming` TINYINT(1) DEFAULT 1,
  `category` VARCHAR(100) NOT NULL,
  `summary_mr` TEXT NOT NULL,
  `summary_en` TEXT NOT NULL,
  `content_mr` LONGTEXT NOT NULL,
  `content_en` LONGTEXT NOT NULL,
  `cover_image_url` VARCHAR(500) NULL,
  `display_order` INT NOT NULL DEFAULT 0,
  `published` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_announcements_published` (`published`, `is_upcoming`),
  INDEX `idx_announcements_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `announcements` (`id`, `title_mr`, `title_en`, `event_date_mr`, `event_date_en`, `is_upcoming`, `category`, `summary_mr`, `summary_en`, `content_mr`, `content_en`, `cover_image_url`, `published`) VALUES
('ann-1', 'CSC बाल विद्यालय व RTE २५% मोफत प्रवेश प्रक्रिया मार्गदर्शन शिबीर', 'CSC Bal Vidyalaya & RTE 25% Admission Guidance Camp', '२५ मार्च २०२५', 'March 25, 2025', 1, 'शिक्षण', 'नादरपूर व कन्नड तालुक्यातील पालकांसाठी RTE २५% ऑनलाइन अर्ज, शालेय व्यवस्थापन समिती बैठक आणि CSC बाल विद्यालय प्रवेशाबाबत विशेष मार्गदर्शन.', 'Special parent orientation in Nadarpur and Kannad block for RTE 25% admission applications and joyful learning enrollment at CSC Bal Vidyalaya.', 'वंचित व आर्थिकदृष्ट्या दुर्बल घटकातील एकही विद्यार्थी शिक्षणापासून वंचित राहू नये यासाठी संस्थेच्या नादरपूर कार्यालयात व ग्रामपंचायत पातळीवर आर.टी.ई. मित्रांच्या सहकार्याने मोफत मार्गदर्शन शिबीर आयोजित करण्यात आले आहे.', 'To ensure every child from all walks of life enters the educational mainstream, RTE Friends and Sanstha volunteers will assist parents with RTE 25% documentation at our Nadarpur center.', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', 1),
('ann-2', 'मोफत नेत्रतपासणी, रक्तदाब, मधुमेह व योग-प्राणायाम आरोग्य शिबीर संपन्न', 'Free Eye Check-up, BP, Diabetes & Yoga Health Camp Concluded', '१२ फेब्रुवारी २०२५', 'February 12, 2025', 0, 'आरोग्यविषयक उपक्रम', 'तज्ज्ञ डॉक्टरांच्या उपस्थितीत नादरपूर परिसरातील ग्रामस्थ व ज्येष्ठ नागरिकांची मोफत आरोग्य तपासणी व व्यसनमुक्ती समुपदेशन संपन्न.', 'Expert medical team conducted comprehensive eye, blood pressure, and blood sugar screenings alongside yoga-pranayama sessions for rural residents.', '‘आरोग्य हीच खरी संपत्ती’ या ध्येयाने आयोजित शिबिरात शारीरिक व मानसिक आरोग्याचे महत्त्व पटवून देण्यात आले तसेच गरजू रुग्णांना मोफत आरोग्य सल्ला देण्यात आला.', 'Guided by our motto "Health is Wealth", the camp addressed both physical and mental health challenges, providing free diagnostics and lifestyle guidance.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 10. CALENDAR EVENTS & EVENT PHOTOS TABLE
-- ============================================================================
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

-- ============================================================================
-- 11. GOVERNMENT WELFARE SCHEMES CATALOG TABLE
-- ============================================================================
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

INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `official_portal_url`, `published`, `featured`) VALUES
('scheme-sanjay-gandhi', 'संजय गांधी निराधार अनुदान योजना', 'Sanjay Gandhi Niradhar Financial Assistance Scheme', 'सामाजिक न्याय व विशेष सहाय्य विभाग', 'Department of Social Justice and Special Assistance', 'निराधार, अंध, अपंग, अनाथ मुले व दुर्धर आजारी व्यक्ती', 'Destitute, blind, disabled, orphans, and critically ill', 'दारिद्र्यरेषेखालील अथवा अल्प उत्पन्न असलेल्या निराधार व्यक्तींना मासिक आर्थिक सहाय्य.', 'Monthly financial assistance to destitute citizens living below poverty line.', 'https://sjsa.maharashtra.gov.in', 1, 1),
('scheme-shravanbal', 'श्रावणबाळ सेवा राज्य निवृत्तीवेतन योजना', 'Shravanbal Seva State Pension Scheme', 'सामाजिक न्याय विभाग, महाराष्ट्र शासन', 'Department of Social Justice, Govt. of Maharashtra', '६५ वर्षे व त्यावरील ज्येष्ठ नागरिक (BPL कुटुंब)', 'Senior citizens aged 65 and above (BPL)', '६५ वर्षे व त्यावरील निराधार व दारिद्र्यरेषेखालील वृद्धांना दरमहा निवृत्तीवेतन.', 'Monthly state pension for underprivileged elderly citizens aged 65 and above.', 'https://sjsa.maharashtra.gov.in', 1, 1),
('scheme-eshram', 'ई-श्रम कामगार कार्ड नोंदणी अभियान', 'e-Shram Unorganized Worker Card Drive', 'कामगार व रोजगार मंत्रालय, भारत सरकार', 'Ministry of Labour and Employment, Govt. of India', 'असंघटित क्षेत्रातील कामगार, शेतमजूर, बांधकाम कामगार', 'Unorganized sector workers, farm laborers, construction workers', 'असंघटित क्षेत्रातील कामगारांना सामाजिक सुरक्षा योजना, विमा आणि थेट लाभासाठी राष्ट्रीय डेटाबेस नोंदणी.', 'National unorganized workers database facilitating social security and insurance coverage.', 'https://eshram.gov.in', 1, 1)
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 12. VOLUNTEERS TABLE (Private Administrative Submissions)
-- ============================================================================
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

-- ============================================================================
-- 13. EDITABLE INFORMATIONAL PAGES & SECTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `site_pages` (
  `slug` VARCHAR(64) PRIMARY KEY,
  `title_mr` VARCHAR(255) NOT NULL,
  `title_en` VARCHAR(255) NOT NULL,
  `meta_description_mr` VARCHAR(500) NULL,
  `meta_description_en` VARCHAR(500) NULL,
  `is_published` TINYINT(1) NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`) VALUES
('about', 'संस्थेविषयी परिचय व ध्येय', 'About Sanstha & Mission', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था नादरपूर, ता. कन्नड — उद्देश, ध्येय आणि कार्यपद्धती.', 'History, mission, and leadership of Shrikrushna Sanstha at Nadarpur, Tahsil Kannad.', 1),
('work', 'कार्यक्षेत्र व सामाजिक उपक्रम', 'Working Areas & Impact', 'नादरपूर, कन्नड व छत्रपती संभाजीनगर जिल्ह्यातील सामाजिक व शैक्षणिक कार्यक्षेत्र.', 'Core working areas and community development impact across rural Maharashtra.', 1),
('privacy', 'गोपनीयता धोरण', 'Privacy Policy', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेचे अधिकृत गोपनीयता धोरण.', 'Official privacy policy and personal data protection principles.', 1)
ON DUPLICATE KEY UPDATE `slug` = `slug`;

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

-- ============================================================================
-- 14. HOMEPAGE CONTENT & GLOBAL WEBSITE SETTINGS
-- ============================================================================
CREATE TABLE IF NOT EXISTS `site_settings` (
  `key_name` VARCHAR(64) PRIMARY KEY,
  `category` VARCHAR(50) NOT NULL DEFAULT 'general',
  `value_mr` TEXT NULL,
  `value_en` TEXT NULL,
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_settings_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`) VALUES
('sanstha_tagline', 'general', 'ग्रामीण भागातील शिक्षण, सांस्कृतिक संवर्धन, आरोग्य व सामाजिक विकासासाठी कटिबद्ध', 'Committed to rural education, cultural heritage, healthcare, and social empowerment', 'Official motto / tagline'),
('hero_badge', 'hero', 'महाराष्ट्र शासन नोंदणीकृत संस्था | रजि. नं. एक 14668 (औ)', 'Govt. of Maharashtra Registered Sanstha | Reg. No. Ek 14668 (A)', 'Badge on top of homepage hero banner'),
('hero_stats_beneficiaries', 'hero', '५०००+ नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच', '5000+ Citizens & Students Reached', 'Key statistical metric for homepage'),
('hero_stats_villages', 'hero', '२५+ ग्रामपंचायतींमध्ये थेट उपक्रम विस्तार', '25+ Gram Panchayats Covered', 'Working village coverage metric')
ON DUPLICATE KEY UPDATE `key_name` = `key_name`;

-- ============================================================================
-- 15. INSTITUTIONAL HEADQUARTERS CONTACT INFO TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `contact_info` (
  `id` INT PRIMARY KEY DEFAULT 1,
  `reg_no_mr` VARCHAR(100) DEFAULT 'रजि. नं.: एक 14668 (औ)',
  `reg_no_en` VARCHAR(100) DEFAULT 'Reg. No.: Ek 14668 (A)',
  `secretary_name_mr` VARCHAR(150) DEFAULT 'श्रीमती सविता दिलीप निकम',
  `secretary_name_en` VARCHAR(150) DEFAULT 'Smt. Savita Dilip Nikam',
  `phone` VARCHAR(150) DEFAULT '+91 9923512482, +91 8888684966',
  `email` VARCHAR(150) DEFAULT 'shrikrushnasanstha.nadarpur@gmail.com',
  `address_mr` TEXT NOT NULL,
  `address_en` TEXT NOT NULL,
  `taluka_mr` VARCHAR(100) DEFAULT 'कन्नड (नादरपूर)',
  `taluka_en` VARCHAR(100) DEFAULT 'Kannad (Nadarpur)',
  `district_mr` VARCHAR(100) DEFAULT 'छत्रपती संभाजीनगर (औरंगाबाद)',
  `district_en` VARCHAR(100) DEFAULT 'Chhatrapati Sambhajinagar (Aurangabad)',
  `visiting_hours_mr` VARCHAR(150) DEFAULT 'सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ०६:००',
  `visiting_hours_en` VARCHAR(150) DEFAULT 'Monday to Saturday: 10:00 AM to 06:00 PM',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `contact_info` (`id`, `address_mr`, `address_en`) VALUES
(1, 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, मु. पो. नादरपूर, तहसील कन्नड, जिल्हा छत्रपती संभाजीनगर (औरंगाबाद), महाराष्ट्र (रजि. नं.: एक 14668 औ)', 'Shrikrushna Sanskrutik and Gramin Vikas Sanstha, At Post Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar (Aurangabad), Maharashtra (Reg. No.: Ek 14668 A)')
ON DUPLICATE KEY UPDATE `id` = `id`;

-- ============================================================================
-- 16. PUBLIC CONTACT INQUIRIES & ADMINISTRATIVE STATUS TRACKING
-- ============================================================================
CREATE TABLE IF NOT EXISTS `inquiries` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `contact_detail` VARCHAR(150) NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `status` ENUM('new', 'read', 'replied', 'archived') NOT NULL DEFAULT 'new',
  `admin_notes` TEXT NULL,
  `replied_at` DATETIME NULL,
  `replied_by` INT UNSIGNED NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_inquiries_status` (`status`),
  INDEX `idx_inquiries_created` (`created_at`),
  CONSTRAINT `fk_inquiries_replied_admin`
    FOREIGN KEY (`replied_by`)
    REFERENCES `admins` (`id`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 17. MEDIA METADATA TABLE (Uploaded Images & Documents Tracking)
-- ============================================================================
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

-- ============================================================================
-- 18. AUTHORIZED ADMIN BEARER TOKENS TABLE (Hashed via SHA-256)
-- ============================================================================
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

-- ============================================================================
-- 19. LOGIN RATE LIMITING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `ip_address` VARCHAR(45) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `attempted_at` DATETIME NOT NULL,
  INDEX `idx_ip_attempted` (`ip_address`, `attempted_at`),
  INDEX `idx_user_attempted` (`username`, `attempted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
