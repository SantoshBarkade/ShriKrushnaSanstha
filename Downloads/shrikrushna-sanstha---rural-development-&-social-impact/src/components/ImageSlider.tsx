import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Images } from 'lucide-react';

interface ImageSliderProps {
  images: string[];
  alt?: string;
  heightClass?: string;
  showThumbnails?: boolean;
  roundedClass?: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  alt = '',
  heightClass = 'h-56 sm:h-64',
  showThumbnails = false,
  roundedClass = '',
}) => {
  const validImages = Array.from(new Set(images.filter((url) => Boolean(url && url.trim()))));
  const [currentIndex, setCurrentIndex] = useState(0);

  if (validImages.length === 0) return null;

  const safeIndex = currentIndex >= validImages.length ? 0 : currentIndex;
  const hasMultiple = validImages.length > 1;

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? validImages.length - 1 : prev - 1));
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === validImages.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="w-full select-none">
      <div className={`relative w-full ${heightClass} ${roundedClass} bg-slate-100 overflow-hidden group`}>
        <img
          src={validImages[safeIndex]}
          alt={alt}
          className="w-full h-full object-cover transition-all duration-300"
          loading="lazy"
        />

        {hasMultiple && (
          <>
            {/* Slide Counter Badge */}
            <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold rounded-full flex items-center gap-1.5 shadow-sm z-10 border border-white/10">
              <Images className="w-3 h-3 text-amber-400" />
              <span>
                {safeIndex + 1} / {validImages.length}
              </span>
            </div>

            {/* Left / Right Slide Arrows */}
            <button
              type="button"
              onClick={prevSlide}
              aria-label="Previous Slide"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-[#061A3C] focus:ring-2 focus:ring-white text-white flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={nextSlide}
              aria-label="Next Slide"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-[#061A3C] focus:ring-2 focus:ring-white text-white flex items-center justify-center shadow-md transition-all cursor-pointer z-10"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Bottom Dot Indicators */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-xs z-10">
              {validImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  aria-label={`Slide ${idx + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex ? 'w-4 bg-amber-400' : 'w-1.5 bg-white/75 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Interactive Thumbnail Strip */}
      {hasMultiple && showThumbnails && (
        <div className="flex items-center gap-2 pt-2.5 overflow-x-auto no-scrollbar">
          {validImages.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                idx === safeIndex
                  ? 'border-[#0868C9] ring-2 ring-[#0868C9]/40 opacity-100'
                  : 'border-slate-200 opacity-70 hover:opacity-100'
              }`}
            >
              <img src={imgUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
