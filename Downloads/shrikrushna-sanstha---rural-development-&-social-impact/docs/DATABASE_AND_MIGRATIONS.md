# Database Architecture & Migration Guide
# श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर

---

## 1. Active Database Overview

* **Active Database:** `shrikrushnasanstha2`
* **Host & Port:** `127.0.0.1:3306`
* **Character Set & Collation:** `utf8mb4` / `utf8mb4_unicode_ci` (Full Devanagari & Emoji support)
* **Storage Engine:** InnoDB (ACID compliant with Foreign Key constraints)
* **Legacy Database Isolation:** `shrikrushnasanstha1` is the legacy database and must remain strictly isolated and untouched.

---

## 2. Table Inventory (21 Tables)

| # | Table Name | Key Purpose | Primary Key | Key Foreign Keys / Relationships |
|---|---|---|---|---|
| 1 | `admins` | Administrative users & credentials | `id` (int unsigned) | Unique `username` |
| 2 | `admin_tokens` | SHA-256 hashed bearer sessions | `id` (int unsigned) | `admin_id` -> `admins(id)` |
| 3 | `login_attempts` | Rate limiting & brute force audit | `id` (int unsigned) | Indexed `ip_address`, `username` |
| 4 | `contact_info` | Institutional registration & contacts | `id` (int, fixed 1) | Singleton record |
| 5 | `site_settings` | Global badges, stats, tagline | `key_name` (varchar 64) | Key-value store |
| 6 | `site_pages` | Page slugs & SEO meta | `slug` (varchar 64) | `about`, `privacy`, `work`, `home` |
| 7 | `page_sections` | Dynamic modular page content | `id` (int unsigned) | `page_slug` -> `site_pages(slug)` |
| 8 | `officials` | Board members & leadership | `id` (varchar 64) | Ordered by `display_order` |
| 9 | `initiatives` | Sanstha core rural initiatives | `id` (varchar 64) | Categorized, published flag |
| 10 | `initiative_photos` | Additional photos for initiatives | `id` (int unsigned) | `initiative_id` -> `initiatives(id)` ON DELETE CASCADE |
| 11 | `government_schemes` | Statutory public welfare schemes | `id` (varchar 64) | Segregated from Sanstha initiatives |
| 12 | `events` | Institutional events & drives | `id` (varchar 64) | Start date, end date, status |
| 13 | `event_photos` | Additional photos for events | `id` (int unsigned) | `event_id` -> `events(id)` ON DELETE CASCADE |
| 14 | `announcements` | Public notices & circulars | `id` (varchar 64) | Upcoming flag, published flag |
| 15 | `gallery_albums` | Event photo collections | `id` (varchar 64) | Ordered by display_order |
| 16 | `gallery_photos` | Album-associated photos | `id` (varchar 64) | `album_id` -> `gallery_albums(id)` |
| 17 | `videos` | YouTube & social media videos | `id` (varchar 64) | YouTube ID validation |
| 18 | `reports` | Annual & audit disclosures | `id` (varchar 64) | PDF file paths & disclosures |
| 19 | `inquiries` | Public contact submissions | `id` (int unsigned) | Status: new, read, replied, archived |
| 20 | `volunteers` | Volunteer registration forms | `id` (int unsigned) | Status: new, reviewed, approved, rejected |
| 21 | `media_files` | Central media asset inventory | `id` (int unsigned) | Usage reference tracking across all tables |

---

## 3. Migration Order & History

1. **Baseline Schema Creation (`init.sql` / initial setup):**
   * Tables: `admins`, `admin_tokens`, `login_attempts`, `contact_info`, `site_settings`, `site_pages`, `officials`, `initiatives`, `government_schemes`, `events`, `announcements`, `gallery_albums`, `gallery_photos`, `videos`, `reports`, `inquiries`, `volunteers`.
2. **Child Photos Cascade Migrations:**
   * `initiative_photos`: `initiative_id` FK with `ON DELETE CASCADE`.
   * `event_photos`: `event_id` FK with `ON DELETE CASCADE`.
3. **Phase 2 Migration (`page_sections`):**
   * Added `image_alt_mr` (varchar 255) and `image_alt_en` (varchar 255).
   * Seeded 15 authentic bilingual rows (5 About, 4 Privacy, 6 Work pillars).
   * Migration script: `backend-php-mysql/migrations/apply_page_sections_seed.php`.
4. **Phase 3 Migration (`media_files`):**
   * Registered all 23 server-relative upload assets into `media_files`.
   * Generated manifest: `backend-php-mysql/reports/orphan_files_manifest.json`.
   * Migration script: `backend-php-mysql/migrations/register_existing_media.php`.

---

## 4. Backup & Recovery Runbook

### Taking a Database Backup
Always generate a timestamped backup before running schema changes:
```powershell
# Windows PowerShell
$ts = Get-Date -Format 'yyyyMMdd_HHmmss'
mysqldump -h 127.0.0.1 -u root -p shrikrushnasanstha2 > "backend-php-mysql/migrations/backup_shrikrushnasanstha2_$ts.sql"
```

### Full Verified Pre-Migration Baseline
* Backup file: `backend-php-mysql/migrations/backup_shrikrushnasanstha2_pre_phase2.sql`
* Size: 84,051 bytes (Contains complete definitions and data for all 21 tables).

### Safe Restore Procedure
```powershell
# CAUTION: Test restore on a separate test database first (e.g. shrikrushnasanstha_test)
mysql -h 127.0.0.1 -u root -p -e "CREATE DATABASE IF NOT EXISTS shrikrushnasanstha_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -h 127.0.0.1 -u root -p shrikrushnasanstha_test < backend-php-mysql/migrations/backup_shrikrushnasanstha2_pre_phase2.sql
```

---

## 5. Rollback Limitations & Safeguards

* Never run `DROP TABLE` or `TRUNCATE TABLE` on `shrikrushnasanstha2`.
* Foreign key constraints are enforced (`foreign_key_checks=1`).
* Media file references are protected by the backend API: deleting an in-use media record is rejected with `HTTP 409 Conflict`.
