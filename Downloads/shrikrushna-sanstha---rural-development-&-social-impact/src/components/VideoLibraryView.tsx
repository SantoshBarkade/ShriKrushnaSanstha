import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { VideoItem, CategoryKey } from '../types';
import { getCategoryLabel } from '../utils/i18n';
import { getYouTubeEmbedUrl, getYouTubeThumbnail, isYouTubeUrl, isValidHttpUrl } from '../utils/youtube';
import {
  Play,
  Calendar,
  X,
  AlertCircle,
  Loader2,
  ExternalLink,
  Video,
  Images,
  Tag,
  Film,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';

const FALLBACK_THUMB =
  'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75';

import { Card3D } from './Card3D';

export const VideoLibraryView: React.FC = () => {
  const { state, setCurrentRoute, lang, t } = useSanstha();
  const [playingVideo, setPlayingVideo] = useState<VideoItem | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('सर्व');

  const publishedVideos = state.videos.filter((v) => v.published);

  // Automatically reset loading and error states when changing or opening videos
  useEffect(() => {
    if (playingVideo?.videoUrl) {
      if (isYouTubeUrl(playingVideo.videoUrl)) {
        setIsVideoLoading(false);
        setVideoError(false);
      } else {
        setIsVideoLoading(true);
        setVideoError(false);
      }
    } else {
      setIsVideoLoading(false);
      setVideoError(false);
    }
  }, [playingVideo?.videoUrl]);

  // Keyboard navigation: Escape key closes playback modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (playingVideo && e.key === 'Escape') {
        handleCloseModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playingVideo]);

  const handleCloseModal = () => {
    setPlayingVideo(null);
    setIsVideoLoading(false);
    setVideoError(false);
  };

  const categories: CategoryKey[] = [
    'सर्व',
    'शिक्षण',
    'शासकीय योजना जनजागृती',
    'आरोग्यविषयक उपक्रम',
    'पर्यावरण संवर्धन',
    'महिला व ज्येष्ठ नागरिक सहाय्य',
    'सामाजिक कल्याण',
  ];

  const filteredVideos =
    selectedCategory === 'सर्व'
      ? publishedVideos
      : publishedVideos.filter((v) => v.category === selectedCategory);

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
            <span className="text-amber-400 font-semibold">{t.nav.videos}</span>
          </nav>

          {/* Institutional Trust Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Film className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'अधिकृत व्हिडिओ दालन' : 'Official Video Archive'}</span>
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
              <p className="text-amber-400/90 font-serif text-sm tracking-wide">
                ॥ सेवेची पावले, परिवर्तनाची दिशा ॥
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-normal leading-tight">
                {lang === 'mr' ? 'व्हिडिओ दालन' : 'Video Library & Documentaries'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                {lang === 'mr'
                  ? 'संस्थेच्या विविध उपक्रमांचे, शैक्षणिक कार्यशाळांचे, आरोग्य शिबिरांचे व ग्रामविकास प्रकल्पांचे अधिकृत व्हिडिओ चित्रीकरण.'
                  : 'Documenting our educational initiatives, healthcare camps, and rural empowerment journeys in high-definition video.'}
              </p>
            </div>

            {/* Quick Switch to Photo Gallery */}
            <div className="shrink-0">
              <button
                onClick={() => setCurrentRoute('gallery')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-amber-400/50 rounded-xl text-xs sm:text-sm font-semibold text-white transition-all cursor-pointer shadow-sm"
              >
                <Images className="w-4 h-4 text-amber-400" />
                <span>{lang === 'mr' ? 'छायाचित्र दालन पाहा' : 'View Photo Gallery'}</span>
                <span className="px-2 py-0.5 bg-amber-400/20 text-amber-300 rounded-full text-[11px] font-mono">
                  {state.gallery.filter((g) => g.published).length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {categories.map((cat) => {
            const count =
              cat === 'सर्व'
                ? publishedVideos.length
                : publishedVideos.filter((v) => v.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 border ${
                  selectedCategory === cat
                    ? 'bg-[#061A3C] text-white border-[#061A3C] shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <span>{getCategoryLabel(cat, lang)}</span>
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                    selectedCategory === cat
                      ? 'bg-amber-400 text-slate-900 font-bold'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 font-sans space-y-2">
            <Film className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-base font-semibold text-slate-700">
              {lang === 'mr' ? 'या विभागात कोणतेही व्हिडिओ उपलब्ध नाहीत.' : 'No videos found in this category.'}
            </p>
            <p className="text-xs text-slate-400">
              {lang === 'mr' ? 'कृपया दुसरा विभाग निवडा.' : 'Please select another category.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredVideos.map((video) => {
              const title = lang === 'mr' ? video.title : video.titleEn || video.title;
              const description = lang === 'mr' ? video.description : video.descriptionEn || video.description;
              const categoryLabel = getCategoryLabel(video.category, lang);
              const isYt = isYouTubeUrl(video.videoUrl);
              const resolvedThumb =
                video.thumbnailUrl ||
                getYouTubeThumbnail(video.videoUrl) ||
                FALLBACK_THUMB;

              return (
                <Card3D
                  key={video.id}
                  onClick={() => setPlayingVideo(video)}
                  aria-label={`${title} - ${categoryLabel}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-blue-600 hover:shadow-xl transition-all cursor-pointer group"
                >
                  <div>
                    {/* Thumbnail Stage */}
                    <div className="relative aspect-16/10 overflow-hidden bg-slate-900">
                      <img
                        src={resolvedThumb}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          const img = e.currentTarget as HTMLImageElement;
                          if (img.src !== FALLBACK_THUMB) {
                            img.src = FALLBACK_THUMB;
                          }
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent transition-opacity" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="px-2.5 py-1 text-xs font-bold bg-[#061A3C]/90 text-amber-300 rounded-full border border-amber-400/30 backdrop-blur-xs">
                          {categoryLabel}
                        </span>
                      </div>

                      <div className="absolute top-3 right-3 z-10">
                        <span className="px-2.5 py-1 text-[11px] font-mono font-bold bg-black/70 text-white rounded-md backdrop-blur-xs flex items-center gap-1">
                          {isYt ? (
                            <span className="text-red-400">YouTube</span>
                          ) : (
                            <span className="text-blue-300">HD MP4</span>
                          )}
                        </span>
                      </div>

                      {/* Centered Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-[#061A3C]/90 text-amber-400 flex items-center justify-center border-2 border-amber-400/80 shadow-2xl transform group-hover:scale-110 group-hover:bg-[#0868C9] group-hover:text-white group-hover:border-white transition-all duration-300">
                          <Play className="w-6 h-6 fill-current translate-x-0.5" />
                        </div>
                      </div>

                      {/* Video Tagline / Date on Bottom */}
                      {video.date && (
                        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 text-xs text-slate-300 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>{video.date}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-2">
                      <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                        {title}
                      </h3>

                      {description && (
                        <p className="text-xs sm:text-sm text-slate-500 font-sans leading-relaxed line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Button */}
                  <div className="p-5 pt-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlayingVideo(video);
                      }}
                      className="w-full py-2.5 px-4 bg-slate-50 hover:bg-[#061A3C] text-[#061A3C] hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-[#061A3C] inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Play className="w-3.5 h-3.5 fill-current text-amber-500 group-hover:text-amber-300" />
                      <span>{lang === 'mr' ? 'व्हिडिओ पाहा' : 'Watch Video'}</span>
                    </button>
                  </div>
                </Card3D>
              );
            })}
          </div>
        )}

        {/* Cross-Link Banner to Photo Gallery */}
        <section className="bg-gradient-to-r from-blue-900 to-[#061A3C] rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border border-blue-800/50">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Images className="w-4 h-4" />
              <span>{lang === 'mr' ? 'छायाचित्र संग्रह' : 'Photo Collection'}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
              {lang === 'mr'
                ? 'संस्थेचे समृद्ध छायाचित्र दालन व अल्बम्स पाहा'
                : 'Explore Institutional Photo Gallery & Thematic Albums'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 font-sans max-w-2xl leading-relaxed">
              {lang === 'mr'
                ? 'शिक्षण, आरोग्य, पर्यावरण आणि महिला सक्षमीकरणाच्या क्षेत्रीय उपक्रमांची उच्च दर्जाची छायाचित्रे.'
                : 'High-resolution photo coverage of grassroots development, community camps, and social initiatives.'}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('gallery')}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
          >
            <span>{lang === 'mr' ? 'छायाचित्रे पाहा' : 'View Photos'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </main>

      {/* Video Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'mr' ? 'व्हिडिओ दर्शक' : 'Video Player'}
          onClick={handleCloseModal}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-[#061A3C] text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2.5 truncate pr-3">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0">
                  {getCategoryLabel(playingVideo.category, lang)}
                </span>
                <span className="text-xs sm:text-sm font-serif font-bold text-white truncate">
                  {lang === 'mr' ? playingVideo.title : playingVideo.titleEn || playingVideo.title}
                </span>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
                aria-label={lang === 'mr' ? 'बंद करा' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Stage */}
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {isYouTubeUrl(playingVideo.videoUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(playingVideo.videoUrl, true) || ''}
                  title={playingVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <>
                  <video
                    key={playingVideo.videoUrl || playingVideo.id}
                    src={playingVideo.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    onLoadedData={() => setIsVideoLoading(false)}
                    onCanPlay={() => setIsVideoLoading(false)}
                    onError={() => {
                      setIsVideoLoading(false);
                      setVideoError(true);
                    }}
                    className={`w-full h-full ${videoError ? 'hidden' : 'block'}`}
                  />

                  {isVideoLoading && !videoError && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center space-y-2 pointer-events-none z-10">
                      <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                      <span className="text-xs text-white/90 font-sans">
                        {lang === 'mr' ? 'व्हिडिओ लोड होत आहे...' : 'Loading video stream...'}
                      </span>
                    </div>
                  )}

                  {videoError && (
                    <div className="absolute inset-0 bg-slate-950 p-6 flex flex-col items-center justify-center text-center space-y-3 z-10 animate-in fade-in duration-200">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <p className="text-sm font-semibold text-white font-serif">
                          {lang === 'mr' ? 'व्हिडिओ लोड करताना त्रुटी आली' : 'Unable to load video stream'}
                        </p>
                        <p className="text-xs text-slate-300 font-sans leading-relaxed">
                          {lang === 'mr'
                            ? 'व्हिडिओ स्त्रोत अनुपलब्ध, प्रतिबंधित किंवा फॉरमॅट असमर्थित असू शकतो.'
                            : 'The video stream may be unavailable, restricted, or in an unsupported format.'}
                        </p>
                      </div>
                      {playingVideo.videoUrl && isValidHttpUrl(playingVideo.videoUrl) && (
                        <a
                          href={playingVideo.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? 'थेट लिंक उघडा' : 'Open Video Link'}</span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Video Details in Modal Footer */}
            {playingVideo.description && (
              <div className="p-4 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 font-sans leading-relaxed">
                {lang === 'mr'
                  ? playingVideo.description
                  : playingVideo.descriptionEn || playingVideo.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
