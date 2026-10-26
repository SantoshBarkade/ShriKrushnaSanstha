import React, { useEffect, useCallback } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { getCategoryLabel } from '../utils/i18n';
import { X, ChevronLeft, ChevronRight, Calendar, Tag, ExternalLink } from 'lucide-react';

export const LightboxModal: React.FC = () => {
  const { selectedGalleryImage, setSelectedGalleryImage, state, lang, setCurrentRoute, setSelectedInitiativeId } = useSanstha();

  const publishedImages = state.gallery.filter((g) => g.published);
  const currentIndex = selectedGalleryImage
    ? publishedImages.findIndex((img) => img.id === selectedGalleryImage.id)
    : -1;

  const handleNext = useCallback(() => {
    if (publishedImages.length === 0) return;
    if (currentIndex >= 0 && currentIndex < publishedImages.length - 1) {
      setSelectedGalleryImage(publishedImages[currentIndex + 1]);
    } else {
      setSelectedGalleryImage(publishedImages[0]);
    }
  }, [currentIndex, publishedImages, setSelectedGalleryImage]);

  const handlePrev = useCallback(() => {
    if (publishedImages.length === 0) return;
    if (currentIndex > 0) {
      setSelectedGalleryImage(publishedImages[currentIndex - 1]);
    } else {
      setSelectedGalleryImage(publishedImages[publishedImages.length - 1]);
    }
  }, [currentIndex, publishedImages, setSelectedGalleryImage]);

  // Keyboard navigation: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedGalleryImage) return;
      if (e.key === 'Escape') {
        setSelectedGalleryImage(null);
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGalleryImage, handleNext, handlePrev, setSelectedGalleryImage]);

  if (!selectedGalleryImage) return null;

  const title = lang === 'mr'
    ? selectedGalleryImage.title
    : selectedGalleryImage.titleEn || selectedGalleryImage.title;

  const caption = lang === 'mr'
    ? selectedGalleryImage.caption
    : selectedGalleryImage.captionEn || selectedGalleryImage.caption;

  const categoryLabel = getCategoryLabel(selectedGalleryImage.category, lang);

  // Link to associated initiative if present
  const relatedInitiative = selectedGalleryImage.activityId
    ? state.initiatives.find((i) => i.id === selectedGalleryImage.activityId)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 select-none animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={lang === 'mr' ? 'छायाचित्र दर्शक' : 'Photo Viewer'}
      onClick={() => setSelectedGalleryImage(null)}
    >
      {/* Top Bar */}
      <div
        className="flex items-center justify-between text-white max-w-6xl mx-auto w-full pb-3 border-b border-white/10 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold">
            <Tag className="w-3 h-3" />
            {categoryLabel}
          </span>
          <span className="text-xs font-mono text-slate-300 bg-white/10 px-2.5 py-1 rounded-full">
            {currentIndex + 1} / {publishedImages.length}
          </span>
          {selectedGalleryImage.year && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {selectedGalleryImage.year}
            </span>
          )}
        </div>

        <button
          onClick={() => setSelectedGalleryImage(null)}
          className="p-2 sm:p-2.5 text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer border border-white/10"
          aria-label={lang === 'mr' ? 'बंद करा' : 'Close'}
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Main Viewport with Prev/Next Controls */}
      <div
        className="relative flex-1 flex items-center justify-center max-w-6xl mx-auto w-full py-2 sm:py-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {publishedImages.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute left-1 sm:left-4 z-20 p-2.5 sm:p-3.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition-all cursor-pointer border border-white/15 shadow-xl hover:scale-105 active:scale-95"
            aria-label={lang === 'mr' ? 'मागील छायाचित्र' : 'Previous Photo'}
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        <div className="max-h-[68vh] sm:max-h-[74vh] flex items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black/60 shadow-2xl">
          <img
            src={selectedGalleryImage.imageUrl}
            alt={title}
            className="max-h-[68vh] sm:max-h-[74vh] max-w-full w-auto object-contain select-none transition-transform duration-200"
            loading="eager"
          />
        </div>

        {publishedImages.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute right-1 sm:right-4 z-20 p-2.5 sm:p-3.5 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full transition-all cursor-pointer border border-white/15 shadow-xl hover:scale-105 active:scale-95"
            aria-label={lang === 'mr' ? 'पुढील छायाचित्र' : 'Next Photo'}
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}
      </div>

      {/* Bottom Caption Bar */}
      <div
        className="max-w-6xl mx-auto w-full pt-3 pb-2 px-4 sm:px-6 bg-slate-900/85 backdrop-blur-md rounded-2xl border border-white/10 shrink-0 text-white space-y-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 className="font-serif font-bold text-base sm:text-lg text-amber-400 leading-snug">
            {title}
          </h3>
          {relatedInitiative && (
            <button
              onClick={() => {
                setSelectedGalleryImage(null);
                setSelectedInitiativeId(relatedInitiative.id);
                setCurrentRoute('initiatives');
              }}
              className="inline-flex items-center gap-1.5 text-xs text-blue-300 hover:text-white bg-blue-900/40 hover:bg-blue-800/60 px-3 py-1 rounded-lg border border-blue-400/30 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>
                {lang === 'mr' ? 'संबंधित उपक्रम पाहा' : 'View Related Initiative'}
              </span>
            </button>
          )}
        </div>
        {caption && (
          <p className="text-xs sm:text-sm text-slate-300 font-sans leading-relaxed max-w-4xl">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};
