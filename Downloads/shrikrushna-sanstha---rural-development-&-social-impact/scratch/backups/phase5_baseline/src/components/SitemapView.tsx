import React from 'react';
import { useSanstha } from '../context/SansthaContext';
import { PageRoute } from '../types';
import {
  Home,
  Users,
  Award,
  Sparkles,
  BookOpen,
  Landmark,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  HeartHandshake,
  Phone,
  ShieldCheck,
  FileCheck2,
  Lock,
  ChevronRight,
  ExternalLink,
  ArrowRight,
  Compass,
} from 'lucide-react';

interface SitemapCategory {
  titleMr: string;
  titleEn: string;
  routes: {
    route: PageRoute;
    icon: React.FC<{ className?: string }>;
    titleMr: string;
    titleEn: string;
    descMr: string;
    descEn: string;
  }[];
}

export const SitemapView: React.FC = () => {
  const { setCurrentRoute, lang } = useSanstha();

  const handleNav = (route: PageRoute) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sitemapCategories: SitemapCategory[] = [
    {
      titleMr: '१. संस्था परिचय व प्रशासन',
      titleEn: '1. Institutional Overview & Governance',
      routes: [
        {
          route: 'home',
          icon: Home,
          titleMr: 'मुख्यपृष्ठ',
          titleEn: 'Home Page',
          descMr: 'संस्थेचे मुख्य उद्दिष्ट, ध्येय, सांख्यिकी आढावा आणि ताज्या घडामोडी.',
          descEn: 'Institutional mission, key metrics, overview of core social pillars and latest highlights.',
        },
        {
          route: 'about',
          icon: Landmark,
          titleMr: 'संस्थेविषयी',
          titleEn: 'About Sanstha',
          descMr: 'संस्थेचा इतिहास, विचारसरणी, कार्यक्षेत्र रूपरेषा, ६ प्रमुख कार्यस्तंभ आणि ध्येयवाद.',
          descEn: 'Institutional genesis, operational philosophy, 6 pillars of impact, and history.',
        },
        {
          route: 'officials',
          icon: Users,
          titleMr: 'पदाधिकारी व कार्यकारिणी',
          titleEn: 'Officials & Executive Board',
          descMr: 'विश्वस्त मंडळ, कार्यकारी सदस्य, भूमिका, कार्यकाळ आणि संस्थात्मक पारदर्शकता.',
          descEn: 'Board of Trustees, executive committee members, and governance accountability.',
        },
      ],
    },
    {
      titleMr: '२. समाजकल्याण, उपक्रम व योजना',
      titleEn: '2. Community Welfare, Drives & Schemes',
      routes: [
        {
          route: 'initiatives',
          icon: Sparkles,
          titleMr: 'प्रमुख उपक्रम व प्रकल्प',
          titleEn: 'Major Initiatives',
          descMr: 'CSC बाल विद्यालय, RTE २५% प्रवेश अभियान, विनामूल्य आरोग्य शिबिरे व महिला सक्षमीकरण.',
          descEn: 'CSC Bal Vidyalaya, RTE 25% admission drives, preventive health camps, and ecology.',
        },
        {
          route: 'schemes',
          icon: Award,
          titleMr: 'शासकीय कल्याणकारी योजना',
          titleEn: 'Government Welfare Schemes',
          descMr: 'संजय गांधी निराधार योजना, श्रावणबाळ निवृत्तीवेतन, ई-श्रम नोंदणी व थेट नागरिक मदत.',
          descEn: 'Direct citizen facilitation for Sanjay Gandhi Niradhar, Shravanbal, and e-Shram schemes.',
        },
        {
          route: 'work',
          icon: BookOpen,
          titleMr: 'प्रत्यक्ष कार्य कालक्रम',
          titleEn: 'Field Work Timeline',
          descMr: 'तळागाळातील ग्रामीण भागातील कामांची कालक्रमानुसार अधिकृत नोंद आणि सविस्तर माहिती.',
          descEn: 'Chronological timeline and archival documentation of field activities across villages.',
        },
      ],
    },
    {
      titleMr: '३. प्रसिद्धी, माध्यम व पारदर्शकता',
      titleEn: '3. Media Archives, Reports & Transparency',
      routes: [
        {
          route: 'gallery',
          icon: ImageIcon,
          titleMr: 'छायाचित्र दालन',
          titleEn: 'Photo Gallery',
          descMr: 'उपक्रमांची उच्च दर्जाची क्षणचित्रे, अल्बम वर्गीकरण व समाजकार्याचा दृश्य प्रवास.',
          descEn: 'Curated photo archive covering education workshops, tree plantation, and healthcare.',
        },
        {
          route: 'videos',
          icon: Video,
          titleMr: 'व्हिडिओ दालन',
          titleEn: 'Video Library',
          descMr: 'वृत्तचित्रे, बाल विद्यालय उपक्रम आणि समाजोपयोगी व्हिडिओ रेकॉर्डिंग्ज.',
          descEn: 'High-definition video documentaries of grassroots initiatives and community drives.',
        },
        {
          route: 'reports',
          icon: FileText,
          titleMr: 'वार्षिक अहवाल व दस्तऐवज',
          titleEn: 'Annual Reports & Disclosures',
          descMr: 'अधिकृत वार्षिक कार्य अहवाल, हिशोब तपासणी, पारदर्शकता व सार्वजनिक प्रकटीकरण.',
          descEn: 'Certified annual activity summaries and transparency disclosures for public review.',
        },
        {
          route: 'news',
          icon: Calendar,
          titleMr: 'बातम्या व प्रसिद्धी पत्रके',
          titleEn: 'News & Announcements',
          descMr: 'संस्थेचे आगामी कार्यक्रम, महत्त्वाच्या सूचना आणि वृत्तपत्र प्रसिद्धी कात्रणे.',
          descEn: 'Official news bulletins, forthcoming program schedules, and press releases.',
        },
      ],
    },
    {
      titleMr: '४. नागरिक सहभाग, संपर्क व कायदेशीर',
      titleEn: '4. Citizen Engagement, Helpdesk & Legal',
      routes: [
        {
          route: 'volunteer',
          icon: HeartHandshake,
          titleMr: 'स्वयंसेवक नोंदणी',
          titleEn: 'Volunteer Registration',
          descMr: 'ग्रामीण परिवर्तनासाठी विनामूल्य स्वयंसेवक सहभाग नोंदणी व अधिकृत प्रमाणपत्र संधी.',
          descEn: 'Free citizen volunteer enrollment to contribute skills and time for rural upliftment.',
        },
        {
          route: 'contact',
          icon: Phone,
          titleMr: 'संपर्क व मदत कक्ष',
          titleEn: 'Contact & Citizen Helpdesk',
          descMr: 'मुख्यालय पत्ता, संपर्क दूरध्वनी, ईमेल, कार्यालयीन वेळ व थेट संदेश सुविधा.',
          descEn: 'Headquarters postal address, dedicated helplines, visiting hours, and online inquiry form.',
        },
        {
          route: 'privacy',
          icon: ShieldCheck,
          titleMr: 'गोपनीयता धोरण',
          titleEn: 'Privacy & Data Protection',
          descMr: 'नागरिकांची माहिती सुरक्षितता, डेटा संरक्षण आणि लाभार्थी सन्मान संहिता.',
          descEn: 'Privacy principles, non-commercial data policies, and beneficiary dignity guidelines.',
        },
        {
          route: 'terms',
          icon: FileCheck2,
          titleMr: 'अटी व शर्ती (सेवा नियम)',
          titleEn: 'Terms & Conditions',
          descMr: 'संकेतस्थळ वापराबाबतचे अधिकृत नियम, बौद्धिक संपदा आणि कायदेशीर अधिकार क्षेत्र.',
          descEn: 'Acceptable use standards, intellectual property protection, and legal jurisdiction.',
        },
        {
          route: 'admin',
          icon: Lock,
          titleMr: 'प्रशासकीय कक्ष (Admin Portal)',
          titleEn: 'Administrative Portal',
          descMr: 'अधिकृत प्रशासकांसाठी संकेतस्थळ सामग्री व्यवस्थापन व नियंत्रण प्रणाली.',
          descEn: 'Secured administrative portal for verified CMS management and inquiries review.',
        },
      ],
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
              onClick={() => handleNav('home')}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <span>{lang === 'mr' ? 'मुख्यपृष्ठ' : 'Home'}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-amber-400 font-semibold">
              {lang === 'mr' ? 'संकेतस्थळ नकाशा' : 'Sitemap'}
            </span>
          </nav>

          {/* Hero Content */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-xs">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {lang === 'mr'
                  ? '॥ श्रीकृष्णाय नमः ॥ • संपूर्ण संकेतस्थळ संरचना व अनुक्रमणिका'
                  : 'Institutional Site Index & Navigation Map'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-normal leading-tight">
              {lang === 'mr' ? 'संकेतस्थळ नकाशा (Sitemap)' : 'Institutional Website Sitemap'}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-sans max-w-3xl">
              {lang === 'mr'
                ? 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेच्या अधिकृत संकेतस्थळावरील सर्व प्रमुख विभाग, उपक्रम, अहवाल आणि सेवांची संपूर्ण यादी.'
                : 'A comprehensive, structured architectural directory of all public routes, administrative portals, and resources on this website.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content Categories */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 space-y-10">
        {sitemapCategories.map((cat, idx) => (
          <section key={idx} className="space-y-4">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#061A3C] border-b border-slate-200 pb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E52E3D]" />
              <span>{lang === 'mr' ? cat.titleMr : cat.titleEn}</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.routes.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.route}
                    onClick={() => handleNav(item.route)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#0868C9] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleNav(item.route)}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0868C9] border border-blue-100 flex items-center justify-center group-hover:bg-[#061A3C] group-hover:text-white transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 group-hover:text-[#0868C9] transition-colors">
                          #/{item.route}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-base text-slate-900 group-hover:text-[#0868C9] transition-colors">
                        {lang === 'mr' ? item.titleMr : item.titleEn}
                      </h3>
                      <p className="text-xs text-slate-600 leading-relaxed font-sans line-clamp-2">
                        {lang === 'mr' ? item.descMr : item.descEn}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0868C9]">
                      <span>{lang === 'mr' ? 'पृष्ठावर जा' : 'Open Page'}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};
