# श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर
# Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur

> **नोंदणी क्र. (Registration No.):** महा/२६३/०५ (धुळे) [Maha/263/05 (Dhule)]  
> **पत्ता (Address):** नदरपूर, ता. जि. धुळे (महाराष्ट्र) / Nadarpur, Tal. Dist. Dhule (Maharashtra)  
> **कार्यक्षेत्र (Mission & Focus):** ग्रामीण विकास, शेतकरी सहाय्य, शिक्षण, आरोग्य, महिला सबलीकरण, जलसंधारण, पर्यावरण व जनकल्याणकारी योजना.

---

## 1. तंत्रज्ञान संरचना (Technology Stack)

* **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons.
* **Backend:** PHP 8.4 / 8.5 REST API, PDO with Native Prepared Statements.
* **Database:** MySQL 8.0 / MariaDB (`utf8mb4_unicode_ci`, 21 tables).
* **Architecture:** Decoupled Single Page Application (SPA) with secure Bearer Token authentication and resilient offline fallback.

---

## 2. पूर्वतयारी (Prerequisites)

1. **Node.js:** v18.0.0 किंवा अधिक (v20+ शिफारसित).
2. **PHP:** v8.2+ (PDO MySQL, mbstring, fileinfo, gd विस्तार सक्षम असावेत).
3. **MySQL / MariaDB:** v8.0+ किंवा MariaDB 10.4+.

---

## 3. पर्यावरण संरचना (Environment Configuration)

1. **बॅकएंड डेटाबेस कॉन्फिगरेशन:**
   `backend-php-mysql/.env` फाइल तयार करा (किंवा `.env.example` कॉपी करा):
   ```ini
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=shrikrushnasanstha2
   DB_USER=root
   DB_PASS=आपला_डेटाबेस_पासवर्ड
   DB_CHARSET=utf8mb4
   ```
2. **फ्रंटएंड कॉन्फिगरेशन (पर्यायी):**
   `vite.config.ts` मध्ये डीफॉल्टनुसार `/backend-php-mysql` या विनंत्या स्थानिक `http://127.0.0.1:8088` वर प्रॉक्सी केल्या जातात.

---

## 4. स्थानिक पातळीवर सुरू करणे (Running Locally)

### पायरी १: PHP बॅकएंड सर्व्हर सुरू करा (Port 8088)
प्रकल्प डिरेक्टरीमध्ये टर्मिनल उघडा:
```powershell
php -S 127.0.0.1:8088 -t .
```

### पायरी २: फ्रंटएंड डेव्हलपमेंट सर्व्हर सुरू करा (Port 5173)
दुसऱ्या टर्मिनलमध्ये:
```powershell
npm install
npm run dev
```
ब्राउझरमध्ये `http://localhost:5173/` उघडा.

---

## 5. चाचण्या व उत्पादन बिल्ड (Testing & Build)

* **सर्व स्वयंचलित चाचण्या चालवणे:**
  ```powershell
  npm test
  ```
  *(१३२ युनिट व इंटिग्रेशन चाचण्या १००% उत्तीर्ण).*

* **टाइपस्क्रिप्ट कंपायलर तपासणी (Type Check):**
  ```powershell
  npm run lint
  ```

* **प्रॉडक्शन बंडल तयार करणे (Production Build):**
  ```powershell
  npm run build
  ```
  *(उत्पादन फाइल्स `dist/` डिरेक्टरीमध्ये तयार होतात).*

---

## 6. दस्तऐवजीकरण दुवे (Documentation Links)

* 📘 [व्यवस्थापक वापरकर्ता मार्गदर्शिका (Admin User Guide)](docs/ADMIN_USER_GUIDE.md) — ॲडमिन पोर्टल वापर, द्विभाषिक संपादन, व मीडिया लायब्ररी मार्गदर्शक.
* 🗄️ [डेटाबेस व मायग्रेशन मार्गदर्शिका (Database & Migrations Guide)](docs/DATABASE_AND_MIGRATIONS.md) — २१ टेबल्स रचना, बॅकअप व रिस्टोअर पद्धती.
* 🔒 [सुरक्षितता व देखभाल मार्गदर्शिका (Security & Maintenance Guide)](docs/SECURITY_AND_MAINTENANCE.md) — ऑथेंटिकेशन, रेट लिमिटिंग व प्रॉडक्शन चेकलिस्ट.
* 📊 [मास्टर ऑडिट व हस्तांतरण अहवाल (Master Audit Report)](C:/Users/Santosh/.gemini/antigravity-ide/brain/de16229d-9b2d-4bac-b922-2802f7de1ff3/master_audit_report.md) — टप्पे १ ते ६ चा सर्वसमावेशक तांत्रिक अहवाल.

---
*श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नदरपूर.*
