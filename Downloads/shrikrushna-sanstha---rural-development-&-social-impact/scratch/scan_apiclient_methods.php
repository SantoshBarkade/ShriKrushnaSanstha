<?php
$content = file_get_contents(__DIR__ . '/../src/services/apiClient.ts');
$lines = explode("\n", $content);

echo "=== APICLIENT CRUD METHODS ===\n";
foreach ($lines as $i => $line) {
    if (preg_match('/public\s+static\s+(async\s+)?([a-zA-Z0-9_]+)/', $line, $m)) {
        echo "Line " . ($i + 1) . ": {$m[2]}\n";
    }
}
