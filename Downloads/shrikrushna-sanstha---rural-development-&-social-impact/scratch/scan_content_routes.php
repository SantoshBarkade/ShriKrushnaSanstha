<?php
$content = file_get_contents(__DIR__ . '/../backend-php-mysql/api/content.php');
$lines = explode("\n", $content);

$currentMethod = '';
foreach ($lines as $i => $line) {
    if (preg_match('/case\s+[\'"](GET|POST|PUT|DELETE)[\'"]:/', $line, $m)) {
        $currentMethod = $m[1];
        echo "\n=== METHOD: $currentMethod ===\n";
    }
    if (preg_match('/case\s+[\'"]([a-z_]+)[\'"]:/', $line, $m) && !in_array($m[1], ['GET','POST','PUT','DELETE'])) {
        echo "[$currentMethod] Line " . ($i + 1) . ": resource '{$m[1]}'\n";
    }
}
