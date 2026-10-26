<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

function getFileReferences(PDO $db, string $pathOrFilename): array {
    $trimmed = trim($pathOrFilename);
    if (empty($trimmed)) {
        return [];
    }
    $basename = basename($trimmed);
    $relPath = str_starts_with($trimmed, '/') ? substr($trimmed, 1) : $trimmed;
    $serverPath = '/backend-php-mysql/' . ltrim($trimmed, '/');
    $normalizedServer = str_replace('//', '/', $serverPath);

    $patterns = array_unique([$basename, $trimmed, $relPath, $serverPath, $normalizedServer]);

    $references = [];

    // Helper to search table
    $searchTable = function(string $table, string $field, string $idCol, ?string $titleCol = null) use ($db, $patterns, &$references) {
        $clauses = [];
        $params = [];
        foreach ($patterns as $i => $pat) {
            $paramName = ":p_{$table}_{$field}_{$i}";
            $clauses[] = "{$field} LIKE {$paramName}";
            $params[$paramName] = '%' . $pat . '%';
        }
        $sql = "SELECT {$idCol} AS ref_id" . ($titleCol ? ", {$titleCol} AS ref_title" : "") . 
               " FROM {$table} WHERE " . implode(' OR ', $clauses);
        try {
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $references[] = [
                    'table' => $table,
                    'field' => $field,
                    'id'    => $row['ref_id'],
                    'title' => $row['ref_title'] ?? "ID: {$row['ref_id']}"
                ];
            }
        } catch (PDOException $e) {
            // ignore if column doesn't exist
        }
    };

    $searchTable('officials', 'image_url', 'id', 'name_mr');
    $searchTable('initiatives', 'image_url', 'id', 'title_mr');
    $searchTable('initiative_photos', 'image_url', 'id', 'caption_mr');
    $searchTable('gallery_albums', 'cover_image_url', 'id', 'title_mr');
    $searchTable('gallery_photos', 'photo_url', 'id', 'caption_mr');
    $searchTable('events', 'image_url', 'id', 'title_mr');
    $searchTable('event_photos', 'image_url', 'id', 'caption_mr');
    $searchTable('reports', 'file_url', 'id', 'title_mr');
    $searchTable('page_sections', 'image_url', 'id', 'title_mr');
    $searchTable('announcements', 'cover_image_url', 'id', 'title_mr');
    $searchTable('government_schemes', 'cover_image_url', 'id', 'title_mr');

    return $references;
}

// Test against all media_files
$mediaFiles = $db->query("SELECT id, file_name, file_path FROM media_files")->fetchAll(PDO::FETCH_ASSOC);
echo "=== Registered Media References ===\n";
foreach ($mediaFiles as $mf) {
    $refs = getFileReferences($db, $mf['file_path']);
    echo "Media #{$mf['id']} ({$mf['file_name']}): " . count($refs) . " references\n";
    foreach ($refs as $r) {
        echo "   -> {$r['table']}.{$r['field']} (ID: {$r['id']}, Title: {$r['title']})\n";
    }
}
