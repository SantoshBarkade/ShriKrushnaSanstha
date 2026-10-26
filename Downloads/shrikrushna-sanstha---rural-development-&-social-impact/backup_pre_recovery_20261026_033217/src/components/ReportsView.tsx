import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSanstha } from '../context/SansthaContext';
import {
  FileText,
  Download,
  Search,
  Filter,
  X,
  Calendar,
  Tag,
  ShieldCheck,
  Award,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  ChevronRight,
  Eye
} from 'lucide-react';
import { isReportPdfAvailable, getReportUnavailableNotice } from '../utils/validation';
import { ReportItem } from '../types';

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
      className={`relative overflow-hidden will-change-transform ${className}`}
    >
      <div
        ref={glareRef}
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 opacity-0"
        aria-hidden="true"
      />
      {children}
    </div>
  );
};

export const ReportsView: React.FC = () => {
  const { state, setCurrentRoute, lang, t } = useSanstha();
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('सर्व');
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);

  const publishedReports = state.reports.filter((r) => r.published);

  // Derive dynamic list of categories from real data
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    publishedReports.forEach((r) => {
      const cat = lang === 'mr' ? r.category : r.categoryEn || r.category;
      if (cat) cats.add(cat);
    });
    return ['सर्व', ...Array.from(cats)];
  }, [publishedReports, lang]);

  // Filtered reports based on category and search query
  const filteredReports = useMemo(() => {
    return publishedReports.filter((report) => {
      const title = lang === 'mr' ? report.title : report.titleEn || report.title;
      const period = lang === 'mr' ? report.period : report.periodEn || report.period;
      const summary = lang === 'mr' ? report.summary : report.summaryEn || report.summary;
      const category = lang === 'mr' ? report.category : report.categoryEn || report.category;

      const matchesCategory =
        selectedCategory === 'सर्व' ||
        category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        title.toLowerCase().includes(query) ||
        summary.toLowerCase().includes(query) ||
        period.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [publishedReports, selectedCategory, searchQuery, lang]);

  const handleDownload = (reportTitle: string, url?: string) => {
    if (isReportPdfAvailable(url)) {
      window.open(url!, '_blank', 'noopener,noreferrer');
      return;
    }
    setDownloadNotice(getReportUnavailableNotice(reportTitle, lang));
    setTimeout(() => setDownloadNotice(null), 6000);
  };

  // Keyboard navigation: Escape key closes details modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedReport && e.key === 'Escape') {
        setSelectedReport(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedReport]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Institutional Breadcrumb & Header Section */}
      <section className="bg-gradient-to-b from-[#061A3C] via-[#0A2540] to-[#0D2D4D] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 border-b border-slate-700/50 shadow-md">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="text-xs text-slate-300 flex items-center gap-2 font-sans flex-wrap">
            <button
              onClick={() => setCurrentRoute('home')}
              className="hover:text-amber-300 transition-colors cursor-pointer"
            >
              {t.nav.home}
            </button>
            <span className="text-slate-500">/</span>
            <span className="text-amber-400 font-semibold">{t.nav.reports}</span>
          </nav>

          {/* Institutional Trust Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'अधिकृत अहवाल व पारदर्शकता' : 'Official Reports & Disclosures'}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>NITI Aayog: MH/2023/0364941</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-slate-200 border border-white/10">
              <Award className="w-3.5 h-3.5 text-amber-300" />
              <span>Reg: F-0008544/AURANGABAD</span>
            </span>
          </div>

          {/* Heading and Sacred Motto */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <p className="text-amber-400/90 font-serif text-sm italic tracking-wide">
                ।। सेवेची पाऊले, परिवर्तनाची दिशा ।।
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
                {lang === 'mr' ? 'वार्षिक अहवाल व दस्तऐवज' : 'Annual Reports & Public Disclosures'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                {lang === 'mr'
                  ? 'संस्थेचे वार्षिक कार्य अहवाल, शैक्षणिक प्रगती आढावा, सामाजिक उपक्रम परीक्षण आणि पारदर्शकता दस्तऐवज.'
                  : 'Official annual activity summaries, educational evaluations, and public governance disclosures published for stakeholders.'}
              </p>
            </div>

            {/* Document Count Metric Chip */}
            <div className="flex items-center gap-3 shrink-0 self-start lg:self-auto bg-slate-900/80 border border-slate-700/80 px-4 py-3 rounded-2xl shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center border border-amber-400/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-lg font-serif font-bold text-white">
                  {publishedReports.length} {lang === 'mr' ? 'दस्तऐवज' : 'Documents'}
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  {lang === 'mr' ? 'अधिकृतपणे प्रकाशित' : 'Officially Published'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Download Availability Toast / Notification */}
        {downloadNotice && (
          <div
            role="status"
            aria-live="polite"
            className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 text-xs sm:text-sm font-medium flex items-start sm:items-center justify-between gap-3 shadow-md animate-in fade-in duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <span className="font-sans leading-relaxed">{downloadNotice}</span>
            </div>
            <button
              onClick={() => setDownloadNotice(null)}
              aria-label={lang === 'mr' ? 'सूचना बंद करा' : 'Close notification'}
              className="text-xs font-bold text-amber-900 hover:text-amber-700 underline cursor-pointer shrink-0"
            >
              {lang === 'mr' ? 'बंद करा' : 'Dismiss'}
            </button>
          </div>
        )}

        {/* Search & Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'mr'
                    ? 'अहवालाचे नाव किंवा वर्ष शोधा...'
                    : 'Search reports by title, summary, or period...'
                }
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Clear Filters Button (Visible when filters are active) */}
            {(searchQuery || selectedCategory !== 'सर्व') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('सर्व');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer self-start md:self-auto shrink-0"
              >
                <X className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'फिल्टर्स रीसेट करा' : 'Reset Filters'}</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
            {availableCategories.map((cat) => {
              const count =
                cat === 'सर्व'
                  ? publishedReports.length
                  : publishedReports.filter((r) => {
                      const c = lang === 'mr' ? r.category : r.categoryEn || r.category;
                      return c.toLowerCase() === cat.toLowerCase();
                    }).length;

              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 border ${
                    selectedCategory === cat
                      ? 'bg-[#061A3C] text-white border-[#061A3C] shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[11px] font-mono px-1.5 py-0.2 rounded-full ${
                      selectedCategory === cat
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Document Cards Listing */}
        {filteredReports.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-sans space-y-3">
            <FileText className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800 font-serif">
                {lang === 'mr' ? 'कोणतेही अहवाल सापडले नाहीत' : 'No Reports Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'सर्व'
                  ? lang === 'mr'
                    ? 'आपण दिलेल्या शोध निकषांनुसार कोणतेही अहवाल उपलब्ध नाहीत. कृपया दुसरे शब्द वापरून पहा.'
                    : 'No documents match your active search terms or filters. Try adjusting your query.'
                  : lang === 'mr'
                  ? 'संस्थेचे वार्षिक अहवाल लवकरच येथे प्रकाशित केले जातील.'
                  : 'Official documents and disclosures will be published here soon.'}
              </p>
            </div>
            {(searchQuery || selectedCategory !== 'सर्व') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('सर्व');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#061A3C] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <span>{lang === 'mr' ? 'सर्व अहवाल पहा' : 'View All Reports'}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredReports.map((report) => {
              const title = lang === 'mr' ? report.title : report.titleEn || report.title;
              const period = lang === 'mr' ? report.period : report.periodEn || report.period;
              const summary = lang === 'mr' ? report.summary : report.summaryEn || report.summary;
              const category = lang === 'mr' ? report.category : report.categoryEn || report.category;
              const isDownloadable = isReportPdfAvailable(report.pdfPlaceholderUrl);

              return (
                <Card3D
                  key={report.id}
                  aria-label={`${title} - ${period}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-blue-600 hover:shadow-xl transition-all flex flex-col justify-between group"
                >
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* Top Meta Header: Period and Format Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          <Calendar className="w-3 h-3 text-blue-500" />
                          <span>{period}</span>
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-slate-100 text-slate-700 rounded-md border border-slate-200">
                          {report.fileSize || 'PDF'}
                        </span>
                      </div>

                      {/* Document Icon & Category */}
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 font-sans">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-amber-700 truncate">{category}</span>
                        {report.date && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="truncate">{report.date}</span>
                          </>
                        )}
                      </div>

                      {/* Document Title */}
                      <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                        {title}
                      </h3>

                      {/* Brief Summary */}
                      <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed line-clamp-3">
                        {summary}
                      </p>
                    </div>

                    {/* Quick Details Trigger Link */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedReport(report)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>{lang === 'mr' ? 'तपशील पहा' : 'View Summary'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50">
                    <button
                      type="button"
                      onClick={() => handleDownload(title, report.pdfPlaceholderUrl)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                        isDownloadable
                          ? 'bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 shadow-sm'
                          : 'bg-[#061A3C] hover:bg-blue-700 text-white border border-[#061A3C]'
                      }`}
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>{t.reportsSection.downloadBtn}</span>
                    </button>
                  </div>
                </Card3D>
              );
            })}
          </div>
        )}

        {/* Institutional Transparency Commitment Banner */}
        <section className="bg-gradient-to-r from-[#061A3C] to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border border-slate-700">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>{lang === 'mr' ? 'सार्वजनिक उत्तरदायित्व' : 'Public Accountability'}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
              {lang === 'mr'
                ? 'संस्थेची आर्थिक व सामाजिक पारदर्शकता कटिबद्धता'
                : 'Commitment to Governance & Financial Integrity'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-2xl leading-relaxed">
              {lang === 'mr'
                ? 'संस्थेचे सर्व उपक्रम व निधी वापर शासन नियम आणि धर्मादाय सह-आयुक्त नियमांनुसार पारदर्शकपणे लेखापरीक्षित केले जातात.'
                : 'All community initiatives and statutory audits are maintained in strict accordance with the Bombay Public Trusts Act, 1950 and NITI Aayog norms.'}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('contact')}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
          >
            <span>{lang === 'mr' ? 'माहितीसाठी संपर्क साधा' : 'Contact for Inquiries'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* Document Details Modal Dialog */}
      {selectedReport && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'mr' ? 'अहवाल तपशील' : 'Report Details'}
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="bg-white border border-slate-200 rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#061A3C] text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2.5 truncate pr-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                  {lang === 'mr' ? selectedReport.category : selectedReport.categoryEn || selectedReport.category}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-300 truncate">
                  {lang === 'mr' ? selectedReport.period : selectedReport.periodEn || selectedReport.period}
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label={lang === 'mr' ? 'बंद करा' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 leading-snug">
                  {lang === 'mr' ? selectedReport.title : selectedReport.titleEn || selectedReport.title}
                </h2>
                {selectedReport.date && (
                  <p className="text-xs text-slate-500 font-sans flex items-center gap-1.5 pt-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>{lang === 'mr' ? 'प्रकाशन तारीख:' : 'Publication Date:'} {selectedReport.date}</span>
                  </p>
                )}
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans">
                <div>
                  <div className="text-slate-400">{lang === 'mr' ? 'कालावधी' : 'Period'}</div>
                  <div className="font-bold text-slate-800">
                    {lang === 'mr' ? selectedReport.period : selectedReport.periodEn || selectedReport.period}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{lang === 'mr' ? 'प्रकार' : 'Format'}</div>
                  <div className="font-bold text-slate-800 font-mono">
                    {selectedReport.fileSize || 'PDF'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">{lang === 'mr' ? 'दर्जा' : 'Status'}</div>
                  <div className="font-bold text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{lang === 'mr' ? 'प्रमाणित' : 'Verified'}</span>
                  </div>
                </div>
              </div>

              {/* Full Summary */}
              <div className="space-y-1.5 pt-1">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider font-sans">
                  {lang === 'mr' ? 'अहवाल सारांश व आढावा' : 'Document Summary & Scope'}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 font-sans leading-relaxed">
                  {lang === 'mr' ? selectedReport.summary : selectedReport.summaryEn || selectedReport.summary}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'मागे जा' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const title = lang === 'mr' ? selectedReport.title : selectedReport.titleEn || selectedReport.title;
                  handleDownload(title, selectedReport.pdfPlaceholderUrl);
                }}
                className="px-5 py-2.5 bg-[#061A3C] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>{t.reportsSection.downloadBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
