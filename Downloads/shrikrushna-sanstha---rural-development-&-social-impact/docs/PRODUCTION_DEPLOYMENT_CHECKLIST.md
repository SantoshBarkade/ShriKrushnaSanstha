# Shrikrushna Sanskrutik va Gramin Vikas Sanstha — Production Deployment Checklist
**संस्थेचे नाव:** श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर, ता. जि. धुळे (महाराष्ट्र)  
**दस्तऐवज निर्मिती दिनांक:** २२ ऑक्टोबर २०२६ (22 October 2026)  
**सद्यस्थिती वर्गीकरण (Readiness Status):** **CONDITIONALLY READY (सशर्त सज्ज)**  
**नोंद:** हे चेकलिस्ट तयार करणे म्हणजे प्रत्यक्ष उत्पादन (Production) सर्व्हरवर उपयोजन (Deploy) करण्याची परवानगी नाही. प्रत्यक्ष संस्थात्मक मंजुरी व उत्पादन पायाभूत सुविधा उपलब्ध झाल्याशिवाय प्रत्यक्ष उपयोजन केले जाऊ नये.

---

## १. पूर्वपीठिका व वर्गीकरण सारांश (Executive Summary)

श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेच्या अधिकृत संकेतस्थळाचे सर्व तांत्रिक घटक (React 19 Frontend, Vite Build System, PHP 8.4 REST API, MySQL 8.0 Database, Administrative CMS Portal, 132 Unit/Integration Tests, 9 PHP Syntax Checks, TypeScript Static Checks) स्थानिक विकास वातावरणात १००% यशस्वीपणे तपासले गेले आहेत.

तरीही, प्रत्यक्ष उत्पादन सर्व्हरवर संकेतस्थळ सार्वजनिक करण्यापूर्वी काही अपरिहार्य संस्थात्मक, कायदेशीर व होस्टिंगविषयक बाबींची पूर्तता होणे बाकी असल्याने प्रकल्पाला **"CONDITIONALLY READY" (सशर्त सज्ज)** असे वर्गीकृत करण्यात आले आहे.

---

## २. स्थानिक विकास व कोडबेसमधील सज्जता (Local Codebase Readiness)

| तपासणी घटक (Component) | अपेक्षित निकष (Criteria) | प्रत्यक्ष स्थिती (Actual Status) | पुरावा / शेरा (Evidence) |
|---|---|---|---|
| **TypeScript / Lint** | ० त्रुटी (`tsc --noEmit`) | **PASS (0 Errors)** | Exit code 0, सर्व प्रकार सुरक्षित |
| **Frontend Tests** | Vitest टेस्ट संच | **PASS (132/132)** | सर्व १३२ चाचण्या १००% उत्तीर्ण |
| **PHP Syntax** | सर्व API फाइल्सचे सिंटॅक्स | **PASS (9/9 Files)** | `php -l` कोणतीही सिंटॅक्स एरर नाही |
| **Production Build** | `npm run build` बंडल | **PASS (~388ms–739ms)** | `dist/` डिरेक्टरी यशस्वीरित्या तयार होते |
| **डेटाबेस अखंडता** | सर्व २१ टेबल्स व UTF-8 मराठी | **PASS (Preserved)** | `utf8mb4_unicode_ci`, ० डेटा लॉस |
| **अपलोड्स व मीडिया** | २४ फाइल्स सुरक्षित | **PASS (100% Preserved)** | १७ असंदर्भित फाइल्ससह सर्व सुरक्षित |
| **Reports सुरक्षितता** | अहवाल डाउनलोड हँडलिंग | **PASS (Safe UX)** | '#' ऐवजी स्पष्ट मराठी/इंग्रजी सूचना |

---

## ३. सर्व्हर व होस्टिंग पर्यावरण आवश्यकता (Hosting & Server Prerequisites)

उत्पादन सर्व्हरवर (Production Server - Linux/cPanel/VPS/Cloud) खालील किमान प्रणाली आवश्यकतांची पूर्तता असणे आवश्यक आहे:

- [ ] **ऑपरेटिंग सिस्टीम:** Linux (Ubuntu 22.04 LTS / 24.04 LTS किंवा Rocky Linux / AlmaLinux / CloudLinux cPanel)
- [ ] **वेब सर्व्हर:** Apache 2.4+ (सह `mod_rewrite`, `mod_headers`, `mod_ssl`) किंवा Nginx 1.22+
- [ ] **PHP आवृत्ती:** PHP 8.2 किंवा PHP 8.3/8.4
  - [ ] आवश्यक एक्स्टेन्शन्स: `pdo_mysql`, `mbstring`, `json`, `fileinfo`, `openssl`, `curl`
  - [ ] `php.ini` सेटिंग्ज:
    - `display_errors = Off` (उत्पादन वातावरणात संवेदनशील माहिती उघड होऊ नये म्हणून सक्तीने बंद)
    - `log_errors = On`
    - `error_log = /var/log/php_errors.log` (सुरक्षित लॉग पाथ)
    - `upload_max_filesize = 16M`
    - `post_max_size = 20M`
    - `memory_limit = 256M`
    - `max_execution_time = 60`
    - `session.cookie_httponly = 1`
    - `session.cookie_secure = 1` (HTTPS वर)
- [ ] **डेटाबेस सर्व्हर:** MySQL 8.0+ किंवा MariaDB 10.6+
  - [ ] डीफॉल्ट कॅरेक्टर सेट: `utf8mb4`
  - [ ] डीफॉल्ट कोलेशन: `utf8mb4_unicode_ci`

---

## ४. डोमेन, DNS व SSL सुरक्षा (Domain, DNS & HTTPS Configuration)

- [ ] **डोमेन नोंदणी (Domain Registration):**
  - अधिकृत डोमेन (उदा. `shrikrushnasanstha.org` किंवा संस्थेने ठरवलेले डोमेन) नोंदणीकृत असणे.
- [ ] **DNS रेकॉर्ड्स (DNS Mapping):**
  - `A` Record: `@` -> उत्पादन सर्व्हरचा सार्वजनिक आयपी (Public IP)
  - `CNAME` Record: `www` -> मुख्य डोमेन
  - योग्य TTL (उदा. ३००-३६०० सेकंद) सेट करणे.
- [ ] **SSL / TLS प्रमाणपत्र (HTTPS Certificate):**
  - Let's Encrypt किंवा कमर्शियल SSL प्रमाणपत्र स्थापित करणे.
  - Certbot स्वयंचलित नूतनीकरण (Auto-renewal cron) तपासणे.
  - HTTP वरून HTTPS कडे कायमस्वरूपी (301 Permanent Redirect) सक्ती करणे:
    ```apache
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
    ```
  - **HSTS (HTTP Strict Transport Security):**
    ```apache
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
    ```

---

## ५. डेटाबेस उत्पादन सज्जता व कडक सुरक्षा (Database Hardening)

स्थानिक डेटाबेस (`shrikrushnasanstha2`) उत्पादन वातावरणात नेताना खालील सुरक्षा नियमांचे सक्तीने पालन करणे:

- [ ] **स्वतंत्र उत्पादन डेटाबेस वापरकर्ता (Dedicated DB User):**
  - कधीही `root` वापरकर्ता वापरू नये.
  - फक्त आवश्यक परवानग्या असलेला नवा वापरकर्ता तयार करणे:
    ```sql
    CREATE USER 'sk_sanstha_prod'@'localhost' IDENTIFIED BY 'अत्यंत_गुंतागुंतीचा_गुप्त_पासवर्ड';
    GRANT SELECT, INSERT, UPDATE, DELETE ON shrikrushna_prod.* TO 'sk_sanstha_prod'@'localhost';
    FLUSH PRIVILEGES;
    ```
- [ ] **रिमोट ॲक्सेस निर्बंध (Restrict Host Access):**
  - डेटाबेस पोर्ट `3306` बाहेरील जगासाठी (Public Internet) पूर्णपणे ब्लॉक असणे (फायरवॉल UFW / iptables). फक्त `localhost` ला परवानगी असावी.
- [ ] **उत्पादन संरचना आयात (Production Migration):**
  - `backup_shrikrushnasanstha2_pre_phase2.sql` किंवा अद्ययावत प्रमाणित डंप वापरून `utf8mb4` सह टेबल आयात करणे.
  - आयात झाल्यावर सर्व २१ टेबल्स, फॉरेन कीज आणि युनिक इंडेक्स तपासणे.
- [ ] **क्रेडेंशियल सुरक्षितता:**
  - `backend-php-mysql/config/database.php` मध्ये उत्पादन डेटाबेस नाव, वापरकर्ता आणि पासवर्ड सेट करणे.
  - ही फाइल सर्व्हरवर `chmod 600` किंवा `chmod 640` ठेवून सुरक्षित करणे (इतर वापरकर्त्यांना वाचता येऊ नये).

---

## ६. बॅकएंड व API उत्पादन कडक सुरक्षा (Backend & API Hardening)

- [ ] **CORS ओरिजिन मर्यादित करणे:**
  - `backend-php-mysql/api/auth.php` व `content.php` मध्ये CORS फक्त अधिकृत डोमेनसाठीच अनुमत करणे:
    ```php
    $allowed_origins = [
        'https://shrikrushnasanstha.org',
        'https://www.shrikrushnasanstha.org'
    ];
    ```
  - स्थानिक `http://localhost:5173` उत्पादन कोडमधून काढून टाकणे किंवा पर्यावरण व्हेरिएबलवर आधारित ठेवणे.
- [ ] **त्रुटी लपवणे (Suppression of Fatal/Error Traces):**
  - क्लायंटला कधीही SQL क्वेरी किंवा स्टॅक ट्रेस दिसणार नाही याची खात्री करणे. जेनेरिक JSON संदेश देणे: `{"success": false, "error": "Internal server error"}`.
- [ ] **लॉगिन मर्यादा व दर नियंत्रण (Rate Limiting):**
  - `login_attempts` टेबल कार्यरत राहून IP-आधारित (५ प्रयत्न / १५ मिनिटे) व युझरनेम-आधारित (१५ प्रयत्न / १५ मिनिटे) ब्लॉक कार्यक्षम असणे.
- [ ] **टोकन सुरक्षितता:**
  - ८ तासांची मर्यादा व SHA-256 हॅशिंग उत्पादन वातावरणात कार्यरत असणे.
- [ ] **अपलोड्स डिरेक्टरी सुरक्षा:**
  - `backend-php-mysql/uploads/.htaccess` फाइल प्रत्यक्ष सर्व्हरवर अस्तित्वात असणे व त्यात खालील नियम सक्रिय असणे:
    ```apache
    # PHP व स्क्रिप्ट एक्झिक्युशन पूर्णपणे बंद
    <FilesMatch "\.(php|php3|php4|php5|phtml|pl|py|cgi|sh|bash)$">
        Require all denied
    </FilesMatch>
    Options -ExecCGI -Indexes
    ```

---

## ७. फ्रंटएंड डिप्लॉयमेंट व सिंगल पेज ॲप (SPA) राऊटिंग

- [ ] **उत्पादन बंडल निर्मिती:**
  - `npm run build` चालवून अद्ययावत `dist/` डिरेक्टरी तयार करणे.
- [ ] **स्टॅटिक फाइल्स होस्टिंग:**
  - `dist/` मधील फाइल्स वेब सर्व्हरच्या डॉक्युमेंट रूटमध्ये (उदा. `/var/www/html` किंवा `public_html/`) ठेवणे.
- [ ] **SPA फॉलबॅक राऊटिंग (Apache / Nginx):**
  - युझरने `/about`, `/events`, `/admin` अशा पाथवर थेट रिफ्रेश केल्यास 404 येऊ नये म्हणून खालील `.htaccess` रूटमध्ये ठेवणे:
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteRule . /index.html [L]
    </IfModule>
    ```
- [ ] **कॅशिंग धोरण (HTTP Caching Headers):**
  - `assets/*.js`, `assets/*.css` (ज्यांच्या नावात हॅश आहे) साठी `Cache-Control: public, max-age=31536000, immutable` सेट करणे.
  - `index.html` साठी `Cache-Control: no-cache, no-store, must-revalidate` सेट करणे.

---

## ८. स्वयंचलित बॅकअप व पुनर्प्राप्ती धोरण (Automated Backup & Recovery Strategy)

- [ ] **स्वयंचलित दैनिक डेटाबेस बॅकअप (Daily Cron Job):**
  - मध्यरात्री २:०० वाजता स्वयंचलित बॅकअप घेणारा शेल स्क्रिप्ट कार्यान्वित करणे:
    ```bash
    #!/bin/bash
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="/var/backups/shrikrushna/db"
    mkdir -p $BACKUP_DIR
    mysqldump -u sk_sanstha_prod -p'गुप्त_पासवर्ड' --single-transaction --quick shrikrushna_prod | gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz
    # ३० दिवसांपेक्षा जुने बॅकअप काढून टाकणे
    find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
    ```
- [ ] **अपलोड केलेल्या मीडिया फाइल्सचा बॅकअप:**
  - आठवड्यातून एकदा `uploads/` डिरेक्टरीचा टॅरबॉल (`tar.gz`) तयार करणे.
- [ ] **ऑफ-साइट किंवा सुरक्षित दुय्यम साठवणूक (Off-site Storage):**
  - सर्व्हर क्रॅश झाल्यास सुरक्षित पुनर्प्राप्तीसाठी बॅकअप बाह्य सुरक्षित क्लाउड/स्टोरेजवर पाठवणे.
- [ ] **पुनर्प्राप्ती चाचणी (Dry-run Restore Test):**
  - डिप्लॉयमेंटपूर्वी बॅकअप फाइल डमी डेटाबेसमध्ये रिस्टोअर करून डेटा योग्यरित्या परत येतो का याची खात्री करणे.

---

## ९. संस्थात्मक सामग्री मंजुरी गेट (Institutional Content & Legal Gate)

**प्रत्यक्ष सार्वजनिक लाँचपूर्वी संस्थेच्या पदाधिकाऱ्यांकडून खालील स्वाक्षरी/मंजुरी आवश्यक आहे:**

| मंजुरी बाब (Approval Item) | सद्यस्थिती (Current State) | आवश्यक कारवाई (Required Action) | स्वाक्षरी / स्थिती |
|---|---|---|---|
| **अधिकृत नोंदणी क्रमांक** | `महा/२६३/०५ (धुळे)` | मूळ नोंदणी प्रमाणपत्राशी पडताळणी | [ ] प्रलंबित |
| **संस्थेचे अधिकृत नाव** | श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था | अधिकृत लेटरहेड/दस्तऐवजाशी पडताळणी | [ ] प्रलंबित |
| **कार्यालयाचा अधिकृत पत्ता** | मु. पो. नदरपूर, ता. जि. धुळे, ४२४००२ | अधिकृत पत्त्याशी पडताळणी | [ ] प्रलंबित |
| **पदाधिकारी सूची व हुद्दे** | ६ पदाधिकारी (अध्यक्ष, सचिव, इ.) | विद्यमान कार्यकारिणीशी जुळणी | [ ] प्रलंबित |
| **वृक्षारोपण उपक्रम माहिती** | `evt-1792622428974` मधील `"sdsd"` | खरी मराठी/इंग्रजी माहिती भरणे | [ ] प्रलंबित |
| **अधिकृत अहवाल (PDFs)** | ३ अहवालांना '#' लिंक | मूळ स्वाक्षरीत अहवाल अपलोड करणे | [ ] प्रलंबित |
| **व्यक्तींचे फोटो व संमती** | १७ असंदर्भित छायाचित्रे | फोटोतील व्यक्तींची संमती घेणे | [ ] प्रलंबित |
| **CMS चाचणी सेक्शन १८** | `about_sec_mvjfcis1` (`vcvc`) | हे सेक्शन हटवायचे की अपडेट करायचे? | [ ] प्रलंबित |

---

## १०. गो-लाइव्ह प्रत्यक्ष अंमलबजावणी क्रम (Go-Live Step-by-Step Runbook)

### टप्पा १: लाँचपूर्व पूर्वतयारी (T-minus 2 Days)
1. डोमेन व DNS प्रोपेगेशन पूर्ण झाल्याची खात्री करणे.
2. उत्पादन सर्व्हरवर Linux, Apache/Nginx, PHP 8.2+, MySQL 8.0+ सज्ज ठेवणे.
3. संस्थेकडून वरील घटक क्रमांक ९ मधील सर्व सामग्रीची अंतिम लेखी मंजुरी घेणे.
4. अंतिम मंजुरीनुसार वृक्षारोपण कार्यक्रमाची खरी माहिती व अहवालांच्या मूळ PDF फाईल्स गोळा करणे.

### टप्पा २: डिप्लॉयमेंट रात्र (Launch Night - Maintenance Window)
1. स्थानिक विकास वातावरणाचा अंतिम संपूर्ण डेटाबेस बॅकअप घेणे (`mysqldump`).
2. उत्पादन सर्व्हरवर डेटाबेस तयार करणे व `backup_shrikrushnasanstha2_pre_phase2.sql` आयात करणे.
3. संस्थात्मक मंजुरीनुसार माहिती अपडेट करणे (`events`, `reports`).
4. फ्रंटएंडचा `npm run build` चालवून `dist/` उत्पादन सर्व्हरच्या वेब रूटवर अपलोड करणे.
5. बॅकएंड `backend-php-mysql/` अपलोड करणे (डेटाबेस क्रेडेंशियल्स उत्पादन सर्व्हरनुसार सेट करणे).
6. उत्पादन सर्व्हरवर `uploads/` डिरेक्टरी कॉपी करणे व सुरक्षित परवानग्या (`chmod 755`, फाइल्स `chmod 644`) सेट करणे.
7. Let's Encrypt SSL सक्रिय करणे (`certbot --apache` किंवा `--nginx`).

### टप्पा ३: लाँचोत्तर तांत्रिक पडताळणी (Post-Launch Sanity Checks - T+0)
- [ ] मुख्य पृष्ठ (Home) व्यवस्थित उघडते का?
- [ ] सर्व दुवे (About, Work, Schemes, Events, Gallery, Reports, Contact, Volunteer) कार्यरत आहेत का?
- [ ] मराठी युनिकोड अक्षरे (Devanagari) सुवाच्य आणि बिनचूक दिसतात का?
- [ ] मोबाईल, टॅबलेट आणि लॅपटॉपवर रिस्पॉन्सिव्ह डिझाइन व्यवस्थित दिसते का?
- [ ] संपर्क फॉर्म (Contact Form) भरून चाचणी घेणे (डेटाबेसमध्ये नोंद होते का?).
- [ ] स्वयंसेवक अर्ज (Volunteer Registration) सबमिट करून चाचणी घेणे.
- [ ] ॲडमिन पॅनेलवर (`/admin`) सुरक्षित लॉगिन होते का?
- [ ] ॲडमिन पॅनेलमधून एखादी चाचणी बातमी/अनाउन्समेंट बदलून मुख्य पृष्ठावर दिसते का?
- [ ] चुकीचा पासवर्ड टाकल्यास रेट-लिमिटिंग कार्य करते का?
- [ ] सर्च इंजिनसाठी `robots.txt` व `sitemap.xml` सुलभ आहेत का?

### टप्पा ४: आणीबाणी परत फिरण्याची योजना (Emergency Rollback Plan)
जर लाँच दरम्यान एखादी गंभीर त्रुटी (उदा. डेटाबेस भ्रष्ट होणे, गंभीर सुरक्षा त्रुटी, होस्टिंग क्रॅश) उद्भवली:
1. तात्पुरते `Under Maintenance` (देखभाल चालू आहे) चे स्टॅटिक HTML पान सक्रिय करणे.
2. उत्पादन डेटाबेस ड्रॉप करून मूळ बॅकअपवरून रिस्टोअर करणे.
3. एरर लॉग्ज (`/var/log/apache2/error.log` किंवा `/var/log/nginx/error.log` आणि PHP एरर लॉग) तपासणे.
4. त्रुटी स्थानिक चाचणी वातावरणात सोडवून पुन्हा पडताळणी करणे.

---

## ११. स्वाक्षरी व अधिकृत मंजुरी तक्ता (Sign-off & Authority Matrix)

| पद / भूमिका | नाव | मंजुरी शेरा | दिनांक व स्वाक्षरी |
|---|---|---|---|
| **तांत्रिक सल्लागार / अभियंता** | Antigravity AI Engineer | तांत्रिकदृष्ट्या सर्व चाचण्या १००% उत्तीर्ण, प्रणाली सशर्त सज्ज | २२-१०-२०२६ (Verified) |
| **संस्था अध्यक्ष / सचिव** | अधिकृत प्रतिनिधी | [ ] लाँचसाठी मंजूर / [ ] नामंजूर | ____________________ |
| **प्रकल्प व्यवस्थापक** | नियुक्त प्रतिनिधी | [ ] सामग्री पडताळणी पूर्ण | ____________________ |

---
**दस्तऐवज समाप्ती — श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर**
