<?php
$content = file_get_contents(__DIR__ . '/../src/components/AdminPortal.tsx');
$lines = explode("\n", $content);

foreach ($lines as $i => $line) {
    if (strpos($line, 'handleSaveReport') !== false) {
        echo "Line " . ($i + 1) . ": " . trim($line) . "\n";
    }
}
