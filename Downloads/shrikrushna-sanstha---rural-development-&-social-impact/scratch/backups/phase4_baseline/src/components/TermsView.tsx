import React from 'react';
import { useSanstha } from '../context/SansthaContext';
import {
  FileText,
  ShieldCheck,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Scale,
  Lock,
  ExternalLink,
  BookOpen,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';

export const TermsView: React.FC = () => {
  const { setCurrentRoute, lang } = useSanstha();

  const termsSections = [
    {
      id: 'acceptance',
      icon: Scale,
      titleMr: '१. अटींची स्वीकृती व सेवा उद्देश',
      titleEn: '1. Acceptance of Terms & Institutional Purpose',
      descMr:
        'या संकेतस्थळाचा वापर करून आपण श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेच्या अधिकृत नियमावली व अटी मान्य करत आहात. हे संकेतस्थळ केवळ समाजकल्याण, ग्रामीण सक्षमीकरण, शिक्षण प्रसार, आरोग्य जनजागृती आणि शासकीय योजनांच्या माहितीप्रसाराच्या निःस्वार्थ हेतूने चालवले जाते.',
      descEn:
        'By accessing or using this website, you agree to comply with and be bound by these official terms. This platform is maintained solely for non-profit community welfare, rural education, public health awareness, and statutory scheme facilitation.',
    },
    {
      id: 'intellectual-property',
      icon: ShieldCheck,
      titleMr: '२. बौद्धिक संपदा व अधिकृत सामग्री',
      titleEn: '2. Intellectual Property & Official Content',
      descMr:
        'संस्थेचे नाव, अधिकृत बोधचिन्ह (Logo), अहवाल, छायाचित्रे, व्हिडिओ आणि मजकूर ही संस्थेची कायदेशीर बौद्धिक संपदा आहे. संस्थेच्या लेखी पूर्वपरवानगीशिवाय कोणत्याही व्यावसायिक वापरास, विपणनास किंवा अनधिकृत प्रसारास सक्त मनाई आहे.',
      descEn:
        'All official logos, insignia, annual reports, photo archives, and publications are the intellectual property of Shrikrushna Sanstha. Commercial re-distribution, unauthorized copying, or deceptive use is strictly prohibited without written consent.',
    },
    {
      id: 'scheme-guidance',
      icon: BookOpen,
      titleMr: '३. शासकीय योजना व विनामूल्य मदत कक्ष',
      titleEn: '3. Government Schemes & Free Public Helpdesk',
      descMr:
        'संकेतस्थळावर दर्शवलेली विविध शासकीय योजनांची माहिती ही सर्वसामान्य नागरिकांच्या मार्गदर्शनासाठी आहे. योजनांच्या अंतिम मंजुरीचे, लाभाचे व नियमांचे संपूर्ण अधिकार संबंधित शासकीय विभाग व सक्षम प्राधिकरणाकडे राखीव आहेत. संस्था यासाठी कोणत्याही शुल्काची मागणी करत नाही.',
      descEn:
        'Welfare scheme guidelines published on this platform are provided free of cost for citizen guidance. Final eligibility, approval, and disbursements are governed solely by respective Government departments and statutory authorities.',
    },
    {
      id: 'code-of-conduct',
      icon: Lock,
      titleMr: '४. नागरिक व स्वयंसेवक आचारसंहिता',
      titleEn: '4. Citizen & Volunteer Code of Conduct',
      descMr:
        'स्वयंसेवक नोंदणी किंवा संपर्क फॉर्म भरताना नागरिकांनी खरी व अचूक माहिती देणे आवश्यक आहे. कोणत्याही प्रकारची खोटी माहिती, द्वेषमूलक सामग्री, किंवा डिजिटल प्रणालीमध्ये व्यत्यय आणण्याचा प्रयत्न कायद्यानुसार दंडनीय ठरेल.',
      descEn:
        'Citizens registering as volunteers or submitting inquiries must provide truthful and accurate information. Submitting fraudulent claims or attempting to disrupt digital infrastructure will be subject to applicable legal remedies.',
    },
    {
      id: 'third-party-links',
      icon: ExternalLink,
      titleMr: '५. बाह्य सरकारी संकेतस्थळांचे दुवे',
      titleEn: '5. External Government Portals & Disclaimers',
      descMr:
        'नागरिकांच्या सुलभतेसाठी विविध केंद्र व राज्य शासकीय अधिकृत पोर्टल्सचे दुवे दिले आहेत. त्या बाह्य संकेतस्थळांची गोपनीयता धोरणे, उपलब्धता आणि सामग्रीसाठी संस्था जबाबदार नाही.',
      descEn:
        'For citizen convenience, verified external links to statutory Central and State government portals are provided. The Sanstha does not control and is not liable for third-party portal operations or content policies.',
    },
    {
      id: 'jurisdiction',
      icon: Building2,
      titleMr: '६. कायदेशीर मर्यादा व अधिकार क्षेत्र',
      titleEn: '6. Limitation of Liability & Legal Jurisdiction',
      descMr:
        'संकेतस्थळाशी संबंधित कोणताही कायदेशीर वाद किंवा तक्रार ही केवळ कन्नड व छत्रपती संभाजीनगर (महाराष्ट्र) येथील सक्षम न्यायालयांच्या अधिकार कक्षेत राहील.',
      descEn:
        'Any legal disputes or proceedings arising out of or related to this website shall be subject exclusively to the jurisdiction of the competent courts in Kannad and Chhatrapati Sambhajinagar, Maharashtra, India.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-24 font-sans text-slate-800">
      {/* Hero Header Section */}
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
              <span>{lang === 'mr' ? 'मुख्यपृष्ठ' : 'Home'}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-amber-400 font-semibold">
              {lang === 'mr' ? 'अटी व शर्ती' : 'Terms & Conditions'}
            </span>
          </nav>

          {/* Hero Content */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {lang === 'mr'
                  ? '॥ श्रीकृष्णाय नमः ॥ • अधिकृत सेवा अटी व शर्ती'
                  : 'Official Terms of Service & Legal Guidelines'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-normal leading-tight">
              {lang === 'mr' ? 'अटी व शर्ती (सेवा नियम)' : 'Terms & Conditions of Service'}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-sans max-w-3xl">
              {lang === 'mr'
                ? 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नादरपूर यांच्या संकेतस्थळाच्या वापराबाबतचे अधिकृत नियम, कायदेशीर तरतुदी आणि नागरिक सेवा मार्गदर्शक तत्त्वे.'
                : 'Official terms of acceptable use, intellectual property standards, statutory guidelines, and community service policies of Shrikrushna Sanstha.'}
            </p>

            <div className="pt-1 flex flex-wrap items-center gap-4 text-xs text-slate-300 font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 border border-white/15">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {lang === 'mr'
                    ? 'नोंदणी क्र. एक १४६६८ (औ)'
                    : 'Reg. No. Ek 14668 (A)'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 border border-white/15">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {lang === 'mr'
                    ? 'कार्यक्षेत्र: नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर'
                    : 'Location: Nadarpur, Block Kannad, Dist. Chhatrapati Sambhajinagar'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {termsSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.id}
                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200 shadow-sm hover:shadow-md transition-shadow space-y-3.5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0868C9] border border-blue-100 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-base sm:text-lg font-serif font-bold text-slate-900 leading-snug">
                    {lang === 'mr' ? sec.titleMr : sec.titleEn}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                    {lang === 'mr' ? sec.descMr : sec.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact & Grievance Redressal Card */}
        <div className="bg-gradient-to-r from-[#061A3C] via-[#0A2540] to-[#0868C9] text-white rounded-3xl p-6 sm:p-10 shadow-xl space-y-6">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              {lang === 'mr' ? 'तक्रार निवारण व संपर्क' : 'Grievance Redressal & Official Contact'}
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white leading-tight">
              {lang === 'mr'
                ? 'नियम किंवा सेवेबाबत काही प्रश्न असल्यास थेट संपर्क साधा'
                : 'Have Questions or Inquiries Regarding Terms of Service?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {lang === 'mr'
                ? 'संस्थेच्या नियमावली, उपक्रम किंवा दस्तऐवजांबाबत कोणत्याही अधिकृत मार्गदर्शनासाठी आमचे कार्यालय नागरिक सेवेसाठी सदैव उपलब्ध आहे.'
                : 'For official clarifications or inquiries regarding our terms, reach out directly to our headquarters desk.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10 text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-slate-200">
                {lang === 'mr'
                  ? 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर'
                  : 'Nadarpur, Kannad, Chhatrapati Sambhajinagar'}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-emerald-300 shrink-0" />
              <a href="tel:+919923512482" className="text-slate-200 hover:text-white font-mono">
                +91 9923512482
              </a>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-sky-300 shrink-0" />
              <a
                href="mailto:shrikrushnasanstha.nadarpur@gmail.com"
                className="text-slate-200 hover:text-white underline break-all text-xs"
              >
                shrikrushnasanstha.nadarpur@gmail.com
              </a>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setCurrentRoute('contact')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer shadow-md"
            >
              <span>{lang === 'mr' ? 'संपर्क कक्षाशी बोला' : 'Contact Helpdesk'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentRoute('privacy')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
            >
              <span>{lang === 'mr' ? 'गोपनीयता धोरण पाहा' : 'View Privacy Policy'}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
