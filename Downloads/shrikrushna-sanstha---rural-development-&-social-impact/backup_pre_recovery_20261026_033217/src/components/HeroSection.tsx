import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useSanstha } from '../context/SansthaContext';
import {
  ArrowRight,
  FileText,
  GraduationCap,
  HeartPulse,
  Landmark,
  Sprout,
  Quote,
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { HeroStage } from '../experience/HeroStage';
import { usePrefersReducedMotion } from '../experience/hooks';

export const HeroSection: React.FC = () => {
  const { setCurrentRoute, lang } = useSanstha();
  const heroRef = useRef<HTMLElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 90, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 90, damping: 20 });
  const cardRotateX = useTransform(springY, [-0.5, 0.5], reducedMotion ? [0, 0] : [7, -7]);
  const cardRotateY = useTransform(springX, [-0.5, 0.5], reducedMotion ? [0, 0] : [-10, 10]);
  const quoteX = useTransform(springX, [-0.5, 0.5], reducedMotion ? [0, 0] : [-18, 18]);
  const quoteY = useTransform(springY, [-0.5, 0.5], reducedMotion ? [0, 0] : [-12, 12]);

  useLayoutEffect(() => {
    if (reducedMotion) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.to('.hero-stage-veil', {
        opacity: 0.72,
        scrollTrigger: {
          trigger: heroRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
      });
    }, heroRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (reducedMotion || !heroRef.current || window.innerWidth < 768) return;
    const rect = heroRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const fourPillars = [
    {
      id: 'education',
      titleMr: 'शिक्षण',
      titleEn: 'Education',
      descMr: 'गुणवत्तापूर्ण शिक्षण आणि विद्यार्थ्यांच्या सर्वांगीण विकासासाठी उपक्रम.',
      descEn: 'Quality education and holistic child development initiatives.',
      icon: GraduationCap,
      accent: '#0284C7',
      wash: 'from-[#0284C7] to-[#38BDF8]',
      route: 'initiatives' as const,
    },
    {
      id: 'health',
      titleMr: 'आरोग्य',
      titleEn: 'Healthcare',
      descMr: 'ग्रामीण आरोग्य, जनजागृती आणि आरोग्य सेवा कार्यक्रम.',
      descEn: 'Rural healthcare camps, health awareness, and medical care programs.',
      icon: HeartPulse,
      accent: '#E11D48',
      wash: 'from-[#E11D48] to-[#FB7185]',
      route: 'initiatives' as const,
    },
    {
      id: 'culture',
      titleMr: 'संस्कृती',
      titleEn: 'Culture',
      descMr: 'सांस्कृतिक वारसा संवर्धन आणि सामाजिक ऐक्य.',
      descEn: 'Preserving cultural heritage, arts, and community harmony.',
      icon: Landmark,
      accent: '#16A34A',
      wash: 'from-[#16A34A] to-[#4ADE80]',
      route: 'work' as const,
    },
    {
      id: 'community',
      titleMr: 'समुदाय',
      titleEn: 'Community',
      descMr: 'शाश्वत ग्रामीण विकास आणि समुदाय सहयोग वाढविणे.',
      descEn: 'Sustainable rural progress and empowering community leadership.',
      icon: Sprout,
      accent: '#D97706',
      wash: 'from-[#D97706] to-[#FBBF24]',
      route: 'initiatives' as const,
    },
  ];

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
      className="relative overflow-hidden min-h-[92vh] flex flex-col justify-end"
      style={{ perspective: '1600px' }}
      aria-label="मुख्य परिचय"
    >
      <HeroStage />
      <div className="hero-stage-veil absolute inset-0 bg-gradient-to-b from-[#071D43]/25 via-transparent to-[#F4F1E8] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full pt-10 pb-10 sm:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center">
          <div className="lg:col-span-7 space-y-5 sm:space-y-6">
            <motion.div
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex flex-wrap items-center gap-2 sm:gap-3 px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-[#071D43]/70 border border-white/20 shadow-lg backdrop-blur-md"
            >
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#E52E3D]" />
                {lang === 'mr' ? 'ग्रामीण परिवर्तन' : 'Rural Transformation'}
              </span>
              <span className="text-white/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
                {lang === 'mr' ? 'सांस्कृतिक समृद्धी' : 'Cultural Heritage'}
              </span>
              <span className="text-white/40">•</span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4ADE80]" />
                {lang === 'mr' ? 'सर्वांगीण विकास' : 'Holistic Progress'}
              </span>
            </motion.div>

            <motion.h1
              initial={reducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[50px] font-serif font-extrabold text-white tracking-tight leading-[1.16] drop-shadow-[0_12px_30px_rgba(7,29,67,0.45)]"
            >
              <span className="block">{lang === 'mr' ? 'संस्कृती, शिक्षण, आरोग्य' : 'Culture, Education, Healthcare'}</span>
              <span className="block mt-1.5">
                {lang === 'mr' ? 'आणि शाश्वत ग्रामीण विकास' : '& Sustainable Rural Progress'}
              </span>
              <span className="inline-flex flex-wrap items-center gap-2 mt-3">
                <span className="inline-block px-4 py-1 rounded-xl bg-gradient-to-r from-[#E52E3D] to-[#D92030] text-white shadow-md text-2xl sm:text-3xl md:text-4xl">
                  {lang === 'mr' ? 'एकत्रितपणे' : 'Together'}
                </span>
                <span className="text-white/95 text-xl sm:text-2xl md:text-3xl font-medium">
                  {lang === 'mr' ? 'सर्वांच्या विकासासाठी' : 'for Collective Growth'}
                </span>
              </span>
            </motion.h1>

            <p className="text-base sm:text-lg text-white/90 font-sans leading-relaxed max-w-xl">
              {lang === 'mr'
                ? 'ग्रामीण भागातील शिक्षण, सांस्कृतिक संवर्धन, आरोग्य, पर्यावरण आणि सामाजिक विकासासाठी समर्पित संस्था.'
                : 'An institution wholeheartedly committed to quality schooling, cultural heritage preservation, public health, environment, and rural community upliftment.'}
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-1">
              <button
                onClick={() => {
                  setCurrentRoute('work');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="relative inline-flex items-center gap-2.5 px-7 py-3.5 bg-white text-[#071D43] text-sm sm:text-[15px] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span>{lang === 'mr' ? 'आमचे कार्य पहा' : 'View Our Work'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
              </button>
              <button
                onClick={() => {
                  setCurrentRoute('about');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#E52E3D]/95 hover:bg-[#C92033] text-white border border-white/20 text-sm sm:text-[15px] font-bold rounded-xl shadow-md cursor-pointer group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <FileText className="w-4 h-4" />
                <span>{lang === 'mr' ? 'संस्थेबद्दलची माहिती' : 'About the Sanstha'}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <motion.div
              style={{ rotateX: cardRotateX, rotateY: cardRotateY, transformStyle: 'preserve-3d' }}
              initial={reducedMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div
                className="relative rounded-[28px] overflow-hidden border border-white/40 shadow-[0_30px_80px_rgba(7,29,67,0.35)] bg-[#123056]"
                style={{ transform: 'translateZ(24px)' }}
              >
                <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden">
                  <img
                    src="/hero-scene-main.jpg"
                    alt={
                      lang === 'mr'
                        ? 'श्रीकृष्ण संस्था - ग्रामीण शिक्षण व विकास'
                        : 'Shrikrushna Sanstha - Rural Education and Progress'
                    }
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80';
                    }}
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071D43]/70 via-transparent to-white/10 pointer-events-none" />
                </div>
              </div>

              <div
                className="hidden sm:inline-flex items-center gap-2 absolute -top-3 left-4 z-20 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-lg border border-white/80 text-xs font-semibold text-[#071D43]"
                style={{ transform: 'translateZ(48px)' }}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{lang === 'mr' ? 'अधिकृत नोंदणीकृत संस्था' : 'Govt. Registered NGO'}</span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] text-[#0868C9] font-mono">रजि. एक १४६६८ (औ)</span>
              </div>

              <motion.div
                style={{ x: quoteX, y: quoteY, transform: 'translateZ(70px)' }}
                className="absolute -bottom-3 left-2 right-2 sm:left-auto sm:right-3 sm:max-w-[320px] bg-white/98 backdrop-blur-md p-3 sm:p-4 rounded-2xl shadow-2xl border border-white/80"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#EBF3FA] flex items-center justify-center shrink-0">
                    <Quote className="w-4 h-4 text-[#0868C9]" />
                  </div>
                  <div>
                    <p className="font-serif font-bold text-xs sm:text-[13.5px] text-[#071D43] leading-snug">
                      {lang === 'mr'
                        ? '“गावाचा विकास उज्ज्वल भविष्यासाठी विश्वास”'
                        : '“Village Development - Faith in a Bright Future”'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="w-5 h-[2.5px] bg-[#E52E3D] rounded-full" />
                      <span className="w-3 h-[2.5px] bg-[#0868C9] rounded-full" />
                      <span className="text-[10px] text-slate-500 font-medium">
                        {lang === 'mr' ? 'संस्थेचा संकल्प' : 'Sanstha Resolve'}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>

        <div className="mt-10 sm:mt-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {fourPillars.map((pillar, index) => {
              const Icon = pillar.icon;
              return (
                <motion.button
                  key={pillar.id}
                  type="button"
                  initial={reducedMotion ? false : { opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.08 }}
                  whileHover={reducedMotion ? undefined : { y: -6, rotateX: 4 }}
                  onClick={() => {
                    setCurrentRoute(pillar.route);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group text-left rounded-3xl bg-white/92 backdrop-blur-md border border-white/70 shadow-[0_18px_40px_rgba(7,29,67,0.12)] p-5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0868C9]"
                  aria-label={`${lang === 'mr' ? pillar.titleMr : pillar.titleEn}`}
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${pillar.wash} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" style={{ color: pillar.accent }} />
                  </div>
                  <h2 className="font-serif font-bold text-lg text-[#071D43]">{lang === 'mr' ? pillar.titleMr : pillar.titleEn}</h2>
                  <p className="text-[13px] text-slate-600 leading-relaxed mt-1.5">
                    {lang === 'mr' ? pillar.descMr : pillar.descEn}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
