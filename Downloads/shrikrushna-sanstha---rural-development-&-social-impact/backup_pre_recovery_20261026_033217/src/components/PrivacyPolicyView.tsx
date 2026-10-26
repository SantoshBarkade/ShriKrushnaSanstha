import React, { useState } from 'react';
import { useSanstha } from '../context/SansthaContext';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  ChevronRight,
  CheckCircle2,
  Database,
  Cookie,
  Trash2,
  HelpCircle,
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Building2,
  BadgeCheck,
} from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  const { setCurrentRoute, lang, t, state } = useSanstha();
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  const dynamicSections = (state.pageSections || [])
    .filter((s) => s.pageSlug === 'privacy' && s.isPublished)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const contactInfo = state.contactInfo || {
    phone: '+91 9923512482, +91 8888684966',
    email: 'shrikrushnasanstha.nadarpur@gmail.com',
    address: 'मु. पो. नादरपूर, तहसील कन्नड, जिल्हा छत्रपती संभाजीनगर (औरंगाबाद), महाराष्ट्र',
    addressEn: 'At Post Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar (Aurangabad), Maharashtra',
    visitingHours: 'सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ०६:००',
    visitingHoursEn: 'Monday to Saturday: 10:00 AM to 06:00 PM',
  };

  const getPrivacyIcon = (key?: string, idx: number = 0) => {
    if (key === 'privacy_collection' || key === 'data_collection' || idx === 0) return ShieldCheck;
    if (key === 'privacy_commercial' || key === 'zero_commercial' || idx === 1) return Lock;
    if (key === 'privacy_dignity' || key === 'beneficiary_dignity' || idx === 2) return Eye;
    if (key === 'privacy_grievance' || key === 'grievance_redressal' || idx === 3) return FileText;
    return ShieldCheck;
  };

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Build Table of Contents based on dynamic CMS sections plus technical & contact modules
  const tableOfContents = [
    ...(dynamicSections.length > 0
      ? dynamicSections.map((sec, idx) => ({
          id: `sec-${sec.sectionKey || `dynamic-${idx}`}`,
          mr: sec.titleMr,
          en: sec.titleEn || sec.titleMr,
        }))
      : [
          { id: 'sec-scope', mr: '१. धोरणाची व्याप्ती', en: '1. Policy Scope' },
          { id: 'sec-collection', mr: '२. माहिती संकलन', en: '2. Data Collection' },
          { id: 'sec-usage', mr: '३. माहितीचा वापर', en: '3. Data Usage' },
          { id: 'sec-dignity', mr: '४. लाभार्थी सन्मान व छायाचित्रे', en: '4. Beneficiary Dignity' },
        ]),
    { id: 'sec-tech-security', mr: '५. तांत्रिक सुरक्षा व प्रतिबंध', en: '5. Technical Safeguards' },
    { id: 'sec-cookies-storage', mr: '६. कुकीज व स्थानिक साठवणूक', en: '6. Cookies & Storage' },
    { id: 'sec-office-contact', mr: '७. संपर्क व तक्रार कक्ष', en: '7. Office & Grievance' },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-24 font-sans text-slate-800">
      {/* Institutional Hero Section */}
      <section className="relative bg-gradient-to-b from-[#061A3C] via-[#0A2540] to-[#0D3156] text-white pt-10 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20 shadow-lg overflow-hidden">
        {/* Subtle Architectural Grid Pattern Overlay */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Ambient Glows */}
        <div
          className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <button
              onClick={() => setCurrentRoute('home')}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <span>{t.nav.home}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-amber-400 font-semibold" aria-current="page">
              {lang === 'mr' ? 'गोपनीयता धोरण' : 'Privacy Policy'}
            </span>
          </nav>

          {/* Title & Institutional Credential Pill */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {lang === 'mr'
                  ? '।। सेवेची पाऊले, परिवर्तनाची दिशा ।। • नोंदणी क्र. एक १४६६८ (औ)'
                  : 'Steps of Service, Direction of Transformation • Reg. No. Ek 14668 (A)'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              {lang === 'mr'
                ? 'गोपनीयता, डेटा सुरक्षा व लाभार्थी सन्मान धोरण'
                : 'Privacy, Data Protection & Beneficiary Dignity Policy'}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-sans max-w-3xl">
              {lang === 'mr'
                ? 'श्रीकृष्ण संस्था ही ग्रामीण विकास, शिक्षण, महिला सक्षमीकरण आणि सामाजिक कल्याणासाठी समर्पित संस्था आहे. आमच्या संकेतस्थळावर नागरिकांची माहिती सुरक्षितता, पारदर्शकता आणि सन्मान राखणे ही आमची सर्वोच्च प्राथमिकता आहे.'
                : 'Shrikrushna Sanstha is dedicated to rural progress, quality education, and community welfare. We uphold strict transparency, digital privacy, and unconditional dignity for every citizen served.'}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 border border-white/15">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {lang === 'mr'
                    ? 'अधिकृत अद्ययावत: ऑक्टोबर २०२६ (आवृत्ती २.०)'
                    : 'Officially Verified: October 2026 (Version 2.0)'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 border border-white/15">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {lang === 'mr'
                    ? 'कार्यक्षेत्र: नादरपूर, कन्नड, छत्रपती संभाजीनगर'
                    : 'Jurisdiction: Nadarpur, Kannad, Chhatrapati Sambhajinagar'}
                </span>
              </span>
            </div>
          </div>

          {/* 3 Core Ethical Pillars Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-4xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'व्यावसायिक विक्रीस बंदी' : 'Zero Commercialization'}
                </p>
                <p className="text-sm sm:text-base font-bold font-serif text-white">
                  {lang === 'mr' ? '१००% अव्यावसायिक संस्था' : 'Zero Data Selling'}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'लाभार्थी सन्मान' : 'Beneficiary Dignity'}
                </p>
                <p className="text-sm sm:text-base font-bold font-serif text-white">
                  {lang === 'mr' ? 'छायाचित्र हटविण्याचा अधिकार' : 'Right to Photo Removal'}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'डेटा सुरक्षा व स्पॅम प्रतिबंध' : 'Technical Safeguards'}
                </p>
                <p className="text-sm sm:text-base font-bold font-serif text-white">
                  {lang === 'mr' ? 'सुरक्षित व इनक्रिप्टेड' : 'Rate-limited & Protected'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Section Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 space-y-10">
        {/* Navigation Quick Jump Pills */}
        <nav
          aria-label="Privacy sections navigation"
          className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-5 overflow-x-auto scrollbar-none"
        >
          <div className="flex items-center gap-2 min-w-max">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2 flex items-center gap-1.5 shrink-0">
              <FileText className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'mr' ? 'विषयसूची:' : 'Jump to:'}</span>
            </span>
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  activeSectionId === item.id
                    ? 'bg-[#061A3C] text-white shadow-xs'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {lang === 'mr' ? item.mr : item.en}
              </button>
            ))}
          </div>
        </nav>

        {/* Content Streams: Dynamic CMS Sections + Technical Safeguards & Contact */}
        <div className="space-y-8">
          {dynamicSections.length > 0 ? (
            dynamicSections.map((sec, idx) => {
              const Icon = getPrivacyIcon(sec.sectionKey, idx);
              const title = lang === 'mr' ? sec.titleMr : sec.titleEn || sec.titleMr;
              const subtitle = lang === 'mr' ? sec.subtitleMr : sec.subtitleEn || sec.subtitleMr;
              const content = lang === 'mr' ? sec.contentMr : sec.contentEn || sec.contentMr;
              const lines = content.split('\n').filter((l) => l.trim().length > 0);
              const isBulletList = lines.some((l) => l.trim().startsWith('-') || l.trim().startsWith('•'));
              const sectionId = `sec-${sec.sectionKey || `dynamic-${idx}`}`;

              return (
                <section
                  id={sectionId}
                  key={sec.id || idx}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
                >
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#061A3C] shrink-0 font-serif font-bold">
                      <Icon className="w-5 h-5 text-blue-700" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                        {title}
                      </h2>
                      {subtitle && (
                        <p className="text-xs text-slate-500 font-medium">
                          {subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {isBulletList ? (
                    <div className="space-y-2.5 pt-1">
                      {lines.map((line, lIdx) => {
                        const trimmed = line.trim().replace(/^[-•]\s*/, '');
                        return (
                          <div key={lIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <span className="leading-relaxed">{trimmed}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line pt-1">
                      {content}
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <>
              {/* Section 1: Scope */}
              <section
                id="sec-scope"
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#061A3C] shrink-0 font-serif font-bold">
                    १
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                      {lang === 'mr' ? 'संस्थेची ओळख व धोरणाची व्याप्ती' : 'Institutional Identity & Policy Scope'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {lang === 'mr' ? 'सोसायटी नोंदणी व सार्वजनिक विश्वस्त कायदेशीर चौकट' : 'Legal framework under Societies & Trusts Act'}
                    </p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    {lang === 'mr'
                      ? 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था ही सोसायटी नोंदणी कायदा १८६० (नोंदणी क्र. एक १४६६८ (औ)) आणि मुंबई सार्वजनिक विश्वस्त कायदा १९५० अन्वये नादरपूर, तालुका कन्नड, जिल्हा छत्रपती संभाजीनगर (महाराष्ट्र) येथे नोंदणीकृत अधिकृत स्वयंसेवी संस्था आहे.'
                      : 'Shrikrushna Sanskrutik and Gramin Vikas Sanstha is an authorized social welfare society registered under the Societies Registration Act 1860 (Registration No. Ek 14668 (A)) and Mumbai Public Trusts Act 1950, headquartered at Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar, Maharashtra.'}
                  </p>
                  <p>
                    {lang === 'mr'
                      ? 'हे धोरण आमच्या अधिकृत संकेतस्थळावरून (shrikrushnasanstha.org) पुरविल्या जाणाऱ्या सर्व सार्वजनिक माहिती, नागरिक विचारणा अर्ज (Contact Form), स्वयंसेवक नोंदणी अर्ज (Volunteer Form) आणि सार्वजनिक उपक्रम दस्तऐवजीकरणासाठी लागू आहे.'
                      : 'This policy governs all public communications, citizen inquiry submissions, volunteer registration workflows, and official activity documentation presented across our web presence.'}
                  </p>
                </div>
              </section>

              {/* Section 2: Data Collection */}
              <section
                id="sec-collection"
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 font-serif font-bold">
                    २
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                      {lang === 'mr' ? 'माहिती संकलन आणि वापर' : 'Information Collection & Usage'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {lang === 'mr' ? 'केवळ स्वेच्छेने सादर केलेले आवश्यक संपर्क तपशील' : 'Voluntarily provided contact details only'}
                    </p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    {lang === 'mr'
                      ? 'श्रीकृष्ण संस्था ही ग्रामीण विकास, शिक्षण आणि सामाजिक कल्याणासाठी काम करणारी संस्था आहे. आमच्या संकेतस्थळावर भेट देणाऱ्या नागरिकांकडून कोणताही अनावश्यक डेटा गोळा केला जात नाही. केवळ संपर्क फॉर्मद्वारे नागरिकांनी स्वतःहून दिलेले नाव, संपर्क क्रमांक व संदेश हा केवळ त्यांच्या प्रश्नांची उत्तरे देण्यासाठी वापरला जातो.'
                      : 'ShriKrushna Sanstha solely collects personal information (such as name, phone number, and message) voluntarily submitted through our contact form. This information is exclusively utilized to respond to citizen inquiries, study room registrations, and welfare guidance requests.'}
                  </p>
                </div>
              </section>

              {/* Section 3: Zero Commercialization */}
              <section
                id="sec-usage"
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#061A3C] shrink-0 font-serif font-bold">
                    ३
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                      {lang === 'mr' ? 'व्यावसायिक वापरास पूर्ण मनाई' : 'Zero Commercialization Policy'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {lang === 'mr' ? 'व्यावसायिक जाहिरातदारांना डेटा विकण्यास पूर्ण बंदी' : 'Strict prohibition on commercializing citizen data'}
                    </p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    {lang === 'mr'
                      ? 'आम्ही कोणत्याही नागरिकाचा किंवा लाभार्थीचा वैयक्तिक डेटा, मोबाईल क्रमांक किंवा ईमेल पत्ता कोणत्याही व्यावसायिक संस्थेला, जाहिरातदाराला अथवा तृतीय पक्षाला विकत नाही किंवा हस्तांतरित करत नाही.'
                      : 'We strictly never sell, rent, commercialize, or lease citizen or beneficiary contact details to any third-party advertisers, financial institutions, or commercial entities.'}
                  </p>
                </div>
              </section>

              {/* Section 4: Dignity */}
              <section
                id="sec-dignity"
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
              >
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 font-serif font-bold">
                    ४
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                      {lang === 'mr' ? 'छायाचित्रे व लाभार्थी सन्मान (Beneficiary Dignity)' : 'Beneficiary Dignity & Photographic Consent'}
                    </h2>
                    <p className="text-xs text-slate-500">
                      {lang === 'mr' ? 'ग्रामीण बांधव, महिला व बालकांच्या मान-सन्मानाचे रक्षण' : 'Ethical photography & immediate photo removal rights'}
                    </p>
                  </div>
                </div>

                <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
                  <p>
                    {lang === 'mr'
                      ? 'संस्थेच्या उपक्रमांमध्ये सहभागी होणारे विद्यार्थी, महिला, ज्येष्ठ नागरिक आणि वंचित बांधवांचा मान-सन्मान राखणे हे आमचे सर्वोच्च कर्तव्य आहे:'
                      : 'Safeguarding the dignity of rural youth, women, elders, and farming community members is our foremost institutional commitment:'}
                  </p>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
                    <li>
                      {lang === 'mr'
                        ? 'केवळ उपक्रमाच्या सार्वजनिक दस्तऐवजीकरणासाठी आवश्यक असलेली छायाचित्रे वापरली जातात.'
                        : 'Photographs are solely captured for authentic public activity documentation.'}
                    </li>
                    <li>
                      {lang === 'mr'
                        ? 'कोणत्याही लाभार्थ्याचे दारिद्र्य किंवा असहाय्यतेचे अवमानकारक प्रदर्शन करण्यास सक्त मनाई आहे.'
                        : 'Sensationalized, undignified, or voyeuristic depictions of poverty or distress are strictly prohibited.'}
                    </li>
                    <li>
                      {lang === 'mr'
                        ? 'बालकांचे आणि शाळकरी विद्यार्थ्यांचे छायाचित्र घेताना स्थानिक शाळा किंवा पालकांची पूर्वपरवानगी विचारात घेतली जाते.'
                        : 'Parental or local school authority permission is honored when capturing student study sessions.'}
                    </li>
                    <li>
                      {lang === 'mr'
                        ? 'कोणत्याही लाभार्थ्याला आपले छायाचित्र संकेतस्थळावरून काढून घेण्याचा पूर्ण अधिकार आहे.'
                        : 'Any community participant possesses an absolute right to request the prompt removal of their photograph from our archives.'}
                    </li>
                  </ul>
                </div>
              </section>
            </>
          )}

          {/* Section 5: Technical Safeguards & Anti-Spam Defense */}
          <section
            id="sec-tech-security"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#061A3C] shrink-0 font-serif font-bold">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                  {lang === 'mr' ? 'तांत्रिक सुरक्षा व गैरवापर प्रतिबंध' : 'Technical Safeguards & Anti-Spam Controls'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'mr' ? 'डेटाबेस सुरक्षा, बॉट ट्रॅप्स आणि दर मर्यादा' : 'Prepared queries, bot defense & IP rate limiting'}
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
              <p>
                {lang === 'mr'
                  ? 'नागरिकांच्या विचारणा आणि स्वयंसेवक अर्जांची सुरक्षितता अबाधित ठेवण्यासाठी आमच्या प्रणालीत खालील तांत्रिक मानकांचा वापर केला जातो:'
                  : 'To safeguard public inquiries and volunteer applications, our backend implements multi-layered security controls:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {lang === 'mr' ? 'बॉट ट्रॅप (Honeypot)' : 'Honeypot Bot Defense'}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {lang === 'mr'
                      ? 'स्पॅम बॉट्स रोखण्यासाठी अर्जांमध्ये अदृश्य सापळा शेत तयार केलेले आहे.'
                      : 'Hidden honeypot traps prevent automated spam bots without processing database queries.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {lang === 'mr' ? 'दर मर्यादा (Rate Limiting)' : 'IP Rate Limiting'}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {lang === 'mr'
                      ? 'एका आयपी पत्त्यावरून १५ मिनिटांत कमाल ५ विनंत्यांची मर्यादा लागू करून गैरवापर रोखला जातो.'
                      : 'Limits submissions to max 5 requests per 15 minutes per IP to block flood attacks.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {lang === 'mr' ? 'PDO सुरक्षित क्वेरीज' : 'Prepared SQL Queries'}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {lang === 'mr'
                      ? 'एसक्यूएल इंजेक्शन व एक्सएसएस हल्ले रोखण्यासाठी सर्व इनपुट सुरक्षित केले जातात.'
                      : 'All queries utilize parameterized PDO bindings and strip dangerous HTML/scripts.'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Cookies & Local Storage */}
          <section
            id="sec-cookies-storage"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0 font-serif font-bold">
                <Cookie className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                  {lang === 'mr' ? 'कुकीज व स्थानिक साठवणूक (Cookies & Storage)' : 'Cookies & Browser Storage'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'mr' ? 'तृतीय पक्ष जाहिरात कुकीजचा पूर्ण अभाव' : 'Zero third-party advertising cookies'}
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3">
              <p>
                {lang === 'mr'
                  ? 'श्रीकृष्ण संस्थेचे संकेतस्थळ कोणत्याही बाह्य जाहिरातदारांच्या किंवा ट्रॅकिंग कंपन्यांच्या कुकीज वापरत नाही. आमच्या संकेतस्थळावर केवळ खालील तांत्रिक साठवणुकीचा वापर केला जातो:'
                  : 'Our institutional website operates strictly without commercial advertising cookies or tracking pixels. We solely employ minimal browser storage for functional convenience:'}
              </p>

              <ul className="text-xs sm:text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li>
                  <span className="font-semibold text-slate-800">
                    {lang === 'mr' ? 'भाषा निवड (shrikrushna_lang):' : 'Language Mode (shrikrushna_lang):'}
                  </span>{' '}
                  {lang === 'mr'
                    ? 'नागरिकांनी निवडलेली मराठी किंवा इंग्रजी भाषा पुढील पानांवर आठवणीत ठेवण्यासाठी.'
                    : 'Retains your preferred Marathi or English language setting across pages.'}
                </li>
                <li>
                  <span className="font-semibold text-slate-800">
                    {lang === 'mr' ? 'सार्वजनिक माहिती कॅश (shrikrushna_sanstha_state_v2):' : 'Public Content Cache:'}
                  </span>{' '}
                  {lang === 'mr'
                    ? 'ऑफलाईन किंवा जलद पेज लोडिंगसाठी केवळ सार्वजनिक नोंदी (अहवाल, उपक्रम सूची) कॅश केली जाते. यात कोणतीही वैयक्तिक माहिती नसते.'
                    : 'Caches public documents and reports locally to accelerate page rendering. Contains zero personal data.'}
                </li>
                <li>
                  <span className="font-semibold text-slate-800">
                    {lang === 'mr' ? 'व्हिडिओ दालन (youtube-nocookie.com):' : 'Video Library (youtube-nocookie.com):'}
                  </span>{' '}
                  {lang === 'mr'
                    ? 'व्हिडिओ प्ले करताना युट्यूबच्या प्रायव्हसी-एनहान्सड मोडचा वापर केला जातो, ज्यामुळे कुकी ट्रॅकिंग रोखले जाते.'
                    : 'Embedded videos strictly utilize YouTube Privacy-Enhanced Mode (youtube-nocookie.com) with modest branding.'}
                </li>
              </ul>
            </div>
          </section>

          {/* Section 7: Grievance Redressal & Office Details */}
          <section
            id="sec-office-contact"
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-4 scroll-mt-24"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0 font-serif font-bold">
                <Building2 className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900">
                  {lang === 'mr' ? 'तक्रार निवारण कक्ष व अधिकृत संपर्क' : 'Grievance Redressal & Administrative Office'}
                </h2>
                <p className="text-xs text-slate-500">
                  {lang === 'mr' ? 'थेट प्रशासकीय कार्यालयाशी संपर्क साधण्याची माहिती' : 'Direct contact details of our administrative office'}
                </p>
              </div>
            </div>

            <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-4">
              <p>
                {lang === 'mr'
                  ? 'गोपनीयता धोरण, डेटा सुरक्षा, अथवा छायाचित्रांसंबंधी कोणतीही शंका, तक्रार किंवा विचारणा असल्यास आमच्या नादरपूर मुख्य कार्यालयाशी संपर्क साधा:'
                  : 'For privacy inquiries, photographic consent notifications, or grievance redressal, please reach out directly to our administrative office:'}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        {lang === 'mr' ? 'मुख्य कार्यालय पत्ता' : 'Registered Office'}
                      </span>
                      <span className="font-medium text-slate-800 text-xs">
                        {lang === 'mr' ? contactInfo.address : contactInfo.addressEn || contactInfo.address}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        {lang === 'mr' ? 'कार्यालयीन वेळ' : 'Visiting Hours'}
                      </span>
                      <span className="font-medium text-slate-800 text-xs">
                        {lang === 'mr' ? contactInfo.visitingHours : contactInfo.visitingHoursEn || contactInfo.visitingHours}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <Phone className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        {lang === 'mr' ? 'संपर्क दूरध्वनी' : 'Official Telephone'}
                      </span>
                      <span className="font-medium text-slate-800 text-xs">
                        {contactInfo.phone}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        {lang === 'mr' ? 'अधिकृत ईमेल' : 'Official Email'}
                      </span>
                      <span className="font-medium text-slate-800 text-xs">
                        {contactInfo.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Support Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-[#061A3C] to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-amber-500/20 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {lang === 'mr'
                    ? 'पारदर्शक समाजकार्य व सार्वजनिक विश्वास'
                    : 'Transparent Community Governance'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                {lang === 'mr'
                  ? '।। सेवेची पाऊले, परिवर्तनाची दिशा ।।'
                  : 'Steps of Service, Direction of Transformation'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lang === 'mr'
                  ? 'श्रीकृष्ण संस्था स्थानिक ग्रामपंचायती, आरोग्य विभाग आणि शिक्षण विभागाच्या मार्गदर्शनाखाली पूर्णतः कायदेशीर आणि पारदर्शक पद्धतीने कार्यरत आहे.'
                  : 'Shrikrushna Sanstha operates transparently and in full compliance with public trust standards, empowering rural communities with honor and integrity.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentRoute('reports')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{lang === 'mr' ? 'वार्षिक अहवाल पाहा' : 'View Reports'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentRoute('contact')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>{lang === 'mr' ? 'तक्रार / विचारणा अर्ज' : 'Submit Inquiry'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
