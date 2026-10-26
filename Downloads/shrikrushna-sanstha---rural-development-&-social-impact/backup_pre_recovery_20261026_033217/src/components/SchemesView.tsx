import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useSanstha } from '../context/SansthaContext';
import {
  Building2,
  Users,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  FileText,
  HelpCircle,
  PhoneCall,
  Sparkles,
  ChevronRight,
  X,
  FileCheck2,
  AlertCircle,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Award,
  Layers,
  Info
} from 'lucide-react';
import { GovernmentSchemeItem } from '../types';

/**
 * High-performance 3D Tilt Card wrapper
 * Uses direct DOM style mutation inside RAF to avoid React re-renders during mouse movement.
 * Completely disables on touch devices and respects prefers-reduced-motion.
 */
interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

const Card3D: React.FC<Card3DProps> = ({ children, className = '', onClick, 'aria-label': ariaLabel }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    const card = cardRef.current;
    const glare = glareRef.current;
    if (!card || !glare) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -2.5;
    const rotateY = ((x - centerX) / centerX) * 2.5;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      glare.style.opacity = '0.12';
      glare.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`;
    });
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    const card = cardRef.current;
    const glare = glareRef.current;
    if (card) {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';
    }
    if (glare) {
      glare.style.opacity = '0';
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease',
        transformStyle: 'preserve-3d',
      }}
      className={`relative rounded-2xl overflow-hidden will-change-transform ${className}`}
    >
      <div
        ref={glareRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 rounded-2xl"
        style={{ opacity: 0 }}
      />
      {children}
    </div>
  );
};

export const SchemesView: React.FC = () => {
  const { state, setCurrentRoute, lang, t, isLoading } = useSanstha();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [activeModalScheme, setActiveModalScheme] = useState<GovernmentSchemeItem | null>(null);

  // Live published schemes from SansthaContext, sorted deterministically
  const publishedSchemes = useMemo(() => {
    return (state.governmentSchemes || [])
      .filter((s) => s.published !== false)
      .sort((a, b) => {
        // Featured schemes first
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        // Then display order
        const orderDiff = (a.displayOrder || 0) - (b.displayOrder || 0);
        if (orderDiff !== 0) return orderDiff;
        // Deterministic fallback by id
        return a.id.localeCompare(b.id);
      });
  }, [state.governmentSchemes]);

  // Unique departments extracted dynamically from live records with stable id keys
  const departments = useMemo(() => {
    const list: { key: string; labelMr: string; labelEn: string }[] = [];
    const seen = new Set<string>();

    publishedSchemes.forEach((s) => {
      const deptMr = s.department?.trim() || '';
      const deptEn = s.departmentEn?.trim() || deptMr;
      const key = deptMr || deptEn;

      if (key && !seen.has(key)) {
        seen.add(key);
        list.push({
          key,
          labelMr: deptMr || deptEn,
          labelEn: deptEn || deptMr,
        });
      }
    });
    return list;
  }, [publishedSchemes]);

  // Filtered schemes: searches BOTH Marathi and English fields for true bilingual discovery
  const filteredSchemes = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return publishedSchemes.filter((scheme) => {
      // Department filter
      if (selectedDepartment !== 'all') {
        const curDeptKey = scheme.department?.trim() || scheme.departmentEn?.trim() || '';
        if (curDeptKey !== selectedDepartment) {
          return false;
        }
      }

      // Query filter: match against title, summary, department, beneficiary category, benefits, eligibility in both languages
      if (!q) return true;

      const titleMr = (scheme.title || '').toLowerCase();
      const titleEn = (scheme.titleEn || '').toLowerCase();
      const summaryMr = (scheme.summary || '').toLowerCase();
      const summaryEn = (scheme.summaryEn || '').toLowerCase();
      const deptMr = (scheme.department || '').toLowerCase();
      const deptEn = (scheme.departmentEn || '').toLowerCase();
      const catMr = (scheme.beneficiaryCategory || '').toLowerCase();
      const catEn = (scheme.beneficiaryCategoryEn || '').toLowerCase();
      const benefitsMr = (scheme.benefits || '').toLowerCase();
      const benefitsEn = (scheme.benefitsEn || '').toLowerCase();
      const eligMr = (scheme.eligibility || '').toLowerCase();
      const eligEn = (scheme.eligibilityEn || '').toLowerCase();

      return (
        titleMr.includes(q) ||
        titleEn.includes(q) ||
        summaryMr.includes(q) ||
        summaryEn.includes(q) ||
        deptMr.includes(q) ||
        deptEn.includes(q) ||
        catMr.includes(q) ||
        catEn.includes(q) ||
        benefitsMr.includes(q) ||
        benefitsEn.includes(q) ||
        eligMr.includes(q) ||
        eligEn.includes(q)
      );
    });
  }, [publishedSchemes, searchQuery, selectedDepartment]);

  // Handle body scroll locking only when modal is open
  useEffect(() => {
    if (activeModalScheme) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [activeModalScheme]);

  // Handle ESC key to dismiss modal only when active
  useEffect(() => {
    if (!activeModalScheme) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalScheme(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalScheme]);

  // Related grassroots initiatives (e.g. init-2)
  const relatedInitiative = useMemo(() => {
    return (
      (state.initiatives || []).find((i) => i.isGovernmentSchemeAwareness && i.published) ||
      (state.initiatives || []).find((i) => i.id === 'init-2')
    );
  }, [state.initiatives]);

  // Secretariat phone number parsing for helpline link
  const primaryPhone = useMemo(() => {
    const raw = state.contactInfo?.phone || '';
    const parts = raw.split(/[,/]/).map((p) => p.trim());
    return parts[0] || '+919923512482';
  }, [state.contactInfo]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#0868C9] selection:text-white">
      {/* 1. Breadcrumbs & Institutional Status Bar */}
      <section className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-medium">
            <button
              onClick={() => setCurrentRoute('home')}
              className="hover:text-[#061A3C] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{t.nav.home}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#061A3C] font-semibold">
              {lang === 'mr' ? 'शासकीय कल्याणकारी योजना' : 'Government Schemes'}
            </span>
          </nav>

          {/* Active Helpdesk Indicator Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                {lang === 'mr'
                  ? `सक्रिय योजना कक्ष (${publishedSchemes.length} योजना)`
                  : `Active Schemes Desk (${publishedSchemes.length} Schemes)`}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#061A3C] via-[#0A2540] to-[#0D2E4D] text-white py-12 sm:py-16 lg:py-20 border-b border-slate-800 shadow-inner">
        {/* Subtle Decorative Geometry */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/30 to-transparent blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl from-amber-400/20 to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Institutional Verification Badge */}
          <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm font-medium text-slate-200 shadow-sm">
            <span className="text-[#E52E3D] font-serif font-bold tracking-wide">॥ श्रीकृष्णाय नमः ॥</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300 font-semibold">
              {lang === 'mr' ? 'रजि. क्र.: एक १४६६८ (औ)' : 'Reg: Ek 14668 (A)'}
            </span>
            <span className="hidden md:inline text-white/40">•</span>
            <span className="hidden md:inline text-slate-300">
              {lang === 'mr' ? 'नीति आयोग Darpan: MH/2023/0365444' : 'NITI Aayog Darpan: MH/2023/0365444'}
            </span>
            <span className="hidden lg:inline text-white/40">•</span>
            <span className="hidden lg:inline text-slate-300">
              {lang === 'mr' ? 'जनहित व शासकीय योजना सहाय्यता कक्ष' : 'Citizen Welfare & Schemes Facilitation'}
            </span>
          </div>

          {/* Hero Titles */}
          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
              {lang === 'mr'
                ? 'शासकीय कल्याणकारी योजना व लोककल्याण कक्ष'
                : 'Government Welfare Schemes & Public Assistance'}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-sans font-normal max-w-3xl">
              {lang === 'mr'
                ? 'ग्रामीण भागातील वृद्ध, निराधार, दिव्यांग, कामगार, शेतकरी व गरजू कुटुंबांना विविध केंद्र व राज्य शासकीय योजनांचा थेट लाभ मिळवून देण्यासाठी संस्थेचे १००% विनामूल्य मार्गदर्शन व मदत.'
                : 'Free grassroots facilitation and documentation assistance connecting rural citizens, destitute families, elders, and laborers directly with official statutory government welfare schemes.'}
            </p>
          </div>

          {/* Quick Credibility Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'mr' ? '१००% विनामूल्य मार्गदर्शन' : '100% Free Public Assistance'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>{lang === 'mr' ? 'अधिकृत शासकीय पोर्टल जोडणी' : 'Official Portal Direct Links'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>
                {lang === 'mr' ? 'नादरपूर सचिवालय प्रत्यक्ष मदत कक्ष' : 'Nadarpur Secretariat Helpdesk'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search & Filter Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'mr'
                    ? 'योजनेचे नाव, विभाग किंवा लाभार्थ्यानुसार शोधा...'
                    : 'Search by scheme name, department, or beneficiary...'
                }
                aria-label={lang === 'mr' ? 'योजना शोधा' : 'Search schemes'}
                className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0868C9] focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  aria-label={lang === 'mr' ? 'शोध पुसा' : 'Clear search'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Schemes Count Badge */}
            <div className="flex items-center justify-between md:justify-end gap-2 text-xs font-medium text-slate-600 shrink-0">
              <span>
                {lang === 'mr'
                  ? `दर्शवत आहे: ${filteredSchemes.length} पैकी ${publishedSchemes.length} योजना`
                  : `Showing ${filteredSchemes.length} of ${publishedSchemes.length} schemes`}
              </span>
              {(searchQuery || selectedDepartment !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDepartment('all');
                  }}
                  className="text-[#0868C9] hover:underline font-semibold cursor-pointer text-xs"
                >
                  {lang === 'mr' ? 'सर्व रीसेट करा' : 'Reset all'}
                </button>
              )}
            </div>
          </div>

          {/* Department Filter Pills */}
          {departments.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none text-xs">
              <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0 pr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'mr' ? 'विभाग:' : 'Department:'}</span>
              </span>

              {/* All Option */}
              <button
                onClick={() => setSelectedDepartment('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  selectedDepartment === 'all'
                    ? 'bg-[#061A3C] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {lang === 'mr' ? 'सर्व योजना' : 'All Schemes'}
              </button>

              {/* Dynamic Departments */}
              {departments.map((dept) => {
                const isSelected = selectedDepartment === dept.key;
                const label = lang === 'mr' ? dept.labelMr : dept.labelEn;
                return (
                  <button
                    key={dept.key}
                    onClick={() => setSelectedDepartment(dept.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                      isSelected
                        ? 'bg-[#0868C9] text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. Schemes Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-8">
        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 animate-pulse"
              >
                <div className="h-4 bg-slate-200 rounded-md w-28" />
                <div className="h-6 bg-slate-200 rounded-md w-3/4" />
                <div className="h-16 bg-slate-100 rounded-xl w-full" />
                <div className="h-10 bg-slate-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredSchemes.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-4 max-w-xl mx-auto shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#061A3C]">
              {lang === 'mr' ? 'कोणतीही योजना आढळली नाही' : 'No Government Schemes Found'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {lang === 'mr'
                ? 'आपण प्रविष्ट केलेल्या निकषानुसार कोणतीही शासकीय योजना सापडली नाही. कृपया अन्य शब्द वापरून शोधा किंवा थेट आमच्या मदत कक्षाशी संपर्क साधा.'
                : 'No schemes match your query or filter. Try searching with different terms or reach out directly to our Nadarpur Secretariat Helpdesk.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedDepartment('all');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'फिल्टर पुसा' : 'Clear Filters'}
              </button>
              <button
                onClick={() => setCurrentRoute('contact')}
                className="px-4 py-2 bg-[#0868C9] hover:bg-[#065096] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'मदत कक्षाशी संपर्क साधा' : 'Contact Helpdesk'}
              </button>
            </div>
          </div>
        )}

        {/* Scheme Cards Grid */}
        {!isLoading && filteredSchemes.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSchemes.map((scheme) => {
              const title = lang === 'mr' ? scheme.title : scheme.titleEn || scheme.title;
              const summary = lang === 'mr' ? scheme.summary : scheme.summaryEn || scheme.summary;
              const department =
                lang === 'mr' ? scheme.department : scheme.departmentEn || scheme.department;
              const beneficiary =
                lang === 'mr'
                  ? scheme.beneficiaryCategory
                  : scheme.beneficiaryCategoryEn || scheme.beneficiaryCategory;
              const benefits =
                lang === 'mr' ? scheme.benefits : scheme.benefitsEn || scheme.benefits;
              const eligibility =
                lang === 'mr' ? scheme.eligibility : scheme.eligibilityEn || scheme.eligibility;

              return (
                <Card3D
                  key={scheme.id}
                  className="bg-white border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-[#0868C9]/40 flex flex-col justify-between transition-all group"
                  aria-label={title}
                >
                  <div className="p-5 sm:p-6 space-y-4">
                    {/* Top Row: Department and Priority Badge */}
                    <div className="flex items-start justify-between gap-2">
                      {department ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-[#0868C9] border border-blue-100/80 max-w-[85%] truncate">
                          <Building2 className="w-3 h-3 shrink-0 text-[#0868C9]" />
                          <span className="truncate">{department}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                          <Layers className="w-3 h-3 text-slate-500" />
                          <span>{lang === 'mr' ? 'शासकीय योजना' : 'Govt Scheme'}</span>
                        </span>
                      )}

                      {scheme.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span>{lang === 'mr' ? 'विशेष' : 'Priority'}</span>
                        </span>
                      )}
                    </div>

                    {/* Scheme Title */}
                    <h2 className="text-base sm:text-lg font-serif font-bold text-[#061A3C] group-hover:text-[#0868C9] transition-colors leading-snug">
                      {title}
                    </h2>

                    {/* Beneficiary Target Pill */}
                    {beneficiary && (
                      <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700">
                        <Users className="w-3.5 h-3.5 text-[#0868C9] shrink-0 mt-0.5" />
                        <div className="leading-relaxed">
                          <span className="font-semibold text-slate-900">
                            {lang === 'mr' ? 'पात्र लाभार्थी: ' : 'Eligible Group: '}
                          </span>
                          <span>{beneficiary}</span>
                        </div>
                      </div>
                    )}

                    {/* Summary Description */}
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans line-clamp-3">
                      {summary}
                    </p>

                    {/* Quick Highlights Snippet (Benefits / Eligibility) */}
                    {(benefits || eligibility) && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
                        {benefits && (
                          <div className="flex items-center gap-1.5 text-slate-700 truncate">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{benefits}</span>
                          </div>
                        )}
                        {eligibility && (
                          <div className="flex items-center gap-1.5 text-slate-600 truncate">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{eligibility}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                    {/* View Details Modal Trigger */}
                    <button
                      onClick={() => setActiveModalScheme(scheme)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#061A3C] hover:text-[#0868C9] transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white"
                    >
                      <Info className="w-3.5 h-3.5 text-[#0868C9]" />
                      <span>{lang === 'mr' ? 'तपशील व निकष' : 'View Details'}</span>
                    </button>

                    {/* Outbound Official Portal Link */}
                    {scheme.officialPortalUrl ? (
                      <a
                        href={scheme.officialPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0868C9] hover:bg-[#065096] text-white text-xs font-semibold rounded-lg shadow-2xs transition-all cursor-pointer"
                        title={lang === 'mr' ? 'अधिकृत शासकीय पोर्टल उघडा' : 'Open Official Govt Portal'}
                      >
                        <span>{lang === 'mr' ? 'अधिकृत पोर्टल' : 'Official Portal'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <button
                        onClick={() => setCurrentRoute('contact')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
                        title={lang === 'mr' ? 'मदत कक्षाशी संपर्क साधा' : 'Contact secretariat desk'}
                      >
                        <span>{lang === 'mr' ? 'मदत कक्ष' : 'Helpdesk'}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </Card3D>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Grassroots Implementation & Awareness Section */}
      {relatedInitiative && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="bg-gradient-to-br from-[#0A2540] to-[#061A3C] rounded-3xl p-6 sm:p-8 lg:p-10 text-white shadow-md relative overflow-hidden border border-slate-700">
            {/* Ambient Background Accents */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-amber-300 border border-white/10">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {lang === 'mr' ? 'संस्थेचे प्रत्यक्ष उपक्रम' : 'Sanstha Grassroots Drive'}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  {lang === 'mr'
                    ? relatedInitiative.title
                    : relatedInitiative.titleEn || relatedInitiative.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {lang === 'mr'
                    ? relatedInitiative.summary
                    : relatedInitiative.summaryEn || relatedInitiative.summary}
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {lang === 'mr'
                        ? relatedInitiative.location || 'नादरपूर व कन्नड परिसर'
                        : relatedInitiative.locationEn || 'Nadarpur & Kannad Region'}
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>
                      {lang === 'mr'
                        ? 'आधार, निराधार व पेन्शन अर्ज सहाय्य'
                        : 'Aadhaar, Pension & Welfare Support'}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
                <button
                  onClick={() => setCurrentRoute('initiatives')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-[#061A3C] hover:bg-slate-100 text-xs font-bold transition-all shadow-sm cursor-pointer"
                >
                  <span>{lang === 'mr' ? 'सर्व उपक्रम पहा' : 'View All Initiatives'}</span>
                  <ArrowRight className="w-4 h-4 text-[#0868C9]" />
                </button>
                <button
                  onClick={() => setCurrentRoute('contact')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-400" />
                  <span>{lang === 'mr' ? 'मार्गदर्शन शिबीर चौकशी' : 'Inquire for Camp'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Nadarpur Helpdesk Assistance Advisory */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0868C9] border border-blue-100 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#061A3C]">
                {lang === 'mr'
                  ? 'ऑनलाइन अर्ज भरण्यास अडचणी येत आहेत?'
                  : 'Facing difficulty applying online?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl font-sans">
                {lang === 'mr'
                  ? 'ग्रामीण भागातील वृद्ध, दिव्यांग अथवा अशिक्षित नागरिकांना शासकीय योजनांचे फॉर्म भरण्यासाठी, कागदपत्रे तपासणीसाठी आणि ऑनलाइन सबमिशनसाठी नादरपूर येथील आमच्या कार्यालयात विनामूल्य मदत केली जाते.'
                  : 'Senior citizens, differently-abled, or rural families can visit our Nadarpur Secretariat Office for free on-ground document verification, form filling, and submission guidance.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto">
            <a
              href={`tel:${primaryPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
              <span>{lang === 'mr' ? 'हेल्पलाईन संपर्क' : 'Helpline Support'}</span>
            </a>
            <button
              onClick={() => setCurrentRoute('contact')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#061A3C] hover:bg-[#0868C9] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <span>{lang === 'mr' ? 'संपर्क पत्ता व वेळ' : 'Visit Secretariat'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 7. Scheme Detail Modal Dialog (Mobile-Accessible, No Viewport Clipping) */}
      {activeModalScheme && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-scheme-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setActiveModalScheme(null)}
        >
          <div
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#061A3C] to-[#0A2540] text-white flex items-start justify-between gap-4 border-b border-slate-700 shrink-0">
              <div className="space-y-1.5 max-w-[85%]">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-white/10 text-amber-300 border border-white/15">
                  <Building2 className="w-3 h-3 text-amber-300" />
                  <span className="truncate">
                    {lang === 'mr'
                      ? activeModalScheme.department || 'शासकीय कल्याणकारी योजना'
                      : activeModalScheme.departmentEn || activeModalScheme.department || 'Welfare Scheme'}
                  </span>
                </div>
                <h2
                  id="modal-scheme-title"
                  className="text-lg sm:text-xl font-serif font-bold text-white leading-snug"
                >
                  {lang === 'mr'
                    ? activeModalScheme.title
                    : activeModalScheme.titleEn || activeModalScheme.title}
                </h2>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => setActiveModalScheme(null)}
                aria-label={lang === 'mr' ? 'खिडकी बंद करा' : 'Close modal'}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-slate-700 text-xs sm:text-sm">
              {/* Beneficiary Pill */}
              {(activeModalScheme.beneficiaryCategory || activeModalScheme.beneficiaryCategoryEn) && (
                <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-3">
                  <Users className="w-4 h-4 text-[#0868C9] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-[#061A3C]">
                      {lang === 'mr' ? 'पात्र लाभार्थी वर्ग' : 'Target Beneficiary Group'}
                    </h4>
                    <p className="text-slate-700 mt-0.5 leading-relaxed">
                      {lang === 'mr'
                        ? activeModalScheme.beneficiaryCategory
                        : activeModalScheme.beneficiaryCategoryEn || activeModalScheme.beneficiaryCategory}
                    </p>
                  </div>
                </div>
              )}

              {/* Full Summary */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#061A3C] flex items-center gap-1.5 text-xs sm:text-sm">
                  <FileText className="w-4 h-4 text-[#0868C9]" />
                  <span>{lang === 'mr' ? 'योजनेचा उद्देश व माहिती' : 'Scheme Overview & Purpose'}</span>
                </h4>
                <p className="text-slate-600 leading-relaxed font-sans">
                  {lang === 'mr'
                    ? activeModalScheme.summary
                    : activeModalScheme.summaryEn || activeModalScheme.summary}
                </p>
              </div>

              {/* Benefits & Assistance */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#061A3C] flex items-center gap-1.5 text-xs sm:text-sm">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>{lang === 'mr' ? 'मिळणारे लाभ व सहाय्य' : 'Benefits & Financial Assistance'}</span>
                </h4>
                {activeModalScheme.benefits || activeModalScheme.benefitsEn ? (
                  <p className="text-slate-600 leading-relaxed font-sans">
                    {lang === 'mr'
                      ? activeModalScheme.benefits
                      : activeModalScheme.benefitsEn || activeModalScheme.benefits}
                  </p>
                ) : (
                  <p className="text-slate-500 italic text-xs">
                    {lang === 'mr'
                      ? 'तपशीलवार लाभांची माहिती अधिकृत शासन आदेशांनुसार देय राहील. मार्गदर्शनासाठी सचिवालयात संपर्क साधा.'
                      : 'Benefits are distributed according to statutory Government Resolutions. Contact our helpdesk for exact figures.'}
                  </p>
                )}
              </div>

              {/* Eligibility Criteria */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#061A3C] flex items-center gap-1.5 text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>{lang === 'mr' ? 'पात्रता व अटी' : 'Eligibility Criteria'}</span>
                </h4>
                {activeModalScheme.eligibility || activeModalScheme.eligibilityEn ? (
                  <p className="text-slate-600 leading-relaxed font-sans">
                    {lang === 'mr'
                      ? activeModalScheme.eligibility
                      : activeModalScheme.eligibilityEn || activeModalScheme.eligibility}
                  </p>
                ) : (
                  <p className="text-slate-500 italic text-xs">
                    {lang === 'mr'
                      ? 'पात्रता निकष लाभार्थी प्रवर्गावर अवलंबून आहेत. अचूक माहितीसाठी नादरपूर मदत कक्षात प्रत्यक्ष संपर्क साधावा.'
                      : 'Eligibility criteria depend on target category specifications. Visit our Nadarpur helpdesk for direct assistance.'}
                  </p>
                )}
              </div>

              {/* Required Documents */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#061A3C] flex items-center gap-1.5 text-xs sm:text-sm">
                  <FileCheck2 className="w-4 h-4 text-amber-600" />
                  <span>{lang === 'mr' ? 'आवश्यक कागदपत्रे' : 'Required Documents Checklist'}</span>
                </h4>
                {activeModalScheme.documentsRequired || activeModalScheme.documentsRequiredEn ? (
                  <p className="text-slate-600 leading-relaxed font-sans">
                    {lang === 'mr'
                      ? activeModalScheme.documentsRequired
                      : activeModalScheme.documentsRequiredEn || activeModalScheme.documentsRequired}
                  </p>
                ) : (
                  <p className="text-slate-500 italic text-xs">
                    {lang === 'mr'
                      ? 'सर्वसाधारणपणे आधार कार्ड, रहिवासी दाखला, उत्पन्न दाखला, बँक पासबुक व पासपोर्ट फोटो आवश्यक असतात.'
                      : 'Generally requires Aadhaar card, domicile certificate, income proof, bank passbook, and photographs.'}
                  </p>
                )}
              </div>

              {/* Advisory Disclaimer */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  {lang === 'mr'
                    ? 'सूचना: संस्था केवळ जनजागृती व विनामूल्य अर्ज साहाय्यता करते. योजनेची प्रत्यक्ष मंजुरी व निधी वितरण संबंधित शासकीय विभागाच्या नियमांनुसार होते.'
                    : 'Notice: The Sanstha provides facilitation and guidance. Final scheme approvals and disbursement are subject to official government departments.'}
                </span>
              </div>
            </div>

            {/* Modal Action Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => setActiveModalScheme(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveModalScheme(null);
                    setCurrentRoute('contact');
                  }}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{lang === 'mr' ? 'मदत कक्षाशी संपर्क' : 'Contact Desk'}</span>
                </button>

                {activeModalScheme.officialPortalUrl && (
                  <a
                    href={activeModalScheme.officialPortalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-[#0868C9] hover:bg-[#065096] text-white font-semibold text-xs transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{lang === 'mr' ? 'अधिकृत पोर्टल उघडा' : 'Open Portal'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
