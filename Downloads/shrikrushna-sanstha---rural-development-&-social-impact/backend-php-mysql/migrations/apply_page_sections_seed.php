<?php
require_once __DIR__ . '/../config/database.php';

$db = (new Database())->getConnection();

echo "Starting additive migration for page_sections...\n";

// 1. Add image_alt_mr and image_alt_en if not exists
$cols = $db->query("DESCRIBE page_sections")->fetchAll(PDO::FETCH_COLUMN);
if (!in_array('image_alt_mr', $cols)) {
    $db->exec("ALTER TABLE page_sections ADD COLUMN image_alt_mr VARCHAR(255) NULL AFTER image_url");
    echo "Added column: image_alt_mr\n";
}
if (!in_array('image_alt_en', $cols)) {
    $db->exec("ALTER TABLE page_sections ADD COLUMN image_alt_en VARCHAR(255) NULL AFTER image_alt_mr");
    echo "Added column: image_alt_en\n";
}

// 2. Ensure site_pages has 'home' if desired
$homeExists = $db->query("SELECT COUNT(*) FROM site_pages WHERE slug = 'home'")->fetchColumn();
if (!$homeExists) {
    $insPage = $db->prepare("
        INSERT INTO site_pages (slug, title_mr, title_en, meta_description_mr, meta_description_en, is_published)
        VALUES ('home', 'मुख्यपृष्ठ', 'Home', 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था मुख्यपृष्ठ', 'Shrikrushna Sanstha Official Homepage', 1)
    ");
    $insPage->execute();
    echo "Added 'home' to site_pages\n";
}

// 3. Seed sections if page_sections is currently empty
$existingCount = $db->query("SELECT COUNT(*) FROM page_sections")->fetchColumn();
if ($existingCount == 0) {
    echo "Seeding initial authentic sections into page_sections...\n";
    $stmt = $db->prepare("
        INSERT INTO page_sections 
        (page_slug, section_key, title_mr, title_en, subtitle_mr, subtitle_en, content_mr, content_en, image_url, image_alt_mr, image_alt_en, display_order, is_published)
        VALUES 
        (:page_slug, :section_key, :title_mr, :title_en, :subtitle_mr, :subtitle_en, :content_mr, :content_en, :image_url, :image_alt_mr, :image_alt_en, :display_order, :is_published)
    ");

    $sections = [
        // ABOUT PAGE SECTIONS
        [
            'page_slug' => 'about',
            'section_key' => 'intro_genesis',
            'title_mr' => 'निष्पक्ष समाजकार्य, सांस्कृतिक संवर्धन आणि ग्रामीण स्वावलंबनाचा वसा',
            'title_en' => 'Non-Partisan Social Service, Cultural Preservation & Grassroots Empowerment',
            'subtitle_mr' => 'प्रस्तावना व पार्श्वभूमी',
            'subtitle_en' => 'Introduction & Genesis',
            'content_mr' => "स्वातंत्र्यपूर्व काळात देशाचे संपूर्ण स्वातंत्र्य हे विविध संघटनांचे मुख्य ध्येय होते; परंतु स्वातंत्र्योत्तर काळात भ्रष्टाचार, बेरोजगारी, महिलांवरील अत्याचार, पर्यावरण व प्रदूषण, शेतकरी आत्महत्या, अनुसूचित जमातींचे प्रश्न तसेच वीज, पाणी, निवारा आणि शिक्षणाच्या गंभीर समस्या पुढे आल्या. कोणत्याही राजकीय, जातीय, धार्मिक किंवा वैचारिक वादात तटस्थ राहून व निस्वार्थ भावनेने लोककल्याणाचे कार्य करण्याच्या प्रेरणेतून नादरपूर (ता. कन्नड, जि. छत्रपती संभाजीनगर / औरंगाबाद, महाराष्ट्र) येथे ‘श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था’ स्थापन करण्यात आली.\n\nश्रीमती सविता दिलीप निकम (सचिव) यांच्या नेतृत्वाखाली समविचारी सामाजिक कार्यकर्त्यांनी एकत्र येऊन ही संस्था उभारली. सुरुवातीला कन्नड तालुक्यातील नादरपूर परिसरात सुरू झालेले कार्य पुढे छत्रपती संभाजीनगर जिल्ह्यातील विविध तालुक्यांत विस्तारले. लोकांच्या खऱ्या समस्या जाणून घेण्यासाठी संस्थेने विविध ग्रामपंचायती व गावांमध्ये ‘बेसलाईन अभ्यास’ (Baseline Studies) आणि स्थानिक समुदाय आधारित गटांशी (CBOs) समन्वय साधून कौशल्य विकास, शिक्षण, आरोग्य, उपजीविका आणि पर्यावरण संवर्धनाचे कार्य तळागाळात रुजवले आहे.",
            'content_en' => "While pre-independence movements fought for national freedom, the post-independence era brought urgent challenges including unemployment, violence against women, environmental pollution, farmer distress, tribal welfare, and access to electricity, water, housing, and education. Maintaining strict neutrality across political, ethnic, religious, or ideological lines, Shrikrushna Sanskrutik va Gramin Vikas Sanstha was established at Nadarpur, Dist. Chhatrapati Sambhajinagar (Aurangabad), Maharashtra.\n\nPromoted under the leadership of Smt. Savita Dilip Nikam (Secretary) alongside dedicated social workers, our activities began in Kannad-Nadarpur Block and expanded across multiple blocks of Chhatrapati Sambhajinagar district. By conducting baseline studies across Gram Panchayats in consultation with local villagers and Community-Based Organizations (CBOs), we focus on village empowerment, skill development, education, healthcare, livelihood generation, and urgent civic assistance.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 1,
            'is_published' => 1
        ],
        [
            'page_slug' => 'about',
            'section_key' => 'core_objective',
            'title_mr' => 'संस्थेचे मुख्य उद्दिष्ट',
            'title_en' => 'Core Institutional Objective',
            'subtitle_mr' => 'ध्येय व कार्यप्रणाली',
            'subtitle_en' => 'Objective & Methodology',
            'content_mr' => "नैसर्गिक व मानवनिर्मित आपत्तीग्रस्तांना मदत करणे, नागरिकांना त्यांच्या मूलभूत हक्कांची व पंचायत राज व्यवस्थेतील जबाबदाऱ्यांची जाणीव करून देणे, बेरोजगारांना रोजगाराच्या संधी उपलब्ध करून देणे आणि महिलांचा स्थानिक प्रशासनातील सहभाग वाढवणे.",
            'content_en' => "Assisting victims of natural and man-made disasters, educating citizens on constitutional rights and Panchayati Raj responsibilities, generating employment through skill training, and elevating women in local governance.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 2,
            'is_published' => 1
        ],
        [
            'page_slug' => 'about',
            'section_key' => 'future_roadmap',
            'title_mr' => 'भविष्यातील संकल्पित प्रकल्प',
            'title_en' => 'Future Institutional Roadmap',
            'subtitle_mr' => 'दीर्घकालीन दृष्टीकोन',
            'subtitle_en' => 'Long-term Vision',
            'content_mr' => "• ग्रामीण मुलांसाठी आदर्श शाळा व शैक्षणिक संकुलांचा विस्तार\n• एकात्मिक कौशल्य प्रशिक्षण केंद्राची (Integrated Skill Training Center) उभारणी\n• ज्येष्ठ नागरिक अभ्यास व सुसज्ज वृद्धाश्रम (Old Age Home) व आधार केंद्र",
            'content_en' => "• Expansion of model rural schools and joyful learning centers\n• Development of an Integrated Skill Training Center for rural youth & farmers\n• Establishment of a dedicated Old Age Home and Gerontology care center",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 3,
            'is_published' => 1
        ],
        [
            'page_slug' => 'about',
            'section_key' => 'jurisdiction_nadarpur',
            'title_mr' => 'नादरपूर, कन्नड व छत्रपती संभाजीनगर (औरंगाबाद)',
            'title_en' => 'Nadarpur, Kannad & Chhatrapati Sambhajinagar (Aurangabad)',
            'subtitle_mr' => 'जिल्हा व मुख्य कार्यक्षेत्र',
            'subtitle_en' => 'District & Core Base',
            'content_mr' => "इ.स. १६१० मध्ये मलिक अंबरने वसवलेले हे ऐतिहासिक शहर पुढे औरंगाबाद (छत्रपती संभाजीनगर) म्हणून ओळखले गेले. बीबी का मकबरा, १९८३ मध्ये युनेस्को (UNESCO) जागतिक वारसा घोषित झालेली अजिंठा व वेरूळ लेणी, डॉ. बाबासाहेब आंबेडकर मराठवाडा विद्यापीठ (१९५८) आणि कलात्मक हिमरू शाल व पैठणी सिल्कसाठी हा जिल्हा जगप्रसिद्ध आहे. कन्नड तालुक्यातील नादरपूर येथून सुरू झालेले संस्थेचे कार्य जिल्ह्यातील विविध तालुक्यांत व ग्रामपंचायतींमध्ये विस्तारले आहे.",
            'content_en' => "Originally founded as Khadki in 1610 by Malik Ambar, the district is home to Bibi Ka Maqbara, the UNESCO World Heritage Caves of Ajanta and Ellora (1983), Dr. Babasaheb Ambedkar Marathwada University (1958), and world-renowned artistic silk fabrics and shawls. Starting from Nadarpur in Kannad Block, our Sanstha extends across multiple blocks and Gram Panchayats in the district.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 4,
            'is_published' => 1
        ],
        [
            'page_slug' => 'about',
            'section_key' => 'jurisdiction_maharashtra',
            'title_mr' => 'महाराष्ट्र राज्य (३,०७,७१३ चौ. कि.मी.)',
            'title_en' => 'State of Maharashtra (3,07,713 sq. km)',
            'subtitle_mr' => 'राज्य कार्यक्षेत्र',
            'subtitle_en' => 'State Jurisdiction',
            'content_mr' => "भारताच्या पश्चिमेला अरबी समुद्राच्या किनाऱ्यावर वसलेले महाराष्ट्र हे क्षेत्रफळाने देशातील तिसरे मोठे राज्य आहे. औरंगाबाद (छत्रपती संभाजीनगर), अमरावती, कोकण, नागपूर, नाशिक आणि पुणे या ६ विभागांत विभागलेल्या या राज्याची लोकसंख्या ११.२३ कोटींहून अधिक (२०११ जनगणना: ११,२३,७४,३३३ — देशाच्या ९.२८%) असून औद्योगिक व सांस्कृतिक प्रगतीत महाराष्ट्राचा देशात सर्वोच्च वाटा आहे.",
            'content_en' => "Located in western India along the Arabian Sea, Maharashtra is the third-largest state covering 307,713 sq. km across 36 districts grouped into 6 divisions: Aurangabad, Amravati, Konkan, Nagpur, Nashik, and Pune. With a population of 112.37 million (9.28% of India), it is a progressive leader in industry, agriculture, and cultural arts.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 5,
            'is_published' => 1
        ],

        // PRIVACY POLICY SECTIONS
        [
            'page_slug' => 'privacy',
            'section_key' => 'data_collection',
            'title_mr' => '१. माहिती संकलन आणि वापर',
            'title_en' => '1. Information Collection & Usage',
            'subtitle_mr' => 'डेटा संकलन तत्वे',
            'subtitle_en' => 'Data Collection Principles',
            'content_mr' => "श्रीकृष्ण संस्था ही ग्रामीण विकास, शिक्षण आणि सामाजिक कल्याणासाठी काम करणारी संस्था आहे. आमच्या संकेतस्थळावर भेट देणाऱ्या नागरिकांकडून कोणताही अनावश्यक डेटा गोळा केला जात नाही. केवळ संपर्क फॉर्मद्वारे नागरिकांनी स्वतःहून दिलेले नाव, संपर्क क्रमांक व संदेश हा केवळ त्यांच्या प्रश्नांची उत्तरे देण्यासाठी वापरला जातो.",
            'content_en' => "ShriKrushna Sanstha solely collects personal information (such as name, phone number, and message) voluntarily submitted through our contact form. This information is exclusively utilized to respond to citizen inquiries, study room registrations, and welfare guidance requests.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 1,
            'is_published' => 1
        ],
        [
            'page_slug' => 'privacy',
            'section_key' => 'zero_commercial',
            'title_mr' => '२. व्यावसायिक वापरास पूर्ण मनाई',
            'title_en' => '2. Zero Commercialization Policy',
            'subtitle_mr' => 'डेटा सुरक्षा हमी',
            'subtitle_en' => 'Data Security Guarantee',
            'content_mr' => "आम्ही कोणत्याही नागरिकाचा किंवा लाभार्थीचा वैयक्तिक डेटा, मोबाईल क्रमांक किंवा ईमेल पत्ता कोणत्याही व्यावसायिक संस्थेला, जाहिरातदाराला अथवा तृतीय पक्षाला विकत नाही किंवा हस्तांतरित करत नाही.",
            'content_en' => "We strictly never sell, rent, commercialize, or lease citizen or beneficiary contact details to any third-party advertisers, financial institutions, or commercial entities.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 2,
            'is_published' => 1
        ],
        [
            'page_slug' => 'privacy',
            'section_key' => 'beneficiary_dignity',
            'title_mr' => '३. छायाचित्रे व लाभार्थी सन्मान (Beneficiary Dignity)',
            'title_en' => '3. Beneficiary Dignity & Photographic Consent',
            'subtitle_mr' => 'प्रतिष्ठा व गोपनीयता हक्क',
            'subtitle_en' => 'Dignity & Privacy Rights',
            'content_mr' => "संस्थेच्या उपक्रमांमध्ये सहभागी होणारे विद्यार्थी, महिला, ज्येष्ठ नागरिक आणि वंचित बांधवांचा मान-सन्मान राखणे हे आमचे सर्वोच्च कर्तव्य आहे:\n\n• केवळ उपक्रमाच्या सार्वजनिक दस्तऐवजीकरणासाठी आवश्यक असलेली छायाचित्रे वापरली जातात.\n• कोणत्याही लाभार्थ्याचे दारिद्र्य किंवा असहाय्यतेचे अवमानकारक प्रदर्शन करण्यास सक्त मनाई आहे.\n• बालकांचे आणि शाळकरी विद्यार्थ्यांचे छायाचित्र घेताना स्थानिक शाळा किंवा पालकांची पूर्वपरवानगी विचारात घेतली जाते.\n• कोणत्याही लाभार्थ्याला आपले छायाचित्र संकेतस्थळावरून काढून घेण्याचा पूर्ण अधिकार आहे.",
            'content_en' => "Safeguarding the dignity of rural youth, women, elders, and farming community members is our foremost institutional commitment:\n\n• Photographs are solely captured for authentic public activity documentation.\n• Sensationalized, undignified, or voyeuristic depictions of poverty or distress are strictly prohibited.\n• Parental or local school authority permission is honored when capturing student study sessions.\n• Any community participant possesses an absolute right to request the prompt removal of their photograph from our archives.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 3,
            'is_published' => 1
        ],
        [
            'page_slug' => 'privacy',
            'section_key' => 'grievance_redressal',
            'title_mr' => '४. तक्रार व निवारण',
            'title_en' => '4. Grievance Redressal',
            'subtitle_mr' => 'संपर्क व निराकरण',
            'subtitle_en' => 'Contact & Resolution',
            'content_mr' => "गोपनीयता किंवा छायाचित्रांसंबंधी कोणतीही तक्रार असल्यास आपण आमच्या संपर्क पृष्ठावरून किंवा थेट कार्यालयात संपर्क साधू शकता.",
            'content_en' => "For any privacy-related questions, photograph removal requests, or clarifications, please submit your notice via our Contact Form or visit our administrative office.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 4,
            'is_published' => 1
        ],

        // WORK PILLARS (HOMEPAGE & OUR WORK)
        [
            'page_slug' => 'work',
            'section_key' => 'pillar_education',
            'title_mr' => 'CSC बाल विद्यालय, मॉडेल लॅब व RTE २५%',
            'title_en' => 'CSC Bal Vidyalaya, Model Lab & RTE 25%',
            'subtitle_mr' => '१. शिक्षण व RTE अभियान',
            'subtitle_en' => '1. Inclusive Education & RTE',
            'content_mr' => "खेळातून आनंददायी शिक्षण (Laugh, Play, Enjoy), अक्षर-अंक-आकार-रंग मॉडेल लॅब, ६०%-८०% शाळांत SMC मासिक बैठका व आर.टी.ई. मित्र अभियान.",
            'content_en' => "Joyful game-based learning, Model Lab for Alphabets/Numbers/Shapes/Colors, monthly SMC meetings across 60%–80% schools, and RTE Friends.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 1,
            'is_published' => 1
        ],
        [
            'page_slug' => 'work',
            'section_key' => 'pillar_schemes',
            'title_mr' => 'शासकीय योजनांचा नागरिकांना थेट लाभ',
            'title_en' => 'Direct Benefit of Government Schemes',
            'subtitle_mr' => '२. शासकीय योजना जनजागृती',
            'subtitle_en' => '2. Government Welfare Schemes',
            'content_mr' => "बायोमेट्रिक आधार, संजय गांधी निराधार, श्रावणबाळ, इंदिरा गांधी पेन्शन, ई-श्रम कार्ड, हस्तकला कारागीर कार्ड व शेतकरी समृद्धी योजना मार्गदर्शन.",
            'content_en' => "Facilitating Biometric Aadhaar, Sanjay Gandhi Niradhar, Shravanbal, Indira Gandhi Pensions, e-Shram, Artisan Card, and Farmer Prosperity Schemes.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 2,
            'is_published' => 1
        ],
        [
            'page_slug' => 'work',
            'section_key' => 'pillar_health',
            'title_mr' => 'आरोग्य शिबिरे, योग व कोविड-१९ अन्न सुरक्षा',
            'title_en' => 'Medical Camps, Yoga & Food Security',
            'subtitle_mr' => '३. आरोग्य व अन्न सुरक्षा',
            'subtitle_en' => '3. Healthcare & Food Security',
            'content_mr' => "‘आरोग्य हीच खरी संपत्ती’ या ब्रीदाने तज्ज्ञ डॉक्टरांमार्फत नेत्र, रक्तदाब, शुगर तपासणी, व्यसनमुक्ती, योग-प्राणायाम व ग्रामीण अन्नधान्य वाटप.",
            'content_en' => "Guided by \"Health is Wealth\", conducting Eye, BP, and Sugar check-ups, de-addiction & yoga camps, and rural food security distribution.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 3,
            'is_published' => 1
        ],
        [
            'page_slug' => 'work',
            'section_key' => 'pillar_environment',
            'title_mr' => 'पर्यावरण संवर्धन व औषधी वृक्षारोपण',
            'title_en' => 'Environment & Medicinal Plantation',
            'subtitle_mr' => '४. पर्यावरण व वृक्षारोपण',
            'subtitle_en' => '4. Environment & Plantation',
            'content_mr' => "प्राणवायू, पर्जन्यमान संतुलन व मानसिक तणाव मुक्तीसाठी कोरफड, तुळस, कडुलिंब, आवळा व देवदार यांसारख्या औषधी व देशी वृक्षांची लागवड.",
            'content_en' => "Planting medicinal & native trees (Aloe, Basil, Neem, Cedar, Ash) for oxygen balance, rainfall conservation, herbal remedies, and stress relief.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 4,
            'is_published' => 1
        ],
        [
            'page_slug' => 'work',
            'section_key' => 'pillar_empowerment',
            'title_mr' => 'महिला सक्षमीकरण, ज्येष्ठ नागरिक व शेतकरी कौशल्य',
            'title_en' => 'Women, Gerontology Care & Agri-Skills',
            'subtitle_mr' => '५. महिला, ज्येष्ठ नागरिक व शेतकरी',
            'subtitle_en' => '5. Women, Elders & Farmers',
            'content_mr' => "महिलांचा पंचायत राज व निर्णय प्रक्रियेत सहभाग, सूक्ष्म बचत, ज्येष्ठ नागरिक कल्याण (Gerontology) आणि शेतकऱ्यांसाठी आधुनिक कृषी उद्योजकता कार्यशाळा.",
            'content_en' => "Women’s Panchayat leadership & micro-savings, Gerontology elder care, and modern agri-tech & cottage industry training for smallholder farmers.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 5,
            'is_published' => 1
        ],
        [
            'page_slug' => 'work',
            'section_key' => 'pillar_culture',
            'title_mr' => 'श्रीकृष्ण संगीत केंद्र व सांस्कृतिक कला संवर्धन',
            'title_en' => 'Shrikrishna Music Center & Cultural Arts',
            'subtitle_mr' => '६. संस्कृती व कला संवर्धन',
            'subtitle_en' => '6. Cultural Heritage & Arts',
            'content_mr' => "नादरपूर येथे श्रीकृष्ण संगीत प्रशिक्षण केंद्राद्वारे गायन, वादन, नाट्य व ग्रामीण लोककलाकारांना प्रोत्साहन आणि आपत्ती काळात निस्वार्थ समाजसेवा.",
            'content_en' => "Promoting rural artists and traditional arts through Shrikrishna Music Training Center (music, drama, singing) and disaster relief.",
            'image_url' => null,
            'image_alt_mr' => null,
            'image_alt_en' => null,
            'display_order' => 6,
            'is_published' => 1
        ],
    ];

    foreach ($sections as $sec) {
        $stmt->execute($sec);
    }
    echo "Seeded " . count($sections) . " sections successfully!\n";
} else {
    echo "page_sections already has {$existingCount} rows. Preserving existing rows.\n";
}

echo "Migration finished successfully.\n";
