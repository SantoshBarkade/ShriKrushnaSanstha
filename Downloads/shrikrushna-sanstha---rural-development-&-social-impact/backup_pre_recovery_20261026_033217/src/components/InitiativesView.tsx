import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { getCategoryLabel } from '../utils/i18n';
import {
  Calendar,
  MapPin,
  ArrowRight,
  X,
  Search,
  Filter,
  Layers,
  Clock,
  Award,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Users,
  ChevronRight,
  FileCheck2,
  Maximize2
} from 'lucide-react';
import { ImageSlider } from './ImageSlider';
import { CategoryKey, InitiativeItem } from '../types';

/**
 * Interactive 3D Tilt Card wrapper
 * Applies restrained perspective tilt and subtle ambient lighting on fine pointer devices.
 * Gracefully disables on touch devices and respects prefers-reduced-motion.
 */
interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

const Card3D: React.FC<Card3DProps> = ({ children, className = '', onClick, 'aria-label': ariaLabel }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>('');
  const [glareStyle, setGlareStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const rafId = useRef<number | null>(null);
  const isHoveredRef = useRef<boolean>(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only apply tilt on mouse/fine pointer, skip on touch
    if (e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    isHoveredRef.current = true;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Constrain tilt to max 4 degrees for subtle institutional elegance
    const rotateX = ((y - centerY) / centerY) * -4;
    const rotateY = ((x - centerX) / centerX) * 4;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      if (!isHoveredRef.current) return;
      setTransformStyle(
        `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-4px)`
      );
      setGlareStyle({
        opacity: 0.15,
        background: `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`,
      });
    });
  };

  const handlePointerLeave = () => {
    isHoveredRef.current = false;
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    setTransformStyle('perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)');
    setGlareStyle({ opacity: 0, transition: 'opacity 0.4s ease-out' });
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        transform: transformStyle,
        transformStyle: 'preserve-3d',
        transition: transformStyle ? 'transform 0.1s ease-out, box-shadow 0.3s ease-out' : 'transform 0.4s ease-out, box-shadow 0.3s ease-out',
      }}
      className={`relative group ${className}`}
    >
      {children}
      {/* Dynamic ambient glare overlay */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl z-20 transition-opacity duration-300"
        style={glareStyle}
      />
    </div>
  );
};

export const InitiativesView: React.FC = () => {
  const { state, setCurrentRoute, selectedInitiativeId, setSelectedInitiativeId, lang, t } = useSanstha();

  const [activeCategory, setActiveCategory] = useState<string>('सर्व');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  // Category definitions with localized labels and matching keys
  const categories: { key: string; labelMr: string; labelEn: string }[] = useMemo(
    () => [
      { key: 'सर्व', labelMr: 'सर्व उपक्रम', labelEn: 'All Initiatives' },
      { key: 'शिक्षण', labelMr: 'शिक्षण व बाल विद्यालय', labelEn: 'Education & Bal Vidyalaya' },
      { key: 'शासकीय योजना जनजागृती', labelMr: 'शासकीय योजना', labelEn: 'Welfare Schemes' },
      { key: 'आरोग्यविषयक उपक्रम', labelMr: 'आरोग्य शिबिरे', labelEn: 'Healthcare & Nutrition' },
      { key: 'पर्यावरण संवर्धन', labelMr: 'पर्यावरण संवर्धन', labelEn: 'Environment & Plantation' },
      { key: 'महिला व ज्येष्ठ नागरिक सहाय्य', labelMr: 'महिला व ज्येष्ठ नागरिक', labelEn: 'Women & Senior Citizens' },
      { key: 'सामाजिक कल्याण', labelMr: 'सांस्कृतिक व सामाजिक', labelEn: 'Culture & Community' },
    ],
    []
  );

  // Filter only published initiatives from real CMS state
  const publishedInitiatives = useMemo(
    () => (state.initiatives || []).filter((i) => i.published !== false),
    [state.initiatives]
  );

  // Compute item counts per category for the filter badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { सर्व: publishedInitiatives.length };
    publishedInitiatives.forEach((item) => {
      const cat = item.category || 'सामाजिक कल्याण';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [publishedInitiatives]);

  // Filter items by category AND search query
  const filteredItems = useMemo(() => {
    let items = publishedInitiatives;

    // 1. Category Filter
    if (activeCategory !== 'सर्व') {
      items = items.filter((item) => item.category === activeCategory);
    }

    // 2. Search Query Filter
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      items = items.filter((item) => {
        const titleMr = (item.title || '').toLowerCase();
        const titleEn = (item.titleEn || '').toLowerCase();
        const summaryMr = (item.summary || '').toLowerCase();
        const summaryEn = (item.summaryEn || '').toLowerCase();
        const locMr = (item.location || '').toLowerCase();
        const locEn = (item.locationEn || '').toLowerCase();
        const tags = Array.isArray(item.tags) ? item.tags.join(' ').toLowerCase() : '';

        return (
          titleMr.includes(query) ||
          titleEn.includes(query) ||
          summaryMr.includes(query) ||
          summaryEn.includes(query) ||
          locMr.includes(query) ||
          locEn.includes(query) ||
          tags.includes(query)
        );
      });
    }

    return items;
  }, [publishedInitiatives, activeCategory, searchQuery]);

  // Active modal initiative item
  const activeModalItem = useMemo(() => {
    if (!selectedInitiativeId) return null;
    return state.initiatives.find((i) => i.id === selectedInitiativeId) || null;
  }, [selectedInitiativeId, state.initiatives]);

  // Open modal handler with focus tracking
  const handleOpenModal = useCallback(
    (id: string, e?: React.MouseEvent | React.KeyboardEvent) => {
      if (e) {
        lastActiveElementRef.current = (e.currentTarget as HTMLElement) || (document.activeElement as HTMLElement);
      } else {
        lastActiveElementRef.current = document.activeElement as HTMLElement;
      }
      setSelectedInitiativeId(id);
    },
    [setSelectedInitiativeId]
  );

  // Close modal handler with focus restoration
  const handleCloseModal = useCallback(() => {
    setSelectedInitiativeId(null);
    if (lastActiveElementRef.current && typeof lastActiveElementRef.current.focus === 'function') {
      setTimeout(() => {
        lastActiveElementRef.current?.focus();
      }, 50);
    }
  }, [setSelectedInitiativeId]);

  // Handle Escape key to dismiss modal & manage body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedInitiativeId) {
        handleCloseModal();
      }
    };

    if (selectedInitiativeId) {
      window.addEventListener('keydown', handleKeyDown);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [selectedInitiativeId, handleCloseModal]);

  // Clear all filters
  const handleResetFilters = useCallback(() => {
    setActiveCategory('सर्व');
    setSearchQuery('');
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#0868C9] selection:text-white">
      {/* 1. Breadcrumbs & Institutional Authority Bar */}
      <section className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-medium">
            <button
              onClick={() => setCurrentRoute('home')}
              className="hover:text-[#061A3C] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{t.nav.home}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#061A3C] font-semibold">{t.nav.initiatives}</span>
          </nav>

          {/* Quick Route & Status Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCurrentRoute('work')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#0868C9] bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/80 transition-all cursor-pointer shadow-2xs"
              title={lang === 'mr' ? 'कालक्रमानुसार प्रत्यक्ष कार्य पहा' : 'View chronological timeline'}
            >
              <Clock className="w-3.5 h-3.5 text-[#0868C9]" />
              <span>{lang === 'mr' ? 'कालक्रम दृश्य (Timeline)' : 'Timeline Archive'}</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                {publishedInitiatives.length} {lang === 'mr' ? 'सक्रिय उपक्रम' : 'Active Initiatives'}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#061A3C] via-[#0A2540] to-[#0D2E4D] text-white py-12 sm:py-16 lg:py-20 border-b border-slate-800 shadow-inner">
        {/* Subtle Decorative Background Geometry */}
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
              {lang === 'mr' ? 'नादपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर' : 'Nadarpur, Kannad, Dist. Chhatrapati Sambhajinagar'}
            </span>
          </div>

          {/* Hero Titles */}
          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-tight text-white leading-tight">
              {lang === 'mr' ? 'प्रमुख उपक्रम, योजना व प्रत्यक्ष कार्य' : 'Major Initiatives, Welfare Drives & Field Operations'}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-sans font-normal max-w-3xl">
              {lang === 'mr'
                ? 'तळागाळातील ग्रामीण घटकांसाठी CSC बाल विद्यालय, RTE २५% शिक्षण हक्क, विनामूल्य आरोग्य तपासणी, महिला सक्षमीकरण, औषधी वृक्षारोपण आणि शासकीय कल्याणकारी योजनांचे थेट मार्गदर्शन.'
                : 'Grassroots community schooling (CSC Bal Vidyalaya & RTE 25%), preventive healthcare camps, women self-help empowerment, ecological tree drives, and free statutory welfare guidance across Kannad block.'}
            </p>
          </div>

          {/* Trust Highlights Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'mr' ? '१००% मोफत नागरिक मार्गदर्शन' : '100% Free Citizen Guidance'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>{lang === 'mr' ? 'धर्मादाय आयुक्त नोंदणीकृत संस्था' : 'Charity Commissioner Registered Trust'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Building2 className="w-4 h-4 text-amber-300" />
              <span>{lang === 'mr' ? 'नादरपूर मध्यवर्ती कार्यक्षेत्र' : 'Headquartered in Nadarpur'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Search and Category Filter Toolbar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-7 relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200/90 p-4 sm:p-5 space-y-4">
          {/* Top Row: Search Input & Result Count */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#0868C9] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'mr'
                    ? 'उपक्रम, योजना किंवा ठिकाण शोधा (उदा. बाल विद्यालय, आरोग्य, वृक्षारोपण)...'
                    : 'Search initiatives by title, theme, or location (e.g. Bal Vidyalaya, Health)...'
                }
                className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0868C9] focus:bg-white transition-all shadow-inner"
                aria-label={lang === 'mr' ? 'उपक्रम शोधा' : 'Search initiatives'}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer transition-colors"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Status Badge */}
            <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500 shrink-0">
              <span className="font-medium">
                {lang === 'mr' ? 'एकूण निकाल:' : 'Showing:'}{' '}
                <strong className="text-[#061A3C] font-semibold">{filteredItems.length}</strong>{' '}
                {lang === 'mr' ? 'उपक्रम' : 'initiatives'}
              </span>
              {(activeCategory !== 'सर्व' || searchQuery) && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 text-xs font-semibold text-[#E52E3D] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-rose-200"
                >
                  {lang === 'mr' ? 'फिल्टर काढा' : 'Reset All'}
                </button>
              )}
            </div>
          </div>

          {/* Bottom Row: Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1 pb-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 pr-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-[#0868C9]" />
              <span>{lang === 'mr' ? 'वर्गवारी:' : 'Category:'}</span>
            </span>
            {categories.map((cat) => {
              const label = lang === 'mr' ? cat.labelMr : cat.labelEn;
              const isSelected = activeCategory === cat.key;
              const count = categoryCounts[cat.key] || 0;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setActiveCategory(cat.key)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border whitespace-nowrap shrink-0 shadow-2xs ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#061A3C] to-[#0A2540] text-white border-[#061A3C] shadow-md ring-2 ring-[#0868C9]/30'
                      : 'bg-slate-50 text-slate-600 border-slate-200/90 hover:bg-slate-100 hover:text-[#061A3C] hover:border-slate-300'
                  }`}
                  aria-pressed={isSelected}
                >
                  <span>{label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? 'bg-amber-400 text-slate-900 font-extrabold'
                        : 'bg-slate-200/90 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Initiatives 3D Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {filteredItems.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs max-w-2xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-serif font-bold text-[#061A3C]">
                {lang === 'mr' ? 'कोणताही उपक्रम आढळला नाही' : 'No matching initiatives found'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                {lang === 'mr'
                  ? 'आपण निवडलेल्या निकषानुसार सध्या कोणताही उपक्रम उपलब्ध नाही. कृपया इतर वर्गवारी निवडा किंवा शोध शब्द बदला.'
                  : 'No initiatives matched your filter criteria. Try clearing the search query or selecting another category.'}
              </p>
            </div>
            <div>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 bg-[#061A3C] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                {lang === 'mr' ? 'सर्व उपक्रम पहा' : 'View All Initiatives'}
              </button>
            </div>
          </div>
        ) : (
          /* Cards Grid with 3D Tilt */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredItems.map((item) => {
              const title = lang === 'mr' ? item.title : item.titleEn || item.title;
              const summary = lang === 'mr' ? item.summary : item.summaryEn || item.summary;
              const location = lang === 'mr' ? item.location : item.locationEn || item.location;
              const categoryLabel = getCategoryLabel(item.category as CategoryKey, lang);
              const allPhotos = [item.imageUrl, ...(item.images || [])].filter(Boolean);

              return (
                <Card3D
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-2xl hover:border-[#0868C9]/40 transition-shadow duration-300"
                >
                  <article className="flex flex-col h-full justify-between">
                    <div>
                      {/* Media Container with Slider or Fallback */}
                      <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                        {allPhotos.length > 0 ? (
                          <ImageSlider
                            images={allPhotos}
                            alt={title}
                            heightClass="h-full"
                            showThumbnails={false}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 p-4 text-center">
                            <Layers className="w-10 h-10 mb-1 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-500">
                              {lang === 'mr' ? 'श्रीकृष्ण संस्था उपक्रम' : 'Shrikrushna Initiative'}
                            </span>
                          </div>
                        )}

                        {/* Top Badges Overlay */}
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2 z-10 pointer-events-none">
                          {/* Category Chip */}
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-[#061A3C]/95 backdrop-blur-xs text-amber-300 rounded-lg shadow-sm truncate max-w-[70%] border border-white/10">
                            {categoryLabel}
                          </span>

                          {/* Status / Type Badge */}
                          {item.isGovernmentSchemeAwareness ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-[#E52E3D]/95 text-white rounded-lg shadow-sm flex items-center gap-1 border border-white/20">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>{lang === 'mr' ? 'शासकीय योजना' : 'Govt Drive'}</span>
                            </span>
                          ) : item.featured ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-[#0868C9]/95 text-white rounded-lg shadow-sm flex items-center gap-1 border border-white/20">
                              <Award className="w-2.5 h-2.5 text-amber-300" />
                              <span>{lang === 'mr' ? 'प्रमुख उपक्रम' : 'Featured'}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-white/95 text-slate-700 rounded-lg shadow-sm border border-slate-200/80">
                              {lang === 'mr' ? 'सक्रिय कार्य' : 'Active'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5 sm:p-6 space-y-3">
                        {/* Date & Location Metas */}
                        <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500">
                          {item.date && (
                            <span className="inline-flex items-center gap-1 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-[#0868C9]" />
                              <span>{item.date}</span>
                            </span>
                          )}
                          {location && (
                            <span className="inline-flex items-center gap-1 truncate max-w-[220px]" title={location}>
                              <MapPin className="w-3.5 h-3.5 text-[#E52E3D]" />
                              <span className="truncate">{location}</span>
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base sm:text-lg font-serif font-bold text-[#061A3C] leading-snug group-hover:text-[#0868C9] transition-colors line-clamp-2">
                          {title}
                        </h3>

                        {/* Summary */}
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3 font-sans">
                          {summary}
                        </p>

                        {/* Tags (if present) */}
                        {Array.isArray(item.tags) && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {item.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Action Button */}
                    <div className="p-5 sm:p-6 pt-0">
                      <button
                        type="button"
                        onClick={(e) => handleOpenModal(item.id, e)}
                        className="w-full py-2.5 px-4 bg-slate-50 hover:bg-[#061A3C] text-[#061A3C] hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-[#061A3C] flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0868C9]"
                        aria-label={`${t.initiativesSection.readMore}: ${title}`}
                      >
                        <span>{t.initiativesSection.readMore}</span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </article>
                </Card3D>
              );
            })}
          </div>
        )}
      </section>

      {/* 5. Institutional Governance & Grassroots Disclosures */}
      <section className="bg-white border-y border-slate-200 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0868C9]">
              {lang === 'mr' ? 'तळागाळातील सेवा समर्पण' : 'Grassroots Implementation Commitment'}
            </span>
            <h2 className="text-xl sm:text-3xl font-serif font-bold text-[#061A3C]">
              {lang === 'mr'
                ? 'शासकीय निकष व लोकसहभागातून प्रत्यक्ष कार्य'
                : 'Direct Field Operations & Civic Partnerships'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
              {lang === 'mr'
                ? 'श्रीकृष्ण संस्था ही केवळ कागदोपत्री काम न करता प्रत्यक्षात कन्नड व छत्रपती संभाजीनगर परिसरातील गावांमध्ये जाऊन प्रत्येक पात्र लाभार्थीपर्यंत पोहचते.'
                : 'Shrikrushna Sanstha actively visits villages across Kannad and Chhatrapati Sambhajinagar district to personally assist citizens and ensure rightful welfare reaches every household.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0868C9] border border-blue-200 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#061A3C]">
                {lang === 'mr' ? '१००% मोफत व पारदर्शक सेवा' : '100% Free Public Guidance'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {lang === 'mr'
                  ? 'संजय गांधी निराधार, श्रावणबाळ, ई-श्रम, कामगार नोंदणी किंवा शालेय प्रवेशासाठी नागरिकांकडून कोणताही मोबदला किंवा शुल्क घेतले जात नाही.'
                  : 'Zero application or service fees for Shravanbal, Sanjay Gandhi Niradhar, e-Shram worker registrations, or school admissions.'}
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#061A3C]">
                {lang === 'mr' ? 'कायदेशीर नोंदणी व ऑडिट' : 'Statutory Audits & Filings'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {lang === 'mr'
                  ? 'धर्मादाय आयुक्त कार्यालय, मुंबई सार्वजनिक विश्वस्त व्यवस्था अधिनियम १९५० अंतर्गत नियमित लेखापरीक्षण व वार्षिक अहवाल सादर केले जातात.'
                  : 'Annual audited financial statements and activity reports regularly submitted to the Charity Commissioner and NITI Aayog Darpan portal.'}
              </p>
            </div>

            <div className="bg-[#F8FAFC] border border-slate-200/80 rounded-2xl p-6 space-y-3 shadow-2xs hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-serif font-bold text-[#061A3C]">
                {lang === 'mr' ? 'स्थानिक ग्रामपंचायत समन्वय' : 'Gram Panchayat Alignment'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {lang === 'mr'
                  ? 'सरपंच, ग्रामसेवक, शालेय व्यवस्थापन समिती (SMC) व महिला बचत गटांच्या प्रत्यक्ष सहभागातून उपक्रमांचे नियोजन व अंमलबजावणी.'
                  : 'Collaborative program execution with Sarpanch, Gram Sevak, School Management Committees, and local Women Self-Help Groups.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Pre-Footer Action Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-gradient-to-r from-[#061A3C] via-[#0A2540] to-[#061A3C] rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl text-center md:text-left">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              {lang === 'mr' ? 'सहकार्य व लोकसहभाग' : 'Join Our Mission'}
            </span>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white">
              {lang === 'mr'
                ? 'आपल्या परिसरातील गरजू नागरिकांपर्यंत योजना पोहोचवा'
                : 'Help Us Bring Welfare Schemes to Every Deserving Family'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              {lang === 'mr'
                ? 'स्वयंसेवक म्हणून सहभागी व्हा, किंवा नादरपूर येथील मध्यवर्ती कार्यालयाशी संपर्क साधून आपल्या गावासाठी शिबिराचे आयोजन करा.'
                : 'Join as a community volunteer or contact our central office in Nadarpur to organize guidance camps in your village.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentRoute('contact')}
              className="px-5 py-2.5 rounded-xl bg-white text-[#061A3C] hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer shadow-md inline-flex items-center gap-2"
            >
              <PhoneCall className="w-4 h-4 text-[#E52E3D]" />
              <span>{lang === 'mr' ? 'कार्यालयाशी संपर्क' : 'Contact Office'}</span>
            </button>
            <button
              onClick={() => setCurrentRoute('volunteer')}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-amber-300" />
              <span>{lang === 'mr' ? 'स्वयंसेवक व्हा' : 'Volunteer Now'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 7. Viewport-Constrained Detail Modal (Bulletproof Viewport Strategy) */}
      {activeModalItem && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs overflow-y-auto overscroll-contain flex flex-col items-center justify-start sm:justify-center p-2 sm:p-4 md:p-6"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="initiative-modal-title"
        >
          {/* Centered Modal Container with strict max-height constraint */}
          <div
            className="relative w-full max-w-3xl my-auto rounded-2xl overflow-hidden bg-white shadow-2xl border border-slate-200/90 flex flex-col max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2.5rem)] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sticky Top Header Bar with Pinned Close Button */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-1 bg-[#061A3C] text-amber-300 font-bold rounded-lg text-[11px] truncate shrink-0">
                  {getCategoryLabel(activeModalItem.category as CategoryKey, lang)}
                </span>
                {activeModalItem.isGovernmentSchemeAwareness && (
                  <span className="hidden sm:inline-flex px-2 py-0.5 bg-[#E52E3D] text-white font-bold rounded-md text-[10px] shrink-0">
                    {lang === 'mr' ? 'शासकीय योजना' : 'Govt Scheme'}
                  </span>
                )}
              </div>

              {/* Pinned Close Button — ALWAYS Visible and Accessible */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 sm:p-2 rounded-full bg-slate-100 hover:bg-[#E52E3D] text-slate-700 hover:text-white transition-colors cursor-pointer shrink-0 focus:outline-none focus:ring-2 focus:ring-[#0868C9]"
                aria-label={lang === 'mr' ? 'खिडकी बंद करा' : 'Close modal'}
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 space-y-5">
              {/* Image Slider Area (Controlled Height to prevent layout explosion) */}
              <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-200/80 shadow-xs">
                <ImageSlider
                  images={[activeModalItem.imageUrl, ...(activeModalItem.images || [])].filter(Boolean)}
                  alt={activeModalItem.title}
                  heightClass="h-48 sm:h-64 md:h-72"
                  roundedClass="rounded-xl"
                  showThumbnails={true}
                />
              </div>

              {/* Title & Metadata */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
                  {activeModalItem.date && (
                    <span className="inline-flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[#0868C9]" />
                      <span>{activeModalItem.date}</span>
                    </span>
                  )}
                  {activeModalItem.location && (
                    <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                      • <MapPin className="w-3.5 h-3.5 text-[#E52E3D]" />
                      <span>
                        {lang === 'mr' ? activeModalItem.location : activeModalItem.locationEn || activeModalItem.location}
                      </span>
                    </span>
                  )}
                </div>

                <h2
                  id="initiative-modal-title"
                  className="text-lg sm:text-2xl font-serif font-bold text-[#061A3C] leading-snug"
                >
                  {lang === 'mr' ? activeModalItem.title : activeModalItem.titleEn || activeModalItem.title}
                </h2>
              </div>

              {/* Full Description Body */}
              <div className="space-y-3 text-slate-700 text-xs sm:text-sm leading-relaxed font-sans border-t border-slate-100 pt-3">
                <p className="whitespace-pre-line">
                  {lang === 'mr'
                    ? activeModalItem.description || activeModalItem.summary
                    : activeModalItem.descriptionEn || activeModalItem.summaryEn || activeModalItem.description || activeModalItem.summary}
                </p>
              </div>

              {/* Tags & Disclosure Notice */}
              <div className="pt-3 border-t border-slate-200/80 space-y-3">
                {Array.isArray(activeModalItem.tags) && activeModalItem.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <span className="font-semibold text-slate-400">{lang === 'mr' ? 'टॅग्ज:' : 'Tags:'}</span>
                    {activeModalItem.tags.map((tag, idx) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-slate-600">
                  <Building2 className="w-4 h-4 text-[#0868C9] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#061A3C]">
                      {lang === 'mr' ? 'संस्थात्मक अंमलबजावणी व संपर्क:' : 'Institutional Implementation & Guidance:'}
                    </span>{' '}
                    <span>
                      {lang === 'mr'
                        ? 'या उपक्रमाच्या अधिक माहितीसाठी किंवा आपल्या गावात मार्गदर्शन शिबीर आयोजित करण्यासाठी संस्थेच्या मध्यवर्ती कार्यालयाशी संपर्क साधावा.'
                        : 'For inquiries or organizing an outreach camp in your village, please contact our Central Office in Nadarpur, Kannad.'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Anchored Bottom Controls */}
            <div className="sticky bottom-0 z-30 bg-slate-50 border-t border-slate-200 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
              <button
                type="button"
                onClick={() => {
                  handleCloseModal();
                  setCurrentRoute('contact');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-[#061A3C] hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#0868C9]"
              >
                <PhoneCall className="w-3.5 h-3.5 text-[#E52E3D]" />
                <span>{lang === 'mr' ? 'कार्यालयाशी संपर्क' : 'Contact Office'}</span>
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                className="px-5 py-2 bg-[#061A3C] hover:bg-[#0A2540] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0868C9]"
              >
                {lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
