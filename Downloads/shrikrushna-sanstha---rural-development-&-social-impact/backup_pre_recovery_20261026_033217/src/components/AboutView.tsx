import React, { useRef, useMemo } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { useCountUp } from '../utils/useCountUp';
import {
  ShieldCheck,
  Target,
  Eye,
  Award,
  MapPin,
  BookOpen,
  Music,
  Stethoscope,
  Sprout,
  Users,
  Landmark,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Phone,
  FileCheck2,
  HeartHandshake,
  Compass,
  Sparkles,
} from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'motion/react';

// Memoized Stat Counter Item: isolates rAF count-up re-renders from the main page
interface StatItemProps {
  targetValue: number;
  duration: number;
  isStarted: boolean;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  accentColor: string;
}

const StatItem: React.FC<StatItemProps> = React.memo(
  ({ targetValue, duration, isStarted, label, icon: Icon, gradient, accentColor }) => {
    const count = useCountUp(targetValue, duration, isStarted);

    return (
      <div className="flex items-start gap-3.5 sm:gap-4">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${gradient} flex items-center justify-center shrink-0 shadow-lg text-white`}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight text-white flex items-baseline">
            <span>{count}</span>
            <span className={`${accentColor} ml-0.5`}>+</span>
          </div>
          <p className="text-xs sm:text-[13px] text-slate-300 font-sans leading-snug mt-1">
            {label}
          </p>
        </div>
      </div>
    );
  }
);
StatItem.displayName = 'StatItem';

export const AboutView: React.FC = () => {
  const { setCurrentRoute, setSelectedInitiativeId, lang, t, state, siteSettings } = useSanstha();
  const shouldReduceMotion = useReducedMotion();

  // InView detection for stats counter
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsSectionRef, { once: true, margin: '-50px' });

  // Dynamic Page metadata from CMS/Database (site_pages table)
  const aboutPage = useMemo(
    () => (state.sitePages || []).find((p) => p.slug === 'about'),
    [state.sitePages]
  );

  // Dynamic institutional settings from CMS/Database (site_settings table)
  const sansthaTagline = siteSettings?.sanstha_tagline?.[lang];
  const heroBadge = siteSettings?.hero_badge?.[lang];

  // Dynamic counts incorporating live database items
  const targetBeneficiaries = 5000;
  const targetInitiatives = useMemo(
    () => Math.max(25, (state.initiatives || []).filter((i) => i.published !== false).length),
    [state.initiatives]
  );
  const targetVillages = 12;
  const targetSchemes = useMemo(
    () => Math.max(10, (state.governmentSchemes || []).filter((s) => s.published !== false).length),
    [state.governmentSchemes]
  );

  // Dynamic CMS sections if configured in Admin Portal / Database
  const dynamicAboutSections = useMemo(
    () =>
      (state.pageSections || [])
        .filter((s) => s.pageSlug === 'about' && s.isPublished)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [state.pageSections]
  );

  // Work pillar sections configured in Admin Portal / Database (page_sections with page_slug = 'work')
  const workPillars = useMemo(
    () => (state.pageSections || []).filter((s) => s.pageSlug === 'work' && s.isPublished),
    [state.pageSections]
  );
  const eduSection = useMemo(() => workPillars.find((s) => s.sectionKey === 'pillar_education'), [workPillars]);
  const cultureSection = useMemo(() => workPillars.find((s) => s.sectionKey === 'pillar_culture'), [workPillars]);
  const healthSection = useMemo(() => workPillars.find((s) => s.sectionKey === 'pillar_health'), [workPillars]);
  const schemesSection = useMemo(() => workPillars.find((s) => s.sectionKey === 'pillar_schemes'), [workPillars]);
  const envSection = useMemo(() => workPillars.find((s) => s.sectionKey === 'pillar_environment'), [workPillars]);
  const empSection = useMemo(() => workPillars.find((s) => s.sectionKey === 'pillar_empowerment'), [workPillars]);

  // Match known keys from DB schema / CMS
  const introSection = useMemo(
    () => dynamicAboutSections.find((s) => s.sectionKey === 'intro_genesis' || s.sectionKey === 'about_intro'),
    [dynamicAboutSections]
  );
  const objectivesSection = useMemo(
    () => dynamicAboutSections.find((s) => s.sectionKey === 'core_objective' || s.sectionKey === 'about_objectives'),
    [dynamicAboutSections]
  );
  const roadmapSection = useMemo(
    () => dynamicAboutSections.find((s) => s.sectionKey === 'future_roadmap' || s.sectionKey === 'about_future_vision'),
    [dynamicAboutSections]
  );
  const jurisdictionSection = useMemo(
    () => dynamicAboutSections.find((s) => s.sectionKey === 'jurisdiction_nadarpur'),
    [dynamicAboutSections]
  );
  const additionalAboutSections = useMemo(
    () =>
      dynamicAboutSections.filter(
        (s) =>
          ![
            'intro_genesis',
            'about_intro',
            'core_objective',
            'about_objectives',
            'future_roadmap',
            'about_future_vision',
            'jurisdiction_nadarpur',
          ].includes(s.sectionKey)
      ),
    [dynamicAboutSections]
  );

  // Live officials from CMS/Database (officials table)
  const secretary = useMemo(
    () =>
      (state.officials || []).find(
        (o) => o.role?.includes('सचिव') || o.roleEn?.toLowerCase().includes('secretary')
      ) || state.officials?.[0],
    [state.officials]
  );

  const president = useMemo(
    () =>
      (state.officials || []).find(
        (o) => o.role?.includes('अध्यक्ष') || o.roleEn?.toLowerCase().includes('president')
      ),
    [state.officials]
  );

  // Verified registration & leadership strings from contact_info table in MySQL
  const regNumber = lang === 'mr'
    ? (state.contactInfo?.regNoMr || 'रजि. क्र.: एक १४६६८ (औ)')
    : (state.contactInfo?.regNoEn || 'Reg. No.: Ek 14668 (A)');

  const secretaryDisplayName = lang === 'mr'
    ? (secretary?.name || state.contactInfo?.secretaryNameMr || 'श्रीमती सविता दिलीप निकम')
    : (secretary?.nameEn || secretary?.name || state.contactInfo?.secretaryNameEn || 'Smt. Savita Dilip Nikam');

  const presidentDisplayName = lang === 'mr'
    ? (president?.name || 'श्री. दिलीप निकम')
    : (president?.nameEn || president?.name || 'Shri. Dilip Nikam');

  // Clean any leading markdown relics or formatting
  const sanitizeText = (text: string) => text.replace(/^[#\s]+/, '').trim();

  const handleNav = (route: Parameters<typeof setCurrentRoute>[0]) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePillarInitiative = (initiativeId?: string) => {
    setSelectedInitiativeId(initiativeId || null);
    handleNav('initiatives');
  };

  const workingAreaCards = useMemo(() => [
    {
      badge: jurisdictionSection
        ? (lang === 'mr' ? jurisdictionSection.subtitleMr : jurisdictionSection.subtitleEn || jurisdictionSection.subtitleMr)
        : (lang === 'mr' ? 'जिल्हा व मुख्य कार्यक्षेत्र' : 'District & Core Base'),
      title: jurisdictionSection
        ? (lang === 'mr' ? jurisdictionSection.titleMr : jurisdictionSection.titleEn || jurisdictionSection.titleMr)
        : (lang === 'mr' ? 'नादरपूर, कन्नड व छत्रपती संभाजीनगर' : 'Nadarpur, Kannad & Chhatrapati Sambhajinagar'),
      subtitle: lang === 'mr' ? 'ऐतिहासिक, शैक्षणिक व सांस्कृतिक केंद्र' : 'Historic, Educational & Cultural Hub',
      desc: jurisdictionSection
        ? sanitizeText(lang === 'mr' ? jurisdictionSection.contentMr : jurisdictionSection.contentEn || jurisdictionSection.contentMr)
        : (lang === 'mr'
          ? 'इ.स. १६१० मध्ये मलिक अंबरने वसवलेले हे ऐतिहासिक शहर पुढे औरंगाबाद (छत्रपती संभाजीनगर) म्हणून ओळखले गेले. बीबी का मकबरा, १९८३ मध्ये युनेस्को (UNESCO) जागतिक वारसा घोषित झालेली अजिंठा व वेरूळ लेणी, डॉ. बाबासाहेब आंबेडकर मराठवाडा विद्यापीठ (१९५८) आणि कलात्मक हिमरू शाल व पैठणी सिल्कसाठी हा जिल्हा जगप्रसिद्ध आहे. कन्नड तालुक्यातील नादरपूर येथून सुरू झालेले संस्थेचे कार्य जिल्ह्यातील विविध तालुक्यांत व ग्रामपंचायतींमध्ये विस्तारले आहे.'
          : 'Home to Bibi Ka Maqbara, the UNESCO World Heritage Caves of Ajanta and Ellora (1983), Dr. Babasaheb Ambedkar Marathwada University (1958), and world-renowned artistic silk fabrics and shawls. Starting from Nadarpur in Kannad Block, our Sanstha extends across multiple blocks and Gram Panchayats in the district.'),
      badgeStyle: 'bg-blue-50 text-[#0868C9] border border-blue-200',
    },
    {
      badge: lang === 'mr' ? 'राज्य कार्यक्षेत्र' : 'State Jurisdiction',
      title: lang === 'mr' ? 'महाराष्ट्र राज्य (३,०७,७१३ चौ. कि.मी.)' : 'State of Maharashtra (3,07,713 sq. km)',
      subtitle: lang === 'mr' ? '३६ जिल्हे • ६ महसूल विभाग' : '36 Districts • 6 Administrative Divisions',
      desc:
        lang === 'mr'
          ? 'भारताच्या पश्चिमेला अरबी समुद्राच्या किनाऱ्यावर वसलेले महाराष्ट्र हे क्षेत्रफळाने देशातील तिसरे मोठे राज्य आहे. औरंगाबाद (छत्रपती संभाजीनगर), अमरावती, कोकण, नागपूर, नाशिक आणि पुणे या ६ विभागांत विभागलेल्या या राज्याची लोकसंख्या ११.२३ कोटींहून अधिक (२०११ जनगणना: ११,२३,७४,३३३ — देशाच्या ९.२८%) असून औद्योगिक व सांस्कृतिक प्रगतीत महाराष्ट्राचा देशात सर्वोच्च वाटा आहे.'
          : 'Located in western India along the Arabian Sea, Maharashtra is the third-largest state covering 307,713 sq. km across 36 districts grouped into 6 divisions: Aurangabad, Amravati, Konkan, Nagpur, Nashik, and Pune. With a population of 112.37 million (9.28% of India), it is a progressive leader in industry, agriculture, and cultural arts.',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    },
    {
      badge: lang === 'mr' ? 'राष्ट्रीय दृष्टीकोन' : 'National Perspective',
      title: lang === 'mr' ? 'भारत देश (३२,८७,२६३ चौ. कि.मी.)' : 'Nation — India (32,87,263 sq. km)',
      subtitle: lang === 'mr' ? 'समृद्ध सांस्कृतिक वारसा व कृषी स्वावलंबन' : 'Ancient Civilization & Socio-Economic Progress',
      desc:
        lang === 'mr'
          ? 'उत्तरेकडील हिमालयाच्या हिमाच्छादित शिखरांपासून दक्षिणेकडील उष्णकटिबंधीय पर्जन्यवनांपर्यंत आणि पूर्वेकडील बंगालच्या उपसागरापासून पश्चिमेकडील अरबी समुद्रापर्यंत पसरलेला भारत हा जगातील ७ व्या क्रमांकाचा मोठा देश आहे. स्वातंत्र्यानंतर अन्नधान्य उत्पादनात स्वयंपूर्ण बनून अंतराळ संशोधन व औद्योगिक प्रगतीसोबतच ग्रामीण लोककल्याणाची परंपरा भारताने जपली आहे.'
          : 'Extending from the snow-covered Himalayan heights to southern tropical rainforests between the Bay of Bengal and the Arabian Sea, India is the 7th largest country in the world (3,287,263 sq. km). Self-sufficient in agriculture and a global leader in science and culture, rural empowerment remains the cornerstone of national progress.',
      badgeStyle: 'bg-amber-50 text-amber-800 border border-amber-200',
    },
  ], [jurisdictionSection, lang]);

  const sixPillarsDetailed = useMemo(() => [
    {
      icon: BookOpen,
      iconColor: 'text-[#0868C9]',
      iconBg: 'bg-blue-50 border border-blue-200/60',
      initiativeId: 'init-1',
      badge: eduSection
        ? (lang === 'mr' ? eduSection.subtitleMr : eduSection.subtitleEn || eduSection.subtitleMr)
        : (lang === 'mr' ? '१. शिक्षण व RTE अभियान' : '1. Inclusive Education & RTE'),
      badgeColor: 'text-[#0868C9] bg-blue-50',
      title: eduSection
        ? (lang === 'mr' ? eduSection.titleMr : eduSection.titleEn || eduSection.titleMr)
        : (lang === 'mr' ? 'CSC बाल विद्यालय, मॉडेल लॅब व सर्व शिक्षा अभियान' : 'CSC Bal Vidyalaya, Model Lab & Sarva Shiksha Abhiyan'),
      points:
        lang === 'mr'
          ? [
              'आनंददायी शिक्षण (Laugh, Play, Enjoy): मुलांना भीतीमुक्त वातावरणात कथा, कविता, गाणी व अभिनयातून शिक्षण.',
              'मॉडेल लर्निंग लॅब (Model Lab): अक्षरे, अंक, आकार आणि रंग खेळातून शिकवणारी आधुनिक बालप्रयोगशाळा.',
              'शालेय व्यवस्थापन समिती (SMC): ६०% ते ८०% शाळांमध्ये मासिक बैठकांचे आयोजन व १००% विद्यार्थी हजेरीवर भर.',
              'आर.टी.ई. मित्र (RTE २५% प्रवेश): दुर्बल व वंचित घटकांतील बालकांना मोफत शिक्षणाचा अधिकार मिळवून देणे.',
            ]
          : [
              'Comprehensive Joyful Learning: Teaching lessons and poetry through stories, songs, and gestures.',
              'Dedicated Model Lab: Interactive game-based learning covering Alphabets, Numbers, Shapes, and Colors.',
              'School Management Committee (SMC) Drives: Targeted across schools with regular community dialogue.',
              'RTE Friends & RTE 25% Admission: Bringing underprivileged children and girls into mainstream education.',
            ],
    },
    {
      icon: Music,
      iconColor: 'text-[#E52E3D]',
      iconBg: 'bg-red-50 border border-red-200/60',
      initiativeId: 'init-3',
      badge: cultureSection
        ? (lang === 'mr' ? cultureSection.subtitleMr : cultureSection.subtitleEn || cultureSection.subtitleMr)
        : (lang === 'mr' ? '२. संस्कृती व कला संवर्धन' : '2. Cultural Heritage & Arts'),
      badgeColor: 'text-[#E52E3D] bg-red-50',
      title: cultureSection
        ? (lang === 'mr' ? cultureSection.titleMr : cultureSection.titleEn || cultureSection.titleMr)
        : (lang === 'mr' ? 'श्रीकृष्ण संगीत प्रशिक्षण केंद्र व ग्रामीण कलाकार प्रोत्साहन' : 'Shrikrishna Music Training Center & Performing Arts'),
      points:
        lang === 'mr'
          ? [
              'श्रीकृष्ण संगीत प्रशिक्षण केंद्र: ग्रामीण भागातील विद्यार्थी व नवोदित कलाकारांना शास्त्रीय व सुगम संगीत प्रशिक्षण.',
              'गायन, वादन, नाट्य व लोककला: महाराष्ट्राच्या समृद्ध सांस्कृतिक परंपरेचे जतन करण्यासाठी विविध सांस्कृतिक कार्यक्रम.',
              'स्थानिक मातीतील कलागुणांना व्यासपीठ: शारीरिक शिक्षण, योग, क्रीडा आणि सांस्कृतिक कलांचा शालेय स्तरावर विकास.',
            ]
          : [
              'Shrikrishna Music Training Center: Formal training center established at Nadarpur for rural musical talent.',
              'Music, Drama, Singing & Instrumental Arts: Cultural programs encouraging folk and classical artists.',
              'Holistic Youth Expression: Integrating cultural arts, physical education, sports, and yoga into community life.',
            ],
    },
    {
      icon: Stethoscope,
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50 border border-emerald-200/60',
      initiativeId: 'init-4',
      badge: healthSection
        ? (lang === 'mr' ? healthSection.subtitleMr : healthSection.subtitleEn || healthSection.subtitleMr)
        : (lang === 'mr' ? '३. आरोग्य व अन्न सुरक्षा' : '3. Healthcare & Food Security'),
      badgeColor: 'text-emerald-700 bg-emerald-50',
      title: healthSection
        ? (lang === 'mr' ? healthSection.titleMr : healthSection.titleEn || healthSection.titleMr)
        : (lang === 'mr' ? 'मोफत आरोग्य शिबिरे, व्यसनमुक्ती, योग व कोविड-१९ मदत' : 'Medical Camps, De-Addiction, Yoga & Relief'),
      points:
        lang === 'mr'
          ? [
              '‘आरोग्य हीच खरी संपत्ती’: महागड्या रुग्णालयीन उपचारांपासून ग्रामस्थांना दिलासा देण्यासाठी प्रतिबंधात्मक सेवा.',
              'तज्ज्ञ डॉक्टरांची आरोग्य शिबिरे: मोफत डोळ्यांची तपासणी, रक्तदाब (BP), मधुमेह (Sugar) तपासणी व औषधोपचार मार्गदर्शन.',
              'मानसिक स्वास्थ्यासाठी योग व व्यसनमुक्ती: ताणतणाव व व्यसनांवर मात करण्यासाठी नियमित शिबिरांचे आयोजन.',
              'ग्रामीण अन्न सुरक्षा मदत: आपत्कालीन परिस्थितीत गरजू कुटुंबांना मोफत सॅनिटायझर, मास्क व पोषण आहार वाटप.',
            ]
          : [
              'Guided by "Health is Wealth": Preventive wellness protecting rural families from costly medical crises.',
              'Expert Diagnostic Camps: Regular eye check-ups, BP, and blood sugar screenings led by specialist doctors.',
              'De-Addiction & Yoga Camps: Combating stress, hypertension, and addiction through lifestyle counseling.',
              'Emergency Relief & Food Security: Essential supplies and food support for underprivileged households.',
            ],
    },
    {
      icon: Landmark,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-50 border border-amber-200/60',
      initiativeId: 'init-2',
      badge: schemesSection
        ? (lang === 'mr' ? schemesSection.subtitleMr : schemesSection.subtitleEn || schemesSection.subtitleMr)
        : (lang === 'mr' ? '४. शासकीय योजना जनजागृती' : '4. Government Welfare Schemes'),
      badgeColor: 'text-amber-800 bg-amber-50',
      title: schemesSection
        ? (lang === 'mr' ? schemesSection.titleMr : schemesSection.titleEn || schemesSection.titleMr)
        : (lang === 'mr' ? 'शासकीय योजनांचा अभ्यास व तळागाळातील लाभार्थ्यांना थेट लाभ' : 'Grassroots Access to Central & State Welfare Schemes'),
      points:
        lang === 'mr'
          ? [
              'बायोमेट्रिक आधार व कामगार सुरक्षा: बायोमेट्रिक आधार कार्ड, ई-श्रम कामगार कार्ड आणि हस्तकला कारागीर कार्ड नोंदणी.',
              'सामाजिक सुरक्षा व निवृत्तीवेतन: संजय गांधी निराधार योजना, श्रावणबाळ सेवा राज्य निवृत्तीवेतन योजना व कुटुंब लाभ.',
              'राष्ट्रीय निवृत्तीवेतन योजना: वृद्धापकाळ निवृत्तीवेतन, विधवा निवृत्तीवेतन आणि दिव्यांग निवृत्तीवेतन अर्ज मार्गदर्शन.',
              'विमा व कृषी सन्मान: आम आदमी विमा योजना आणि शेतकरी समृद्धी योजनेच्या कागदपत्रांची पूर्तता करून थेट लाभ.',
            ]
          : [
              'Identity & Labor Cards: Biometric Aadhaar enrollment, e-Shram Kamgar Card, and Craftsman Card facilitation.',
              'State Social Security Pensions: Complete documentation support for Sanjay Gandhi Niradhar & Shravanbal Yojana.',
              'National Pension Schemes: Old Age Retirement, Widow Retirement, and Disability Retirement Pay Schemes.',
              'Family & Farmer Protection: National Family Benefit Scheme, Aam Aadmi Bima Yojana, and Farmer support.',
            ],
    },
    {
      icon: Sprout,
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-50 border border-teal-200/60',
      badge: envSection
        ? (lang === 'mr' ? envSection.subtitleMr : envSection.subtitleEn || envSection.subtitleMr)
        : (lang === 'mr' ? '५. पर्यावरण व वृक्षारोपण' : '5. Environment & Plantation'),
      badgeColor: 'text-teal-700 bg-teal-50',
      title: envSection
        ? (lang === 'mr' ? envSection.titleMr : envSection.titleEn || envSection.titleMr)
        : (lang === 'mr' ? 'औषधी वृक्षारोपण, पर्जन्यमान जतन व मानसिक तणाव मुक्ती' : 'Medicinal Tree Plantation & Conservation'),
      points:
        lang === 'mr'
          ? [
              'प्राणवायू व पर्जन्यमान संतुलन: कार्बन डायऑक्साइड शोषून प्राणवायू देणाऱ्या आणि पाऊस व भूजल पातळी टिकवणाऱ्या देशी वृक्षांची लागवड.',
              'औषधी वनस्पतींचे संवर्धन: कोरफड, तुळस, कडुलिंब, आवळा, देवदार यांसारख्या औषधी गुणधर्म असलेल्या वृक्षांची जोपासना.',
              'नैसर्गिक पर्यावरण निर्मिती: हिरव्यागार झाडांखालील स्वच्छ हवा व प्रसन्न वातावरणातून मानसिक आरोग्यास बळकटी.',
            ]
          : [
              'Oxygen & Rainfall Balance: Large-scale native tree planting to sustain drinking water tables and prevent soil erosion.',
              'Medicinal Flora Cultivation: Planting herbs and trees with natural healing properties (Aloe, Basil, Neem, Amla).',
              'Green Community Spaces: Creating natural environments that scientifically reduce stress and foster wellbeing.',
            ],
    },
    {
      icon: Users,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-50 border border-purple-200/60',
      badge: empSection
        ? (lang === 'mr' ? empSection.subtitleMr : empSection.subtitleEn || empSection.subtitleMr)
        : (lang === 'mr' ? '६. महिला, ज्येष्ठ नागरिक व शेतकरी' : '6. Women, Elders & Farmers'),
      badgeColor: 'text-purple-700 bg-purple-50',
      title: empSection
        ? (lang === 'mr' ? empSection.titleMr : empSection.titleEn || empSection.titleMr)
        : (lang === 'mr' ? 'महिला सक्षमीकरण, ज्येष्ठ नागरिक कल्याण (Gerontology) व कृषी उद्योजकता' : 'Women, Senior Care & Agri-Entrepreneurship'),
      points:
        lang === 'mr'
          ? [
              'महिला सक्षमीकरण व नेतृत्व: सूक्ष्म बचत (Micro-savings), तांत्रिक कौशल्य आणि पंचायत स्तरावर महिलांचा प्रशासकीय सहभाग.',
              'ज्येष्ठ नागरिक कल्याण (Gerontology): वाढत्या वयातील आर्थिक व कौटुंबिक प्रश्नांवर सहाय्य व वृद्धाश्रम संकल्पनेचा पाठपुरावा.',
              'अल्पभूधारक शेतकरी कौशल्य विकास: प्रगत शेती तंत्रज्ञान, कुटिरोद्योग, हस्तकला आणि लघुउद्योग कार्यशाळांचे आयोजन.',
            ]
          : [
              'Women’s Rights & Leadership: Micro-savings income generation and active participation in local Panchayati Raj governance.',
              'Gerontology & Senior Citizen Care: Supporting elderly citizens with health, guidance, and planning a dedicated Old Age Home.',
              'Smallholder Farmer Training: Technology-based farming workshops, cottage industries, and handicraft training for youth.',
            ],
    },
  ], [eduSection, cultureSection, healthSection, schemesSection, envSection, empSection, lang]);

  const verifiedStaticSchemes = useMemo(() => [
    lang === 'mr' ? '१. बायोमेट्रिक आधार कार्ड (Aadhaar)' : '1. Biometric Aadhaar Card',
    lang === 'mr' ? '२. संजय गांधी निराधार योजना' : '2. Sanjay Gandhi Niradhar Yojana',
    lang === 'mr' ? '३. श्रावणबाळ सेवा निवृत्तीवेतन' : '3. Shravanbal Seva State Pension',
    lang === 'mr' ? '४. इंदिरा गांधी राष्ट्रीय वृद्धापकाळ निवृत्ती' : '4. Indira Gandhi Old Age Pension',
    lang === 'mr' ? '५. इंदिरा गांधी राष्ट्रीय विधवा निवृत्ती' : '5. Indira Gandhi Widow Pension',
    lang === 'mr' ? '६. इंदिरा गांधी राष्ट्रीय दिव्यांग निवृत्ती' : '6. Indira Gandhi Disability Pension',
    lang === 'mr' ? '७. राष्ट्रीय कुटुंब लाभ योजना' : '7. National Family Benefit Scheme',
    lang === 'mr' ? '८. आम आदमी विमा योजना' : '8. Aam Aadmi Bima Yojana',
    lang === 'mr' ? '९. ई-श्रम कामगार कार्ड नोंदणी' : '9. e-Shram Worker Card Drive',
    lang === 'mr' ? '१०. हस्तकला कारागीर व शेतकरी योजना' : '10. Artisan & Farmer Schemes',
  ], [lang]);

  // Incorporate CMS-managed schemes if published
  const customCmsSchemes = useMemo(
    () =>
      (state.governmentSchemes || [])
        .filter((s) => s.published !== false)
        .map((s) => (lang === 'mr' ? s.title : s.titleEn || s.title)),
    [state.governmentSchemes, lang]
  );

  // Merge so dynamic CMS schemes and verified statutory list are unified
  const schemesList = useMemo(
    () => Array.from(new Set([...customCmsSchemes, ...verifiedStaticSchemes])).slice(0, 10),
    [customCmsSchemes, verifiedStaticSchemes]
  );

  // Fast pre-indexed lookup map for scheme portal URLs
  const schemesUrlMap = useMemo(() => {
    const map = new Map<string, string>();
    (state.governmentSchemes || []).forEach((s) => {
      if (s.officialPortalUrl) {
        if (s.title) map.set(s.title, s.officialPortalUrl);
        if (s.titleEn) map.set(s.titleEn, s.officialPortalUrl);
      }
    });
    return map;
  }, [state.governmentSchemes]);

  return (
    <div className="bg-[#F8FAFC] text-[#1E293B] font-sans min-h-screen">
      {/* 1. Breadcrumb Bar */}
      <div className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-[13px] text-slate-500 font-sans">
            <button
              onClick={() => handleNav('home')}
              className="text-slate-600 hover:text-[#0868C9] transition-colors cursor-pointer"
            >
              {lang === 'mr' ? 'मुख्यपृष्ठ' : 'Home'}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#0868C9] font-medium">
              {lang === 'mr' ? 'संस्थेविषयी' : 'About Us'}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-16 sm:space-y-24">
        {/* 2. Hero Section ("आमच्याविषयी" — Editorial Split Layout with Layered Depth) */}
        <section className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Heading & Narrative */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
              className="lg:col-span-7 space-y-5 text-left"
            >
              {/* Institution Emblem Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-serif font-bold text-[#0868C9]">
                <span className="w-2 h-2 rounded-full bg-[#E52E3D]" />
                <span>
                  {heroBadge
                    ? `${lang === 'mr' ? '॥ श्रीकृष्णाय नमः ॥ • ' : ''}${heroBadge}`
                    : (lang === 'mr' ? '॥ श्रीकृष्णाय नमः ॥ • अधिकृत संस्था परिचय' : 'Official Institutional Overview')}
                </span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-[1.2]">
                {aboutPage?.isPublished && (lang === 'mr' ? aboutPage.titleMr : aboutPage.titleEn || aboutPage.titleMr)
                  ? (lang === 'mr' ? aboutPage.titleMr : aboutPage.titleEn || aboutPage.titleMr)
                  : (lang === 'mr' ? 'आमच्याविषयी' : 'About Our Sanstha')}
              </h1>

              {/* Tagline / Subtitle */}
              <p className="text-base sm:text-lg lg:text-xl font-serif text-[#0868C9] leading-snug">
                {sansthaTagline ||
                  (lang === 'mr'
                    ? 'निष्पक्ष समाजकार्य, सांस्कृतिक संवर्धन आणि ग्रामीण स्वावलंबनाचा अविरत वसा'
                    : 'Non-Partisan Social Action, Cultural Preservation & Grassroots Self-Reliance')}
              </p>

              {/* Introductory Paragraph */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed font-sans max-w-2xl">
                {aboutPage?.isPublished && (lang === 'mr' ? aboutPage.metaDescriptionMr : aboutPage.metaDescriptionEn || aboutPage.metaDescriptionMr)
                  ? (lang === 'mr' ? aboutPage.metaDescriptionMr : aboutPage.metaDescriptionEn || aboutPage.metaDescriptionMr)
                  : (lang === 'mr'
                    ? 'नादरपूर (ता. कन्नड, जि. छत्रपती संभाजीनगर) येथून सुरू झालेले हे सेवाकार्य शिक्षण, आरोग्य, कला-संस्कृती, पर्यावरण आणि शासकीय योजनांच्या थेट लाभातून ग्रामीण महाराष्ट्राच्या सर्वांगीण सक्षमीकरणासाठी कटिबद्ध आहे.'
                    : 'Founded at Nadarpur, Block Kannad, Dist. Chhatrapati Sambhajinagar (Aurangabad), our Sanstha is dedicated to empowering rural Maharashtra through inclusive education, healthcare, cultural arts, environmental balance, and direct access to statutory welfare programs.')}
              </p>

              {/* Institutional Registration Badges */}
              <div className="pt-2 flex flex-wrap gap-3 text-xs">
                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-slate-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-900">
                    {regNumber}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-[#0868C9] shrink-0" />
                  <span>
                    {lang === 'mr'
                      ? 'सोसायटी नोंदणी कायदा १८६० व मुंबई विश्वस्त कायदा १९५०'
                      : 'Societies Reg. Act 1860 & Bombay Public Trust Act 1950'}
                  </span>
                </div>

                <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white shadow-2xs">
                  <span className="text-[#38BDF8] font-semibold">
                    {lang === 'mr' ? 'सचिव:' : 'Secretary:'}
                  </span>
                  <span className="font-bold">
                    {secretaryDisplayName}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: Layered Editorial Photograph Card */}
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.5, delay: shouldReduceMotion ? 0 : 0.1 }}
              className="lg:col-span-5"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 group">
                <img
                  src="/about-landscape.jpg"
                  width={531}
                  height={398}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1000&q=80';
                    }
                  }}
                  alt={lang === 'mr' ? 'श्रीकृष्ण संस्था — ग्रामीण सेवा व निसर्गरम्य परिसर' : 'Shrikrushna Sanstha Rural Activities'}
                  className="w-full aspect-[4/3] object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />

                {/* Ambient dark gradient overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#051632]/85 via-transparent to-black/20 pointer-events-none" />

                {/* Floating Bottom Card Label with hardware-accelerated rendering */}
                <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-2xl bg-white/95 border border-slate-200/80 shadow-md text-slate-900 flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="block text-[11px] font-sans font-semibold uppercase tracking-wider text-[#0868C9]">
                      {lang === 'mr' ? 'मुख्यालय व कार्यक्षेत्र' : 'Headquarters & Base'}
                    </span>
                    <span className="font-serif font-bold text-sm text-slate-900 truncate block">
                      {state.contactInfo?.taluka
                        ? (lang === 'mr'
                            ? `${state.contactInfo.taluka}, जि. ${state.contactInfo.district}`
                            : `${state.contactInfo.talukaEn || state.contactInfo.taluka}, Dist. ${state.contactInfo.districtEn || state.contactInfo.district}`)
                        : (lang === 'mr' ? 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर' : 'Nadarpur, Kannad, Chhatrapati Sambhajinagar')}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 3. Real Institutional Impact Statistics Bar (Zero main-thread blocking) */}
        <section ref={statsSectionRef} className="relative">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            className="bg-gradient-to-r from-[#061A3C] via-[#092B60] to-[#061A3C] rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl border border-slate-700/60 text-white relative overflow-hidden"
          >
            {/* Luminous Ambient Light Radial Overlays (Fast GPU composition) */}
            <div className="absolute top-0 right-1/4 w-80 h-40 bg-[radial-gradient(ellipse_at_center,rgba(8,104,201,0.22)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-60 h-40 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.15)_0%,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 divide-y-0 divide-slate-700/40">
              <StatItem
                targetValue={targetBeneficiaries}
                duration={1600}
                isStarted={isStatsInView}
                label={lang === 'mr' ? 'ग्रामीण लाभार्थी' : 'Rural Beneficiaries'}
                icon={Users}
                gradient="from-[#0868C9] to-[#38BDF8]"
                accentColor="text-[#38BDF8]"
              />

              <StatItem
                targetValue={targetInitiatives}
                duration={1200}
                isStarted={isStatsInView}
                label={lang === 'mr' ? 'यशस्वी उपक्रम' : 'Initiatives Completed'}
                icon={FileCheck2}
                gradient="from-emerald-500 to-teal-400"
                accentColor="text-emerald-400"
              />

              <StatItem
                targetValue={targetVillages}
                duration={1000}
                isStarted={isStatsInView}
                label={lang === 'mr' ? 'गावे व वाड्यांमध्ये कार्य' : 'Villages Reached'}
                icon={MapPin}
                gradient="from-amber-500 to-orange-400"
                accentColor="text-amber-400"
              />

              <StatItem
                targetValue={targetSchemes}
                duration={900}
                isStarted={isStatsInView}
                label={lang === 'mr' ? 'शासकीय योजनांचा लाभ' : 'Statutory Schemes'}
                icon={Award}
                gradient="from-[#E52E3D] to-rose-400"
                accentColor="text-rose-400"
              />
            </div>
          </motion.div>
        </section>

        {/* 4. Institutional Genesis & Story ("संस्थेची स्थापना व प्रेरणादायी पार्श्वभूमी") */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-xl border border-slate-200/90 relative overflow-hidden">
          {/* Subtle background ambient radial gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(235,243,250,0.6)_0%,transparent_70%)] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start relative z-10">
            {/* Left Narrative */}
            <div className="lg:col-span-7 space-y-5 text-slate-700 font-sans text-sm sm:text-base leading-relaxed text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#0868C9] text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {introSection
                    ? (lang === 'mr' ? introSection.subtitleMr : introSection.subtitleEn || introSection.subtitleMr)
                    : (lang === 'mr' ? 'प्रस्तावना व पार्श्वभूमी' : 'Genesis & Background')}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
                {introSection
                  ? (lang === 'mr' ? introSection.titleMr : introSection.titleEn || introSection.titleMr)
                  : (lang === 'mr'
                    ? 'स्वातंत्र्योत्तर काळातील ग्रामीण आव्हाने व लोककल्याणाची प्रेरणा'
                    : 'Post-Independence Rural Realities & Motivation for Public Service')}
              </h2>

              {introSection ? (
                sanitizeText(lang === 'mr' ? introSection.contentMr : introSection.contentEn || introSection.contentMr)
                  .split('\n\n')
                  .filter((p) => p.trim().length > 0)
                  .map((para, pIdx) => (
                    <p key={pIdx} className="leading-relaxed whitespace-pre-line text-slate-600">
                      {para}
                    </p>
                  ))
              ) : (
                <>
                  <p>
                    {lang === 'mr'
                      ? 'स्वातंत्र्यपूर्व काळात देशाचे संपूर्ण स्वातंत्र्य हे विविध संघटनांचे मुख्य ध्येय होते; परंतु स्वातंत्र्योत्तर काळात भ्रष्टाचार, बेरोजगारी, महिलांवरील अत्याचार, पर्यावरण व प्रदूषण, शेतकरी आत्महत्या, अनुसूचित जमातींचे प्रश्न तसेच वीज, पाणी, निवारा आणि शिक्षणाच्या गंभीर समस्या पुढे आल्या. कोणत्याही राजकीय, जातीय, धार्मिक किंवा वैचारिक वादात तटस्थ राहून व निस्वार्थ भावनेने लोककल्याणाचे कार्य करण्याच्या प्रेरणेतून नादरपूर (ता. कन्नड, जि. छत्रपती संभाजीनगर / औरंगाबाद, महाराष्ट्र) येथे ‘श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था’ स्थापन करण्यात आली.'
                      : 'While pre-independence movements fought for national freedom, the post-independence era brought urgent challenges including unemployment, violence against women, environmental pollution, farmer distress, tribal welfare, and access to electricity, water, housing, and education. Maintaining strict neutrality across political, ethnic, religious, or ideological lines, Shrikrushna Sanskrutik va Gramin Vikas Sanstha was established at Nadarpur, Dist. Chhatrapati Sambhajinagar (Aurangabad), Maharashtra.'}
                  </p>
                  <p>
                    {lang === 'mr'
                      ? 'श्रीमती सविता दिलीप निकम (सचिव) यांच्या नेतृत्वाखाली समविचारी सामाजिक कार्यकर्त्यांनी एकत्र येऊन ही संस्था उभारली. सुरुवातीला कन्नड तालुक्यातील नादरपूर परिसरात सुरू झालेले कार्य पुढे छत्रपती संभाजीनगर जिल्ह्यातील विविध तालुक्यांत विस्तारले. लोकांच्या खऱ्या समस्या जाणून घेण्यासाठी संस्थेने विविध ग्रामपंचायती व गावांमध्ये ‘बेसलाईन अभ्यास’ (Baseline Studies) आणि स्थानिक समुदाय आधारित गटांशी (CBOs) समन्वय साधून कौशल्य विकास, शिक्षण, आरोग्य, उपजीविका आणि पर्यावरण संवर्धनाचे कार्य तळागाळात रुजवले आहे.'
                      : 'Promoted under the leadership of Smt. Savita Dilip Nikam (Secretary) alongside dedicated social workers, our activities began in Kannad-Nadarpur Block and expanded across multiple blocks of Chhatrapati Sambhajinagar district. By conducting baseline studies across Gram Panchayats in consultation with local villagers and Community-Based Organizations (CBOs), we focus on village empowerment, skill development, education, healthcare, livelihood generation, and urgent civic assistance.'}
                  </p>
                </>
              )}
            </div>

            {/* Right Editorial Card */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 bg-slate-900 group">
                <img
                  src={introSection?.imageUrl || '/sanstha-building.jpg'}
                  width={496}
                  height={310}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      target.src = '/sanstha-building.jpg';
                    }
                  }}
                  alt={lang === 'mr' ? 'संस्था कार्यालय — नादरपूर' : 'Sanstha Center at Nadarpur'}
                  className="w-full aspect-[16/10] object-cover transition-transform duration-500 group-hover:scale-105 will-change-transform"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 right-4 text-white text-xs">
                  <span className="font-bold block text-sm">
                    {lang === 'mr' ? 'श्रीकृष्ण संस्था कार्यालय व केंद्र' : 'Shrikrushna Sanstha Activity Center'}
                  </span>
                  <span className="text-slate-300">
                    {state.contactInfo?.taluka
                      ? (lang === 'mr'
                          ? `मु. पो. नादरपूर, ता. ${state.contactInfo.taluka}, जि. ${state.contactInfo.district}`
                          : `At Post Nadarpur, Block ${state.contactInfo.talukaEn || state.contactInfo.taluka}, Dist. ${state.contactInfo.districtEn || state.contactInfo.district}`)
                      : (lang === 'mr' ? 'मु. पो. नादरपूर, ता. कन्नड (छत्रपती संभाजीनगर)' : 'At Post Nadarpur, Block Kannad')}
                  </span>
                </div>
              </div>

              {/* Verified Promoter Highlight Box */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-[13px] text-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-[#0868C9] font-serif font-bold text-sm">
                  <Users className="w-4 h-4 text-[#0868C9]" />
                  <span>{lang === 'mr' ? 'संस्थेचे नेतृत्व व संकल्पना' : 'Leadership & Vision'}</span>
                </div>
                <p className="leading-relaxed">
                  {lang === 'mr'
                    ? `${secretaryDisplayName} (सचिव) व सर्व विश्वस्तांच्या नेतृत्वाखाली संस्थेचे कामकाज लोकशाही पद्धतीने व पारदर्शक नियमांनुसार चालवले जाते.`
                    : `Led by ${secretaryDisplayName} (Secretary) and trustees, the organization operates democratically with regular stakeholder consultations.`}
                </p>
                <button
                  onClick={() => handleNav('officials')}
                  className="inline-flex items-center gap-1.5 text-[#0868C9] hover:text-[#065096] font-semibold text-xs pt-1 cursor-pointer hover:underline"
                >
                  <span>{lang === 'mr' ? 'सर्व पदाधिकारी व कार्यकारणी पाहा' : 'View Executive Leadership'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Vision, Mission & Core Values ("ध्येय, उद्दिष्टे व संस्थात्मक मूल्ये") */}
        <section className="space-y-6">
          <div className="border-b border-slate-200 pb-4 text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0868C9]">
              {lang === 'mr' ? 'संस्थात्मक दृष्टीकोन' : 'Institutional Framework'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              {lang === 'mr' ? 'ध्येय, उद्दिष्टे व संस्थात्मक मूल्ये' : 'Vision, Mission & Core Values'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {/* Card 1: Core Objective (Mission) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#E52E3D] transition-[border-color,box-shadow] duration-200 text-left">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-red-50 text-[#E52E3D] flex items-center justify-center shadow-xs">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {objectivesSection
                    ? (lang === 'mr' ? objectivesSection.titleMr : objectivesSection.titleEn || objectivesSection.titleMr)
                    : (lang === 'mr' ? 'संस्थेचे मुख्य उद्दिष्ट' : 'Core Objective')}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {objectivesSection
                    ? (lang === 'mr' ? objectivesSection.contentMr : objectivesSection.contentEn || objectivesSection.contentMr)
                    : (lang === 'mr'
                      ? 'नैसर्गिक व मानवनिर्मित आपत्तीग्रस्तांना मदत करणे, नागरिकांना त्यांच्या मूलभूत हक्कांची व पंचायत राज व्यवस्थेतील जबाबदाऱ्यांची जाणीव करून देणे, बेरोजगारांना रोजगाराच्या संधी उपलब्ध करून देणे आणि महिलांचा स्थानिक प्रशासनातील सहभाग वाढवणे.'
                      : 'Assisting victims of natural and man-made disasters, educating citizens on constitutional rights and Panchayati Raj responsibilities, generating employment through skill training, and elevating women in local governance.')}
                </p>
              </div>
            </div>

            {/* Card 2: Future Roadmap (Vision) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#0868C9] transition-[border-color,box-shadow] duration-200 text-left">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0868C9] flex items-center justify-center shadow-xs">
                  <Eye className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {roadmapSection
                    ? (lang === 'mr' ? roadmapSection.titleMr : roadmapSection.titleEn || roadmapSection.titleMr)
                    : (lang === 'mr' ? 'भविष्यातील संकल्पित प्रकल्प' : 'Future Institutional Roadmap')}
                </h3>
                {roadmapSection ? (
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
                    {(lang === 'mr' ? roadmapSection.contentMr : roadmapSection.contentEn || roadmapSection.contentMr)
                      .split('\n')
                      .filter((item) => item.trim().length > 0)
                      .map((item, rIdx) => (
                        <li key={rIdx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#0868C9] shrink-0 mt-0.5" />
                          <span>{item.trim().replace(/^[-•\d.]+\s*/, '')}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0868C9] shrink-0 mt-0.5" />
                      <span>
                        {lang === 'mr'
                          ? 'ग्रामीण मुलांसाठी आदर्श शाळा व शैक्षणिक संकुलांचा विस्तार'
                          : 'Expansion of model rural schools and joyful learning centers'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0868C9] shrink-0 mt-0.5" />
                      <span>
                        {lang === 'mr'
                          ? 'एकात्मिक कौशल्य प्रशिक्षण केंद्राची (Skill Training Center) उभारणी'
                          : 'Development of an Integrated Skill Training Center for rural youth'}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-[#0868C9] shrink-0 mt-0.5" />
                      <span>
                        {lang === 'mr'
                          ? 'ज्येष्ठ नागरिकांसाठी सुसज्ज वृद्धाश्रम (Old Age Home) व आधार केंद्र'
                          : 'Establishment of a dedicated Old Age Home and Gerontology care center'}
                      </span>
                    </li>
                  </ul>
                )}
              </div>
            </div>

            {/* Card 3: Core Values (संस्थेची मूल्ये) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-600 transition-[border-color,box-shadow] duration-200 text-left">
              <div className="space-y-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-xl font-serif font-bold text-slate-900">
                  {lang === 'mr' ? 'संस्थेची मूलभूत मूल्ये' : 'Institutional Core Values'}
                </h3>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">{lang === 'mr' ? 'निष्पक्षता व सचोटी:' : 'Integrity:'}</strong>{' '}
                      {lang === 'mr' ? 'राजकीय व सामाजिक तटस्थतेतून निस्वार्थ सेवा.' : 'Selfless service across political lines.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">{lang === 'mr' ? 'लोकसहभाग:' : 'Participation:'}</strong>{' '}
                      {lang === 'mr' ? 'ग्रामस्थांना स्वतःच्या विकासाचे शिल्पकार बनवणे.' : 'Empowering communities to lead.'}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">{lang === 'mr' ? 'वारसा जतन:' : 'Heritage:'}</strong>{' '}
                      {lang === 'mr' ? 'महाराष्ट्राची समृद्ध लोकसंस्कृती टिकवून ठेवणे.' : 'Preserving Maharashtra folk culture.'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Comprehensive Program Pillars ("संस्थेचे ६ व्यापक कार्यस्तंभ") */}
        <section className="space-y-8">
          <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0868C9]">
                {lang === 'mr' ? 'संस्थेचे ६ व्यापक कार्यस्तंभ' : '6 Comprehensive Program Pillars'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
                {lang === 'mr'
                  ? 'शिक्षण, कला-संस्कृती, आरोग्य, पर्यावरण आणि ग्रामीण सक्षमीकरण'
                  : 'Education, Culture, Healthcare, Environment & Rural Empowerment'}
              </h2>
            </div>
            <button
              onClick={() => handleNav('initiatives')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0868C9] hover:bg-[#065096] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
            >
              <span>{lang === 'mr' ? 'सर्व उपक्रम पाहा' : 'Explore All Initiatives'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sixPillarsDetailed.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#0868C9] hover:shadow-md hover:-translate-y-0.5 transition-[transform,box-shadow,border-color] duration-200 will-change-transform text-left"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${pillar.badgeColor}`}>
                        {pillar.badge}
                      </span>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pillar.iconBg} ${pillar.iconColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-slate-900 leading-snug">
                      {pillar.title}
                    </h3>

                    <ul className="space-y-2 text-xs sm:text-[13px] text-slate-600 leading-relaxed pt-1">
                      {pillar.points.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#0868C9] font-bold mt-0.5">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handlePillarInitiative(pillar.initiativeId)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0868C9] hover:text-[#065096] transition-colors cursor-pointer"
                    >
                      <span>{lang === 'mr' ? 'या क्षेत्रातील कार्य' : 'Learn More'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 7. Government Welfare Schemes Facilitation Section */}
        <section className="bg-gradient-to-r from-[#061A3C] via-[#092B60] to-[#061A3C] text-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-2xl space-y-6 text-left relative overflow-hidden">
          {/* Subtle luminous ambient radial glow (GPU-efficient) */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.12)_0%,transparent_70%)] pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 relative z-10">
            <div className="max-w-3xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#38BDF8]">
                {lang === 'mr'
                  ? 'शासकीय योजनांचा नागरिकांना थेट लाभ'
                  : 'Direct Access to Government Welfare Schemes'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white leading-tight">
                {schemesSection
                  ? (lang === 'mr' ? schemesSection.titleMr : schemesSection.titleEn || schemesSection.titleMr)
                  : (lang === 'mr'
                    ? 'तळागाळातील वंचित नागरिकांपर्यंत केंद्र व राज्य शासनाच्या योजना पोहोचवणारा दुवा'
                    : 'Bridging Grassroots Citizens with Central & State Welfare Entitlements')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {schemesSection
                  ? sanitizeText(lang === 'mr' ? schemesSection.contentMr : schemesSection.contentEn || schemesSection.contentMr)
                  : (lang === 'mr'
                    ? 'केंद्र आणि राज्य सरकार जनतेसाठी अनेक योजना राबवते; परंतु माहितीअभावी त्या योजना तळागाळातील लोकांपर्यंत पोहोचत नाहीत. आमची संस्था या सर्व योजनांचा कालावधी, अटी, शर्ती व आवश्यक कागदपत्रांचा सखोल अभ्यास करून शेतकरी, कामगार, महिला, मुले व वृद्धांना खालील प्रमुख योजनांचा प्रत्यक्ष लाभ मिळवून देते:'
                    : 'Our organization thoroughly studies scheme durations, terms, conditions, and documentation requirements so eligible farmers, workers, women, children, and elderly citizens directly receive their statutory benefits:')}
              </p>
            </div>

            <button
              onClick={() => setCurrentRoute('schemes')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-bold transition-all cursor-pointer shrink-0 self-start md:self-auto"
            >
              <span>{lang === 'mr' ? 'शासकीय योजना कक्ष' : 'Explore Welfare Desk'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8]" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 relative z-10">
            {schemesList.map((scheme) => {
              const officialPortalUrl = schemesUrlMap.get(scheme);
              return (
                <div
                  key={scheme}
                  onClick={() => {
                    if (officialPortalUrl) {
                      window.open(officialPortalUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      setCurrentRoute('schemes');
                    }
                  }}
                  title={officialPortalUrl ? (lang === 'mr' ? 'अधिकृत पोर्टल उघडा' : 'Open Official Portal') : undefined}
                  className="p-3.5 rounded-xl bg-white/10 border border-white/15 text-xs font-medium text-slate-200 flex items-center justify-between gap-2 hover:bg-white/20 hover:border-[#38BDF8]/40 transition-[background-color,border-color] duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Award className="w-4 h-4 text-[#38BDF8] shrink-0" />
                    <span className="leading-snug truncate">{scheme}</span>
                  </div>
                  {officialPortalUrl ? (
                    <span className="text-[10px] text-[#38BDF8] shrink-0 opacity-80 group-hover:opacity-100">↗</span>
                  ) : (
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 group-hover:text-white" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 8. Working Area Profile Section (Aurangabad / Maharashtra / India) */}
        <section className="space-y-6 text-left">
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0868C9]">
              <MapPin className="w-4 h-4" />
              <span>{lang === 'mr' ? 'कार्यक्षेत्र परिचय' : 'Working Area Profile'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 mt-1">
              {lang === 'mr'
                ? 'नादरपूर, जि. छत्रपती संभाजीनगर, महाराष्ट्र आणि भारत'
                : 'Nadarpur, Dist. Chhatrapati Sambhajinagar, Maharashtra & India'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {workingAreaCards.map((area) => (
              <div
                key={area.title}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 space-y-3 shadow-xs hover:border-[#0868C9] hover:shadow-md transition-[border-color,box-shadow] duration-200"
              >
                <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md inline-block ${area.badgeStyle}`}>
                  {area.badge}
                </span>
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {area.title}
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  {area.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {area.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Additional CMS-managed sections if present */}
        {additionalAboutSections.length > 0 && (
          <section className="pt-8 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {additionalAboutSections.map((sec) => (
              <div
                key={sec.id || sec.sectionKey}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {sec.imageUrl && (
                    <div className="rounded-xl overflow-hidden aspect-[16/9] mb-3 border border-slate-100">
                      <img
                        src={sec.imageUrl}
                        alt={(lang === 'mr' ? sec.imageAltMr : sec.imageAltEn) || sec.titleMr}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  )}
                  {sec.subtitleMr && (
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#0868C9] block">
                      {lang === 'mr' ? sec.subtitleMr : sec.subtitleEn || sec.subtitleMr}
                    </span>
                  )}
                  <h3 className="text-xl font-serif font-bold text-slate-900">
                    {lang === 'mr' ? sec.titleMr : sec.titleEn || sec.titleMr}
                  </h3>
                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {sanitizeText(lang === 'mr' ? sec.contentMr : sec.contentEn || sec.contentMr)}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 9. Leadership & Transparency Dual Navigation Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Card 1: Officials */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4 hover:border-[#0868C9] transition-[border-color,box-shadow] duration-200">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-[#0868C9] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">
                {lang === 'mr' ? 'संस्थेचे मार्गदर्शक व पदाधिकारी' : 'Executive Leadership & Officials'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? `${secretaryDisplayName} (सचिव) व ${presidentDisplayName} (अध्यक्ष) यांच्या नेतृत्वाखाली कार्य करणारी समर्पित कार्यकारणी.`
                  : `Led by ${secretaryDisplayName} (Secretary) and ${presidentDisplayName} (President) alongside dedicated social trustees.`}
              </p>

              {/* Dynamic Live Officials Count from MySQL Database */}
              {(state.officials || []).length > 0 && (
                <div className="pt-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-100 text-[#0868C9] text-xs font-semibold">
                    <Award className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {(state.officials || []).filter((o) => o.published).length}{' '}
                      {lang === 'mr' ? 'सक्रिय पदाधिकारी व कार्यकारणी सदस्य' : 'Active Executive Trustees & Leaders'}
                    </span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => handleNav('officials')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#0868C9] hover:text-[#065096] transition-colors cursor-pointer"
            >
              <span>{lang === 'mr' ? 'सर्व पदाधिकारी पाहा' : 'View All Officials'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Reports & Transparency */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-600 transition-[border-color,box-shadow] duration-200">
            <div className="space-y-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-serif font-bold text-slate-900">
                {lang === 'mr' ? 'वार्षिक अहवाल व पारदर्शकता' : 'Annual Reports & Transparency'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'संस्थेचे वार्षिक कार्य अहवाल, हिशोब तपासणी आणि कायदेशीर नोंदणी दस्तऐवज सर्वसामान्यांसाठी खुले आहेत.'
                  : 'All institutional annual activity reports, audited financial disclosures, and bylaws are published transparently.'}
              </p>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{regNumber}</span>
              </div>
            </div>
            <button
              onClick={() => handleNav('reports')}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
            >
              <span>{lang === 'mr' ? 'अहवाल दालन उघडा' : 'Open Reports Section'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* 10. Closing Call to Action Banner (Pre-Footer Transition) */}
        <section className="pt-2">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-[#051838] via-[#093374] to-[#051838] p-6 sm:p-10 lg:p-12 border border-slate-700/60 text-white text-left">
            {/* Luminous radial glow (GPU-efficient) */}
            <div className="absolute -top-12 -left-12 w-72 h-72 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-[radial-gradient(ellipse_at_center,rgba(8,104,201,0.22)_0%,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {lang === 'mr' ? 'सहकार्य व सहभाग' : 'Join Our Mission'}
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white leading-snug">
                  {lang === 'mr'
                    ? '→ आपणही या परिवर्तनाचा प्रवासाचा भाग व्हा'
                    : '→ Become Part of this Journey of Transformation'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {lang === 'mr'
                    ? 'शिक्षण, आरोग्य, संस्कृती आणि ग्रामीण विकासासाठी आमच्यासोबत हातमिळवणी करा.'
                    : 'Join hands with us for education, healthcare, cultural heritage, and rural empowerment.'}
                </p>

                {/* Verified Contact Details from contact_info table */}
                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  {state.contactInfo?.phone && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{state.contactInfo.phone.split(',')[0].trim()}</span>
                    </span>
                  )}
                  {state.contactInfo?.email && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                      <span className="text-cyan-400">✉</span>
                      <span>{state.contactInfo.email}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto shrink-0">
                <button
                  onClick={() => handleNav('contact')}
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-gradient-to-r from-[#E52E3D] to-[#D92030] hover:from-[#C92033] hover:to-[#B81928] text-white text-xs sm:text-sm font-bold shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 w-full sm:w-auto"
                >
                  <Phone className="w-4 h-4 fill-white text-white" />
                  <span>{lang === 'mr' ? 'संपर्क साधा' : 'Contact Us'}</span>
                </button>

                <button
                  onClick={() => handleNav('volunteer')}
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 w-full sm:w-auto"
                >
                  <HeartHandshake className="w-4 h-4 text-[#38BDF8]" />
                  <span>{lang === 'mr' ? 'स्वयंसेवक व्हा' : 'Volunteer With Us'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

