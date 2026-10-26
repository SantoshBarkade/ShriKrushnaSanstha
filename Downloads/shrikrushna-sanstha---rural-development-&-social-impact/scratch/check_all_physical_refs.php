<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

$base = dirname(__DIR__) . '/backend-php-mysql/uploads';
$files = [];
$iter = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
foreach ($iter as $file) {
    if ($file->isFile() && !in_array($file->getFilename(), ['.gitignore', '.htaccess'])) {
        $files[] = str_replace('\\', '/', substr($file->getPathname(), strlen(dirname(__DIR__))));
    }
}

function checkRefs(PDO $db, string $path): array {
    $fn = basename($path);
    $refs = [];
    $checks = [
        ['officials', 'image_url', 'id'],
        ['initiatives', 'image_url', 'id'],
        ['initiative_photos', 'image_url', 'id'],
        ['gallery_albums', 'cover_image_url', 'id'],
        ['gallery_photos', 'image_url', 'id'],
        ['events', 'image_url', 'id'],
        ['events', 'cover_image_url', 'id'],
        ['event_photos', 'image_url', 'id'],
        ['reports', 'pdf_url', 'id'],
        ['reports', 'cover_image_url', 'id'],
        ['reports', 'file_path', 'id'],
        ['page_sections', 'image_url', 'id'],
        ['announcements', 'cover_image_url', 'id'],
        ['government_schemes', 'cover_image_url', 'id']
    ];

    foreach ($checks as [$table, $col, $idCol]) {
        try {
            $stmt = $db->prepare("SELECT {$idCol} FROM {$table} WHERE {$col} LIKE :pat");
            $stmt->execute([':pat' => '%' . $fn . '%']);
            while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $refs[] = "{$table}.{$col} (id={$r[$idCol]})";
            }
        } catch (PDOException $e) {}
    }
    return $refs;
}

$referencedCount = 0;
$unreferencedCount = 0;
foreach ($files as $f) {
    $r = checkRefs($db, $f);
    if (!empty($r)) {
        $referencedCount++;
        echo "[REFERENCED] {$f} => " . implode(', ', $r) . "\n";
    } else {
        $unreferencedCount++;
        echo "[UNREFERENCED] {$f}\n";
    }
}
echo "\nTotal physical: " . count($files) . " | Referenced: {$referencedCount} | Unreferenced: {$unreferencedCount}\n";
