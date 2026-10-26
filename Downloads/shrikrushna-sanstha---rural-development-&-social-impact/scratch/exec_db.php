<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$action = $argv[1] ?? '';

if ($action === 'get_settings') {
    $rows = $db->query("SELECT key_name, value_mr, value_en FROM site_settings WHERE key_name IN ('hero_badge', 'sanstha_tagline', 'hero_stats_beneficiaries', 'hero_stats_villages')")->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($rows, JSON_UNESCAPED_UNICODE);
} elseif ($action === 'get_identity_section') {
    $row = $db->query("SELECT id, page_slug, section_key, title_mr, title_en, is_published FROM page_sections WHERE page_slug = 'home' AND section_key = 'identity'")->fetch(PDO::FETCH_ASSOC);
    echo json_encode($row ?: null, JSON_UNESCAPED_UNICODE);
} elseif ($action === 'count_home_sections') {
    $c = $db->query("SELECT COUNT(*) FROM page_sections WHERE page_slug = 'home'")->fetchColumn();
    echo json_encode((int)$c);
} elseif ($action === 'clean_home_test_sections') {
    $db->query("DELETE FROM page_sections WHERE page_slug = 'home'");
    echo json_encode(['cleaned' => true]);
} elseif ($action === 'create_test_announcement') {
    $id = $argv[2];
    $stmt = $db->prepare("INSERT INTO announcements (id, title_mr, title_en, event_date_mr, event_date_en, category, summary_mr, summary_en, content_mr, content_en, published, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, -99)");
    $stmt->execute([
        $id,
        "नवीन शेतकरी मार्गदर्शन शिबीर २०२६",
        "New Farmers Guidance Workshop 2026",
        "१५ नोव्हेंबर २०२६",
        "15 Nov 2026",
        "कृषी विकास",
        "शेतकऱ्यांसाठी आधुनिक सेंद्रिय शेती तंत्रज्ञान कार्यशाळा.",
        "Modern organic farming workshop for rural farmers.",
        "शेतकऱ्यांसाठी सेंद्रिय शेती कार्यशाळेचे सविस्तर वृत्त आणि मार्गदर्शक सूचना.",
        "Detailed report and guidelines for modern organic farming workshop."
    ]);
    echo json_encode(['created' => true]);
} elseif ($action === 'delete_test_announcement') {
    $id = $argv[2];
    $stmt = $db->prepare("DELETE FROM announcements WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['deleted' => true]);
} elseif ($action === 'create_test_video') {
    $id = $argv[2];
    $stmt = $db->prepare("INSERT INTO videos (id, title_mr, title_en, description_mr, description_en, category, duration_seconds, duration_formatted, duration_formatted_en, thumbnail_url, video_url, publish_date, published, featured, display_order) VALUES (?, ?, ?, ?, ?, 'माहितीपट', 240, '०४:००', '04:00', '/sanstha-building-art.jpg', ?, '२०२६-०३-१५', 1, 1, -99)");
    $stmt->execute([
        $id,
        "श्रीकृष्ण ग्रामीण विकास माहितीपट २०२६",
        "Shrikrushna Rural Progress Documentary 2026",
        "संस्थेच्या ग्रामीण विकासाचा प्रेरणादायी माहितीपट.",
        "Inspirational documentary on rural empowerment.",
        "https://youtu.be/ReuriohyHg0"
    ]);
    echo json_encode(['created' => true]);
} elseif ($action === 'delete_test_video') {
    $id = $argv[2];
    $stmt = $db->prepare("DELETE FROM videos WHERE id = ?");
    $stmt->execute([$id]);
    echo json_encode(['deleted' => true]);
} elseif ($action === 'update_contact_test') {
    $stmt = $db->prepare("UPDATE contact_info SET reg_no_mr = ?, reg_no_en = ? WHERE id = 1");
    $stmt->execute(["रजि. नं.: एक 14668 (चाचणी)", "Reg. No.: Ek 14668 (Test)"]);
    echo json_encode(['updated' => true]);
} elseif ($action === 'restore_contact_baseline') {
    $stmt = $db->prepare("UPDATE contact_info SET reg_no_mr = ?, reg_no_en = ? WHERE id = 1");
    $stmt->execute(["रजि. नं.: एक 14668 (औ)", "Reg. No.: Ek 14668 (A)"]);
    echo json_encode(['restored' => true]);
} elseif ($action === 'restore_settings_baseline') {
    $db->query("UPDATE site_settings SET value_mr = 'ग्रामीण परिवर्तन आणि लोककल्याण', value_en = 'Rural Transformation & Public Welfare' WHERE key_name = 'hero_badge'");
    $db->query("UPDATE site_settings SET value_mr = 'ग्रामीण भागातील शिक्षण, सांस्कृतिक संवर्धन, आरोग्य व सामाजिक विकासासाठी कटिबद्ध', value_en = 'Committed to rural education, cultural heritage, healthcare, and social empowerment' WHERE key_name = 'sanstha_tagline'");
    echo json_encode(['restored' => true]);
} elseif ($action === 'restore_page_seo_baseline') {
    $db->query("UPDATE site_pages SET title_mr = 'मुख्यपृष्ठ', title_en = 'Home', meta_description_mr = 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था मुख्यपृष्ठ', meta_description_en = 'Shrikrushna Sanstha Official Homepage' WHERE slug = 'home'");
    echo json_encode(['restored' => true]);
} elseif ($action === 'check_integrity') {
    $homeSections = (int)$db->query("SELECT COUNT(*) FROM page_sections WHERE page_slug = 'home'")->fetchColumn();
    $testAnn = (int)$db->query("SELECT COUNT(*) FROM announcements WHERE id LIKE 'ann-test-%'")->fetchColumn();
    $testVid = (int)$db->query("SELECT COUNT(*) FROM videos WHERE id LIKE 'vid-test-%'")->fetchColumn();
    $totalSettings = (int)$db->query("SELECT COUNT(*) FROM site_settings")->fetchColumn();
    $contact = $db->query("SELECT reg_no_mr, reg_no_en FROM contact_info WHERE id = 1")->fetch(PDO::FETCH_ASSOC);
    $homePage = $db->query("SELECT title_mr, title_en, meta_description_mr FROM site_pages WHERE slug = 'home'")->fetch(PDO::FETCH_ASSOC);
    echo json_encode([
        'cleanHomeSectionsCount' => $homeSections,
        'cleanAnnouncementsCount' => $testAnn,
        'cleanVideosCount' => $testVid,
        'totalSettingsCount' => $totalSettings,
        'contactRestored' => $contact['reg_no_mr'] === 'रजि. नं.: एक 14668 (औ)',
        'homePageRestored' => $homePage['title_mr'] === 'मुख्यपृष्ठ'
    ], JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['error' => 'UNKNOWN_ACTION']);
}
