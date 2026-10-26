import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { getCategoryLabel } from '../utils/i18n';
import {
  Calendar,
  Clock,
  MapPin,
  Tag,
  Search,
  X,
  ChevronRight,
  Filter,
  Eye,
  Share2,
  CheckCircle2,
  AlertCircle,
  Building2,
  ShieldCheck,
  Award,
  Sparkles,
  ArrowRight,
  Bell,
  Radio,
  FileText
} from 'lucide-react';
import { ImageSlider } from './ImageSlider';
import { EventItem, AnnouncementItem, EventStatus, CategoryKey } from '../types';
import { formatEventDate, formatSingleDate } from '../utils/dateFormatter';

import { Card3D } from './Card3D';

type ActiveItemType = {
  kind: 'event';
  data: EventItem;
} | {
  kind: 'announcement';
  data: AnnouncementItem;
};

export const NewsView: React.FC = () => {
  const { state, setCurrentRoute, lang, t } = useSanstha();
  const [filterType, setFilterType] = useState<'all' | 'events' | 'announcements'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('सर्व');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeModalItem, setActiveModalItem] = useState<ActiveItemType | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const publishedEvents: EventItem[] = useMemo(
    () => (state.events || []).filter((e) => e.published),
    [state.events]
  );

  const publishedAnnouncements: AnnouncementItem[] = useMemo(
    () => (state.announcements || []).filter((a) => a.published),
    [state.announcements]
  );

  const totalPublishedCount = publishedEvents.length + publishedAnnouncements.length;

  // Upcoming items count
  const upcomingCount = useMemo(() => {
    const evUpcoming = publishedEvents.filter((e) => e.status === 'upcoming').length;
    const annUpcoming = publishedAnnouncements.filter((a) => a.isUpcoming).length;
    return evUpcoming + annUpcoming;
  }, [publishedEvents, publishedAnnouncements]);

  // Completed items count
  const completedCount = useMemo(() => {
    const evComp = publishedEvents.filter((e) => e.status === 'completed').length;
    const annComp = publishedAnnouncements.filter((a) => !a.isUpcoming).length;
    return evComp + annComp;
  }, [publishedEvents, publishedAnnouncements]);

  // Extract dynamic categories from real published data
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('सर्व');
    publishedEvents.forEach((e) => {
      if (e.category) cats.add(e.category);
    });
    publishedAnnouncements.forEach((a) => {
      if (a.category) cats.add(a.category);
    });
    return Array.from(cats);
  }, [publishedEvents, publishedAnnouncements]);

  // Close modal with Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalItem(null);
      }
    };
    if (activeModalItem) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeModalItem]);

  // Auto-dismiss share toast
  useEffect(() => {
    if (!shareToast) return;
    const timer = setTimeout(() => setShareToast(null), 3500);
    return () => clearTimeout(timer);
  }, [shareToast]);

  const handleShare = (itemKind: 'event' | 'announcement', title: string) => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: title,
        text: `${title} - श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      try {
        navigator.clipboard.writeText(shareUrl);
        setShareToast(
          lang === 'mr'
            ? 'नोंदीची लिंक क्लिपबोर्डवर सेव्ह झाली आहे!'
            : 'Link copied to clipboard!'
        );
      } catch {
        setShareToast(
          lang === 'mr'
            ? 'नोंद शेअर करण्यासाठी पत्ता बारमधील URL वापरा.'
            : 'Please copy the URL from browser address bar.'
        );
      }
    }
  };

  const getEventStatusBadge = (status: EventStatus) => {
    switch (status) {
      case 'upcoming':
        return {
          label: lang === 'mr' ? 'आगामी कार्यक्रम' : 'Upcoming Event',
          cls: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
          dot: 'bg-amber-500',
        };
      case 'ongoing':
        return {
          label: lang === 'mr' ? 'सुरू आहे' : 'Ongoing',
          cls: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          dot: 'bg-emerald-500 animate-pulse',
        };
      case 'completed':
        return {
          label: lang === 'mr' ? 'संपन्न' : 'Completed',
          cls: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
          dot: 'bg-slate-400',
        };
      case 'cancelled':
        return {
          label: lang === 'mr' ? 'रद्द' : 'Cancelled',
          cls: 'bg-rose-100 text-rose-800 border-rose-300 font-medium',
          dot: 'bg-rose-500',
        };
      default:
        return {
          label: lang === 'mr' ? 'कार्यक्रम' : 'Event',
          cls: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
          dot: 'bg-slate-400',
        };
    }
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (filterType === 'announcements') return [];
    return publishedEvents.filter((evt) => {
      if (selectedCategory !== 'सर्व' && evt.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch =
          evt.title?.toLowerCase().includes(q) || evt.titleEn?.toLowerCase().includes(q);
        const summaryMatch =
          evt.summary?.toLowerCase().includes(q) || evt.summaryEn?.toLowerCase().includes(q);
        const descMatch =
          evt.description?.toLowerCase().includes(q) || evt.descriptionEn?.toLowerCase().includes(q);
        const venueMatch =
          evt.venue?.toLowerCase().includes(q) || evt.venueEn?.toLowerCase().includes(q);
        const dateMatch =
          evt.startDate?.toLowerCase().includes(q) ||
          evt.eventDateTextMr?.toLowerCase().includes(q) ||
          evt.eventDateTextEn?.toLowerCase().includes(q);
        if (!titleMatch && !summaryMatch && !descMatch && !venueMatch && !dateMatch) {
          return false;
        }
      }
      return true;
    });
  }, [publishedEvents, filterType, selectedCategory, searchQuery]);

  // Filtered Announcements
  const filteredAnnouncements = useMemo(() => {
    if (filterType === 'events') return [];
    return publishedAnnouncements.filter((ann) => {
      if (selectedCategory !== 'सर्व' && ann.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch =
          ann.title?.toLowerCase().includes(q) || ann.titleEn?.toLowerCase().includes(q);
        const summaryMatch =
          ann.summary?.toLowerCase().includes(q) || ann.summaryEn?.toLowerCase().includes(q);
        const contentMatch =
          ann.content?.toLowerCase().includes(q) || ann.contentEn?.toLowerCase().includes(q);
        const dateMatch =
          ann.date?.toLowerCase().includes(q) || ann.dateEn?.toLowerCase().includes(q);
        if (!titleMatch && !summaryMatch && !contentMatch && !dateMatch) {
          return false;
        }
      }
      return true;
    });
  }, [publishedAnnouncements, filterType, selectedCategory, searchQuery]);

  const totalFilteredCount = filteredEvents.length + filteredAnnouncements.length;

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-24 font-sans text-slate-800">
      {/* Toast Notification */}
      {shareToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-700 text-xs sm:text-sm animate-fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{shareToast}</span>
          <button
            onClick={() => setShareToast(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

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
              <span>{t.nav.home}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-amber-400 font-semibold" aria-current="page">
              {lang === 'mr' ? 'बातम्या व कार्यक्रम' : 'News & Events'}
            </span>
          </nav>

          {/* Title & Institutional Credential Pill */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {lang === 'mr'
                  ? 'अधिकृत प्रसिद्धी दालन • नोंदणी क्र. एक १४६६८ (औ)'
                  : 'Official Communications • Reg. No. Ek 14668 (A)'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-normal leading-tight">
              {lang === 'mr'
                ? 'बातम्या, कार्यक्रम व सार्वजनिक सूचना'
                : 'News, Events & Public Announcements'}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-sans max-w-3xl">
              {lang === 'mr'
                ? 'संस्थेचे आगामी समाजकल्याण उपक्रम, आरोग्य शिबिरे, बाल विद्यालय प्रवेश मार्गदर्शन व अधिकृत प्रसिद्धी पत्रकांची सत्यप्रत माहिती.'
                : 'Official community initiatives, health camps, education workshops, and verified public announcements by Shrikrushna Sanstha.'}
            </p>
          </div>

          {/* Metrics Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-3xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'एकूण प्रसिद्धी' : 'Total Publications'}
                </p>
                <p className="text-xl sm:text-2xl font-bold font-serif text-white">
                  {totalPublishedCount}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'आगामी कार्यक्रम' : 'Upcoming Programs'}
                </p>
                <p className="text-xl sm:text-2xl font-bold font-serif text-white">
                  {upcomingCount}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'संपन्न समाजकार्य' : 'Completed Initiatives'}
                </p>
                <p className="text-xl sm:text-2xl font-bold font-serif text-white">
                  {completedCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Interactive Controls Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 space-y-8">
        {/* Interactive Filter & Search Control Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-4 sm:p-6 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Primary Type Switcher Pills */}
            <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Content Type">
              <button
                role="tab"
                aria-selected={filterType === 'all'}
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  filterType === 'all'
                    ? 'bg-[#061A3C] text-white shadow-sm ring-2 ring-[#061A3C]/20'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'mr' ? 'सर्व नोंदी' : 'All Updates'}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    filterType === 'all' ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {totalPublishedCount}
                </span>
              </button>

              <button
                role="tab"
                aria-selected={filterType === 'events'}
                onClick={() => setFilterType('events')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  filterType === 'events'
                    ? 'bg-[#061A3C] text-white shadow-sm ring-2 ring-[#061A3C]/20'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'mr' ? 'कार्यक्रम' : 'Events'}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    filterType === 'events' ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {publishedEvents.length}
                </span>
              </button>

              <button
                role="tab"
                aria-selected={filterType === 'announcements'}
                onClick={() => setFilterType('announcements')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  filterType === 'announcements'
                    ? 'bg-[#061A3C] text-white shadow-sm ring-2 ring-[#061A3C]/20'
                    : 'bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{lang === 'mr' ? 'बातम्या व सूचना' : 'Announcements'}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    filterType === 'announcements' ? 'bg-amber-400 text-slate-900 font-bold' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {publishedAnnouncements.length}
                </span>
              </button>
            </div>

            {/* Real-time Search Input */}
            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  lang === 'mr'
                    ? 'शीर्षक, तारीख किंवा विषय शोधा...'
                    : 'Search news, dates or venues...'
                }
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all"
                aria-label={lang === 'mr' ? 'बातम्या व कार्यक्रम शोधा' : 'Search news and events'}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          {availableCategories.length > 1 && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'विभाग:' : 'Category:'}</span>
              </span>
              {availableCategories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const label = cat === 'सर्व' ? (lang === 'mr' ? 'सर्व विभाग' : 'All Categories') : getCategoryLabel(cat as CategoryKey, lang);
                return (
                  <button
                    key={`cat-${cat}`}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Content Stream (Events & Announcements) */}
        <div className="space-y-6">
          {/* Render Filtered Events */}
          {filteredEvents.map((evt) => {
            const title = lang === 'mr' ? evt.title : evt.titleEn || evt.title;
            const summary = lang === 'mr' ? evt.summary : evt.summaryEn || evt.summary;
            const description = lang === 'mr' ? evt.description : evt.descriptionEn || evt.description;
            const dateText = formatEventDate(
              evt.startDate,
              evt.endDate,
              lang,
              lang === 'mr' ? evt.eventDateTextMr : evt.eventDateTextEn
            );
            const venue = lang === 'mr' ? evt.venue : evt.venueEn || evt.venue;
            const categoryLabel = getCategoryLabel(evt.category, lang);
            const statusBadge = getEventStatusBadge(evt.status);

            const allPhotos = [
              ...(evt.coverImageUrl ? [evt.coverImageUrl] : []),
              ...(evt.photos?.map((p: any) =>
                typeof p === 'string' ? p : p.imageUrl || p.image_url || p.photo_url || p.url || ''
              ) || []),
            ].filter(Boolean);

            return (
              <Card3D
                key={`evt-${evt.id}`}
                className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl shadow-sm hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Photo or Aesthetic Header Column */}
                  {allPhotos.length > 0 ? (
                    <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-center">
                      <ImageSlider
                        images={allPhotos}
                        alt={title}
                        heightClass="h-56 sm:h-64 lg:h-72"
                        roundedClass="rounded-xl shadow-xs"
                        showThumbnails={allPhotos.length > 1}
                      />
                    </div>
                  ) : (
                    <div className="lg:col-span-4 p-6 sm:p-8 bg-gradient-to-br from-[#061A3C]/5 via-[#FAF8F3] to-amber-500/10 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col items-center justify-center text-center space-y-3 min-h-[220px]">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-amber-200 shadow-sm flex items-center justify-center text-amber-600">
                        <Calendar className="w-8 h-8 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 block">
                          {categoryLabel}
                        </span>
                        <p className="text-xs font-semibold text-[#061A3C]">
                          {lang === 'mr' ? 'श्रीकृष्ण संस्था • कार्यक्रम' : 'Shrikrushna Sanstha • Event'}
                        </p>
                      </div>
                      <span className="inline-block px-3 py-1 bg-white/90 border border-slate-200 rounded-full text-[11px] font-medium text-slate-600">
                        {dateText}
                      </span>
                    </div>
                  )}

                  {/* Text & Metadata Details Column */}
                  <div
                    className={`${
                      allPhotos.length > 0 ? 'lg:col-span-7' : 'lg:col-span-8'
                    } p-6 sm:p-8 space-y-4 flex flex-col justify-between`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider bg-[#061A3C] text-white px-2.5 py-0.5 rounded-md">
                            {lang === 'mr' ? 'कार्यक्रम' : 'Event'}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs border ${statusBadge.cls}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                            <span>{statusBadge.label}</span>
                          </span>
                          <span className="text-xs text-[#061A3C] font-semibold bg-blue-50 border border-blue-100 px-3 py-0.5 rounded-full">
                            {categoryLabel}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-600" />
                            <span className="font-semibold text-slate-700">{dateText}</span>
                          </div>
                          {evt.eventTime && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{evt.eventTime}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Heading */}
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 leading-snug">
                        {title}
                      </h2>

                      {/* Venue */}
                      {venue && (
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600">
                          <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="font-medium">{venue}</span>
                        </div>
                      )}

                      {/* Summary */}
                      <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                        {summary}
                      </p>

                      {/* Description preview */}
                      {description && (
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-2 border-t border-slate-100 line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModalItem({ kind: 'event', data: evt })}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#061A3C] hover:bg-[#0A2540] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs hover:shadow-md"
                        aria-label={`${lang === 'mr' ? 'सविस्तर माहिती पाहा' : 'View full details'}: ${title}`}
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'mr' ? 'सविस्तर माहिती पाहा' : 'View Full Details'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare('event', title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg bg-white transition-colors cursor-pointer"
                        title={lang === 'mr' ? 'शेअर करा' : 'Share event'}
                        aria-label={lang === 'mr' ? 'हा कार्यक्रम शेअर करा' : 'Share this event'}
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{lang === 'mr' ? 'शेअर' : 'Share'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card3D>
            );
          })}

          {/* Render Filtered Announcements */}
          {filteredAnnouncements.map((item) => {
            const title = lang === 'mr' ? item.title : item.titleEn || item.title;
            const summary = lang === 'mr' ? item.summary : item.summaryEn || item.summary;
            const content = lang === 'mr' ? item.content : item.contentEn || item.content;
            const dateText = formatSingleDate(
              lang === 'mr' ? item.date : item.dateEn || item.date,
              lang
            );
            const categoryLabel = getCategoryLabel(item.category, lang);

            const allPhotos = [
              ...(item.coverImageUrl ? [item.coverImageUrl] : []),
              ...(item.images || []),
            ].filter(Boolean);

            return (
              <Card3D
                key={`ann-${item.id}`}
                className="bg-white border border-slate-200 hover:border-amber-400/80 rounded-2xl shadow-sm hover:shadow-xl transition-all"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12">
                  {/* Photo Column (if available) */}
                  {allPhotos.length > 0 && (
                    <div className="lg:col-span-5 p-4 sm:p-5 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-center">
                      <ImageSlider
                        images={allPhotos}
                        alt={title}
                        heightClass="h-56 sm:h-64 lg:h-72"
                        roundedClass="rounded-xl shadow-xs"
                        showThumbnails={allPhotos.length > 1}
                      />
                    </div>
                  )}

                  {/* Text & Metadata Details Column */}
                  <div
                    className={`${
                      allPhotos.length > 0 ? 'lg:col-span-7' : 'lg:col-span-12'
                    } p-6 sm:p-8 space-y-4 flex flex-col justify-between`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges Strip */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider bg-slate-700 text-white px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Radio className="w-3 h-3 text-amber-400" />
                            <span>{lang === 'mr' ? 'सूचना व बातमी' : 'Notice'}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold border ${
                              item.isUpcoming
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.isUpcoming ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            <span>
                              {item.isUpcoming
                                ? t.newsSection.upcomingBadge
                                : t.newsSection.completedBadge}
                            </span>
                          </span>

                          <span className="text-xs text-[#061A3C] font-semibold bg-blue-50 border border-blue-100 px-3 py-0.5 rounded-full">
                            {categoryLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span className="font-semibold text-slate-700">{dateText}</span>
                        </div>
                      </div>

                      {/* Heading */}
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 leading-snug">
                        {title}
                      </h2>

                      {/* Summary */}
                      <p className="text-xs sm:text-sm font-medium text-slate-700 leading-relaxed">
                        {summary}
                      </p>

                      {/* Content preview */}
                      {content && (
                        <p className="text-xs sm:text-sm text-slate-500 leading-relaxed pt-2 border-t border-slate-100 line-clamp-2">
                          {content}
                        </p>
                      )}
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveModalItem({ kind: 'announcement', data: item })}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#061A3C] hover:bg-[#0A2540] text-white rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs hover:shadow-md"
                        aria-label={`${lang === 'mr' ? 'सविस्तर सूचना वाचा' : 'Read full notice'}: ${title}`}
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'mr' ? 'सविस्तर सूचना वाचा' : 'Read Full Notice'}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleShare('announcement', title)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg bg-white transition-colors cursor-pointer"
                        title={lang === 'mr' ? 'शेअर करा' : 'Share announcement'}
                        aria-label={lang === 'mr' ? 'ही सूचना शेअर करा' : 'Share this announcement'}
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>{lang === 'mr' ? 'शेअर' : 'Share'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </Card3D>
            );
          })}

          {/* Empty State */}
          {totalFilteredCount === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8 shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
                <Calendar className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-serif font-bold text-slate-900">
                  {lang === 'mr'
                    ? 'या निकषानुसार कोणतीही नोंद आढळली नाही'
                    : 'No matching news or events found'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {searchQuery || selectedCategory !== 'सर्व' || filterType !== 'all'
                    ? lang === 'mr'
                      ? 'कृपया शोध शब्द तपासा किंवा निवडलेले फिल्टर्स रीसेट करा.'
                      : 'Please check your search keyword or reset the active filters.'
                    : lang === 'mr'
                    ? 'नवीन कार्यक्रम किंवा सूचना अधिकृतपणे प्रकाशित झाल्यानंतर येथे उपलब्ध होतील.'
                    : 'New events and announcements will be listed here once officially published.'}
                </p>
              </div>

              {(searchQuery || selectedCategory !== 'सर्व' || filterType !== 'all') && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFilterType('all');
                      setSelectedCategory('सर्व');
                      setSearchQuery('');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#061A3C] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#0A2540] transition-colors cursor-pointer shadow-xs"
                  >
                    <span>{lang === 'mr' ? 'सर्व नोंदी पुन्हा पाहा' : 'Reset All Filters'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Institutional Transparency & Notice Commitment Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-[#061A3C] to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-amber-500/20 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {lang === 'mr'
                    ? 'अधिकृत सूचना व लोकसहभाग वचनबद्धता'
                    : 'Official Public Notices & Community Engagement'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                {lang === 'mr'
                  ? '॥ सेवेची पावले, परिवर्तनाची दिशा ॥'
                  : 'Steps of Service, Direction of Transformation'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lang === 'mr'
                  ? 'संस्थेमार्फत आयोजित सर्व शिबिरे, बाल विद्यालय प्रवेश व सामाजिक उपक्रमांचे आयोजन स्थानिक ग्रामपंचायती, आरोग्य विभाग आणि शिक्षण विभागाच्या मार्गदर्शनाखाली पारदर्शकतेने केले जाते.'
                  : 'All camps, Bal Vidyalaya admissions, and community programs are conducted transparently in close coordination with local Gram Panchayats and official departments.'}
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
                <span>{lang === 'mr' ? 'संस्थेशी संपर्क साधा' : 'Contact Us'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Accessible Interactive Details Modal Dialog */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="news-modal-title"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 lg:p-8 flex items-center justify-center animate-fade-in"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#061A3C] text-white p-5 sm:p-6 flex items-start justify-between gap-4 border-b border-amber-500/20">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400 text-slate-900 px-2.5 py-0.5 rounded-md">
                    {activeModalItem.kind === 'event'
                      ? lang === 'mr'
                        ? 'अधिकृत कार्यक्रम'
                        : 'Official Event'
                      : lang === 'mr'
                      ? 'अधिकृत सूचना व बातमी'
                      : 'Official Notice'}
                  </span>
                  <span className="text-xs text-slate-200 bg-white/10 px-3 py-0.5 rounded-full border border-white/20">
                    {getCategoryLabel(activeModalItem.data.category as CategoryKey, lang)}
                  </span>
                </div>
                <h2
                  id="news-modal-title"
                  className="text-lg sm:text-2xl font-serif font-bold text-white leading-snug"
                >
                  {lang === 'mr'
                    ? activeModalItem.data.title
                    : activeModalItem.data.titleEn || activeModalItem.data.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label={lang === 'mr' ? 'खिडकी बंद करा' : 'Close modal'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Media Preview (Cover or Slider) */}
              {(() => {
                const photos =
                  activeModalItem.kind === 'event'
                    ? [
                        ...(activeModalItem.data.coverImageUrl
                          ? [activeModalItem.data.coverImageUrl]
                          : []),
                        ...(activeModalItem.data.photos?.map((p: any) =>
                          typeof p === 'string'
                            ? p
                            : p.imageUrl || p.image_url || p.photo_url || p.url || ''
                        ) || []),
                      ].filter(Boolean)
                    : [
                        ...(activeModalItem.data.coverImageUrl
                          ? [activeModalItem.data.coverImageUrl]
                          : []),
                        ...(activeModalItem.data.images || []),
                      ].filter(Boolean);

                if (photos.length > 0) {
                  return (
                    <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                      <ImageSlider
                        images={photos}
                        alt={
                          lang === 'mr'
                            ? activeModalItem.data.title
                            : activeModalItem.data.titleEn || activeModalItem.data.title
                        }
                        heightClass="h-64 sm:h-80"
                        roundedClass="rounded-xl"
                        showThumbnails={photos.length > 1}
                      />
                    </div>
                  );
                }
                return null;
              })()}

              {/* Event / Notice Metadata Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm">
                <div className="flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      {lang === 'mr' ? 'तारीख व कालावधी' : 'Date / Schedule'}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {activeModalItem.kind === 'event'
                        ? formatEventDate(
                            activeModalItem.data.startDate,
                            activeModalItem.data.endDate,
                            lang,
                            lang === 'mr'
                              ? activeModalItem.data.eventDateTextMr
                              : activeModalItem.data.eventDateTextEn
                          )
                        : formatSingleDate(
                            lang === 'mr'
                              ? activeModalItem.data.date
                              : activeModalItem.data.dateEn || activeModalItem.data.date,
                            lang
                          )}
                    </span>
                  </div>
                </div>

                {activeModalItem.kind === 'event' && activeModalItem.data.venue && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium">
                        {lang === 'mr' ? 'स्थान / पत्ता' : 'Venue / Location'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {lang === 'mr'
                          ? activeModalItem.data.venue
                          : activeModalItem.data.venueEn || activeModalItem.data.venue}
                      </span>
                    </div>
                  </div>
                )}

                {activeModalItem.kind === 'event' && activeModalItem.data.eventTime && (
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 block text-[11px] font-medium">
                        {lang === 'mr' ? 'वेळ' : 'Time'}
                      </span>
                      <span className="font-semibold text-slate-800">
                        {activeModalItem.data.eventTime}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-slate-500 block text-[11px] font-medium">
                      {lang === 'mr' ? 'आयोजक संस्था' : 'Organizing Body'}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {lang === 'mr'
                        ? 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था'
                        : 'Shrikrushna Sanskrutik Va Gramin Vikas Sanstha'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Detailed Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'mr' ? 'थोडक्यात माहिती' : 'Executive Summary'}
                </h4>
                <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed bg-amber-50/60 p-4 rounded-xl border border-amber-200/60">
                  {lang === 'mr'
                    ? activeModalItem.data.summary
                    : activeModalItem.data.summaryEn || activeModalItem.data.summary}
                </p>
              </div>

              {/* Full Content / Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {lang === 'mr' ? 'सविस्तर तपशील' : 'Full Detailed Notice'}
                </h4>
                <div className="prose prose-slate max-w-none text-xs sm:text-sm text-slate-600 leading-relaxed space-y-3">
                  {activeModalItem.kind === 'event' ? (
                    <p>
                      {lang === 'mr'
                        ? activeModalItem.data.description
                        : activeModalItem.data.descriptionEn || activeModalItem.data.description}
                    </p>
                  ) : (
                    <p>
                      {lang === 'mr'
                        ? activeModalItem.data.content
                        : activeModalItem.data.contentEn || activeModalItem.data.content}
                    </p>
                  )}
                </div>
              </div>

              {/* Official Seal / Verification Stamp */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>
                    {lang === 'mr'
                      ? 'अधिकृत प्रशासकीय प्रसिद्धी • नादरपूर कार्यालय'
                      : 'Verified Institutional Notice • Nadarpur Office'}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-400">
                  ID: {activeModalItem.data.id}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() =>
                  handleShare(
                    activeModalItem.kind,
                    lang === 'mr'
                      ? activeModalItem.data.title
                      : activeModalItem.data.titleEn || activeModalItem.data.title
                  )
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-slate-500" />
                <span>{lang === 'mr' ? 'लिंक शेअर करा' : 'Share Link'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveModalItem(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
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
