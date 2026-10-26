import React, { useRef, useCallback } from 'react';

export interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
  maxTilt?: number;
}

/**
 * High-performance 3D Tilt Card wrapper
 * Uses direct DOM style mutation inside requestAnimationFrame to eliminate React re-renders during mouse movement.
 * Completely disables on touch devices and respects prefers-reduced-motion.
 */
export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  onClick,
  'aria-label': ariaLabel,
  maxTilt = 2.5,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (
        e.pointerType === 'touch' ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
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

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
        glare.style.opacity = '0.12';
        glare.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`;
      });
    },
    [maxTilt]
  );

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

export default Card3D;
