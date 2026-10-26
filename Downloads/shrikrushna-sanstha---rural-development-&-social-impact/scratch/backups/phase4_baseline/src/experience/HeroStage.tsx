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

    const win = typeof window !== 'undefined' ? (window as any) : null;
    if (win && 'requestIdleCallback' in win) {
      idleId = win.requestIdleCallback(
        () => setCanLoad3D(true),
        { timeout: 2500 }
      );
    } else {
      timerId = setTimeout(() => setCanLoad3D(true), 1200);
    }

    return () => {
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
