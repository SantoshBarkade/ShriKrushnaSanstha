<?php
$base = dirname(__DIR__) . '/backend-php-mysql/uploads';
$files = [];
$iter = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
foreach ($iter as $file) {
    if ($file->isFile() && !in_array($file->getFilename(), ['.gitignore', '.htaccess'])) {
        $files[] = str_replace('\\', '/', substr($file->getPathname(), strlen(dirname(__DIR__))));
    }
}
print_r($files);
