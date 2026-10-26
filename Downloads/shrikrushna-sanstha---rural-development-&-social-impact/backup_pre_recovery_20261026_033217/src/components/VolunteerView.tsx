import React, { useState, useRef, useCallback } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { validateVolunteerForm, VolunteerFormData } from '../utils/validation';
import { ApiClient } from '../services/apiClient';
import {
  HeartHandshake,
  Users,
  Award,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  TreePine,
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  Check,
  Building2,
  FileText,
  BadgeCheck,
  UserCheck,
  HelpCircle,
} from 'lucide-react';

/**
 * High-performance 3D Tilt Card wrapper
 * Direct DOM style mutation inside RAF avoids React re-renders during mouse movement.
 * Completely disabled on touch devices and respects prefers-reduced-motion.
 */
interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

const Card3D: React.FC<Card3DProps> = ({ children, className = '', onClick, 'aria-label': ariaLabel }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

    const rotateX = ((y - centerY) / centerY) * -2.2;
    const rotateY = ((x - centerX) / centerX) * 2.2;

    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      glare.style.opacity = '0.12';
      glare.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0) 65%)`;
    });
  }, []);

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

const INTEREST_OPTIONS: { id: string; mr: string; en: string; icon: React.ElementType }[] = [
  { id: 'ग्रामीण विकास', mr: 'ग्रामीण विकास (Rural Development)', en: 'Rural Development', icon: Building2 },
  { id: 'शिक्षण', mr: 'शिक्षण व विद्यार्थी मार्गदर्शन (Education & Youth)', en: 'Education & Guidance', icon: BookOpen },
  { id: 'सांस्कृतिक उपक्रम', mr: 'सांस्कृतिक व सामाजिक उपक्रम (Cultural & Social)', en: 'Cultural Activities', icon: Sparkles },
  { id: 'पर्यावरण', mr: 'पर्यावरण व वृक्षारोपण (Environment & Greenery)', en: 'Environment & Greenery', icon: TreePine },
  { id: 'महिला सक्षमीकरण', mr: 'महिला सक्षमीकरण (Women Empowerment)', en: 'Women Empowerment', icon: Users },
  { id: 'आरोग्य व जनजागृती', mr: 'आरोग्य व जनजागृती शिबिरे (Health & Medical Awareness)', en: 'Health & Medical Awareness', icon: HeartHandshake },
  { id: 'कार्यक्रम व्यवस्थापन', mr: 'कार्यक्रम नियोजन व व्यवस्थापन (Event Management)', en: 'Event Management', icon: Calendar },
  { id: 'इतर', mr: 'इतर योगदान (Other Initiatives)', en: 'Other Initiatives', icon: Briefcase },
];

const AGE_BRACKETS: { value: string; mr: string; en: string }[] = [
  { value: '18-25', mr: '१८ ते २५ वर्षे (18-25 yrs)', en: '18-25 years' },
  { value: '26-35', mr: '२६ ते ३५ वर्षे (26-35 yrs)', en: '26-35 years' },
  { value: '36-50', mr: '३६ ते ५० वर्षे (36-50 yrs)', en: '36-50 years' },
  { value: '50+', mr: '५० वर्षांपेक्षा जास्त (50+ yrs)', en: '50+ years' },
];

const GENDER_OPTIONS: { value: string; mr: string; en: string }[] = [
  { value: 'male', mr: 'पुरुष (Male)', en: 'Male' },
  { value: 'female', mr: 'स्त्री (Female)', en: 'Female' },
  { value: 'other', mr: 'इतर (Other)', en: 'Other' },
  { value: 'prefer_not_to_say', mr: 'सांगू इच्छित नाही (Prefer not to say)', en: 'Prefer not to say' },
];

const AVAILABILITY_OPTIONS: { value: string; mr: string; en: string }[] = [
  { value: 'weekends', mr: 'शनिवार - रविवार (Weekends)', en: 'Weekends' },
  { value: 'weekdays', mr: 'आठवड्याचे दिवस (Weekdays)', en: 'Weekdays' },
  { value: 'flexible', mr: 'वेळ मिळेल तसे / लवचिक (Flexible)', en: 'Flexible' },
  { value: 'events', mr: 'केवळ विशेष कार्यक्रमांसाठी (Events only)', en: 'Events only' },
];

export const VolunteerView: React.FC = () => {
  const { setCurrentRoute, lang, t } = useSanstha();

  const [formData, setFormData] = useState<VolunteerFormData>({
    fullName: '',
    phone: '',
    email: '',
    village: '',
    taluka: lang === 'mr' ? 'कन्नड' : 'Kannad',
    district: lang === 'mr' ? 'छत्रपती संभाजीनगर' : 'Chhatrapati Sambhajinagar',
    ageBracket: '18-25',
    gender: 'prefer_not_to_say',
    areasOfInterest: ['ग्रामीण विकास'],
    availability: 'flexible',
    message: '',
  });

  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof VolunteerFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; referenceId?: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const toggleInterest = (interestId: string) => {
    setFormData((prev) => {
      const exists = prev.areasOfInterest.includes(interestId);
      const updated = exists
        ? prev.areasOfInterest.filter((item) => item !== interestId)
        : [...prev.areasOfInterest, interestId];
      return { ...prev, areasOfInterest: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessInfo(null);

    // Client-side validation
    const validation = validateVolunteerForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      const formEl = document.getElementById('volunteer-form-container');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    if (!agreePrivacy) {
      setServerError(
        lang === 'mr'
          ? 'कृपया गोपनीयता व माहिती संमती बॉक्स निवडा.'
          : 'Please accept the privacy consent checkbox to proceed.'
      );
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await ApiClient.submitVolunteer({
        ...validation.sanitized,
        website: honeypot || undefined,
      });

      setSuccessInfo({
        message:
          lang === 'mr'
            ? 'आपली स्वयंसेवक नोंदणी यशस्वीरीत्या प्राप्त झाली आहे! श्रीकृष्ण संस्थेच्या सामाजिक उपक्रमात सहभागी होण्यासाठी धन्यवाद. आमची समन्वय टीम लवकरच आपल्याशी संपर्क साधेल.'
            : result.message ||
              'Your volunteer registration has been successfully submitted! Thank you for joining our mission.',
        referenceId: result.volunteerId || (result as any).id
          ? `VOL-${String(result.volunteerId || (result as any).id).padStart(4, '0')}`
          : (result as any).reference_id || undefined,
      });

      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        village: '',
        taluka: lang === 'mr' ? 'कन्नड' : 'Kannad',
        district: lang === 'mr' ? 'छत्रपती संभाजीनगर' : 'Chhatrapati Sambhajinagar',
        ageBracket: '18-25',
        gender: 'prefer_not_to_say',
        areasOfInterest: ['ग्रामीण विकास'],
        availability: 'flexible',
        message: '',
      });
      setHoneypot('');
      const successEl = document.getElementById('volunteer-form-container');
      if (successEl) {
        successEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (err: any) {
      setServerError(
        err.message ||
          (lang === 'mr'
            ? 'नोंदणी सादर करताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
            : 'Error submitting registration. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF9] pb-24 font-sans text-slate-800">
      {/* Institutional Hero Section */}
      <section className="relative bg-gradient-to-b from-[#061A3C] via-[#0A2540] to-[#0D3156] text-white pt-10 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8 border-b border-amber-500/20 shadow-lg overflow-hidden">
        {/* Subtle Architectural Grid Pattern Overlay */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Ambient Glows */}
        <div
          className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
            <button
              onClick={() => setCurrentRoute('home')}
              className="hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1 font-medium"
            >
              <span>{t.nav.home}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-amber-400 font-semibold" aria-current="page">
              {lang === 'mr' ? 'स्वयंसेवक नोंदणी' : 'Volunteer Registration'}
            </span>
          </nav>

          {/* Title & Institutional Credential Pill */}
          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                {lang === 'mr'
                  ? '।। सेवेची पाऊले, परिवर्तनाची दिशा ।। • नोंदणी क्र. एक १४६६८ (औ)'
                  : 'Steps of Service, Direction of Transformation • Reg. No. Ek 14668 (A)'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
              {lang === 'mr'
                ? 'स्वयंसेवक बना — ग्रामीण परिवर्तनात सक्रिय सहभागी व्हा'
                : 'Become a Volunteer — Shape Grassroots Rural Progress'}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-200 leading-relaxed font-sans max-w-3xl">
              {lang === 'mr'
                ? 'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, नादरपूर (ता. कन्नड, जि. छत्रपती संभाजीनगर) अंतर्गत शिक्षण, आरोग्य, पर्यावरण, महिला सक्षमीकरण आणि शासकीय योजना जनजागृती उपक्रमांमध्ये आपले मोलाचे योगदान द्या.'
                : 'Contribute your time, skills, and energy to grassroots community initiatives led by Shrikrushna Sanstha across Nadarpur, Kannad, and rural Maharashtra.'}
            </p>
          </div>

          {/* Key Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 max-w-3xl">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-emerald-400/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'निःशुल्क नोंदणी' : 'No Registration Fee'}
                </p>
                <p className="text-sm sm:text-base font-bold font-serif text-white">
                  {lang === 'mr' ? '१००% मोफत व पारदर्शक' : '100% Free & Open'}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'अधिकृत प्रमाणपत्र' : 'Service Certificate'}
                </p>
                <p className="text-sm sm:text-base font-bold font-serif text-white">
                  {lang === 'mr' ? 'सहभाग व कौतुक पत्र' : 'Official Recognition'}
                </p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-lg bg-blue-400/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-300">
                  {lang === 'mr' ? 'स्थानिक समन्वय' : 'Community Mentorship'}
                </p>
                <p className="text-sm sm:text-base font-bold font-serif text-white">
                  {lang === 'mr' ? 'कन्नड व नादरपूर कार्यक्षेत्र' : 'Kannad & Nadarpur'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Registration Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 relative z-20 space-y-10">
        {/* Process Flow Strip (3 Steps) */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-serif font-bold text-slate-900 flex items-center gap-2">
              <BadgeCheck className="w-5 h-5 text-amber-600" />
              <span>
                {lang === 'mr'
                  ? 'स्वयंसेवक सहभाग प्रक्रिया (३ सोप्या पायऱ्या)'
                  : 'How Volunteer Engagement Works (3 Simple Steps)'}
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'mr'
                ? 'पारदर्शक आणि शिस्तबद्ध पद्धतीने समाजकार्यात सहभागी होण्याची कार्यपद्धती.'
                : 'A structured, transparent pathway to participate in our verified rural programs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card3D className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#061A3C] text-amber-400 font-serif font-bold text-sm flex items-center justify-center">
                  १
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'mr' ? 'पायरी १' : 'Step 1'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {lang === 'mr' ? 'ऑनलाइन अर्ज नोंदणी' : 'Submit Registration'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'खालील अर्जात आपले नाव, मोबाईल, गाव व आवडते कार्यक्षेत्र निवडून नोंदणी पूर्ण करा.'
                  : 'Fill the form below with your contact details, locality, and selected areas of interest.'}
              </p>
            </Card3D>

            <Card3D className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#061A3C] text-amber-400 font-serif font-bold text-sm flex items-center justify-center">
                  २
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'mr' ? 'पायरी २' : 'Step 2'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {lang === 'mr' ? 'समन्वय व पूर्वसंवाद' : 'Coordination & Orientation'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'संस्थेची समन्वय टीम आपल्याशी संवाद साधून आगामी शिबिरे व उपक्रमांचे नियोजन करेल.'
                  : 'Our volunteer coordination team connects with you before upcoming camps and drives.'}
              </p>
            </Card3D>

            <Card3D className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-lg bg-[#061A3C] text-amber-400 font-serif font-bold text-sm flex items-center justify-center">
                  ३
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {lang === 'mr' ? 'पायरी ३' : 'Step 3'}
                </span>
              </div>
              <h3 className="font-serif font-bold text-slate-900 text-base">
                {lang === 'mr' ? 'प्रत्यक्ष सहभाग व प्रमाणपत्र' : 'Field Action & Certificate'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {lang === 'mr'
                  ? 'आरोग्य शिबिरे, वृक्षारोपण किंवा बाल विद्यालयात सक्रिय सहभागानंतर अधिकृत प्रमाणपत्र प्राप्त करा.'
                  : 'Participate actively in on-ground programs and receive an official Certificate of Service.'}
              </p>
            </Card3D>
          </div>
        </section>

        {/* Form Container */}
        <div
          id="volunteer-form-container"
          className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 sm:p-10 lg:p-12 relative overflow-hidden space-y-8"
        >
          {/* Top Form Header */}
          <div className="border-b border-slate-200 pb-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#061A3C] text-xs font-semibold mb-2">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>{lang === 'mr' ? 'अधिकृत स्वयंसेवक नोंदणी अर्ज' : 'Official Volunteer Application Form'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900">
              {lang === 'mr' ? 'आपली माहिती भरा व सहभागाची नोंद करा' : 'Enter Details & Register for Community Service'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {lang === 'mr'
                ? '* चिन्हांकित रकाने आवश्यक आहेत. सर्व माहिती सुरक्षित ठेवली जाते.'
                : 'Fields marked with * are required. Your information remains strictly confidential.'}
            </p>
          </div>

          {/* Success Alert Banner */}
          {successInfo && (
            <div
              role="alert"
              aria-live="polite"
              className="p-6 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-3 animate-fade-in shadow-xs"
            >
              <div className="flex items-start gap-3.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="text-lg font-serif font-bold text-emerald-900">
                    {lang === 'mr' ? 'नोंदणी यशस्वीरीत्या प्राप्त झाली!' : 'Registration Received Successfully!'}
                  </h4>
                  <p className="text-xs sm:text-sm leading-relaxed text-emerald-800">
                    {successInfo.message}
                  </p>
                  {successInfo.referenceId && (
                    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-xs font-mono font-bold text-emerald-900 shadow-xs">
                      <span>{lang === 'mr' ? 'नोंदणी संदर्भ क्रमांक:' : 'Reference ID:'}</span>
                      <span className="text-emerald-700">{successInfo.referenceId}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div
              role="alert"
              aria-live="assertive"
              className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 animate-fade-in"
            >
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm font-medium">{serverError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            {/* Honeypot field (hidden from real users to trap spam bots) */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="volunteer-website">Leave this field blank</label>
              <input
                id="volunteer-website"
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Section 1: Personal Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-full bg-[#061A3C] text-amber-400 text-xs font-bold flex items-center justify-center font-sans">
                  १
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900">
                  {lang === 'mr' ? 'वैयक्तिक माहिती (Personal Details)' : 'Personal Details'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label
                    htmlFor="volunteer-fullName"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr' ? 'पूर्ण नाव *' : 'Full Name *'}
                  </label>
                  <input
                    id="volunteer-fullName"
                    type="text"
                    required
                    placeholder={lang === 'mr' ? 'उदा. सचिन दिलीप निकम' : 'e.g. Sachin Dilip Nikam'}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    aria-invalid={Boolean(errors.fullName)}
                    aria-describedby={errors.fullName ? 'fullName-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all ${
                      errors.fullName ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.fullName && (
                    <p id="fullName-error" role="alert" className="mt-1.5 text-xs text-rose-600 font-medium">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label
                    htmlFor="volunteer-phone"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr' ? 'मोबाईल क्रमांक *' : 'Mobile Number *'}
                  </label>
                  <input
                    id="volunteer-phone"
                    type="tel"
                    required
                    placeholder="उदा. 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    aria-invalid={Boolean(errors.phone)}
                    aria-describedby={errors.phone ? 'phone-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all ${
                      errors.phone ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.phone ? (
                    <p id="phone-error" role="alert" className="mt-1.5 text-xs text-rose-600 font-medium">
                      {errors.phone}
                    </p>
                  ) : (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {lang === 'mr' ? '१०-अंकी भारतीय मोबाईल क्रमांक प्रविष्ट करा' : '10-digit Indian mobile number'}
                    </p>
                  )}
                </div>

                {/* Email (Optional) */}
                <div>
                  <label
                    htmlFor="volunteer-email"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr' ? 'ईमेल पत्ता (ऐच्छिक)' : 'Email Address (Optional)'}
                  </label>
                  <input
                    id="volunteer-email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all ${
                      errors.email ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.email && (
                    <p id="email-error" role="alert" className="mt-1.5 text-xs text-rose-600 font-medium">
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Age Bracket */}
                <div>
                  <label
                    htmlFor="volunteer-ageBracket"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr' ? 'वयोगट (Age Bracket)' : 'Age Bracket'}
                  </label>
                  <select
                    id="volunteer-ageBracket"
                    value={formData.ageBracket || '18-25'}
                    onChange={(e) => setFormData({ ...formData, ageBracket: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all"
                  >
                    {AGE_BRACKETS.map((b) => (
                      <option key={b.value} value={b.value}>
                        {lang === 'mr' ? b.mr : b.en}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {lang === 'mr'
                      ? 'गोपनीयतेसाठी पूर्ण जन्मतारखेऐवजी केवळ वयोगट घेतला जातो'
                      : 'Privacy-safe age bracket instead of full birth date'}
                  </p>
                </div>

                {/* Gender (Optional with Prefer Not to Say) */}
                <div className="md:col-span-2">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {lang === 'mr' ? 'लिंग (ऐच्छिक)' : 'Gender (Optional)'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {GENDER_OPTIONS.map((g) => (
                      <label
                        key={g.value}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                          formData.gender === g.value
                            ? 'border-[#061A3C] bg-blue-50/80 font-bold text-[#061A3C] shadow-xs ring-1 ring-[#061A3C]/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={g.value}
                          checked={formData.gender === g.value}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                          className="text-[#061A3C] focus:ring-[#061A3C]"
                        />
                        <span>{lang === 'mr' ? g.mr : g.en}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Location Details */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-full bg-[#061A3C] text-amber-400 text-xs font-bold flex items-center justify-center font-sans">
                  २
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900">
                  {lang === 'mr' ? 'पत्ता व कार्यक्षेत्र (Residence & Location)' : 'Residence & Location'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Village / Town */}
                <div>
                  <label
                    htmlFor="volunteer-village"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr' ? 'गाव / शहर *' : 'Village / Town *'}
                  </label>
                  <input
                    id="volunteer-village"
                    type="text"
                    required
                    placeholder={lang === 'mr' ? 'उदा. नादरपूर / कन्नड' : 'e.g. Nadarpur / Kannad'}
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    aria-invalid={Boolean(errors.village)}
                    aria-describedby={errors.village ? 'village-error' : undefined}
                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all ${
                      errors.village ? 'border-rose-400 ring-1 ring-rose-400' : 'border-slate-200'
                    }`}
                  />
                  {errors.village && (
                    <p id="village-error" role="alert" className="mt-1.5 text-xs text-rose-600 font-medium">
                      {errors.village}
                    </p>
                  )}
                </div>

                {/* Taluka */}
                <div>
                  <label
                    htmlFor="volunteer-taluka"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr' ? 'तालुका *' : 'Taluka *'}
                  </label>
                  <input
                    id="volunteer-taluka"
                    type="text"
                    required
                    placeholder={lang === 'mr' ? 'कन्नड' : 'Kannad'}
                    value={formData.taluka || ''}
                    onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all"
                  />
                </div>

                {/* District */}
                <div>
                  <label
                    htmlFor="volunteer-district"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr' ? 'जिल्हा *' : 'District *'}
                  </label>
                  <input
                    id="volunteer-district"
                    type="text"
                    required
                    placeholder={lang === 'mr' ? 'छत्रपती संभाजीनगर' : 'Chhatrapati Sambhajinagar'}
                    value={formData.district || ''}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Interests and Availability */}
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-6 h-6 rounded-full bg-[#061A3C] text-amber-400 text-xs font-bold flex items-center justify-center font-sans">
                  ३
                </div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-slate-900">
                  {lang === 'mr' ? 'आवडते कार्यक्षेत्र व वेळ (Interests & Availability)' : 'Interests & Availability'}
                </h3>
              </div>

              <div className="space-y-6">
                {/* Areas of Interest Multi-select */}
                <div>
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {lang === 'mr'
                      ? 'कोणत्या क्षेत्रात काम करण्यास उत्सुक आहात? (किमान १ निवडा) *'
                      : 'Areas You Wish to Contribute In (Select at least 1) *'}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {INTEREST_OPTIONS.map((item) => {
                      const isChecked = formData.areasOfInterest.includes(item.id);
                      const IconComponent = item.icon;
                      return (
                        <label
                          key={item.id}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer text-xs transition-all ${
                            isChecked
                              ? 'border-[#061A3C] bg-blue-50/90 text-[#061A3C] font-semibold shadow-xs ring-1 ring-[#061A3C]/20'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleInterest(item.id)}
                            className="mt-0.5 rounded text-[#061A3C] focus:ring-[#061A3C] h-4 w-4 shrink-0"
                          />
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <IconComponent className={`w-3.5 h-3.5 ${isChecked ? 'text-blue-600' : 'text-slate-400'}`} />
                              <span className="font-medium">{lang === 'mr' ? item.mr : item.en}</span>
                            </div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  {errors.areasOfInterest && (
                    <p role="alert" className="mt-2 text-xs text-rose-600 font-medium">
                      {errors.areasOfInterest}
                    </p>
                  )}
                </div>

                {/* Availability */}
                <div>
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    {lang === 'mr' ? 'उपलब्धता (When can you contribute?)' : 'Availability / Schedule'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {AVAILABILITY_OPTIONS.map((avail) => (
                      <label
                        key={avail.value}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                          formData.availability === avail.value
                            ? 'border-[#061A3C] bg-blue-50/80 font-bold text-[#061A3C] shadow-xs ring-1 ring-[#061A3C]/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-white hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="availability"
                          value={avail.value}
                          checked={formData.availability === avail.value}
                          onChange={(e) => setFormData({ ...formData, availability: e.target.value })}
                          className="text-[#061A3C] focus:ring-[#061A3C]"
                        />
                        <span>{lang === 'mr' ? avail.mr : avail.en}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Message / Motivation */}
                <div>
                  <label
                    htmlFor="volunteer-message"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    {lang === 'mr'
                      ? 'संक्षिप्त संदेश किंवा पूर्वअनुभव (ऐच्छिक)'
                      : 'Short Motivation or Prior Experience (Optional)'}
                  </label>
                  <textarea
                    id="volunteer-message"
                    rows={3}
                    placeholder={
                      lang === 'mr'
                        ? 'आपला सामाजिक कार्याचा पूर्वअनुभव किंवा संस्थेसोबत काम करण्याबाबत काही सूचना असल्यास लिहा...'
                        : 'Tell us briefly about your past experience or how you would like to help...'
                    }
                    value={formData.message || ''}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#061A3C] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Privacy Consent Checkbox */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  className="mt-1 rounded text-[#061A3C] focus:ring-[#061A3C] h-4 w-4 shrink-0"
                />
                <span className="text-xs text-slate-600 leading-relaxed">
                  {lang === 'mr'
                    ? 'मी संमती देतो/देते की वरील माहिती श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्थेच्या सामाजिक उपक्रम व स्वयंसेवक समन्वयासाठीच वापरली जाईल. संस्थेतर्फे कोणतीही संवेदनशील कागदपत्रे किंवा आर्थिक शुल्क मागितले जात नाही.'
                    : 'I consent to the use of my details solely for volunteer coordination and community initiatives by Shrikrushna Sanstha. The Sanstha never charges fees or requests sensitive identity documents.'}
                </span>
              </label>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {lang === 'mr'
                    ? 'माहिती सुरक्षितता व गोपनीयतेचे काटेकोर पालन केले जाते. तृतीय पक्षांसोबत डेटा शेअर केला जात नाही.'
                    : 'Privacy protected. Data is kept confidential and never shared with third parties.'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-serif font-bold text-white shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer ${
                  submitting
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-[#061A3C] hover:bg-[#0A2540] hover:shadow-xl active:scale-[0.99]'
                }`}
              >
                {submitting ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>{lang === 'mr' ? 'नोंदणी सादर होत आहे...' : 'Submitting Registration...'}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-amber-400" />
                    <span>{lang === 'mr' ? 'स्वयंसेवक नोंदणी सबमिट करा' : 'Submit Volunteer Application'}</span>
                    <ArrowRight className="w-4 h-4 text-amber-400" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Footer Support Banner */}
        <section className="bg-gradient-to-r from-slate-900 via-[#061A3C] to-slate-900 rounded-2xl p-6 sm:p-8 text-white border border-amber-500/20 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                <HelpCircle className="w-4 h-4" />
                <span>
                  {lang === 'mr' ? 'काही प्रश्न किंवा विचारणा आहे?' : 'Questions or Inquiries?'}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif font-bold text-white">
                {lang === 'mr'
                  ? 'नादरपूर मुख्य कार्यालयाशी थेट संपर्क साधा'
                  : 'Contact Our Nadarpur Central Office'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {lang === 'mr'
                  ? 'स्वयंसेवक सहभाग, शिबिरे किंवा शैक्षणिक उपक्रमांबाबत अधिक माहितीसाठी आमच्या प्रशासकीय कक्षाशी थेट फोन किंवा संपर्क फॉर्मद्वारे संपर्क साधा.'
                  : 'For more details regarding volunteering, upcoming medical camps, or educational initiatives, reach out directly to our administration.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentRoute('initiatives')}
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>{lang === 'mr' ? 'आमचे उपक्रम पाहा' : 'View Initiatives'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentRoute('contact')}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                <span>{lang === 'mr' ? 'कार्यालयाशी संपर्क साधा' : 'Contact Office'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
