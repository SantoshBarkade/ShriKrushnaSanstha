import React from 'react';
import { useSanstha } from '../context/SansthaContext';
import { getCategoryLabel } from '../utils/i18n';
import {
  Calendar,
  ArrowRight,
  MapPin,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  PhoneCall,
  CheckCircle2,
  Building2
} from 'lucide-react';
import { CategoryKey } from '../types';

export const WorkTimelineView: React.FC = () => {
  const { state, setCurrentRoute, setSelectedInitiativeId, lang, t } = useSanstha();

  const activities = (state.initiatives || []).filter((i) => i.published !== false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800">
      {/* 1. Breadcrumbs & Institutional Authority Bar */}
      <section className="bg-white border-b border-slate-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/95">
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
            <span className="text-[#061A3C] font-semibold">{t.nav.work}</span>
          </nav>

          {/* Switch to Card Grid View */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setCurrentRoute('initiatives')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#0868C9] bg-blue-50 hover:bg-blue-100 border border-blue-200/70 transition-colors cursor-pointer"
              title={lang === 'mr' ? 'उपक्रम व योजना ग्रिड दृश्य पहा' : 'View initiatives card grid'}
            >
              <Layers className="w-3 h-3 text-[#0868C9]" />
              <span>{lang === 'mr' ? 'उपक्रम ग्रिड दृश्य (Cards)' : 'Initiatives Grid'}</span>
            </button>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                {activities.length} {lang === 'mr' ? 'नोंदणीकृत उपक्रम' : 'Documented Activities'}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#061A3C] via-[#0A2540] to-[#0D2E4D] text-white py-12 sm:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm font-medium text-slate-200">
            <span className="text-[#E52E3D] font-serif font-bold">॥ श्रीकृष्णाय नमः ॥</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300 font-semibold">
              {lang === 'mr' ? 'कालक्रमानुसार प्रत्यक्ष कार्य अहवाल' : 'Chronological Field Work Archive'}
            </span>
          </div>

          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
              {lang === 'mr' ? 'आमचे प्रत्यक्ष कार्य व कालक्रम' : 'Our Field Work & Activity Timeline'}
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed font-sans font-normal">
              {lang === 'mr'
                ? 'संस्थेने प्रत्यक्ष ग्रामीण भागात राबवलेल्या शैक्षणिक, आरोग्य, सामाजिक व पर्यावरणविषयक उपक्रमांची कालक्रमानुसार अधिकृत नोंद.'
                : 'Official chronological archive of grassroots educational, healthcare, social welfare, and environmental initiatives executed across rural communities.'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. Editorial Timeline Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="relative border-l-2 border-[#061A3C]/20 ml-3 sm:ml-6 space-y-8 pl-5 sm:pl-8">
          {activities.map((act) => {
            const title = lang === 'mr' ? act.title : act.titleEn || act.title;
            const summary = lang === 'mr' ? act.summary : act.summaryEn || act.summary;
            const location = lang === 'mr' ? act.location : act.locationEn || act.location;
            const categoryLabel = getCategoryLabel(act.category as CategoryKey, lang);

            return (
              <div key={act.id} className="relative group">
                {/* Timeline Node Point */}
                <div className="absolute -left-[29px] sm:-left-[41px] top-2 w-5 h-5 rounded-full bg-[#061A3C] border-4 border-white text-white flex items-center justify-center shadow-xs">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E52E3D]" />
                </div>

                {/* Timeline Card */}
                <div className="bg-white p-5 sm:p-7 md:p-8 border border-slate-200/90 rounded-2xl shadow-xs hover:border-[#0868C9]/40 hover:shadow-lg transition-all space-y-4">
                  {/* Category and Date/Location Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="px-3 py-1 bg-[#061A3C] text-amber-300 text-xs font-bold rounded-lg shadow-2xs">
                      {categoryLabel}
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {act.date && (
                        <span className="inline-flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-[#0868C9]" />
                          {act.date}
                        </span>
                      )}
                      {location && (
                        <span className="inline-flex items-center gap-1 font-medium">
                          • <MapPin className="w-3.5 h-3.5 text-[#E52E3D]" /> {location}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="md:col-span-8 space-y-2.5">
                      <h2 className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-[#061A3C] group-hover:text-[#0868C9] transition-colors leading-snug">
                        {title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                        {summary}
                      </p>
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedInitiativeId(act.id);
                            setCurrentRoute('initiatives');
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-[#061A3C] text-[#061A3C] hover:text-white rounded-xl text-xs font-bold border border-slate-200 hover:border-[#061A3C] transition-all cursor-pointer shadow-2xs"
                        >
                          <span>{lang === 'mr' ? 'सविस्तर माहिती व छायाचित्रे' : 'Full Details & Photos'}</span>
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                        </button>
                      </div>
                    </div>

                    <div className="md:col-span-4 overflow-hidden rounded-xl h-44 sm:h-48 border border-slate-200 bg-slate-100">
                      {act.imageUrl ? (
                        <img
                          src={act.imageUrl}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                          <Layers className="w-8 h-8 mb-1 text-slate-400" />
                          <span className="text-xs font-medium text-slate-500">
                            {lang === 'mr' ? 'श्रीकृष्ण संस्था' : 'Shrikrushna Sanstha'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Pre-Footer Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="bg-gradient-to-r from-[#061A3C] via-[#0A2540] to-[#061A3C] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
              {lang === 'mr' ? 'आपल्या गावात उपक्रम राबवू इच्छिता?' : 'Want to Organize a Drive in Your Village?'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              {lang === 'mr'
                ? 'आरोग्य शिबीर, झाडे लावणे किंवा शासकीय योजना जनजागृतीसाठी नादरपूर कार्यालयाशी संपर्क साधा.'
                : 'Contact our central office in Nadarpur for health camps, tree drives, or welfare scheme sessions.'}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('contact')}
            className="px-5 py-2.5 rounded-xl bg-white text-[#061A3C] hover:bg-slate-100 font-bold text-xs sm:text-sm transition-colors cursor-pointer shrink-0 shadow-md inline-flex items-center gap-2"
          >
            <PhoneCall className="w-4 h-4 text-[#E52E3D]" />
            <span>{lang === 'mr' ? 'कार्यालयाशी संपर्क' : 'Contact Office'}</span>
          </button>
        </div>
      </section>
    </div>
  );
};
