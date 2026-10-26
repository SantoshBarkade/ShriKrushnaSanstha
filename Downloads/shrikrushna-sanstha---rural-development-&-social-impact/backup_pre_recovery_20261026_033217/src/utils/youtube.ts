/**
 * YouTube & Direct Video URL Parser, Thumbnail Resolver & Embed/Validation Utilities
 * Supports standard watch URLs, youtu.be short links, embeds, YouTube shorts, and direct MP4/WebM/MOV/M4V files.
 */

const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

const VALID_YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
]);

const DIRECT_VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.m4v'];

export function isValidHttpUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') {
      return null;
    }

    const host = parsed.hostname.toLowerCase();
    if (!VALID_YOUTUBE_HOSTS.has(host)) {
      return null;
    }

    // Handle youtu.be/<id>
    if (host === 'youtu.be') {
      const id = parsed.pathname.slice(1).split('/')[0].split('?')[0];
      return YOUTUBE_ID_REGEX.test(id) ? id : null;
    }

    // Handle youtube.com/watch?v=<id>
    if (parsed.pathname === '/watch') {
      const v = parsed.searchParams.get('v');
      return v && YOUTUBE_ID_REGEX.test(v) ? v : null;
    }

    // Handle youtube.com/embed/<id>
    if (parsed.pathname.startsWith('/embed/')) {
      const id = parsed.pathname.slice(7).split('/')[0].split('?')[0];
      return YOUTUBE_ID_REGEX.test(id) ? id : null;
    }

    // Handle youtube.com/shorts/<id>
    if (parsed.pathname.startsWith('/shorts/')) {
      const id = parsed.pathname.slice(8).split('/')[0].split('?')[0];
      return YOUTUBE_ID_REGEX.test(id) ? id : null;
    }

    // Handle youtube.com/v/<id>
    if (parsed.pathname.startsWith('/v/')) {
      const id = parsed.pathname.slice(3).split('/')[0].split('?')[0];
      return YOUTUBE_ID_REGEX.test(id) ? id : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function isYouTubeUrl(url?: string | null): boolean {
  return getYouTubeId(url) !== null;
}

export function isDirectVideoUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol !== 'https:') {
      return false;
    }
    const pathname = parsed.pathname.toLowerCase();
    return DIRECT_VIDEO_EXTENSIONS.some((ext) => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

export function getYouTubeThumbnail(url?: string | null): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

export function getYouTubeEmbedUrl(url?: string | null, autoplay = false): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1${
    autoplay ? '&autoplay=1' : ''
  }`;
}

export type VideoSourceChoice = 'youtube' | 'direct' | 'auto';

export interface VideoUrlValidationResult {
  isValid: boolean;
  sourceType: 'youtube' | 'direct' | 'invalid';
  errorMr?: string;
  errorEn?: string;
}

export function validateVideoSourceUrl(
  url?: string | null,
  expectedSource: VideoSourceChoice = 'auto'
): VideoUrlValidationResult {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      sourceType: 'invalid',
      errorMr: 'कृपया व्हिडिओ लिंक (URL) प्रविष्ट करा.',
      errorEn: 'Please enter a video URL.',
    };
  }

  const trimmed = url.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      sourceType: 'invalid',
      errorMr: 'अवैध व्हिडिओ लिंक. कृपया संपूर्ण वैध URL प्रविष्ट करा (उदा. https://...).',
      errorEn: 'Invalid video link. Please enter a complete valid URL (e.g. https://...).',
    };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'https:' && protocol !== 'http:') {
    return {
      isValid: false,
      sourceType: 'invalid',
      errorMr: 'केवळ HTTPS किंवा HTTP व्हिडिओ लिंक्स अनुमत आहेत.',
      errorEn: 'Only HTTPS or HTTP video links are supported.',
    };
  }

  if (protocol !== 'https:') {
    return {
      isValid: false,
      sourceType: 'invalid',
      errorMr: 'सुरक्षेसाठी कृपया सुरक्षित HTTPS व्हिडिओ लिंक वापरा.',
      errorEn: 'For security, please use a secure HTTPS video link.',
    };
  }

  const isYt = isYouTubeUrl(trimmed);
  const isDirect = isDirectVideoUrl(trimmed);

  if (expectedSource === 'youtube') {
    if (isYt) {
      return { isValid: true, sourceType: 'youtube' };
    }
    if (isDirect) {
      return {
        isValid: false,
        sourceType: 'direct',
        errorMr: 'ही थेट व्हिडिओ फाईल लिंक आहे. कृपया वरील "थेट व्हिडिओ लिंक (MP4)" पर्याय निवडा.',
        errorEn: 'This is a direct video file link. Please select the "Direct Video URL (MP4)" option above.',
      };
    }
    return {
      isValid: false,
      sourceType: 'invalid',
      errorMr: 'अवैध YouTube लिंक. कृपया वैध youtube.com किंवा youtu.be लिंक प्रविष्ट करा.',
      errorEn: 'Invalid YouTube link. Please enter a valid youtube.com or youtu.be URL.',
    };
  }

  if (expectedSource === 'direct') {
    if (isDirect) {
      return { isValid: true, sourceType: 'direct' };
    }
    if (isYt) {
      return {
        isValid: false,
        sourceType: 'youtube',
        errorMr: 'ही YouTube लिंक आहे. कृपया वरील "YouTube व्हिडिओ" पर्याय निवडा.',
        errorEn: 'This is a YouTube link. Please select the "YouTube Video" option above.',
      };
    }
    return {
      isValid: false,
      sourceType: 'invalid',
      errorMr: 'केवळ .mp4, .webm, .mov किंवा .m4v फॉरमॅटमधील थेट व्हिडिओ लिंक अनुमत आहेत.',
      errorEn: 'Only direct video links with .mp4, .webm, .mov, or .m4v extensions are supported.',
    };
  }

  // Auto-detection
  if (isYt) {
    return { isValid: true, sourceType: 'youtube' };
  }
  if (isDirect) {
    return { isValid: true, sourceType: 'direct' };
  }

  return {
    isValid: false,
    sourceType: 'invalid',
    errorMr: 'असमर्थित व्हिडिओ लिंक. कृपया वैध YouTube किंवा थेट .mp4/.webm लिंक प्रविष्ट करा.',
    errorEn: 'Unsupported video link. Please enter a valid YouTube or direct .mp4/.webm URL.',
  };
}
