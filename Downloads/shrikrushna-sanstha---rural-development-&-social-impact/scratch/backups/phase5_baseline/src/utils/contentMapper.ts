/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Bidirectional Content Mapper: SQL Snake_Case <-> TypeScript CamelCase
 *
 * Requirements:
 * 1. Explicit field-by-field mapping between MySQL relational columns and TypeScript interfaces.
 * 2. Strictly preserve independent Marathi and English values without cross-language overwriting.
 * 3. Safe type casting for integers, booleans (TINYINT 1/0), and delimited strings (tags).
 * 4. Keep government welfare schemes catalog strictly segregated from Sanstha initiatives.
 */

import type {
  OfficialItem,
  InitiativeItem,
  EventItem,
  EventPhoto,
  EventStatus,
  GalleryAlbumItem,
  GalleryItem,
  VideoItem,
  ReportItem,
  AnnouncementItem,
  ContactInfo,
  CategoryKey,
  SansthaState,
  GovernmentSchemeItem,
  ContactInquiry,
  InquiryStatus,
  VolunteerRegistration,
  VolunteerStatus,
  SitePageItem,
  PageSectionItem,
  MediaFileItem,
} from '../types/index.ts';

export type { GovernmentSchemeItem, GalleryAlbumItem, EventItem, EventPhoto, EventStatus, SitePageItem, PageSectionItem, MediaFileItem };

// ============================================================================
// Database Row Interface Definitions (Raw SQL Snake_Case)
// ============================================================================

export interface DbOfficialRow {
  id: string;
  name_mr: string;
  name_en: string;
  role_mr: string;
  role_en: string;
  bio_mr?: string | null;
  bio_en?: string | null;
  phone?: string | null;
  image_url: string;
  display_order?: number;
  published?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbInitiativePhotoRow {
  id?: number;
  initiative_id: string;
  image_url: string;
  caption_mr?: string | null;
  caption_en?: string | null;
  display_order?: number;
}

export interface DbInitiativeRow {
  id: string;
  title_mr: string;
  title_en: string;
  category: string;
  activity_date: string;
  location_mr?: string | null;
  location_en?: string | null;
  summary_mr: string;
  summary_en: string;
  description_mr: string;
  description_en: string;
  image_url: string;
  is_govt_scheme?: number | boolean;
  published?: number | boolean;
  featured?: number | boolean;
  related_report_id?: string | null;
  tags?: string | null;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  photos?: DbInitiativePhotoRow[] | string[];
}

export interface DbEventPhotoRow {
  id?: number;
  event_id?: string;
  image_url: string;
  caption_mr?: string | null;
  caption_en?: string | null;
  display_order?: number;
  created_at?: string;
}

export interface DbEventRow {
  id: string;
  title_mr: string;
  title_en: string;
  category: string;
  start_date: string;
  end_date?: string | null;
  event_date_text_mr?: string | null;
  event_date_text_en?: string | null;
  event_time?: string | null;
  venue_mr: string;
  venue_en: string;
  summary_mr: string;
  summary_en: string;
  description_mr: string;
  description_en: string;
  cover_image_url?: string | null;
  status?: string;
  is_featured?: number | boolean;
  published?: number | boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
  photos?: DbEventPhotoRow[] | string[];
}

export interface DbGalleryAlbumRow {
  id: string;
  title_mr: string;
  title_en: string;
  description_mr?: string | null;
  description_en?: string | null;
  category: string;
  cover_image_url?: string | null;
  event_date?: string | null;
  display_mode?: 'grid' | 'carousel' | string;
  display_order?: number;
  published?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbGalleryPhotoRow {
  id: string;
  album_id?: string | null;
  activity_id?: string | null;
  title_mr: string;
  title_en: string;
  caption_mr: string;
  caption_en: string;
  alt_text_mr?: string | null;
  alt_text_en?: string | null;
  category: string;
  image_url: string;
  year?: number | string | null;
  featured_on_home?: number | boolean;
  display_order?: number;
  published?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbVideoRow {
  id: string;
  title_mr: string;
  title_en: string;
  description_mr: string;
  description_en: string;
  category: string;
  duration_seconds?: number | string | null;
  duration_formatted?: string | null;
  duration_formatted_en?: string | null;
  thumbnail_url: string;
  video_url: string;
  publish_date: string;
  related_activity_title?: string | null;
  display_order?: number;
  published?: number | boolean;
  featured?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbReportRow {
  id: string;
  title_mr: string;
  title_en: string;
  period_mr: string;
  period_en: string;
  report_date: string;
  file_size?: string | null;
  category_mr: string;
  category_en: string;
  summary_mr: string;
  summary_en: string;
  pdf_url: string;
  cover_image_url?: string | null;
  file_path?: string | null;
  display_order?: number;
  published?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DbAnnouncementRow {
  id: string;
  title_mr: string;
  title_en: string;
  event_date_mr: string;
  event_date_en: string;
  is_upcoming?: number | boolean;
  category: string;
  summary_mr: string;
  summary_en: string;
  content_mr: string;
  content_en: string;
  cover_image_url?: string | null;
  display_order?: number;
  published?: number | boolean;
  created_at?: string;
  updated_at?: string;
  photos?: string[];
}

export interface DbContactInfoRow {
  id?: number;
  reg_no_mr?: string | null;
  reg_no_en?: string | null;
  secretary_name_mr?: string | null;
  secretary_name_en?: string | null;
  phone?: string | null;
  email?: string | null;
  address_mr: string;
  address_en: string;
  taluka_mr?: string | null;
  taluka_en?: string | null;
  district_mr?: string | null;
  district_en?: string | null;
  visiting_hours_mr?: string | null;
  visiting_hours_en?: string | null;
  updated_at?: string;
}

export interface DbGovernmentSchemeRow {
  id: string;
  title_mr: string;
  title_en: string;
  department_mr?: string | null;
  department_en?: string | null;
  beneficiary_category_mr?: string | null;
  beneficiary_category_en?: string | null;
  summary_mr: string;
  summary_en: string;
  eligibility_mr?: string | null;
  eligibility_en?: string | null;
  documents_required_mr?: string | null;
  documents_required_en?: string | null;
  benefits_mr?: string | null;
  benefits_en?: string | null;
  official_portal_url?: string | null;
  cover_image_url?: string | null;
  display_order?: number;
  published?: number | boolean;
  featured?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

// ============================================================================
// Helper Utilities for Safe Type Coercion
// ============================================================================

export function toBoolean(val: unknown, defaultVal = false): boolean {
  if (val === undefined || val === null) return defaultVal;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === '1' || s === 'true') return true;
    if (s === '0' || s === 'false') return false;
  }
  return defaultVal;
}

export function parseTags(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((t) => String(t).trim()).filter(Boolean);
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function formatTags(tags?: string[]): string {
  if (!tags || !Array.isArray(tags)) return '';
  return tags.map((t) => t.trim()).filter(Boolean).join(', ');
}

// ============================================================================
// 1. OFFICIALS MAPPERS
// ============================================================================

export function mapOfficialFromDb(row: DbOfficialRow): OfficialItem {
  return {
    id: String(row.id || ''),
    name: row.name_mr || '',
    nameEn: row.name_en || '',
    role: row.role_mr || '',
    roleEn: row.role_en || '',
    imageUrl: row.image_url || '',
    bio: row.bio_mr || undefined,
    bioEn: row.bio_en || undefined,
    phone: row.phone || undefined,
    displayOrder: row.display_order !== undefined && row.display_order !== null ? Number(row.display_order) : undefined,
    published: toBoolean(row.published, true),
  };
}

export function mapOfficialToDb(item: OfficialItem, displayOrder = 0): DbOfficialRow {
  return {
    id: item.id,
    name_mr: item.name || '',
    name_en: item.nameEn || '',
    role_mr: item.role || '',
    role_en: item.roleEn || '',
    bio_mr: item.bio || null,
    bio_en: item.bioEn || null,
    phone: item.phone || null,
    image_url: item.imageUrl || '',
    display_order: item.displayOrder !== undefined ? item.displayOrder : displayOrder,
    published: item.published ? 1 : 0,
  };
}

// ============================================================================
// 2. INITIATIVES MAPPERS
// ============================================================================

export function mapInitiativeFromDb(
  row: DbInitiativeRow,
  additionalPhotos?: DbInitiativePhotoRow[] | string[]
): InitiativeItem {
  let images: string[] = [];
  if (Array.isArray(additionalPhotos)) {
    images = additionalPhotos
      .map((p) => (typeof p === 'string' ? p : p?.image_url || ''))
      .filter(Boolean);
  } else if (Array.isArray(row.photos)) {
    images = row.photos
      .map((p) => (typeof p === 'string' ? p : (p as DbInitiativePhotoRow)?.image_url || ''))
      .filter(Boolean);
  }

  return {
    id: String(row.id || ''),
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    category: (row.category || 'सर्व') as CategoryKey,
    date: row.activity_date || '',
    location: row.location_mr || undefined,
    locationEn: row.location_en || undefined,
    summary: row.summary_mr || '',
    summaryEn: row.summary_en || '',
    description: row.description_mr || '',
    descriptionEn: row.description_en || '',
    imageUrl: row.image_url || '',
    images: images.length > 0 ? images : undefined,
    isGovernmentSchemeAwareness: toBoolean(row.is_govt_scheme, false),
    published: toBoolean(row.published, true),
    featured: toBoolean(row.featured, false),
    relatedReportId: row.related_report_id || undefined,
    tags: parseTags(row.tags),
  };
}

export function mapInitiativeToDb(
  item: InitiativeItem,
  displayOrder = 0
): { initiative: DbInitiativeRow; photos: string[] } {
  return {
    initiative: {
      id: item.id,
      title_mr: item.title || '',
      title_en: item.titleEn || '',
      category: item.category || 'शिक्षण',
      activity_date: item.date || '',
      location_mr: item.location || null,
      location_en: item.locationEn || null,
      summary_mr: item.summary || '',
      summary_en: item.summaryEn || '',
      description_mr: item.description || '',
      description_en: item.descriptionEn || '',
      image_url: item.imageUrl || '',
      is_govt_scheme: item.isGovernmentSchemeAwareness ? 1 : 0,
      published: item.published ? 1 : 0,
      featured: item.featured ? 1 : 0,
      related_report_id: item.relatedReportId || null,
      tags: formatTags(item.tags),
      display_order: displayOrder,
    },
    photos: Array.isArray(item.images) ? item.images : [],
  };
}

// ============================================================================
// 3. GALLERY ALBUMS & PHOTOS MAPPERS
// ============================================================================

export function mapGalleryAlbumFromDb(row: DbGalleryAlbumRow): GalleryAlbumItem {
  return {
    id: String(row.id || ''),
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    description: row.description_mr || undefined,
    descriptionEn: row.description_en || undefined,
    category: row.category || 'इतर',
    coverImageUrl: row.cover_image_url || undefined,
    eventDate: row.event_date || undefined,
    displayMode: (row.display_mode === 'carousel' ? 'carousel' : 'grid') as 'grid' | 'carousel',
    displayOrder: row.display_order !== undefined && row.display_order !== null ? Number(row.display_order) : 0,
    published: toBoolean(row.published, true),
  };
}

export function mapGalleryAlbumToDb(item: GalleryAlbumItem, displayOrder = 0): DbGalleryAlbumRow {
  return {
    id: item.id,
    title_mr: item.title || '',
    title_en: item.titleEn || item.title || '',
    description_mr: item.description || null,
    description_en: item.descriptionEn || null,
    category: item.category || 'इतर',
    cover_image_url: item.coverImageUrl || '',
    event_date: item.eventDate || null,
    display_mode: item.displayMode === 'carousel' ? 'carousel' : 'grid',
    display_order: item.displayOrder !== undefined ? item.displayOrder : displayOrder,
    published: item.published ? 1 : 0,
  };
}

export function mapGalleryPhotoFromDb(row: DbGalleryPhotoRow): GalleryItem {
  return {
    id: String(row.id || ''),
    albumId: row.album_id || undefined,
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    caption: row.caption_mr || '',
    captionEn: row.caption_en || '',
    altText: row.alt_text_mr || row.title_mr || '',
    altTextEn: row.alt_text_en || undefined,
    category: (row.category || 'सर्व') as CategoryKey,
    imageUrl: row.image_url || '',
    year: row.year ? Number(row.year) : 2026,
    activityId: row.activity_id || undefined,
    featuredOnHome: toBoolean(row.featured_on_home, false),
    displayOrder: row.display_order !== undefined && row.display_order !== null ? Number(row.display_order) : 0,
    published: toBoolean(row.published, true),
  };
}

export function mapGalleryPhotoToDb(item: GalleryItem, displayOrder = 0): DbGalleryPhotoRow {
  return {
    id: item.id,
    album_id: item.albumId || null,
    activity_id: item.activityId || null,
    title_mr: item.title || '',
    title_en: item.titleEn || item.title || '',
    caption_mr: item.caption || item.title || '',
    caption_en: item.captionEn || item.titleEn || item.title || '',
    alt_text_mr: item.altText || item.title || null,
    alt_text_en: item.altTextEn || item.titleEn || null,
    category: item.category || 'सर्व',
    image_url: item.imageUrl || '',
    year: item.year || 2026,
    featured_on_home: item.featuredOnHome ? 1 : 0,
    display_order: item.displayOrder !== undefined ? item.displayOrder : displayOrder,
    published: item.published ? 1 : 0,
  };
}

// ============================================================================
// 4. VIDEOS MAPPERS
// ============================================================================

export function mapVideoFromDb(row: DbVideoRow): VideoItem {
  return {
    id: String(row.id || ''),
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    description: row.description_mr || '',
    descriptionEn: row.description_en || '',
    category: (row.category || 'शिक्षण') as CategoryKey,
    durationSeconds: row.duration_seconds ? Number(row.duration_seconds) : 180,
    durationFormatted: row.duration_formatted || '०३:००',
    durationFormattedEn: row.duration_formatted_en || '03:00',
    thumbnailUrl: row.thumbnail_url || '',
    videoUrl: row.video_url || '',
    date: row.publish_date || '',
    published: toBoolean(row.published, true),
    featured: toBoolean(row.featured, false),
    relatedActivityTitle: row.related_activity_title || undefined,
  };
}

export function mapVideoToDb(item: VideoItem, displayOrder = 0): DbVideoRow {
  return {
    id: item.id,
    title_mr: item.title || '',
    title_en: item.titleEn || '',
    description_mr: item.description || '',
    description_en: item.descriptionEn || '',
    category: item.category || 'शिक्षण',
    duration_seconds: item.durationSeconds || 180,
    duration_formatted: item.durationFormatted || '०३:००',
    duration_formatted_en: item.durationFormattedEn || '03:00',
    thumbnail_url: item.thumbnailUrl || '',
    video_url: item.videoUrl || '',
    publish_date: item.date || '',
    related_activity_title: item.relatedActivityTitle || null,
    display_order: displayOrder,
    published: item.published ? 1 : 0,
    featured: item.featured ? 1 : 0,
  };
}

// ============================================================================
// 5. REPORTS MAPPERS
// ============================================================================

export function mapReportFromDb(row: DbReportRow): ReportItem {
  return {
    id: String(row.id || ''),
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    period: row.period_mr || '',
    periodEn: row.period_en || '',
    date: row.report_date || '',
    fileSize: row.file_size || '1.8 MB PDF',
    category: row.category_mr || 'अहवाल',
    categoryEn: row.category_en || 'Report',
    summary: row.summary_mr || '',
    summaryEn: row.summary_en || '',
    pdfPlaceholderUrl: row.pdf_url || '#',
    coverImageUrl: row.cover_image_url || undefined,
    published: toBoolean(row.published, true),
  };
}

export function mapReportToDb(item: ReportItem, displayOrder = 0): DbReportRow {
  return {
    id: item.id,
    title_mr: item.title || '',
    title_en: item.titleEn || '',
    period_mr: item.period || '',
    period_en: item.periodEn || '',
    report_date: item.date || '',
    file_size: item.fileSize || '1.8 MB PDF',
    category_mr: item.category || 'वार्षिक अहवाल',
    category_en: item.categoryEn || 'Annual Report',
    summary_mr: item.summary || '',
    summary_en: item.summaryEn || '',
    pdf_url: item.pdfPlaceholderUrl || '#',
    cover_image_url: item.coverImageUrl || null,
    display_order: displayOrder,
    published: item.published ? 1 : 0,
  };
}

// ============================================================================
// 6. ANNOUNCEMENTS MAPPERS
// ============================================================================

export function mapAnnouncementFromDb(
  row: DbAnnouncementRow,
  additionalPhotos?: string[]
): AnnouncementItem {
  const images = Array.isArray(additionalPhotos)
    ? additionalPhotos
    : Array.isArray(row.photos)
    ? row.photos
    : [];

  return {
    id: String(row.id || ''),
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    date: row.event_date_mr || '',
    dateEn: row.event_date_en || undefined,
    isUpcoming: toBoolean(row.is_upcoming, true),
    category: (row.category || 'शिक्षण') as CategoryKey,
    summary: row.summary_mr || '',
    summaryEn: row.summary_en || '',
    content: row.content_mr || '',
    contentEn: row.content_en || '',
    coverImageUrl: row.cover_image_url || undefined,
    images: images.length > 0 ? images : undefined,
    published: toBoolean(row.published, true),
  };
}

export function mapAnnouncementToDb(
  item: AnnouncementItem,
  displayOrder = 0
): DbAnnouncementRow {
  return {
    id: item.id,
    title_mr: item.title || '',
    title_en: item.titleEn || '',
    event_date_mr: item.date || '',
    event_date_en: item.dateEn || item.date || '',
    is_upcoming: item.isUpcoming ? 1 : 0,
    category: item.category || 'शिक्षण',
    summary_mr: item.summary || '',
    summary_en: item.summaryEn || '',
    content_mr: item.content || '',
    content_en: item.contentEn || '',
    cover_image_url: item.coverImageUrl || null,
    display_order: displayOrder,
    published: item.published ? 1 : 0,
  };
}

// ============================================================================
// 6B. EVENTS MAPPERS
// ============================================================================

export function mapEventFromDb(
  row: DbEventRow,
  childPhotos?: DbEventPhotoRow[] | string[]
): EventItem {
  const rawPhotos = childPhotos || row.photos || [];
  const photos: EventPhoto[] = [];
  if (Array.isArray(rawPhotos)) {
    rawPhotos.forEach((p: any, idx: number) => {
      if (typeof p === 'string' && p.trim()) {
        photos.push({
          id: idx + 1,
          eventId: String(row.id || ''),
          imageUrl: p,
          displayOrder: idx + 1,
        });
      } else if (p && typeof p === 'object' && (p.image_url || p.photo_url || p.imageUrl || p.url)) {
        photos.push({
          id: p.id ? Number(p.id) : idx + 1,
          eventId: String(p.event_id || p.eventId || row.id || ''),
          imageUrl: p.image_url || p.imageUrl || p.photo_url || p.url,
          captionMr: p.caption_mr || p.captionMr || undefined,
          captionEn: p.caption_en || p.captionEn || undefined,
          displayOrder: p.display_order !== undefined ? Number(p.display_order) : (p.displayOrder !== undefined ? Number(p.displayOrder) : idx + 1),
        });
      }
    });
  }

  const rawStatus = String(row.status || 'upcoming').toLowerCase();
  const validStatus: EventStatus =
    rawStatus === 'ongoing' || rawStatus === 'completed' || rawStatus === 'cancelled'
      ? rawStatus
      : 'upcoming';

  return {
    id: String(row.id || ''),
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    category: (row.category || 'शिक्षण') as CategoryKey,
    startDate: row.start_date || '',
    endDate: row.end_date || undefined,
    eventDateTextMr: row.event_date_text_mr || undefined,
    eventDateTextEn: row.event_date_text_en || undefined,
    eventTime: row.event_time || undefined,
    venue: row.venue_mr || '',
    venueEn: row.venue_en || '',
    summary: row.summary_mr || '',
    summaryEn: row.summary_en || '',
    description: row.description_mr || '',
    descriptionEn: row.description_en || '',
    coverImageUrl: row.cover_image_url || undefined,
    status: validStatus,
    isFeatured: toBoolean(row.is_featured, false),
    published: toBoolean(row.published, true),
    displayOrder: row.display_order ? Number(row.display_order) : 0,
    photos: photos.length > 0 ? photos : undefined,
  };
}

export function mapEventToDb(
  item: EventItem,
  displayOrder = 0
): DbEventRow {
  const rawPhotos = item.photos || [];
  const dbPhotos: DbEventPhotoRow[] = rawPhotos.map((p: any, idx) => ({
    event_id: item.id,
    image_url: typeof p === 'string' ? p : (p.imageUrl || p.image_url || p.photo_url || p.url || ''),
    caption_mr: typeof p === 'object' && p ? (p.captionMr || p.caption_mr || null) : null,
    caption_en: typeof p === 'object' && p ? (p.captionEn || p.caption_en || null) : null,
    display_order: typeof p === 'object' && p && p.displayOrder !== undefined ? p.displayOrder : (typeof p === 'object' && p && p.display_order ? p.display_order : idx + 1),
  })).filter(p => Boolean(p.image_url));

  return {
    id: item.id,
    title_mr: item.title || '',
    title_en: item.titleEn || '',
    category: item.category || 'शिक्षण',
    start_date: item.startDate || '',
    end_date: item.endDate || null,
    event_date_text_mr: item.eventDateTextMr || null,
    event_date_text_en: item.eventDateTextEn || null,
    event_time: item.eventTime || null,
    venue_mr: item.venue || '',
    venue_en: item.venueEn || '',
    summary_mr: item.summary || '',
    summary_en: item.summaryEn || '',
    description_mr: item.description || '',
    description_en: item.descriptionEn || '',
    cover_image_url: item.coverImageUrl || null,
    status: item.status || 'upcoming',
    is_featured: item.isFeatured ? 1 : 0,
    published: item.published ? 1 : 0,
    display_order: item.displayOrder !== undefined ? item.displayOrder : displayOrder,
    photos: dbPhotos,
  };
}

// ============================================================================
// 7. CONTACT INFO MAPPERS
// ============================================================================

export function mapContactInfoFromDb(row?: DbContactInfoRow | null): ContactInfo {
  if (!row) {
    return {
      phone: '+91 9923512482, +91 8888684966',
      phoneEn: '+91 9923512482, +91 8888684966',
      email: 'shrikrushnasanstha.nadarpur@gmail.com',
      address:
        'श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था, मु. पो. नादरपूर, तहसील कन्नड, जिल्हा छत्रपती संभाजीनगर, महाराष्ट्र',
      addressEn:
        'Shrikrushna Sanskrutik and Gramin Vikas Sanstha, At Post Nadarpur, Tahsil Kannad, District Chhatrapati Sambhajinagar, Maharashtra',
      taluka: 'कन्नड (नादरपूर)',
      talukaEn: 'Kannad (Nadarpur)',
      district: 'छत्रपती संभाजीनगर',
      districtEn: 'Chhatrapati Sambhajinagar',
      state: 'महाराष्ट्र',
      stateEn: 'Maharashtra',
      visitingHours: 'सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ०६:००',
      visitingHoursEn: 'Monday to Saturday: 10:00 AM to 06:00 PM',
      regNoMr: 'रजि. नं.: एक १४६६८ (औ)',
      regNoEn: 'Reg. No.: Ek 14668 (A)',
      secretaryNameMr: 'श्रीमती सविता दिलीप निकम',
      secretaryNameEn: 'Smt. Savita Dilip Nikam',
      isVerifiedPlaceholder: true,
    };
  }

  return {
    phone: row.phone || '',
    phoneEn: row.phone || '',
    email: row.email || '',
    address: row.address_mr || '',
    addressEn: row.address_en || undefined,
    taluka: row.taluka_mr || '',
    talukaEn: row.taluka_en || undefined,
    district: row.district_mr || '',
    districtEn: row.district_en || undefined,
    state: 'महाराष्ट्र',
    stateEn: 'Maharashtra',
    visitingHours: row.visiting_hours_mr || '',
    visitingHoursEn: row.visiting_hours_en || undefined,
    regNoMr: row.reg_no_mr || undefined,
    regNoEn: row.reg_no_en || undefined,
    secretaryNameMr: row.secretary_name_mr || undefined,
    secretaryNameEn: row.secretary_name_en || undefined,
    isVerifiedPlaceholder: true,
  };
}

export function mapContactInfoToDb(info: ContactInfo): DbContactInfoRow {
  return {
    id: 1,
    phone: info.phone || '',
    email: info.email || '',
    address_mr: info.address || '',
    address_en: info.addressEn !== undefined ? info.addressEn : '',
    taluka_mr: info.taluka || '',
    taluka_en: info.talukaEn !== undefined ? info.talukaEn : '',
    district_mr: info.district || '',
    district_en: info.districtEn !== undefined ? info.districtEn : '',
    visiting_hours_mr: info.visitingHours || '',
    visiting_hours_en: info.visitingHoursEn !== undefined ? info.visitingHoursEn : '',
    reg_no_mr: info.regNoMr !== undefined ? info.regNoMr : null,
    reg_no_en: info.regNoEn !== undefined ? info.regNoEn : null,
    secretary_name_mr: info.secretaryNameMr !== undefined ? info.secretaryNameMr : null,
    secretary_name_en: info.secretaryNameEn !== undefined ? info.secretaryNameEn : null,
  };
}

// ============================================================================
// 8. GOVERNMENT WELFARE SCHEMES MAPPERS (Segregated Domain)
// ============================================================================

export function mapSchemeFromDb(row: DbGovernmentSchemeRow): GovernmentSchemeItem {
  return {
    id: String(row.id || ''),
    title: row.title_mr || '',
    titleEn: row.title_en || '',
    department: row.department_mr || undefined,
    departmentEn: row.department_en || undefined,
    beneficiaryCategory: row.beneficiary_category_mr || undefined,
    beneficiaryCategoryEn: row.beneficiary_category_en || undefined,
    summary: row.summary_mr || '',
    summaryEn: row.summary_en || '',
    eligibility: row.eligibility_mr || undefined,
    eligibilityEn: row.eligibility_en || undefined,
    documentsRequired: row.documents_required_mr || undefined,
    documentsRequiredEn: row.documents_required_en || undefined,
    benefits: row.benefits_mr || undefined,
    benefitsEn: row.benefits_en || undefined,
    officialPortalUrl: row.official_portal_url || undefined,
    coverImageUrl: row.cover_image_url || undefined,
    displayOrder: row.display_order ? Number(row.display_order) : 0,
    published: toBoolean(row.published, true),
    featured: toBoolean(row.featured, false),
  };
}

export function mapSchemeToDb(item: GovernmentSchemeItem): DbGovernmentSchemeRow {
  return {
    id: item.id,
    title_mr: item.title || '',
    title_en: item.titleEn || '',
    department_mr: item.department || null,
    department_en: item.departmentEn || null,
    beneficiary_category_mr: item.beneficiaryCategory || null,
    beneficiary_category_en: item.beneficiaryCategoryEn || null,
    summary_mr: item.summary || '',
    summary_en: item.summaryEn || '',
    eligibility_mr: item.eligibility || null,
    eligibility_en: item.eligibilityEn || null,
    documents_required_mr: item.documentsRequired || null,
    documents_required_en: item.documentsRequiredEn || null,
    benefits_mr: item.benefits || null,
    benefits_en: item.benefitsEn || null,
    official_portal_url: item.officialPortalUrl || null,
    cover_image_url: item.coverImageUrl || null,
    display_order: item.displayOrder || 0,
    published: item.published ? 1 : 0,
    featured: item.featured ? 1 : 0,
  };
}

// ============================================================================
// 9. UNIFIED PUBLIC GET PAYLOAD MAPPER
// ============================================================================

export interface PublicContentResponse {
  sansthaState: Partial<SansthaState>;
  governmentSchemes: GovernmentSchemeItem[];
  siteSettings: Record<string, { mr: string; en: string; description?: string }>;
  sitePages?: SitePageItem[];
  pageSections?: PageSectionItem[];
  isAdminPreview: boolean;
}

export function mapPublicContentPayload(payload: any): PublicContentResponse {
  const data = payload?.data || {};

  const officials: OfficialItem[] = Array.isArray(data.officials)
    ? data.officials.map(mapOfficialFromDb)
    : [];

  const initiatives: InitiativeItem[] = Array.isArray(data.initiatives)
    ? data.initiatives.map((i: any) => mapInitiativeFromDb(i, i.photos))
    : [];

  const events: EventItem[] = Array.isArray(data.events)
    ? data.events.map((e: any) => mapEventFromDb(e, e.photos))
    : [];

  const albums: GalleryAlbumItem[] = Array.isArray(data.albums)
    ? data.albums.map(mapGalleryAlbumFromDb)
    : [];

  const gallery: GalleryItem[] = Array.isArray(data.gallery)
    ? data.gallery.map(mapGalleryPhotoFromDb)
    : [];

  const videos: VideoItem[] = Array.isArray(data.videos)
    ? data.videos.map(mapVideoFromDb)
    : [];

  const reports: ReportItem[] = Array.isArray(data.reports)
    ? data.reports.map(mapReportFromDb)
    : [];

  const announcements: AnnouncementItem[] = Array.isArray(data.announcements)
    ? data.announcements.map((a: any) => mapAnnouncementFromDb(a, a.photos))
    : [];

  const contactInfo = mapContactInfoFromDb(data.contactInfo);

  // Segregated Government Welfare Schemes
  const governmentSchemes: GovernmentSchemeItem[] = Array.isArray(data.governmentSchemes)
    ? data.governmentSchemes.map(mapSchemeFromDb)
    : [];

  // Site Pages & Page Sections
  const sitePages: SitePageItem[] = Array.isArray(data.sitePages)
    ? data.sitePages.map(mapSitePageFromDb)
    : [];

  const pageSections: PageSectionItem[] = Array.isArray(data.pageSections)
    ? data.pageSections.map(mapPageSectionFromDb)
    : [];

  // Site Settings Dictionary
  const siteSettings: Record<string, { mr: string; en: string; description?: string }> = {};
  if (Array.isArray(data.siteSettings)) {
    data.siteSettings.forEach((item: any) => {
      if (item.key_name) {
        siteSettings[item.key_name] = {
          mr: item.value_mr || '',
          en: item.value_en || '',
          description: item.description || undefined,
        };
      }
    });
  }

  return {
    sansthaState: {
      officials,
      initiatives,
      events,
      albums,
      gallery,
      videos,
      reports,
      announcements,
      governmentSchemes,
      contactInfo,
      sitePages,
      pageSections,
    },
    governmentSchemes,
    siteSettings,
    sitePages,
    pageSections,
    isAdminPreview: Boolean(payload?.isAdminPreview),
  };
}

// ============================================================================
// 10. CONTACT INQUIRY MAPPERS
// ============================================================================

export function mapInquiryFromDb(row: any): ContactInquiry {
  return {
    id: Number(row.id || 0),
    fullName: String(row.full_name || row.fullName || ''),
    contactDetail: String(row.contact_detail || row.contactDetail || ''),
    subject: String(row.subject || ''),
    message: String(row.message || ''),
    status: (row.status || 'new') as InquiryStatus,
    ipAddress: row.ip_address || row.ipAddress || undefined,
    adminNotes: row.admin_notes ?? null,
    repliedAt: row.replied_at ?? null,
    repliedBy: row.replied_by ? Number(row.replied_by) : null,
    createdAt: String(row.created_at || row.createdAt || ''),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

// ============================================================================
// 11. VOLUNTEER REGISTRATION MAPPERS
// ============================================================================

export function mapVolunteerFromDb(row: any): VolunteerRegistration {
  let areas: string[] = [];
  if (Array.isArray(row.areas_of_interest)) {
    areas = row.areas_of_interest.map((a: any) => String(a).trim()).filter(Boolean);
  } else if (Array.isArray(row.areasOfInterest)) {
    areas = row.areasOfInterest.map((a: any) => String(a).trim()).filter(Boolean);
  } else if (typeof row.areas_of_interest === 'string') {
    areas = row.areas_of_interest.split(',').map((a: string) => a.trim()).filter(Boolean);
  } else if (typeof row.areasOfInterest === 'string') {
    areas = row.areasOfInterest.split(',').map((a: string) => a.trim()).filter(Boolean);
  }

  return {
    id: Number(row.id || 0),
    fullName: String(row.full_name || row.fullName || ''),
    email: row.email || null,
    phone: String(row.phone || ''),
    village: String(row.village || row.city_village || ''),
    taluka: String(row.taluka || ''),
    district: String(row.district || ''),
    ageBracket: row.age_bracket || row.ageBracket || null,
    gender: row.gender || null,
    areasOfInterest: areas,
    availability: row.availability || null,
    message: row.message || row.motivation || null,
    status: (row.status || 'new') as VolunteerStatus,
    adminNotes: row.admin_notes || row.adminNotes || null,
    createdAt: String(row.created_at || row.createdAt || ''),
    updatedAt: row.updated_at || row.updatedAt || undefined,
  };
}

// ============================================================================
// 12. PAGES, SECTIONS & MEDIA MAPPERS
// ============================================================================

export function mapPageSectionFromDb(row: any): PageSectionItem {
  return {
    id: Number(row.id || 0),
    pageSlug: String(row.page_slug || row.pageSlug || ''),
    sectionKey: String(row.section_key || row.sectionKey || ''),
    titleMr: String(row.title_mr || row.titleMr || row.title || ''),
    titleEn: String(row.title_en || row.titleEn || ''),
    subtitleMr: row.subtitle_mr || row.subtitleMr || undefined,
    subtitleEn: row.subtitle_en || row.subtitleEn || undefined,
    contentMr: String(row.content_mr || row.contentMr || row.content || ''),
    contentEn: String(row.content_en || row.contentEn || ''),
    imageUrl: row.image_url || row.imageUrl || undefined,
    imageAltMr: row.image_alt_mr || row.imageAltMr || undefined,
    imageAltEn: row.image_alt_en || row.imageAltEn || undefined,
    displayOrder: Number(row.display_order ?? row.displayOrder ?? 0),
    isPublished: Boolean(row.is_published ?? row.isPublished ?? true),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
  };
}

export function mapPageSectionToDb(item: Partial<PageSectionItem>): any {
  return {
    id: item.id,
    page_slug: item.pageSlug,
    section_key: item.sectionKey,
    title_mr: item.titleMr,
    title_en: item.titleEn,
    subtitle_mr: item.subtitleMr ?? null,
    subtitle_en: item.subtitleEn ?? null,
    content_mr: item.contentMr,
    content_en: item.contentEn,
    image_url: item.imageUrl ?? null,
    image_alt_mr: item.imageAltMr ?? null,
    image_alt_en: item.imageAltEn ?? null,
    display_order: item.displayOrder ?? 0,
    is_published: item.isPublished ? 1 : 0,
  };
}

export function mapSitePageFromDb(row: any): SitePageItem {
  return {
    slug: String(row.slug || ''),
    titleMr: String(row.title_mr || row.titleMr || row.title || ''),
    titleEn: String(row.title_en || row.titleEn || ''),
    metaDescriptionMr: row.meta_description_mr || row.metaDescriptionMr || undefined,
    metaDescriptionEn: row.meta_description_en || row.metaDescriptionEn || undefined,
    isPublished: Boolean(row.is_published ?? row.isPublished ?? true),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    sections: Array.isArray(row.sections) ? row.sections.map(mapPageSectionFromDb) : undefined,
  };
}

export function mapMediaFileFromDb(row: any): MediaFileItem {
  return {
    id: Number(row.id || 0),
    fileName: String(row.file_name || row.fileName || ''),
    originalName: String(row.original_name || row.originalName || ''),
    filePath: String(row.file_path || row.filePath || ''),
    fileType: (row.file_type || row.fileType || 'image') as 'image' | 'document' | 'other',
    mimeType: String(row.mime_type || row.mimeType || ''),
    fileSizeBytes: Number(row.file_size_bytes || row.fileSizeBytes || 0),
    altTextMr: row.alt_text_mr || row.altTextMr || undefined,
    altTextEn: row.alt_text_en || row.altTextEn || undefined,
    uploadedBy: row.uploaded_by ? Number(row.uploaded_by) : undefined,
    createdAt: String(row.created_at || row.createdAt || ''),
    referenceCount: Number(row.reference_count ?? (row.is_referenced ? 1 : 0)),
    isReferenced: Boolean(row.is_referenced),
    references: Array.isArray(row.references) ? row.references : [],
  };
}
