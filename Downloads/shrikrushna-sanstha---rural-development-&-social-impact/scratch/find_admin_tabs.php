<?php
$content = file_get_contents(__DIR__ . '/../src/components/AdminPortal.tsx');
$lines = explode("\n", $content);

echo "=== ADMINPORTAL TAB RENDER LOCATIONS ===\n";
foreach ($lines as $i => $line) {
    if (preg_match('/activeTab\s*===\s*[\'"]([a-z]+)[\'"]/', $line, $m)) {
        echo "Line " . ($i + 1) . ": activeTab === '{$m[1]}'\n";
    }
}
