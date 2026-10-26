import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVideoFile,
  sanitizeText,
  validateContactForm,
  filterContentList,
} from './validation.ts';

test('validateVideoFile accepts compliant MP4 under 5 minutes', () => {
  const result = validateVideoFile({
    name: 'gramin_shikshan_karya.mp4',
    sizeBytes: 15 * 1024 * 1024,
    durationSeconds: 180, // 3 minutes
    mimeType: 'video/mp4',
  });
  assert.equal(result.isValid, true);
  assert.equal(result.error, undefined);
});

test('validateVideoFile rejects video exceeding 5-minute (300 sec) hard limit', () => {
  const result = validateVideoFile({
    name: 'gramin_shikshan_long.mp4',
    sizeBytes: 50 * 1024 * 1024,
    durationSeconds: 320, // > 5 minutes
    mimeType: 'video/mp4',
  });
  assert.equal(result.isValid, false);
  assert.equal(result.code, 'DURATION_EXCEEDED');
  assert.match(result.error || '', /कमाल ५ मिनिटांचा/);
});

test('validateVideoFile rejects unsupported video format', () => {
  const result = validateVideoFile({
    name: 'video.exe',
    sizeBytes: 5 * 1024 * 1024,
    durationSeconds: 60,
    mimeType: 'application/octet-stream',
  });
  assert.equal(result.isValid, false);
  assert.equal(result.code, 'UNSUPPORTED_FORMAT');
});

test('validateVideoFile rejects files exceeding 150MB budget limit', () => {
  const result = validateVideoFile({
    name: 'huge_documentary.mp4',
    sizeBytes: 200 * 1024 * 1024,
    durationSeconds: 240,
    mimeType: 'video/mp4',
  });
  assert.equal(result.isValid, false);
  assert.equal(result.code, 'FILE_TOO_LARGE');
});

test('sanitizeText strips dangerous tags and scripts', () => {
  const raw = '<script>alert("hack")</script><b>सुप्रभात</b>';
  const clean = sanitizeText(raw);
  assert.equal(clean, 'सुप्रभात');
});

test('validateContactForm checks required fields and formats', () => {
  // Empty test
  const emptyRes = validateContactForm({
    name: '',
    contact: '',
    subject: '',
    message: '',
  });
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.errors.name);
  assert.ok(emptyRes.errors.contact);

  // Valid with Indian phone
  const phoneRes = validateContactForm({
    name: 'रमेश जाधव',
    contact: '9822012345',
    subject: 'आरोग्य शिबीर चौकशी',
    message: 'पुढील आरोग्य शिबीर कोणत्या गावात होणार आहे?',
  });
  assert.equal(phoneRes.isValid, true);
  assert.equal(phoneRes.sanitized.name, 'रमेश जाधव');

  // Valid with Email
  const emailRes = validateContactForm({
    name: 'सुप्रिया पाटील',
    contact: 'supriya@example.com',
    subject: 'डिजिटल साक्षरता उपक्रम',
    message: 'आमच्या शाळेत संगणक साक्षरता उपक्रम राबवता येईल का?',
  });
  assert.equal(emailRes.isValid, true);
});

test('filterContentList filters by category and search query correctly', () => {
  const items = [
    { title: 'ग्राम स्वच्छता मोहीम', category: 'पर्यावरण संवर्धन', description: 'कचरा व्यवस्थापन' },
    { title: 'विद्यार्थी ग्रंथालय प्रकल्प', category: 'शिक्षण', description: 'पुस्तके वाटप' },
    { title: 'संजय गांधी निराधार योजना मदत', category: 'शासकीय योजना जनजागृती', description: 'अर्ज मार्गदर्शन शिबीर' },
  ];

  const searchRes = filterContentList(items, 'ग्रंथालय', 'all');
  assert.equal(searchRes.length, 1);
  assert.equal(searchRes[0].title, 'विद्यार्थी ग्रंथालय प्रकल्प');

  const catRes = filterContentList(items, '', 'शिक्षण');
  assert.equal(catRes.length, 1);
  assert.equal(catRes[0].category, 'शिक्षण');

  const emptyMatch = filterContentList(items, 'अनपेक्षित', 'all');
  assert.equal(emptyMatch.length, 0);
});

/* =====================================================================
   DUAL VIDEO SOURCE SUPPORT & BILINGUAL DATA PRESERVATION TESTS
===================================================================== */

import {
  getYouTubeId,
  isYouTubeUrl,
  isDirectVideoUrl,
  getYouTubeEmbedUrl,
  validateVideoSourceUrl,
} from './youtube.ts';

test('YouTube URL handling: parses valid formats correctly', () => {
  // 1. Standard watch URL
  assert.equal(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), true);

  // 2. Short URL
  assert.equal(getYouTubeId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ'), true);

  // 3. Embed URL
  assert.equal(getYouTubeId('https://www.youtube.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(isYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ'), true);

  // 4. Shorts URL
  assert.equal(getYouTubeId('https://www.youtube.com/shorts/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(isYouTubeUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ'), true);

  // 5. Mobile URL
  assert.equal(getYouTubeId('https://m.youtube.com/watch?v=dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
  assert.equal(isYouTubeUrl('https://m.youtube.com/watch?v=dQw4w9WgXcQ'), true);

  // Privacy-enhanced embed URL
  assert.equal(getYouTubeId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');

  // Query parameter handling
  assert.equal(getYouTubeId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=45s'), 'dQw4w9WgXcQ');
  assert.equal(getYouTubeId('https://youtu.be/dQw4w9WgXcQ?feature=share'), 'dQw4w9WgXcQ');
});

test('YouTube URL handling: rejects invalid, deceptive, and unsupported URLs', () => {
  // 6. Malformed YouTube URL (invalid ID length/format)
  assert.equal(getYouTubeId('https://www.youtube.com/watch?v=invalid_short'), null);
  assert.equal(isYouTubeUrl('https://www.youtube.com/watch?v=invalid_short'), false);

  // 7. Empty video ID
  assert.equal(getYouTubeId('https://www.youtube.com/watch?v='), null);
  assert.equal(getYouTubeId('https://youtu.be/'), null);

  // 8. Non-YouTube hostname containing "youtube.com" as a substring
  assert.equal(getYouTubeId('https://evil-youtube.com/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(getYouTubeId('https://attacker.com/youtube.com/v/dQw4w9WgXcQ'), null);
  assert.equal(isYouTubeUrl('https://attacker.com/youtube.com/v/dQw4w9WgXcQ'), false);

  // 9. Unsupported protocol
  assert.equal(getYouTubeId('javascript:alert(1)'), null);
  assert.equal(getYouTubeId('data:text/html,<script>'), null);

  // 10. Empty input
  assert.equal(getYouTubeId(''), null);
  assert.equal(getYouTubeId(null), null);
  assert.equal(getYouTubeId(undefined), null);
});

test('Direct video URL validation: accepts supported HTTPS media formats', () => {
  // 1. Valid HTTPS MP4 URL
  assert.equal(isDirectVideoUrl('https://example.com/videos/community.mp4'), true);

  // 2. Valid HTTPS WebM URL
  assert.equal(isDirectVideoUrl('https://example.com/media/event.webm'), true);

  // 3. Valid HTTPS MOV URL
  assert.equal(isDirectVideoUrl('https://example.com/media/event.mov'), true);

  // 4. Valid HTTPS M4V URL
  assert.equal(isDirectVideoUrl('https://example.com/media/event.m4v'), true);

  // 5. Valid URL with query parameters
  assert.equal(isDirectVideoUrl('https://cdn.example.com/video.mp4?token=xyz123&exp=456'), true);
});

test('Direct video URL validation: rejects invalid, HTTP, non-media, or dangerous URLs', () => {
  // 6. Invalid absolute URL
  assert.equal(isDirectVideoUrl('not-a-url'), false);
  assert.equal(isDirectVideoUrl('just-text.mp4'), false);

  // 7. Unsupported file extension
  assert.equal(isDirectVideoUrl('https://example.com/page.html'), false);
  assert.equal(isDirectVideoUrl('https://example.com/doc.pdf'), false);

  // 8. HTTP URL (unsafe for production embed)
  assert.equal(isDirectVideoUrl('http://example.com/video.mp4'), false);

  // 9. javascript: URL
  assert.equal(isDirectVideoUrl('javascript:alert(1)'), false);

  // 10. URL with deceptive query/extension
  assert.equal(isDirectVideoUrl('https://example.com/watch?v=VIDEO_ID'), false);
});

test('validateVideoSourceUrl enforces source selection and provides bilingual feedback', () => {
  // Option A: Admin chooses YouTube
  const ytValid = validateVideoSourceUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube');
  assert.equal(ytValid.isValid, true);
  assert.equal(ytValid.sourceType, 'youtube');

  // Admin chooses YouTube but enters direct MP4 URL
  const ytMismatch = validateVideoSourceUrl('https://example.com/video.mp4', 'youtube');
  assert.equal(ytMismatch.isValid, false);
  assert.equal(ytMismatch.sourceType, 'direct');
  assert.ok(ytMismatch.errorMr?.includes('थेट व्हिडिओ फाईल लिंक'));
  assert.ok(ytMismatch.errorEn?.includes('direct video file'));

  // Option B: Admin chooses Direct Video (MP4)
  const mp4Valid = validateVideoSourceUrl('https://example.com/event.mp4', 'direct');
  assert.equal(mp4Valid.isValid, true);
  assert.equal(mp4Valid.sourceType, 'direct');

  // Admin chooses Direct Video but enters YouTube URL
  const mp4Mismatch = validateVideoSourceUrl('https://youtu.be/dQw4w9WgXcQ', 'direct');
  assert.equal(mp4Mismatch.isValid, false);
  assert.equal(mp4Mismatch.sourceType, 'youtube');
  assert.ok(mp4Mismatch.errorMr?.includes('YouTube लिंक'));
  assert.ok(mp4Mismatch.errorEn?.includes('YouTube'));

  // Empty URL check
  const emptyRes = validateVideoSourceUrl('', 'youtube');
  assert.equal(emptyRes.isValid, false);
  assert.ok(emptyRes.errorMr);
  assert.ok(emptyRes.errorEn);

  // Auto-detection
  assert.equal(validateVideoSourceUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ').sourceType, 'youtube');
  assert.equal(validateVideoSourceUrl('https://example.com/event.mp4').sourceType, 'direct');
  assert.equal(validateVideoSourceUrl('https://example.com/invalid').isValid, false);
});

test('Privacy-enhanced YouTube embed URL generation', () => {
  const embed = getYouTubeEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', false);
  assert.equal(embed, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1');

  const embedAutoplay = getYouTubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ', true);
  assert.equal(embedAutoplay, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&modestbranding=1&autoplay=1');

  const invalidEmbed = getYouTubeEmbedUrl('https://example.com/video.mp4');
  assert.equal(invalidEmbed, null);
});

test('Bilingual preservation: editing video payload preserves English title and description without overwrite', () => {
  // Existing database record with independent Marathi and English values
  const existingRecord = {
    id: 'vid-1',
    title: 'CSC बाल विद्यालय उपक्रम',
    titleEn: 'CSC Bal Vidyalaya Joyful Learning',
    description: 'ग्रामीण शिक्षण उपक्रम माहिती',
    descriptionEn: 'Rural education initiative details',
    category: 'शिक्षण' as const,
    durationSeconds: 195,
    durationFormatted: '०३:१५',
    durationFormattedEn: '03:15',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    date: '2025-01-20',
    published: true,
    featured: true,
  };

  // Simulating Admin form update where user modifies Marathi title, leaving English intact
  const updatedFormState = {
    title: 'CSC बाल विद्यालय व मॉडेल लॅब',
    titleEn: '', // Not typed anew; should fall back to existingRecord.titleEn
    description: 'अद्ययावत माहिती',
    descriptionEn: '', // Should fall back to existingRecord.descriptionEn
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  };

  const payload = {
    title: updatedFormState.title.trim(),
    titleEn: updatedFormState.titleEn.trim() || (existingRecord.titleEn ?? updatedFormState.title.trim()),
    description: updatedFormState.description.trim() || (existingRecord.description ?? updatedFormState.title.trim()),
    descriptionEn: updatedFormState.descriptionEn.trim() || (existingRecord.descriptionEn ?? (updatedFormState.description.trim() || updatedFormState.title.trim())),
    category: existingRecord.category,
    durationSeconds: existingRecord.durationSeconds,
    durationFormatted: existingRecord.durationFormatted,
    durationFormattedEn: existingRecord.durationFormattedEn,
    videoUrl: updatedFormState.videoUrl.trim(),
    thumbnailUrl: existingRecord.thumbnailUrl,
    date: existingRecord.date,
    published: existingRecord.published,
    featured: existingRecord.featured,
  };

  // Assert English title and description were NOT overwritten by Marathi text
  assert.equal(payload.title, 'CSC बाल विद्यालय व मॉडेल लॅब');
  assert.equal(payload.titleEn, 'CSC Bal Vidyalaya Joyful Learning');
  assert.equal(payload.description, 'अद्ययावत माहिती');
  assert.equal(payload.descriptionEn, 'Rural education initiative details');
  assert.notEqual(payload.titleEn, payload.title);
  assert.notEqual(payload.descriptionEn, payload.description);
});

