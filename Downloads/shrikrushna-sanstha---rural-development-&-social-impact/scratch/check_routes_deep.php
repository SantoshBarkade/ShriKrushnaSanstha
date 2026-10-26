<?php
$content = file_get_contents(__DIR__ . '/../backend-php-mysql/api/content.php');

$keywords = ['events', 'reports', 'gallery', 'contact', 'inquiries', 'volunteers', 'pages', 'media'];

foreach ($keywords as $kw) {
    echo "=== KEYWORD: $kw ===\n";
    $matches = [];
    preg_match_all('/(case\s+[\'"]' . $kw . '[\'"]|\$resource\s*===?\s*[\'"]' . $kw . '[\'"])/i', $content, $matches, PREG_OFFSET_CAPTURE);
    if (!empty($matches[0])) {
        foreach ($matches[0] as $m) {
            $line = substr_count(substr($content, 0, $m[1]), "\n") + 1;
            echo "  Line $line: {$m[0]}\n";
        }
    } else {
        echo "  NO ROUTE MATCHES FOUND!\n";
    }
}
