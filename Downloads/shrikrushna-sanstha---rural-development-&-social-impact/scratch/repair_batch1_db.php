<?php
/**
 * Repair script for DEF-002 and DEF-003
 * Strips accidental @@@@ and ############ prefixes from page_sections
 * and corrects work pillar subtitles for DEF-010 in MySQL
 */
$pdo = new PDO('mysql:host=127.0.0.1;dbname=shrikrushnasanstha2', 'root', 'Jagdamba@558');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// 1. Fix DEF-002: page_slug='about', section_key='intro_genesis'
$stmt = $pdo->prepare("SELECT id, content_mr FROM page_sections WHERE page_slug = 'about' AND section_key = 'intro_genesis'");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row) {
    $cleaned = ltrim($row['content_mr'], "@ \t\n\r\0\x0B");
    $upd = $pdo->prepare("UPDATE page_sections SET content_mr = ? WHERE id = ?");
    $upd->execute([$cleaned, $row['id']]);
    echo "DEF-002 FIXED: Row id {$row['id']} cleaned. Starts with: " . mb_substr($cleaned, 0, 40) . "...\n";
}

// 2. Fix DEF-003: page_slug='about', section_key='core_objective'
$stmt = $pdo->prepare("SELECT id, content_mr FROM page_sections WHERE page_slug = 'about' AND section_key = 'core_objective'");
$stmt->execute();
$row = $stmt->fetch(PDO::FETCH_ASSOC);
if ($row) {
    $cleaned = ltrim($row['content_mr'], "# \t\n\r\0\x0B");
    $upd = $pdo->prepare("UPDATE page_sections SET content_mr = ? WHERE id = ?");
    $upd->execute([$cleaned, $row['id']]);
    echo "DEF-003 FIXED: Row id {$row['id']} cleaned. Starts with: " . mb_substr($cleaned, 0, 40) . "...\n";
}

// 3. Fix DEF-010 in MySQL page_sections for work pillars to align with standard sequence
$updates = [
    'pillar_culture' => ['subtitle_mr' => '२. संस्कृती व कला संवर्धन', 'order' => 2],
    'pillar_health' => ['subtitle_mr' => '३. आरोग्य व अन्न सुरक्षा', 'order' => 3],
    'pillar_schemes' => ['subtitle_mr' => '४. शासकीय योजना जनजागृती', 'order' => 4],
    'pillar_environment' => ['subtitle_mr' => '५. पर्यावरण व वृक्षारोपण', 'order' => 5],
    'pillar_empowerment' => ['subtitle_mr' => '६. महिला, ज्येष्ठ नागरिक व शेतकरी', 'order' => 6],
];

foreach ($updates as $key => $data) {
    $upd = $pdo->prepare("UPDATE page_sections SET subtitle_mr = ?, display_order = ? WHERE page_slug = 'work' AND section_key = ?");
    $upd->execute([$data['subtitle_mr'], $data['order'], $key]);
    echo "DEF-010 DB UPDATED: {$key} => {$data['subtitle_mr']}\n";
}

echo "Database updates complete.\n";
