import React from 'react';

interface SansthaLogoProps {
  variant?: 'horizontal' | 'symbol' | 'compact' | 'white' | 'hero-badge';
  lang?: 'mr' | 'en';
  className?: string;
  showRegBadge?: boolean;
}

/**
 * Official Brand Emblem & Logo of
 * श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था
 * SHRIKRUSHNA SANSKRUTIK VA GRAMIN VIKAS SANSTHA
 * Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar, Maharashtra
 * Reg. No.: Ek 14668 (A) | रजि. नं.: एक 14668 (औ)
 * Source of truth: Client's registered official mark.
 */
export const SansthaEmblemSvg: React.FC<{
  size?: number;
  darkBg?: boolean;
  className?: string;
}> = ({ size = 48, darkBg = false, className = '' }) => {
  const redColor = darkBg ? '#FF4D5E' : '#FD2336';
  const blueColor = darkBg ? '#38BDF8' : '#065FB0';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      role="img"
      aria-label="Shrikrushna Sanskrutik va Gramin Vikas Sanstha Official Emblem"
    >
      {/* Red Roof with Chimney */}
      <path
        d="M 17 44 L 17 26 L 27 26 L 27 34 L 50 14 L 83 40 L 73 48 L 50 30 L 26 50 Z"
        fill={redColor}
      />
      {/* Blue Foundation / Lower Chevron */}
      <path
        d="M 17 56 L 50 83 L 83 56 L 83 72 L 50 98 L 17 72 Z"
        fill={blueColor}
      />
      {/* 4 Center Window Panes matching Reference Image 2 */}
      {/* Top Left Window (Blue) */}
      <rect x="40" y="44" width="8" height="8" rx="0.5" fill={blueColor} />
      {/* Bottom Left Window (Dark Charcoal / Black) */}
      <rect x="40" y="55" width="8" height="8" rx="0.5" fill={darkBg ? '#E2E8F0' : '#222222'} />
      {/* Right Windows (Red) */}
      <rect x="52" y="44" width="8" height="8" rx="0.5" fill={redColor} />
      <rect x="52" y="55" width="8" height="8" rx="0.5" fill={redColor} />
    </svg>
  );
};

export const SansthaLogo: React.FC<SansthaLogoProps> = ({
  variant = 'horizontal',
  lang = 'mr',
  className = '',
  showRegBadge = false,
}) => {
  if (variant === 'symbol') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <img
          src="/logo-symbol.png"
          alt="Shrikrushna Sanstha Official Symbol"
          className="h-10 w-auto object-contain"
          onError={(e) => {
            // Fallback to SVG emblem if image fails
            e.currentTarget.style.display = 'none';
          }}
        />
        <SansthaEmblemSvg size={40} className="hidden only:block" />
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div
        className={`w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-xs p-1 ${className}`}
      >
        <SansthaEmblemSvg size={32} />
      </div>
    );
  }

  const isWhite = variant === 'white';
  const titleColor = isWhite ? 'text-white' : 'text-[#065096]';
  const subtitleColor = isWhite ? 'text-slate-300' : 'text-[#475569]';
  const titleSize = isWhite
    ? 'text-base sm:text-lg xl:text-[19px]'
    : showRegBadge
    ? 'text-base sm:text-xl md:text-2xl'
    : 'text-[11.5px] sm:text-[15px] xl:text-[17px]';

  return (
    <div className={`inline-flex items-center gap-3 select-none max-w-full ${className}`}>
      <div className="shrink-0 flex items-center justify-center">
        {isWhite ? (
          <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-md">
            <SansthaEmblemSvg size={46} darkBg />
          </div>
        ) : (
          <SansthaEmblemSvg size={showRegBadge ? 54 : 36} className="sm:w-[44px] sm:h-[44px]" />
        )}
      </div>

      <div className="flex flex-col justify-center min-w-0">
        {lang === 'mr' ? (
          <>
            <span
              className={`font-serif font-bold leading-tight tracking-tight ${titleColor} ${titleSize}`}
            >
              श्रीकृष्ण सांस्कृतिक व
            </span>
            <span
              className={`font-serif font-bold leading-tight tracking-tight ${titleColor} ${titleSize}`}
            >
              ग्रामीण विकास संस्था
            </span>
            <span
              className={`font-sans font-medium leading-snug truncate ${subtitleColor} ${
                showRegBadge ? 'text-xs sm:text-sm mt-1' : isWhite ? 'text-xs mt-1' : 'hidden sm:block text-[10px] sm:text-[11px] mt-0.5'
              }`}
            >
              नादपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर, महाराष्ट्र
            </span>
            {showRegBadge && (
              <div className="mt-1.5 inline-flex items-center self-start px-2.5 py-0.5 rounded-md bg-[#065096] text-white text-[11px] font-semibold shadow-2xs">
                रजि. नं.: एक 14668 (औ)
              </div>
            )}
          </>
        ) : (
          <>
            <span
              className={`font-serif font-bold leading-tight uppercase tracking-tight ${titleColor} ${
                isWhite
                  ? 'text-xs sm:text-sm xl:text-[15px]'
                  : showRegBadge
                  ? 'text-sm sm:text-lg md:text-xl'
                  : 'text-[10px] sm:text-sm xl:text-[14.5px]'
              }`}
            >
              SHRIKRUSHNA SANSKRUTIK VA
            </span>
            <span
              className={`font-serif font-bold leading-tight uppercase tracking-tight ${titleColor} ${
                isWhite
                  ? 'text-xs sm:text-sm xl:text-[15px]'
                  : showRegBadge
                  ? 'text-sm sm:text-lg md:text-xl'
                  : 'text-[10px] sm:text-sm xl:text-[14.5px]'
              }`}
            >
              GRAMIN VIKAS SANSTHA
            </span>
            <span
              className={`font-sans font-medium leading-snug truncate ${subtitleColor} ${
                showRegBadge ? 'text-[11px] sm:text-xs mt-1' : isWhite ? 'text-xs mt-1' : 'hidden sm:block text-[9.5px] sm:text-[10.5px] mt-0.5'
              }`}
            >
              Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar, Maharashtra
            </span>
            {showRegBadge && (
              <div className="mt-1.5 inline-flex items-center self-start px-2.5 py-0.5 rounded-md bg-[#065096] text-white text-[11px] font-semibold shadow-2xs">
                Reg. No.: Ek 14668 (A)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
