-- Backup of database `shrikrushnasanstha2`
-- Generated at: 2026-10-22 09:00:08

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- Table structure for `admin_tokens`
-- --------------------------------------------------------
CREATE TABLE `admin_tokens` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `admin_id` int unsigned NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_token_hash` (`token_hash`),
  KEY `idx_admin_id` (`admin_id`),
  KEY `idx_expires_at` (`expires_at`),
  CONSTRAINT `fk_admin_tokens_admin` FOREIGN KEY (`admin_id`) REFERENCES `admins` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `admin_tokens` (21 rows)
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('1', '1', '95e67f90319aa52e27565708284352a9580b3e7ace7c1479f580f6f228be44c0', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-20 21:56:10', '2026-10-20 19:26:10', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('3', '1', '786f448cb42111d56dabfbc56bfa68ec6cb0582d6c4c8c512ce2be60c001e67e', NULL, NULL, '2026-10-20 23:58:54', '2026-10-20 21:58:54', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('18', '1', '5e33f6817dbb97938b011e2411ee70676f8b1fe7d6ffcf907da919a55226c2cc', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-21 02:17:18', '2026-10-20 23:47:18', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('23', '1', '778e9dfed2d685360ae6289e39233071d564f5669c5ad4fcb0181b0d471d9432', NULL, NULL, '2026-10-21 15:35:14', '2026-10-21 11:35:14', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('24', '1', 'df24871f0339559e247ffbce1e509dbf69b60e98d9b758f393342a9358ddb6d8', NULL, NULL, '2026-10-21 15:35:56', '2026-10-21 11:35:56', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('25', '1', '64aa9ba8da83cc812eabab9467e555a15f7606345bb73abe1ea5747c259d3a20', NULL, NULL, '2026-10-21 16:37:30', '2026-10-21 12:37:30', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('26', '1', 'fbb160e9fd5dd0d039f28a9b6abfa9156f19aec457bf1b32e8192203f429f3e6', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-21 15:10:32', '2026-10-21 12:40:32', '2026-10-21 14:03:42');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('27', '1', 'b29d33576fcfc5ee3a59481d642754f18012520bc5af907ccd77b36d27eb44ef', NULL, NULL, '2026-10-21 16:50:27', '2026-10-21 12:50:27', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('28', '1', '676199b310b66c8c67edd1c66558024952e504191dd94f2230baab80e4f0be50', NULL, NULL, '2026-10-21 14:54:43', '2026-10-21 12:54:43', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('30', '1', 'fe015d1878f9b07257affa3b9342037ac6eb6d1d4c1db50b60886debaaa1a6bf', NULL, NULL, '2026-10-21 16:55:30', '2026-10-21 12:55:30', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('31', '1', '8b9a3d68791abd58b50f3c5f838b4bd95eb0974b5f001039aabaf9c7084b1b0e', NULL, NULL, '2026-10-21 16:56:53', '2026-10-21 12:56:53', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('32', '1', 'b8f052c6da0b423a6453d6fc32476e0a057aa29497361af146c4547999a3e1ed', NULL, NULL, '2026-10-21 16:57:06', '2026-10-21 12:57:06', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('33', '1', '28debd07a33900834200539f5f132f8e3a73a7a5b2aba1137fc8dc11fbc9fc10', NULL, NULL, '2026-10-21 16:57:25', '2026-10-21 12:57:25', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('34', '1', '217c7e60a9eae1563b466ab04322a48dfc14711d3c1f664dbef6e7f2f1fbfe37', NULL, NULL, '2026-10-21 16:57:57', '2026-10-21 12:57:57', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('38', '1', 'b4df6ae8028b6b5e9ed522f1e17f4cbed4a28181a3d385009ec23f8ed2b76a4f', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-21 16:34:11', '2026-10-21 14:04:11', '2026-10-21 16:02:41');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('42', '1', '558e7f6dcd5121ab28bafb55d4e4bdebe8dcebd84802248a3227788917caf6bf', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-21 17:58:55', '2026-10-21 15:28:55', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('43', '4', '0ddc74474afa56dae770fb861a73ed694f058dfc4a2f918e17db6450f7126dd9', '127.0.0.1', 'Unknown', '2026-10-22 02:36:34', '2026-10-22 00:06:34', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('44', '5', '58b5f995fca6ad1af37017e0d45e6b8b002863a6bee835def9bfdd654a47417d', '127.0.0.1', 'Unknown', '2026-10-22 02:40:36', '2026-10-22 00:10:36', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('47', '1', '7f374470826de7ab96863c20b800ef44614695c214ea9acb2dd2057302fa8b11', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-22 03:09:22', '2026-10-22 00:39:22', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('56', '1', '5653d001dafa4b5996aef6164bf0b02b314d3c42b07e041fa2c7c83a2b87a8f0', NULL, NULL, '2026-10-22 14:38:36', '2026-10-22 13:38:36', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('58', '1', '099c5e58b10b1c131c555fa5488c492d4386b6b6b61dc7c1e05276ae36a7c174', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-22 16:15:52', '2026-10-22 13:45:52', NULL);

-- --------------------------------------------------------
-- Table structure for `admins`
-- --------------------------------------------------------
CREATE TABLE `admins` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT 'Secretary / Super Admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `admins` (3 rows)
INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `role`, `created_at`, `updated_at`) VALUES ('1', 'super_admin', '$2y$10$OG3d1mvQK1tx554.4b4mKulsA1asj3UHdu8lb8Z7CWwwapmhhAxCi', 'Santosh Barkade', 'super_admin', '2026-10-20 19:25:45', '2026-10-20 19:25:45');
INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `role`, `created_at`, `updated_at`) VALUES ('4', 'temp_phase1_admin_1792607794', '$2y$10$560gx9xUbnK3hrFjfzpZf.hSfsMh3HDAlU57X9DfYHn62etY83jTu', 'Temporary Phase 1 Admin', 'Secretary / Super Admin', '2026-10-22 00:06:34', '2026-10-22 00:06:34');
INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `role`, `created_at`, `updated_at`) VALUES ('5', 'temp_phase1_admin_1792608036', '$2y$10$z5zngbXqPKix6PCXsTWepOS1JFFE83ePYGRW7iYlO9u8qfmjWM3QW', 'Temporary Phase 1 Admin', 'Secretary / Super Admin', '2026-10-22 00:10:36', '2026-10-22 00:10:36');

-- --------------------------------------------------------
-- Table structure for `announcements`
-- --------------------------------------------------------
CREATE TABLE `announcements` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date_mr` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date_en` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_upcoming` tinyint(1) DEFAULT '1',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_mr` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_en` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `published` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_announcements_published` (`published`,`is_upcoming`),
  KEY `idx_announcements_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `announcements` (2 rows)
INSERT INTO `announcements` (`id`, `title_mr`, `title_en`, `event_date_mr`, `event_date_en`, `is_upcoming`, `category`, `summary_mr`, `summary_en`, `content_mr`, `content_en`, `cover_image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('ann-1', 'CSC बाल विद्यालय व RTE २५% मोफत प्रवेश प्रक्रिया मार्गदर्शन शिबीर', 'CSC Bal Vidyalaya & RTE 25% Admission Guidance Camp', '२५ मार्च २०२५', 'March 25, 2025', '1', 'शिक्षण', 'नादरपूर व कन्नड तालुक्यातील पालकांसाठी RTE २५% ऑनलाइन अर्ज, शालेय व्यवस्थापन समिती बैठक आणि CSC बाल विद्यालय प्रवेशाबाबत विशेष मार्गदर्शन.', 'Special parent orientation in Nadarpur and Kannad block for RTE 25% admission applications and joyful learning enrollment at CSC Bal Vidyalaya.', 'वंचित व आर्थिकदृष्ट्या दुर्बल घटकातील एकही विद्यार्थी शिक्षणापासून वंचित राहू नये यासाठी संस्थेच्या नादरपूर कार्यालयात व ग्रामपंचायत पातळीवर आर.टी.ई. मित्रांच्या सहकार्याने मोफत मार्गदर्शन शिबीर आयोजित करण्यात आले आहे.', 'To ensure every child from all walks of life enters the educational mainstream, RTE Friends and Sanstha volunteers will assist parents with RTE 25% documentation at our Nadarpur center.', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `announcements` (`id`, `title_mr`, `title_en`, `event_date_mr`, `event_date_en`, `is_upcoming`, `category`, `summary_mr`, `summary_en`, `content_mr`, `content_en`, `cover_image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('ann-2', 'मोफत नेत्रतपासणी, रक्तदाब, मधुमेह व योग-प्राणायाम आरोग्य शिबीर संपन्न', 'Free Eye Check-up, BP, Diabetes & Yoga Health Camp Concluded', '१२ फेब्रुवारी २०२५', 'February 12, 2025', '0', 'आरोग्यविषयक उपक्रम', 'तज्ज्ञ डॉक्टरांच्या उपस्थितीत नादरपूर परिसरातील ग्रामस्थ व ज्येष्ठ नागरिकांची मोफत आरोग्य तपासणी व व्यसनमुक्ती समुपदेशन संपन्न.', 'Expert medical team conducted comprehensive eye, blood pressure, and blood sugar screenings alongside yoga-pranayama sessions for rural residents.', '‘आरोग्य हीच खरी संपत्ती’ या ध्येयाने आयोजित शिबिरात शारीरिक व मानसिक आरोग्याचे महत्त्व पटवून देण्यात आले तसेच गरजू रुग्णांना मोफत आरोग्य सल्ला देण्यात आला.', 'Guided by our motto \"Health is Wealth\", the camp addressed both physical and mental health challenges, providing free diagnostics and lifestyle guidance.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

-- --------------------------------------------------------
-- Table structure for `contact_info`
-- --------------------------------------------------------
CREATE TABLE `contact_info` (
  `id` int NOT NULL DEFAULT '1',
  `reg_no_mr` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'रजि. नं.: एक 14668 (औ)',
  `reg_no_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Reg. No.: Ek 14668 (A)',
  `secretary_name_mr` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'श्रीमती सविता दिलीप निकम',
  `secretary_name_en` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'Smt. Savita Dilip Nikam',
  `phone` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT '+91 9923512482, +91 8888684966',
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'shrikrushnasanstha.nadarpur@gmail.com',
  `address_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `address_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `taluka_mr` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'कन्नड (नादरपूर)',
  `taluka_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Kannad (Nadarpur)',
  `district_mr` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'छत्रपती संभाजीनगर (औरंगाबाद)',
  `district_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Chhatrapati Sambhajinagar (Aurangabad)',
  `visiting_hours_mr` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ०६:००',
  `visiting_hours_en` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT 'Monday to Saturday: 10:00 AM to 06:00 PM',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `contact_info` (1 rows)
INSERT INTO `contact_info` (`id`, `reg_no_mr`, `reg_no_en`, `secretary_name_mr`, `secretary_name_en`, `phone`, `email`, `address_mr`, `address_en`, `taluka_mr`, `taluka_en`, `district_mr`, `district_en`, `visiting_hours_mr`, `visiting_hours_en`, `updated_at`) VALUES ('1', 'रजि. नं.: एक 14668 (औ)', 'Reg. No.: Ek 14668 (A)', 'श्रीमती सविता दिलीप निकम', 'Smt. Savita Dilip Nikam', '+91 9923512482, +91 8888684966', 'shrikrushnasanstha.nadarpur@gmail.com', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, मु. पो. नादरपूर, तहसील कन्नड, जिल्हा छत्रपती संभाजीनगर (औरंगाबाद), महाराष्ट्र (रजि. नं.: एक 14668 औ)', 'Shrikrushna Sanskrutik and Gramin Vikas Sanstha, At Post Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar (Aurangabad), Maharashtra (Reg. No.: Ek 14668 A)', 'कन्नड (नादरपूर)', 'Kannad (Nadarpur)', 'छत्रपती संभाजीनगर (औरंगाबाद)', 'Chhatrapati Sambhajinagar (Aurangabad)', 'सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ०६:००', 'Monday to Saturday: 10:00 AM to 06:00 PM', '2026-10-22 00:41:39');

-- --------------------------------------------------------
-- Table structure for `event_photos`
-- --------------------------------------------------------
CREATE TABLE `event_photos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `event_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caption_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_evt_photos_event` (`event_id`),
  KEY `idx_evt_photos_order` (`display_order`),
  CONSTRAINT `fk_event_photos_parent` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `event_photos` (2 rows)
INSERT INTO `event_photos` (`id`, `event_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('22', 'evt-1792622428974', '/backend-php-mysql/uploads/events/evt_bf28d44a652542413ded.jpg', NULL, NULL, '1', '2026-10-22 13:46:43');
INSERT INTO `event_photos` (`id`, `event_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('23', 'evt-1792622428974', '/backend-php-mysql/uploads/events/evt_a4cd0d907017da23c2fa.jpg', NULL, NULL, '2', '2026-10-22 13:46:43');

-- --------------------------------------------------------
-- Table structure for `events`
-- --------------------------------------------------------
CREATE TABLE `events` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'सर्व',
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `event_date_text_mr` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_date_text_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_time` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `venue_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'नादरपूर, ता. कन्नड',
  `venue_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Nadarpur, Tahsil Kannad',
  `summary_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_mr` longtext COLLATE utf8mb4_unicode_ci,
  `description_en` longtext COLLATE utf8mb4_unicode_ci,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('upcoming','ongoing','completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'upcoming',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0',
  `published` tinyint(1) NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_start` (`start_date`),
  KEY `idx_events_published` (`published`,`is_featured`),
  KEY `idx_events_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `events` (1 rows)
INSERT INTO `events` (`id`, `title_mr`, `title_en`, `category`, `start_date`, `end_date`, `event_date_text_mr`, `event_date_text_en`, `event_time`, `venue_mr`, `venue_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `cover_image_url`, `status`, `is_featured`, `published`, `display_order`, `created_at`, `updated_at`) VALUES ('evt-1792622428974', 'वृक्षारोपण उपक्रम', 'tree Plantation Activity', 'शिक्षण', '2026-10-24', '2026-10-30', NULL, NULL, NULL, 'नादरपूर, ता. कन्नड', 'Nadarpur, Tahsil Kannad', 'sdsd', 'sdsd', 'sdsd', 'sdsd', '/backend-php-mysql/uploads/events/evt_03eeefe495cda0a8a24f.png', 'upcoming', '1', '1', '0', '2026-10-22 04:10:29', '2026-10-22 05:07:07');

-- --------------------------------------------------------
-- Table structure for `gallery_albums`
-- --------------------------------------------------------
CREATE TABLE `gallery_albums` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_mr` text COLLATE utf8mb4_unicode_ci,
  `description_en` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'सर्व',
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_date` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_mode` enum('grid','carousel') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'grid',
  `display_order` int NOT NULL DEFAULT '0',
  `published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_albums_category` (`category`),
  KEY `idx_albums_published` (`published`),
  KEY `idx_albums_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `gallery_albums` (4 rows)
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-1', 'CSC बाल विद्यालय व मॉडेल लर्निंग लॅब', 'CSC Bal Vidyalaya & Model Learning Lab', 'नादरपूर येथील बाल विद्यालयातील खेळातून आनंददायी शिक्षण व वर्ग उपक्रम.', 'Joyful learning through games and interactive model lab sessions at Nadarpur.', 'शिक्षण', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-2', 'शासकीय योजना जनजागृती व मार्गदर्शन शिबिरे', 'Government Welfare Schemes Guidance Camps', 'संजय गांधी निराधार, श्रावणबाळ, ई-श्रम व शेतकरी समृद्धी योजना मार्गदर्शन सत्रे.', 'Grassroots orientation sessions for social security pensions and artisan cards.', 'शासकीय योजना जनजागृती', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '2', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-3', 'आरोग्य तपासणी, योग व व्यसनमुक्ती शिबिरे', 'Medical Checkup, Yoga & De-Addiction Camps', 'मोफत नेत्र तपासणी, रक्तदाब, मधुमेह व योग-प्राणायाम सत्रे.', 'Free medical diagnostic camps and wellness yoga sessions across rural blocks.', 'आरोग्यविषयक उपक्रम', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '3', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-4', 'पर्यावरण रक्षण व औषधी वृक्षारोपण मोहीम', 'Environmental Conservation & Tree Plantation', 'देशी व औषधी झाडांची लागवड आणि नैसर्गिक संसाधन संवर्धन उपक्रम.', 'Community-driven native and medicinal sapling plantation drives in Kannad block.', 'पर्यावरण संवर्धन', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '4', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

-- --------------------------------------------------------
-- Table structure for `gallery_photos`
-- --------------------------------------------------------
CREATE TABLE `gallery_photos` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `album_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activity_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `alt_text_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alt_text_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year` int DEFAULT '2025',
  `featured_on_home` tinyint(1) NOT NULL DEFAULT '0',
  `display_order` int NOT NULL DEFAULT '0',
  `published` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_photos_album` (`album_id`),
  KEY `idx_photos_activity` (`activity_id`),
  KEY `idx_photos_home` (`published`,`featured_on_home`),
  KEY `idx_photos_category` (`category`),
  KEY `idx_photos_order` (`display_order`),
  CONSTRAINT `fk_gallery_photos_activity` FOREIGN KEY (`activity_id`) REFERENCES `initiatives` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_gallery_photos_album` FOREIGN KEY (`album_id`) REFERENCES `gallery_albums` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `gallery_photos` (6 rows)
INSERT INTO `gallery_photos` (`id`, `album_id`, `activity_id`, `title_mr`, `title_en`, `caption_mr`, `caption_en`, `alt_text_mr`, `alt_text_en`, `category`, `image_url`, `year`, `featured_on_home`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('gal-1', 'alb-1', 'init-1', 'CSC बाल विद्यालय व मॉडेल लर्निंग लॅब — आनंददायी शिक्षण', 'CSC Bal Vidyalaya & Model Learning Lab Interactive Session', 'नादरपूर येथील CSC बाल विद्यालयात खेळ, गाणी आणि गोष्टींच्या माध्यमातून अक्षर व अंक ज्ञान शिकताना विद्यार्थी.', 'Students at CSC Bal Vidyalaya learning alphabets, numbers, shapes, and colors through interactive games and storytelling.', 'CSC बाल विद्यालयातील विद्यार्थी वर्गात शिकताना', 'Students learning in CSC Bal Vidyalaya classroom', 'शिक्षण', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', '2025', '1', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_photos` (`id`, `album_id`, `activity_id`, `title_mr`, `title_en`, `caption_mr`, `caption_en`, `alt_text_mr`, `alt_text_en`, `category`, `image_url`, `year`, `featured_on_home`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('gal-1792578754817-0', NULL, NULL, '14157968.jpg', '14157968.jpg', '14157968.jpg', '14157968.jpg', '14157968.jpg', '14157968.jpg', 'शिक्षण', '/backend-php-mysql/uploads/gallery/gal_5d9d7e42737a8b84df51.jpg', '2026', '1', '0', '1', '2026-10-21 16:02:34', '2026-10-21 16:02:34');
INSERT INTO `gallery_photos` (`id`, `album_id`, `activity_id`, `title_mr`, `title_en`, `caption_mr`, `caption_en`, `alt_text_mr`, `alt_text_en`, `category`, `image_url`, `year`, `featured_on_home`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('gal-1792578754817-1', NULL, NULL, 'wallpaper copilot.png', 'wallpaper copilot.png', 'wallpaper copilot.png', 'wallpaper copilot.png', 'wallpaper copilot.png', 'wallpaper copilot.png', 'शिक्षण', '/backend-php-mysql/uploads/gallery/gal_d39e67565e30562a1b76.png', '2026', '1', '1', '1', '2026-10-21 16:02:34', '2026-10-21 16:02:34');
INSERT INTO `gallery_photos` (`id`, `album_id`, `activity_id`, `title_mr`, `title_en`, `caption_mr`, `caption_en`, `alt_text_mr`, `alt_text_en`, `category`, `image_url`, `year`, `featured_on_home`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('gal-2', 'alb-2', 'init-2', 'शासकीय योजना व RTE २५% प्रवेश मार्गदर्शन सत्र', 'Government Welfare Schemes & RTE 25% Guidance Session', 'संजय गांधी निराधार, श्रावणबाळ, ई-श्रम कार्ड व RTE २५% प्रवेश प्रक्रियेसाठी ग्रामस्थांना मार्गदर्शन करताना संस्थेचे पदाधिकारी.', 'Sanstha office bearers guiding villagers on Sanjay Gandhi Niradhar, Shravanbal, e-Shram Card, and RTE 25% admissions.', 'ग्रामस्थ व स्वयंसेवक शासकीय योजनांची माहिती घेताना', 'Villagers consulting volunteers regarding government welfare schemes', 'शासकीय योजना जनजागृती', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', '2025', '1', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_photos` (`id`, `album_id`, `activity_id`, `title_mr`, `title_en`, `caption_mr`, `caption_en`, `alt_text_mr`, `alt_text_en`, `category`, `image_url`, `year`, `featured_on_home`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('gal-3', 'alb-3', 'init-4', 'मोफत नेत्र, रक्तदाब व मधुमेह आरोग्य तपासणी शिबीर', 'Free Eye, Blood Pressure & Diabetes Medical Camp', 'तज्ज्ञ डॉक्टरांच्या पथकामार्फत ग्रामीण भागातील ज्येष्ठ नागरिक व महिलांची आरोग्य तपासणी व समुपदेशन.', 'Expert doctors conducting eye check-ups, BP diagnostics, and wellness counseling for rural elders and women.', 'ज्येष्ठ नागरिकांची आरोग्य तपासणी सुरू असताना', 'Senior citizen receiving medical checkup at rural health camp', 'आरोग्यविषयक उपक्रम', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', '2024', '1', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_photos` (`id`, `album_id`, `activity_id`, `title_mr`, `title_en`, `caption_mr`, `caption_en`, `alt_text_mr`, `alt_text_en`, `category`, `image_url`, `year`, `featured_on_home`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('gal-4', 'alb-4', NULL, 'औषधी व देशी वृक्ष लागवड लोकसहभाग मोहीम', 'Medicinal & Indigenous Tree Plantation Drive', 'पर्यावरण संवर्धन व नैसर्गिक समतोलासाठी कन्नड तालुक्यात वृक्षारोपण करताना संस्थेचे स्वयंसेवक व ग्रामस्थ.', 'Volunteers and villagers planting medicinal and indigenous saplings to conserve nature and groundwater.', 'झाडे लावताना संस्थेचे कार्यकर्ते व ग्रामस्थ', 'Volunteers planting native saplings in rural Maharashtra', 'पर्यावरण संवर्धन', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', '2024', '1', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

-- --------------------------------------------------------
-- Table structure for `government_schemes`
-- --------------------------------------------------------
CREATE TABLE `government_schemes` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `department_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `beneficiary_category_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `beneficiary_category_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `eligibility_mr` text COLLATE utf8mb4_unicode_ci,
  `eligibility_en` text COLLATE utf8mb4_unicode_ci,
  `documents_required_mr` text COLLATE utf8mb4_unicode_ci,
  `documents_required_en` text COLLATE utf8mb4_unicode_ci,
  `benefits_mr` text COLLATE utf8mb4_unicode_ci,
  `benefits_en` text COLLATE utf8mb4_unicode_ci,
  `official_portal_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `published` tinyint(1) NOT NULL DEFAULT '1',
  `featured` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_schemes_published` (`published`,`featured`),
  KEY `idx_schemes_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `government_schemes` (3 rows)
INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `eligibility_mr`, `eligibility_en`, `documents_required_mr`, `documents_required_en`, `benefits_mr`, `benefits_en`, `official_portal_url`, `cover_image_url`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('scheme-eshram', 'ई-श्रम कामगार कार्ड नोंदणी अभियान', 'e-Shram Unorganized Worker Card Drive', 'कामगार व रोजगार मंत्रालय, भारत सरकार', 'Ministry of Labour and Employment, Govt. of India', 'असंघटित क्षेत्रातील कामगार, शेतमजूर, बांधकाम कामगार', 'Unorganized sector workers, farm laborers, construction workers', 'असंघटित क्षेत्रातील कामगारांना सामाजिक सुरक्षा योजना, विमा आणि थेट लाभासाठी राष्ट्रीय डेटाबेस नोंदणी.', 'National unorganized workers database facilitating social security and insurance coverage.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://eshram.gov.in', NULL, '0', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `eligibility_mr`, `eligibility_en`, `documents_required_mr`, `documents_required_en`, `benefits_mr`, `benefits_en`, `official_portal_url`, `cover_image_url`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('scheme-sanjay-gandhi', 'संजय गांधी निराधार अनुदान योजना', 'Sanjay Gandhi Niradhar Financial Assistance Scheme', 'सामाजिक न्याय व विशेष सहाय्य विभाग', 'Department of Social Justice and Special Assistance', 'निराधार, अंध, अपंग, अनाथ मुले व दुर्धर आजारी व्यक्ती', 'Destitute, blind, disabled, orphans, and critically ill', 'दारिद्र्यरेषेखालील अथवा अल्प उत्पन्न असलेल्या निराधार व्यक्तींना मासिक आर्थिक सहाय्य.', 'Monthly financial assistance to destitute citizens living below poverty line.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://sjsa.maharashtra.gov.in', NULL, '0', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `eligibility_mr`, `eligibility_en`, `documents_required_mr`, `documents_required_en`, `benefits_mr`, `benefits_en`, `official_portal_url`, `cover_image_url`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('scheme-shravanbal', 'श्रावणबाळ सेवा राज्य निवृत्तीवेतन योजना', 'Shravanbal Seva State Pension Scheme', 'सामाजिक न्याय विभाग, महाराष्ट्र शासन', 'Department of Social Justice, Govt. of Maharashtra', '६५ वर्षे व त्यावरील ज्येष्ठ नागरिक (BPL कुटुंब)', 'Senior citizens aged 65 and above (BPL)', '६५ वर्षे व त्यावरील निराधार व दारिद्र्यरेषेखालील वृद्धांना दरमहा निवृत्तीवेतन.', 'Monthly state pension for underprivileged elderly citizens aged 65 and above.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://sjsa.maharashtra.gov.in', NULL, '0', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

-- --------------------------------------------------------
-- Table structure for `initiative_photos`
-- --------------------------------------------------------
CREATE TABLE `initiative_photos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `initiative_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `caption_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_init_photos_init` (`initiative_id`),
  KEY `idx_init_photos_order` (`display_order`),
  CONSTRAINT `fk_initiative_photos_parent` FOREIGN KEY (`initiative_id`) REFERENCES `initiatives` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `initiative_photos` (3 rows)
INSERT INTO `initiative_photos` (`id`, `initiative_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('3', 'init-2', 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80', 'शासकीय योजना थेट अर्ज मार्गदर्शन', 'Direct scheme application assistance', '1', '2026-10-20 16:45:01');
INSERT INTO `initiative_photos` (`id`, `initiative_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('18', 'init-1', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', NULL, NULL, '1', '2026-10-22 00:40:30');
INSERT INTO `initiative_photos` (`id`, `initiative_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('19', 'init-1', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', NULL, NULL, '2', '2026-10-22 00:40:30');

-- --------------------------------------------------------
-- Table structure for `initiatives`
-- --------------------------------------------------------
CREATE TABLE `initiatives` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activity_date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर',
  `location_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar',
  `summary_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_mr` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_en` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_govt_scheme` tinyint(1) DEFAULT '0',
  `published` tinyint(1) DEFAULT '1',
  `featured` tinyint(1) DEFAULT '0',
  `related_report_id` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_initiatives_published` (`published`,`featured`),
  KEY `idx_initiatives_category` (`category`),
  KEY `idx_initiatives_scheme` (`is_govt_scheme`),
  KEY `idx_initiatives_order` (`display_order`),
  KEY `fk_initiatives_report` (`related_report_id`),
  CONSTRAINT `fk_initiatives_report` FOREIGN KEY (`related_report_id`) REFERENCES `reports` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `initiatives` (4 rows)
INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-1', 'CSC बाल विद्यालय, मॉडेल लर्निंग लॅब व RTE २५% सर्व शिक्षा', 'CSC Bal Vidyalaya, Model Learning Lab & RTE 25% Education Drive', 'शिक्षण', '२०२५-०१-१५', 'नादरपूर व कन्नड तालुका, जि. छत्रपती संभाजीनगर', 'Nadarpur & Kannad Block, Dist. Chhatrapati Sambhajinagar', 'खेळातून शिक्षण (Laugh, Play, Enjoy), मॉडेल लॅबद्वारे अक्षर-अंक-आकार-रंग ज्ञान, शालेय व्यवस्थापन समिती (SMC) मासिक बैठका आणि आर.टी.ई. मित्रांच्या सहकार्याने १००% शालेय उपस्थिती अभियान.', 'Joyful activity-based schooling at CSC Bal Vidyalaya, Model Lab games (Alphabets, Numbers, Shapes, Colors), monthly School Management Committee (SMC) meetings across 60%–80% schools, and RTE 25% admission facilitation.', 'राष्ट्रीय शैक्षणिक धोरणानुसार व शासनाच्या मार्गदर्शक तत्त्वांनुसार संस्थेने नादरपूर येथे CSC बाल विद्यालय व मॉडेल लॅब सुरू केली आहे. मुलांना भीतीमुक्त, आनंदी व खेळकर वातावरणात कथा, कविता, गाणी आणि अभिनयातून शिक्षण दिले जाते.', 'Entered into the mainstream education movement with full preparation, our Sanstha operates CSC Bal Vidyalaya and a dedicated Model Lab teaching children through interactive games, stories, songs, and gestures.', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80', '0', '1', '1', 'rep-1', 'शिक्षण', '0', '2026-10-20 16:45:01', '2026-10-22 00:40:30');
INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-2', 'शासकीय कल्याणकारी योजना जनजागृती व थेट लाभ मार्गदर्शन कक्ष', 'Government Welfare Schemes Awareness & Direct Benefit Guidance', 'शासकीय योजना जनजागृती', '२०२५-०२-०१', 'नादरपूर व छत्रपती संभाजीनगर जिल्हा ग्रामपंचायत क्षेत्र', 'Nadarpur & Chhatrapati Sambhajinagar Gram Panchayats', 'बायोमेट्रिक आधार, संजय गांधी निराधार, श्रावणबाळ सेवा, इंदिरा गांधी निवृत्तीवेतन, ई-श्रम कामगार कार्ड, हस्तकला कारागीर कार्ड व शेतकरी समृद्धी योजनांचा तळागाळातील नागरिकांना थेट लाभ.', 'Comprehensive study and grassroots facilitation for Biometric Aadhaar, Sanjay Gandhi Niradhar, Shravanbal Seva, Indira Gandhi National Pension Schemes, e-Shram Card, Artisan Card, and Farmer Prosperity Schemes.', 'केंद्र व राज्य शासनाच्या विविध योजना तळागाळातील शेवटच्या घटकापर्यंत पोहोचाव्यात यासाठी आमची संस्था सर्व योजनांचा सखोल अभ्यास करून शेतकरी, कामगार, महिला, मुले व वृद्धांना थेट लाभ मिळवून देते.', 'Our organization conducts a thorough study of terms, eligibility, and documentation requirements to connect farmers, workers, women, children, and seniors directly with statutory government welfare schemes.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80', '1', '1', '1', 'rep-2', 'संजय गांधी निराधार, श्रावणबाळ योजना', '0', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-3', 'श्रीकृष्ण संगीत प्रशिक्षण केंद्र व सांस्कृतिक कला संवर्धन उपक्रम', 'Shrikrishna Music Training Center & Cultural Arts Promotion', 'सामाजिक कल्याण', '२०२४-१२-१०', 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर', 'Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar', 'ग्रामीण भागातील उदयोन्मुख कलाकारांना प्रोत्साहन देण्यासाठी श्रीकृष्ण संगीत प्रशिक्षण केंद्राची स्थापना; गायन, वादन, नाट्य व लोककला कार्यक्रमांचे आयोजन.', 'Promoting Maharashtra’s rich cultural heritage and rural artists through the Shrikrishna Music Training Center, organizing vocal music, instrumental, drama, and folk art programs.', 'ग्रामीण मातीतील विविध कलाप्रकार आणि कलाकारांना व्यासपीठ व प्रोत्साहन देण्यासाठी संस्थेने नादरपूर येथे श्रीकृष्ण संगीत प्रशिक्षण केंद्र स्थापन केले आहे.', 'Through Shrikrushna Sanskrutik va Gramin Vikas Sanstha at Nadarpur, we continuously promote rural artists and cultural traditions by operating the Shrikrishna Music Training Center.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', '0', '1', '1', NULL, 'संगीत विद्यालय, सांस्कृतिक संवर्धन', '0', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-4', 'मोफत आरोग्य तपासणी, व्यसनमुक्ती, योग शिबिरे व कोविड-१९ अन्न सुरक्षा', 'Free Medical Camps, De-Addiction, Yoga & COVID-19 Food Relief', 'आरोग्यविषयक उपक्रम', '२०२४-११-२०', 'कन्नड व छत्रपती संभाजीनगर ग्रामीण विभाग', 'Kannad & Chhatrapati Sambhajinagar Rural Belt', '‘आरोग्य हीच खरी संपत्ती’ या ब्रीदवाक्यानुसार तज्ज्ञ डॉक्टरांमार्फत नेत्रतपासणी, रक्तदाब, मधुमेह, व्यसनमुक्ती व योग-प्राणायाम शिबिरे तसेच आपत्ती काळात अन्नधान्य वाटप.', 'Guided by \"Health is Wealth\", organizing expert eye check-ups, BP & sugar diagnostics, de-addiction & yoga-pranayama camps, alongside rural food distribution.', '‘आरोग्य हीच खरी संपत्ती’ हे ब्रीद मानून संस्थेमार्फत तज्ज्ञ डॉक्टरांच्या सहकार्याने डोळ्यांची तपासणी, रक्तदाब (BP), शुगर तपासणी, व्यसनमुक्ती शिबिरे आणि योग-प्राणायाम शिबिरे आयोजित केली जातात.', 'Our Sanstha organizes regular medical camps with expert doctors covering eye check-ups, blood pressure, diabetes screening, de-addiction counseling, and Yoga-Pranayama sessions.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', '0', '1', '1', 'rep-3', 'आरोग्य शिबीर, नेत्र व रक्तदाब तपासणी', '0', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

-- --------------------------------------------------------
-- Table structure for `inquiries`
-- --------------------------------------------------------
CREATE TABLE `inquiries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact_detail` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('new','read','replied','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `replied_at` datetime DEFAULT NULL,
  `replied_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inquiries_status` (`status`),
  KEY `idx_inquiries_created` (`created_at`),
  KEY `fk_inquiries_replied_admin` (`replied_by`),
  KEY `idx_inquiries_ip_created` (`ip_address`,`created_at`),
  CONSTRAINT `fk_inquiries_replied_admin` FOREIGN KEY (`replied_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `login_attempts`
-- --------------------------------------------------------
CREATE TABLE `login_attempts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempted_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ip_attempted` (`ip_address`,`attempted_at`),
  KEY `idx_user_attempted` (`username`,`attempted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `media_files`
-- --------------------------------------------------------
CREATE TABLE `media_files` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` enum('image','document','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'image',
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size_bytes` int unsigned NOT NULL,
  `alt_text_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alt_text_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_media_type` (`file_type`),
  KEY `idx_media_uploader` (`uploaded_by`),
  KEY `idx_media_created` (`created_at`),
  CONSTRAINT `fk_media_uploaded_admin` FOREIGN KEY (`uploaded_by`) REFERENCES `admins` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `officials`
-- --------------------------------------------------------
CREATE TABLE `officials` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_mr` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_en` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_mr` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_en` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bio_mr` text COLLATE utf8mb4_unicode_ci,
  `bio_en` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_officials_published` (`published`),
  KEY `idx_officials_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `officials` (6 rows)
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-1', 'श्रीमती सविता दिलीप निकम', 'Smt. Savita Dilip Nikam', 'सचिव व मुख्य प्रवर्तक', 'Secretary & Chief Promoter', 'ग्रामीण विकास, महिला सक्षमीकरण, CSC बाल विद्यालय व शासकीय योजनांच्या तळागाळातील अंमलबजावणीसाठी समर्पित नेतृत्व.', 'Dedicated leadership in rural development, women empowerment, CSC Bal Vidyalaya, and grassroots welfare scheme implementation.', NULL, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-1792520633973', 'चेतन निकम', 'chetan nikam', 'सचिव', 'sachiv', NULL, NULL, '123456789', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80', '0', '1', '2026-10-20 23:53:54', '2026-10-20 23:54:43');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-1792567896233', 'CHETAN', 'CHETAN', 'SACHIV', 'SACHIV', NULL, NULL, '1234567890', '/backend-php-mysql/uploads/officials/off_5318adbc0d8ccb861810.jpg', '0', '1', '2026-10-21 13:01:36', '2026-10-21 13:01:36');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-2', 'श्री. दिलीप निकम', 'Shri. Dilip Nikam', 'अध्यक्ष व मार्गदर्शक', 'President & Mentor', 'नादरपूर व छत्रपती संभाजीनगर जिल्ह्यात शैक्षणिक, सांस्कृतिक, कृषी व सामाजिक उपक्रमांचे नियोजन व मार्गदर्शन.', 'Guiding educational, cultural, agricultural, and social development initiatives across Nadarpur and Chhatrapati Sambhajinagar.', NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '2', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-3', 'श्री. राजेश पाटील', 'Shri. Rajesh Patil', 'उपाध्यक्ष', 'Vice President', 'पर्यावरण संवर्धन, औषधी वृक्षारोपण आणि शेतकरी कौशल्य विकास कार्यशाळांचे समन्वय.', 'Coordinating environmental conservation, medicinal tree plantation drives, and farmer skill workshops.', NULL, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', '3', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-4', 'श्रीमती अनिता देशमुख', 'Smt. Anita Deshmukh', 'कोषाध्यक्ष', 'Treasurer', 'महिला बचत गट, सूक्ष्म वित्त नियोजन आणि शालेय व्यवस्थापन समिती (SMC) समन्वय.', 'Leading women self-help groups, micro-savings initiatives, and School Management Committee (SMC) coordination.', NULL, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', '4', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

-- --------------------------------------------------------
-- Table structure for `page_sections`
-- --------------------------------------------------------
CREATE TABLE `page_sections` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `page_slug` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `section_key` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content_mr` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_en` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sections_page` (`page_slug`),
  KEY `idx_sections_lookup` (`page_slug`,`section_key`),
  KEY `idx_sections_order` (`display_order`),
  CONSTRAINT `fk_page_sections_page` FOREIGN KEY (`page_slug`) REFERENCES `site_pages` (`slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Table structure for `reports`
-- --------------------------------------------------------
CREATE TABLE `reports` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_mr` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `period_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT '1.8 MB PDF',
  `category_mr` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `pdf_url` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `cover_image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `published` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_published` (`published`),
  KEY `idx_reports_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `reports` (3 rows)
INSERT INTO `reports` (`id`, `title_mr`, `title_en`, `period_mr`, `period_en`, `report_date`, `file_size`, `category_mr`, `category_en`, `summary_mr`, `summary_en`, `pdf_url`, `cover_image_url`, `file_path`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('rep-1', 'संस्थेचा वार्षिक कार्य अहवाल व परिचय पुस्तिका', 'Institutional Profile & Annual Activity Report', 'वर्ष २०२४-२५', 'Year 2024-25', '२०२५-०३-१५', '1.8 MB PDF', 'वार्षिक अहवाल', 'Annual Report', 'नादरपूर व छत्रपती संभाजीनगर जिल्ह्यात राबवलेले CSC बाल विद्यालय, श्रीकृष्ण संगीत प्रशिक्षण केंद्र, RTE २५% शिक्षण, आरोग्य शिबिरे व वृक्षारोपण उपक्रमांचा सविस्तर आढावा.', 'Comprehensive overview of working area programs across Nadarpur, Kannad, and Chhatrapati Sambhajinagar including CSC Bal Vidyalaya, Music Training Center, and health camps.', '#', NULL, NULL, '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `reports` (`id`, `title_mr`, `title_en`, `period_mr`, `period_en`, `report_date`, `file_size`, `category_mr`, `category_en`, `summary_mr`, `summary_en`, `pdf_url`, `cover_image_url`, `file_path`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('rep-2', 'सर्व शिक्षा अभियान, SMC बैठका व RTE २५% प्रवेश प्रक्रिया अहवाल', 'Sarva Shiksha Abhiyan, SMC Meetings & RTE 25% Admission Report', 'शैक्षणिक वर्ष २०२४-२५', 'Academic Year 2024-25', '२०२५-०१-१०', '1.2 MB PDF', 'शैक्षणिक अहवाल', 'Education Report', 'शालेय व्यवस्थापन समिती (SMC) मासिक बैठका, पालक-समुदाय संवाद आणि आर.टी.ई. मित्रांच्या सहभागातून राबवलेल्या शैक्षणिक उपक्रमांचा अहवाल.', 'Evaluation of School Management Committee (SMC) monthly meetings, parent-community mobilization, Model Lab outcomes, and RTE 25% admissions.', '#', NULL, NULL, '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `reports` (`id`, `title_mr`, `title_en`, `period_mr`, `period_en`, `report_date`, `file_size`, `category_mr`, `category_en`, `summary_mr`, `summary_en`, `pdf_url`, `cover_image_url`, `file_path`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('rep-3', 'आरोग्य शिबिरे, पर्यावरण संवर्धन व महिला सक्षमीकरण उपक्रम अहवाल', 'Health Camps, Environment Conservation & Women Empowerment Report', 'वर्ष २०२३-२४', 'Year 2023-24', '२०२४-०६-२५', '2.1 MB PDF', 'उपक्रम अहवाल', 'Activity Report', 'कन्नड व छत्रपती संभाजीनगर जिल्ह्यातील आरोग्य व नेत्रतपासणी शिबिरे, व्यसनमुक्ती अभियान, औषधी वृक्षारोपण आणि महिला बचत गट कार्यशाळांचा अहवाल.', 'Record of preventative health & de-addiction camps, medicinal plantations, and women self-help group workshops.', '#', NULL, NULL, '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

-- --------------------------------------------------------
-- Table structure for `site_pages`
-- --------------------------------------------------------
CREATE TABLE `site_pages` (
  `slug` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meta_description_mr` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `meta_description_en` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `site_pages` (3 rows)
INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`, `updated_at`) VALUES ('about', 'संस्थेविषयी परिचय व ध्येय', 'About Sanstha & Mission', 'श्रीकृष्ण संस्थेची अधिकृत माहिती व उद्दिष्टे.', 'Official details and objectives of Shrikrushna Sanstha.', '1', '2026-10-20 23:41:48');
INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`, `updated_at`) VALUES ('privacy', 'गोपनीयता धोरण', 'Privacy Policy', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेचे अधिकृत गोपनीयता धोरण.', 'Official privacy policy and personal data protection principles.', '1', '2026-10-20 16:45:02');
INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`, `updated_at`) VALUES ('work', 'कार्यक्षेत्र व सामाजिक उपक्रम', 'Working Areas & Impact', 'नादरपूर, कन्नड व छत्रपती संभाजीनगर जिल्ह्यातील सामाजिक व शैक्षणिक कार्यक्षेत्र.', 'Core working areas and community development impact across rural Maharashtra.', '1', '2026-10-20 16:45:02');

-- --------------------------------------------------------
-- Table structure for `site_settings`
-- --------------------------------------------------------
CREATE TABLE `site_settings` (
  `key_name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `value_mr` text COLLATE utf8mb4_unicode_ci,
  `value_en` text COLLATE utf8mb4_unicode_ci,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key_name`),
  KEY `idx_settings_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `site_settings` (4 rows)
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('hero_badge', 'hero', 'ग्रामीण परिवर्तन आणि लोककल्याण', 'Rural Transformation & Public Welfare', 'Badge on top of homepage hero banner', '2026-10-21 13:38:26');
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('hero_stats_beneficiaries', 'hero', '५०००+ नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच', '5000+ Citizens & Students Reached', 'Key statistical metric for homepage', '2026-10-20 16:45:02');
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('hero_stats_villages', 'hero', '२5+ ग्रामपंचायतींमध्ये थेट उपक्रम विस्तार', '25+ Gram Panchayats Covered', 'Total covered villages count', '2026-10-20 23:56:57');
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('sanstha_tagline', 'general', 'ग्रामीण भागातील शिक्षण, सांस्कृतिक संवर्धन, आरोग्य व सामाजिक विकासासाठी कटिबद्ध', 'Committed to rural education, cultural heritage, healthcare, and social empowerment', 'Official motto / tagline', '2026-10-20 16:45:02');

-- --------------------------------------------------------
-- Table structure for `videos`
-- --------------------------------------------------------
CREATE TABLE `videos` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_mr` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_mr` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `description_en` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `duration_seconds` int DEFAULT '180',
  `duration_formatted` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT '०३:००',
  `duration_formatted_en` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT '03:00',
  `thumbnail_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publish_date` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `related_activity_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `published` tinyint(1) DEFAULT '1',
  `featured` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_videos_published` (`published`,`featured`),
  KEY `idx_videos_category` (`category`),
  KEY `idx_videos_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dumping data for table `videos` (4 rows)
INSERT INTO `videos` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `duration_seconds`, `duration_formatted`, `duration_formatted_en`, `thumbnail_url`, `video_url`, `publish_date`, `related_activity_title`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('vid-1', 'CSC बाल विद्यालय व सर्व शिक्षा अभियान — आनंददायी शिक्षण उपक्रम', 'CSC Bal Vidyalaya & Sarva Shiksha Abhiyan — Joyful Learning Documentary', 'नादरपूर येथील CSC बाल विद्यालय, मॉडेल लॅब आणि शालेय व्यवस्थापन समिती (SMC) बैठकांद्वारे ग्रामीण शिक्षणाचा दर्जा उंचावणाऱ्या कार्याची प्रत्यक्ष झलक.', 'Field documentary showcasing playful learning at CSC Bal Vidyalaya, Model Lab activities, and village SMC parent meetings.', 'शिक्षण', '195', '०३:१५', '03:15', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4', '२०२५-०१-२०', 'CSC बाल विद्यालय, मॉडेल लर्निंग लॅब व RTE २५% सर्व शिक्षा अभियान', '0', '0', '0', '2026-10-20 16:45:01', '2026-10-20 21:25:04');
INSERT INTO `videos` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `duration_seconds`, `duration_formatted`, `duration_formatted_en`, `thumbnail_url`, `video_url`, `publish_date`, `related_activity_title`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('vid-1792511529940', 'dekhte', 'dekhte dekhte', 'hindi song ahe', 'this is hindi song', 'महिला व ज्येष्ठ नागरिक सहाय्य', '180', '०३:००', '03:00', 'https://i.ytimg.com/vi/rkWJyMhIWLo/hqdefault.jpg', 'https://youtu.be/rkWJyMhIWLo', '2026-10-20', NULL, '0', '1', '1', '2026-10-20 21:22:09', '2026-10-20 21:22:09');
INSERT INTO `videos` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `duration_seconds`, `duration_formatted`, `duration_formatted_en`, `thumbnail_url`, `video_url`, `publish_date`, `related_activity_title`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('vid-2', 'शासकीय योजना जनजागृती — निराधार, श्रावणबाळ, ई-श्रम व शेतकरी समृद्धी', 'Government Welfare Schemes — Direct Benefit & Documentation Guide', 'तळागाळातील नागरिकांना संजय गांधी निराधार, इंदिरा गांधी निवृत्तीवेतन, बायोमेट्रिक आधार व ई-श्रम कामगार कार्डचा थेट लाभ मिळवून देणाऱ्या शिबिराचे चित्रीकरण.', 'Practical orientation explaining eligibility criteria and paperwork support for state pensions, e-Shram, and farmer welfare schemes.', 'शासकीय योजना जनजागृती', '150', '०२:३०', '02:30', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=640&q=75', 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4', '२०२५-०२-०५', 'शासकीय कल्याणकारी योजना जनजागृती व थेट लाभ मार्गदर्शन कक्ष', '0', '1', '0', '2026-10-20 16:45:01', '2026-10-20 18:46:09');
INSERT INTO `videos` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `duration_seconds`, `duration_formatted`, `duration_formatted_en`, `thumbnail_url`, `video_url`, `publish_date`, `related_activity_title`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('vid-3', 'औषधी वृक्षारोपण, आरोग्य शिबीर व ग्रामविकास लोकसहभाग क्षणचित्रे', 'Medicinal Plantation, Health Camps & Rural Development Moments', 'ग्रामस्थांच्या सहभागातून औषधी झाडांची लागवड, मोफत आरोग्य व नेत्रतपासणी शिबीर आणि शेतकरी कौशल्य कार्यशाळेचे माहितीपट दृश्य.', 'Participatory footage of villagers planting medicinal trees, attending health checkup camps, and agricultural workshops.', 'पर्यावरण संवर्धन', '165', '०२:४५', '02:45', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=640&q=75', 'https://vjs.zencdn.net/v/oceans.mp4', '२०२४-०८-१५', 'पर्यावरण संवर्धन, नैसर्गिक संसाधन जतन व औषधी वृक्षारोपण मोहीम', '0', '1', '0', '2026-10-20 16:45:01', '2026-10-20 18:46:09');

-- --------------------------------------------------------
-- Table structure for `volunteers`
-- --------------------------------------------------------
CREATE TABLE `volunteers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `full_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city_village` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `taluka` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'कन्नड',
  `district` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'छत्रपती संभाजीनगर',
  `age_bracket` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `availability` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occupation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `areas_of_interest` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` enum('new','reviewing','approved','contacted','declined','rejected','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'new',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_volunteers_status` (`status`),
  KEY `idx_volunteers_phone` (`phone`),
  KEY `idx_volunteers_created` (`created_at`),
  KEY `idx_volunteers_ip_created` (`ip_address`,`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
