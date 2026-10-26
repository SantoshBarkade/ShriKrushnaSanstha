import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { isYouTubeUrl } from '../utils/youtube';
import { useCountUp } from '../utils/useCountUp';
import {
  Users,
  Home,
  FileCheck2,
  Quote,
  Play,
  ArrowRight,
  Calendar,
  Phone,
  X,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { motion, useInView, AnimatePresence } from 'motion/react';
import { PageRoute } from '../types';

const CountUpDisplay: React.FC<{
  endValue: number;
  durationMs?: number;
  inView: boolean;
  colorClass: string;
  suffix?: string;
}> = React.memo(({ endValue, durationMs = 1500, inView, colorClass, suffix = '+' }) => {
  const count = useCountUp(endValue, durationMs, inView);
  return (
    <div className="text-3xl sm:text-4xl font-serif font-black tracking-normal">
      {count}
      <span className={colorClass}>{suffix}</span>
    </div>
  );
});

export const HomeOverview: React.FC = () => {
  const { state, setCurrentRoute, lang, siteSettings } = useSanstha();
  const [activeVideoModal, setActiveVideoModal] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const statsSectionRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsSectionRef, { once: true, margin: '-50px' });

  // Dynamic CMS sections configured for Home page
  const homeSections = useMemo(
    () => (state.pageSections || []).filter((s) => s.pageSlug === 'home' && s.isPublished),
    [state.pageSections]
  );

  const identitySec = useMemo(
    () => homeSections.find((s) => s.sectionKey === 'identity' || s.sectionKey === 'about_sanstha'),
    [homeSections]
  );

  const missionSec = useMemo(
    () => homeSections.find((s) => s.sectionKey === 'mission'),
    [homeSections]
  );

  const ctaSec = useMemo(
    () => homeSections.find((s) => s.sectionKey === 'join_cta' || s.sectionKey === 'cta'),
    [homeSections]
  );

  const additionalHomeSections = useMemo(
    () =>
      homeSections
        .filter(
          (s) => !['identity', 'about_sanstha', 'mission', 'join_cta', 'cta'].includes(s.sectionKey)
        )
        .sort((a, b) => a.displayOrder - b.displayOrder),
    [homeSections]
  );

  const identitySubtitle =
    (lang === 'mr' ? identitySec?.subtitleMr?.trim() : identitySec?.subtitleEn?.trim()) ||
    (lang === 'mr' ? 'आमची ओळख' : 'Our Identity');

  const identityTitle =
    (lang === 'mr' ? identitySec?.titleMr?.trim() : identitySec?.titleEn?.trim()) ||
    (lang === 'mr' ? 'ग्रामीण विकासासाठी समर्पित संस्था' : 'An Institution Dedicated to Rural Transformation');

  const identityContent =
    (lang === 'mr' ? identitySec?.contentMr?.trim() : identitySec?.contentEn?.trim()) ||
    (lang === 'mr'
      ? 'नादरपूर व परिसरातील ग्रामीण भागात शिक्षण, कला-संस्कृती, आरोग्य, पर्यावरण आणि सामाजिक विकास यासाठी कार्य करणारी एक सेवाभावी संस्था. स्थानिक समुदायासोबत सहकार्याने शाश्वत विकासाच्या उपक्रमांवर आमचा भर आहे.'
      : 'A public welfare organization working tirelessly across Nadarpur and surrounding rural regions for education, arts & culture, public health, environment, and social upliftment through active community cooperation.');

  const missionQuote =
    (lang === 'mr' ? missionSec?.contentMr?.trim() : missionSec?.contentEn?.trim()) ||
    (lang === 'mr'
      ? '“संस्कृतीचे जतन, शिक्षणाचा प्रसार, आणि समृद्ध ग्रामीण विकास हीच आमची दिशा.”'
      : '“Preserving culture, advancing education, and fostering sustainable rural progress is our core direction.”');

  const missionLabel =
    (lang === 'mr' ? missionSec?.titleMr?.trim() : missionSec?.titleEn?.trim()) ||
    (lang === 'mr' ? 'संस्थेचे ध्येय' : 'Sanstha Mission');

  const ctaTitle =
    (lang === 'mr' ? ctaSec?.titleMr?.trim() : ctaSec?.titleEn?.trim()) ||
    (lang === 'mr' ? 'आपणही या परिवर्तनाच्या प्रवासाचा भाग व्हा' : 'Become Part of this Journey of Transformation');

  const ctaContent =
    (lang === 'mr' ? ctaSec?.contentMr?.trim() : ctaSec?.contentEn?.trim()) ||
    (lang === 'mr'
      ? 'शिक्षण, आरोग्य, संस्कृती आणि ग्रामीण विकासासाठी आमच्यासोबत हातमिळवणी करा.'
      : 'Join hands with us for education, healthcare, cultural heritage, and rural empowerment.');

  const publishedVideos = useMemo(() => state.videos.filter((video) => video.published), [state.videos]);
  const featuredVideo = useMemo(() => publishedVideos.find((video) => video.featured) || publishedVideos[0], [publishedVideos]);
  const defaultVideoUrl = featuredVideo?.videoUrl || '';
  const videoDuration =
    lang === 'mr'
      ? featuredVideo?.durationFormatted || ''
      : featuredVideo?.durationFormattedEn || featuredVideo?.durationFormatted || '';

  useEffect(() => {
    if (!activeVideoModal) {
      setIsVideoLoading(false);
      setVideoError(false);
      return;
    }
    setIsVideoLoading(!isYouTubeUrl(activeVideoModal));
    setVideoError(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveVideoModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeVideoModal]);

  const newsItems = useMemo(
    () =>
      (state.announcements || [])
        .filter((item) => item.published)
        .slice(0, 3)
        .map((item) => ({
          id: item.id,
          image: item.coverImageUrl || item.images?.[0] || '',
          categoryMr: item.category,
          categoryEn: item.category,
          dateMr: item.date,
          dateEn: item.dateEn || item.date,
          titleMr: item.title,
          titleEn: item.titleEn,
          summaryMr: item.summary,
          summaryEn: item.summaryEn,
          route: 'news' as PageRoute,
        })),
    [state.announcements]
  );

  return (
    <div className="space-y-16 sm:space-y-24 pb-10 bg-gradient-to-b from-[#F4F1E8] via-[#F8FBFE] to-white">
      <section ref={statsSectionRef} className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-8 relative overflow-hidden rounded-[28px] p-6 sm:p-10 text-white shadow-[0_24px_70px_rgba(7,29,67,0.28)] bg-[#071D43]"
          >
            <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.45),transparent_42%),radial-gradient(circle_at_0%_100%,rgba(16,185,129,0.25),transparent_36%)]" />
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 divide-y sm:divide-y-0 sm:divide-x divide-white/15">
              <div className="pt-4 sm:pt-0 sm:px-4 first:pt-0 first:px-0 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0868C9] to-[#38BDF8] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <CountUpDisplay endValue={5000} durationMs={1600} inView={isStatsInView} colorClass="text-[#38BDF8]" suffix="+" />
                  <p className="text-[13px] text-slate-300 mt-1">
                    {lang === 'mr' ? 'नागरिक व विद्यार्थी लाभार्थ्यांपर्यंत पोहोच' : 'Beneficiaries Reached'}
                  </p>
                </div>
              </div>
              <div className="pt-4 sm:pt-0 sm:px-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0D9488] to-[#2DD4BF] flex items-center justify-center shrink-0">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <CountUpDisplay endValue={25} durationMs={1300} inView={isStatsInView} colorClass="text-[#2DD4BF]" suffix="+" />
                  <p className="text-[13px] text-slate-300 mt-1">
                    {lang === 'mr' ? 'ग्रामपंचायतींमध्ये उपक्रम विस्तार' : 'Gram Panchayats Outreach'}
                  </p>
                </div>
              </div>
              <div className="pt-4 sm:pt-0 sm:px-4 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#60A5FA] flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-serif font-black tracking-normal">
                    {lang === 'mr' ? 'विविध' : 'Multi'}
                  </div>
                  <p className="text-[13px] text-slate-300 mt-1">
                    {lang === 'mr' ? 'शिक्षण, आरोग्य, संस्कृती व विकास उपक्रम' : 'Holistic Development Programs'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 rounded-[28px] p-6 sm:p-7 bg-white/90 backdrop-blur-md border border-white shadow-xl flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-9 h-9 rounded-xl bg-[#EBF3FA] flex items-center justify-center text-[#0868C9]">
                <Quote className="w-5 h-5" />
              </div>
              <blockquote className="font-serif text-[#071D43] text-base lg:text-lg font-bold leading-relaxed">
                {missionQuote}
              </blockquote>
            </div>
            <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-2">
              <span className="w-6 h-[3px] bg-[#E52E3D] rounded-full" />
              <span className="w-3 h-[3px] bg-[#0868C9] rounded-full" />
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {missionLabel}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[32px] p-6 sm:p-10 lg:p-12 bg-white shadow-[0_20px_60px_rgba(7,29,67,0.08)] border border-slate-200/80 overflow-hidden relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-5"
            >
              <button
                type="button"
                onClick={() => defaultVideoUrl && setActiveVideoModal(defaultVideoUrl)}
                disabled={!defaultVideoUrl}
                className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white group cursor-pointer aspect-[16/10] bg-slate-900 w-full text-left disabled:cursor-not-allowed"
                aria-label={lang === 'mr' ? 'संस्थेचा व्हिडिओ पाहा' : 'Watch Sanstha Video'}
              >
                <img
                  src={featuredVideo?.thumbnailUrl || '/sanstha-building-art.jpg'}
                  alt={lang === 'mr' ? featuredVideo?.title || 'संस्था व्हिडिओ' : featuredVideo?.titleEn || 'Sanstha video'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80';
                  }}
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white text-[#0868C9] shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-[#0868C9] translate-x-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-center justify-between text-white">
                  <span className="font-serif font-bold text-sm sm:text-base">
                    {lang === 'mr' ? 'आमची संस्था - एक झलक' : 'Our Sanstha - At a Glance'}
                  </span>
                  {videoDuration && (
                    <span className="px-2.5 py-0.5 rounded-md bg-black/60 text-xs font-mono">{videoDuration}</span>
                  )}
                </div>
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-7 space-y-4"
            >
              <div className="inline-flex items-center gap-2 text-[#0868C9] font-bold text-sm uppercase tracking-wider">
                <span className="w-6 h-[2.5px] bg-[#0868C9]" />
                <span>{identitySubtitle}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#071D43] leading-snug">
                {identityTitle}
              </h2>
              <p className="text-sm sm:text-base text-[#475569] leading-relaxed">
                {identityContent}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {[
                  lang === 'mr'
                    ? `अधिकृत नोंदणी (${state.contactInfo?.regNoMr || 'रजि. नं. एक १४६६८ (औ)'})`
                    : `Govt. Registered (${state.contactInfo?.regNoEn || 'Ek 14668 A'})`,
                  lang === 'mr' ? 'तळागाळातील नागरिकांपर्यंत थेट पोहोच' : 'Grassroots Outreach',
                  lang === 'mr' ? 'शाश्वत शिक्षण व आरोग्य सहाय्य' : 'Sustainable Education & Health',
                  lang === 'mr' ? 'स्थानिक सांस्कृतिक वारसा संवर्धन' : 'Cultural Heritage Preservation',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[13px] text-slate-700 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  setCurrentRoute('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2.5 px-7 py-3 bg-white hover:bg-[#0868C9] text-[#0868C9] hover:text-white border-2 border-[#0868C9] rounded-xl font-bold text-sm transition-all cursor-pointer group"
              >
                <span>{lang === 'mr' ? 'संस्थेविषयी सविस्तर माहिती' : 'Learn More About Sanstha'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-[#E52E3D] font-bold text-sm uppercase tracking-wider">
              <span className="w-5 h-[2px] bg-[#E52E3D]" />
              <span>{lang === 'mr' ? 'अलीकडील घडामोडी' : 'Recent Updates'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-[#071D43]">
              {lang === 'mr' ? 'संस्थेच्या उपक्रमांच्या ताज्या बातम्या' : 'Latest Updates & News from Our Initiatives'}
            </h2>
          </div>
          <button
            onClick={() => {
              setCurrentRoute('news');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#071D43] border border-slate-300 rounded-xl text-sm font-bold cursor-pointer group"
          >
            <span>{lang === 'mr' ? 'सर्व बातम्या पाहा' : 'View All News'}</span>
            <ArrowRight className="w-4 h-4 text-[#0868C9] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {newsItems.map((news, idx) => (
            <motion.button
              type="button"
              key={news.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -6 }}
              onClick={() => {
                setCurrentRoute(news.route);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl border border-slate-200/90 text-left cursor-pointer flex flex-col"
              aria-label={lang === 'mr' ? news.titleMr : news.titleEn}
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                {news.image && (
                  <img
                    src={news.image}
                    alt={lang === 'mr' ? news.titleMr : news.titleEn}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                )}
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-white/95 text-[11px] font-bold text-[#0868C9]">
                  {lang === 'mr' ? news.categoryMr : news.categoryEn}
                </div>
              </div>
              <div className="p-5 sm:p-6 space-y-2.5 flex-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0868C9]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? news.dateMr : news.dateEn}</span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#071D43] leading-snug">
                  {lang === 'mr' ? news.titleMr : news.titleEn}
                </h3>
                <p className="text-[13px] text-slate-600 leading-relaxed line-clamp-2">
                  {lang === 'mr' ? news.summaryMr : news.summaryEn}
                </p>
              </div>
              <div className="px-5 sm:px-6 pb-5 flex items-center justify-between border-t border-slate-100">
                <span className="text-xs font-bold text-[#0868C9]">{lang === 'mr' ? 'अधिक वाचा' : 'Read More'}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Dynamic Additional Home Page Sections configured in CMS */}
      {additionalHomeSections.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {additionalHomeSections.map((sec, idx) => {
            const secTitle = lang === 'mr' ? sec.titleMr : sec.titleEn || sec.titleMr;
            const secSubtitle = lang === 'mr' ? sec.subtitleMr : sec.subtitleEn || sec.subtitleMr;
            const secContent = lang === 'mr' ? sec.contentMr : sec.contentEn || sec.contentMr;
            const secImageAlt = lang === 'mr' ? sec.imageAltMr : sec.imageAltEn || secTitle;

            return (
              <motion.div
                key={sec.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-6 sm:p-10 lg:p-12 shadow-[0_16px_50px_rgba(7,29,67,0.06)] border border-slate-200/80 overflow-hidden"
              >
                <div
                  className={`grid grid-cols-1 ${
                    sec.imageUrl ? 'lg:grid-cols-12 gap-8 lg:gap-12 items-center' : ''
                  }`}
                >
                  {sec.imageUrl && (
                    <div className="lg:col-span-5 rounded-2xl overflow-hidden aspect-[16/10] bg-slate-100 shadow-md">
                      <img
                        src={sec.imageUrl}
                        alt={secImageAlt}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className={sec.imageUrl ? 'lg:col-span-7 space-y-4' : 'space-y-4 max-w-4xl'}>
                    {secSubtitle && (
                      <div className="inline-flex items-center gap-2 text-[#0868C9] font-bold text-xs sm:text-sm uppercase tracking-wider">
                        <span className="w-5 h-[2px] bg-[#0868C9]" />
                        <span>{secSubtitle}</span>
                      </div>
                    )}
                    <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#071D43] leading-snug">
                      {secTitle}
                    </h3>
                    <div className="text-sm sm:text-base text-[#475569] leading-relaxed whitespace-pre-line space-y-2">
                      {secContent}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      )}

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[32px] p-6 sm:p-10 lg:p-12 text-white bg-[#051838] shadow-2xl"
        >
          <div className="absolute inset-0 pointer-events-none opacity-70 bg-[radial-gradient(circle_at_0%_50%,rgba(16,185,129,0.18),transparent_34%),radial-gradient(circle_at_100%_80%,rgba(8,104,201,0.3),transparent_40%)]" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <h3 className="text-xl sm:text-3xl font-serif font-bold leading-snug">
                {ctaTitle}
              </h3>
              <p className="text-sm text-slate-300">
                {ctaContent}
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentRoute('contact');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#E52E3D] hover:bg-[#C92033] text-white font-bold rounded-full shadow-lg cursor-pointer w-full md:w-auto"
            >
              <Phone className="w-4 h-4" />
              <span>{lang === 'mr' ? 'संपर्क साधा' : 'Contact Us'}</span>
            </button>
          </div>
        </motion.div>
      </section>

      <AnimatePresence>
        {activeVideoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(event) => {
              if (event.target === event.currentTarget) setActiveVideoModal(null);
            }}
            role="dialog"
            aria-modal="true"
            aria-label={lang === 'mr' ? 'व्हिडिओ प्लेअर' : 'Video Player'}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-white">
                <span className="font-serif font-bold text-sm sm:text-base truncate">
                  {lang === 'mr' ? featuredVideo?.title || 'आमची संस्था' : featuredVideo?.titleEn || 'Our Sanstha'}
                </span>
                <button onClick={() => setActiveVideoModal(null)} className="p-1 rounded-lg hover:bg-slate-800 cursor-pointer" aria-label="Close Video">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative aspect-video w-full bg-black flex items-center justify-center">
                {isVideoLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
                {isYouTubeUrl(activeVideoModal) ? (
                  <iframe
                    src={activeVideoModal}
                    title="Sanstha Video"
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={activeVideoModal}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                    onCanPlay={() => setIsVideoLoading(false)}
                    onError={() => {
                      setIsVideoLoading(false);
                      setVideoError(true);
                    }}
                  />
                )}
                {videoError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-6 text-center text-white space-y-3">
                    <p className="text-sm text-slate-300">
                      {lang === 'mr'
                        ? 'व्हिडिओ प्ले करताना त्रुटी आली. कृपया व्हिडिओ दालन तपासा.'
                        : 'Unable to stream video. Please check the video library.'}
                    </p>
                    <button
                      onClick={() => {
                        setActiveVideoModal(null);
                        setCurrentRoute('videos');
                      }}
                      className="px-4 py-2 bg-[#0868C9] text-white rounded-lg text-xs font-bold"
                    >
                      {lang === 'mr' ? 'व्हिडिओ दालन उघडा' : 'Open Video Library'}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
