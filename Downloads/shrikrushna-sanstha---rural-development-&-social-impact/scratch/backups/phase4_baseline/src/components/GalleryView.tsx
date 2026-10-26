import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { CategoryKey, GalleryAlbumItem, GalleryItem } from '../types';
import { getCategoryLabel } from '../utils/i18n';
import {
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Folder,
  Images,
  Grid,
  Sliders,
  ArrowLeft,
  Play,
  Pause,
  Video,
  ShieldCheck,
  Award,
  Calendar,
  Tag,
  Sparkles
} from 'lucide-react';

import { Card3D } from './Card3D';

export const GalleryView: React.FC = () => {
  const { state, setCurrentRoute, setSelectedGalleryImage, lang, t } = useSanstha();

  // Navigation mode: 'albums' | 'all'
  const [viewMode, setViewMode] = useState<'albums' | 'all'>('albums');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('सर्व');

  // Carousel-specific state for active album
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [albumDisplayOverride, setAlbumDisplayOverride] = useState<'grid' | 'carousel' | null>(null);

  const categories: CategoryKey[] = [
    'सर्व',
    'शिक्षण',
    'शासकीय योजना जनजागृती',
    'आरोग्यविषयक उपक्रम',
    'पर्यावरण संवर्धन',
    'महिला व ज्येष्ठ नागरिक सहाय्य',
    'सामाजिक कल्याण',
  ];

  const publishedAlbums = state.albums
    .filter((a) => a.published)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const publishedAlbumIdSet = new Set(publishedAlbums.map((a) => a.id));
  const publishedPhotos = state.gallery.filter(
    (g) => g.published && (!g.albumId || publishedAlbumIdSet.has(g.albumId) || true)
  );

  // Helper to match photos to album (supports direct albumId and fallback category/initiative association)
  const getAlbumPhotos = useCallback(
    (album: GalleryAlbumItem) => {
      return publishedPhotos
        .filter(
          (p) =>
            p.albumId === album.id ||
            (!p.albumId &&
              ((album.id === 'alb-1' && (p.category === 'शिक्षण' || p.activityId === 'init-1')) ||
                (album.id === 'alb-2' &&
                  (p.category === 'आरोग्यविषयक उपक्रम' ||
                    p.activityId === 'init-4')) ||
                (album.id === 'alb-3' &&
                  (p.category === 'पर्यावरण संवर्धन' || p.activityId === 'init-5')) ||
                (album.id === 'alb-4' &&
                  (p.category === 'महिला व ज्येष्ठ नागरिक सहाय्य' ||
                    p.activityId === 'init-6'))))
        )
        .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    },
    [publishedPhotos]
  );

  // Find currently selected album if any
  const currentAlbum = selectedAlbumId
    ? publishedAlbums.find((a) => a.id === selectedAlbumId) || null
    : null;

  // Photos belonging to the currently selected album
  const currentAlbumPhotos = currentAlbum ? getAlbumPhotos(currentAlbum) : [];

  // Effective display mode for the current album (album default or user toggle)
  const effectiveDisplayMode = albumDisplayOverride || currentAlbum?.displayMode || 'grid';

  // Autoplay for carousel
  useEffect(() => {
    if (!isAutoPlaying || effectiveDisplayMode !== 'carousel' || currentAlbumPhotos.length <= 1) {
      return;
    }
    const timer = setInterval(() => {
      setActiveSlideIndex((prev) => (prev + 1) % currentAlbumPhotos.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isAutoPlaying, effectiveDisplayMode, currentAlbumPhotos.length]);

  // Reset slide index and override when switching albums
  const handleSelectAlbum = (albumId: string) => {
    setSelectedAlbumId(albumId);
    setActiveSlideIndex(0);
    setIsAutoPlaying(false);
    setAlbumDisplayOverride(null);
  };

  // Filtered albums for albums list
  const filteredAlbums =
    activeCategory === 'सर्व'
      ? publishedAlbums
      : publishedAlbums.filter(
          (a) =>
            a.category === activeCategory ||
            (activeCategory === 'आरोग्यविषयक उपक्रम' && (a.category as string) === 'आरोग्य') ||
            (activeCategory === 'महिला व ज्येष्ठ नागरिक सहाय्य' && (a.category as string) === 'महिला सक्षमीकरण')
        );

  // Filtered photos for 'all' mode
  const filteredAllPhotos =
    activeCategory === 'सर्व'
      ? publishedPhotos
      : publishedPhotos.filter((img) => img.category === activeCategory);

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
            <button
              onClick={() => {
                setSelectedAlbumId(null);
                setViewMode('albums');
              }}
              className={`hover:text-amber-300 transition-colors cursor-pointer ${
                !currentAlbum ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              {t.nav.gallery}
            </button>
            {currentAlbum && (
              <>
                <span className="text-slate-500">/</span>
                <span className="text-amber-400 font-semibold truncate max-w-xs">
                  {lang === 'mr' ? currentAlbum.title : currentAlbum.titleEn || currentAlbum.title}
                </span>
              </>
            )}
          </nav>

          {/* Institutional Trust Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Images className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'अधिकृत छायाचित्र दालन' : 'Official Photo Archive'}</span>
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

          {/* Heading and Primary View Switcher */}
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-3xl space-y-2">
              <p className="text-amber-400/90 font-serif text-sm tracking-wide">
                ॥ सेवेची पावले, परिवर्तनाची दिशा ॥
              </p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-normal leading-tight">
                {lang === 'mr' ? 'छायाचित्र दालन' : 'Institutional Photo Gallery'}
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-sans leading-relaxed">
                {lang === 'mr'
                  ? 'संस्थेच्या विविध उपक्रमांची, शैक्षणिक प्रकल्पांची, आरोग्य शिबिरांची व ग्रामविकास कार्याची क्षणचित्रे.'
                  : 'Documenting the social impact, rural education, health diagnostics, and tree plantation drives through vivid photographs.'}
              </p>
            </div>

            {/* View Switcher: Albums vs All Photos */}
            {!currentAlbum && (
              <div className="inline-flex items-center p-1.5 bg-slate-900/80 rounded-2xl border border-slate-700 shrink-0 self-start lg:self-auto shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewMode('albums')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    viewMode === 'albums'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Folder className="w-4 h-4" />
                  <span>{lang === 'mr' ? 'अल्बमनुसार' : 'By Albums'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      viewMode === 'albums' ? 'bg-slate-950 text-amber-400' : 'bg-white/15 text-slate-300'
                    }`}
                  >
                    {publishedAlbums.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    viewMode === 'all'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Images className="w-4 h-4" />
                  <span>{lang === 'mr' ? 'सर्व छायाचित्रे' : 'All Photos'}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      viewMode === 'all' ? 'bg-slate-950 text-amber-400' : 'bg-white/15 text-slate-300'
                    }`}
                  >
                    {publishedPhotos.length}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* =========================================================================
            VIEW 1: SPECIFIC ALBUM VIEW (Grid or Carousel)
            ========================================================================= */}
        {currentAlbum ? (
          <div className="space-y-6">
            {/* Back & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedAlbumId(null);
                  setAlbumDisplayOverride(null);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto shadow-xs"
              >
                <ArrowLeft className="w-4 h-4 text-amber-500" />
                <span>{lang === 'mr' ? 'सर्व अल्बम्सकडे परत' : 'Back to All Albums'}</span>
              </button>

              {/* Display Mode Toggle for this Album */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                  {lang === 'mr' ? 'प्रदर्शन प्रकार:' : 'Display Mode:'}
                </span>
                <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAlbumDisplayOverride('grid')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      effectiveDisplayMode === 'grid'
                        ? 'bg-[#061A3C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Grid className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'ग्रिड' : 'Grid'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlbumDisplayOverride('carousel')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      effectiveDisplayMode === 'carousel'
                        ? 'bg-[#061A3C] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'कॅरोसेल' : 'Carousel'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Album Information Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 text-xs font-bold bg-[#061A3C] text-amber-300 rounded-full border border-amber-400/30">
                  {getCategoryLabel(currentAlbum.category as CategoryKey, lang)}
                </span>
                <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full flex items-center gap-1 border border-blue-200">
                  <Images className="w-3 h-3 text-blue-600" />
                  <span>
                    {currentAlbumPhotos.length} {lang === 'mr' ? 'छायाचित्रे' : 'photos'}
                  </span>
                </span>
                <span className="px-2.5 py-1 text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200 rounded-full">
                  {effectiveDisplayMode === 'carousel'
                    ? lang === 'mr'
                      ? 'कॅरोसेल मोड'
                      : 'Carousel Mode'
                    : lang === 'mr'
                    ? 'ग्रिड मोड'
                    : 'Grid Mode'}
                </span>
                {currentAlbum.eventDate && (
                  <span className="px-2.5 py-1 text-xs font-medium text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{currentAlbum.eventDate}</span>
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-slate-900">
                {lang === 'mr' ? currentAlbum.title : currentAlbum.titleEn || currentAlbum.title}
              </h2>

              {(currentAlbum.description || currentAlbum.descriptionEn) && (
                <p className="text-sm text-slate-600 font-sans leading-relaxed pt-1 max-w-4xl">
                  {lang === 'mr'
                    ? currentAlbum.description
                    : currentAlbum.descriptionEn || currentAlbum.description}
                </p>
              )}
            </div>

            {/* Photos Content: Carousel vs Grid */}
            {currentAlbumPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <Images className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">
                  {lang === 'mr'
                    ? 'या अल्बममध्ये अद्याप छायाचित्रे उपलब्ध नाहीत.'
                    : 'No photographs available in this album yet.'}
                </p>
              </div>
            ) : effectiveDisplayMode === 'carousel' ? (
              /* ==========================================================
                 ALBUM CAROUSEL VIEW
                 ========================================================== */
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 space-y-4 shadow-md">
                {(() => {
                  const safeIdx =
                    activeSlideIndex >= currentAlbumPhotos.length ? 0 : activeSlideIndex;
                  const activePhoto = currentAlbumPhotos[safeIdx];
                  const pTitle =
                    lang === 'mr' ? activePhoto.title : activePhoto.titleEn || activePhoto.title;
                  const pCaption =
                    lang === 'mr'
                      ? activePhoto.caption
                      : activePhoto.captionEn || activePhoto.caption;

                  return (
                    <div className="space-y-4">
                      {/* Main Slide Stage */}
                      <div className="relative aspect-16/10 sm:aspect-16/9 w-full bg-slate-950 rounded-2xl overflow-hidden group select-none shadow-inner">
                        <img
                          src={activePhoto.imageUrl}
                          alt={pTitle}
                          className="w-full h-full object-contain transition-opacity duration-300"
                          loading="eager"
                        />

                        {/* Top Badges */}
                        <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                          <span className="px-3 py-1 bg-[#061A3C]/90 backdrop-blur-xs text-amber-300 text-xs font-bold rounded-full border border-amber-400/30">
                            {getCategoryLabel(activePhoto.category, lang)}
                          </span>
                        </div>

                        {/* Slide Counter & Lightbox Button */}
                        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                          <span className="px-3 py-1 bg-black/70 backdrop-blur-xs text-white text-xs font-mono font-bold rounded-full flex items-center gap-1.5 border border-white/10">
                            <Images className="w-3.5 h-3.5 text-amber-400" />
                            <span>
                              {safeIdx + 1} / {currentAlbumPhotos.length}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedGalleryImage(activePhoto)}
                            aria-label="Fullscreen"
                            className="p-2 bg-black/70 hover:bg-blue-600 text-white rounded-full transition-colors cursor-pointer shadow-md border border-white/10"
                          >
                            <Maximize2 className="w-4 h-4 text-white" />
                          </button>
                        </div>

                        {/* Previous Slide Button */}
                        {currentAlbumPhotos.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlideIndex((prev) =>
                                prev === 0 ? currentAlbumPhotos.length - 1 : prev - 1
                              )
                            }
                            aria-label="Previous Slide"
                            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-slate-900/75 hover:bg-[#061A3C] text-white rounded-full transition-all cursor-pointer shadow-lg z-10 border border-white/15 hover:scale-105"
                          >
                            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                          </button>
                        )}

                        {/* Next Slide Button */}
                        {currentAlbumPhotos.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setActiveSlideIndex((prev) =>
                                prev === currentAlbumPhotos.length - 1 ? 0 : prev + 1
                              )
                            }
                            aria-label="Next Slide"
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-slate-900/75 hover:bg-[#061A3C] text-white rounded-full transition-all cursor-pointer shadow-lg z-10 border border-white/15 hover:scale-105"
                          >
                            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
                          </button>
                        )}

                        {/* Autoplay & Play/Pause Button */}
                        {currentAlbumPhotos.length > 1 && (
                          <div className="absolute bottom-4 right-4 z-10">
                            <button
                              type="button"
                              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full text-xs font-semibold transition-colors cursor-pointer backdrop-blur-xs border border-white/10"
                            >
                              {isAutoPlaying ? (
                                <>
                                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{lang === 'mr' ? 'थांबवा' : 'Pause'}</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-3.5 h-3.5 text-amber-400" />
                                  <span>{lang === 'mr' ? 'स्वयं-चालन' : 'Autoplay'}</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Active Slide Caption Card */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                        <div>
                          <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900">
                            {pTitle}
                          </h3>
                          {pCaption && (
                            <p className="text-xs sm:text-sm text-slate-600 font-sans mt-0.5 leading-relaxed">
                              {pCaption}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedGalleryImage(activePhoto)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#061A3C] text-white hover:bg-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 self-start sm:self-auto shadow-xs"
                        >
                          <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{lang === 'mr' ? 'मोठे छायाचित्र पाहा' : 'View Fullsize'}</span>
                        </button>
                      </div>

                      {/* Interactive Thumbnail Strip */}
                      {currentAlbumPhotos.length > 1 && (
                        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2">
                          {currentAlbumPhotos.map((photo, idx) => (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => {
                                setActiveSlideIndex(idx);
                                setIsAutoPlaying(false);
                              }}
                              className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                idx === safeIdx
                                  ? 'border-[#061A3C] ring-2 ring-amber-400 scale-105 opacity-100'
                                  : 'border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={photo.imageUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                              <div className="absolute bottom-1 right-1 px-1 bg-black/70 rounded text-[9px] text-white font-mono font-bold">
                                {idx + 1}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ) : (
              /* ==========================================================
                 ALBUM GRID VIEW
                 ========================================================== */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {currentAlbumPhotos.map((img, idx) => {
                  const title = lang === 'mr' ? img.title : img.titleEn || img.title;
                  const caption = lang === 'mr' ? img.caption : img.captionEn || img.caption;
                  const categoryLabel = getCategoryLabel(img.category, lang);

                  return (
                    <Card3D
                      key={img.id}
                      onClick={() => setSelectedGalleryImage(img)}
                      aria-label={`${title} - ${categoryLabel}`}
                      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-blue-600 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                        <img
                          src={img.imageUrl}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-3 bg-white/95 rounded-full text-[#061A3C] shadow-lg transform group-hover:scale-110 transition-transform">
                            <Maximize2 className="w-4 h-4" />
                          </span>
                        </div>
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 text-xs font-bold bg-[#061A3C]/90 text-amber-300 rounded-full border border-amber-400/30 backdrop-blur-xs">
                            {categoryLabel}
                          </span>
                        </div>
                        <div className="absolute bottom-3 right-3">
                          <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-black/70 text-white rounded-md backdrop-blur-xs">
                            #{idx + 1}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-1.5">
                        <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-1">
                          {title}
                        </h3>
                        {caption && (
                          <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-2">
                            {caption}
                          </p>
                        )}
                      </div>
                    </Card3D>
                  );
                })}
              </div>
            )}
          </div>
        ) : viewMode === 'albums' ? (
          /* =========================================================================
              VIEW 2: ALBUMS LIST DIRECTORY
              ========================================================================= */
          <div className="space-y-8">
            {/* Category Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => {
                const count =
                  cat === 'सर्व'
                    ? publishedAlbums.length
                    : publishedAlbums.filter(
                        (a) =>
                          a.category === cat ||
                          (cat === 'आरोग्यविषयक उपक्रम' && (a.category as string) === 'आरोग्य') ||
                          (cat === 'महिला व ज्येष्ठ नागरिक सहाय्य' && (a.category as string) === 'महिला सक्षमीकरण')
                      ).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 border ${
                      activeCategory === cat
                        ? 'bg-[#061A3C] text-white border-[#061A3C] shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{getCategoryLabel(cat, lang)}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                        activeCategory === cat
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

            {/* Albums Directory Grid */}
            {filteredAlbums.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <Folder className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">
                  {lang === 'mr'
                    ? 'या विभागात कोणतेही अल्बम उपलब्ध नाहीत.'
                    : 'No albums found in this category.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {filteredAlbums.map((album) => {
                  const title = lang === 'mr' ? album.title : album.titleEn || album.title;
                  const desc =
                    lang === 'mr' ? album.description : album.descriptionEn || album.description;
                  const albumPhotos = getAlbumPhotos(album);
                  const cover =
                    album.coverImageUrl ||
                    (albumPhotos.length > 0 ? albumPhotos[0].imageUrl : '');

                  return (
                    <Card3D
                      key={album.id}
                      onClick={() => handleSelectAlbum(album.id)}
                      aria-label={`${title} - ${album.category}`}
                      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-blue-600 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-16/10 overflow-hidden bg-slate-900 flex items-center justify-center">
                        {cover ? (
                          <img
                            src={cover}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                            <Folder className="w-12 h-12 mb-2 stroke-[1.5]" />
                            <span className="text-xs font-semibold">{title}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Category & Display Mode Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className="px-3 py-1 text-xs font-bold bg-[#061A3C]/90 text-amber-300 rounded-full border border-amber-400/30 backdrop-blur-xs">
                            {getCategoryLabel(album.category as CategoryKey, lang)}
                          </span>
                        </div>

                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 text-[11px] font-bold bg-black/70 backdrop-blur-xs text-white rounded-full flex items-center gap-1 border border-white/10">
                            {album.displayMode === 'carousel' ? (
                              <>
                                <Sliders className="w-3 h-3 text-amber-400" />
                                <span>{lang === 'mr' ? 'कॅरोसेल' : 'Carousel'}</span>
                              </>
                            ) : (
                              <>
                                <Grid className="w-3 h-3 text-amber-400" />
                                <span>{lang === 'mr' ? 'ग्रिड' : 'Grid'}</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Photo Count on Cover */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-bold">
                          <Images className="w-4 h-4 text-amber-400" />
                          <span>
                            {albumPhotos.length} {lang === 'mr' ? 'छायाचित्रे' : 'Photos'}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-serif font-bold text-lg text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-2">
                            {title}
                          </h3>
                          {desc && (
                            <p className="text-xs text-slate-500 font-sans mt-1 leading-relaxed line-clamp-2">
                              {desc}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#061A3C] group-hover:text-blue-700 transition-colors">
                          <span>{lang === 'mr' ? 'अल्बम उघडा' : 'View Album'}</span>
                          <ChevronRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Card3D>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
              VIEW 3: ALL INDIVIDUAL PHOTOS GRID
              ========================================================================= */
          <div className="space-y-8">
            {/* Category Filter Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => {
                const count =
                  cat === 'सर्व'
                    ? publishedPhotos.length
                    : publishedPhotos.filter((p) => p.category === cat).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 border ${
                      activeCategory === cat
                        ? 'bg-[#061A3C] text-white border-[#061A3C] shadow-md'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span>{getCategoryLabel(cat, lang)}</span>
                    <span
                      className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full ${
                        activeCategory === cat
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

            {/* All Photos Grid */}
            {filteredAllPhotos.length === 0 ? (
              <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
                <p className="text-sm font-semibold text-slate-600">
                  {lang === 'mr'
                    ? 'या विभागात छायाचित्रे उपलब्ध नाहीत.'
                    : 'No photos found in this category.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                {filteredAllPhotos.map((img) => {
                  const title = lang === 'mr' ? img.title : img.titleEn || img.title;
                  const caption = lang === 'mr' ? img.caption : img.captionEn || img.caption;
                  const categoryLabel = getCategoryLabel(img.category, lang);

                  return (
                    <Card3D
                      key={img.id}
                      onClick={() => setSelectedGalleryImage(img)}
                      aria-label={`${title} - ${categoryLabel}`}
                      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:border-blue-600 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div className="relative aspect-4/3 overflow-hidden bg-slate-100">
                        <img
                          src={img.imageUrl}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="p-3 bg-white/95 rounded-full text-[#061A3C] shadow-lg transform group-hover:scale-110 transition-transform">
                            <Maximize2 className="w-4 h-4" />
                          </span>
                        </div>
                        <div className="absolute top-3 left-3">
                          <span className="px-3 py-1 text-xs font-bold bg-[#061A3C]/90 text-amber-300 rounded-full border border-amber-400/30 backdrop-blur-xs">
                            {categoryLabel}
                          </span>
                        </div>
                        {img.year && (
                          <div className="absolute bottom-3 right-3">
                            <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-black/70 text-white rounded-md backdrop-blur-xs">
                              {img.year}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="p-5 space-y-1.5">
                        <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors leading-snug line-clamp-1">
                          {title}
                        </h3>
                        {caption && (
                          <p className="text-xs text-slate-500 font-sans leading-relaxed line-clamp-2">
                            {caption}
                          </p>
                        )}
                      </div>
                    </Card3D>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Cross-Link Banner to Video Gallery */}
        <section className="bg-gradient-to-r from-[#061A3C] to-blue-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border border-slate-700">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 uppercase tracking-wider">
              <Video className="w-4 h-4" />
              <span>{lang === 'mr' ? 'व्हिडिओ संग्रह' : 'Video Archive'}</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
              {lang === 'mr'
                ? 'संस्थेचे माहितीपट व उपक्रमांचे व्हिडिओ पाहा'
                : 'Watch Community Documentaries & Field Impact Videos'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-sans max-w-2xl leading-relaxed">
              {lang === 'mr'
                ? 'शासकीय योजनांची माहिती, CSC बाल विद्यालय व ग्रामविकास उपक्रमांचे अधिकृत व्हिडिओ चित्रीकरण.'
                : 'Watch high-definition video coverage of school children, tree plantation, and welfare programs.'}
            </p>
          </div>
          <button
            onClick={() => setCurrentRoute('videos')}
            className="inline-flex items-center gap-2 px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer shadow-md shrink-0 self-start sm:self-auto"
          >
            <span>{lang === 'mr' ? 'व्हिडिओ दालन उघडा' : 'Open Video Library'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </section>
      </main>
    </div>
  );
};
