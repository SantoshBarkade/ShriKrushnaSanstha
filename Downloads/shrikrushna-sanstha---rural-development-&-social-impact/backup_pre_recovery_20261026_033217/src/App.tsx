import React from 'react';
import { SansthaProvider, useSanstha } from './context/SansthaContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { HomeOverview } from './components/HomeOverview';
import { AboutView } from './components/AboutView';
import { OfficialsView } from './components/OfficialsView';
import { InitiativesView } from './components/InitiativesView';
import { WorkTimelineView } from './components/WorkTimelineView';
import { GalleryView } from './components/GalleryView';
import { VideoLibraryView } from './components/VideoLibraryView';
import { ReportsView } from './components/ReportsView';
import { NewsView } from './components/NewsView';
import { ContactView } from './components/ContactView';
import { SchemesView } from './components/SchemesView';
import { VolunteerView } from './components/VolunteerView';
import { PrivacyPolicyView } from './components/PrivacyPolicyView';
import { LightboxModal } from './components/LightboxModal';
import { SeoManager } from './components/SeoManager';
import { SansthaGuide } from './components/SansthaGuide';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';

const AdminPortal = React.lazy(() =>
  import('./components/AdminPortal').then((m) => ({ default: m.AdminPortal }))
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
        {renderView()}
      </main>

      <Footer />
      <SansthaGuide />
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
