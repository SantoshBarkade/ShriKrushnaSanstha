<?php
/**
 * Safe Non-Destructive Probe of Current Gallery API & MySQL State
 */
$baseUrl = 'http://127.0.0.1:8088/backend-php-mysql/api/content.php';

echo "=== 1. TEST GET ?resource=gallery ===\n";
$res = @file_get_contents("$baseUrl?resource=gallery");
$statusLine = $http_response_header[0] ?? '';
echo "HTTP Status: $statusLine\n";
$data = json_decode($res, true);
echo "Count of photos returned: " . count($data['data'] ?? []) . "\n";
foreach ($data['data'] ?? [] as $p) {
    echo "  - ID: {$p['id']} | Album: " . ($p['album_id'] ?? 'NULL') . " | Title(MR): {$p['title_mr']} | Image: {$p['image_url']}\n";
}

echo "\n=== 2. TEST GET ?resource=all ===\n";
$resAll = @file_get_contents("$baseUrl?resource=all");
$dataAll = json_decode($resAll, true);
echo "Gallery count in resource=all: " . count($dataAll['data']['gallery'] ?? []) . "\n";
echo "Are albums present in resource=all? " . (isset($dataAll['data']['albums']) ? 'YES' : 'NO') . "\n";

echo "\n=== 3. PROBE POST ?resource=gallery (Currently unsupported) ===\n";
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => "Content-Type: application/json\r\n",
        'content' => json_encode(['title_mr' => 'probe']),
        'ignore_errors' => true
    ]
]);
$resp = @file_get_contents("$baseUrl?resource=gallery", false, $context);
$statusLine = $http_response_header[0] ?? '';
echo "POST ?resource=gallery HTTP Status: $statusLine\n";
echo "Response: $resp\n";
