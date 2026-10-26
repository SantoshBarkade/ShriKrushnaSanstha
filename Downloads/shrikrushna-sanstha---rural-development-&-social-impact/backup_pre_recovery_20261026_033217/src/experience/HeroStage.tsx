import React, { Suspense, lazy, useState } from 'react';
import { LandscapeFallback } from './LandscapeFallback';
import { useIsMobile, usePrefersReducedMotion, useWebGLSupport } from './hooks';

const MaharashtraCanvas = lazy(() => import('./MaharashtraCanvas'));

export const HeroStage: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const webgl = useWebGLSupport();
  const [failed, setFailed] = useState(false);
  const use3D = webgl && !failed && !isMobile && !reducedMotion;

  return (
    <div className="absolute inset-0">
      <LandscapeFallback reducedMotion={reducedMotion} />
      {use3D && (
        <div className="absolute inset-0 hidden md:block">
          <Suspense fallback={null}>
            <ErrorBoundary onError={() => setFailed(true)}>
              <MaharashtraCanvas reducedMotion={reducedMotion} />
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
