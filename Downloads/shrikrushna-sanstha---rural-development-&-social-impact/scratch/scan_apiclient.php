<?php
$content = file_get_contents(__DIR__ . '/../src/services/apiClient.ts');
$lines = explode("\n", $content);

echo "=== SCANNING APICLIENT.TS METHODS ===\n";
foreach ($lines as $i => $line) {
    if (preg_match('/^\s*(static\s+async\s+[a-zA-Z0-9_]+|static\s+[a-zA-Z0-9_]+)\s*\(/', $line, $m)) {
        echo "Line " . ($i + 1) . ": " . trim($line) . "\n";
    }
}
