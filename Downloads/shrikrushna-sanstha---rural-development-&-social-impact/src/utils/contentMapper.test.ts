import test from 'node:test';
import assert from 'node:assert/strict';
import { INITIAL_SANSTHA_DATA } from '../data/initialData.ts';
import {
  toBoolean,
  parseTags,
  formatTags,
  mapOfficialFromDb,
  mapOfficialToDb,
  mapInitiativeFromDb,
  mapInitiativeToDb,
  mapGalleryPhotoFromDb,
  mapGalleryPhotoToDb,
  mapVideoFromDb,
  mapVideoToDb,
  mapReportFromDb,
  mapReportToDb,
  mapAnnouncementFromDb,
  mapAnnouncementToDb,
  mapContactInfoFromDb,
  mapContactInfoToDb,
  mapSchemeFromDb,
  mapSchemeToDb,
  mapPublicContentPayload,
} from './contentMapper.ts';
import type {
  DbOfficialRow,
  DbInitiativeRow,
  DbGalleryPhotoRow,
  DbVideoRow,
  DbReportRow,
  DbAnnouncementRow,
  DbContactInfoRow,
  DbGovernmentSchemeRow,
} from './contentMapper.ts';

// ============================================================================
// Helper Tests
// ============================================================================

test('toBoolean correctly coerces numbers, booleans, and string representations', () => {
  assert.equal(toBoolean(1), true);
  assert.equal(toBoolean(0), false);
  assert.equal(toBoolean('1'), true);
  assert.equal(toBoolean('0'), false);
  assert.equal(toBoolean('true'), true);
  assert.equal(toBoolean('false'), false);
  assert.equal(toBoolean(true), true);
  assert.equal(toBoolean(false), false);
  assert.equal(toBoolean(undefined, true), true);
  assert.equal(toBoolean(null, false), false);
});

test('parseTags and formatTags handle CSV strings and arrays cleanly', () => {
  const tagsStr = '  CSC बाल विद्यालय, RTE २५% प्रवेश ,  शासकीय योजना  ';
  const parsed = parseTags(tagsStr);
  assert.deepEqual(parsed, ['CSC बाल विद्यालय', 'RTE २५% प्रवेश', 'शासकीय योजना']);

  const formatted = formatTags(parsed);
  assert.equal(formatted, 'CSC बाल विद्यालय, RTE २५% प्रवेश, शासकीय योजना');

  assert.deepEqual(parseTags(null), []);
  assert.deepEqual(parseTags(''), []);
  assert.equal(formatTags([]), '');
});

// ============================================================================
// Entity Mapper Tests
// ============================================================================

test('mapOfficialFromDb and mapOfficialToDb preserve independent Marathi and English values', () => {
  const dbRow: DbOfficialRow = {
    id: 'off-1',
    name_mr: 'श्रीमती सविता दिलीप निकम',
    name_en: 'Smt. Savita Dilip Nikam',
    role_mr: 'सचिव व मुख्य प्रवर्तक',
    role_en: 'Secretary & Chief Promoter',
    bio_mr: 'ग्रामीण विकास व महिला सक्षमीकरण.',
    bio_en: 'Rural development and women empowerment.',
    phone: '+91 9923512482',
    image_url: 'https://example.com/savita.jpg',
    published: 1,
  };

  const mapped = mapOfficialFromDb(dbRow);
  assert.equal(mapped.id, 'off-1');
  assert.equal(mapped.name, 'श्रीमती सविता दिलीप निकम');
  assert.equal(mapped.nameEn, 'Smt. Savita Dilip Nikam');
  assert.equal(mapped.role, 'सचिव व मुख्य प्रवर्तक');
  assert.equal(mapped.roleEn, 'Secretary & Chief Promoter');
  assert.equal(mapped.bio, 'ग्रामीण विकास व महिला सक्षमीकरण.');
  assert.equal(mapped.bioEn, 'Rural development and women empowerment.');
  assert.equal(mapped.phone, '+91 9923512482');
  assert.equal(mapped.published, true);

  // Reverse mapping
  const backToDb = mapOfficialToDb(mapped, 1);
  assert.equal(backToDb.id, 'off-1');
  assert.equal(backToDb.name_mr, 'श्रीमती सविता दिलीप निकम');
  assert.equal(backToDb.name_en, 'Smt. Savita Dilip Nikam');
  assert.equal(backToDb.role_mr, 'सचिव व मुख्य प्रवर्तक');
  assert.equal(backToDb.role_en, 'Secretary & Chief Promoter');
  assert.equal(backToDb.display_order, 1);
  assert.equal(backToDb.published, 1);

  // Verify that an empty English field is NOT overwritten with Marathi
  const dbRowMissingEn: DbOfficialRow = {
    ...dbRow,
    name_en: '',
    role_en: '',
    bio_en: null,
  };
  const mappedMissingEn = mapOfficialFromDb(dbRowMissingEn);
  assert.equal(mappedMissingEn.nameEn, '');
  assert.equal(mappedMissingEn.roleEn, '');
  assert.equal(mappedMissingEn.bioEn, undefined);
  assert.notEqual(mappedMissingEn.nameEn, mappedMissingEn.name);
});

test('mapInitiativeFromDb and mapInitiativeToDb handle child photos, tags, and scheme flags', () => {
  const dbRow: DbInitiativeRow = {
    id: 'init-1',
    title_mr: 'CSC बाल विद्यालय',
    title_en: 'CSC Bal Vidyalaya',
    category: 'शिक्षण',
    activity_date: '२०२५-०१-१५',
    location_mr: 'नादरपूर',
    location_en: 'Nadarpur',
    summary_mr: 'खेळातून शिक्षण.',
    summary_en: 'Joyful learning.',
    description_mr: 'सविस्तर माहिती.',
    description_en: 'Detailed info.',
    image_url: 'https://example.com/cover.jpg',
    is_govt_scheme: 0,
    published: 1,
    featured: 1,
    related_report_id: 'rep-1',
    tags: 'बाल विद्यालय, मॉडेल लॅब',
  };

  const additionalPhotos = [
    { initiative_id: 'init-1', image_url: 'https://example.com/extra1.jpg' },
    { initiative_id: 'init-1', image_url: 'https://example.com/extra2.jpg' },
  ];

  const mapped = mapInitiativeFromDb(dbRow, additionalPhotos);
  assert.equal(mapped.id, 'init-1');
  assert.equal(mapped.title, 'CSC बाल विद्यालय');
  assert.equal(mapped.titleEn, 'CSC Bal Vidyalaya');
  assert.equal(mapped.category, 'शिक्षण');
  assert.equal(mapped.isGovernmentSchemeAwareness, false);
  assert.equal(mapped.published, true);
  assert.equal(mapped.featured, true);
  assert.equal(mapped.relatedReportId, 'rep-1');
  assert.deepEqual(mapped.tags, ['बाल विद्यालय', 'मॉडेल लॅब']);
  assert.deepEqual(mapped.images, [
    'https://example.com/extra1.jpg',
    'https://example.com/extra2.jpg',
  ]);

  const { initiative, photos } = mapInitiativeToDb(mapped, 2);
  assert.equal(initiative.id, 'init-1');
  assert.equal(initiative.title_mr, 'CSC बाल विद्यालय');
  assert.equal(initiative.title_en, 'CSC Bal Vidyalaya');
  assert.equal(initiative.is_govt_scheme, 0);
  assert.equal(initiative.display_order, 2);
  assert.equal(initiative.tags, 'बाल विद्यालय, मॉडेल लॅब');
  assert.deepEqual(photos, [
    'https://example.com/extra1.jpg',
    'https://example.com/extra2.jpg',
  ]);
});

test('mapGalleryPhotoFromDb maps album relationships and homepage featured flags', () => {
  const dbRow: DbGalleryPhotoRow = {
    id: 'gal-1',
    album_id: 'alb-1',
    activity_id: 'init-1',
    title_mr: 'चित्र १',
    title_en: 'Photo 1',
    caption_mr: 'कॅप्शन',
    caption_en: 'Caption',
    alt_text_mr: 'वर्णन',
    alt_text_en: 'Description',
    category: 'शिक्षण',
    image_url: 'https://example.com/photo.jpg',
    year: 2025,
    featured_on_home: 1,
    published: 1,
  };

  const mapped = mapGalleryPhotoFromDb(dbRow);
  assert.equal(mapped.id, 'gal-1');
  assert.equal(mapped.activityId, 'init-1');
  assert.equal(mapped.featuredOnHome, true);
  assert.equal(mapped.published, true);
  assert.equal(mapped.year, 2025);
  assert.equal(mapped.title, 'चित्र १');
  assert.equal(mapped.titleEn, 'Photo 1');

  const backToDb = mapGalleryPhotoToDb(mapped);
  assert.equal(backToDb.id, 'gal-1');
  assert.equal(backToDb.activity_id, 'init-1');
  assert.equal(backToDb.featured_on_home, 1);
  assert.equal(backToDb.published, 1);
});

test('mapVideoFromDb maps video metadata and bilingual duration', () => {
  const dbRow: DbVideoRow = {
    id: 'vid-1',
    title_mr: 'व्हिडिओ १',
    title_en: 'Video 1',
    description_mr: 'माहितीपट वर्णन',
    description_en: 'Documentary description',
    category: 'शिक्षण',
    duration_seconds: 195,
    duration_formatted: '०३:१५',
    duration_formatted_en: '03:15',
    thumbnail_url: 'https://example.com/thumb.jpg',
    video_url: 'https://example.com/video.mp4',
    publish_date: '२०२५-०१-२०',
    related_activity_title: 'CSC बाल विद्यालय',
    published: 1,
    featured: 1,
  };

  const mapped = mapVideoFromDb(dbRow);
  assert.equal(mapped.id, 'vid-1');
  assert.equal(mapped.durationSeconds, 195);
  assert.equal(mapped.durationFormatted, '०३:१५');
  assert.equal(mapped.durationFormattedEn, '03:15');
  assert.equal(mapped.published, true);
  assert.equal(mapped.featured, true);
  assert.equal(mapped.relatedActivityTitle, 'CSC बाल विद्यालय');

  const backToDb = mapVideoToDb(mapped);
  assert.equal(backToDb.id, 'vid-1');
  assert.equal(backToDb.duration_seconds, 195);
  assert.equal(backToDb.duration_formatted, '०३:१५');
  assert.equal(backToDb.duration_formatted_en, '03:15');
});

test('mapReportFromDb maps publication and PDF disclosures', () => {
  const dbRow: DbReportRow = {
    id: 'rep-1',
    title_mr: 'वार्षिक अहवाल',
    title_en: 'Annual Report',
    period_mr: 'वर्ष २०२४-२५',
    period_en: 'Year 2024-25',
    report_date: '२०२५-०३-१५',
    file_size: '1.8 MB PDF',
    category_mr: 'वार्षिक अहवाल',
    category_en: 'Annual Report',
    summary_mr: 'अहवाल सारांश',
    summary_en: 'Report summary',
    pdf_url: 'https://example.com/annual.pdf',
    cover_image_url: 'https://example.com/cover.jpg',
    published: 1,
  };

  const mapped = mapReportFromDb(dbRow);
  assert.equal(mapped.id, 'rep-1');
  assert.equal(mapped.period, 'वर्ष २०२४-२५');
  assert.equal(mapped.periodEn, 'Year 2024-25');
  assert.equal(mapped.fileSize, '1.8 MB PDF');
  assert.equal(mapped.pdfPlaceholderUrl, 'https://example.com/annual.pdf');
  assert.equal(mapped.coverImageUrl, 'https://example.com/cover.jpg');

  const backToDb = mapReportToDb(mapped);
  assert.equal(backToDb.id, 'rep-1');
  assert.equal(backToDb.pdf_url, 'https://example.com/annual.pdf');
  assert.equal(backToDb.published, 1);
});

test('mapAnnouncementFromDb maps upcoming status and bilingual event dates', () => {
  const dbRow: DbAnnouncementRow = {
    id: 'ann-1',
    title_mr: 'प्रवेश मार्गदर्शन शिबीर',
    title_en: 'Admission Guidance Camp',
    event_date_mr: '२५ मार्च २०२५',
    event_date_en: 'March 25, 2025',
    is_upcoming: 1,
    category: 'शिक्षण',
    summary_mr: 'मार्गदर्शन सारांश',
    summary_en: 'Guidance summary',
    content_mr: 'संपूर्ण बातमी तपशील',
    content_en: 'Full news details',
    cover_image_url: 'https://example.com/event.jpg',
    published: 1,
  };

  const mapped = mapAnnouncementFromDb(dbRow);
  assert.equal(mapped.id, 'ann-1');
  assert.equal(mapped.isUpcoming, true);
  assert.equal(mapped.date, '२५ मार्च २०२५');
  assert.equal(mapped.dateEn, 'March 25, 2025');
  assert.equal(mapped.published, true);

  const backToDb = mapAnnouncementToDb(mapped);
  assert.equal(backToDb.id, 'ann-1');
  assert.equal(backToDb.is_upcoming, 1);
  assert.equal(backToDb.event_date_mr, '२५ मार्च २०२५');
  assert.equal(backToDb.event_date_en, 'March 25, 2025');
});

test('mapContactInfoFromDb maps institutional contact details with verified placeholder', () => {
  const dbRow: DbContactInfoRow = {
    id: 1,
    phone: '+91 9923512482',
    email: 'test@example.com',
    address_mr: 'मु. पो. नादरपूर, ता. कन्नड',
    address_en: 'At Post Nadarpur, Tahsil Kannad',
    taluka_mr: 'कन्नड',
    taluka_en: 'Kannad',
    district_mr: 'छत्रपती संभाजीनगर',
    district_en: 'Chhatrapati Sambhajinagar',
    visiting_hours_mr: 'सकाळी १० ते संध्याकाळी ६',
    visiting_hours_en: '10 AM to 6 PM',
  };

  const mapped = mapContactInfoFromDb(dbRow);
  assert.equal(mapped.phone, '+91 9923512482');
  assert.equal(mapped.email, 'test@example.com');
  assert.equal(mapped.address, 'मु. पो. नादरपूर, ता. कन्नड');
  assert.equal(mapped.addressEn, 'At Post Nadarpur, Tahsil Kannad');
  assert.equal(mapped.isVerifiedPlaceholder, true);

  const backToDb = mapContactInfoToDb(mapped);
  assert.equal(backToDb.phone, '+91 9923512482');
  assert.equal(backToDb.address_mr, 'मु. पो. नादरपूर, ता. कन्नड');
  assert.equal(backToDb.address_en, 'At Post Nadarpur, Tahsil Kannad');
});

test('mapSchemeFromDb segregates Government Welfare Schemes from Sanstha initiatives', () => {
  const schemeRow: DbGovernmentSchemeRow = {
    id: 'scheme-sanjay-gandhi',
    title_mr: 'संजय गांधी निराधार अनुदान योजना',
    title_en: 'Sanjay Gandhi Niradhar Scheme',
    department_mr: 'सामाजिक न्याय विभाग',
    department_en: 'Department of Social Justice',
    beneficiary_category_mr: 'निराधार व दिव्यांग',
    beneficiary_category_en: 'Destitute and Disabled',
    summary_mr: 'मासिक आर्थिक सहाय्य.',
    summary_en: 'Monthly financial assistance.',
    official_portal_url: 'https://sjsa.maharashtra.gov.in',
    published: 1,
    featured: 1,
  };

  const mapped = mapSchemeFromDb(schemeRow);
  assert.equal(mapped.id, 'scheme-sanjay-gandhi');
  assert.equal(mapped.title, 'संजय गांधी निराधार अनुदान योजना');
  assert.equal(mapped.titleEn, 'Sanjay Gandhi Niradhar Scheme');
  assert.equal(mapped.department, 'सामाजिक न्याय विभाग');
  assert.equal(mapped.departmentEn, 'Department of Social Justice');
  assert.equal(mapped.officialPortalUrl, 'https://sjsa.maharashtra.gov.in');
  assert.equal(mapped.published, true);
  assert.equal(mapped.featured, true);

  const backToDb = mapSchemeToDb(mapped);
  assert.equal(backToDb.id, 'scheme-sanjay-gandhi');
  assert.equal(backToDb.title_mr, 'संजय गांधी निराधार अनुदान योजना');
  assert.equal(backToDb.published, 1);
});

test('mapPublicContentPayload correctly maps unified backend payload and keeps schemes separate', () => {
  const backendPayload = {
    status: 'success',
    success: true,
    isAdminPreview: false,
    data: {
      officials: [
        {
          id: 'off-1',
          name_mr: 'सविता निकम',
          name_en: 'Savita Nikam',
          role_mr: 'सचिव',
          role_en: 'Secretary',
          image_url: 'https://example.com/s.jpg',
          published: 1,
        },
      ],
      initiatives: [
        {
          id: 'init-1',
          title_mr: 'बाल विद्यालय',
          title_en: 'Bal Vidyalaya',
          category: 'शिक्षण',
          activity_date: '२०२५-०१-१५',
          summary_mr: 'सारांश',
          summary_en: 'Summary',
          description_mr: 'वर्णन',
          description_en: 'Desc',
          image_url: 'https://example.com/i.jpg',
          published: 1,
          photos: [{ initiative_id: 'init-1', image_url: 'https://example.com/i1.jpg' }],
        },
      ],
      gallery: [
        {
          id: 'gal-1',
          title_mr: 'छायाचित्र',
          title_en: 'Photo',
          caption_mr: 'कॅप्शन',
          caption_en: 'Caption',
          category: 'शिक्षण',
          image_url: 'https://example.com/g.jpg',
          published: 1,
        },
      ],
      videos: [
        {
          id: 'vid-1',
          title_mr: 'व्हिडिओ',
          title_en: 'Video',
          description_mr: 'वर्णन',
          description_en: 'Desc',
          category: 'शिक्षण',
          thumbnail_url: 'https://example.com/t.jpg',
          video_url: 'https://example.com/v.mp4',
          publish_date: '२०२५-०१-२०',
          published: 1,
        },
      ],
      reports: [
        {
          id: 'rep-1',
          title_mr: 'अहवाल',
          title_en: 'Report',
          period_mr: '२०२४-२५',
          period_en: '2024-25',
          report_date: '२०२५-०३-१५',
          category_mr: 'वार्षिक',
          category_en: 'Annual',
          summary_mr: 'सारांश',
          summary_en: 'Summary',
          pdf_url: '#',
          published: 1,
        },
      ],
      announcements: [
        {
          id: 'ann-1',
          title_mr: 'सूचना',
          title_en: 'Notice',
          event_date_mr: '२५ मार्च',
          event_date_en: 'March 25',
          category: 'शिक्षण',
          summary_mr: 'सारांश',
          summary_en: 'Summary',
          content_mr: 'तपशील',
          content_en: 'Details',
          published: 1,
        },
      ],
      contactInfo: {
        id: 1,
        phone: '+91 9923512482',
        address_mr: 'नादरपूर',
        address_en: 'Nadarpur',
      },
      governmentSchemes: [
        {
          id: 'scheme-sanjay-gandhi',
          title_mr: 'संजय गांधी निराधार योजना',
          title_en: 'Sanjay Gandhi Niradhar Scheme',
          summary_mr: 'आर्थिक सहाय्य',
          summary_en: 'Financial assistance',
          published: 1,
        },
      ],
      siteSettings: [
        {
          key_name: 'hero_badge',
          value_mr: 'नोंदणीकृत संस्था',
          value_en: 'Registered NGO',
        },
      ],
    },
  };

  const mapped = mapPublicContentPayload(backendPayload);

  assert.equal(mapped.isAdminPreview, false);
  assert.equal(mapped.sansthaState.officials?.length, 1);
  assert.equal(mapped.sansthaState.officials?.[0].name, 'सविता निकम');
  assert.equal(mapped.sansthaState.initiatives?.length, 1);
  assert.equal(mapped.sansthaState.initiatives?.[0].images?.[0], 'https://example.com/i1.jpg');

  // Verify government schemes are segregated in their own property, NOT mixed into initiatives
  assert.equal(mapped.governmentSchemes.length, 1);
  assert.equal(mapped.governmentSchemes[0].id, 'scheme-sanjay-gandhi');
  assert.equal(mapped.sansthaState.initiatives?.[0].id, 'init-1');

  // Verify government schemes are also present in sansthaState.governmentSchemes
  assert.equal(mapped.sansthaState.governmentSchemes?.length, 1);
  assert.equal(mapped.sansthaState.governmentSchemes?.[0].id, 'scheme-sanjay-gandhi');

  // Verify site settings mapping
  assert.equal(mapped.siteSettings.hero_badge.mr, 'नोंदणीकृत संस्था');
  assert.equal(mapped.siteSettings.hero_badge.en, 'Registered NGO');
});

test('INITIAL_SANSTHA_DATA contains verified governmentSchemes with independent bilingual fields', () => {
  assert.ok(Array.isArray(INITIAL_SANSTHA_DATA.governmentSchemes));
  assert.equal(INITIAL_SANSTHA_DATA.governmentSchemes.length, 3);

  const schemeIds = INITIAL_SANSTHA_DATA.governmentSchemes.map((s: any) => s.id);
  assert.deepEqual(schemeIds, ['scheme-sanjay-gandhi', 'scheme-shravanbal', 'scheme-eshram']);

  // Verify schemes are NOT mixed into initiatives
  const initiativeIds = INITIAL_SANSTHA_DATA.initiatives.map((i: any) => i.id);
  schemeIds.forEach((id: string) => {
    assert.equal(initiativeIds.includes(id), false, `Scheme ${id} must not be in initiatives`);
  });

  // Verify Marathi and English independence
  INITIAL_SANSTHA_DATA.governmentSchemes.forEach((scheme: any) => {
    assert.ok(scheme.title.length > 0, `Scheme ${scheme.id} must have title`);
    assert.ok(scheme.titleEn.length > 0, `Scheme ${scheme.id} must have titleEn`);
    assert.notEqual(scheme.title, scheme.titleEn, `Scheme ${scheme.id} title and titleEn must be independent`);
    assert.equal(scheme.published, true);
  });
});

