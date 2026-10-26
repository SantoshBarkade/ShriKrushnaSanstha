-- Checkpoint backup of shrikrushnasanstha2
SET FOREIGN_KEY_CHECKS = 0;

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
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('1', '1', '95e67f90319aa52e27565708284352a9580b3e7ace7c1479f580f6f228be44c0', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-20 21:56:10', '2026-10-20 19:26:10', '2026-10-23 01:29:16');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('3', '1', '786f448cb42111d56dabfbc56bfa68ec6cb0582d6c4c8c512ce2be60c001e67e', NULL, NULL, '2026-10-20 23:58:54', '2026-10-20 21:58:54', '2026-10-21 13:15:49');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('18', '1', '5e33f6817dbb97938b011e2411ee70676f8b1fe7d6ffcf907da919a55226c2cc', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-21 02:17:18', '2026-10-20 23:47:18', '2026-10-23 01:29:16');
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
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('42', '1', '558e7f6dcd5121ab28bafb55d4e4bdebe8dcebd84802248a3227788917caf6bf', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-21 17:58:55', '2026-10-21 15:28:55', '2026-10-23 01:29:16');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('47', '1', '7f374470826de7ab96863c20b800ef44614695c214ea9acb2dd2057302fa8b11', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-22 03:09:22', '2026-10-22 00:39:22', '2026-10-23 01:29:16');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('56', '1', '5653d001dafa4b5996aef6164bf0b02b314d3c42b07e041fa2c7c83a2b87a8f0', NULL, NULL, '2026-10-22 14:38:36', '2026-10-22 13:38:36', '2026-10-23 01:29:16');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('58', '1', '099c5e58b10b1c131c555fa5488c492d4386b6b6b61dc7c1e05276ae36a7c174', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-22 16:15:52', '2026-10-22 13:45:52', '2026-10-23 01:29:16');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('62', '1', '2af7e7274f7e043a5709d980e982c32be7e06a86cea2ec5fa76e5691e3422b95', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-22 18:51:09', '2026-10-22 16:21:09', '2026-10-23 01:29:16');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('63', '1', 'ff9d19dcf8cecc9032e6d62e58030543833a7d1c3810eac6bc0513810bc3c8b6', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-23 02:00:38', '2026-10-22 23:30:38', '2026-10-23 00:56:39');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('64', '1', '168b8d87e2661491a6a177011eb4bff71edcf046d361db52add8c9ddfd9c813d', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-23 03:26:41', '2026-10-23 00:56:41', '2026-10-23 01:11:37');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('65', '1', '3381635968c3f737ebf513b0ee4754caa7da66fa93d5801bc9c10eefec2abaca', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-23 03:41:44', '2026-10-23 01:11:44', '2026-10-23 01:19:55');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('66', '8', '91d4d674852758387ef9edbd9b144f1aa5aafd87b55769a3b781f72bf87c24c2', '127.0.0.1', 'node', '2026-10-23 03:43:00', '2026-10-23 01:13:00', '2026-10-23 01:30:08');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('67', '8', '986272d2fce4aa0b91549f8583d5a8b5c77731d1e0aca31a6f6f540288fb62ff', '127.0.0.1', 'node', '2026-10-23 03:43:29', '2026-10-23 01:13:29', '2026-10-23 01:30:08');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('68', '8', '37e2daeb890a7e3cda8e701290429a990d2765c68c718a8c038ab1247a532fe5', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-23 03:53:00', '2026-10-23 01:23:00', '2026-10-23 01:30:08');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('69', '8', '9a8c33e2b165414240adbf6c6c5f68da4956cedfd100b47a40b83f91d68ea023', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-23 04:00:38', '2026-10-23 01:30:38', '2026-10-24 21:46:53');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('70', '8', '035bc1f5b26f836152ff6a689c9f201f9f6db42b0274fb7dcbc8dacc386415ba', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-23 04:45:33', '2026-10-23 02:15:33', '2026-10-24 21:46:53');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('71', '8', '3953d222ef2dc0a179fab107ee52cc804ff76682738809287e5748a86c39fdb9', '127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36', '2026-10-23 05:12:12', '2026-10-23 02:42:12', '2026-10-23 02:47:33');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('72', '8', '37d126de5070eb26b974b1ad4537008b019c35f0539ebce06159de1974bd7aca', '127.0.0.1', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Mobile Safari/537.36', '2026-10-23 05:20:49', '2026-10-23 02:50:49', '2026-10-24 21:46:53');
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('73', '8', '71c920a986a4442741838f021241d61d7aeb18fc40cb510dbfb1f1d6a09aef72', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36 Edg/155.0.0.0', '2026-10-25 00:17:17', '2026-10-24 21:47:17', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('74', '1', '908b049f2cc86e01300f8e3ce8e8951901aa1757446f5f35b984056fd19d0c58', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0', '2026-10-26 01:04:59', '2026-10-25 22:34:59', NULL);
INSERT INTO `admin_tokens` (`id`, `admin_id`, `token_hash`, `ip_address`, `user_agent`, `expires_at`, `created_at`, `revoked_at`) VALUES ('75', '1', '5fcb9da7d1c7f8eafa29604d80554adb5f96004b4e619fa8b00bd116f4e4e200', '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36', '2026-10-26 14:21:53', '2026-10-26 11:51:53', NULL);

CREATE TABLE `admins` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT 'Secretary / Super Admin',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `email`, `role`, `created_at`, `updated_at`) VALUES ('1', 'super_admin', '$2y$12$EbpAqBb2IigRttmtpWgKyuyJZX6ky7L.QeR5F7t/oWU0LEcqh4RWK', 'Santosh Barkade', NULL, 'super_admin', '2026-10-20 19:25:45', '2026-10-23 01:29:16');
INSERT INTO `admins` (`id`, `username`, `password_hash`, `full_name`, `email`, `role`, `created_at`, `updated_at`) VALUES ('8', 'chetan.nikam', '$2y$12$W2My/0v44t8SsQOsCmgs7.c/t/jrtOm2qy3W5RTKcwkghVmMl2c3i', 'Chetan Dilip Nikam', 'chetannikam1214@gmail.com', 'super_admin', '2026-10-23 01:12:06', '2026-10-24 21:46:53');

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

INSERT INTO `announcements` (`id`, `title_mr`, `title_en`, `event_date_mr`, `event_date_en`, `is_upcoming`, `category`, `summary_mr`, `summary_en`, `content_mr`, `content_en`, `cover_image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('ann-1', 'CSC बाल विद्यालय व RTE २५% मोफत प्रवेश प्रक्रिया मार्गदर्शन शिबीर', 'CSC Bal Vidyalaya & RTE 25% Admission Guidance Camp', '२५ मार्च २०२५', 'March 25, 2025', '1', 'शिक्षण', 'नादरपूर व कन्नड तालुक्यातील पालकांसाठी RTE २५% ऑनलाइन अर्ज, शालेय व्यवस्थापन समिती बैठक आणि CSC बाल विद्यालय प्रवेशाबाबत विशेष मार्गदर्शन.', 'Special parent orientation in Nadarpur and Kannad block for RTE 25% admission applications and joyful learning enrollment at CSC Bal Vidyalaya.', 'वंचित व आर्थिकदृष्ट्या दुर्बल घटकातील एकही विद्यार्थी शिक्षणापासून वंचित राहू नये यासाठी संस्थेच्या नादरपूर कार्यालयात व ग्रामपंचायत पातळीवर आर.टी.ई. मित्रांच्या सहकार्याने मोफत मार्गदर्शन शिबीर आयोजित करण्यात आले आहे.', 'To ensure every child from all walks of life enters the educational mainstream, RTE Friends and Sanstha volunteers will assist parents with RTE 25% documentation at our Nadarpur center.', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `announcements` (`id`, `title_mr`, `title_en`, `event_date_mr`, `event_date_en`, `is_upcoming`, `category`, `summary_mr`, `summary_en`, `content_mr`, `content_en`, `cover_image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('ann-2', 'मोफत नेत्रतपासणी, रक्तदाब, मधुमेह व योग-प्राणायाम आरोग्य शिबीर संपन्न', 'Free Eye Check-up, BP, Diabetes & Yoga Health Camp Concluded', '१२ फेब्रुवारी २०२५', 'February 12, 2025', '0', 'आरोग्यविषयक उपक्रम', 'तज्ज्ञ डॉक्टरांच्या उपस्थितीत नादरपूर परिसरातील ग्रामस्थ व ज्येष्ठ नागरिकांची मोफत आरोग्य तपासणी व व्यसनमुक्ती समुपदेशन संपन्न.', 'Expert medical team conducted comprehensive eye, blood pressure, and blood sugar screenings alongside yoga-pranayama sessions for rural residents.', '‘आरोग्य हीच खरी संपत्ती’ या ध्येयाने आयोजित शिबिरात शारीरिक व मानसिक आरोग्याचे महत्त्व पटवून देण्यात आले तसेच गरजू रुग्णांना मोफत आरोग्य सल्ला देण्यात आला.', 'Guided by our motto \"Health is Wealth\", the camp addressed both physical and mental health challenges, providing free diagnostics and lifestyle guidance.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', '0', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

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

INSERT INTO `contact_info` (`id`, `reg_no_mr`, `reg_no_en`, `secretary_name_mr`, `secretary_name_en`, `phone`, `email`, `address_mr`, `address_en`, `taluka_mr`, `taluka_en`, `district_mr`, `district_en`, `visiting_hours_mr`, `visiting_hours_en`, `updated_at`) VALUES ('1', 'रजि. नं.: एक 14668 (औ)', 'Reg. No.: Ek 14668 (A)', 'श्रीमती सविता दिलीप निकम', 'Smt. Savita Dilip Nikam', '+91 9923512482, +91 8888684966', 'shrikrushnasanstha.nadarpur@gmail.com', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, मु. पो. नादरपूर, तहसील कन्नड, जिल्हा छत्रपती संभाजीनगर (औरंगाबाद), महाराष्ट्र (रजि. नं.: एक 14668 औ)', 'Shrikrushna Sanskrutik and Gramin Vikas Sanstha, At Post Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar (Aurangabad), Maharashtra (Reg. No.: Ek 14668 A)', 'कन्नड (नादरपूर)', 'Kannad (Nadarpur)', 'छत्रपती संभाजीनगर (औरंगाबाद)', 'Chhatrapati Sambhajinagar (Aurangabad)', 'सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ०६:००', 'Monday to Saturday: 10:00 AM to 06:00 PM', '2026-10-22 00:41:39');

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

INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-1', 'CSC बाल विद्यालय व मॉडेल लर्निंग लॅब', 'CSC Bal Vidyalaya & Model Learning Lab', 'नादरपूर येथील बाल विद्यालयातील खेळातून आनंददायी शिक्षण व वर्ग उपक्रम.', 'Joyful learning through games and interactive model lab sessions at Nadarpur.', 'शिक्षण', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-2', 'शासकीय योजना जनजागृती व मार्गदर्शन शिबिरे', 'Government Welfare Schemes Guidance Camps', 'संजय गांधी निराधार, श्रावणबाळ, ई-श्रम व शेतकरी समृद्धी योजना मार्गदर्शन सत्रे.', 'Grassroots orientation sessions for social security pensions and artisan cards.', 'शासकीय योजना जनजागृती', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '2', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-3', 'आरोग्य तपासणी, योग व व्यसनमुक्ती शिबिरे', 'Medical Checkup, Yoga & De-Addiction Camps', 'मोफत नेत्र तपासणी, रक्तदाब, मधुमेह व योग-प्राणायाम सत्रे.', 'Free medical diagnostic camps and wellness yoga sessions across rural blocks.', 'आरोग्यविषयक उपक्रम', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '3', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `gallery_albums` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `cover_image_url`, `event_date`, `display_mode`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('alb-4', 'पर्यावरण रक्षण व औषधी वृक्षारोपण मोहीम', 'Environmental Conservation & Tree Plantation', 'देशी व औषधी झाडांची लागवड आणि नैसर्गिक संसाधन संवर्धन उपक्रम.', 'Community-driven native and medicinal sapling plantation drives in Kannad block.', 'पर्यावरण संवर्धन', 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=800&q=80', NULL, 'grid', '4', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

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

INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `eligibility_mr`, `eligibility_en`, `documents_required_mr`, `documents_required_en`, `benefits_mr`, `benefits_en`, `official_portal_url`, `cover_image_url`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('scheme-eshram', 'ई-श्रम कामगार कार्ड नोंदणी अभियान', 'e-Shram Unorganized Worker Card Drive', 'कामगार व रोजगार मंत्रालय, भारत सरकार', 'Ministry of Labour and Employment, Govt. of India', 'असंघटित क्षेत्रातील कामगार, शेतमजूर, बांधकाम कामगार', 'Unorganized sector workers, farm laborers, construction workers', 'असंघटित क्षेत्रातील कामगारांना सामाजिक सुरक्षा योजना, विमा आणि थेट लाभासाठी राष्ट्रीय डेटाबेस नोंदणी.', 'National unorganized workers database facilitating social security and insurance coverage.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://eshram.gov.in', NULL, '0', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `eligibility_mr`, `eligibility_en`, `documents_required_mr`, `documents_required_en`, `benefits_mr`, `benefits_en`, `official_portal_url`, `cover_image_url`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('scheme-sanjay-gandhi', 'संजय गांधी निराधार अनुदान योजना', 'Sanjay Gandhi Niradhar Financial Assistance Scheme', 'सामाजिक न्याय व विशेष सहाय्य विभाग', 'Department of Social Justice and Special Assistance', 'निराधार, अंध, अपंग, अनाथ मुले व दुर्धर आजारी व्यक्ती', 'Destitute, blind, disabled, orphans, and critically ill', 'दारिद्र्यरेषेखालील अथवा अल्प उत्पन्न असलेल्या निराधार व्यक्तींना मासिक आर्थिक सहाय्य.', 'Monthly financial assistance to destitute citizens living below poverty line.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://sjsa.maharashtra.gov.in', NULL, '0', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `government_schemes` (`id`, `title_mr`, `title_en`, `department_mr`, `department_en`, `beneficiary_category_mr`, `beneficiary_category_en`, `summary_mr`, `summary_en`, `eligibility_mr`, `eligibility_en`, `documents_required_mr`, `documents_required_en`, `benefits_mr`, `benefits_en`, `official_portal_url`, `cover_image_url`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('scheme-shravanbal', 'श्रावणबाळ सेवा राज्य निवृत्तीवेतन योजना', 'Shravanbal Seva State Pension Scheme', 'सामाजिक न्याय विभाग, महाराष्ट्र शासन', 'Department of Social Justice, Govt. of Maharashtra', '६५ वर्षे व त्यावरील ज्येष्ठ नागरिक (BPL कुटुंब)', 'Senior citizens aged 65 and above (BPL)', '६५ वर्षे व त्यावरील निराधार व दारिद्र्यरेषेखालील वृद्धांना दरमहा निवृत्तीवेतन.', 'Monthly state pension for underprivileged elderly citizens aged 65 and above.', NULL, NULL, NULL, NULL, NULL, NULL, 'https://sjsa.maharashtra.gov.in', NULL, '0', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

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

INSERT INTO `initiative_photos` (`id`, `initiative_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('3', 'init-2', 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&w=800&q=80', 'शासकीय योजना थेट अर्ज मार्गदर्शन', 'Direct scheme application assistance', '1', '2026-10-20 16:45:01');
INSERT INTO `initiative_photos` (`id`, `initiative_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('18', 'init-1', 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80', NULL, NULL, '1', '2026-10-22 00:40:30');
INSERT INTO `initiative_photos` (`id`, `initiative_id`, `image_url`, `caption_mr`, `caption_en`, `display_order`, `created_at`) VALUES ('19', 'init-1', 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80', NULL, NULL, '2', '2026-10-22 00:40:30');

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

INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-1', 'CSC बाल विद्यालय, मॉडेल लर्निंग लॅब व RTE २५% सर्व शिक्षा', 'CSC Bal Vidyalaya, Model Learning Lab & RTE 25% Education Drive', 'शिक्षण', '२०२५-०१-१५', 'नादरपूर व कन्नड तालुका, जि. छत्रपती संभाजीनगर', 'Nadarpur & Kannad Block, Dist. Chhatrapati Sambhajinagar', 'खेळातून शिक्षण (Laugh, Play, Enjoy), मॉडेल लॅबद्वारे अक्षर-अंक-आकार-रंग ज्ञान, शालेय व्यवस्थापन समिती (SMC) मासिक बैठका आणि आर.टी.ई. मित्रांच्या सहकार्याने १००% शालेय उपस्थिती अभियान.', 'Joyful activity-based schooling at CSC Bal Vidyalaya, Model Lab games (Alphabets, Numbers, Shapes, Colors), monthly School Management Committee (SMC) meetings across 60%–80% schools, and RTE 25% admission facilitation.', 'राष्ट्रीय शैक्षणिक धोरणानुसार व शासनाच्या मार्गदर्शक तत्त्वांनुसार संस्थेने नादरपूर येथे CSC बाल विद्यालय व मॉडेल लॅब सुरू केली आहे. मुलांना भीतीमुक्त, आनंदी व खेळकर वातावरणात कथा, कविता, गाणी आणि अभिनयातून शिक्षण दिले जाते.', 'Entered into the mainstream education movement with full preparation, our Sanstha operates CSC Bal Vidyalaya and a dedicated Model Lab teaching children through interactive games, stories, songs, and gestures.', 'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80', '0', '1', '1', NULL, 'शिक्षण', '0', '2026-10-20 16:45:01', '2026-10-22 00:40:30');
INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-2', 'शासकीय कल्याणकारी योजना जनजागृती व थेट लाभ मार्गदर्शन कक्ष', 'Government Welfare Schemes Awareness & Direct Benefit Guidance', 'शासकीय योजना जनजागृती', '२०२५-०२-०१', 'नादरपूर व छत्रपती संभाजीनगर जिल्हा ग्रामपंचायत क्षेत्र', 'Nadarpur & Chhatrapati Sambhajinagar Gram Panchayats', 'बायोमेट्रिक आधार, संजय गांधी निराधार, श्रावणबाळ सेवा, इंदिरा गांधी निवृत्तीवेतन, ई-श्रम कामगार कार्ड, हस्तकला कारागीर कार्ड व शेतकरी समृद्धी योजनांचा तळागाळातील नागरिकांना थेट लाभ.', 'Comprehensive study and grassroots facilitation for Biometric Aadhaar, Sanjay Gandhi Niradhar, Shravanbal Seva, Indira Gandhi National Pension Schemes, e-Shram Card, Artisan Card, and Farmer Prosperity Schemes.', 'केंद्र व राज्य शासनाच्या विविध योजना तळागाळातील शेवटच्या घटकापर्यंत पोहोचाव्यात यासाठी आमची संस्था सर्व योजनांचा सखोल अभ्यास करून शेतकरी, कामगार, महिला, मुले व वृद्धांना थेट लाभ मिळवून देते.', 'Our organization conducts a thorough study of terms, eligibility, and documentation requirements to connect farmers, workers, women, children, and seniors directly with statutory government welfare schemes.', 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80', '1', '1', '1', NULL, 'संजय गांधी निराधार, श्रावणबाळ योजना', '0', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-3', 'श्रीकृष्ण संगीत प्रशिक्षण केंद्र व सांस्कृतिक कला संवर्धन उपक्रम', 'Shrikrishna Music Training Center & Cultural Arts Promotion', 'सामाजिक कल्याण', '२०२४-१२-१०', 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर', 'Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar', 'ग्रामीण भागातील उदयोन्मुख कलाकारांना प्रोत्साहन देण्यासाठी श्रीकृष्ण संगीत प्रशिक्षण केंद्राची स्थापना; गायन, वादन, नाट्य व लोककला कार्यक्रमांचे आयोजन.', 'Promoting Maharashtra’s rich cultural heritage and rural artists through the Shrikrishna Music Training Center, organizing vocal music, instrumental, drama, and folk art programs.', 'ग्रामीण मातीतील विविध कलाप्रकार आणि कलाकारांना व्यासपीठ व प्रोत्साहन देण्यासाठी संस्थेने नादरपूर येथे श्रीकृष्ण संगीत प्रशिक्षण केंद्र स्थापन केले आहे.', 'Through Shrikrushna Sanskrutik va Gramin Vikas Sanstha at Nadarpur, we continuously promote rural artists and cultural traditions by operating the Shrikrishna Music Training Center.', 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80', '0', '1', '1', NULL, 'संगीत विद्यालय, सांस्कृतिक संवर्धन', '0', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `initiatives` (`id`, `title_mr`, `title_en`, `category`, `activity_date`, `location_mr`, `location_en`, `summary_mr`, `summary_en`, `description_mr`, `description_en`, `image_url`, `is_govt_scheme`, `published`, `featured`, `related_report_id`, `tags`, `display_order`, `created_at`, `updated_at`) VALUES ('init-4', 'मोफत आरोग्य तपासणी, व्यसनमुक्ती, योग शिबिरे व कोविड-१९ अन्न सुरक्षा', 'Free Medical Camps, De-Addiction, Yoga & COVID-19 Food Relief', 'आरोग्यविषयक उपक्रम', '२०२४-११-२०', 'कन्नड व छत्रपती संभाजीनगर ग्रामीण विभाग', 'Kannad & Chhatrapati Sambhajinagar Rural Belt', '‘आरोग्य हीच खरी संपत्ती’ या ब्रीदवाक्यानुसार तज्ज्ञ डॉक्टरांमार्फत नेत्रतपासणी, रक्तदाब, मधुमेह, व्यसनमुक्ती व योग-प्राणायाम शिबिरे तसेच आपत्ती काळात अन्नधान्य वाटप.', 'Guided by \"Health is Wealth\", organizing expert eye check-ups, BP & sugar diagnostics, de-addiction & yoga-pranayama camps, alongside rural food distribution.', '‘आरोग्य हीच खरी संपत्ती’ हे ब्रीद मानून संस्थेमार्फत तज्ज्ञ डॉक्टरांच्या सहकार्याने डोळ्यांची तपासणी, रक्तदाब (BP), शुगर तपासणी, व्यसनमुक्ती शिबिरे आणि योग-प्राणायाम शिबिरे आयोजित केली जातात.', 'Our Sanstha organizes regular medical camps with expert doctors covering eye check-ups, blood pressure, diabetes screening, de-addiction counseling, and Yoga-Pranayama sessions.', 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80', '0', '1', '1', NULL, 'आरोग्य शिबीर, नेत्र व रक्तदाब तपासणी', '0', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

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


CREATE TABLE `login_attempts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempted_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ip_attempted` (`ip_address`,`attempted_at`),
  KEY `idx_user_attempted` (`username`,`attempted_at`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `media_files` (`id`, `file_name`, `original_name`, `file_path`, `file_type`, `mime_type`, `file_size_bytes`, `alt_text_mr`, `alt_text_en`, `uploaded_by`, `created_at`) VALUES ('31', 'off_5318adbc0d8ccb861810.jpg', 'savita_nikam_secretary.jpg', '/uploads/officials/off_5318adbc0d8ccb861810.jpg', 'image', 'image/jpeg', '1335389', '????? ????? ???? - ????', 'Savita Dilip Nikam - Secretary', '1', '2026-10-25 18:18:57');
INSERT INTO `media_files` (`id`, `file_name`, `original_name`, `file_path`, `file_type`, `mime_type`, `file_size_bytes`, `alt_text_mr`, `alt_text_en`, `uploaded_by`, `created_at`) VALUES ('32', 'off_1eb382bb07bfb9030a11.jpg', 'WIN_20260214_01_10_07_Pro.jpg', '/uploads/officials/off_1eb382bb07bfb9030a11.jpg', 'image', 'image/jpeg', '230194', '?????? ?????????', 'Webcam Photo', '1', '2026-10-25 18:18:57');

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

INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-1', 'श्रीमती सविता दिलीप निकम', 'Smt. Savita Dilip Nikam', 'सचिव व मुख्य प्रवर्तक', 'Secretary & Chief Promoter', 'ग्रामीण विकास, महिला सक्षमीकरण, CSC बाल विद्यालय व शासकीय योजनांच्या तळागाळातील अंमलबजावणीसाठी समर्पित नेतृत्व.', 'Dedicated leadership in rural development, women empowerment, CSC Bal Vidyalaya, and grassroots welfare scheme implementation.', NULL, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80', '1', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-2', 'श्री. दिलीप निकम', 'Shri. Dilip Nikam', 'अध्यक्ष व मार्गदर्शक', 'President & Mentor', 'नादरपूर व छत्रपती संभाजीनगर जिल्ह्यात शैक्षणिक, सांस्कृतिक, कृषी व सामाजिक उपक्रमांचे नियोजन व मार्गदर्शन.', 'Guiding educational, cultural, agricultural, and social development initiatives across Nadarpur and Chhatrapati Sambhajinagar.', NULL, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80', '2', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-3', 'श्री. राजेश पाटील', 'Shri. Rajesh Patil', 'उपाध्यक्ष', 'Vice President', 'पर्यावरण संवर्धन, औषधी वृक्षारोपण आणि शेतकरी कौशल्य विकास कार्यशाळांचे समन्वय.', 'Coordinating environmental conservation, medicinal tree plantation drives, and farmer skill workshops.', NULL, 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80', '3', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');
INSERT INTO `officials` (`id`, `name_mr`, `name_en`, `role_mr`, `role_en`, `bio_mr`, `bio_en`, `phone`, `image_url`, `display_order`, `published`, `created_at`, `updated_at`) VALUES ('off-4', 'श्रीमती अनिता देशमुख', 'Smt. Anita Deshmukh', 'कोषाध्यक्ष', 'Treasurer', 'महिला बचत गट, सूक्ष्म वित्त नियोजन आणि शालेय व्यवस्थापन समिती (SMC) समन्वय.', 'Leading women self-help groups, micro-savings initiatives, and School Management Committee (SMC) coordination.', NULL, 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80', '4', '1', '2026-10-20 16:45:01', '2026-10-20 16:45:01');

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
  `image_alt_mr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_alt_en` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `display_order` int NOT NULL DEFAULT '0',
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sections_page` (`page_slug`),
  KEY `idx_sections_lookup` (`page_slug`,`section_key`),
  KEY `idx_sections_order` (`display_order`),
  CONSTRAINT `fk_page_sections_page` FOREIGN KEY (`page_slug`) REFERENCES `site_pages` (`slug`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('1', 'about', 'intro_genesis', 'निष्पक्ष समाजकार्य, सांस्कृतिक संवर्धन आणि ग्रामीण स्वावलंबनाचा वसा', 'Non-Partisan Social Service, Cultural Preservation & Grassroots Empowerment', 'प्रस्तावना व पार्श्वभूमी', 'Introduction & Genesis', 'स्वातंत्र्यपूर्व काळात देशाचे संपूर्ण स्वातंत्र्य हे विविध संघटनांचे मुख्य ध्येय होते; परंतु स्वातंत्र्योत्तर काळात भ्रष्टाचार, बेरोजगारी, महिलांवरील अत्याचार, पर्यावरण व प्रदूषण, शेतकरी आत्महत्या, अनुसूचित जमातींचे प्रश्न तसेच वीज, पाणी, निवारा आणि शिक्षणाच्या गंभीर समस्या पुढे आल्या. कोणत्याही राजकीय, जातीय, धार्मिक किंवा वैचारिक वादात तटस्थ राहून व निस्वार्थ भावनेने लोककल्याणाचे कार्य करण्याच्या प्रेरणेतून नादरपूर (ता. कन्नड, जि. छत्रपती संभाजीनगर / औरंगाबाद, महाराष्ट्र) येथे ‘श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था’ स्थापन करण्यात आली.\n\nश्रीमती सविता दिलीप निकम (सचिव) यांच्या नेतृत्वाखाली समविचारी सामाजिक कार्यकर्त्यांनी एकत्र येऊन ही संस्था उभारली. सुरुवातीला कन्नड तालुक्यातील नादरपूर परिसरात सुरू झालेले कार्य पुढे छत्रपती संभाजीनगर जिल्ह्यातील विविध तालुक्यांत विस्तारले. लोकांच्या खऱ्या समस्या जाणून घेण्यासाठी संस्थेने विविध ग्रामपंचायती व गावांमध्ये ‘बेसलाईन अभ्यास’ (Baseline Studies) आणि स्थानिक समुदाय आधारित गटांशी (CBOs) समन्वय साधून कौशल्य विकास, शिक्षण, आरोग्य, उपजीविका आणि पर्यावरण संवर्धनाचे कार्य तळागाळात रुजवले आहे.', 'While pre-independence movements fought for national freedom, the post-independence era brought urgent challenges including unemployment, violence against women, environmental pollution, farmer distress, tribal welfare, and access to electricity, water, housing, and education. Maintaining strict neutrality across political, ethnic, religious, or ideological lines, Shrikrushna Sanskrutik va Gramin Vikas Sanstha was established at Nadarpur, Dist. Chhatrapati Sambhajinagar (Aurangabad), Maharashtra.\n\nPromoted under the leadership of Smt. Savita Dilip Nikam (Secretary) alongside dedicated social workers, our activities began in Kannad-Nadarpur Block and expanded across multiple blocks of Chhatrapati Sambhajinagar district. By conducting baseline studies across Gram Panchayats in consultation with local villagers and Community-Based Organizations (CBOs), we focus on village empowerment, skill development, education, healthcare, livelihood generation, and urgent civic assistance.', NULL, NULL, NULL, '0', '1', '2026-10-26 11:46:34');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('2', 'about', 'core_objective', 'संस्थेचे मुख्य उद्दिष्ट', 'Core Institutional Objective', 'ध्येय व कार्यप्रणाली', 'Objective & Methodology', 'नैसर्गिक व मानवनिर्मित आपत्तीग्रस्तांना मदत करणे, नागरिकांना त्यांच्या मूलभूत हक्कांची व पंचायत राज व्यवस्थेतील जबाबदाऱ्यांची जाणीव करून देणे, बेरोजगारांना रोजगाराच्या संधी उपलब्ध करून देणे आणि महिलांचा स्थानिक प्रशासनातील सहभाग वाढवणे.', 'Assisting victims of natural and man-made disasters, educating citizens on constitutional rights and Panchayati Raj responsibilities, generating employment through skill training, and elevating women in local governance.', NULL, NULL, NULL, '0', '1', '2026-10-26 11:46:34');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('3', 'about', 'future_roadmap', 'भविष्यातील संकल्पित प्रकल्प', 'Future Institutional Roadmap', 'दीर्घकालीन दृष्टीकोन', 'Long-term Vision', '• ग्रामीण मुलांसाठी आदर्श शाळा व शैक्षणिक संकुलांचा विस्तार\n• एकात्मिक कौशल्य प्रशिक्षण केंद्राची (Integrated Skill Training Center) उभारणी\n• ज्येष्ठ नागरिक अभ्यास व सुसज्ज वृद्धाश्रम (Old Age Home) व आधार केंद्र', '• Expansion of model rural schools and joyful learning centers\n• Development of an Integrated Skill Training Center for rural youth & farmers\n• Establishment of a dedicated Old Age Home and Gerontology care center', NULL, NULL, NULL, '0', '1', '2026-10-22 16:22:08');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('4', 'about', 'jurisdiction_nadarpur', 'नादरपूर, कन्नड व छत्रपती संभाजीनगर (औरंगाबाद)', 'Nadarpur, Kannad & Chhatrapati Sambhajinagar (Aurangabad)', 'जिल्हा व मुख्य कार्यक्षेत्र', 'District & Core Base', 'इ.स. १६१० मध्ये मलिक अंबरने वसवलेले हे ऐतिहासिक शहर पुढे औरंगाबाद (छत्रपती संभाजीनगर) म्हणून ओळखले गेले. बीबी का मकबरा, १९८३ मध्ये युनेस्को (UNESCO) जागतिक वारसा घोषित झालेली अजिंठा व वेरूळ लेणी, डॉ. बाबासाहेब आंबेडकर मराठवाडा विद्यापीठ (१९५८) आणि कलात्मक हिमरू शाल व पैठणी सिल्कसाठी हा जिल्हा जगप्रसिद्ध आहे. कन्नड तालुक्यातील नादरपूर येथून सुरू झालेले संस्थेचे कार्य जिल्ह्यातील विविध तालुक्यांत व ग्रामपंचायतींमध्ये विस्तारले आहे.', 'Originally founded as Khadki in 1610 by Malik Ambar, the district is home to Bibi Ka Maqbara, the UNESCO World Heritage Caves of Ajanta and Ellora (1983), Dr. Babasaheb Ambedkar Marathwada University (1958), and world-renowned artistic silk fabrics and shawls. Starting from Nadarpur in Kannad Block, our Sanstha extends across multiple blocks and Gram Panchayats in the district.', NULL, NULL, NULL, '0', '1', '2026-10-22 23:36:16');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('6', 'privacy', 'data_collection', '१. माहिती संकलन आणि वापर', '1. Information Collection & Usage', 'डेटा संकलन तत्वे', 'Data Collection Principles', 'श्रीकृष्ण संस्था ही ग्रामीण विकास, शिक्षण आणि सामाजिक कल्याणासाठी काम करणारी संस्था आहे. आमच्या संकेतस्थळावर भेट देणाऱ्या नागरिकांकडून कोणताही अनावश्यक डेटा गोळा केला जात नाही. केवळ संपर्क फॉर्मद्वारे नागरिकांनी स्वतःहून दिलेले नाव, संपर्क क्रमांक व संदेश हा केवळ त्यांच्या प्रश्नांची उत्तरे देण्यासाठी वापरला जातो.', 'ShriKrushna Sanstha solely collects personal information (such as name, phone number, and message) voluntarily submitted through our contact form. This information is exclusively utilized to respond to citizen inquiries, study room registrations, and welfare guidance requests.', NULL, NULL, NULL, '0', '1', '2026-10-22 16:01:56');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('7', 'privacy', 'zero_commercial', '२. व्यावसायिक वापरास पूर्ण मनाई', '2. Zero Commercialization Policy', 'डेटा सुरक्षा हमी', 'Data Security Guarantee', 'आम्ही कोणत्याही नागरिकाचा किंवा लाभार्थीचा वैयक्तिक डेटा, मोबाईल क्रमांक किंवा ईमेल पत्ता कोणत्याही व्यावसायिक संस्थेला, जाहिरातदाराला अथवा तृतीय पक्षाला विकत नाही किंवा हस्तांतरित करत नाही.', 'We strictly never sell, rent, commercialize, or lease citizen or beneficiary contact details to any third-party advertisers, financial institutions, or commercial entities.', NULL, NULL, NULL, '0', '1', '2026-10-22 16:01:58');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('8', 'privacy', 'beneficiary_dignity', '३. छायाचित्रे व लाभार्थी सन्मान (Beneficiary Dignity)', '3. Beneficiary Dignity & Photographic Consent', 'प्रतिष्ठा व गोपनीयता हक्क', 'Dignity & Privacy Rights', 'संस्थेच्या उपक्रमांमध्ये सहभागी होणारे विद्यार्थी, महिला, ज्येष्ठ नागरिक आणि वंचित बांधवांचा मान-सन्मान राखणे हे आमचे सर्वोच्च कर्तव्य आहे:\n\n• केवळ उपक्रमाच्या सार्वजनिक दस्तऐवजीकरणासाठी आवश्यक असलेली छायाचित्रे वापरली जातात.\n• कोणत्याही लाभार्थ्याचे दारिद्र्य किंवा असहाय्यतेचे अवमानकारक प्रदर्शन करण्यास सक्त मनाई आहे.\n• बालकांचे आणि शाळकरी विद्यार्थ्यांचे छायाचित्र घेताना स्थानिक शाळा किंवा पालकांची पूर्वपरवानगी विचारात घेतली जाते.\n• कोणत्याही लाभार्थ्याला आपले छायाचित्र संकेतस्थळावरून काढून घेण्याचा पूर्ण अधिकार आहे.', 'Safeguarding the dignity of rural youth, women, elders, and farming community members is our foremost institutional commitment:\n\n• Photographs are solely captured for authentic public activity documentation.\n• Sensationalized, undignified, or voyeuristic depictions of poverty or distress are strictly prohibited.\n• Parental or local school authority permission is honored when capturing student study sessions.\n• Any community participant possesses an absolute right to request the prompt removal of their photograph from our archives.', NULL, NULL, NULL, '0', '1', '2026-10-22 16:02:00');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('9', 'privacy', 'grievance_redressal', '४. तक्रार व निवारण', '4. Grievance Redressal', 'संपर्क व निराकरण', 'Contact & Resolution', 'गोपनीयता किंवा छायाचित्रांसंबंधी कोणतीही तक्रार असल्यास आपण आमच्या संपर्क पृष्ठावरून किंवा थेट कार्यालयात संपर्क साधू शकता.', 'For any privacy-related questions, photograph removal requests, or clarifications, please submit your notice via our Contact Form or visit our administrative office.', NULL, NULL, NULL, '0', '1', '2026-10-22 16:02:01');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('10', 'work', 'pillar_education', 'CSC बाल विद्यालय, मॉडेल लॅब व RTE २५%', 'CSC Bal Vidyalaya, Model Lab & RTE 25%', '१. शिक्षण व RTE अभियान', '1. Inclusive Education & RTE', 'खेळातून आनंददायी शिक्षण (Laugh, Play, Enjoy), अक्षर-अंक-आकार-रंग मॉडेल लॅब, ६०%-८०% शाळांत SMC मासिक बैठका व आर.टी.ई. मित्र अभियान.', 'Joyful game-based learning, Model Lab for Alphabets/Numbers/Shapes/Colors, monthly SMC meetings across 60%–80% schools, and RTE Friends.', NULL, NULL, NULL, '1', '1', '2026-10-22 14:31:09');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('11', 'work', 'pillar_schemes', 'शासकीय योजनांचा नागरिकांना थेट लाभ', 'Direct Benefit of Government Schemes', '४. शासकीय योजना जनजागृती', '2. Government Welfare Schemes', 'बायोमेट्रिक आधार, संजय गांधी निराधार, श्रावणबाळ, इंदिरा गांधी पेन्शन, ई-श्रम कार्ड, हस्तकला कारागीर कार्ड व शेतकरी समृद्धी योजना मार्गदर्शन.', 'Facilitating Biometric Aadhaar, Sanjay Gandhi Niradhar, Shravanbal, Indira Gandhi Pensions, e-Shram, Artisan Card, and Farmer Prosperity Schemes.', NULL, NULL, NULL, '4', '1', '2026-10-26 11:46:34');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('12', 'work', 'pillar_health', 'आरोग्य शिबिरे, योग व कोविड-१९ अन्न सुरक्षा', 'Medical Camps, Yoga & Food Security', '३. आरोग्य व अन्न सुरक्षा', '3. Healthcare & Food Security', '‘आरोग्य हीच खरी संपत्ती’ या ब्रीदाने तज्ज्ञ डॉक्टरांमार्फत नेत्र, रक्तदाब, शुगर तपासणी, व्यसनमुक्ती, योग-प्राणायाम व ग्रामीण अन्नधान्य वाटप.', 'Guided by \"Health is Wealth\", conducting Eye, BP, and Sugar check-ups, de-addiction & yoga camps, and rural food security distribution.', NULL, NULL, NULL, '3', '1', '2026-10-22 14:31:09');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('13', 'work', 'pillar_environment', 'पर्यावरण संवर्धन व औषधी वृक्षारोपण', 'Environment & Medicinal Plantation', '५. पर्यावरण व वृक्षारोपण', '4. Environment & Plantation', 'प्राणवायू, पर्जन्यमान संतुलन व मानसिक तणाव मुक्तीसाठी कोरफड, तुळस, कडुलिंब, आवळा व देवदार यांसारख्या औषधी व देशी वृक्षांची लागवड.', 'Planting medicinal & native trees (Aloe, Basil, Neem, Cedar, Ash) for oxygen balance, rainfall conservation, herbal remedies, and stress relief.', NULL, NULL, NULL, '5', '1', '2026-10-26 11:46:34');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('14', 'work', 'pillar_empowerment', 'महिला सक्षमीकरण, ज्येष्ठ नागरिक व शेतकरी कौशल्य', 'Women, Gerontology Care & Agri-Skills', '६. महिला, ज्येष्ठ नागरिक व शेतकरी', '5. Women, Elders & Farmers', 'महिलांचा पंचायत राज व निर्णय प्रक्रियेत सहभाग, सूक्ष्म बचत, ज्येष्ठ नागरिक कल्याण (Gerontology) आणि शेतकऱ्यांसाठी आधुनिक कृषी उद्योजकता कार्यशाळा.', 'Women’s Panchayat leadership & micro-savings, Gerontology elder care, and modern agri-tech & cottage industry training for smallholder farmers.', NULL, NULL, NULL, '6', '1', '2026-10-26 11:46:34');
INSERT INTO `page_sections` (`id`, `page_slug`, `section_key`, `title_mr`, `title_en`, `subtitle_mr`, `subtitle_en`, `content_mr`, `content_en`, `image_url`, `image_alt_mr`, `image_alt_en`, `display_order`, `is_published`, `updated_at`) VALUES ('15', 'work', 'pillar_culture', 'श्रीकृष्ण संगीत केंद्र व सांस्कृतिक कला संवर्धन', 'Shrikrishna Music Center & Cultural Arts', '२. संस्कृती व कला संवर्धन', '6. Cultural Heritage & Arts', 'नादरपूर येथे श्रीकृष्ण संगीत प्रशिक्षण केंद्राद्वारे गायन, वादन, नाट्य व ग्रामीण लोककलाकारांना प्रोत्साहन आणि आपत्ती काळात निस्वार्थ समाजसेवा.', 'Promoting rural artists and traditional arts through Shrikrishna Music Training Center (music, drama, singing) and disaster relief.', NULL, NULL, NULL, '2', '1', '2026-10-26 11:46:34');

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

INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`, `updated_at`) VALUES ('about', 'संस्थेविषयी परिचय व ध्येय', 'About Sanstha & Mission', 'श्रीकृष्ण संस्थेची अधिकृत माहिती व उद्दिष्टे.', 'Official details and objectives of Shrikrushna Sanstha.', '1', '2026-10-20 23:41:48');
INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`, `updated_at`) VALUES ('home', 'मुख्यपृष्ठ', 'Home', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था मुख्यपृष्ठ', 'Shrikrushna Sanstha Official Homepage', '1', '2026-10-22 14:31:09');
INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`, `updated_at`) VALUES ('privacy', 'गोपनीयता धोरण', 'Privacy Policy', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेचे अधिकृत गोपनीयता धोरण.', 'Official privacy policy and personal data protection principles.', '1', '2026-10-20 16:45:02');
INSERT INTO `site_pages` (`slug`, `title_mr`, `title_en`, `meta_description_mr`, `meta_description_en`, `is_published`, `updated_at`) VALUES ('work', 'कार्यक्षेत्र व सामाजिक उपक्रम', 'Working Areas & Impact', 'नादरपूर, कन्नड व छत्रपती संभाजीनगर जिल्ह्यातील सामाजिक व शैक्षणिक कार्यक्षेत्र.', 'Core working areas and community development impact across rural Maharashtra.', '1', '2026-10-20 16:45:02');

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

INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('hero_badge', 'hero', 'ग्रामीण परिवर्तन आणि लोककल्याण', 'Rural Transformation & Public Welfare', 'Badge on top of homepage hero banner', '2026-10-21 13:38:26');
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('hero_stats_beneficiaries', 'hero', '५०००+ नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच', '5000+ Citizens & Students Reached', 'Key statistical metric for homepage', '2026-10-20 16:45:02');
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('hero_stats_villages', 'hero', '२5+ ग्रामपंचायतींमध्ये थेट उपक्रम विस्तार', '25+ Gram Panchayats Covered', 'Total covered villages count', '2026-10-20 23:56:57');
INSERT INTO `site_settings` (`key_name`, `category`, `value_mr`, `value_en`, `description`, `updated_at`) VALUES ('sanstha_tagline', 'general', 'ग्रामीण भागातील शिक्षण, सांस्कृतिक संवर्धन, आरोग्य व सामाजिक विकासासाठी कटिबद्ध', 'Committed to rural education, cultural heritage, healthcare, and social empowerment', 'Official motto / tagline', '2026-10-20 16:45:02');

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

INSERT INTO `videos` (`id`, `title_mr`, `title_en`, `description_mr`, `description_en`, `category`, `duration_seconds`, `duration_formatted`, `duration_formatted_en`, `thumbnail_url`, `video_url`, `publish_date`, `related_activity_title`, `display_order`, `published`, `featured`, `created_at`, `updated_at`) VALUES ('vid-1792958508821', 'music', 'music', 'music', 'music', 'शिक्षण', '180', '०३:००', '03:00', 'https://i.ytimg.com/vi/ReuriohyHg0/hqdefault.jpg', 'https://youtu.be/ReuriohyHg0?si=CFWTGEkpfodzmVXM', '2026-10-25', NULL, '0', '1', '0', '2026-10-26 01:31:48', '2026-10-26 01:31:48');

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
