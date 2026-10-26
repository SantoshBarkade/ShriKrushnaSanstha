/**
 * Shrikrushna Sanskrutik va Gramin Vikas Sanstha, Nadarpur
 * Centralized, Secure API Client for React Frontend
 *
 * Enforces:
 * - Proper Bearer Token attachment to protected routes
 * - Interception of 401/403 responses to clear sessions
 * - Complete isolation of public queries from admin mutations
 * - Server-side token verification (GET /auth.php?action=verify)
 * - Safe environment-configurable API base URL
 */

import { isValidTokenFormat } from '../utils/auth.ts';
import {
  mapPublicContentPayload,
  mapVideoToDb,
  mapVideoFromDb,
  mapAnnouncementToDb,
  mapAnnouncementFromDb,
  mapSchemeToDb,
  mapSchemeFromDb,
  mapInitiativeToDb,
  mapInitiativeFromDb,
  mapOfficialToDb,
  mapOfficialFromDb,
  mapGalleryAlbumToDb,
  mapGalleryAlbumFromDb,
  mapGalleryPhotoToDb,
  mapGalleryPhotoFromDb,
  mapReportToDb,
  mapReportFromDb,
  mapContactInfoToDb,
  mapContactInfoFromDb,
  mapInquiryFromDb,
  mapVolunteerFromDb,
  mapEventToDb,
  mapEventFromDb,
  mapPageSectionFromDb,
  mapPageSectionToDb,
  mapSitePageFromDb,
  mapMediaFileFromDb,
} from '../utils/contentMapper.ts';
import type { PublicContentResponse } from '../utils/contentMapper.ts';
import type {
  VideoItem,
  EventItem,
  AnnouncementItem,
  GovernmentSchemeItem,
  InitiativeItem,
  OfficialItem,
  GalleryAlbumItem,
  GalleryItem,
  ReportItem,
  ContactInfo,
  ContactInquiry,
  InquiryCounts,
  InquiryStatus,
  VolunteerRegistration,
  VolunteerStatus,
  VolunteerCounts,
  SitePageItem,
  PageSectionItem,
  MediaFileItem,
} from '../types/index.ts';

export const SESSION_AUTH_KEY = 'shrikrushna_admin_token_v2';
export const SESSION_ADMIN_KEY = 'shrikrushna_admin_profile_v2';

// Base API URL configuration:
// In dev: defaults to '/backend-php-mysql/api' (or custom VITE_API_BASE_URL)
// In prod: uses relative or environment-defined base path
const API_BASE = (
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  '/backend-php-mysql/api'
).replace(/\/+$/, '');

export interface AdminProfile {
  id: number;
  username: string;
  full_name: string;
  role: string;
  email?: string | null;
}

export interface VerifySessionResult {
  isValid: boolean;
  admin?: AdminProfile;
  expiresAt?: string;
  error?: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  admin?: AdminProfile;
  expiresAt?: string;
  error?: string;
  statusCode?: number;
}

export class ApiClient {
  private static onAuthFailureListeners: Array<() => void> = [];

  public static onAuthFailure(callback: () => void): () => void {
    this.onAuthFailureListeners.push(callback);
    return () => {
      this.onAuthFailureListeners = this.onAuthFailureListeners.filter((cb) => cb !== callback);
    };
  }

  private static triggerAuthFailure(): void {
    this.clearSession();
    this.onAuthFailureListeners.forEach((cb) => {
      try {
        cb();
      } catch (err) {
        console.error('Auth failure listener error:', err);
      }
    });
  }

  public static getStoredToken(): string | null {
    try {
      const token = sessionStorage.getItem(SESSION_AUTH_KEY);
      if (token && isValidTokenFormat(token)) {
        return token;
      }
      return null;
    } catch {
      return null;
    }
  }

  public static getStoredProfile(): AdminProfile | null {
    try {
      const raw = sessionStorage.getItem(SESSION_ADMIN_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  public static saveSession(token: string, admin?: AdminProfile): void {
    if (isValidTokenFormat(token)) {
      sessionStorage.setItem(SESSION_AUTH_KEY, token);
      if (admin) {
        sessionStorage.setItem(SESSION_ADMIN_KEY, JSON.stringify(admin));
      }
    }
  }

  public static clearSession(): void {
    try {
      sessionStorage.removeItem(SESSION_AUTH_KEY);
      sessionStorage.removeItem(SESSION_ADMIN_KEY);
    } catch {}
  }

  /**
   * Actively verifies the stored token with the PHP backend:
   * GET /api/auth.php?action=verify
   * Sends Authorization: Bearer <token>
   */
  public static async verifySession(token: string): Promise<VerifySessionResult> {
    if (!isValidTokenFormat(token)) {
      this.clearSession();
      return { isValid: false, error: 'INVALID_TOKEN_FORMAT' };
    }

    try {
      const response = await fetch(`${API_BASE}/auth.php?action=verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        this.clearSession();
        return {
          isValid: false,
          error: response.status === 401 ? 'TOKEN_EXPIRED_OR_REVOKED' : 'VERIFICATION_FAILED',
        };
      }

      const data = await response.json();
      if (data && (data.success || data.status === 'success') && data.admin) {
        return {
          isValid: true,
          admin: data.admin,
          expiresAt: data.expires_at,
        };
      }

      this.clearSession();
      return { isValid: false, error: 'MALFORMED_VERIFY_RESPONSE' };
    } catch (err) {
      // On network failure, do NOT treat as authenticated!
      return { isValid: false, error: 'NETWORK_ERROR' };
    }
  }

  /**
   * Logs in admin via PHP backend:
   * POST /api/auth.php (action=login)
   */
  public static async login(username: string, password: string): Promise<LoginResult> {
    try {
      const response = await fetch(`${API_BASE}/auth.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data && (data.success || data.status === 'success') && data.token) {
        if (isValidTokenFormat(data.token)) {
          this.saveSession(data.token, data.admin);
          return {
            success: true,
            token: data.token,
            admin: data.admin,
            expiresAt: data.expires_at,
          };
        }
        return {
          success: false,
          error: 'INVALID_TOKEN_FORMAT_FROM_SERVER',
          statusCode: 502,
        };
      }

      return {
        success: false,
        error: data?.message || 'Invalid username or password.',
        statusCode: response.status,
      };
    } catch (err) {
      return {
        success: false,
        error: 'NETWORK_ERROR',
        statusCode: 0,
      };
    }
  }

  /**
   * Revokes token on backend and clears local session:
   * POST /api/auth.php?action=logout
   */
  public static async logout(): Promise<void> {
    const token = this.getStoredToken();
    if (token) {
      try {
        await fetch(`${API_BASE}/auth.php?action=logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        console.warn('Backend logout notification failed:', err);
      }
    }
    this.clearSession();
  }

  /**
   * Authenticated fetch helper:
   * Automatically injects Bearer token and intercepts 401/403 to trigger session clearance.
   */
  public static async authFetch(endpoint: string, init: RequestInit = {}): Promise<Response> {
    const token = this.getStoredToken();
    if (!token) {
      this.triggerAuthFailure();
      throw new Error('NO_ACTIVE_AUTH_TOKEN');
    }

    const headers = new Headers(init.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Accept', 'application/json');

    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

    const response = await fetch(url, { ...init, headers });

    if (response.status === 401 || response.status === 403) {
      this.triggerAuthFailure();
    }

    return response;
  }

  /**
   * Public content fetch helper (Supports optional admin draft preview via ?admin=1 with Bearer token):
   */
  public static async getPublicContent(options: { adminPreview?: boolean } = {}): Promise<any> {
    const adminParam = options.adminPreview ? '&admin=1' : '';
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (options.adminPreview) {
      const token = this.getStoredToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${API_BASE}/content.php?resource=all${adminParam}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      throw new Error(`Failed to load content (HTTP ${response.status})`);
    }
    return response.json();
  }

  /**
   * Typed public content fetcher with bidirectional schema mapping.
   * Maps SQL snake_case fields to TypeScript camelCase interfaces.
   */
  public static async getMappedPublicContent(
    options: { adminPreview?: boolean } = {}
  ): Promise<PublicContentResponse> {
    const raw = await this.getPublicContent(options);
    return mapPublicContentPayload(raw);
  }

  /**
   * Fetches an individual public resource:
   * e.g. 'initiatives', 'officials', 'gallery', 'videos', 'reports', 'announcements', 'schemes', 'contact', 'settings'
   */
  public static async getPublicResource(resource: string): Promise<any> {
    const sanitized = encodeURIComponent(resource.trim());
    const response = await fetch(`${API_BASE}/content.php?resource=${sanitized}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to load resource '${resource}' (HTTP ${response.status})`);
    }
    return response.json();
  }

  /**
   * Public contact inquiry submission (No Bearer token attached):
   */
  public static async submitInquiry(data: {
    name: string;
    contact: string;
    subject: string;
    message: string;
    website?: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE}/content.php?resource=inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || 'Submission failed');
    }
    return result;
  }

  /**
   * Public volunteer registration submission (No Bearer token attached):
   * POST /api/content.php?resource=volunteers
   */
  public static async submitVolunteer(data: {
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
    website?: string;
  }): Promise<{ success: boolean; message: string; volunteerId?: number }> {
    const response = await fetch(`${API_BASE}/content.php?resource=volunteers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.message || 'Registration failed');
    }
    return result;
  }

  /**
   * Protected administrative video mutation: Create new video in MySQL.
   * POST /api/content.php?resource=videos
   */
  public static async createVideo(item: Omit<VideoItem, 'id'> & { id?: string }): Promise<VideoItem> {
    const tempId = item.id || `vid-${Date.now()}`;
    const fullItem: VideoItem = {
      ...item,
      id: tempId,
    };
    const dbPayload = mapVideoToDb(fullItem);

    const response = await this.authFetch(`/content.php?resource=videos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create video (HTTP ${response.status})`);
    }

    return mapVideoFromDb(data.data);
  }

  /**
   * Protected administrative video mutation: Update existing video in MySQL.
   * PUT /api/content.php?resource=videos&id=:id
   */
  public static async updateVideo(id: string, item: Partial<VideoItem>): Promise<VideoItem> {
    // Map camelCase fields to snake_case payload for MySQL
    const payload: Record<string, any> = { id };
    if (item.title !== undefined) payload.title_mr = item.title;
    if (item.titleEn !== undefined) payload.title_en = item.titleEn;
    if (item.description !== undefined) payload.description_mr = item.description;
    if (item.descriptionEn !== undefined) payload.description_en = item.descriptionEn;
    if (item.category !== undefined) payload.category = item.category;
    if (item.videoUrl !== undefined) payload.video_url = item.videoUrl;
    if (item.thumbnailUrl !== undefined) payload.thumbnail_url = item.thumbnailUrl;
    if (item.date !== undefined) payload.publish_date = item.date;
    if (item.relatedActivityTitle !== undefined) payload.related_activity_title = item.relatedActivityTitle;
    if (item.durationSeconds !== undefined) payload.duration_seconds = item.durationSeconds;
    if (item.durationFormatted !== undefined) payload.duration_formatted = item.durationFormatted;
    if (item.durationFormattedEn !== undefined) payload.duration_formatted_en = item.durationFormattedEn;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;
    if (item.featured !== undefined) payload.featured = item.featured ? 1 : 0;

    const response = await this.authFetch(`/content.php?resource=videos&id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update video (HTTP ${response.status})`);
    }

    return mapVideoFromDb(data.data);
  }

  /**
   * Protected administrative video mutation: Delete video from MySQL.
   * DELETE /api/content.php?resource=videos&id=:id
   */
  public static async deleteVideo(id: string): Promise<boolean> {
    const response = await this.authFetch(`/content.php?resource=videos&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete video (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative announcement mutation: Create new announcement in MySQL.
   * POST /api/content.php?resource=announcements
   */
  public static async createAnnouncement(
    item: Omit<AnnouncementItem, 'id'> & { id?: string }
  ): Promise<AnnouncementItem> {
    const tempId = item.id || `ann-${Date.now()}`;
    const fullItem: AnnouncementItem = {
      ...item,
      id: tempId,
    };
    const dbPayload = mapAnnouncementToDb(fullItem);

    const response = await this.authFetch(`/content.php?resource=announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create announcement (HTTP ${response.status})`);
    }

    return mapAnnouncementFromDb(data.data);
  }

  /**
   * Protected administrative announcement mutation: Update existing announcement in MySQL.
   * PUT /api/content.php?resource=announcements&id=:id
   */
  public static async updateAnnouncement(
    id: string,
    item: Partial<AnnouncementItem>
  ): Promise<AnnouncementItem> {
    const payload: Record<string, any> = { id };
    if (item.title !== undefined) payload.title_mr = item.title;
    if (item.titleEn !== undefined) payload.title_en = item.titleEn;
    if (item.summary !== undefined) payload.summary_mr = item.summary;
    if (item.summaryEn !== undefined) payload.summary_en = item.summaryEn;
    if (item.content !== undefined) payload.content_mr = item.content;
    if (item.contentEn !== undefined) payload.content_en = item.contentEn;
    if (item.category !== undefined) payload.category = item.category;
    if (item.date !== undefined) payload.event_date_mr = item.date;
    if (item.dateEn !== undefined) payload.event_date_en = item.dateEn;
    if (item.isUpcoming !== undefined) payload.is_upcoming = item.isUpcoming ? 1 : 0;
    if (item.coverImageUrl !== undefined) payload.cover_image_url = item.coverImageUrl;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;

    const response = await this.authFetch(
      `/content.php?resource=announcements&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update announcement (HTTP ${response.status})`);
    }

    return mapAnnouncementFromDb(data.data);
  }

  /**
   * Protected administrative announcement mutation: Delete announcement from MySQL.
   * DELETE /api/content.php?resource=announcements&id=:id
   */
  public static async deleteAnnouncement(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=announcements&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete announcement (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative government scheme mutation: Create new scheme in MySQL.
   * POST /api/content.php?resource=government_schemes
   */
  public static async createScheme(
    item: Omit<GovernmentSchemeItem, 'id'> & { id?: string }
  ): Promise<GovernmentSchemeItem> {
    const tempId = item.id || `scheme-${Date.now()}`;
    const fullItem: GovernmentSchemeItem = {
      ...item,
      id: tempId,
    };
    const dbPayload = mapSchemeToDb(fullItem);

    const response = await this.authFetch(`/content.php?resource=government_schemes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create scheme (HTTP ${response.status})`);
    }

    return mapSchemeFromDb(data.data);
  }

  /**
   * Protected administrative government scheme mutation: Update existing scheme in MySQL.
   * PUT /api/content.php?resource=government_schemes&id=:id
   */
  public static async updateScheme(
    id: string,
    item: Partial<GovernmentSchemeItem>
  ): Promise<GovernmentSchemeItem> {
    const payload: Record<string, any> = { id };
    if (item.title !== undefined) payload.title_mr = item.title;
    if (item.titleEn !== undefined) payload.title_en = item.titleEn;
    if (item.department !== undefined) payload.department_mr = item.department;
    if (item.departmentEn !== undefined) payload.department_en = item.departmentEn;
    if (item.beneficiaryCategory !== undefined) payload.beneficiary_category_mr = item.beneficiaryCategory;
    if (item.beneficiaryCategoryEn !== undefined) payload.beneficiary_category_en = item.beneficiaryCategoryEn;
    if (item.summary !== undefined) payload.summary_mr = item.summary;
    if (item.summaryEn !== undefined) payload.summary_en = item.summaryEn;
    if (item.eligibility !== undefined) payload.eligibility_mr = item.eligibility;
    if (item.eligibilityEn !== undefined) payload.eligibility_en = item.eligibilityEn;
    if (item.documentsRequired !== undefined) payload.documents_required_mr = item.documentsRequired;
    if (item.documentsRequiredEn !== undefined) payload.documents_required_en = item.documentsRequiredEn;
    if (item.benefits !== undefined) payload.benefits_mr = item.benefits;
    if (item.benefitsEn !== undefined) payload.benefits_en = item.benefitsEn;
    if (item.officialPortalUrl !== undefined) payload.official_portal_url = item.officialPortalUrl;
    if (item.coverImageUrl !== undefined) payload.cover_image_url = item.coverImageUrl;
    if (item.displayOrder !== undefined) payload.display_order = item.displayOrder;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;
    if (item.featured !== undefined) payload.featured = item.featured ? 1 : 0;

    const response = await this.authFetch(
      `/content.php?resource=government_schemes&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update scheme (HTTP ${response.status})`);
    }

    return mapSchemeFromDb(data.data);
  }

  /**
   * Protected administrative government scheme mutation: Delete scheme from MySQL.
   * DELETE /api/content.php?resource=government_schemes&id=:id
   */
  public static async deleteScheme(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=government_schemes&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete scheme (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative initiative mutation: Create new initiative in MySQL.
   * POST /api/content.php?resource=initiatives
   */
  public static async createInitiative(
    item: Omit<InitiativeItem, 'id'> & { id?: string }
  ): Promise<InitiativeItem> {
    const tempId = item.id || `init-${Date.now()}`;
    const fullItem: InitiativeItem = {
      ...item,
      id: tempId,
    };
    const { initiative, photos } = mapInitiativeToDb(fullItem);
    const dbPayload = {
      ...initiative,
      photos,
    };

    const response = await this.authFetch(`/content.php?resource=initiatives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create initiative (HTTP ${response.status})`);
    }

    return mapInitiativeFromDb(data.data, data.data.photos);
  }

  /**
   * Protected administrative initiative mutation: Update existing initiative in MySQL.
   * PUT /api/content.php?resource=initiatives&id=:id
   */
  public static async updateInitiative(
    id: string,
    item: Partial<InitiativeItem>
  ): Promise<InitiativeItem> {
    const payload: Record<string, any> = { id };
    if (item.title !== undefined) payload.title_mr = item.title;
    if (item.titleEn !== undefined) payload.title_en = item.titleEn;
    if (item.category !== undefined) payload.category = item.category;
    if (item.date !== undefined) payload.activity_date = item.date;
    if (item.location !== undefined) payload.location_mr = item.location;
    if (item.locationEn !== undefined) payload.location_en = item.locationEn;
    if (item.summary !== undefined) payload.summary_mr = item.summary;
    if (item.summaryEn !== undefined) payload.summary_en = item.summaryEn;
    if (item.description !== undefined) payload.description_mr = item.description;
    if (item.descriptionEn !== undefined) payload.description_en = item.descriptionEn;
    if (item.imageUrl !== undefined) payload.image_url = item.imageUrl;
    if (item.images !== undefined) payload.photos = item.images;
    if (item.isGovernmentSchemeAwareness !== undefined)
      payload.is_govt_scheme = item.isGovernmentSchemeAwareness ? 1 : 0;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;
    if (item.featured !== undefined) payload.featured = item.featured ? 1 : 0;
    if (item.relatedReportId !== undefined) payload.related_report_id = item.relatedReportId;
    if (item.tags !== undefined) payload.tags = item.tags;

    const response = await this.authFetch(
      `/content.php?resource=initiatives&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update initiative (HTTP ${response.status})`);
    }

    return mapInitiativeFromDb(data.data, data.data.photos);
  }

  /**
   * Protected administrative initiative mutation: Delete initiative from MySQL.
   * DELETE /api/content.php?resource=initiatives&id=:id
   */
  public static async deleteInitiative(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=initiatives&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete initiative (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative event mutation: Create new event in MySQL.
   * POST /api/content.php?resource=events
   */
  public static async createEvent(
    item: (Omit<EventItem, 'id'> & { id?: string }) | Record<string, any>
  ): Promise<any> {
    const tempId = item.id || `evt-${Date.now()}`;
    let dbPayload: Record<string, any>;

    if ('title_mr' in item) {
      dbPayload = { id: tempId, ...item };
    } else {
      const fullItem: EventItem = {
        ...(item as any),
        id: tempId,
      };
      dbPayload = mapEventToDb(fullItem);
    }

    const response = await this.authFetch(`/content.php?resource=events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create event (HTTP ${response.status})`);
    }

    return data.data;
  }

  /**
   * Protected administrative event mutation: Update existing event in MySQL.
   * PUT /api/content.php?resource=events&id=:id
   */
  public static async updateEvent(
    id: string,
    item: Partial<EventItem> | Record<string, any>
  ): Promise<any> {
    const payload: Record<string, any> = { id };
    if ('title' in item && item.title !== undefined) payload.title_mr = item.title;
    if ('titleEn' in item && item.titleEn !== undefined) payload.title_en = item.titleEn;
    if ('category' in item && item.category !== undefined) payload.category = item.category;
    if ('startDate' in item && item.startDate !== undefined) payload.start_date = item.startDate;
    if ('endDate' in item) payload.end_date = item.endDate || null;
    if ('eventDateTextMr' in item) payload.event_date_text_mr = item.eventDateTextMr || null;
    if ('eventDateTextEn' in item) payload.event_date_text_en = item.eventDateTextEn || null;
    if ('eventTime' in item) payload.event_time = item.eventTime || null;
    if ('venue' in item && item.venue !== undefined) payload.venue_mr = item.venue;
    if ('venueEn' in item && item.venueEn !== undefined) payload.venue_en = item.venueEn;
    if ('summary' in item && item.summary !== undefined) payload.summary_mr = item.summary;
    if ('summaryEn' in item && item.summaryEn !== undefined) payload.summary_en = item.summaryEn;
    if ('description' in item && item.description !== undefined) payload.description_mr = item.description;
    if ('descriptionEn' in item && item.descriptionEn !== undefined) payload.description_en = item.descriptionEn;
    if ('coverImageUrl' in item) payload.cover_image_url = item.coverImageUrl || null;
    if ('status' in item && item.status !== undefined) payload.status = item.status;
    if ('isFeatured' in item && item.isFeatured !== undefined) payload.is_featured = item.isFeatured ? 1 : 0;
    if ('published' in item && item.published !== undefined) payload.published = item.published ? 1 : 0;
    if ('displayOrder' in item && item.displayOrder !== undefined) payload.display_order = item.displayOrder;
    if ('photos' in item) {
      if (Array.isArray(item.photos)) {
        payload.photos = item.photos
          .map((p: any, idx: number) => ({
            event_id: id,
            image_url: typeof p === 'string' ? p : (p.imageUrl || p.image_url || p.photo_url || p.url || ''),
            caption_mr: typeof p === 'object' && p ? (p.captionMr || p.caption_mr || null) : null,
            caption_en: typeof p === 'object' && p ? (p.captionEn || p.caption_en || null) : null,
            display_order: typeof p === 'object' && p && p.displayOrder !== undefined ? p.displayOrder : (typeof p === 'object' && p && p.display_order ? p.display_order : idx + 1),
          }))
          .filter((p: any) => Boolean(p.image_url));
      } else {
        payload.photos = [];
      }
    }

    // Merge any raw DB fields directly passed
    for (const [k, v] of Object.entries(item)) {
      if (k.includes('_') && !(k in payload)) {
        payload[k] = v;
      } else if (k === 'status' && !(k in payload)) {
        payload.status = v;
      }
    }

    const response = await this.authFetch(
      `/content.php?resource=events&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update event (HTTP ${response.status})`);
    }

    return data.data;
  }

  /**
   * Protected administrative event mutation: Delete event from MySQL.
   * DELETE /api/content.php?resource=events&id=:id
   */
  public static async deleteEvent(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=events&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete event (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative official mutation: Create official in MySQL.
   * POST /api/content.php?resource=officials
   */
  public static async createOfficial(
    item: Omit<OfficialItem, 'id'> & { id?: string }
  ): Promise<OfficialItem> {
    const tempId = item.id || `off-${Date.now()}`;
    const fullItem: OfficialItem = {
      ...item,
      id: tempId,
    };
    const dbPayload = mapOfficialToDb(fullItem);

    const response = await this.authFetch(`/content.php?resource=officials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create official (HTTP ${response.status})`);
    }

    return mapOfficialFromDb(data.data);
  }

  /**
   * Protected administrative official mutation: Update existing official in MySQL.
   * PUT /api/content.php?resource=officials&id=:id
   */
  public static async updateOfficial(
    id: string,
    item: Partial<OfficialItem> & Record<string, any>
  ): Promise<OfficialItem> {
    const payload: Record<string, any> = { id };
    if (item.name !== undefined) payload.name_mr = item.name;
    if (item.nameEn !== undefined) payload.name_en = item.nameEn;
    if (item.role !== undefined) payload.role_mr = item.role;
    if (item.roleEn !== undefined) payload.role_en = item.roleEn;
    if (item.bio !== undefined) payload.bio_mr = item.bio;
    if (item.bioEn !== undefined) payload.bio_en = item.bioEn;
    if (item.phone !== undefined) payload.phone = item.phone;
    if (item.imageUrl !== undefined) payload.image_url = item.imageUrl;
    if (item.displayOrder !== undefined) payload.display_order = item.displayOrder;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;

    const response = await this.authFetch(
      `/content.php?resource=officials&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update official (HTTP ${response.status})`);
    }

    return mapOfficialFromDb(data.data);
  }

  /**
   * Protected administrative official mutation: Delete official from MySQL.
   * DELETE /api/content.php?resource=officials&id=:id
   */
  public static async deleteOfficial(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=officials&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete official (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative report mutation: Create new report in MySQL.
   * POST /api/content.php?resource=reports
   */
  public static async createReport(
    item: Omit<ReportItem, 'id'> & { id?: string }
  ): Promise<ReportItem> {
    const tempId = item.id || `rep-${Date.now()}`;
    const fullItem: ReportItem = {
      ...item,
      id: tempId,
    };
    const dbPayload = mapReportToDb(fullItem);

    const response = await this.authFetch(`/content.php?resource=reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create report (HTTP ${response.status})`);
    }

    if (data.data) {
      return mapReportFromDb(data.data);
    }
    return fullItem;
  }

  /**
   * Protected administrative report mutation: Update existing report in MySQL.
   * PUT /api/content.php?resource=reports&id=:id
   */
  public static async updateReport(
    id: string,
    item: Partial<ReportItem>
  ): Promise<ReportItem | null> {
    const payload: Record<string, any> = { id };
    if (item.title !== undefined) payload.title_mr = item.title;
    if (item.titleEn !== undefined) payload.title_en = item.titleEn;
    if (item.period !== undefined) payload.period_mr = item.period;
    if (item.periodEn !== undefined) payload.period_en = item.periodEn;
    if (item.date !== undefined) payload.report_date = item.date;
    if (item.fileSize !== undefined) payload.file_size = item.fileSize;
    if (item.category !== undefined) payload.category_mr = item.category;
    if (item.categoryEn !== undefined) payload.category_en = item.categoryEn;
    if (item.summary !== undefined) payload.summary_mr = item.summary;
    if (item.summaryEn !== undefined) payload.summary_en = item.summaryEn;
    if (item.pdfPlaceholderUrl !== undefined) payload.pdf_url = item.pdfPlaceholderUrl;
    if (item.coverImageUrl !== undefined) payload.cover_image_url = item.coverImageUrl;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;

    const response = await this.authFetch(
      `/content.php?resource=reports&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update report (HTTP ${response.status})`);
    }

    return data.data ? mapReportFromDb(data.data) : null;
  }

  /**
   * Protected administrative report mutation: Delete report from MySQL.
   * DELETE /api/content.php?resource=reports&id=:id
   */
  public static async deleteReport(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=reports&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete report (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative contact info mutation: Update institutional contact details in MySQL.
   * PUT /api/content.php?resource=contact
   */
  public static async updateContactInfo(
    info: Partial<ContactInfo>
  ): Promise<ContactInfo> {
    const payload: Record<string, any> = {};
    if (info.phone !== undefined) payload.phone = info.phone;
    if (info.email !== undefined) payload.email = info.email;
    if (info.address !== undefined) payload.address_mr = info.address;
    if (info.addressEn !== undefined) payload.address_en = info.addressEn;
    if (info.taluka !== undefined) payload.taluka_mr = info.taluka;
    if (info.talukaEn !== undefined) payload.taluka_en = info.talukaEn;
    if (info.district !== undefined) payload.district_mr = info.district;
    if (info.districtEn !== undefined) payload.district_en = info.districtEn;
    if (info.visitingHours !== undefined) payload.visiting_hours_mr = info.visitingHours;
    if (info.visitingHoursEn !== undefined) payload.visiting_hours_en = info.visitingHoursEn;
    if (info.regNoMr !== undefined) payload.reg_no_mr = info.regNoMr;
    if (info.regNoEn !== undefined) payload.reg_no_en = info.regNoEn;
    if (info.secretaryNameMr !== undefined) payload.secretary_name_mr = info.secretaryNameMr;
    if (info.secretaryNameEn !== undefined) payload.secretary_name_en = info.secretaryNameEn;

    const response = await this.authFetch(`/content.php?resource=contact`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update contact info (HTTP ${response.status})`);
    }

    return mapContactInfoFromDb(data.data);
  }

  /**
   * Protected administrative album mutation: Create new album in MySQL.
   * POST /api/content.php?resource=albums
   */
  public static async createAlbum(
    item: Omit<GalleryAlbumItem, 'id'> & { id?: string }
  ): Promise<GalleryAlbumItem> {
    const tempId = item.id || `alb-${Date.now()}`;
    const fullItem: GalleryAlbumItem = {
      ...item,
      id: tempId,
    };
    const dbPayload = mapGalleryAlbumToDb(fullItem);

    const response = await this.authFetch(`/content.php?resource=albums`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create album (HTTP ${response.status})`);
    }

    return mapGalleryAlbumFromDb(data.data);
  }

  /**
   * Protected administrative album mutation: Update existing album in MySQL.
   * PUT /api/content.php?resource=albums&id=:id
   */
  public static async updateAlbum(
    id: string,
    item: Partial<GalleryAlbumItem> & Record<string, any>
  ): Promise<GalleryAlbumItem> {
    const payload: Record<string, any> = { id };
    if (item.title !== undefined) payload.title_mr = item.title;
    if (item.titleEn !== undefined) payload.title_en = item.titleEn;
    if (item.description !== undefined) payload.description_mr = item.description;
    if (item.descriptionEn !== undefined) payload.description_en = item.descriptionEn;
    if (item.category !== undefined) payload.category = item.category;
    if (item.coverImageUrl !== undefined) payload.cover_image_url = item.coverImageUrl;
    if (item.eventDate !== undefined) payload.event_date = item.eventDate;
    if (item.displayMode !== undefined) payload.display_mode = item.displayMode;
    if (item.displayOrder !== undefined) payload.display_order = item.displayOrder;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;

    const response = await this.authFetch(
      `/content.php?resource=albums&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update album (HTTP ${response.status})`);
    }

    return mapGalleryAlbumFromDb(data.data);
  }

  /**
   * Protected administrative album mutation: Delete album from MySQL.
   * DELETE /api/content.php?resource=albums&id=:id
   */
  public static async deleteAlbum(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=albums&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete album (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative gallery photo mutation: Create new photo in MySQL.
   * POST /api/content.php?resource=gallery
   */
  public static async createGalleryPhoto(
    item: Omit<GalleryItem, 'id'> & { id?: string }
  ): Promise<GalleryItem> {
    const tempId = item.id || `gal-${Date.now()}`;
    const fullItem: GalleryItem = {
      ...item,
      id: tempId,
    };
    const dbPayload = mapGalleryPhotoToDb(fullItem);

    const response = await this.authFetch(`/content.php?resource=gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dbPayload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to create gallery photo (HTTP ${response.status})`);
    }

    return mapGalleryPhotoFromDb(data.data);
  }

  /**
   * Protected administrative gallery photos mutation: Batch create photos in MySQL.
   * POST /api/content.php?resource=gallery with { photos: [...] }
   */
  public static async createGalleryPhotosBatch(
    photos: Array<Omit<GalleryItem, 'id'> & { id?: string }>
  ): Promise<GalleryItem[]> {
    const dbPhotos = photos.map((p, idx) => {
      const fullItem: GalleryItem = {
        ...p,
        id: p.id || `gal-${Date.now()}-${idx}`,
      };
      return mapGalleryPhotoToDb(fullItem);
    });

    const response = await this.authFetch(`/content.php?resource=gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photos: dbPhotos }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to batch create gallery photos (HTTP ${response.status})`);
    }

    const createdList = Array.isArray(data.data) ? data.data : [data.data];
    return createdList.map(mapGalleryPhotoFromDb);
  }

  /**
   * Protected administrative gallery photo mutation: Update existing photo in MySQL.
   * PUT /api/content.php?resource=gallery&id=:id
   */
  public static async updateGalleryPhoto(
    id: string,
    item: Partial<GalleryItem> & Record<string, any>
  ): Promise<GalleryItem> {
    const payload: Record<string, any> = { id };
    if (item.title !== undefined) payload.title_mr = item.title;
    if (item.titleEn !== undefined) payload.title_en = item.titleEn;
    if (item.description !== undefined) {
      payload.description_mr = item.description;
      payload.caption_mr = item.description;
    }
    if (item.descriptionEn !== undefined) {
      payload.description_en = item.descriptionEn;
      payload.caption_en = item.descriptionEn;
    }
    if (item.category !== undefined) payload.category = item.category;
    if (item.albumId !== undefined) payload.album_id = item.albumId;
    if (item.imageUrl !== undefined) payload.image_url = item.imageUrl;
    if (item.date !== undefined) payload.event_date = item.date;
    if (item.displayOrder !== undefined) payload.display_order = item.displayOrder;
    if (item.published !== undefined) payload.published = item.published ? 1 : 0;

    const response = await this.authFetch(
      `/content.php?resource=gallery&id=${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update gallery photo (HTTP ${response.status})`);
    }

    return mapGalleryPhotoFromDb(data.data);
  }

  /**
   * Protected administrative gallery photo mutation: Delete photo from MySQL.
   * DELETE /api/content.php?resource=gallery&id=:id
   */
  public static async deleteGalleryPhoto(id: string): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=gallery&id=${encodeURIComponent(id)}`,
      {
        method: 'DELETE',
      }
    );

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete gallery photo (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative photo upload: uploads a local image file (JPEG, PNG, WebP)
   * to /backend-php-mysql/api/upload.php and returns the persistent server-relative URL.
   */
  public static async uploadImage(
    file: File,
    onProgress?: (percent: number) => void,
    folder: string = 'officials'
  ): Promise<{ url: string; filename: string; size: number; width?: number; height?: number }> {
    const token = this.getStoredToken();
    if (!token) {
      this.triggerAuthFailure();
      throw new Error('प्रशासक लॉगिन आवश्यक आहे. (Administrator login is required.)');
    }

    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const targetUrl = `${API_BASE}/upload.php`;

    // Helper to safely parse and validate upload response across both XHR and fetch paths
    const parseAndValidateUploadResponse = (rawText: string, status: number) => {
      let data: any = null;
      try {
        data = JSON.parse(rawText || '{}');
      } catch {
        // Attempt substring extraction if PHP notices/HTML wrapped the JSON
        const jsonStart = rawText.indexOf('{');
        const jsonEnd = rawText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          try {
            data = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
          } catch {
            data = null;
          }
        }
      }

      if (!data || typeof data !== 'object') {
        throw new Error(`Server response error (HTTP ${status})`);
      }

      // Accept all successful HTTP 2xx responses (200, 201, 204, etc.)
      const isSuccessStatus = status >= 200 && status < 300;
      if (isSuccessStatus) {
        if (data.success || data.status === 'success') {
          // Validate that the response contains the expected uploaded file path
          const uploadedUrl = data.url || data.filePath || data.data?.url;
          if (typeof uploadedUrl === 'string' && uploadedUrl.trim().length > 0) {
            return {
              ...data,
              url: uploadedUrl.trim(),
            };
          }
          throw new Error('सर्व्हरकडून फोटोची फाइल लिंक प्राप्त झाली नाही. (Upload response missing file path.)');
        }
        throw new Error(data.message || `Upload failed (HTTP ${status})`);
      }

      if (status === 401 || status === 403) {
        ApiClient.triggerAuthFailure();
      }
      throw new Error(data.message || `Upload failed (HTTP ${status})`);
    };

    // If XMLHttpRequest is available and onProgress is provided, use XHR for progress tracking
    if (typeof XMLHttpRequest !== 'undefined' && onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', targetUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          try {
            const validated = parseAndValidateUploadResponse(xhr.responseText, xhr.status);
            resolve(validated);
          } catch (err: any) {
            reject(err);
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during file upload.'));
        };

        xhr.onabort = () => {
          reject(new Error('Upload aborted.'));
        };

        xhr.ontimeout = () => {
          reject(new Error('Upload timed out.'));
        };

        xhr.send(formData);
      });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    const rawText = await response.text();
    return parseAndValidateUploadResponse(rawText, response.status);
  }

  /**
   * Protected administrative multi-photo upload to /backend-php-mysql/api/upload.php
   * uploads multiple image files into uploads/gallery/ and returns array of file metadata.
   */
  public static async uploadGalleryImages(
    files: File[],
    onProgress?: (percent: number) => void
  ): Promise<Array<{ url: string; filename: string; size: number; originalName?: string }>> {
    const token = this.getStoredToken();
    if (!token) {
      this.triggerAuthFailure();
      throw new Error('प्रशासक लॉगिन आवश्यक आहे. (Administrator login is required.)');
    }

    if (!files || files.length === 0) {
      return [];
    }

    const formData = new FormData();
    formData.append('folder', 'gallery');
    for (let i = 0; i < files.length; i++) {
      formData.append('images[]', files[i]);
    }

    const targetUrl = `${API_BASE}/upload.php`;

    const parseAndValidateMultiUpload = (rawText: string, status: number) => {
      let data: any = null;
      try {
        data = JSON.parse(rawText || '{}');
      } catch {
        const jsonStart = rawText.indexOf('{');
        const jsonEnd = rawText.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          try {
            data = JSON.parse(rawText.substring(jsonStart, jsonEnd + 1));
          } catch {
            data = null;
          }
        }
      }

      if (!data || typeof data !== 'object') {
        throw new Error(`Server response error (HTTP ${status})`);
      }

      const isSuccessStatus = status >= 200 && status < 300;
      if (isSuccessStatus && (data.success || data.status === 'success')) {
        const uploaded = data.data?.uploaded || data.uploaded || data.files || [];
        if (Array.isArray(uploaded) && uploaded.length > 0) {
          return uploaded.map((u: any) => ({
            url: u.url || u.filePath || u.data?.url || '',
            filename: u.filename || u.safeFilename || '',
            size: u.size || 0,
            originalName: u.original_name || u.originalName || files[0]?.name || ''
          }));
        }
        if (data.url || data.data?.url) {
          return [{
            url: data.url || data.data.url,
            filename: data.filename || data.data?.filename || '',
            size: data.size || data.data?.size || 0,
            originalName: files[0]?.name || ''
          }];
        }
        throw new Error('सर्व्हरकडून फोटोची फाइल लिंक प्राप्त झाली नाही.');
      }

      if (status === 401 || status === 403) {
        ApiClient.triggerAuthFailure();
      }
      throw new Error(data.message || `Upload failed (HTTP ${status})`);
    };

    if (typeof XMLHttpRequest !== 'undefined' && onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', targetUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          try {
            const validated = parseAndValidateMultiUpload(xhr.responseText, xhr.status);
            resolve(validated);
          } catch (err: any) {
            reject(err);
          }
        };

        xhr.onerror = () => reject(new Error('Network error during file upload.'));
        xhr.onabort = () => reject(new Error('Upload aborted.'));
        xhr.ontimeout = () => reject(new Error('Upload timed out.'));

        xhr.send(formData);
      });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      body: formData,
    });

    const rawText = await response.text();
    return parseAndValidateMultiUpload(rawText, response.status);
  }

  /**
   * Protected administrative setting mutation: Update website setting in MySQL.
   * PUT /api/content.php?resource=settings&key=:key
   */
  public static async updateSiteSetting(
    key: string,
    data: { valueMr?: string; valueEn?: string; description?: string }
  ): Promise<any> {
    const payload: Record<string, any> = { key_name: key };
    if (data.valueMr !== undefined) payload.value_mr = data.valueMr;
    if (data.valueEn !== undefined) payload.value_en = data.valueEn;
    if (data.description !== undefined) payload.description = data.description;

    const response = await this.authFetch(
      `/content.php?resource=settings&key=${encodeURIComponent(key)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to update setting (HTTP ${response.status})`);
    }

    return resData.data;
  }

  /**
   * Protected administrative page mutation: Update site page metadata in MySQL.
   * PUT /api/content.php?resource=pages&slug=:slug
   */
  public static async updateSitePage(
    slug: string,
    data: {
      titleMr?: string;
      titleEn?: string;
      metaDescriptionMr?: string;
      metaDescriptionEn?: string;
      isPublished?: boolean;
    }
  ): Promise<any> {
    const payload: Record<string, any> = { slug };
    if (data.titleMr !== undefined) payload.title_mr = data.titleMr;
    if (data.titleEn !== undefined) payload.title_en = data.titleEn;
    if (data.metaDescriptionMr !== undefined) payload.meta_description_mr = data.metaDescriptionMr;
    if (data.metaDescriptionEn !== undefined) payload.meta_description_en = data.metaDescriptionEn;
    if (data.isPublished !== undefined) payload.is_published = data.isPublished ? 1 : 0;

    const response = await this.authFetch(
      `/content.php?resource=pages&slug=${encodeURIComponent(slug)}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to update page (HTTP ${response.status})`);
    }

    return resData.data;
  }

  /**
   * Fetch page sections (public or admin preview).
   * GET /api/content.php?resource=page_sections
   */
  public static async getPageSections(pageSlug?: string): Promise<PageSectionItem[]> {
    const slugParam = pageSlug ? `&page_slug=${encodeURIComponent(pageSlug)}` : '';
    const token = this.getStoredToken();
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/content.php?resource=page_sections${slugParam}`, {
      headers,
    });
    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to fetch page sections (HTTP ${response.status})`);
    }

    return Array.isArray(resData.data) ? resData.data.map(mapPageSectionFromDb) : [];
  }

  /**
   * Protected administrative section creation:
   * POST /api/content.php?resource=page_sections
   */
  public static async createPageSection(
    section: Omit<PageSectionItem, 'id'>
  ): Promise<PageSectionItem> {
    const payload = mapPageSectionToDb(section);

    const response = await this.authFetch(`/content.php?resource=page_sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to create section (HTTP ${response.status})`);
    }

    return mapPageSectionFromDb(resData.data);
  }

  /**
   * Protected administrative section update:
   * PUT /api/content.php?resource=page_sections&id=:id
   */
  public static async updatePageSection(
    id: number,
    section: Partial<PageSectionItem>
  ): Promise<PageSectionItem> {
    const payload = mapPageSectionToDb(section);

    const response = await this.authFetch(
      `/content.php?resource=page_sections&id=${encodeURIComponent(String(id))}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to update section (HTTP ${response.status})`);
    }

    return mapPageSectionFromDb(resData.data);
  }

  /**
   * Protected administrative section deletion:
   * DELETE /api/content.php?resource=page_sections&id=:id
   */
  public static async deletePageSection(id: number): Promise<boolean> {
    const response = await this.authFetch(
      `/content.php?resource=page_sections&id=${encodeURIComponent(String(id))}`,
      {
        method: 'DELETE',
      }
    );

    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to delete section (HTTP ${response.status})`);
    }

    return true;
  }

  /**
   * Protected administrative media inventory read:
   * GET /api/content.php?resource=media_files
   */
  public static async getMediaFiles(): Promise<MediaFileItem[]> {
    const response = await this.authFetch(`/content.php?resource=media_files`);
    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to fetch media inventory (HTTP ${response.status})`);
    }

    return Array.isArray(resData.data) ? resData.data.map(mapMediaFileFromDb) : [];
  }

  /**
   * Protected administrative media metadata update:
   * PUT /api/content.php?resource=media_files&id=:id
   */
  public static async updateMediaFile(
    id: number,
    meta: { altTextMr?: string; altTextEn?: string }
  ): Promise<MediaFileItem> {
    const payload = {
      alt_text_mr: meta.altTextMr ?? null,
      alt_text_en: meta.altTextEn ?? null,
    };

    const response = await this.authFetch(
      `/content.php?resource=media_files&id=${encodeURIComponent(String(id))}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const resData = await response.json().catch(() => null);
    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to update media (HTTP ${response.status})`);
    }

    return mapMediaFileFromDb(resData.data);
  }

  /**
   * Protected administrative media deletion with dependency protection:
   * DELETE /api/content.php?resource=media_files&id=:id
   */
  public static async deleteMediaFile(id: number): Promise<{
    success: boolean;
    message?: string;
    inUse?: boolean;
    references?: any[];
  }> {
    const response = await this.authFetch(
      `/content.php?resource=media_files&id=${encodeURIComponent(String(id))}`,
      {
        method: 'DELETE',
      }
    );

    const resData = await response.json().catch(() => null);
    if (response.status === 409 || resData?.error_code === 'MEDIA_IN_USE') {
      return {
        success: false,
        inUse: true,
        message: resData?.message || 'हा मीडिया घटक इतरत्र वापरात असल्याने हटवता येत नाही.',
        references: resData?.references || [],
      };
    }

    if (!response.ok || !resData?.success) {
      throw new Error(resData?.message || `Failed to delete media (HTTP ${response.status})`);
    }

    return {
      success: true,
      message: resData?.message,
    };
  }

  /**
   * Protected administrative inquiry read: Fetch contact inquiries with optional filtering and search.
   * GET /api/content.php?resource=inquiries
   */
  public static async getInquiries(params?: {
    status?: string;
    q?: string;
  }): Promise<{ inquiries: ContactInquiry[]; counts?: InquiryCounts }> {
    const searchParams = new URLSearchParams();
    searchParams.set('resource', 'inquiries');
    if (params?.status && params.status !== 'all') {
      searchParams.set('status', params.status);
    }
    if (params?.q) {
      searchParams.set('q', params.q);
    }

    const response = await this.authFetch(`/content.php?${searchParams.toString()}`);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to fetch inquiries (HTTP ${response.status})`);
    }

    const rawList = Array.isArray(data.data) ? data.data : [];
    const inquiries = rawList.map(mapInquiryFromDb);

    return {
      inquiries,
      counts: data.counts,
    };
  }

  /**
   * Protected administrative inquiry update: Update status or notes.
   * PUT /api/content.php?resource=inquiries&id=:id
   */
  public static async updateInquiryStatus(
    id: number | string,
    status: InquiryStatus,
    adminNotes?: string
  ): Promise<ContactInquiry> {
    const payload: Record<string, any> = { status };
    if (adminNotes !== undefined) {
      payload.admin_notes = adminNotes;
    }

    const response = await this.authFetch(`/content.php?resource=inquiries&id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update inquiry status (HTTP ${response.status})`);
    }

    return mapInquiryFromDb(data.data);
  }

  /**
   * Protected administrative inquiry deletion.
   * DELETE /api/content.php?resource=inquiries&id=:id
   */
  public static async deleteInquiry(id: number | string): Promise<{ success: boolean; message?: string }> {
    const response = await this.authFetch(`/content.php?resource=inquiries&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete inquiry (HTTP ${response.status})`);
    }

    return { success: true, message: data.message };
  }

  /**
   * Protected administrative volunteer read: Fetch volunteer registrations with optional filtering and search.
   * GET /api/content.php?resource=volunteers
   */
  public static async getVolunteers(params?: {
    status?: string;
    q?: string;
  }): Promise<{ volunteers: VolunteerRegistration[]; counts?: VolunteerCounts }> {
    const searchParams = new URLSearchParams();
    searchParams.set('resource', 'volunteers');
    if (params?.status && params.status !== 'all') {
      searchParams.set('status', params.status);
    }
    if (params?.q) {
      searchParams.set('q', params.q);
    }

    const response = await this.authFetch(`/content.php?${searchParams.toString()}`);
    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to fetch volunteers (HTTP ${response.status})`);
    }

    const rawList = Array.isArray(data.data) ? data.data : [];
    const volunteers = rawList.map(mapVolunteerFromDb);

    return {
      volunteers,
      counts: data.counts,
    };
  }

  /**
   * Protected administrative volunteer update: Update status or notes.
   * PUT /api/content.php?resource=volunteers&id=:id
   */
  public static async updateVolunteerStatus(
    id: number | string,
    status: VolunteerStatus,
    adminNotes?: string
  ): Promise<VolunteerRegistration> {
    const payload: Record<string, any> = { status };
    if (adminNotes !== undefined) {
      payload.admin_notes = adminNotes;
    }

    const response = await this.authFetch(`/content.php?resource=volunteers&id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to update volunteer status (HTTP ${response.status})`);
    }

    return mapVolunteerFromDb(data.data);
  }

  /**
   * Protected administrative volunteer deletion.
   * DELETE /api/content.php?resource=volunteers&id=:id
   */
  public static async deleteVolunteer(id: number | string): Promise<{ success: boolean; message?: string }> {
    const response = await this.authFetch(`/content.php?resource=volunteers&id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      throw new Error(data?.message || `Failed to delete volunteer (HTTP ${response.status})`);
    }

    return { success: true, message: data.message };
  }
}

