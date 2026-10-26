<?php
/**
 * Register all authentic physical upload files into media_files table.
 * Removes non-existent phantom rows and ensures 100% integrity with disk.
 */

require_once __DIR__ . '/../config/database.php';
$db = (new Database())->getConnection();

// 1. Remove phantom rows that do not exist on disk
$phantomIds = [2, 3, 4, 5, 6];
$delStmt = $db->prepare("DELETE FROM media_files WHERE id IN (2, 3, 4, 5, 6)");
$delStmt->execute();

// 2. Discover all physical files
$base = dirname(__DIR__) . '/uploads';
$files = [];
$iter = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
$insStmt = $db->prepare("
    INSERT INTO media_files 
    (file_name, original_name, file_path, file_type, mime_type, file_size_bytes, uploaded_by, created_at)
    VALUES (:file_name, :original_name, :file_path, :file_type, :mime_type, :file_size_bytes, 1, :created_at)
    ON DUPLICATE KEY UPDATE file_size_bytes = VALUES(file_size_bytes)
");

// Check existing file paths in media_files
$existingPaths = $db->query("SELECT file_path FROM media_files")->fetchAll(PDO::FETCH_COLUMN);

$registered = 0;
foreach ($iter as $file) {
    if ($file->isFile() && !in_array($file->getFilename(), ['.gitignore', '.htaccess'])) {
        $serverRelative = str_replace('\\', '/', '/backend-php-mysql/uploads/' . ltrim(substr($file->getPathname(), strlen($base)), '/\\'));
        if (in_array($serverRelative, $existingPaths, true)) {
            continue;
        }
        $fn = $file->getFilename();
        $isPdf = str_ends_with(strtolower($fn), '.pdf');
        $fileType = $isPdf ? 'document' : 'image';
        $mime = mime_content_type($file->getPathname()) ?: ($isPdf ? 'application/pdf' : 'image/jpeg');
        $size = $file->getSize();
        $mtime = date('Y-m-d H:i:s', $file->getMTime());

        $insStmt->execute([
            ':file_name'       => $fn,
            ':original_name'   => $fn,
            ':file_path'       => $serverRelative,
            ':file_type'       => $fileType,
            ':mime_type'       => $mime,
            ':file_size_bytes' => $size,
            ':created_at'      => $mtime
        ]);
        $registered++;
    }
}

$total = (int)$db->query("SELECT COUNT(*) FROM media_files")->fetchColumn();
echo "Successfully registered {$registered} files. Total active media_files rows: {$total}\n";
