<?php
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();

echo "Checking existing active media files...\n";

$activeFiles = [
    [
        'file_name' => 'off_5318adbc0d8ccb861810.jpg',
        'original_name' => 'savita_nikam_secretary.jpg',
        'file_path' => '/backend-php-mysql/uploads/officials/off_5318adbc0d8ccb861810.jpg',
        'file_type' => 'image',
        'mime_type' => 'image/jpeg',
        'alt_text_mr' => 'श्रीमती सविता दिलीप निकम - सचिव',
        'alt_text_en' => 'Smt. Savita Dilip Nikam - Secretary',
    ],
    [
        'file_name' => 'init_6e771ae292fc069a5843.jpg',
        'original_name' => 'csc_bal_vidyalaya_nadarpur.jpg',
        'file_path' => '/backend-php-mysql/uploads/initiatives/init_6e771ae292fc069a5843.jpg',
        'file_type' => 'image',
        'mime_type' => 'image/jpeg',
        'alt_text_mr' => 'CSC बाल विद्यालय उपक्रम',
        'alt_text_en' => 'CSC Bal Vidyalaya Initiative',
    ],
    [
        'file_name' => 'gal_13778007a274fb8be581.jpg',
        'original_name' => 'tree_plantation_drive.jpg',
        'file_path' => '/backend-php-mysql/uploads/gallery/gal_13778007a274fb8be581.jpg',
        'file_type' => 'image',
        'mime_type' => 'image/jpeg',
        'alt_text_mr' => 'वृक्षारोपण उपक्रम छायाचित्र',
        'alt_text_en' => 'Tree plantation drive photo',
    ],
    [
        'file_name' => 'evt_9ef1215b0213b3eef00c.jpg',
        'original_name' => 'event_tree_plantation.jpg',
        'file_path' => '/backend-php-mysql/uploads/events/evt_9ef1215b0213b3eef00c.jpg',
        'file_type' => 'image',
        'mime_type' => 'image/jpeg',
        'alt_text_mr' => 'वृक्षारोपण कार्यक्रम कव्हर फोटो',
        'alt_text_en' => 'Tree plantation event cover photo',
    ],
    [
        'file_name' => 'rep_77ff8f4f22ae13702a0a.pdf',
        'original_name' => 'annual_report_2023_2024.pdf',
        'file_path' => '/backend-php-mysql/uploads/reports/rep_77ff8f4f22ae13702a0a.pdf',
        'file_type' => 'document',
        'mime_type' => 'application/pdf',
        'alt_text_mr' => 'वार्षिक अहवाल २०२३-२०२४ PDF',
        'alt_text_en' => 'Annual Report 2023-2024 PDF',
    ],
    [
        'file_name' => 'rep_b9623259cefd6fbab424.pdf',
        'original_name' => 'audit_report_2024.pdf',
        'file_path' => '/backend-php-mysql/uploads/reports/rep_b9623259cefd6fbab424.pdf',
        'file_type' => 'document',
        'mime_type' => 'application/pdf',
        'alt_text_mr' => 'लेखापरीक्षण अहवाल २०२४ PDF',
        'alt_text_en' => 'Audit Report 2024 PDF',
    ],
];

$insStmt = $db->prepare("
    INSERT INTO media_files 
    (file_name, original_name, file_path, file_type, mime_type, file_size_bytes, alt_text_mr, alt_text_en, uploaded_by, created_at)
    VALUES 
    (:file_name, :original_name, :file_path, :file_type, :mime_type, :file_size_bytes, :alt_text_mr, :alt_text_en, :uploaded_by, NOW())
");

$registered = 0;
foreach ($activeFiles as $file) {
    $fullPath = __DIR__ . '/../../' . ltrim($file['file_path'], '/');
    $size = file_exists($fullPath) ? filesize($fullPath) : 0;
    
    // Check if already in media_files
    $check = $db->prepare("SELECT COUNT(*) FROM media_files WHERE file_path = :path");
    $check->execute([':path' => $file['file_path']]);
    if ($check->fetchColumn() == 0) {
        $insStmt->execute([
            ':file_name'       => $file['file_name'],
            ':original_name'   => $file['original_name'],
            ':file_path'       => $file['file_path'],
            ':file_type'       => $file['file_type'],
            ':mime_type'       => $file['mime_type'],
            ':file_size_bytes' => $size,
            ':alt_text_mr'     => $file['alt_text_mr'],
            ':alt_text_en'     => $file['alt_text_en'],
            ':uploaded_by'     => 1, // Admin ID 1
        ]);
        $registered++;
    }
}

echo "Registered {$registered} active media files in media_files table.\n";
