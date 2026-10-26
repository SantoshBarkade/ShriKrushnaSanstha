<?php
/**
 * Orphan Files Dry-Run Manifest Generator
 * Scans all physical files in backend-php-mysql/uploads/
 * Compares them with all reference columns in MySQL database shrikrushnasanstha2.
 * Output: backend-php-mysql/reports/orphan_files_manifest.json
 * 
 * STRICT RULE: No files are deleted. Conservative classification.
 */

require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$baseUploadDir = realpath(__DIR__ . '/../backend-php-mysql/uploads');
$files = [];
$iter = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($baseUploadDir));

$checks = [
    ['officials', 'image_url', 'id', 'name_mr'],
    ['initiatives', 'image_url', 'id', 'title_mr'],
    ['initiative_photos', 'image_url', 'id', 'caption_mr'],
    ['gallery_albums', 'cover_image_url', 'id', 'title_mr'],
    ['gallery_photos', 'image_url', 'id', 'caption_mr'],
    ['events', 'image_url', 'id', 'title_mr'],
    ['events', 'cover_image_url', 'id', 'title_mr'],
    ['event_photos', 'image_url', 'id', 'caption_mr'],
    ['reports', 'pdf_url', 'id', 'title_mr'],
    ['reports', 'cover_image_url', 'id', 'title_mr'],
    ['reports', 'file_path', 'id', 'title_mr'],
    ['page_sections', 'image_url', 'id', 'title_mr'],
    ['announcements', 'cover_image_url', 'id', 'title_mr'],
    ['government_schemes', 'cover_image_url', 'id', 'title_mr']
];

$manifest = [
    'generated_at' => date('c'),
    'database'     => 'shrikrushnasanstha2',
    'total_files'  => 0,
    'referenced_count'   => 0,
    'unreferenced_count' => 0,
    'policy' => 'Do not automatically delete unreferenced files. Retain until explicitly reviewed and approved by administrator.',
    'files'  => []
];

foreach ($iter as $file) {
    if (!$file->isFile() || in_array($file->getFilename(), ['.gitignore', '.htaccess'])) {
        continue;
    }
    $fn = $file->getFilename();
    $serverRelative = str_replace('\\', '/', '/backend-php-mysql/uploads/' . ltrim(substr($file->getPathname(), strlen($baseUploadDir)), '/\\'));
    
    $references = [];
    foreach ($checks as [$table, $col, $idCol, $titleCol]) {
        try {
            $stmt = $db->prepare("SELECT {$idCol} AS id, {$titleCol} AS title FROM {$table} WHERE {$col} LIKE :pat");
            $stmt->execute([':pat' => '%' . $fn . '%']);
            while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $references[] = [
                    'table' => $table,
                    'column' => $col,
                    'record_id' => $r['id'],
                    'record_title' => $r['title']
                ];
            }
        } catch (PDOException $e) {}
    }

    $isReferenced = !empty($references);
    $status = $isReferenced ? 'referenced' : 'apparently_unreferenced';
    $recommendedAction = $isReferenced ? 'retain_active' : 'retain_pending_administrative_review';
    $reason = $isReferenced 
        ? 'Active in database (' . count($references) . ' reference(s) found).'
        : 'No database references found in any active content tables. Retain safe backup until administrative approval.';

    if ($isReferenced) {
        $manifest['referenced_count']++;
    } else {
        $manifest['unreferenced_count']++;
    }
    $manifest['total_files']++;

    $manifest['files'][] = [
        'filename'            => $fn,
        'relative_path'       => $serverRelative,
        'file_type'           => str_ends_with(strtolower($fn), '.pdf') ? 'document/pdf' : 'image',
        'file_size_bytes'     => $file->getSize(),
        'readable'            => is_readable($file->getPathname()),
        'status'              => $status,
        'references_found'    => $references,
        'recommended_action'  => $recommendedAction,
        'reason'              => $reason
    ];
}

$reportDir = dirname(__DIR__) . '/backend-php-mysql/reports';
if (!is_dir($reportDir)) {
    mkdir($reportDir, 0755, true);
}
file_put_contents($reportDir . '/orphan_files_manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

echo "Manifest successfully written to {$reportDir}/orphan_files_manifest.json\n";
echo "Total: {$manifest['total_files']}, Referenced: {$manifest['referenced_count']}, Unreferenced: {$manifest['unreferenced_count']}\n";
