/**
 * Comprehensive TypeScript definitions for Shrikrushna Sanskrutik & Gramin Vikas Sanstha
 * Provides bilingual support (Marathi + English) across all entities.
 */

export type PageRoute =
  | 'home'
  | 'about'
  | 'officials'
  | 'initiatives'
  | 'work'
  | 'gallery'
  | 'videos'
  | 'reports'
  | 'news'
  | 'events'
  | 'contact'
  | 'volunteer'
  | 'privacy'
  | 'admin'
  | 'schemes'
  | 'terms'
  | 'sitemap';

export type CategoryKey =
  | 'सर्व'
  | 'शिक्षण'
  | 'सामाजिक कल्याण'
  | 'आरोग्यविषयक उपक्रम'
  | 'महिला व ज्येष्ठ नागरिक सहाय्य'
  | 'पर्यावरण संवर्धन'
  | 'शासकीय योजना जनजागृती';

export interface OfficialItem {
  id: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  imageUrl: string;
  bio?: string;
  bioEn?: string;
  phone?: string;
  displayOrder?: number;
  published: boolean;
}

export interface InitiativeItem {
  id: string;
  title: string;
  titleEn: string;
  category: CategoryKey;
  date: string;
  location?: string;
  locationEn?: string;
  summary: string;
  summaryEn: string;
  description: string;
  descriptionEn: string;
  imageUrl: string; // Cover image
  images?: string[]; // Additional multiple photos
  isGovernmentSchemeAwareness: boolean;
  published: boolean;
  featured: boolean;
  relatedReportId?: string;
  tags: string[];
}

export interface GalleryAlbumItem {
  id: string;
  title: string;
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  category: CategoryKey | string;
  coverImageUrl?: string;
  eventDate?: string;
  displayMode: 'grid' | 'carousel';
  displayOrder?: number;
  published: boolean;
}

export interface GalleryItem {
  id: string;
  albumId?: string;
  title: string;
  titleEn: string;
  caption: string;
  captionEn: string;
  altText: string;
  altTextEn?: string;
  category: CategoryKey;
  imageUrl: string;
  images?: string[];
  year: number;
  activityId?: string;
  featuredOnHome?: boolean;
  displayOrder?: number;
  published: boolean;
}

export interface VideoItem {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  category: CategoryKey;
  durationSeconds: number;
  durationFormatted: string;
  durationFormattedEn?: string;
  videoUrl?: string;
  thumbnailUrl: string; // Cover page image for video
  date: string;
  published: boolean;
  featured: boolean;
  relatedActivityTitle?: string;
}

export interface ReportItem {
  id: string;
  title: string;
  titleEn: string;
  period: string;
  periodEn: string;
  date: string;
  fileSize: string;
  category: string;
  categoryEn?: string;
  summary: string;
  summaryEn: string;
  coverImageUrl?: string;
  pdfPlaceholderUrl: string;
  published: boolean;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  titleEn: string;
  date: string;
  dateEn?: string;
  isUpcoming: boolean;
  category: CategoryKey;
  summary: string;
  summaryEn: string;
  content: string;
  contentEn: string;
  coverImageUrl?: string; // Cover image for event/announcement
  images?: string[]; // Multiple photos for event/announcement
  published: boolean;
}

export interface ContactInfo {
  phone: string;
  phoneEn?: string;
  email: string;
  address: string;
  addressEn?: string;
  taluka: string;
  talukaEn?: string;
  district: string;
  districtEn?: string;
  state: string;
  stateEn?: string;
  visitingHours: string;
  visitingHoursEn?: string;
  regNoMr?: string;
  regNoEn?: string;
  secretaryNameMr?: string;
  secretaryNameEn?: string;
  isVerifiedPlaceholder: boolean;
}

export interface GovernmentSchemeItem {
  id: string;
  title: string;
  titleEn: string;
  department?: string;
  departmentEn?: string;
  beneficiaryCategory?: string;
  beneficiaryCategoryEn?: string;
  summary: string;
  summaryEn: string;
  eligibility?: string;
  eligibilityEn?: string;
  documentsRequired?: string;
  documentsRequiredEn?: string;
  benefits?: string;
  benefitsEn?: string;
  officialPortalUrl?: string;
  coverImageUrl?: string;
  displayOrder?: number;
  published: boolean;
  featured: boolean;
}

export interface SansthaState {
  officials: OfficialItem[];
  initiatives: InitiativeItem[];
  events: EventItem[];
  albums: GalleryAlbumItem[];
  gallery: GalleryItem[];
  videos: VideoItem[];
  reports: ReportItem[];
  announcements: AnnouncementItem[];
  governmentSchemes: GovernmentSchemeItem[];
  contactInfo: ContactInfo;
  sitePages?: SitePageItem[];
  pageSections?: PageSectionItem[];
}

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface EventPhoto {
  id?: number;
  eventId?: string;
  imageUrl: string;
  captionMr?: string;
  captionEn?: string;
  displayOrder?: number;
}

export interface EventItem {
  id: string;
  title: string;
  titleEn: string;
  category: CategoryKey;
  startDate: string;
  endDate?: string;
  eventDateTextMr?: string;
  eventDateTextEn?: string;
  eventTime?: string;
  venue: string;
  venueEn: string;
  summary: string;
  summaryEn: string;
  description: string;
  descriptionEn: string;
  coverImageUrl?: string;
  status: EventStatus;
  isFeatured: boolean;
  published: boolean;
  displayOrder?: number;
  photos?: EventPhoto[];
}

export type InquiryStatus = 'new' | 'read' | 'replied' | 'archived';

export interface ContactInquiry {
  id: number;
  fullName: string;
  contactDetail: string;
  subject: string;
  message: string;
  status: InquiryStatus;
  ipAddress?: string;
  adminNotes?: string | null;
  repliedAt?: string | null;
  repliedBy?: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface InquiryCounts {
  total: number;
  unread: number;
  read: number;
  replied: number;
  archived: number;
}

export type VolunteerStatus = 'new' | 'reviewing' | 'approved' | 'contacted' | 'declined' | 'archived';

export interface VolunteerRegistration {
  id: number;
  fullName: string;
  email?: string | null;
  phone: string;
  village: string;
  taluka: string;
  district: string;
  ageBracket?: string | null;
  gender?: string | null;
  areasOfInterest: string[];
  availability?: string | null;
  message?: string | null;
  status: VolunteerStatus;
  adminNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface VolunteerCounts {
  total: number;
  new: number;
  reviewing: number;
  approved: number;
  contacted: number;
  declined: number;
  archived: number;
}

export interface SitePageItem {
  slug: string;
  titleMr: string;
  titleEn: string;
  metaDescriptionMr?: string;
  metaDescriptionEn?: string;
  isPublished: boolean;
  updatedAt?: string;
  sections?: PageSectionItem[];
}

export interface PageSectionItem {
  id: number;
  pageSlug: string;
  sectionKey: string;
  titleMr: string;
  titleEn: string;
  subtitleMr?: string;
  subtitleEn?: string;
  contentMr: string;
  contentEn: string;
  imageUrl?: string;
  imageAltMr?: string;
  imageAltEn?: string;
  displayOrder: number;
  isPublished: boolean;
  updatedAt?: string;
}

export interface MediaReference {
  table: string;
  column: string;
  id: string | number;
  title?: string;
}

export interface MediaFileItem {
  id: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileType: 'image' | 'document' | 'other';
  mimeType: string;
  fileSizeBytes: number;
  altTextMr?: string;
  altTextEn?: string;
  uploadedBy?: number;
  createdAt: string;
  referenceCount?: number;
  isReferenced?: boolean;
  references?: MediaReference[];
}
