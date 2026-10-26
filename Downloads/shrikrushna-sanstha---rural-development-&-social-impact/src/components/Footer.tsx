import React, { useState, useEffect } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { PageRoute } from '../types';
import { SansthaLogo } from './SansthaLogo';
import {
  ShieldCheck,
  FileCheck,
  FileText,
  HeartHandshake,
  PhoneCall,
  ArrowUp,
  MapPin,
  Clock,
  Phone,
  Mail,
  Facebook,
  Youtube,
  Instagram,
  Lock,
} from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentRoute, state, lang, siteSettings } = useSanstha();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const next = window.scrollY > 350;
      setShowScrollTop((prev) => (prev !== next ? next : prev));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNav = (route: PageRoute) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentAddress =
    lang === 'mr'
      ? state.contactInfo.address
      : state.contactInfo.addressEn || state.contactInfo.address;

  const currentHours =
    lang === 'mr'
      ? state.contactInfo.visitingHours
      : state.contactInfo.visitingHoursEn || state.contactInfo.visitingHours;

  const quickLinks: [PageRoute, string, string][] = [
    ['about', 'संस्थेविषयी', 'About Us'],
    ['officials', 'पदाधिकारी', 'Officials'],
    ['initiatives', 'उपक्रम', 'Initiatives'],
    ['schemes', 'शासकीय योजना', 'Government Schemes'],
    ['work', 'आमचे कार्य', 'Our Work'],
    ['gallery', 'छायाचित्रे', 'Gallery'],
    ['videos', 'व्हिडिओ', 'Videos'],
    ['reports', 'अहवाल', 'Reports'],
    ['news', 'बातम्या', 'News'],
  ];

  const transparencyLinks: [PageRoute, string, string, React.FC<{ className?: string }>][] = [
    ['reports', 'वार्षिक कार्य अहवाल', 'Annual Activity Reports', FileCheck],
    ['reports', 'लेखापरीक्षण अहवाल', 'Audit & Financial Disclosure', ShieldCheck],
    ['privacy', 'गोपनीयता व नियम धोरण', 'Privacy & Policy', FileText],
    ['volunteer', 'स्वयंसेवक सहभाग नोंदणी', 'Volunteer Registration', HeartHandshake],
  ];

  return (
    <footer className="bg-gradient-to-b from-[#04122a] via-[#061D43] to-[#020914] text-slate-200 pt-14 sm:pt-18 pb-10 relative overflow-hidden">
      {/* Luminous Top Contour Hairline */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#0868C9]/70 via-[#E52E3D]/50 to-transparent" />

      {/* Subtle Ambient Background Light Gradients */}
      <div className="absolute -top-32 left-1/4 w-[500px] h-[300px] bg-[#0868C9]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[400px] h-[300px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Main 4-Column Grid (Desktop: 4 columns, Tablet: 2x2 grid, Mobile: stacked) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-8 xl:gap-10 pb-12 border-b border-white/10">
          {/* Column 1: Institution Identity (Desktop: lg:col-span-4, Tablet: order-1) */}
          <div className="order-1 lg:order-1 lg:col-span-4 space-y-4">
            <div
              onClick={() => handleNav('home')}
              className="cursor-pointer inline-block"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleNav('home')}
              aria-label="Home"
            >
              <SansthaLogo variant="white" lang={lang} />
            </div>

            {/* Official Registration Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono text-[#38BDF8] shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>
                {lang === 'mr'
                  ? state.contactInfo?.regNoMr || 'नोंदणी क्र.: एक १४६६८ (औ)'
                  : state.contactInfo?.regNoEn || 'Reg. No.: Ek 14668 (A)'}
              </span>
            </div>

            {/* Mission Statement */}
            <p className="text-xs sm:text-[13.5px] text-slate-300 leading-relaxed font-sans max-w-sm">
              {siteSettings?.sanstha_tagline?.[lang] ||
                (lang === 'mr'
                  ? 'नादरपूर व परिसरातील ग्रामीण भागात शिक्षण, कला-संस्कृती, आरोग्य, पर्यावरण आणि सामाजिक विकासासाठी समर्पित संस्था.'
                  : 'Dedicated to education, culture, public health, environment, and holistic rural transformation across Nadarpur.')}
            </p>

            {/* Official Social Links with brand colors */}
            <div className="pt-1">
              <span className="block text-[11px] font-sans font-medium text-slate-400 uppercase tracking-wider mb-2">
                {lang === 'mr' ? 'सोशल मीडिया दुवे' : 'Official Social Channels'}
              </span>
              <div className="flex items-center gap-2.5">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-sm cursor-pointer"
                  aria-label="Facebook"
                >
                  <Facebook className="w-4 h-4 fill-white text-white" />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-sm cursor-pointer"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4 fill-white text-white" />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] text-white flex items-center justify-center transition-transform hover:scale-110 shadow-sm cursor-pointer"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: महत्त्वाचे दुवे (Desktop: lg:col-span-2, Tablet: order-3, Mobile: order-2) */}
          <div className="order-2 md:order-3 lg:order-2 lg:col-span-2 space-y-3">
            <h3 className="font-serif font-bold text-base text-white tracking-wide mb-3 sm:mb-4">
              {lang === 'mr' ? 'महत्त्वाचे दुवे' : 'Important Links'}
            </h3>
            <ul className="space-y-2 text-xs sm:text-[13.5px]">
              {quickLinks.map(([route, labelMr, labelEn]) => (
                <li key={route}>
                  <button
                    onClick={() => handleNav(route)}
                    className="group flex items-center gap-2 text-slate-300 hover:text-white transition-colors cursor-pointer text-left py-0.5 w-full focus:outline-none focus:text-white"
                  >
                    <span className="text-[#38BDF8] group-hover:translate-x-1 transition-transform text-xs font-bold shrink-0">
                      ›
                    </span>
                    <span className="leading-snug">{lang === 'mr' ? labelMr : labelEn}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: पारदर्शकता व अहवाल (Desktop: lg:col-span-3, Tablet: order-4, Mobile: order-3) */}
          <div className="order-3 md:order-4 lg:order-3 lg:col-span-3 space-y-3">
            <h3 className="font-serif font-bold text-base text-white tracking-wide mb-3 sm:mb-4">
              {lang === 'mr' ? 'पारदर्शकता व अहवाल' : 'Transparency & Reports'}
            </h3>
            <ul className="space-y-3 text-xs sm:text-[13.5px]">
              {transparencyLinks.map(([route, labelMr, labelEn, Icon]) => (
                <li key={route + labelEn}>
                  <button
                    onClick={() => handleNav(route)}
                    className="group flex items-center gap-2.5 text-slate-300 hover:text-white transition-colors cursor-pointer text-left py-0.5 w-full focus:outline-none focus:text-white"
                  >
                    <Icon className="w-4 h-4 text-[#38BDF8] shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="leading-snug">{lang === 'mr' ? labelMr : labelEn}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: मुख्य कार्यालय (Desktop: lg:col-span-3, Tablet: order-2, Mobile: order-4) */}
          <div className="order-4 md:order-2 lg:order-4 lg:col-span-3 space-y-3">
            <h3 className="font-serif font-bold text-base text-white tracking-wide mb-3 sm:mb-4">
              {lang === 'mr' ? 'मुख्य कार्यालय' : 'Headquarters'}
            </h3>

            <div className="space-y-3 text-xs sm:text-[13px] text-slate-300 font-sans">
              {/* Address */}
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-white font-medium text-xs block mb-0.5">
                    {lang === 'mr' ? 'पत्ता:' : 'Address:'}
                  </span>
                  <p className="leading-relaxed text-slate-300 text-xs sm:text-[13px] font-serif overflow-visible">
                    {currentAddress}
                  </p>
                </div>
              </div>

              {/* Phone Helpline */}
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-white font-medium text-xs block mb-0.5">
                    {lang === 'mr' ? 'दूरध्वनी:' : 'Helpline:'}
                  </span>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-[13px]">
                    <a
                      href="tel:+919923512482"
                      className="text-slate-200 hover:text-white font-mono hover:underline transition-colors"
                    >
                      +91 9923512482
                    </a>
                    <span className="text-slate-500">•</span>
                    <a
                      href="tel:+918888684966"
                      className="text-slate-200 hover:text-white font-mono hover:underline transition-colors"
                    >
                      +91 8888684966
                    </a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-white font-medium text-xs block mb-0.5">
                    {lang === 'mr' ? 'ईमेल:' : 'Email:'}
                  </span>
                  <a
                    href="mailto:shrikrushnasanstha.nadarpur@gmail.com"
                    className="text-slate-200 hover:text-white hover:underline transition-colors break-all text-xs sm:text-[13px]"
                  >
                    shrikrushnasanstha.nadarpur@gmail.com
                  </a>
                </div>
              </div>

              {/* Office Hours */}
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-white font-medium text-xs block mb-0.5">
                    {lang === 'mr' ? 'कार्यालयीन वेळ:' : 'Office Hours:'}
                  </span>
                  <p className="leading-relaxed text-slate-300 text-xs sm:text-[13px]">
                    {currentHours}
                  </p>
                </div>
              </div>

              {/* Compact Contact Action Button */}
              <div className="pt-2">
                <button
                  onClick={() => handleNav('contact')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#E52E3D] hover:bg-[#C92033] text-white text-xs sm:text-sm font-semibold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer active:scale-95 group"
                >
                  <PhoneCall className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
                  <span>{lang === 'mr' ? 'संपर्क साधा' : 'Contact Us'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Legal Strip */}
        <div className="pt-6 sm:pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="text-center md:text-left leading-relaxed">
            {lang === 'mr'
              ? '© २०२६ श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था. सर्व हक्क राखीव.'
              : '© 2026 Shrikrushna Sanskrutik Va Gramin Vikas Sanstha. All rights reserved.'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs">
            <button
              onClick={() => handleNav('privacy')}
              className="hover:text-white hover:underline cursor-pointer transition-colors"
            >
              {lang === 'mr' ? 'गोपनीयता धोरण' : 'Privacy Policy'}
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => handleNav('terms')}
              className="hover:text-white hover:underline cursor-pointer transition-colors"
            >
              {lang === 'mr' ? 'अटी व शर्ती' : 'Terms & Conditions'}
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => handleNav('sitemap')}
              className="hover:text-white hover:underline cursor-pointer transition-colors"
            >
              {lang === 'mr' ? 'संकेतस्थळ नकाशा' : 'Sitemap'}
            </button>
            <span className="text-white/20">•</span>
            <button
              onClick={() => handleNav('admin')}
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white font-medium cursor-pointer transition-colors"
              title={lang === 'mr' ? 'प्रशासकीय नियंत्रण कक्ष' : 'Admin Login'}
            >
              <Lock className="w-3 h-3 text-[#E52E3D]" />
              <span>Admin</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-4 sm:right-6 z-40 w-11 h-11 rounded-full bg-white text-[#0868C9] shadow-2xl hover:shadow-cyan-500/20 border border-slate-200 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          aria-label={lang === 'mr' ? 'पृष्ठाच्या सुरुवातीला जा' : 'Back to Top'}
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5]" />
        </button>
      )}
    </footer>
  );
};
