# Security, Privacy & Operational Maintenance Guide
# श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर

---

## 1. Authentication & Session Architecture

* **Password Hashing:** Passwords are never stored in plaintext. They are hashed using PHP's native `password_hash($password, PASSWORD_DEFAULT)` utilizing strong bcrypt with automatic work factor.
* **Session Tokens:**
  * Generated with cryptographically secure random bytes: `bin2hex(random_bytes(32))` (64 hexadecimal characters).
  * Stored in the database as a SHA-256 hash (`admin_tokens.token_hash`) to prevent token exposure in database dumps.
  * Lifetime: Fixed 8-hour expiration (`expires_at`).
  * Revocation: Explicit logout updates `revoked_at = NOW()`. Revoked tokens are immediately rejected with HTTP 401.

---

## 2. Rate Limiting & Brute-Force Safeguards

* **Dual-Threshold Rate Limiting (`login_attempts`):**
  1. **IP-Level Restriction:** Maximum 5 failed login attempts per IP address within 15 minutes.
  2. **Account-Level Restriction:** Maximum 15 failed login attempts per username across all IP addresses within 15 minutes.
* **Safe IP Extraction:** `REMOTE_ADDR` is used unconditionally unless trusted reverse proxies are explicitly whitelisted in `TRUSTED_PROXIES`.
* **Automatic Cleansing:** Successful administrative authentication immediately clears failed attempts for that IP and account.

---

## 3. Database Security & Query Hardening

* **Emulated Prepares Disabled:**
  `PDO::ATTR_EMULATE_PREPARES => false` ensures 100% of queries use true native server-side prepared statements.
* **Zero SQL Concatenation:** All user-supplied input (titles, descriptions, filters, IDs) is passed strictly through parameter bindings.
* **Error Shielding:** Database exception details (`PDOException`) are logged securely to server logs and never displayed to end-user clients. Generic, safe messages are returned.

---

## 4. File Upload Hardening

* **MIME & Magic Bytes Validation:** Files are verified using `finfo_file(FILEINFO_MIME_TYPE)` against strict whitelists:
  * Images: `image/jpeg`, `image/png`, `image/webp`.
  * Documents: `application/pdf`.
* **Script Execution Prevention:**
  The `uploads/` directory contains an Apache `.htaccess` rule that disallows execution of any server-side scripts:
  ```apache
  # Prevent execution of scripts in uploads directory
  <FilesMatch "\.(php|phtml|php3|php4|php5|php7|php8|phar|sh|pl|cgi|exe|py)$">
      Order Allow,Deny
      Deny from all
  </FilesMatch>
  Options -ExecCGI -Indexes
  ```
* **Filename Randomization:** Uploaded files are renamed using microtime and cryptographic hashes to prevent collisions and path traversal (`../`) vulnerabilities.

---

## 5. Privacy & Data Retention Guidelines

1. **Contact Inquiries:**
   * Used solely for citizen correspondence and social welfare inquiries.
   * Do not display citizen phone numbers, emails, or messages in public reports or unauthenticated pages.
2. **Volunteer Applications:**
   * Do not collect sensitive government IDs (Aadhaar, PAN, Passport).
   * Data is strictly restricted to authorized administrators.
3. **Retention Policy:**
   * Automated periodic purge or anonymization of inquiries older than 1 year is recommended, but **must only be scheduled after explicit administrative review and approval**.

---

## 6. Production Deployment Checklist

Before going live on a public hosting server (e.g. Apache/Nginx on Linux or Cloud):
- [ ] Ensure `backend-php-mysql/.env` is configured with strong production database credentials and is `.gitignore`d.
- [ ] Set `APP_ENV=production` and ensure PHP `display_errors = Off` in `php.ini`.
- [ ] Enforce HTTPS (TLS 1.3) with HSTS headers.
- [ ] Set strict CORS origins in `backend-php-mysql/api/cors_helper.php` matching the production domain (disable wildcard `*`).
- [ ] Run `npm run build` to generate the minified production frontend bundle in `dist/`.
- [ ] Verify web server SPA fallback routing (direct all non-API GET requests to `dist/index.html`).
- [ ] Configure scheduled nightly database backups using `mysqldump` and rotate archives.
