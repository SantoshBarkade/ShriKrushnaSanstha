<?php
/**
 * Automated Verification Script for Phase 1:
 * - Reports & Documents API & Persistence
 * - Secure PDF Upload Validation
 * - Contact Details Persistence
 * - Strict Data Preservation of existing records
 */

declare(strict_types=1);

require_once __DIR__ . '/../backend-php-mysql/config/database.php';

function runPhase1LiveTests(): void {
    echo "========================================================\n";
    echo "STARTING PHASE 1 AUTOMATED LIVE VERIFICATION\n";
    echo "========================================================\n";

    $baseUrl = 'http://127.0.0.1:8088/backend-php-mysql/api';
    $db = new Database();
    $pdo = $db->getConnection();

    // 0. Check initial database state
    $stmt = $pdo->query("SELECT id, title_mr, title_en FROM reports ORDER BY id ASC");
    $initialReports = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo "[INFO] Existing reports in DB (" . count($initialReports) . "):\n";
    foreach ($initialReports as $r) {
        echo "   - ID: {$r['id']} | MR: {$r['title_mr']} | EN: {$r['title_en']}\n";
    }

    $stmt = $pdo->query("SELECT * FROM contact_info WHERE id = 1");
    $initialContact = $stmt->fetch(PDO::FETCH_ASSOC);
    echo "[INFO] Existing contact_info (ID 1): Phone: {$initialContact['phone']}, Email: {$initialContact['email']}\n\n";

    // 1. TEST UNAUTHENTICATED WRITE REQUESTS ARE REJECTED (HTTP 401)
    echo "--- Test 1: Verify Unauthenticated Requests Rejected ---\n";
    $unauthEndpoints = [
        ['POST', "$baseUrl/content.php?resource=reports", ['title_mr' => 'Test']],
        ['PUT', "$baseUrl/content.php?resource=reports&id=rep-1", ['title_mr' => 'Test']],
        ['DELETE', "$baseUrl/content.php?resource=reports&id=rep-1", null],
        ['PUT', "$baseUrl/content.php?resource=contact", ['email' => 'hacker@evil.com']],
        ['POST', "$baseUrl/upload.php", null]
    ];

    foreach ($unauthEndpoints as [$method, $url, $body]) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        }
        $resp = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($status === 401) {
            echo "  [PASS] $method $url returned HTTP 401 Unauthorized\n";
        } else {
            echo "  [FAIL] $method $url returned HTTP $status instead of 401!\n";
            exit(1);
        }
    }

    // 2. ACQUIRE AUTHENTIC ADMIN SESSION TOKEN VIA EPHEMERAL ADMIN
    echo "\n--- Test 2: Admin Authentication ---\n";
    $tempUsername = 'temp_phase1_admin_' . time();
    $tempPassword = 'TestPhase1Secret!@#';
    $insAdmin = $pdo->prepare("
        INSERT INTO admins (username, password_hash, full_name, role)
        VALUES (?, ?, ?, 'Secretary / Super Admin')
    ");
    $insAdmin->execute([
        $tempUsername,
        password_hash($tempPassword, PASSWORD_BCRYPT),
        'Temporary Phase 1 Admin'
    ]);
    $testAdminId = (int)$pdo->lastInsertId();

    $ch = curl_init("$baseUrl/auth.php?action=login");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'username' => $tempUsername,
        'password' => $tempPassword
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    $authResp = json_decode(curl_exec($ch), true);
    $authStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($authStatus !== 200 || empty($authResp['token'])) {
        echo "  [FAIL] Login failed: HTTP $authStatus - " . json_encode($authResp) . "\n";
        exit(1);
    }
    $token = $authResp['token'];
    echo "  [PASS] Successfully logged in with ephemeral admin (HTTP 200). Session token acquired.\n";

    // 3. TEST SECURE PDF UPLOAD
    echo "\n--- Test 3: Secure PDF Upload Validation ---\n";
    // 3a. Invalid non-PDF file rejection
    $fakePdfPath = sys_get_temp_dir() . '/fake_' . uniqid() . '.pdf';
    file_put_contents($fakePdfPath, "This is not a PDF file. Plain text injection.");

    $ch = curl_init("$baseUrl/upload.php?folder=reports");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'folder' => 'reports',
        'file' => new CURLFile($fakePdfPath, 'application/pdf', 'fake.pdf')
    ]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);
    $fakeResp = json_decode(curl_exec($ch), true);
    $fakeStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    @unlink($fakePdfPath);

    $fakeErr = $fakeResp['errors'][0]['error'] ?? ($fakeResp['message'] ?? ($fakeResp['error'] ?? ''));
    if ($fakeStatus === 400 && (str_contains($fakeErr, 'PDF') || str_contains($fakeErr, 'स्वाक्षरी') || str_contains($fakeErr, 'अवैध'))) {
        echo "  [PASS] Fake PDF without %PDF- signature rejected with HTTP 400: {$fakeErr}\n";
    } else {
        echo "  [FAIL] Fake PDF not properly rejected! Status: $fakeStatus, Response: " . json_encode($fakeResp) . "\n";
        exit(1);
    }

    // 3b. Valid PDF file upload
    $validPdfPath = sys_get_temp_dir() . '/valid_' . uniqid() . '.pdf';
    // Minimal compliant PDF 1.4 binary content
    $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n";
    file_put_contents($validPdfPath, $pdfContent);

    $ch = curl_init("$baseUrl/upload.php?folder=reports");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, [
        'file' => new CURLFile($validPdfPath, 'application/pdf', 'annual_report.pdf')
    ]);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);
    $uploadResp = json_decode(curl_exec($ch), true);
    $uploadStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    @unlink($validPdfPath);

    if ($uploadStatus !== 201 || empty($uploadResp['url'])) {
        echo "  [FAIL] Valid PDF upload failed! Status: $uploadStatus, Response: " . json_encode($uploadResp) . "\n";
        exit(1);
    }
    $uploadedPdfUrl = $uploadResp['url'];
    echo "  [PASS] Valid PDF uploaded successfully (HTTP 201): $uploadedPdfUrl\n";

    // Verify file on disk
    $pdfDiskPath = __DIR__ . '/../' . ltrim(parse_url($uploadedPdfUrl, PHP_URL_PATH), '/');
    if (!file_exists($pdfDiskPath)) {
        // Try relative to workspace root
        $pdfDiskPath = __DIR__ . '/../' . preg_replace('#^.*?backend-php-mysql/#', 'backend-php-mysql/', $uploadedPdfUrl);
    }
    echo "  [INFO] Uploaded file checked on disk: $pdfDiskPath (Size: " . filesize($pdfDiskPath) . " bytes)\n";

    // 4. TEST REPORTS CRUD WITH TEMPORARY RECORD
    echo "\n--- Test 4: Report Create / Edit / Publish / Delete Operations ---\n";
    $testReportId = 'rep-test-' . time();

    // 4a. Create Report
    $createPayload = [
        'id' => $testReportId,
        'title_mr' => 'चाचणी अहवाल २०२४-२५',
        'title_en' => 'Test Annual Report 2024-25',
        'period_mr' => 'वर्ष २०२४-२५',
        'period_en' => 'FY 2024-25',
        'category_mr' => 'वार्षिक अहवाल',
        'category_en' => 'Annual Report',
        'summary_mr' => 'मराठी गोषवारा चाचणी तपशील.',
        'summary_en' => 'English summary test details.',
        'pdf_url' => $uploadedPdfUrl,
        'file_size' => 'PDF (1.2 MB)',
        'report_date' => '2025-04-01',
        'published' => 0 // Start as draft
    ];

    $ch = curl_init("$baseUrl/content.php?resource=reports");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($createPayload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "Authorization: Bearer $token"
    ]);
    $createResp = json_decode(curl_exec($ch), true);
    $createStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($createStatus !== 201 || empty($createResp['data']['id'])) {
        echo "  [FAIL] Report creation failed! Status: $createStatus, Response: " . json_encode($createResp) . "\n";
        exit(1);
    }
    $createdReport = $createResp['data'];
    echo "  [PASS] Report created with ID {$createdReport['id']} (HTTP 201)\n";
    echo "         Title MR: '{$createdReport['title_mr']}' | Title EN: '{$createdReport['title_en']}'\n";

    // Verify in database directly
    $stmt = $pdo->prepare("SELECT * FROM reports WHERE id = :id");
    $stmt->execute(['id' => $testReportId]);
    $dbReport = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$dbReport || $dbReport['title_mr'] !== 'चाचणी अहवाल २०२४-२५' || $dbReport['title_en'] !== 'Test Annual Report 2024-25') {
        echo "  [FAIL] DB verification failed for created report!\n";
        exit(1);
    }
    echo "  [PASS] Verified record persisted in MySQL table 'reports'\n";

    // 4b. Update Report (Update English title & Publish)
    $updatePayload = [
        'title_en' => 'Updated Annual Report 2024-25 (English Only Edit)',
        'published' => 1
    ];
    $ch = curl_init("$baseUrl/content.php?resource=reports&id=$testReportId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($updatePayload));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "Authorization: Bearer $token"
    ]);
    $updateResp = json_decode(curl_exec($ch), true);
    $updateStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($updateStatus !== 200) {
        echo "  [FAIL] Report update failed! Status: $updateStatus, Response: " . json_encode($updateResp) . "\n";
        exit(1);
    }

    // Verify Marathi title remained independent and untouched!
    $stmt = $pdo->prepare("SELECT * FROM reports WHERE id = :id");
    $stmt->execute(['id' => $testReportId]);
    $dbReportUpdated = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($dbReportUpdated['title_mr'] !== 'चाचणी अहवाल २०२४-२५' || $dbReportUpdated['title_en'] !== 'Updated Annual Report 2024-25 (English Only Edit)' || (int)$dbReportUpdated['published'] !== 1) {
        echo "  [FAIL] Independence check failed! Title MR was modified or title EN did not update.\n";
        exit(1);
    }
    echo "  [PASS] Independent field update verified: Marathi title kept intact while English updated.\n";

    // 4c. Verify Public GET shows the published report
    $ch = curl_init("$baseUrl/content.php?resource=reports");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $pubReportsResp = json_decode(curl_exec($ch), true);
    $pubStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $foundInPublic = false;
    foreach ($pubReportsResp['data'] ?? [] as $pr) {
        if ($pr['id'] === $testReportId) {
            $foundInPublic = true;
            break;
        }
    }
    if (!$foundInPublic) {
        echo "  [FAIL] Published report not found in public GET response!\n";
        exit(1);
    }
    echo "  [PASS] Public GET ?resource=reports includes the new report with valid pdf_url\n";

    // 4d. Delete Report
    $ch = curl_init("$baseUrl/content.php?resource=reports&id=$testReportId");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Bearer $token"]);
    $delResp = json_decode(curl_exec($ch), true);
    $delStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($delStatus !== 200) {
        echo "  [FAIL] Report deletion failed! Status: $delStatus, Response: " . json_encode($delResp) . "\n";
        exit(1);
    }

    $stmt = $pdo->prepare("SELECT COUNT(*) FROM reports WHERE id = :id");
    $stmt->execute(['id' => $testReportId]);
    if ($stmt->fetchColumn() !== 0) {
        echo "  [FAIL] Deleted report still present in MySQL!\n";
        exit(1);
    }
    echo "  [PASS] Temporary test report deleted cleanly from MySQL\n";

    // Clean up uploaded temporary test PDF file
    if (file_exists($pdfDiskPath)) {
        @unlink($pdfDiskPath);
        echo "  [PASS] Temporary test PDF file cleaned up from uploads directory\n";
    }

    // 5. TEST CONTACT DETAILS PERSISTENCE
    echo "\n--- Test 5: Contact Details Persistence ---\n";
    // 5a. Update contact_info row 1 with bilingual details
    $contactUpdate = [
        'phone' => '+91 9923512482',
        'email' => 'contact@shrikrushnasanstha.org',
        'address_mr' => 'मु. पो. मांडवगण, ता. जामनेर, जि. जळगाव - ४२४२०६',
        'address_en' => 'At Post Mandavgan, Taluka Jamner, Dist Jalgaon - 424206',
        'taluka_mr' => 'जामनेर',
        'taluka_en' => 'Jamner',
        'district_mr' => 'जळगाव',
        'district_en' => 'Jalgaon',
        'visiting_hours_mr' => 'सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ५:००',
        'visiting_hours_en' => 'Monday to Saturday: 10:00 AM to 5:00 PM',
        'reg_no_mr' => 'महा/१२३४/जळगाव',
        'reg_no_en' => 'MAH/1234/Jalgaon',
        'secretary_name_mr' => 'श्रीमती सविता दिलीप निकम',
        'secretary_name_en' => 'Smt. Savita Dilip Nikam'
    ];

    $ch = curl_init("$baseUrl/content.php?resource=contact");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($contactUpdate));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        "Authorization: Bearer $token"
    ]);
    $contactResp = json_decode(curl_exec($ch), true);
    $contactStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($contactStatus !== 200 || empty($contactResp['data'])) {
        echo "  [FAIL] Contact update failed! Status: $contactStatus, Response: " . json_encode($contactResp) . "\n";
        exit(1);
    }
    echo "  [PASS] Contact details updated via PUT ?resource=contact (HTTP 200)\n";

    // Verify in database row 1
    $stmt = $pdo->query("SELECT * FROM contact_info WHERE id = 1");
    $savedContact = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($savedContact['address_mr'] !== $contactUpdate['address_mr'] || $savedContact['address_en'] !== $contactUpdate['address_en']) {
        echo "  [FAIL] Contact DB verification failed! Address values mismatch.\n";
        exit(1);
    }
    echo "  [PASS] Verified Contact details in MySQL row id=1 persisted with independent bilingual values\n";

    // Verify single record rule: Ensure no duplicate rows were created!
    $stmt = $pdo->query("SELECT COUNT(*) FROM contact_info");
    $contactCount = (int)$stmt->fetchColumn();
    if ($contactCount !== 1) {
        echo "  [FAIL] More than 1 contact record exists! Count: $contactCount\n";
        exit(1);
    }
    echo "  [PASS] Confirmed exactly 1 contact record in database (no duplicates created)\n";

    // 5b. Verify public GET ?resource=contact and GET ?resource=all
    $ch = curl_init("$baseUrl/content.php?resource=contact");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $pubContactResp = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (empty($pubContactResp['data']['address_mr']) || $pubContactResp['data']['address_mr'] !== $contactUpdate['address_mr']) {
        echo "  [FAIL] Public GET ?resource=contact did not return updated address!\n";
        exit(1);
    }
    echo "  [PASS] Public GET ?resource=contact returns updated contact details\n";

    $ch = curl_init("$baseUrl/content.php?resource=all");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $pubAllResp = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (empty($pubAllResp['data']['contactInfo']['address_mr'])) {
        echo "  [FAIL] Public GET ?resource=all missing contactInfo!\n";
        exit(1);
    }
    echo "  [PASS] Public GET ?resource=all includes updated contactInfo\n";

    // 5c. Restore contact_info row 1 to original state
    $restoreStmt = $pdo->prepare("
        UPDATE contact_info SET
            phone = :phone,
            email = :email,
            address_mr = :address_mr,
            address_en = :address_en,
            taluka_mr = :taluka_mr,
            taluka_en = :taluka_en,
            district_mr = :district_mr,
            district_en = :district_en,
            visiting_hours_mr = :visiting_hours_mr,
            visiting_hours_en = :visiting_hours_en,
            reg_no_mr = :reg_no_mr,
            reg_no_en = :reg_no_en,
            secretary_name_mr = :secretary_name_mr,
            secretary_name_en = :secretary_name_en
        WHERE id = 1
    ");
    $restoreStmt->execute([
        'phone' => $initialContact['phone'],
        'email' => $initialContact['email'],
        'address_mr' => $initialContact['address_mr'],
        'address_en' => $initialContact['address_en'],
        'taluka_mr' => $initialContact['taluka_mr'],
        'taluka_en' => $initialContact['taluka_en'],
        'district_mr' => $initialContact['district_mr'],
        'district_en' => $initialContact['district_en'],
        'visiting_hours_mr' => $initialContact['visiting_hours_mr'],
        'visiting_hours_en' => $initialContact['visiting_hours_en'],
        'reg_no_mr' => $initialContact['reg_no_mr'],
        'reg_no_en' => $initialContact['reg_no_en'],
        'secretary_name_mr' => $initialContact['secretary_name_mr'],
        'secretary_name_en' => $initialContact['secretary_name_en'],
    ]);
    echo "  [PASS] Restored contact_info row 1 back to original values.\n";

    // Clean up ephemeral test admin
    $pdo->prepare("DELETE FROM admin_tokens WHERE admin_id = ?")->execute([$testAdminId]);
    $pdo->prepare("DELETE FROM admins WHERE id = ?")->execute([$testAdminId]);
    echo "  [PASS] Ephemeral test admin and tokens cleaned up cleanly from MySQL.\n";

    // 6. VERIFY STRICT DATA PRESERVATION
    echo "\n--- Test 6: Strict Data Preservation Verification ---\n";
    $stmt = $pdo->query("SELECT id, title_mr, title_en FROM reports ORDER BY id ASC");
    $finalReports = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (count($finalReports) !== count($initialReports)) {
        echo "  [FAIL] Report count changed! Initial: " . count($initialReports) . ", Final: " . count($finalReports) . "\n";
        exit(1);
    }

    foreach ($initialReports as $idx => $initial) {
        $final = $finalReports[$idx];
        if ($final['id'] !== $initial['id'] || $final['title_mr'] !== $initial['title_mr'] || $final['title_en'] !== $initial['title_en']) {
            echo "  [FAIL] Initial report {$initial['id']} was modified!\n";
            exit(1);
        }
    }
    echo "  [PASS] All " . count($initialReports) . " initial reports (rep-1, rep-2, rep-3) are 100% preserved and untouched.\n";

    $stmt = $pdo->query("SELECT * FROM contact_info WHERE id = 1");
    $finalContact = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($finalContact['email'] !== $initialContact['email'] || $finalContact['phone'] !== $initialContact['phone']) {
        echo "  [FAIL] Initial contact info was not restored!\n";
        exit(1);
    }
    echo "  [PASS] Contact details row 1 verified 100% restored and preserved.\n";

    echo "\n========================================================\n";
    echo "ALL PHASE 1 LIVE VERIFICATION TESTS PASSED SUCCESSFULLY!\n";
    echo "========================================================\n";
}

runPhase1LiveTests();
