<?php
require_once __DIR__ . '/../backend-php-mysql/config/database.php';
$db = (new Database())->getConnection();

function getMediaReferencesHelper(PDO $db, string $fileName, string $filePath, ?string $excludeTable = null, $excludeId = null): array {
    $fn = basename($fileName ?: $filePath);
    if (empty($fn)) {
        return [];
    }

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

    $references = [];
    foreach ($checks as [$table, $col, $idCol, $titleCol]) {
        try {
            $sql = "SELECT {$idCol} AS id, {$titleCol} AS title FROM {$table} WHERE {$col} LIKE :pat";
            if ($excludeTable === $table && $excludeId !== null) {
                $sql .= " AND {$idCol} != :exId";
            }
            $stmt = $db->prepare($sql);
            $params = [':pat' => '%' . $fn . '%'];
            if ($excludeTable === $table && $excludeId !== null) {
                $params[':exId'] = $excludeId;
            }
            $stmt->execute($params);
            while ($r = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $references[] = [
                    'table'   => $table,
                    'column'  => $col,
                    'id'      => $r['id'],
                    'title'   => $r['title'] ?: "Record #{$r['id']}"
                ];
            }
        } catch (PDOException $e) {}
    }

    return $references;
}

// Test with off_5318adbc0d8ccb861810.jpg
$r1 = getMediaReferencesHelper($db, 'off_5318adbc0d8ccb861810.jpg', '/backend-php-mysql/uploads/officials/off_5318adbc0d8ccb861810.jpg');
echo "off_5318adbc0d8ccb861810.jpg refs: " . count($r1) . "\n";
print_r($r1);

// Test with unreferenced off_1459bf0c6242540654d7.png
$r2 = getMediaReferencesHelper($db, 'off_1459bf0c6242540654d7.png', '/backend-php-mysql/uploads/officials/off_1459bf0c6242540654d7.png');
echo "off_1459bf0c6242540654d7.png refs: " . count($r2) . "\n";
