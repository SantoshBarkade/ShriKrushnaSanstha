import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SansthaState,
  PageRoute,
  OfficialItem,
  InitiativeItem,
  GalleryAlbumItem,
  GalleryItem,
  VideoItem,
  ReportItem,
  AnnouncementItem,
  EventItem,
  GovernmentSchemeItem,
  ContactInfo,
  SitePageItem,
  PageSectionItem,
} from '../types';
import { INITIAL_SANSTHA_DATA } from '../data/initialData';
import { TRANSLATIONS, LangMode } from '../utils/i18n';
import { ApiClient } from '../services/apiClient.ts';

interface SansthaContextType {
  state: SansthaState;
  currentRoute: PageRoute;
  setCurrentRoute: (route: PageRoute) => void;
  selectedInitiativeId: string | null;
  setSelectedInitiativeId: (id: string | null) => void;
  selectedGalleryImage: GalleryItem | null;
  setSelectedGalleryImage: (img: GalleryItem | null) => void;
  lang: LangMode;
  setLang: (lang: LangMode) => void;
  t: typeof TRANSLATIONS.mr;
  // Loading & Content Synchronization Status
  isLoading: boolean;
  error: string | null;
  isFallback: boolean;
  refreshContent: (options?: { adminPreview?: boolean }) => Promise<void>;
  siteSettings: Record<string, { mr: string; en: string; description?: string }>;
  // Admin CMS mutations (Create, Update, Delete for all website content)
  addOfficial: (item: Omit<OfficialItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateOfficial: (id: string, item: Partial<OfficialItem>) => Promise<{ success: boolean; error?: string }>;
  deleteOfficial: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateSiteSetting: (
    key: string,
    data: { valueMr?: string; valueEn?: string; description?: string }
  ) => Promise<{ success: boolean; error?: string }>;
  addInitiative: (item: Omit<InitiativeItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateInitiative: (id: string, item: Partial<InitiativeItem>) => Promise<{ success: boolean; error?: string }>;
  deleteInitiative: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Gallery Albums CRUD
  addAlbum: (item: Omit<GalleryAlbumItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateAlbum: (id: string, item: Partial<GalleryAlbumItem>) => Promise<{ success: boolean; error?: string }>;
  deleteAlbum: (id: string) => Promise<{ success: boolean; error?: string }>;
  // Gallery Photos CRUD
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  addGalleryPhotosBatch: (photos: Array<Omit<GalleryItem, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  updateGalleryItem: (id: string, item: Partial<GalleryItem>) => Promise<{ success: boolean; error?: string }>;
  deleteGalleryItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  addVideoItem: (item: Omit<VideoItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateVideoItem: (id: string, item: Partial<VideoItem>) => Promise<{ success: boolean; error?: string }>;
  deleteVideoItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  addReportItem: (item: Omit<ReportItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateReportItem: (id: string, item: Partial<ReportItem>) => Promise<{ success: boolean; error?: string }>;
  deleteReportItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  addAnnouncement: (item: Omit<AnnouncementItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateAnnouncement: (id: string, item: Partial<AnnouncementItem>) => Promise<{ success: boolean; error?: string }>;
  deleteAnnouncement: (id: string) => Promise<{ success: boolean; error?: string }>;
  addEvent: (item: Omit<EventItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateEvent: (id: string, item: Partial<EventItem>) => Promise<{ success: boolean; error?: string }>;
  deleteEvent: (id: string) => Promise<{ success: boolean; error?: string }>;
  addGovernmentScheme: (item: Omit<GovernmentSchemeItem, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateGovernmentScheme: (id: string, item: Partial<GovernmentSchemeItem>) => Promise<{ success: boolean; error?: string }>;
  deleteGovernmentScheme: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateContactInfo: (info: Partial<ContactInfo>) => Promise<{ success: boolean; error?: string }>;
  addPageSection: (section: Omit<PageSectionItem, 'id'>) => Promise<{ success: boolean; error?: string; section?: PageSectionItem }>;
  updatePageSection: (id: number, section: Partial<PageSectionItem>) => Promise<{ success: boolean; error?: string; section?: PageSectionItem }>;
  deletePageSection: (id: number) => Promise<{ success: boolean; error?: string }>;
  updateSitePage: (slug: string, data: Partial<SitePageItem>) => Promise<{ success: boolean; error?: string }>;
  resetToDefault: () => void;
  exportDataJson: () => string;
  importDataJson: (json: string) => boolean;
}

const SansthaContext = createContext<SansthaContextType | undefined>(undefined);

const STORAGE_KEY = 'shrikrushna_sanstha_state_v9_news_slider';
const LANG_STORAGE_KEY = 'shrikrushna_sanstha_lang_v3';

export const SansthaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SansthaState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.initiatives) && parsed.initiatives.length > 0) {
          return {
            ...INITIAL_SANSTHA_DATA,
            ...parsed,
            albums: Array.isArray(parsed.albums) && parsed.albums.length > 0
              ? parsed.albums
              : INITIAL_SANSTHA_DATA.albums,
            gallery: Array.isArray(parsed.gallery) && parsed.gallery.length > 0
              ? parsed.gallery
              : INITIAL_SANSTHA_DATA.gallery,
            videos: Array.isArray(parsed.videos) && parsed.videos.length > 0
              ? parsed.videos
              : INITIAL_SANSTHA_DATA.videos,
            officials: Array.isArray(parsed.officials)
              ? parsed.officials
              : INITIAL_SANSTHA_DATA.officials,
            events: Array.isArray(parsed.events)
              ? parsed.events
              : INITIAL_SANSTHA_DATA.events || [],
            governmentSchemes: Array.isArray(parsed.governmentSchemes)
              ? parsed.governmentSchemes
              : INITIAL_SANSTHA_DATA.governmentSchemes,
            reports: Array.isArray(parsed.reports) && parsed.reports.length > 0
              ? parsed.reports
              : INITIAL_SANSTHA_DATA.reports,
            contactInfo: { ...INITIAL_SANSTHA_DATA.contactInfo, ...(parsed.contactInfo || {}) },
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved state:', e);
    }
    return INITIAL_SANSTHA_DATA;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallback, setIsFallback] = useState<boolean>(false);

  const [currentRoute, setCurrentRoute] = useState<PageRoute>('home');
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);
  const [selectedGalleryImage, setSelectedGalleryImage] = useState<GalleryItem | null>(null);
  const [siteSettings, setSiteSettings] = useState<Record<string, { mr: string; en: string; description?: string }>>({});

  const [lang, setLangState] = useState<LangMode>(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === 'en' || savedLang === 'mr') {
        return savedLang;
      }
    } catch (e) {}
    return 'mr';
  });

  const setLang = (newLang: LangMode) => {
    setLangState(newLang);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch (e) {}
  };

  /**
   * Helper to broadcast changes across tabs and windows
   */
  const notifyBroadcast = (action: string) => {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('shrikrushna_sanstha_sync');
        bc.postMessage({ type: 'CONTENT_UPDATED', action, timestamp: Date.now() });
        bc.close();
      }
      localStorage.setItem('shrikrushna_last_sync_timestamp', String(Date.now()));
    } catch (e) {}
  };

  /**
   * Fetches published public content from the PHP API and maps it
   * into the unified SansthaState model.
   * If the API fails, gracefully falls back without crashing.
   */
  const refreshContent = async (options: { adminPreview?: boolean } = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await ApiClient.getMappedPublicContent(options);
      if (response && response.siteSettings) {
        setSiteSettings(response.siteSettings);
      }
      if (response && response.sansthaState) {
        setState((prev) => {
          const nextState: SansthaState = {
            ...prev,
            ...response.sansthaState,
            albums: response.sansthaState.albums?.length
              ? response.sansthaState.albums
              : (prev.albums?.length ? prev.albums : INITIAL_SANSTHA_DATA.albums),
            officials: response.sansthaState.officials?.length
              ? response.sansthaState.officials
              : prev.officials,
            initiatives: response.sansthaState.initiatives?.length
              ? response.sansthaState.initiatives
              : prev.initiatives,
            gallery: response.sansthaState.gallery?.length
              ? response.sansthaState.gallery
              : (prev.gallery?.length ? prev.gallery : INITIAL_SANSTHA_DATA.gallery),
            videos: response.sansthaState.videos?.length
              ? response.sansthaState.videos
              : (prev.videos?.length ? prev.videos : INITIAL_SANSTHA_DATA.videos),
            reports: response.sansthaState.reports?.length
              ? response.sansthaState.reports
              : (prev.reports?.length ? prev.reports : INITIAL_SANSTHA_DATA.reports),
            announcements: response.sansthaState.announcements?.length
              ? response.sansthaState.announcements
              : prev.announcements,
            governmentSchemes: response.sansthaState.governmentSchemes?.length
              ? response.sansthaState.governmentSchemes
              : prev.governmentSchemes,
            contactInfo: response.sansthaState.contactInfo || prev.contactInfo,
            sitePages: response.sansthaState.sitePages?.length
              ? response.sansthaState.sitePages
              : prev.sitePages,
            pageSections: response.sansthaState.pageSections?.length
              ? response.sansthaState.pageSections
              : prev.pageSections,
          };
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
          } catch {}
          return nextState;
        });
        setIsFallback(false);
        setError(null);
      }
    } catch (err: any) {
      console.warn('API content fetch failed, using fallback data:', err?.message || err);
      setError(err?.message || 'Failed to fetch content from server');
      setIsFallback(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch live public content on mount
  useEffect(() => {
    refreshContent();
  }, []);

  // Cross-tab synchronization via BroadcastChannel with storage event fallback
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('shrikrushna_sanstha_sync');
        bc.onmessage = (event) => {
          if (event?.data?.type === 'CONTENT_UPDATED') {
            const hasToken = Boolean(ApiClient.getStoredToken());
            refreshContent({ adminPreview: hasToken });
          }
        };
      } catch (e) {}
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'shrikrushna_last_sync_timestamp') {
        const hasToken = Boolean(ApiClient.getStoredToken());
        refreshContent({ adminPreview: hasToken });
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (bc) {
        try {
          bc.close();
        } catch (e) {}
      }
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [state]);

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      const validRoutes: PageRoute[] = [
        'home',
        'about',
        'officials',
        'initiatives',
        'work',
        'gallery',
        'videos',
        'reports',
        'news',
        'events',
        'contact',
        'volunteer',
        'privacy',
        'admin',
        'schemes',
      ];
      if (hash === 'events') {
        setCurrentRoute('events');
      } else if (validRoutes.includes(hash as PageRoute)) {
        setCurrentRoute(hash as PageRoute);
      } else if (hash.length > 0) {
        setCurrentRoute(hash as PageRoute);
      } else {
        setCurrentRoute('home');
      }
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (route: PageRoute) => {
    setCurrentRoute(route);
    window.location.hash = `#/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Officials CRUD (Authenticated Server Mutation + Live Refresh)
  const addOfficial = async (
    item: Omit<OfficialItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createOfficial(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('official_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create official:', err);
      return { success: false, error: err?.message || 'Failed to create official' };
    }
  };

  const updateOfficial = async (
    id: string,
    updated: Partial<OfficialItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateOfficial(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('official_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update official:', err);
      return { success: false, error: err?.message || 'Failed to update official' };
    }
  };

  const deleteOfficial = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteOfficial(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('official_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete official:', err);
      return { success: false, error: err?.message || 'Failed to delete official' };
    }
  };

  // Site Settings Mutation (Authenticated Server Mutation + Live Refresh)
  const updateSiteSetting = async (
    key: string,
    data: { valueMr?: string; valueEn?: string; description?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateSiteSetting(key, data);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('setting_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update site setting:', err);
      return { success: false, error: err?.message || 'Failed to update site setting' };
    }
  };

  // Initiatives CRUD (Authenticated Server Mutation + Live Refresh)
  const addInitiative = async (
    item: Omit<InitiativeItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createInitiative(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('initiative_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create initiative on server:', err);
      const msg = err?.message || 'Failed to save initiative to server';
      return { success: false, error: msg };
    }
  };

  const updateInitiative = async (
    id: string,
    updated: Partial<InitiativeItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateInitiative(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('initiative_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update initiative on server:', err);
      const msg = err?.message || 'Failed to update initiative on server';
      return { success: false, error: msg };
    }
  };

  const deleteInitiative = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteInitiative(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('initiative_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete initiative on server:', err);
      const msg = err?.message || 'Failed to delete initiative on server';
      return { success: false, error: msg };
    }
  };

  // Gallery Albums CRUD (Authenticated Server Mutation + Live Refresh)
  const addAlbum = async (
    item: Omit<GalleryAlbumItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createAlbum(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('album_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create album on server:', err);
      const msg = err?.message || 'Failed to save album to server';
      return { success: false, error: msg };
    }
  };

  const updateAlbum = async (
    id: string,
    updated: Partial<GalleryAlbumItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateAlbum(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('album_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update album on server:', err);
      const msg = err?.message || 'Failed to update album on server';
      return { success: false, error: msg };
    }
  };

  const deleteAlbum = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteAlbum(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('album_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete album on server:', err);
      const msg = err?.message || 'Failed to delete album on server';
      return { success: false, error: msg };
    }
  };

  // Gallery Photos CRUD (Authenticated Server Mutation + Live Refresh)
  const addGalleryItem = async (
    item: Omit<GalleryItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createGalleryPhoto(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('gallery_photo_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create gallery photo on server:', err);
      const msg = err?.message || 'Failed to save photo to server';
      return { success: false, error: msg };
    }
  };

  const addGalleryPhotosBatch = async (
    photos: Array<Omit<GalleryItem, 'id'>>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createGalleryPhotosBatch(photos);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('gallery_photos_batch_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to batch create gallery photos on server:', err);
      const msg = err?.message || 'Failed to save photos to server';
      return { success: false, error: msg };
    }
  };

  const updateGalleryItem = async (
    id: string,
    updated: Partial<GalleryItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateGalleryPhoto(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('gallery_photo_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update gallery photo on server:', err);
      const msg = err?.message || 'Failed to update photo on server';
      return { success: false, error: msg };
    }
  };

  const deleteGalleryItem = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteGalleryPhoto(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('gallery_photo_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete gallery photo on server:', err);
      const msg = err?.message || 'Failed to delete photo on server';
      return { success: false, error: msg };
    }
  };

  // Videos CRUD (Authenticated Server Mutation + Live Refresh)
  const addVideoItem = async (
    item: Omit<VideoItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createVideo(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('video_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create video on server:', err);
      const msg = err?.message || 'Failed to save video to server';
      return { success: false, error: msg };
    }
  };

  const updateVideoItem = async (
    id: string,
    updated: Partial<VideoItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateVideo(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('video_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update video on server:', err);
      const msg = err?.message || 'Failed to update video on server';
      return { success: false, error: msg };
    }
  };

  const deleteVideoItem = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteVideo(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('video_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete video on server:', err);
      const msg = err?.message || 'Failed to delete video on server';
      return { success: false, error: msg };
    }
  };

  // Reports CRUD (Authenticated Server Mutation + Live Refresh)
  const addReportItem = async (
    item: Omit<ReportItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createReport(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('report_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create report on server:', err);
      const msg = err?.message || 'Failed to save report to server';
      return { success: false, error: msg };
    }
  };

  const updateReportItem = async (
    id: string,
    updated: Partial<ReportItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateReport(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('report_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update report on server:', err);
      const msg = err?.message || 'Failed to update report on server';
      return { success: false, error: msg };
    }
  };

  const deleteReportItem = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteReport(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('report_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete report on server:', err);
      const msg = err?.message || 'Failed to delete report on server';
      return { success: false, error: msg };
    }
  };

  // Announcements / Events CRUD (Authenticated Server Mutation + Live Refresh)
  const addAnnouncement = async (
    item: Omit<AnnouncementItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createAnnouncement(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('announcement_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create announcement on server:', err);
      const msg = err?.message || 'Failed to save announcement to server';
      return { success: false, error: msg };
    }
  };

  const updateAnnouncement = async (
    id: string,
    updated: Partial<AnnouncementItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateAnnouncement(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('announcement_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update announcement on server:', err);
      const msg = err?.message || 'Failed to update announcement on server';
      return { success: false, error: msg };
    }
  };

  const deleteAnnouncement = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteAnnouncement(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('announcement_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete announcement on server:', err);
      const msg = err?.message || 'Failed to delete announcement on server';
      return { success: false, error: msg };
    }
  };

  // Events CRUD (Authenticated Server Mutation + Live Refresh)
  const addEvent = async (
    item: Omit<EventItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createEvent(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('event_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create event on server:', err);
      const msg = err?.message || 'Failed to save event to server';
      return { success: false, error: msg };
    }
  };

  const updateEvent = async (
    id: string,
    updated: Partial<EventItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateEvent(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('event_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update event on server:', err);
      const msg = err?.message || 'Failed to update event on server';
      return { success: false, error: msg };
    }
  };

  const deleteEvent = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteEvent(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('event_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete event on server:', err);
      const msg = err?.message || 'Failed to delete event on server';
      return { success: false, error: msg };
    }
  };

  // Government Welfare Schemes CRUD (Authenticated Server Mutation + Live Refresh)
  const addGovernmentScheme = async (
    item: Omit<GovernmentSchemeItem, 'id'>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.createScheme(item);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('scheme_created');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to create government scheme on server:', err);
      const msg = err?.message || 'Failed to save government scheme to server';
      return { success: false, error: msg };
    }
  };

  const updateGovernmentScheme = async (
    id: string,
    updated: Partial<GovernmentSchemeItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateScheme(id, updated);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('scheme_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update government scheme on server:', err);
      const msg = err?.message || 'Failed to update government scheme on server';
      return { success: false, error: msg };
    }
  };

  const deleteGovernmentScheme = async (
    id: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deleteScheme(id);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('scheme_deleted');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete government scheme on server:', err);
      const msg = err?.message || 'Failed to delete government scheme on server';
      return { success: false, error: msg };
    }
  };

  const updateContactInfo = async (
    info: Partial<ContactInfo>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateContactInfo(info);
      const hasToken = Boolean(ApiClient.getStoredToken());
      await refreshContent({ adminPreview: hasToken });
      notifyBroadcast('contact_updated');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update contact info on server:', err);
      const msg = err?.message || 'Failed to update contact info on server';
      return { success: false, error: msg };
    }
  };

  const resetToDefault = () => {
    setState(INITIAL_SANSTHA_DATA);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Page Sections CRUD
  const addPageSection = async (
    section: Omit<PageSectionItem, 'id'>
  ): Promise<{ success: boolean; error?: string; section?: PageSectionItem }> => {
    try {
      const created = await ApiClient.createPageSection(section);
      await refreshContent({ adminPreview: true });
      notifyBroadcast('ADD_PAGE_SECTION');
      return { success: true, section: created };
    } catch (err: any) {
      console.error('Failed to create page section:', err);
      return { success: false, error: err?.message || 'Failed to create page section' };
    }
  };

  const updatePageSection = async (
    id: number,
    section: Partial<PageSectionItem>
  ): Promise<{ success: boolean; error?: string; section?: PageSectionItem }> => {
    try {
      const updated = await ApiClient.updatePageSection(id, section);
      await refreshContent({ adminPreview: true });
      notifyBroadcast('UPDATE_PAGE_SECTION');
      return { success: true, section: updated };
    } catch (err: any) {
      console.error('Failed to update page section:', err);
      return { success: false, error: err?.message || 'Failed to update page section' };
    }
  };

  const deletePageSection = async (
    id: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.deletePageSection(id);
      await refreshContent({ adminPreview: true });
      notifyBroadcast('DELETE_PAGE_SECTION');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete page section:', err);
      return { success: false, error: err?.message || 'Failed to delete page section' };
    }
  };

  const updateSitePage = async (
    slug: string,
    data: Partial<SitePageItem>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await ApiClient.updateSitePage(slug, data);
      await refreshContent({ adminPreview: true });
      notifyBroadcast('UPDATE_SITE_PAGE');
      return { success: true };
    } catch (err: any) {
      console.error('Failed to update site page:', err);
      return { success: false, error: err?.message || 'Failed to update site page' };
    }
  };

  const exportDataJson = () => {
    return JSON.stringify(state, null, 2);
  };

  const importDataJson = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.initiatives) && Array.isArray(parsed.gallery)) {
        setState(parsed);
        return true;
      }
    } catch (e) {
      console.error('Invalid import JSON:', e);
    }
    return false;
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.mr;

  return (
    <SansthaContext.Provider
      value={{
        state,
        currentRoute,
        setCurrentRoute: navigateTo,
        selectedInitiativeId,
        setSelectedInitiativeId,
        selectedGalleryImage,
        setSelectedGalleryImage,
        lang,
        setLang,
        t,
        isLoading,
        error,
        isFallback,
        refreshContent,
        siteSettings,
        updateSiteSetting,
        addOfficial,
        updateOfficial,
        deleteOfficial,
        addInitiative,
        updateInitiative,
        deleteInitiative,
        addAlbum,
        updateAlbum,
        deleteAlbum,
        addGalleryItem,
        addGalleryPhotosBatch,
        updateGalleryItem,
        deleteGalleryItem,
        addVideoItem,
        updateVideoItem,
        deleteVideoItem,
        addReportItem,
        updateReportItem,
        deleteReportItem,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addEvent,
        updateEvent,
        deleteEvent,
        addGovernmentScheme,
        updateGovernmentScheme,
        deleteGovernmentScheme,
        updateContactInfo,
        addPageSection,
        updatePageSection,
        deletePageSection,
        updateSitePage,
        resetToDefault,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </SansthaContext.Provider>
  );
};

export const useSanstha = () => {
  const context = useContext(SansthaContext);
  if (!context) {
    throw new Error('useSanstha must be used within a SansthaProvider');
  }
  return context;
};
