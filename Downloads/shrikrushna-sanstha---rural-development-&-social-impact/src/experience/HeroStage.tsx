import React, { Suspense, lazy, useState, useEffect } from 'react';
import { LandscapeFallback } from './LandscapeFallback';
import { useIsMobile, usePrefersReducedMotion, useWebGLSupport } from './hooks';

const MaharashtraCanvas = lazy(() => import('./MaharashtraCanvas'));

export const HeroStage: React.FC<{ inView?: boolean }> = ({ inView = true }) => {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const webgl = useWebGLSupport();
  const [failed, setFailed] = useState(false);
  const [canLoad3D, setCanLoad3D] = useState(false);

  useEffect(() => {
    if (reducedMotion || isMobile || !webgl) return;

    let idleId: number | undefined;
    let timerId: ReturnType<typeof setTimeout> | undefined;
    let scrollTimer: ReturnType<typeof setTimeout> | undefined;
    let isCancelled = false;

    const scheduleLoad = () => {
      if (isCancelled) return;
      setCanLoad3D(true);
    };

    const win = typeof window !== 'undefined' ? (window as any) : null;

    // Defer 3D compilation if the user is actively scrolling through the hero
    const handleScroll = () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!isCancelled && window.scrollY < (window.innerHeight || 800) * 1.5) {
          scheduleLoad();
        }
      }, 350);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    if (win && 'requestIdleCallback' in win) {
      idleId = win.requestIdleCallback(scheduleLoad, { timeout: 3500 });
    } else {
      timerId = setTimeout(scheduleLoad, 2000);
    }

    return () => {
      isCancelled = true;
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) clearTimeout(scrollTimer);
      if (idleId !== undefined && win && 'cancelIdleCallback' in win) {
        win.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) {
        clearTimeout(timerId);
      }
    };
  }, [reducedMotion, isMobile, webgl]);

  const use3D = webgl && !failed && !isMobile && !reducedMotion && canLoad3D;

  return (
    <div className="absolute inset-0">
      <LandscapeFallback reducedMotion={reducedMotion} />
      {use3D && (
        <div className="absolute inset-0 hidden md:block">
          <Suspense fallback={null}>
            <ErrorBoundary onError={() => setFailed(true)}>
              <MaharashtraCanvas reducedMotion={reducedMotion} inView={inView} />
            </ErrorBoundary>
          </Suspense>
        </div>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
