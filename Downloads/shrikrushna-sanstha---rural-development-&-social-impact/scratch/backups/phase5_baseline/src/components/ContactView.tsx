import React, { useState } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { validateContactForm, ContactFormData } from '../utils/validation';
import { ApiClient } from '../services/apiClient';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  FileText,
  User,
  HeartHandshake,
  ChevronRight,
  ExternalLink,
  Building2,
  Sparkles,
  HelpCircle,
  FileCheck2,
  Lock
} from 'lucide-react';

export const ContactView: React.FC = () => {
  const { state, setCurrentRoute, t, lang } = useSanstha();

  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    contact: '',
    subject: '',
    message: '',
  });

  const [agreePrivacy, setAgreePrivacy] = useState(true);
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; referenceId?: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setSuccessInfo(null);

    // Client-side validation using existing trusted validator
    const validation = validateContactForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (!agreePrivacy) {
      setServerError(
        lang === 'mr'
          ? 'कृपया संपर्क माहिती सुरक्षिततेच्या अटी मान्य करा.'
          : 'Please agree to the privacy notice before submitting.'
      );
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      const result = await ApiClient.submitInquiry({
        ...validation.sanitized,
        website: honeypot || undefined,
      });

      setSuccessInfo({
        message:
          lang === 'mr'
            ? 'आपला संदेश यशस्वीरित्या नोंदवला गेला आहे. आमचे प्रतिनिधी लवकरच आपल्याशी संपर्क साधतील.'
            : result.message || 'Your inquiry has been successfully registered.',
        referenceId: (result.id || result.data?.id) ? `INQ-${result.id || result.data?.id}` : undefined,
      });
      setFormData({ name: '', contact: '', subject: '', message: '' });
      setHoneypot('');
    } catch (err: any) {
      setServerError(
        err.message ||
          (lang === 'mr'
            ? 'संदेश पाठवताना त्रुटी आली. कृपया पुन्हा प्रयत्न करा.'
            : 'Error submitting message. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  const address =
    lang === 'mr'
      ? state.contactInfo.address
      : state.contactInfo.addressEn || state.contactInfo.address;

  const visitingHours =
    lang === 'mr'
      ? state.contactInfo.visitingHours
      : state.contactInfo.visitingHoursEn || state.contactInfo.visitingHours;

  const taluka =
    lang === 'mr'
      ? state.contactInfo.taluka
      : state.contactInfo.talukaEn || state.contactInfo.taluka;

  const district =
    lang === 'mr'
      ? state.contactInfo.district
      : state.contactInfo.districtEn || state.contactInfo.district;

  // Split multiple phone numbers so each gets an independent valid tel: link
  const phoneNumbers = (state.contactInfo.phone || '')
    .split(/[,/]/)
    .map((p) => p.trim())
    .filter(Boolean);

  // Split multiple emails if present
  const emailAddresses = (state.contactInfo.email || '')
    .split(/[,/]/)
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased selection:bg-[#0868C9] selection:text-white">
      {/* 1. Breadcrumbs & Institutional Status Bar */}
      <section className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-slate-500 font-medium">
            <button
              onClick={() => setCurrentRoute('home')}
              className="hover:text-[#061A3C] transition-colors cursor-pointer flex items-center gap-1"
            >
              <span>{t.nav.home}</span>
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[#061A3C] font-semibold">{t.nav.contact}</span>
          </nav>

          {/* Institutional Location Indicator */}
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>
                {lang === 'mr' ? 'सक्रिय सचिवालय व मदत कक्ष' : 'Active Secretariat Helpdesk'}
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#061A3C] via-[#0A2540] to-[#0D2E4D] text-white py-12 sm:py-16 lg:py-20 border-b border-slate-800 shadow-inner">
        {/* Subtle Decorative Geometry */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-500/30 to-transparent blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-gradient-to-tl from-amber-400/20 to-transparent blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Institutional Verification Badge */}
          <div className="inline-flex flex-wrap items-center gap-2 sm:gap-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-xs sm:text-sm font-medium text-slate-200 shadow-sm">
            <span className="text-[#E52E3D] font-serif font-bold tracking-wide">॥ श्रीकृष्णाय नमः ॥</span>
            <span className="text-white/40">•</span>
            <span className="text-amber-300 font-semibold">
              {lang === 'mr' ? 'रजि. क्र.: एक १४६६८ (औ)' : 'Reg: Ek 14668 (A)'}
            </span>
            <span className="hidden md:inline text-white/40">•</span>
            <span className="hidden md:inline text-slate-300">
              {lang === 'mr' ? 'नीति आयोग Darpan: MH/2023/0365444' : 'NITI Aayog Darpan: MH/2023/0365444'}
            </span>
            <span className="hidden lg:inline text-white/40">•</span>
            <span className="hidden lg:inline text-slate-300">
              {lang === 'mr' ? 'नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर' : 'Nadarpur, Kannad, Dist. Chhatrapati Sambhajinagar'}
            </span>
          </div>

          {/* Hero Titles */}
          <div className="max-w-4xl space-y-3">
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold tracking-normal text-white leading-tight">
              {t.contactView.title}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-slate-300 leading-relaxed font-sans font-normal max-w-3xl">
              {t.contactView.subtitle}
            </p>
          </div>

          {/* Quick Credibility Strip */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-300">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'mr' ? '१००% मोफत व पारदर्शक मार्गदर्शन' : '100% Free Public Guidance'}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <Clock className="w-4 h-4 text-amber-300" />
              <span>{visitingHours}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>{lang === 'mr' ? 'सचिवालय संपर्क डेस्क' : 'Official Secretariat Desk'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Content: Contact Cards & Inquiry Form */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left Column: Official Administrative Office Information (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 space-y-6 shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0868C9]">
                  {lang === 'mr' ? 'सचिवालय संपर्क' : 'Headquarters Secretariat'}
                </span>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#061A3C] mt-1">
                  {lang === 'mr' ? 'अधिकृत कार्यालयीन तपशील' : 'Official Administrative Office'}
                </h2>
              </div>

              <div className="space-y-5 text-xs sm:text-sm font-sans text-slate-700">
                {/* Physical Address */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0868C9] border border-blue-200/70 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:bg-[#061A3C] group-hover:text-white transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <strong className="block text-[#061A3C] font-bold mb-0.5">
                      {t.footer.addressLabel}
                    </strong>
                    <span className="leading-relaxed">{address}</span>
                    <div className="mt-0.5 text-xs text-slate-500 font-medium">
                      {taluka}, {district}, {state.contactInfo.state}
                    </div>
                    <a
                      href="https://www.google.com/maps/search/?api=1&query=Nadarpur+Kannad+Chhatrapati+Sambhajinagar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0868C9] hover:underline mt-1.5"
                    >
                      <span>{lang === 'mr' ? 'गुगल मॅपवर पाहा' : 'View on Google Maps'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Visiting Hours */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-200/70 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:bg-[#061A3C] group-hover:text-white transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#061A3C] font-bold mb-0.5">
                      {t.footer.hoursLabel}
                    </strong>
                    <span className="leading-relaxed">{visitingHours}</span>
                    <span className="block text-xs text-slate-500 mt-0.5 font-medium">
                      {lang === 'mr'
                        ? '(सोमवार ते शनिवार, रविवार व शासकीय सुट्टी वगळून)'
                        : '(Monday to Saturday, excluding Sundays & Public Holidays)'}
                    </span>
                  </div>
                </div>

                {/* Phone Links */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:bg-[#061A3C] group-hover:text-white transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#061A3C] font-bold mb-0.5">
                      {lang === 'mr' ? 'संपर्क दूरध्वनी:' : 'Contact Phone:'}
                    </strong>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {phoneNumbers.map((num, idx) => {
                        const cleanTel = num.replace(/[^0-9+]/g, '');
                        return (
                          <React.Fragment key={idx}>
                            <a
                              href={`tel:${cleanTel}`}
                              className="font-mono text-slate-800 hover:text-[#0868C9] font-semibold tracking-wide transition-colors inline-block"
                            >
                              {num}
                            </a>
                            {idx < phoneNumbers.length - 1 && (
                              <span className="text-slate-400 font-medium select-none">•</span>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-0.5 font-medium">
                      {lang === 'mr' ? 'कार्यालयीन वेळेत थेट संपर्क' : 'Direct line during office hours'}
                    </span>
                  </div>
                </div>

                {/* Email Links */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 border border-sky-200/70 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:bg-[#061A3C] group-hover:text-white transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-[#061A3C] font-bold mb-0.5">
                      {lang === 'mr' ? 'अधिकृत ईमेल:' : 'Official Email:'}
                    </strong>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {emailAddresses.map((em, idx) => (
                        <a
                          key={idx}
                          href={`mailto:${em}`}
                          className="font-mono text-[#0868C9] hover:underline font-semibold break-all inline-block"
                        >
                          {em}
                        </a>
                      ))}
                    </div>
                    <span className="block text-[11px] text-slate-500 mt-0.5 font-medium">
                      {lang === 'mr' ? 'पत्रव्यवहार व योजना माहिती' : 'Official correspondence & scheme inquiries'}
                    </span>
                  </div>
                </div>

                {/* Registration Number */}
                {(state.contactInfo.regNoMr || state.contactInfo.regNoEn) && (
                  <div className="flex items-start gap-3.5 pt-3 border-t border-slate-100">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-[#0868C9]" />
                    </div>
                    <div>
                      <strong className="block text-[#061A3C] font-bold mb-0.5">
                        {lang === 'mr' ? 'धर्मादाय आयुक्त नोंदणी क्र.:' : 'Charity Commissioner Reg. No:'}
                      </strong>
                      <span className="font-mono text-slate-700 font-semibold">
                        {lang === 'mr'
                          ? state.contactInfo.regNoMr || state.contactInfo.regNoEn
                          : state.contactInfo.regNoEn || state.contactInfo.regNoMr}
                      </span>
                    </div>
                  </div>
                )}

                {/* Secretary Name */}
                {(state.contactInfo.secretaryNameMr || state.contactInfo.secretaryNameEn) && (
                  <div className="flex items-start gap-3.5 pt-2">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-[#E52E3D]" />
                    </div>
                    <div>
                      <strong className="block text-[#061A3C] font-bold mb-0.5">
                        {lang === 'mr' ? 'सचिव व मुख्य प्रवर्तक:' : 'Secretary & Chief Promoter:'}
                      </strong>
                      <span className="text-slate-800 font-medium">
                        {lang === 'mr'
                          ? state.contactInfo.secretaryNameMr || state.contactInfo.secretaryNameEn
                          : state.contactInfo.secretaryNameEn || state.contactInfo.secretaryNameMr}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Statutory Transparency Badge */}
            <div className="bg-gradient-to-br from-blue-50/70 to-slate-50 border border-blue-200/60 rounded-2xl p-5 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-[#0868C9] font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>{lang === 'mr' ? 'शासकीय व कायदेशीर बांधिलकी' : 'Statutory Transparency'}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                {lang === 'mr'
                  ? 'सर्व तक्रारी व विचारणांची नोंद संस्थेच्या सचिवालय नोंदवहीत केली जाते आणि धर्मादाय आयुक्त नियमांनुसार नागरिकांना विनामूल्य सहकार्य दिले जाते.'
                  : 'All public inquiries are officially logged in the secretariat register and free citizen guidance is provided under statutory public trust guidelines.'}
              </p>
            </div>
          </div>

          {/* Right Column: Citizen Inquiry Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 lg:p-10 space-y-6 shadow-md hover:shadow-xl transition-shadow duration-300">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0868C9]">
                  {lang === 'mr' ? 'थेट संदेश प्रणाली' : 'Direct Message System'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#061A3C] mt-1">
                  {t.contactView.formTitle}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                  {t.contactView.formDesc}
                </p>
              </div>

              {/* Success Notification */}
              {successInfo && (
                <div
                  role="status"
                  aria-live="polite"
                  className="p-5 bg-emerald-50 border border-emerald-300 rounded-xl space-y-1.5 shadow-xs animate-in fade-in duration-300"
                >
                  <div className="flex items-start gap-2.5 text-emerald-900 font-bold text-xs sm:text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span>{successInfo.message}</span>
                      {successInfo.referenceId && (
                        <div className="text-xs text-emerald-800 font-mono font-medium mt-1">
                          {lang === 'mr' ? 'संदर्भ क्रमांक:' : 'Reference ID:'}{' '}
                          <span className="font-bold bg-white/80 px-2 py-0.5 rounded border border-emerald-300/60">
                            {successInfo.referenceId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Error Notification */}
              {serverError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-4 bg-rose-50 border border-rose-300 text-rose-800 rounded-xl text-xs flex items-center gap-2.5 shadow-xs animate-in fade-in duration-300"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* Contact Form */}
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
                {/* Invisible Honeypot field for bot spam protection */}
                <div className="hidden" aria-hidden="true" style={{ display: 'none' }}>
                  <label htmlFor="contact-website-hp">Website</label>
                  <input
                    id="contact-website-hp"
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                {/* Name Field */}
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-bold text-[#061A3C] mb-1.5">
                    {t.contactView.nameLabel} <span className="text-[#E52E3D]">*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? 'name-error' : undefined}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'mr' ? 'उदा. ज्ञानेश्वर पाटील' : 'e.g. Ramesh Patil'}
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0868C9] focus:bg-white transition-all shadow-inner ${
                      errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.name && (
                    <p id="name-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.name}</span>
                    </p>
                  )}
                </div>

                {/* Contact Phone or Email Field */}
                <div>
                  <label htmlFor="contact-info" className="block text-xs font-bold text-[#061A3C] mb-1.5">
                    {t.contactView.contactLabel} <span className="text-[#E52E3D]">*</span>
                  </label>
                  <input
                    id="contact-info"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.contact)}
                    aria-describedby={errors.contact ? 'contact-error' : undefined}
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder={
                      lang === 'mr'
                        ? 'उदा. 98XXXXXXXX किंवा patil@example.com'
                        : 'e.g. 98XXXXXXXX or name@example.com'
                    }
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0868C9] focus:bg-white transition-all shadow-inner ${
                      errors.contact ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.contact && (
                    <p id="contact-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.contact}</span>
                    </p>
                  )}
                </div>

                {/* Subject Field */}
                <div>
                  <label htmlFor="contact-subject" className="block text-xs font-bold text-[#061A3C] mb-1.5">
                    {t.contactView.subjectLabel} <span className="text-[#E52E3D]">*</span>
                  </label>
                  <input
                    id="contact-subject"
                    type="text"
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.subject)}
                    aria-describedby={errors.subject ? 'subject-error' : undefined}
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder={
                      lang === 'mr'
                        ? 'उदा. शासकीय योजना मार्गदर्शन / बाल विद्यालय प्रवेश / आरोग्य शिबीर'
                        : 'e.g. Welfare Scheme Guidance / School Admission'
                    }
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0868C9] focus:bg-white transition-all shadow-inner ${
                      errors.subject ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.subject && (
                    <p id="subject-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.subject}</span>
                    </p>
                  )}
                </div>

                {/* Message Field */}
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-bold text-[#061A3C] mb-1.5">
                    {t.contactView.messageLabel} <span className="text-[#E52E3D]">*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    required
                    aria-required="true"
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder={
                      lang === 'mr'
                        ? 'आपला सविस्तर संदेश किंवा चौकशी येथे लिहा...'
                        : 'Type your detailed inquiry or message here...'
                    }
                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0868C9] focus:bg-white transition-all shadow-inner resize-y ${
                      errors.message ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200'
                    }`}
                  />
                  {errors.message && (
                    <p id="message-error" className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                {/* Privacy Agreement Checkbox */}
                <div className="flex items-start gap-3 pt-1">
                  <input
                    type="checkbox"
                    id="privacy-consent"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-[#0868C9] border-slate-300 focus:ring-[#0868C9] cursor-pointer"
                  />
                  <label
                    htmlFor="privacy-consent"
                    className="text-xs text-slate-600 leading-relaxed cursor-pointer font-sans select-none"
                  >
                    {t.contactView.privacyAgree}{' '}
                    <button
                      type="button"
                      onClick={() => setCurrentRoute('privacy')}
                      className="text-[#0868C9] underline hover:text-[#061A3C] font-semibold cursor-pointer inline-flex items-center gap-0.5 ml-1"
                    >
                      <span>{lang === 'mr' ? 'गोपनीयता धोरण' : 'Privacy Policy'}</span>
                    </button>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#061A3C] to-[#0A2540] hover:from-[#0A2540] hover:to-[#061A3C] text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#0868C9]"
                  >
                    {submitting ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 text-amber-300" />
                    )}
                    <span>{submitting ? t.contactView.submittingBtn : t.contactView.submitBtn}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Volunteer CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20">
        <div className="bg-gradient-to-r from-[#061A3C] via-[#0A2540] to-[#061A3C] rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl border border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-300 border border-white/20 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-base sm:text-lg">
                {lang === 'mr' ? 'संस्थेसोबत स्वयंसेवक म्हणून कार्य करू इच्छिता?' : 'Want to join us as a Volunteer?'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5 font-sans">
                {lang === 'mr'
                  ? 'ग्रामीण विकास, शिक्षण, आरोग्य शिबिरे व सामाजिक जनजागृती उपक्रमांत आपले योगदान द्या.'
                  : 'Contribute to rural development, education, health camps, and social awareness programs.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentRoute('volunteer')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-[#061A3C] hover:bg-slate-100 transition-all text-xs font-bold shrink-0 cursor-pointer shadow-md inline-flex items-center justify-center gap-2"
          >
            <span>{lang === 'mr' ? 'स्वयंसेवक नोंदणी करा' : 'Register as Volunteer'}</span>
            <ChevronRight className="w-4 h-4 text-[#0868C9]" />
          </button>
        </div>
      </section>
    </div>
  );
};
