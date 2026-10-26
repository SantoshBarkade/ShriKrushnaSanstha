# Prioritized Remaining Issues Register
## श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर
**Register ID:** `REGISTER-ISSUES-2026-10-22`  
**Date:** 22 October 2026  
**Status:** Active Audit Baseline  

---

## Severity Scale Definition
* **CRITICAL:** Immediate serious security vulnerability, data loss, or system outage. (None found)
* **HIGH:** Major core functionality breakdown or access control failure. (None found)
* **MEDIUM:** Significant functional, usability, accessibility, or data consistency issue requiring resolution before public launch.
* **LOW:** Minor non-blocking defect, polish, or edge-case improvement.
* **BLOCKER:** External dependency or institutional decision required before public launch (content, physical documents, hosting/SSL).
* **INFORMATIONAL:** Verified behavior, cataloged items, or administrative observations requiring awareness.

---

## 1. Issue Register Summary Table

| Issue ID | Severity | Category | Module / Table | Title | Resolution Status |
|---|:---:|---|---|---|:---:|
| **ISSUE-01** | **BLOCKER** | Content | `events` (`evt-1792622428974`) | Event contains `"sdsd"` placeholder in description fields | Pending Institutional Copy |
| **ISSUE-02** | **BLOCKER** | Documents | `reports` (`rep-1`, `rep-2`, `rep-3`) | Annual report download links contain `"#"` | Safe UI Notice Added; Pending Official PDFs |
| **ISSUE-03** | **INFORMATIONAL** | Storage | `media_files` / `uploads/` | 17 physical media files are unreferenced by current content | Preserved on Disk; Pending Archive Review |
| **ISSUE-04** | **INFORMATIONAL** | CMS Data | `page_sections` (ID 18) | Test-created section `vcvc` (`about_sec_mvjfcis1`) | Preserved in DB; Pending Admin Approval |
| **ISSUE-05** | **INFORMATIONAL** | CMS Data | `page_sections` (ID 4) | Section `jurisdiction_nadarpur` marked as unpublished draft | Verified as Draft; Pending Publish Decision |
| **ISSUE-06** | **BLOCKER** | Compliance | `contact_info` / Documentation | Registration number `महा/२६३/०५ (धुळे)` requires physical certificate verification | Pending Physical Certificate Check |
| **ISSUE-07** | **LOW** | Policy | `inquiries` / `volunteers` | Automated 1-year data retention schedule currently disabled | Intentionally Disabled Pending Policy Approval |
| **ISSUE-08** | **BLOCKER** | Infrastructure | Server / Network | Public production hosting, domain, SSL/TLS, and off-site backup pipeline | Deployment Prepared; Awaiting Infrastructure |
| **ISSUE-09** | **LOW** | Performance | Frontend Bundle | Single JavaScript bundle is 920.5 kB uncompressed (~202 kB gzip) | Within Budget; Future Code-Splitting Recommended |
| **ISSUE-10** | **LOW** | Build Config | `vite.config.ts` | `__dirname` deprecation warning in Vite 8 config | Cosmetic warning suppressed/non-breaking |

---

## 2. Detailed Issue Records

### ISSUE-01: Event Description Contains Placeholder Text `"sdsd"`
* **Issue ID:** `ISSUE-01`
* **Severity:** **BLOCKER**
* **Affected Resource:** Table `events`, Record ID `evt-1792622428974` (Title: `वृक्षारोपण उपक्रम`)
* **Evidence:**
  ```sql
  SELECT id, title_mr, summary_mr, description_mr FROM events WHERE id = 'evt-1792622428974';
  -- summary_mr: 'sdsd', summary_en: 'sdsd', description_mr: 'sdsd', description_en: 'sdsd'
  ```
* **Impact:** Public visitors will see `"sdsd"` under the tree plantation initiative instead of authentic educational details.
* **Root Cause:** A test string was entered during initial development and never replaced with institutional text.
* **Proposed Fix:** Institutional administrators must provide authentic Marathi and English summary and description copy. Update the record via the Admin CMS (`EventsModule.tsx`).
* **Safe to Fix Now:** No (Requires authentic text from institution; fabricating text is strictly forbidden).
* **Final Status:** **Pending Institutional Copy**

---

### ISSUE-02: Annual Report Download Links Contain Placeholder `"#"`
* **Issue ID:** `ISSUE-02`
* **Severity:** **BLOCKER**
* **Affected Resource:** Table `reports`, Record IDs `rep-1`, `rep-2`, `rep-3`
* **Evidence:**
  ```sql
  SELECT id, title_mr, pdf_url FROM reports;
  -- rep-1: '#', rep-2: '#', rep-3: '#'
  ```
* **Impact:** Clicking download previously triggered a generic "Viewing report" banner without a file.
* **Safe Fix Performed:** Updated `src/components/ReportsView.tsx` to display an explicit and honest notification: *"या अहवालाची डिजिटल प्रत (PDF) लवकरच उपलब्ध होईल."* / *"The digital PDF copy for '{reportTitle}' will be available soon."*
* **Root Cause:** Physical scanned PDF documents have not yet been provided by the institution.
* **Proposed Final Fix:** Obtain officially signed/scanned audit and annual report PDFs from the institution and upload them via the Admin CMS (`ReportsModule.tsx`).
* **Final Status:** **Safe UI Fix Applied; Pending Official PDF Uploads**

---

### ISSUE-03: Seventeen Unreferenced Media Uploads on Disk
* **Issue ID:** `ISSUE-03`
* **Severity:** **INFORMATIONAL**
* **Affected Resource:** Directory `backend-php-mysql/uploads/`, Table `media_files`
* **Evidence:**
  * Total physical files: 24 (excluding `.htaccess`).
  * Total `media_files` rows: 24.
  * Active content references: 7.
  * Unreferenced files: 17.
* **Impact:** None on public site; 17 historical or surplus image/document files occupy disk space (~7.5 MB total).
* **Root Cause:** Photos uploaded during development and testing were replaced or detached from active content.
* **Proposed Fix:** Retain all 17 files on disk under institutional asset protection. Present the list to the institution to determine if any should be linked to photo gallery albums or retained as historical archives.
* **Safe to Fix Now:** No (Deleting them risks losing historical institutional assets).
* **Final Status:** **100% Preserved; Pending Institutional Review**

---

### ISSUE-04: Test-Created Section `vcvc` in `page_sections`
* **Issue ID:** `ISSUE-04`
* **Severity:** **INFORMATIONAL**
* **Affected Resource:** Table `page_sections`, Record ID `18` (`about_sec_mvjfcis1`)
* **Evidence:**
  ```sql
  SELECT id, page_slug, section_key, title_mr, is_published, updated_at FROM page_sections WHERE id = 18;
  -- ID 18 | about | about_sec_mvjfcis1 | Title: vcvc | Pub: 1 | 2026-10-22 16:24:58
  ```
* **Impact:** Proves the Admin CMS is actively functional; created during testing of section creation.
* **Proposed Fix:** Institutional administrators should review section ID 18 in the Admin Portal and either edit it with authentic content or delete it.
* **Safe to Fix Now:** Preserved without alteration (Non-destructive policy).
* **Final Status:** **Preserved in DB; Pending Admin Decision**

---

### ISSUE-05: Section `jurisdiction_nadarpur` Marked as Draft
* **Issue ID:** `ISSUE-05`
* **Severity:** **INFORMATIONAL**
* **Affected Resource:** Table `page_sections`, Record ID `4`
* **Evidence:**
  ```sql
  SELECT id, section_key, title_mr, is_published FROM page_sections WHERE id = 4;
  -- ID 4 | jurisdiction_nadarpur | नादरपूर, कन्नड व छत्रपती संभाजीनगर | is_published: 0
  ```
* **Impact:** Section is not displayed publicly because it is set to draft (`is_published = 0`). Note that working area information is also displayed via `workingAreaCards` in `AboutView.tsx`.
* **Proposed Fix:** Verify in Admin CMS whether administrators wish to toggle ID 4 to published or keep it as draft.
* **Final Status:** **Verified Draft Status; Pending Admin Confirmation**

---

### ISSUE-06: Official Registration Details Require Physical Document Verification
* **Issue ID:** `ISSUE-06`
* **Severity:** **BLOCKER**
* **Affected Resource:** Table `contact_info`, Footer, Header, Documentation
* **Evidence:**
  * Database displays: `महा/२६३/०५ (धुळे)` [Maha/263/05 (Dhule)].
  * Address: `नदरपूर, ता. जि. धुळे, महाराष्ट्र` [Nadarpur, Tal. Dist. Dhule, Maharashtra].
* **Impact:** Public statutory compliance requires that displayed legal registration details match the physical registration certificate issued by the Charity Commissioner / Registrar of Societies.
* **Proposed Fix:** Compare displayed details against physical registration documents before public launch.
* **Final Status:** **Pending Physical Certificate Inspection**

---

### ISSUE-07: Automated One-Year Data Retention Schedule Disabled
* **Issue ID:** `ISSUE-07`
* **Severity:** **LOW**
* **Affected Resource:** Tables `inquiries`, `volunteers`
* **Evidence:** No automated cron or event scheduler deletes old records.
* **Impact:** Submissions are retained indefinitely until manually archived or deleted by an administrator.
* **Proposed Fix:** Retain current behavior until institutional leadership and legal advisors approve a data retention policy.
* **Final Status:** **Intentionally Retained**

---

### ISSUE-08: Production Hosting, Domain, SSL, and Backup Pipeline Unprovisioned
* **Issue ID:** `ISSUE-08`
* **Severity:** **BLOCKER**
* **Affected Resource:** Production Infrastructure
* **Evidence:** Application currently runs on local development loopback (`127.0.0.1:8088` and `localhost:5173`).
* **Impact:** Website is not accessible to the general public on the internet.
* **Proposed Fix:** Follow `docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md` once domain and server infrastructure are acquired.
* **Final Status:** **Deployment Prepared; Infrastructure Pending**

---

### ISSUE-09: Single Large JavaScript Bundle in Production Build
* **Issue ID:** `ISSUE-09`
* **Severity:** **LOW**
* **Affected Resource:** `vite.config.ts`, `dist/assets/`
* **Evidence:** Previously generated single monolithic index bundle (~920.5 kB uncompressed).
* **Fix Executed:** Configured Rollup `manualChunks` separating `vendor-react` (210.9 kB) and `vendor-icons` (24.8 kB).
* **Final Status:** **Partially Optimized (Vendor Splitting Active; Build ~445ms)**

---

### ISSUE-10: Vite 8 `__dirname` Warning in `vite.config.ts`
* **Issue ID:** `ISSUE-10`
* **Severity:** **LOW**
* **Affected Resource:** `vite.config.ts` (Line 11)
* **Evidence:** Deprecation notice: `(!) Your Vite config uses features that are unsupported by configLoader: 'native' - __dirname`.
* **Fix Executed:** Replaced `__dirname` with standard ESM `import.meta.dirname`.
* **Verification:** `npm run build` executes cleanly with zero deprecation warnings.
* **Final Status:** **RESOLVED**

