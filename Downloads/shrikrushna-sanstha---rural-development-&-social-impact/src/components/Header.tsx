import React, { useState, useEffect } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { PageRoute } from '../types';
import { SansthaLogo } from './SansthaLogo';
import {
  Menu,
  X,
  Home,
  Info,
  Users,
  Layers,
  BookOpen,
  Image as ImageIcon,
  Video,
  FileText,
  Calendar,
  Phone,
  Lock,
  HeartHandshake,
  Landmark,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { currentRoute, setCurrentRoute, lang, setLang, t } = useSanstha();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 20;
      setIsScrolled((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems: {
    id: PageRoute;
    label: string;
    shortLabel: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'home', label: lang === 'mr' ? 'मुखपृष्ठ' : 'Home', shortLabel: lang === 'mr' ? 'मुखपृष्ठ' : 'Home', icon: Home },
    { id: 'about', label: t.nav.about, shortLabel: lang === 'mr' ? 'संस्थेविषयी' : 'About', icon: Info },
    { id: 'officials', label: t.nav.officials, shortLabel: lang === 'mr' ? 'पदाधिकारी' : 'Officials', icon: Users },
    { id: 'initiatives', label: t.nav.initiatives, shortLabel: lang === 'mr' ? 'उपक्रम' : 'Initiatives', icon: Layers },
    {
      id: 'schemes',
      label: (t.nav as Record<string, string>).schemes || (lang === 'mr' ? 'शासकीय योजना' : 'Govt Schemes'),
      shortLabel: lang === 'mr' ? 'योजना' : 'Schemes',
      icon: Landmark,
    },
    { id: 'work', label: t.nav.work, shortLabel: lang === 'mr' ? 'आमचे कार्य' : 'Our Work', icon: BookOpen },
    { id: 'gallery', label: t.nav.gallery, shortLabel: lang === 'mr' ? 'छायाचित्रे' : 'Gallery', icon: ImageIcon },
    { id: 'videos', label: t.nav.videos, shortLabel: lang === 'mr' ? 'व्हिडिओ' : 'Videos', icon: Video },
    { id: 'reports', label: t.nav.reports, shortLabel: lang === 'mr' ? 'अहवाल' : 'Reports', icon: FileText },
    { id: 'news', label: t.nav.news, shortLabel: lang === 'mr' ? 'बातम्या' : 'News', icon: Calendar },
    {
      id: 'volunteer',
      label: lang === 'mr' ? 'स्वयंसेवक' : 'Volunteers',
      shortLabel: lang === 'mr' ? 'स्वयंसेवक' : 'Volunteers',
      icon: HeartHandshake,
    },
    {
      id: 'contact',
      label: lang === 'mr' ? 'संपर्क' : 'Contact',
      shortLabel: lang === 'mr' ? 'संपर्क' : 'Contact',
      icon: Phone,
    },
  ];

  const handleNavClick = (route: PageRoute) => {
    setCurrentRoute(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-xl shadow-[0_10px_35px_rgba(7,29,67,0.08)] border-b border-slate-200/80 py-1'
          : 'bg-white/90 backdrop-blur-lg border-b border-slate-200/60 py-1.5 sm:py-2'
      }`}
    >
      {/* Top Accent Hairline */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#0868C9] via-[#E52E3D] to-[#0868C9] absolute top-0 left-0 right-0" />

      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-6">
        {/* ROW 1: Brand and Actions */}
        <div className="header-top-row flex items-center justify-between gap-3 sm:gap-4 py-1.5 sm:py-2 min-h-[58px] sm:min-h-[64px]">
          {/* Official Brand Logo */}
          <div
            onClick={() => handleNavClick('home')}
            className="cursor-pointer group min-w-0 shrink transition-transform hover:scale-[1.01]"
            role="button"
            tabIndex={0}
            aria-label={t.siteTitle}
            onKeyDown={(e) => e.key === 'Enter' && handleNavClick('home')}
          >
            <SansthaLogo variant="horizontal" lang={lang} />
          </div>

          {/* Right Controls: Language Switcher + Contact CTA + Admin Button + Mobile/Tablet Drawer Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Clean Language Toggle (मराठी | EN) Pill */}
            <div
              className="inline-flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5 text-xs font-sans shadow-2xs"
              role="group"
              aria-label="Language Selector"
            >
              <button
                onClick={() => setLang('mr')}
                className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  lang === 'mr'
                    ? 'bg-[#0868C9] text-white shadow-2xs'
                    : 'text-[#475569] hover:text-[#0868C9]'
                }`}
              >
                मराठी
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-full font-bold transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-[#0868C9] text-white shadow-2xs'
                    : 'text-[#475569] hover:text-[#0868C9]'
                }`}
              >
                EN
              </button>
            </div>

            {/* Brand Accent Red Contact Button */}
            <button
              onClick={() => handleNavClick('contact')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-bold bg-[#E52E3D] hover:bg-[#C92033] text-white shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap active:scale-95"
            >
              <Phone className="w-3.5 h-3.5 fill-white text-white" />
              <span>{lang === 'mr' ? 'संपर्क साधा' : 'Contact Us'}</span>
            </button>

            {/* Admin Portal Authorized Login Button */}
            <button
              onClick={() => handleNavClick('admin')}
              title={lang === 'mr' ? 'प्रशासकीय नियंत्रण कक्ष' : 'Admin Portal Login'}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border whitespace-nowrap shadow-2xs ${
                currentRoute === 'admin'
                  ? 'bg-[#071D43] text-white border-[#071D43]'
                  : 'bg-white text-[#071D43] border-slate-300 hover:border-[#0868C9] hover:bg-slate-50'
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-[#E52E3D]" />
              <span>Admin</span>
            </button>

            {/* Mobile / Tablet Drawer Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#071D43] border border-slate-200 transition-colors cursor-pointer shrink-0 shadow-2xs"
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? 'मेनू बंद करा' : 'मेनू उघडा'}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-[#E52E3D]" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* ROW 2: Primary Navigation Row (Always dedicated below Row 1 at all zoom levels) */}
        <nav
          className="header-navigation-row border-t border-slate-200/70 pt-1.5 pb-2 min-h-[44px]"
          aria-label="Primary Navigation"
        >
          <div className="flex items-center gap-1.5 2xl:gap-2 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-3 py-1.5 text-xs sm:text-[13px] 2xl:text-[13.5px] font-sans rounded-full transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 border ${
                    isActive
                      ? 'bg-[#0868C9] text-white font-bold border-[#0868C9] shadow-2xs'
                      : 'bg-white/80 hover:bg-white text-[#334155] hover:text-[#0868C9] border-slate-200/90 hover:border-[#0868C9]/40 font-medium'
                  }`}
                >
                  <span>{item.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Expandable Full Drawer Menu for Mobile/Tablet when Hamburger is tapped */}
      {mobileMenuOpen && (
        <div id="mobile-drawer-menu" className="xl:hidden bg-white/98 backdrop-blur-xl border-t border-slate-200 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
              {lang === 'mr' ? 'संकेतस्थळ मेनू' : 'Site Navigation'}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0868C9] text-white font-bold shadow-2xs'
                        : 'bg-slate-50 text-[#1E293B] hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-white' : 'text-[#0868C9]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleNavClick('contact')}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#E52E3D] text-white shadow-xs hover:bg-[#C92033] transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>{lang === 'mr' ? 'संपर्क साधा' : 'Contact Us'}</span>
              </button>
              <button
                onClick={() => handleNavClick('admin')}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-[#071D43] hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
              >
                <Lock className="w-4 h-4 text-[#E52E3D]" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
