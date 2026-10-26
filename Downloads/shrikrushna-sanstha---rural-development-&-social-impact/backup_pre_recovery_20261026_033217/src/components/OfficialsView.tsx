import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { OfficialItem } from '../types';
import {
  Award,
  ShieldCheck,
  Users,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  X,
  FileCheck2,
  Sparkles,
  HeartHandshake,
  UserCheck,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

export const OfficialsView: React.FC = () => {
  const { state, setCurrentRoute, lang } = useSanstha();
  const shouldReduceMotion = useReducedMotion();

  // Active modal state for inspecting full official biography & credentials
  const [selectedOfficial, setSelectedOfficial] = useState<OfficialItem | null>(null);

  // Keyboard accessibility: dismiss modal on Escape key
  useEffect(() => {
    if (!selectedOfficial) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedOfficial(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedOfficial]);

  // Dynamic Page metadata from CMS/Database (site_pages table)
  const officialsPage = useMemo(
    () => (state.sitePages || []).find((p) => p.slug === 'officials'),
    [state.sitePages]
  );

  // Published officials ordered by CMS display_order
  const publishedOfficials = useMemo(() => {
    return (state.officials || [])
      .filter((o) => o.published !== false)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [state.officials]);

  // Verified registration & headquarters strings from contact_info table in MySQL
  const regNumber = lang === 'mr'
    ? (state.contactInfo?.regNoMr || 'रजि. क्र.: एक १४६६८ (औ)')
    : (state.contactInfo?.regNoEn || 'Reg. No.: Ek 14668 (A)');

  const headquartersLocation = state.contactInfo?.taluka
    ? (lang === 'mr'
        ? `मु. पो. नादरपूर, ता. ${state.contactInfo.taluka}, जि. ${state.contactInfo.district}`
        : `At Post Nadarpur, Block ${state.contactInfo.talukaEn || state.contactInfo.taluka}, Dist. ${state.contactInfo.districtEn || state.contactInfo.district}`)
    : (lang === 'mr' ? 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर' : 'Nadarpur, Kannad, Dist. Chhatrapati Sambhajinagar');

  const handleNav = useCallback((route: Parameters<typeof setCurrentRoute>[0]) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setCurrentRoute]);

  // Helper to extract clean initials for dignified monogram fallback
  const getInitials = (name: string) => {
    const parts = name.replace(/^(श्री\.|श्रीमती|डॉ\.|Shri\.|Smt\.|Dr\.)\s*/i, '').trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}.${parts[parts.length - 1].charAt(0)}.`;
    }
    return parts[0]?.slice(0, 2) || 'सं';
  };

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
            <button
              onClick={() => handleNav('about')}
              className="text-slate-600 hover:text-[#0868C9] transition-colors cursor-pointer"
            >
              {lang === 'mr' ? 'संस्थेविषयी' : 'About Us'}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#0868C9] font-medium">
              {lang === 'mr' ? 'पदाधिकारी' : 'Officials'}
            </span>
          </nav>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* 2. Hero Section: Editorial Institutional Leadership Banner */}
        <section className="relative">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
            className="space-y-4 text-left max-w-4xl"
          >
            {/* Institutional Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-serif font-bold text-[#0868C9]">
              <span className="w-2 h-2 rounded-full bg-[#E52E3D]" />
              <span>
                {lang === 'mr'
                  ? '॥ श्रीकृष्णाय नमः ॥ • अधिकृत विश्वस्त व कार्यकारी मंडळ'
                  : 'Official Board of Trustees & Executive Leadership'}
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 tracking-tight leading-[1.2]">
              {officialsPage?.isPublished && (lang === 'mr' ? officialsPage.titleMr : officialsPage.titleEn || officialsPage.titleMr)
                ? (lang === 'mr' ? officialsPage.titleMr : officialsPage.titleEn || officialsPage.titleMr)
                : (lang === 'mr' ? 'संस्थेचे पदाधिकारी व कार्यकारिणी मंडळ' : 'Institute Officials & Executive Board')}
            </h1>

            {/* Subtitle / Narrative */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 leading-relaxed font-sans">
              {officialsPage?.isPublished && (lang === 'mr' ? officialsPage.metaDescriptionMr : officialsPage.metaDescriptionEn || officialsPage.metaDescriptionMr)
                ? (lang === 'mr' ? officialsPage.metaDescriptionMr : officialsPage.metaDescriptionEn || officialsPage.metaDescriptionMr)
                : (lang === 'mr'
                  ? 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेचे कामकाज लोकशाही पद्धतीने, निस्वार्थ सेवेच्या भावनेने आणि कायदेशीर पारदर्शकतेने चालवणारे समर्पित विश्वस्त व पदाधिकारी.'
                  : 'Dedicated social trustees and executive leaders governing Shrikrushna Sanskrutik Va Gramin Vikas Sanstha democratically, transparently, and selflessly.')}
            </p>

            {/* Statutory Compliance & Base Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-slate-900">{regNumber}</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200/90 shadow-2xs text-slate-700">
                <MapPin className="w-4 h-4 text-[#0868C9] shrink-0" />
                <span className="truncate">{headquartersLocation}</span>
              </div>

              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/80 border border-blue-100 text-[#0868C9] font-semibold">
                <Users className="w-4 h-4 text-[#0868C9] shrink-0" />
                <span>
                  {publishedOfficials.length}{' '}
                  {lang === 'mr' ? 'सक्रिय विश्वस्त व पदाधिकारी' : 'Active Executive Trustees'}
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. Officials Grid */}
        <section className="space-y-6">
          {publishedOfficials.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 space-y-3">
              <Users className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm font-medium">
                {lang === 'mr' ? 'सध्या कोणतीही माहिती उपलब्ध नाही.' : 'No officials listed yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-7">
              {publishedOfficials.map((official, idx) => {
                const name = lang === 'mr' ? official.name : official.nameEn || official.name;
                const role = lang === 'mr' ? official.role : official.roleEn || official.role;
                const bio = lang === 'mr' ? official.bio : official.bioEn || official.bio;

                // Determine if this is executive leadership (Secretary / President)
                const isKeyLeader = idx < 2;

                return (
                  <div
                    key={official.id}
                    onClick={() => setSelectedOfficial(official)}
                    className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-lg hover:border-[#0868C9] hover:-translate-y-1 transition-[transform,box-shadow,border-color] duration-200 will-change-transform flex flex-col justify-between text-left cursor-pointer group"
                    role="button"
                    tabIndex={0}
                    aria-label={`${name} - ${role}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedOfficial(official);
                      }
                    }}
                  >
                    <div>
                      {/* Portrait Container with Dignified Fallback */}
                      <div className="relative aspect-[4/4] w-full bg-slate-100 overflow-hidden">
                        {official.imageUrl ? (
                          <img
                            src={official.imageUrl}
                            alt={name}
                            width={320}
                            height={320}
                            loading={idx < 4 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                            onError={(e) => {
                              // Dignified branded fallback: never display broken icon or fake replacement
                              e.currentTarget.style.display = 'none';
                              const fallbackDiv = e.currentTarget.nextElementSibling;
                              if (fallbackDiv) {
                                fallbackDiv.classList.remove('hidden');
                              }
                            }}
                          />
                        ) : null}

                        {/* Branded Dignified Fallback Avatar */}
                        <div
                          className={`${official.imageUrl ? 'hidden' : 'flex'} w-full h-full flex-col items-center justify-center bg-gradient-to-tr from-[#061A3C] via-[#092B60] to-[#0868C9] text-white p-6 text-center select-none`}
                        >
                          <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-3 shadow-inner">
                            <span className="text-xl font-serif font-black tracking-wider text-[#38BDF8]">
                              {getInitials(name)}
                            </span>
                          </div>
                          <span className="text-xs font-semibold text-slate-200">
                            {lang === 'mr' ? 'अधिकृत विश्वस्त' : 'Official Trustee'}
                          </span>
                        </div>

                        {/* Ambient subtle vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />

                        {/* Floating Role Badge */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl shadow-md border backdrop-blur-xs max-w-full truncate ${
                              isKeyLeader
                                ? 'bg-[#061A3C]/95 text-white border-blue-400/40'
                                : 'bg-white/95 text-slate-800 border-slate-200'
                            }`}
                          >
                            <Award className={`w-3.5 h-3.5 shrink-0 ${isKeyLeader ? 'text-[#38BDF8]' : 'text-[#0868C9]'}`} />
                            <span className="truncate">{role}</span>
                          </span>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 space-y-2.5">
                        <h2 className="text-lg font-serif font-bold text-slate-900 leading-snug group-hover:text-[#0868C9] transition-colors">
                          {name}
                        </h2>

                        {bio && (
                          <p className="text-xs sm:text-[13px] text-slate-600 font-sans leading-relaxed line-clamp-3">
                            {bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Detail Trigger Action */}
                    <div className="px-5 pb-4 pt-1 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#0868C9] group-hover:text-[#065096]">
                      <span>{lang === 'mr' ? 'सविस्तर परिचय' : 'View Full Profile'}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. Institutional Governance & Transparency Disclosure */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-left relative overflow-hidden space-y-6">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0868C9]">
              {lang === 'mr' ? 'संस्थात्मक प्रशासन व पारदर्शकता' : 'Institutional Governance & Transparency'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
              {lang === 'mr'
                ? 'लोकशाही कार्यपद्धती, विश्वस्त जबाबदारी आणि सामाजिक उत्तरदायित्व'
                : 'Democratic Operations, Trustee Fiduciary Duty & Public Accountability'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              {lang === 'mr'
                ? 'संस्थेची सर्व धोरणे, उपक्रम आणि आर्थिक हिशोब नियामक मंडळाच्या नियमांनुसार व धर्मादाय आयुक्त कार्यालयाकडील तरतुदींनुसार चालवले जातात. सर्वसामान्य नागरिक, ग्रामस्थ व दात्यांच्या विश्वासास पात्र राहणे हेच आमचे सर्वोच्च मूल्य आहे.'
                : 'All institutional activities, projects, and accounts are governed democratically under statutory trust bylaws and Charity Commissioner guidelines, maintaining full public fiduciary integrity.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Box 1: Democratic Management */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0868C9] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {lang === 'mr' ? '१. लोकशाही कार्यकारणी' : '1. Democratic Management'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'नियमित मासिक बैठका, सर्वसमावेशक निर्णय प्रक्रिया व स्थानिक ग्रामस्थांचा सक्रिय सहभाग.'
                  : 'Regular executive committee meetings, inclusive consensus, and community participation.'}
              </p>
            </div>

            {/* Box 2: Statutory Compliance */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {lang === 'mr' ? '२. कायदेशीर नोंदणी व हिशोब' : '2. Statutory Compliance'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'नोंदणी क्र. एक १४६६८ (औ), अधिकृत सनदी लेखापालांकडून (CA) वार्षिक लेखापरीक्षण.'
                  : 'Reg. No. Ek 14668 (A), certified Chartered Accountant annual audits and reports.'}
              </p>
            </div>

            {/* Box 3: Grassroots Outreach */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {lang === 'mr' ? '३. तळागाळातील सेवाभाव' : '3. Grassroots Outreach'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'नादरपूर व परिसरातील १२+ गावे व वाड्यांमध्ये थेट लाभार्थी संवाद व अखंड लोकसेवा.'
                  : 'Direct engagement across 12+ villages in Kannad Block with compassionate rural service.'}
              </p>
            </div>
          </div>
        </section>

        {/* 5. Pre-Footer Call to Action Transition Banner */}
        <section className="pt-2">
          <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-r from-[#051838] via-[#093374] to-[#051838] p-6 sm:p-10 lg:p-12 border border-slate-700/60 text-white text-left">
            {/* Luminous GPU-accelerated radial glows */}
            <div className="absolute -top-12 -left-12 w-72 h-72 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,transparent_70%)] pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-72 h-72 bg-[radial-gradient(ellipse_at_center,rgba(8,104,201,0.22)_0%,transparent_70%)] pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                  {lang === 'mr' ? 'सहकार्य व संपर्क' : 'Connect with Leadership'}
                </span>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-bold text-white leading-snug">
                  {lang === 'mr'
                    ? 'संस्थेच्या कार्यकारणीशी थेट संपर्क साधा'
                    : 'Connect Directly with Our Secretariat & Trustees'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {lang === 'mr'
                    ? 'शैक्षणिक, सांस्कृतिक किंवा ग्रामीण विकास प्रकल्पांसाठी मार्गदर्शन अथवा सहकार्याकरिता आमच्या कार्यालयाशी संपर्क करा.'
                    : 'Reach out to our registered office for educational, cultural, or rural welfare partnerships and inquiries.'}
                </p>

                {/* Verified contact strings */}
                <div className="pt-1 flex flex-wrap items-center gap-3 text-xs text-slate-300">
                  {state.contactInfo?.phone && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{state.contactInfo.phone.split(',')[0].trim()}</span>
                    </span>
                  )}
                  {state.contactInfo?.email && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-lg">
                      <Mail className="w-3 h-3 text-cyan-400" />
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
                  onClick={() => handleNav('reports')}
                  className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95 w-full sm:w-auto"
                >
                  <FileCheck2 className="w-4 h-4 text-[#38BDF8]" />
                  <span>{lang === 'mr' ? 'वार्षिक अहवाल पाहा' : 'Audit Reports'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 6. Accessible Official Profile Detail Modal */}
      {selectedOfficial && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="official-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedOfficial(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header Bar with Close Button */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#061A3C] to-[#092B60] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#38BDF8]" />
                <span className="text-xs font-semibold text-slate-200">
                  {lang === 'mr' ? 'अधिकृत विश्वस्त परिचय' : 'Official Leadership Profile'}
                </span>
              </div>
              <button
                onClick={() => setSelectedOfficial(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label={lang === 'mr' ? 'बंद करा' : 'Close modal'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 sm:p-8 space-y-5">
              <div className="flex items-start gap-4 sm:gap-5">
                {/* Photo or Dignified Monogram */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-100 border-2 border-[#0868C9]/30 shrink-0">
                  {selectedOfficial.imageUrl ? (
                    <img
                      src={selectedOfficial.imageUrl}
                      alt={lang === 'mr' ? selectedOfficial.name : selectedOfficial.nameEn || selectedOfficial.name}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-[#061A3C] to-[#0868C9] text-white">
                      <span className="text-xl font-bold font-serif text-[#38BDF8]">
                        {getInitials(selectedOfficial.name)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 min-w-0">
                  <h2 id="official-modal-title" className="text-xl sm:text-2xl font-serif font-bold text-slate-900 leading-snug">
                    {lang === 'mr' ? selectedOfficial.name : selectedOfficial.nameEn || selectedOfficial.name}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 border border-blue-100 text-[#0868C9] text-xs font-semibold">
                    <Award className="w-3.5 h-3.5 text-[#0868C9] shrink-0" />
                    <span className="truncate">
                      {lang === 'mr' ? selectedOfficial.role : selectedOfficial.roleEn || selectedOfficial.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Biography */}
              {(selectedOfficial.bio || selectedOfficial.bioEn) && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                  <p>
                    {lang === 'mr'
                      ? selectedOfficial.bio || selectedOfficial.bioEn
                      : selectedOfficial.bioEn || selectedOfficial.bio}
                  </p>
                </div>
              )}

              {/* Institutional Details */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{lang === 'mr' ? 'संस्था नोंदणी:' : 'Trust Registration:'}</span>
                  <span className="font-semibold text-slate-800">{regNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{lang === 'mr' ? 'मुख्यालय:' : 'Base:'}</span>
                  <span className="font-medium text-slate-800">नादरपूर (कन्नड, छत्रपती संभाजीनगर)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setSelectedOfficial(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {lang === 'mr' ? 'बंद करा' : 'Close'}
                </button>
                <button
                  onClick={() => {
                    setSelectedOfficial(null);
                    handleNav('contact');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#0868C9] hover:bg-[#065096] text-white text-xs font-bold shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'संपर्क साधा' : 'Contact Office'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
