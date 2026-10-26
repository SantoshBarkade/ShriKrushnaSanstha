/**
 * Pure validation and filtering logic for ShriKrushna Sanstha
 * Adheres to rural bandwidth, 5-minute video constraint, sanitization, and category indexing.
 */

export interface VideoValidationInput {
  name: string;
  sizeBytes: number;
  durationSeconds?: number;
  mimeType: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
}

/**
 * Validates video uploads strictly adhering to:
 * - 5 minute maximum duration (300 seconds)
 * - Supported video mime types
 * - Size budget constraints (max 150MB per video to prevent server/storage blowup within ₹5,000 budget)
 */
export function validateVideoFile(input: VideoValidationInput): ValidationResult {
  const MAX_DURATION_SECONDS = 300; // 5 minutes
  const MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB
  const ALLOWED_MIME_TYPES = [
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'video/x-matroska',
  ];

  if (!input.name || input.name.trim() === '') {
    return {
      isValid: false,
      error: 'व्हिडिओ फाईलचे नाव अवैध आहे (Invalid file name)',
      code: 'INVALID_NAME',
    };
  }

  // Mime type check
  const isAllowedMime = ALLOWED_MIME_TYPES.some(
    (t) => input.mimeType.toLowerCase().startsWith(t) || input.name.toLowerCase().endsWith('.mp4') || input.name.toLowerCase().endsWith('.webm')
  );

  if (!isAllowedMime) {
    return {
      isValid: false,
      error: 'केवळ MP4, WebM किंवा MOV फॉरमॅटमधील व्हिडिओ अनुमत आहेत.',
      code: 'UNSUPPORTED_FORMAT',
    };
  }

  // File size check
  if (input.sizeBytes <= 0) {
    return {
      isValid: false,
      error: 'फाईल रिकामी आहे (Empty file).',
      code: 'EMPTY_FILE',
    };
  }

  if (input.sizeBytes > MAX_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'व्हिडिओचा आकार १५० MB पेक्षा जास्त असू नये. (Max size 150MB)',
      code: 'FILE_TOO_LARGE',
    };
  }

  // Duration check (if known from browser metadata / server inspection)
  if (input.durationSeconds !== undefined) {
    if (input.durationSeconds <= 0) {
      return {
        isValid: false,
        error: 'व्हिडिओचा कालावधी अवैध आहे.',
        code: 'INVALID_DURATION',
      };
    }
    if (input.durationSeconds > MAX_DURATION_SECONDS) {
      return {
        isValid: false,
        error: `व्हिडिओ कमाल ५ मिनिटांचा (३०० सेकंद) असावा. हा व्हिडिओ ${Math.round(input.durationSeconds)} सेकंदांचा आहे.`,
        code: 'DURATION_EXCEEDED',
      };
    }
  }

  return { isValid: true };
}

/**
 * Sanitizes input text by removing potentially malicious tags or scripts.
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

export interface ContactFormData {
  name: string;
  contact: string; // phone or email
  subject: string;
  message: string;
}

export interface ContactValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof ContactFormData, string>>;
  sanitized: ContactFormData;
}

/**
 * Validates and sanitizes contact form submissions
 */
export function validateContactForm(data: ContactFormData): ContactValidationResult {
  const sanitized: ContactFormData = {
    name: sanitizeText(data.name || ''),
    contact: sanitizeText(data.contact || ''),
    subject: sanitizeText(data.subject || ''),
    message: sanitizeText(data.message || ''),
  };

  const errors: Partial<Record<keyof ContactFormData, string>> = {};

  if (!sanitized.name || sanitized.name.length < 2) {
    errors.name = 'कृपया तुमचे पूर्ण नाव प्रविष्ट करा (किमान २ अक्षरे).';
  }

  if (!sanitized.contact) {
    errors.contact = 'कृपया संपर्क क्रमांक किंवा ईमेल पत्ता प्रविष्ट करा.';
  } else {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.contact);
    const isIndianPhone = /^(\+91[\s-]?)?[6789]\d{9}$/.test(sanitized.contact.replace(/[\s-]/g, ''));
    if (!isEmail && !isIndianPhone) {
      errors.contact = 'वैध १०-अंकी भारतीय मोबाईल क्रमांक किंवा वैध ईमेल पत्ता प्रविष्ट करा.';
    }
  }

  if (!sanitized.subject || sanitized.subject.length < 3) {
    errors.subject = 'कृपया संदेशाचा विषय लिहा (किमान ३ अक्षरे).';
  }

  if (!sanitized.message || sanitized.message.length < 5) {
    errors.message = 'कृपया तुमचा सविस्तर संदेश लिहा (किमान ५ अक्षरे).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

export interface VolunteerFormData {
  fullName: string;
  phone: string;
  email?: string;
  village: string;
  taluka?: string;
  district?: string;
  ageBracket?: string;
  gender?: string;
  areasOfInterest: string[];
  availability?: string;
  message?: string;
}

export interface VolunteerValidationResult {
  isValid: boolean;
  errors: Partial<Record<keyof VolunteerFormData, string>>;
  sanitized: VolunteerFormData;
}

/**
 * Validates and sanitizes volunteer registration submissions
 */
export function validateVolunteerForm(data: VolunteerFormData): VolunteerValidationResult {
  const sanitized: VolunteerFormData = {
    fullName: sanitizeText(data.fullName || ''),
    phone: sanitizeText(data.phone || '').replace(/[\s-]/g, ''),
    email: data.email ? sanitizeText(data.email).trim() : '',
    village: sanitizeText(data.village || ''),
    taluka: sanitizeText(data.taluka || 'कन्नड'),
    district: sanitizeText(data.district || 'छत्रपती संभाजीनगर'),
    ageBracket: data.ageBracket ? sanitizeText(data.ageBracket) : '',
    gender: data.gender ? sanitizeText(data.gender) : '',
    areasOfInterest: Array.isArray(data.areasOfInterest)
      ? data.areasOfInterest.map((a) => sanitizeText(a)).filter(Boolean)
      : [],
    availability: data.availability ? sanitizeText(data.availability) : '',
    message: data.message ? sanitizeText(data.message) : '',
  };

  const errors: Partial<Record<keyof VolunteerFormData, string>> = {};

  if (!sanitized.fullName || sanitized.fullName.length < 2) {
    errors.fullName = 'कृपया तुमचे पूर्ण नाव प्रविष्ट करा (किमान २ अक्षरे).';
  }

  if (!sanitized.phone) {
    errors.phone = 'कृपया मोबाईल क्रमांक प्रविष्ट करा.';
  } else {
    const isIndianPhone = /^(\+91)?[6789]\d{9}$/.test(sanitized.phone);
    if (!isIndianPhone) {
      errors.phone = 'कृपया वैध १०-अंकी भारतीय मोबाईल क्रमांक प्रविष्ट करा.';
    }
  }

  if (sanitized.email) {
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized.email);
    if (!isEmail) {
      errors.email = 'कृपया वैध ईमेल पत्ता प्रविष्ट करा किंवा रिकामे ठेवा.';
    }
  }

  if (!sanitized.village || sanitized.village.length < 2) {
    errors.village = 'कृपया गाव / शहर प्रविष्ट करा.';
  }

  if (sanitized.areasOfInterest.length === 0) {
    errors.areasOfInterest = 'कृपया किमान एक आवडते क्षेत्र निवडा.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
}

/**
 * Search and category filter matching for items
 */
export function filterContentList<T extends {
  title: string;
  category?: string;
  description?: string;
  date?: string;
}>(items: T[], query: string, category: string): T[] {
  const normalizedQuery = (query || '').toLowerCase().trim();
  const normalizedCat = (category || 'all').toLowerCase().trim();

  return items.filter((item) => {
    // Category check
    if (normalizedCat !== 'all' && normalizedCat !== 'सर्व') {
      const itemCat = (item.category || '').toLowerCase().trim();
      if (itemCat !== normalizedCat) {
        return false;
      }
    }

    // Query check
    if (!normalizedQuery) return true;

    const inTitle = (item.title || '').toLowerCase().includes(normalizedQuery);
    const inDesc = (item.description || '').toLowerCase().includes(normalizedQuery);
    const inCat = (item.category || '').toLowerCase().includes(normalizedQuery);

    return inTitle || inDesc || inCat;
  });
}

export {
  isYouTubeUrl,
  isDirectVideoUrl,
  isValidHttpUrl,
  validateVideoSourceUrl,
  type VideoSourceChoice,
  type VideoUrlValidationResult,
} from './youtube.ts';

/**
 * Determines whether a report PDF URL is valid, real, and downloadable.
 * Returns false if URL is missing, empty, or '#'.
 */
export function isReportPdfAvailable(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  return trimmed !== '' && trimmed !== '#' && trimmed !== 'javascript:void(0)';
}

/**
 * Returns the appropriate bilingual notice message when a report PDF is unavailable.
 */
export function getReportUnavailableNotice(reportTitle: string, lang: 'mr' | 'en'): string {
  const safeTitle = (reportTitle || '').trim();
  return lang === 'mr'
    ? `'${safeTitle}' या अहवालाची डिजिटल प्रत (PDF) लवकरच उपलब्ध होईल.`
    : `The digital PDF copy for '${safeTitle}' will be available soon.`;
}


