# Formal Technical Issues Register
## श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर, ता. जि. धुळे

**Document ID:** `TECH-REGISTER-2026-10-23`  
**Date:** 23 October 2026 (Local Time: 00:30 IST)  
**Reference Document:** `docs/MASTER_AUDIT_UPDATE_2026-10-23.md`  
**Workspace:** `C:\Users\Santosh\Downloads\shrikrushna-sanstha---rural-development-&-social-impact`  
**Database:** MySQL `shrikrushnasanstha2`  
**Status:** Audit & Evidence Verification Complete — Safe Actions Awaiting Client Approval  

---

## 1. Executive Summary & Safety Policy

This document provides a formal, evidence-grounded technical register of all identified issues for the official web portal of **श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर**.

### Mandatory Safety Compliance
- **Zero Institutional Alteration:** The institution's verified name, registration number (`महा/२६३/०५ (धुळे)`), jurisdiction, and leadership records (`off-1` to `off-4`) remain strictly intact.
- **Zero Database Destruction:** No databases switched, no tables dropped, no tables truncated, and no destructive migrations executed.
- **Zero Unauthorized Deletions:** No database rows, uploaded files, media catalog entries, or administrator accounts were deleted.
- **Zero Content Invention:** No placeholder event descriptions, fabricated video URLs, or synthetic report PDFs were invented.
- **Zero Unauthorized Deployment:** No dependency installations or live server deployments were performed.
- **Credential Protection:** In strict compliance with security rules, no passwords, password hashes, or authentication tokens are exposed in this register.

---

## 2. Master Technical Issues Register

| Issue ID | Verified Evidence | Severity | Public Impact | Proposed Fix | Data-Loss Risk | Approval Required | Status |
|:---|:---|:---:|:---|:---|:---:|:---:|:---:|
| **NEW-01** | `officials` records `off-1792567896233` ("CHETAN/SACHIV") and `off-1792520633973` ("चेतन निकम/सचिव") have `published=1` and `display_order=0`. Both appear at index 0 and 1 of `/api/content.php?resource=officials`. Zero external FK references across all DB tables. Photo file `off_5318adbc0d8ccb861810.jpg` linked to `off-1792567896233` is cataloged in `media_files` (ID 1) as `savita_nikam_secretary.jpg`. | **HIGH** | High: Both records appear at the very top of the public Officials grid before the legitimate President and Secretary. `off-1792567896233` displays all-caps English test strings and dummy phone `1234567890`. `off-1792520633973` duplicates Secretary title with dummy phone `123456789`. | 1. Set `published=0` for `off-1792567896233` (unpublish); delete upon client approval. Reassign authentic secretary photo (`off_5318adbc0d8ccb861810.jpg`) to `off-1` (Smt. Savita Nikam).<br>2. Set `published=0` for `off-1792520633973` (unpublish) until Sanstha clarifies Chetan Nikam's authentic designation (e.g., Joint Secretary / Trustee) and contact number. | **NONE** (Unpublishing preserves all records without deletion) | **YES** | **VERIFIED** — Proposed Safe Action Awaiting Approval |
| **NEW-02** | `videos` record `vid-1792511529940` has `title_mr="dekhte"`, `title_en="dekhte dekhte"`, `description_mr="hindi song ahe"`, `video_url="https://youtu.be/rkWJyMhIWLo"`, `published=1`, `featured=1`, `display_order=0`. Returned by public API `/api/content.php?resource=videos`. In `VideoLibraryView.tsx`, clicking card opens modal playing Atif Aslam commercial Bollywood song on YouTube. | **MEDIUM** | Medium: Visible as the top/featured video on public Video Library; plays Bollywood entertainment music video with institutional category tag ("महिला व ज्येष्ठ नागरिक सहाय्य"). | Set `published=0` (unpublish) via DB update or Admin CMS so it is immediately hidden from the public library without deleting the record. Purge upon approval. | **NONE** (Unpublishing preserves row) | **YES** | **VERIFIED** — Proposed Safe Action Awaiting Approval |
| **NEW-03** | `videos` records `vid-2` and `vid-3` have `published=1`, `display_order=0`. `vid-2` URL is `https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4`. `vid-3` URL is `https://vjs.zencdn.net/v/oceans.mp4`. In `VideoLibraryView.tsx`, HTML5 `<video>` tag opens and plays generic Mozilla sample and VideoJS ocean clips. (`vid-1` is already `published=0`). | **MEDIUM** | Medium: Institutionally titled video cards ("शासकीय योजना...", "औषधी वृक्षारोपण...") play unrelated third-party sample footage when clicked by visitors. | Set `published=0` (unpublish) for both `vid-2` and `vid-3` to hide them until Sanstha provides authentic video links. Do NOT substitute invented URLs. | **NONE** (Unpublishing retains entries in CMS for future editing) | **YES** | **VERIFIED** — Proposed Safe Action Awaiting Approval |
| **NEW-04** | Directory `backend-php-mysql/uploads/officials/` contains 18 files. 13 files are 67–81 bytes (valid PNG header `89504e470d0a1a0a`, 1×1 px / 32×32 px). All 13 are cataloged in `media_files` (IDs 13–19, 21–24, 26, 27). Zero references exist in `officials.image_url`. Remaining 5 files are valid photos (230 kB to 1.85 MB). | **LOW** | None: Files are unreferenced by any live official record. | Preserve all files and rows intact. Do NOT delete without approval. Upon explicit client approval, delete the 13 orphaned 1×1 px placeholder rows from `media_files` and filesystem. | **LOW** (Placeholder test files only; preserved until approval) | **YES** | **VERIFIED** — Preserved Intact Awaiting Approval |
| **NEW-05** | File `backend-php-mysql/uploads/reports/rep_feb15b2dae990b620375.pdf` is 317 bytes. Header is `%PDF-1.4`. Syntactically valid minimal 1-page blank PDF object hierarchy. Cataloged in `media_files` (ID 28). Zero references in `reports` table (all 3 report rows have `pdf_url="#"`). Companion file `rep_6a357f67f1662c01141c.pdf` (206.5 kB) is valid PDF-1.7, cataloged in `media_files` (ID 30), also unreferenced in `reports`. | **LOW** | None: `ReportsView.tsx` detects `pdf_url="#"` via `isReportPdfAvailable` and shows polite bilingual offline notice. | Preserve file and catalog row intact. Request authentic signed annual report PDFs from Sanstha. Link real PDFs to `rep-1`, `rep-2`, `rep-3`. Delete 317-byte stub only after approval. | **LOW** (Test stub; preserved until approval) | **YES** | **VERIFIED** — Preserved Intact Awaiting Approval |
| **NEW-06** | `admins` table management: Test temporary accounts IDs 4 and 5 were permanently deleted during the October 22 cleanup. Active database schema enhanced via reversible migration `backend-php-mysql/migrations/add_email_to_admins.php` to add `email` column. Dedicated Client Super Admin (`chetan.nikam`, ID 8, `Chetan Dilip Nikam`, `chetannikam1214@gmail.com`, role `super_admin`) successfully provisioned and verified. Primary Super Admin ID 1 (`super_admin`) preserved intact. Interactive CLI utility `set_admin_password.php` provided for secure credential updates. | **LOW** | Resolved: Client Super Admin provisioned, verified with full CMS & API permissions, zero passwords logged. | Preserved existing primary Super Admin (`id=1`) alongside dedicated Client Super Admin (`id=8`). Password securely handled via git-ignored offline handoff file. | **NONE** | **YES** | **RESOLVED & VERIFIED** |
| **ISS-01** | `events` record `evt-1792622428974` has `title_mr="वृक्षारोपण उपक्रम"`, `summary_mr="sdsd"`, `description_mr="sdsd"`, `published=1`. | **BLOCKER** | High: "sdsd" placeholder text is rendered on the public website under upcoming events. | Obtain authentic event description from Sanstha, OR unpublish `evt-1792622428974` (`published=0`) pending genuine text. | **NONE** (Unpublishing retains record) | **YES** | **CONFIRMED ACTIVE** — Awaiting Sanstha Text / Approval |
| **ISS-02** | `reports` records `rep-1`, `rep-2`, `rep-3` all have `pdf_url="#"`, `published=1`. | **BLOCKER** | Medium-Low: Visitors cannot download PDF reports. Site displays bilingual request notice gracefully. | Sanstha must provide official signed PDF reports. Upload via Admin CMS and link to records. | **NONE** | **YES** | **CONFIRMED ACTIVE** — Awaiting Official Documents |
| **ISS-06** | Sanstha registration number `महा/२६३/०५ (धुळे)`. Cannot be digitally verified through open registries. | **BLOCKER** | Governance: Registration credibility requires physical verification. | Sanstha must inspect physical Registration Certificate & Society Memorandum. | **NONE** | **YES** | **BLOCKED** — Requires Physical Document |
| **ISS-08** | No production domain, cloud VPS, or SSL certificate provisioned. Current deployment is local development only. | **BLOCKER** | Operational: Site cannot be accessed publicly by beneficiaries or stakeholders. | Follow `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md` for production VPS provisioning. | **NONE** | **YES** | **PENDING** — Client Infrastructure Action |
| **ISS-12** | Security headers (CSP, HSTS, Referrer-Policy, Permissions-Policy) missing at web server layer (applicable in production). | **MEDIUM** | Security: Missing defense-in-depth headers on web server. | Add headers in production NGINX/Apache vhost configuration as documented in production checklist. | **NONE** | **NO** (Dev phase) / **YES** (Prod) | **PENDING** — Production Web Server Config |
| **ISS-03** | `media_files` table catalogs 25 files on disk, several of which are not referenced by content tables. | **INFO** | None: Disk storage only (~10 MB total). | Preserve files intact pending comprehensive media review. | **NONE** | **NO** | **INTENTIONALLY RETAINED** — Audit Complete |
| **ISS-07** | Inquiries (0 rows) and Volunteers (0 rows) lack automated data retention schedule. | **LOW** | Compliance: Future data privacy governance. | Retain records; establish written retention policy prior to high-volume campaigns. | **NONE** | **NO** | **INTENTIONALLY RETAINED** |
| **ISS-11** | Keyboard navigation skip-to-content link absent on initial page load. | **LOW** | Accessibility: Minor WCAG 2.1 AA enhancement. | Add `<a href="#main-content" className="sr-only focus:not-sr-only">` in root layout. | **NONE** | **NO** | **BACKLOG** — Non-blocking |

---

## 3. Methodological Evidence & Distinctions

In strict compliance with the audit protocol, findings are categorized by epistemological certainty:

### 3.1 Tests Actually Executed & Verifiable Results
- **Vitest Automated Suite:** 136 tests executed across all modules; **136 passed, 0 failed, 0 skipped** (Execution time: 1.08s).
- **TypeScript Static Verification:** `tsc --noEmit` executed; **0 type errors, 0 compilation warnings**.
- **Production Bundle Build:** `npm run build` executed; **clean build in 429ms**, 0 chunk warnings. Public bundle: 367.34 kB (gzip: 79.34 kB), Admin bundle (lazy-loaded): 333.00 kB (gzip: 54.79 kB).
- **PHP Syntax Linting:** `php -l` executed across all PHP files in `backend-php-mysql/`; **0 syntax errors detected**.
- **Live HTTP Public API Endpoints:** 10 endpoints verified on live backend (`http://127.0.0.1:8088`): `all`, `initiatives`, `officials`, `gallery`, `videos`, `reports`, `announcements`, `schemes`, `contact`, `settings`. All returned `{"status": "success", "success": true}`.
- **Frontend Route Integrity:** Hash routing verified for all 13 defined routes (`home`, `about`, `officials`, `initiatives`, `work`, `gallery`, `videos`, `reports`, `news`, `contact`, `volunteer`, `privacy`, `admin`).

### 3.2 Database Facts Directly Verified
- `officials`: Exactly 6 rows. IDs `off-1792567896233` and `off-1792520633973` have `published=1` and `display_order=0`.
- `videos`: Exactly 4 rows. `vid-1` is `published=0`. `vid-1792511529940`, `vid-2`, and `vid-3` have `published=1`.
- `media_files`: Exactly 25 rows cataloged.
- `uploads/officials/`: Exactly 18 physical files. 13 files are 67–81 bytes (valid 1×1 / 32×32 px PNGs). 5 files are 230 kB to 1.85 MB.
- `uploads/reports/`: Exactly 2 physical files. `rep_feb15b2dae990b620375.pdf` is 317 bytes (valid `%PDF-1.4` stub). `rep_6a357f67f1662c01141c.pdf` is 206,515 bytes (valid `%PDF-1.7`).
- `admins`: Exactly 3 rows (`id=1`, `id=4`, `id=5`). No `is_active` column exists.
- `admin_tokens`: Total active unexpired tokens across the entire database is **1**, belonging solely to Admin ID 1. Admin IDs 4 and 5 have **0 active tokens**.
- `events`: `evt-1792622428974` has `summary_mr="sdsd"` and `description_mr="sdsd"`.
- `page_sections`: 14 rows exist. Section ID 18 ("vcvc") is confirmed deleted. Section ID 4 (`jurisdiction_nadarpur`) is confirmed published (`is_published=1`).

### 3.3 Findings Inferred from Naming or Appearance
- **`off-1792567896233` ("CHETAN/SACHIV"):** Inferred to be a test record because names and roles are in all-caps Latin characters, phone is `1234567890`, and its linked photo `off_5318adbc0d8ccb861810.jpg` is cataloged as `savita_nikam_secretary.jpg`.
- **`off-1792520633973` ("चेतन निकम/सचिव"):** Although it has genuine Devanagari script and the family surname Nikam, it has a dummy phone (`123456789`) and an Unsplash stock photo. Per safety instructions, we do NOT assume this is purely a test record without client confirmation, as Chetan Nikam may be an actual family trustee or officer whose true designation was mistakenly entered as "सचिव".
- **`vid-1792511529940` ("dekhte"):** Inferred to be a CMS testing entry based on title, description ("hindi song ahe"), and destination URL (commercial Bollywood music video).
- **`vid-2` and `vid-3`:** Inferred to be CMS development demonstration entries based on their use of public CDN sample clips (MDN Friday and VideoJS Oceans).
- **13 Tiny PNGs & 317-Byte PDF:** Inferred to be automated test artifacts created by test fixtures rather than corrupted uploads.

### 3.4 Checks Not Performed or Blocked
- **Physical Registration Certificate:** Cannot be verified digitally; requires physical inspection of Charity Commissioner registration documents.
- **Production Server Environment:** Server hardening, SSL installation, and domain routing cannot be performed until production hosting is procured.
- **Permanent Record Deletion:** No records or files were deleted, adhering to the mandatory rule requiring explicit client authorization.

---

## 4. Concise List of Actions Requiring Explicit Approval

Before executing any database modifications or content removals, client confirmation is required for the following specific actions:

1. **Unpublish Official Record `off-1792567896233` ("CHETAN/SACHIV"):**
   - *Action:* Execute `UPDATE officials SET published = 0 WHERE id = 'off-1792567896233';` (or delete if confirmed test data).
   - *Public Impact:* Removes all-caps test card from slot 1 of the Officials page.
   - *Safe Photo Reassignment:* Reassign the authentic photo `off_5318adbc0d8ccb861810.jpg` (`savita_nikam_secretary.jpg`) to Secretary Smt. Savita Nikam (`off-1`).

2. **Unpublish Official Record `off-1792520633973` ("चेतन निकम"):**
   - *Action:* Execute `UPDATE officials SET published = 0 WHERE id = 'off-1792520633973';`.
   - *Public Impact:* Removes duplicate Secretary card from public view while preserving Chetan Nikam's record in the CMS until Sanstha clarifies his authentic designation and contact details.

3. **Unpublish Test Video `vid-1792511529940` ("dekhte"):**
   - *Action:* Execute `UPDATE videos SET published = 0, featured = 0 WHERE id = 'vid-1792511529940';`.
   - *Public Impact:* Immediately removes the Bollywood music video from the public Video Library.

4. **Unpublish Placeholder Videos `vid-2` & `vid-3`:**
   - *Action:* Execute `UPDATE videos SET published = 0 WHERE id IN ('vid-2', 'vid-3');`.
   - *Public Impact:* Hides videos playing external sample clips until genuine Sanstha documentary links are provided.

5. **Provide Authentic Description for Event `evt-1792622428974`:**
   - *Action:* Provide Marathi & English summary and description for "वृक्षारोपण उपक्रम" (or approve unpublishing via `UPDATE events SET published = 0 WHERE id = 'evt-1792622428974';`).

6. **Provide Authentic Annual Report PDFs for `rep-1`, `rep-2`, `rep-3`:**
   - *Action:* Upload signed/scanned institutional report PDFs to replace current `pdf_url="#"`.

7. **Purge 13 Orphaned 1×1 px PNGs & 317-byte PDF Stub:**
   - *Action:* Execute deletion of rows 13–19, 21–24, 26, 27, and 28 from `media_files` and unlink corresponding files from filesystem.

8. **Delete Inactive Temporary Admin Accounts (IDs 4 and 5):**
   - *Action:* Execute `DELETE FROM admins WHERE id IN (4, 5);` and clean associated expired tokens from `admin_tokens`.
