import React, { Suspense, lazy } from 'react';
import { SansthaProvider, useSanstha } from './context/SansthaContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { HomeOverview } from './components/HomeOverview';
import { LightboxModal } from './components/LightboxModal';
import { SeoManager } from './components/SeoManager';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

// Route-level code splitting for non-home views to maximize initial page performance
const AboutView = lazy(() => import('./components/AboutView').then((m) => ({ default: m.AboutView })));
const OfficialsView = lazy(() => import('./components/OfficialsView').then((m) => ({ default: m.OfficialsView })));
const InitiativesView = lazy(() => import('./components/InitiativesView').then((m) => ({ default: m.InitiativesView })));
const WorkTimelineView = lazy(() => import('./components/WorkTimelineView').then((m) => ({ default: m.WorkTimelineView })));
const GalleryView = lazy(() => import('./components/GalleryView').then((m) => ({ default: m.GalleryView })));
const VideoLibraryView = lazy(() => import('./components/VideoLibraryView').then((m) => ({ default: m.VideoLibraryView })));
const ReportsView = lazy(() => import('./components/ReportsView').then((m) => ({ default: m.ReportsView })));
const NewsView = lazy(() => import('./components/NewsView').then((m) => ({ default: m.NewsView })));
const ContactView = lazy(() => import('./components/ContactView').then((m) => ({ default: m.ContactView })));
const SchemesView = lazy(() => import('./components/SchemesView').then((m) => ({ default: m.SchemesView })));
const VolunteerView = lazy(() => import('./components/VolunteerView').then((m) => ({ default: m.VolunteerView })));
const PrivacyPolicyView = lazy(() => import('./components/PrivacyPolicyView').then((m) => ({ default: m.PrivacyPolicyView })));
const TermsView = lazy(() => import('./components/TermsView').then((m) => ({ default: m.TermsView })));
const SitemapView = lazy(() => import('./components/SitemapView').then((m) => ({ default: m.SitemapView })));

const AdminPortal = lazy(() =>
  import('./components/AdminPortal').then((m) => ({ default: m.AdminPortal }))
);

const RouteLoadingFallback: React.FC<{ lang: string }> = ({ lang }) => (
  <div
    className="min-h-[55vh] flex flex-col items-center justify-center space-y-3 py-20 px-4 text-center"
    role="status"
    aria-label={lang === 'mr' ? 'माहिती लोड होत आहे...' : 'Loading content...'}
  >
    <div className="animate-spin rounded-full h-8 w-8 border-3 border-[#0868C9] border-t-[#E52E3D]" />
    <p className="text-xs font-semibold text-[#475569]">
      {lang === 'mr' ? 'कृपया प्रतीक्षा करा, माहिती लोड होत आहे...' : 'Please wait, loading content...'}
    </p>
  </div>
);

const AppContent: React.FC = () => {
  const { currentRoute, setCurrentRoute, lang, isLoading, isFallback, refreshContent } = useSanstha();

  if (currentRoute === 'admin') {
    return (
      <>
        <SeoManager />
        <React.Suspense
          fallback={
            <div
              className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] space-y-4 text-center px-4"
              role="status"
              aria-label={lang === 'mr' ? 'प्रशासक पोर्टल लोड होत आहे...' : 'Loading Admin Portal...'}
            >
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#065096] border-t-[#D92F43]" />
              <p className="text-xs text-[#475569] font-medium">
                {lang === 'mr' ? 'प्रशासक पोर्टल लोड होत आहे...' : 'Loading Admin Portal...'}
              </p>
            </div>
          }
        >
          <AdminPortal />
        </React.Suspense>
      </>
    );
  }

  const renderView = () => {
    switch (currentRoute) {
      case 'home':
        return (
          <>
            <HeroSection />
            <HomeOverview />
          </>
        );
      case 'about':
        return <AboutView />;
      case 'officials':
        return <OfficialsView />;
      case 'initiatives':
        return <InitiativesView />;
      case 'work':
        return <WorkTimelineView />;
      case 'gallery':
        return <GalleryView />;
      case 'videos':
        return <VideoLibraryView />;
      case 'reports':
        return <ReportsView />;
      case 'news':
      case 'events':
        return <NewsView />;
      case 'contact':
        return <ContactView />;
      case 'schemes':
        return <SchemesView />;
      case 'volunteer':
        return <VolunteerView />;
      case 'privacy':
        return <PrivacyPolicyView />;
      case 'terms':
        return <TermsView />;
      case 'sitemap':
        return <SitemapView />;
      default:
        return (
          <div className="max-w-xl mx-auto py-32 px-4 text-center space-y-4">
            <span className="text-4xl font-serif font-bold text-[#065096]">४०४</span>
            <h2 className="text-2xl font-serif font-bold text-[#065096]">
              {lang === 'mr' ? 'पृष्ठ आढळले नाही' : 'Page Not Found'}
            </h2>
            <p className="text-xs text-[#475569]">
              {lang === 'mr'
                ? 'आपण शोधत असलेले पृष्ठ उपलब्ध नाही किंवा त्याचा पत्ता बदलला गेला आहे.'
                : 'The requested page is unavailable or has been relocated.'}
            </p>
            <div className="pt-2">
              <button
                onClick={() => setCurrentRoute('home')}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#065096] text-white rounded-xl text-xs font-bold hover:bg-[#05437E] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#D92F43]" />
                <span>{lang === 'mr' ? 'मुख्यपृष्ठावर परत जा' : 'Return to Home'}</span>
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1E293B] font-sans antialiased overflow-x-hidden">
      <SeoManager />
      {isLoading && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-slate-200 overflow-hidden" aria-hidden="true">
          <div className="h-full bg-[#065096] animate-pulse w-full" />
        </div>
      )}

      {isFallback && (
        <div
          role="alert"
          className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs sm:text-sm font-sans"
        >
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <span>
                {lang === 'mr'
                  ? 'सर्व्हरशी थेट संपर्क न झाल्यामुळे नमुना/स्थानिक माहिती दर्शवली जात आहे. कृपया ही माहिती अधिकृत वस्तुस्थिती समजू नये.'
                  : 'Live server unreachable; displaying fallback sample data. This content should not be interpreted as verified real-world facts.'}
              </span>
            </div>
            <button
              onClick={() => refreshContent()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-md text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{lang === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry'}</span>
            </button>
          </div>
        </div>
      )}

      <Header />

      <main className="flex-1">
        <Suspense fallback={<RouteLoadingFallback lang={lang} />}>
          {renderView()}
        </Suspense>
      </main>

      <Footer />
      <LightboxModal />
    </div>
  );
};

export default function App() {
  return (
    <SansthaProvider>
      <AppContent />
    </SansthaProvider>
  );
}
