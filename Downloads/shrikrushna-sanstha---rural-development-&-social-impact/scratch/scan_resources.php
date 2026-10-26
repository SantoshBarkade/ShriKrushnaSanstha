<?php
$content = file_get_contents(__DIR__ . '/../backend-php-mysql/api/content.php');
$lines = explode("\n", $content);

$currentMethod = 'START';
foreach ($lines as $i => $line) {
    if (preg_match('/case\s+[\'"](GET|POST|PUT|DELETE)[\'"]:/', $line, $m)) {
        $currentMethod = $m[1];
        echo "\n==================== METHOD: $currentMethod ====================\n";
    }
    if (preg_match('/(if|elseif)\s*\(\s*\$resource\s*===?\s*[\'"]([^\'"]+)[\'"]/', $line, $m)) {
        echo "Line " . ($i + 1) . " [$currentMethod]: resource = '{$m[2]}'\n";
    }
}
