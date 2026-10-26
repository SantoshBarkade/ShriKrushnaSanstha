<?php
/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Official PHP + MySQL PDO Database Configuration (UTF8MB4 Marathi & English Support)
 */

// CORS Configuration: Restrict to configured or authorized local origins
$allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:8080'
];

if ($envOrigin = getenv('FRONTEND_URL')) {
    $allowedOrigins[] = rtrim($envOrigin, '/');
}

$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!headers_sent()) {
    if (in_array($requestOrigin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$requestOrigin}");
        header("Access-Control-Allow-Credentials: true");
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    header("Content-Type: application/json; charset=UTF-8");
}

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit();
}

class Database {
    private string $host;
    private int $port;
    private string $db_name;
    private string $username;
    private string $password;
    private string $charset;
    public ?PDO $conn = null;

    public function __construct() {
        self::loadEnv(__DIR__ . '/../.env');

        $this->host = getenv('DB_HOST') ?: '127.0.0.1';

        $portVal = getenv('DB_PORT') ?: '3306';
        $portInt = filter_var($portVal, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1, 'max_range' => 65535]
        ]);
        $this->port = $portInt !== false ? $portInt : 3306;

        $this->db_name = getenv('DB_NAME') ?: 'shrikrushnasanstha2';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') !== false ? (string)getenv('DB_PASS') : '';

        $charsetVal = getenv('DB_CHARSET') ?: 'utf8mb4';
        $this->charset = preg_match('/^[a-zA-Z0-9_-]+$/', $charsetVal) ? $charsetVal : 'utf8mb4';
    }

    /**
     * Minimal, dependency-free .env file loader for backend configuration.
     * Does not overwrite variables already provided by the process environment.
     */
    public static function loadEnv(string $filePath): void {
        if (!file_exists($filePath) || !is_readable($filePath)) {
            return;
        }

        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false) {
            return;
        }

        foreach ($lines as $line) {
            $line = trim($line);
            // Skip comments and blank lines
            if ($line === '' || $line[0] === '#' || $line[0] === ';') {
                continue;
            }

            // Find key=value delimiter
            $pos = strpos($line, '=');
            if ($pos === false) {
                continue;
            }

            $key = trim(substr($line, 0, $pos));
            $value = trim(substr($line, $pos + 1));

            // Strip surrounding quotes if present
            if (strlen($value) >= 2) {
                $first = $value[0];
                $last = $value[strlen($value) - 1];
                if (($first === '"' && $last === '"') || ($first === "'" && $last === "'")) {
                    $value = substr($value, 1, -1);
                }
            }

            // Do not overwrite variables already provided by the process environment
            if (getenv($key) === false) {
                putenv("{$key}={$value}");
                $_ENV[$key] = $value;
                $_SERVER[$key] = $value;
            }
        }
    }

    public function getConnection(): ?PDO {
        $this->conn = null;
        try {
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset={$this->charset}";
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $exception) {
            // Log full technical details to server log without leaking to client
            error_log("Database Connection Error: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode([
                "status" => "error",
                "success" => false,
                "message" => "Database service is currently unavailable. Please try again later."
            ], JSON_UNESCAPED_UNICODE);
            exit();
        }
        return $this->conn;
    }
}
?>
