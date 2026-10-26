import React, { useState, useEffect } from 'react';
import { useSanstha } from '../context/SansthaContext';
import { ApiClient, AdminProfile } from '../services/apiClient';
import {
  CategoryKey,
  OfficialItem,
  VideoItem,
  GalleryAlbumItem,
  GalleryItem,
  InitiativeItem,
  EventItem,
  EventStatus,
  EventPhoto,
  AnnouncementItem,
  ReportItem,
  GovernmentSchemeItem,
  ContactInquiry,
  InquiryCounts,
  InquiryStatus,
  VolunteerRegistration,
  VolunteerCounts,
  VolunteerStatus,
} from '../types';
import { getCategoryLabel } from '../utils/i18n';
import {
  isValidTokenFormat,
  validateSessionToken,
  formatAuthError,
} from '../utils/auth';
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnail,
  isYouTubeUrl,
  isDirectVideoUrl,
  isValidHttpUrl,
  validateVideoSourceUrl,
  VideoSourceChoice,
} from '../utils/youtube';
import { SansthaLogo } from './SansthaLogo';
import { formatEventDate } from '../utils/dateFormatter';
import { PagesSectionsModule } from './admin/PagesSectionsModule';
import { MediaLibraryModule } from './admin/MediaLibraryModule';
import {
  Lock,
  LogOut,
  Plus,
  Trash2,
  Edit3,
  Video,
  Film,
  Image as ImageIcon,
  Layers,
  Calendar,
  FileText,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Play,
  X,
  LayoutDashboard,
  Users,
  Upload,
  Download,
  Loader2,
  ExternalLink,
  Eye,
  EyeOff,
  Landmark,
  Settings,
  FolderPlus,
  Sliders,
  Grid,
  Mail,
  MailOpen,
  Inbox,
  Search,
  RefreshCw,
  User,
  Clock,
  MessageSquare,
  HeartHandshake,
  UserCheck,
  Tag,
  MapPin,
} from 'lucide-react';

type AdminTab =
  | 'dashboard'
  | 'inbox'
  | 'volunteers'
  | 'officials'
  | 'videos'
  | 'gallery'
  | 'initiatives'
  | 'events'
  | 'news'
  | 'reports'
  | 'schemes'
  | 'pages'
  | 'media'
  | 'settings';

const CATEGORIES: CategoryKey[] = [
  'शिक्षण',
  'शासकीय योजना जनजागृती',
  'आरोग्यविषयक उपक्रम',
  'पर्यावरण संवर्धन',
  'महिला व ज्येष्ठ नागरिक सहाय्य',
  'सामाजिक कल्याण',
];

const SESSION_AUTH_KEY = 'shrikrushna_admin_token_v2';

/**
 * Compresses an uploaded image file into a lightweight Data URL (max 900px, JPEG 0.8)
 * so multiple photos and cover images save and load with zero lag.
 */
async function readAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const maxDim = 900;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const AdminPortal: React.FC = () => {
  const {
    state,
    setCurrentRoute,
    lang,
    setLang,
    addOfficial,
    updateOfficial,
    deleteOfficial,
    addVideoItem,
    updateVideoItem,
    deleteVideoItem,
    addAlbum,
    updateAlbum,
    deleteAlbum,
    addGalleryItem,
    addGalleryPhotosBatch,
    updateGalleryItem,
    deleteGalleryItem,
    addInitiative,
    updateInitiative,
    deleteInitiative,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addEvent,
    updateEvent,
    deleteEvent,
    addGovernmentScheme,
    updateGovernmentScheme,
    deleteGovernmentScheme,
    addReportItem,
    updateReportItem,
    deleteReportItem,
    updateContactInfo,
    siteSettings,
    updateSiteSetting,
  } = useSanstha();

  // Authentication state: starts unverified and actively validates against backend on mount
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isVerifyingSession, setIsVerifyingSession] = useState<boolean>(() => {
    return Boolean(ApiClient.getStoredToken());
  });
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(() => ApiClient.getStoredProfile());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Listen for 401/403 authorization failures on any API request
    const unbind = ApiClient.onAuthFailure(() => {
      if (isMounted) {
        setIsAuthenticated(false);
        setAdminProfile(null);
        setLoginError(
          lang === 'mr'
            ? 'आपले सत्र समाप्त झाले आहे. कृपया पुन्हा लॉगिन करा.'
            : 'Your session has expired or was revoked. Please log in again.'
        );
      }
    });

    // Actively verify stored Bearer token with the PHP backend:
    // GET /backend-php-mysql/api/auth.php?action=verify
    const checkServerSession = async () => {
      const token = ApiClient.getStoredToken();
      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsVerifyingSession(false);
        }
        return;
      }

      const result = await ApiClient.verifySession(token);
      if (isMounted) {
        if (result.isValid && result.admin) {
          setIsAuthenticated(true);
          setAdminProfile(result.admin);
        } else {
          setIsAuthenticated(false);
          setAdminProfile(null);
          if (result.error === 'TOKEN_EXPIRED_OR_REVOKED') {
            setLoginError(
              lang === 'mr'
                ? 'सत्र समाप्त झाले आहे. कृपया पुन्हा लॉगिन करा.'
                : 'Session expired or revoked. Please log in again.'
            );
          }
        }
        setIsVerifyingSession(false);
      }
    };

    checkServerSession();

    return () => {
      isMounted = false;
      unbind();
    };
  }, [lang]);

  // Active Navigation Tab & Status Toast
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoItem | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- INBOX (CONTACT INQUIRIES) STATE & HANDLERS ---
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [inquiryCounts, setInquiryCounts] = useState<InquiryCounts>({
    total: 0,
    unread: 0,
    read: 0,
    replied: 0,
    archived: 0,
  });
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [inquiryFilter, setInquiryFilter] = useState<'all' | 'new' | 'read' | 'replied' | 'archived'>('all');
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<ContactInquiry | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<ContactInquiry | null>(null);
  const [isUpdatingInquiryStatus, setIsUpdatingInquiryStatus] = useState<number | null>(null);
  const [isDeletingInquiry, setIsDeletingInquiry] = useState(false);

  const loadInquiries = async () => {
    if (!isAuthenticated) return;
    setIsLoadingInquiries(true);
    setInquiryError(null);
    try {
      const res = await ApiClient.getInquiries({
        status: inquiryFilter !== 'all' ? inquiryFilter : undefined,
        q: inquirySearchQuery.trim() || undefined,
      });
      setInquiries(res.inquiries);
      if (res.counts) {
        setInquiryCounts(res.counts);
      }
    } catch (err: any) {
      console.error('Failed to load inquiries:', err);
      setInquiryError(
        err?.message ||
          (lang === 'mr' ? 'संदेश लोड करताना त्रुटी आली.' : 'Failed to load inquiries.')
      );
    } finally {
      setIsLoadingInquiries(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadInquiries();
    }
  }, [isAuthenticated, inquiryFilter]);

  const handleToggleInquiryStatus = async (inquiry: ContactInquiry) => {
    const nextStatus = inquiry.status === 'new' ? 'read' : 'new';
    setIsUpdatingInquiryStatus(inquiry.id);
    try {
      const updated = await ApiClient.updateInquiryStatus(inquiry.id, nextStatus);
      setInquiries((prev) =>
        prev.map((item) => (item.id === inquiry.id ? updated : item))
      );
      if (selectedInquiry?.id === inquiry.id) {
        setSelectedInquiry(updated);
      }
      setInquiryCounts((prev) => {
        const diffUnread = nextStatus === 'new' ? 1 : -1;
        const diffRead = nextStatus === 'read' ? 1 : -1;
        return {
          ...prev,
          unread: Math.max(0, prev.unread + diffUnread),
          read: Math.max(0, prev.read + diffRead),
        };
      });
      showToast(
        nextStatus === 'read'
          ? (lang === 'mr' ? 'संदेश "वाचलेला" म्हणून चिन्हांकित केला.' : 'Marked as read.')
          : (lang === 'mr' ? 'संदेश "न वाचलेला" म्हणून चिन्हांकित केला.' : 'Marked as unread.')
      );
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'स्थिती बदलण्यात अयशस्वी.' : 'Failed to update status.'));
    } finally {
      setIsUpdatingInquiryStatus(null);
    }
  };

  const handleConfirmDeleteInquiry = async () => {
    if (!inquiryToDelete) return;
    setIsDeletingInquiry(true);
    try {
      await ApiClient.deleteInquiry(inquiryToDelete.id);
      setInquiries((prev) => prev.filter((item) => item.id !== inquiryToDelete.id));
      if (selectedInquiry?.id === inquiryToDelete.id) {
        setSelectedInquiry(null);
      }
      setInquiryCounts((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unread: inquiryToDelete.status === 'new' ? Math.max(0, prev.unread - 1) : prev.unread,
        read: inquiryToDelete.status === 'read' ? Math.max(0, prev.read - 1) : prev.read,
      }));
      showToast(lang === 'mr' ? 'संदेश यशस्वीरित्या हटवला गेला.' : 'Message deleted successfully.');
      setInquiryToDelete(null);
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'संदेश हटवण्यात अयशस्वी.' : 'Failed to delete message.'));
    } finally {
      setIsDeletingInquiry(false);
    }
  };

  // --- VOLUNTEER REGISTRATIONS STATE & HANDLERS ---
  const [volunteers, setVolunteers] = useState<VolunteerRegistration[]>([]);
  const [volunteerCounts, setVolunteerCounts] = useState<VolunteerCounts>({
    total: 0,
    new: 0,
    reviewing: 0,
    approved: 0,
    contacted: 0,
    declined: 0,
    archived: 0,
  });
  const [isLoadingVolunteers, setIsLoadingVolunteers] = useState(false);
  const [volunteerError, setVolunteerError] = useState<string | null>(null);
  const [volunteerFilter, setVolunteerFilter] = useState<'all' | VolunteerStatus>('all');
  const [volunteerSearchQuery, setVolunteerSearchQuery] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<VolunteerRegistration | null>(null);
  const [volunteerToDelete, setVolunteerToDelete] = useState<VolunteerRegistration | null>(null);
  const [isUpdatingVolunteerStatus, setIsUpdatingVolunteerStatus] = useState<number | null>(null);
  const [isDeletingVolunteer, setIsDeletingVolunteer] = useState(false);
  const [volunteerAdminNotesInput, setVolunteerAdminNotesInput] = useState('');

  const loadVolunteers = async () => {
    if (!isAuthenticated) return;
    setIsLoadingVolunteers(true);
    setVolunteerError(null);
    try {
      const res = await ApiClient.getVolunteers({
        status: volunteerFilter !== 'all' ? volunteerFilter : undefined,
        q: volunteerSearchQuery.trim() || undefined,
      });
      setVolunteers(res.volunteers);
      if (res.counts) {
        setVolunteerCounts(res.counts);
      }
    } catch (err: any) {
      console.error('Failed to load volunteers:', err);
      setVolunteerError(
        err?.message ||
          (lang === 'mr' ? 'स्वयंसेवक माहिती लोड करताना त्रुटी आली.' : 'Failed to load volunteers.')
      );
    } finally {
      setIsLoadingVolunteers(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadVolunteers();
    }
  }, [isAuthenticated, volunteerFilter]);

  const handleUpdateVolunteerStatus = async (
    volunteer: VolunteerRegistration,
    nextStatus: VolunteerStatus,
    adminNotes?: string
  ) => {
    setIsUpdatingVolunteerStatus(volunteer.id);
    try {
      const updated = await ApiClient.updateVolunteerStatus(volunteer.id, nextStatus, adminNotes);
      setVolunteers((prev) =>
        prev.map((item) => (item.id === volunteer.id ? updated : item))
      );
      if (selectedVolunteer?.id === volunteer.id) {
        setSelectedVolunteer(updated);
      }
      showToast(
        lang === 'mr'
          ? `स्थिती यशस्वीरित्या "${nextStatus}" मध्ये बदलली.`
          : `Volunteer status updated to "${nextStatus}".`
      );
      loadVolunteers();
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'स्थिती बदलण्यात अयशस्वी.' : 'Failed to update status.'));
    } finally {
      setIsUpdatingVolunteerStatus(null);
    }
  };

  const handleConfirmDeleteVolunteer = async () => {
    if (!volunteerToDelete) return;
    setIsDeletingVolunteer(true);
    try {
      await ApiClient.deleteVolunteer(volunteerToDelete.id);
      setVolunteers((prev) => prev.filter((item) => item.id !== volunteerToDelete.id));
      if (selectedVolunteer?.id === volunteerToDelete.id) {
        setSelectedVolunteer(null);
      }
      setVolunteerCounts((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        new: volunteerToDelete.status === 'new' ? Math.max(0, prev.new - 1) : prev.new,
      }));
      showToast(lang === 'mr' ? 'स्वयंसेवक नोंदणी यशस्वीरित्या हटवली गेली.' : 'Volunteer registration deleted successfully.');
      setVolunteerToDelete(null);
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'नोंदणी हटवण्यात अयशस्वी.' : 'Failed to delete volunteer.'));
    } finally {
      setIsDeletingVolunteer(false);
    }
  };

  // --- 1. OFFICIALS FORM STATE (Create + Edit + Display Order + Publication Status + Bilingual) ---
  const [editingOfficialId, setEditingOfficialId] = useState<string | null>(null);
  const [offName, setOffName] = useState('');
  const [offNameEn, setOffNameEn] = useState('');
  const [offRole, setOffRole] = useState('');
  const [offRoleEn, setOffRoleEn] = useState('');
  const [offImageUrl, setOffImageUrl] = useState('');
  const [offBio, setOffBio] = useState('');
  const [offBioEn, setOffBioEn] = useState('');
  const [offPhone, setOffPhone] = useState('');
  const [offDisplayOrder, setOffDisplayOrder] = useState<number>(0);
  const [offPublished, setOffPublished] = useState<boolean>(true);
  const [isSavingOfficial, setIsSavingOfficial] = useState(false);
  const [isDeletingOfficialId, setIsDeletingOfficialId] = useState<string | null>(null);
  const [isTogglingPublishOfficialId, setIsTogglingPublishOfficialId] = useState<string | null>(null);
  const [officialFormError, setOfficialFormError] = useState<string | null>(null);
  const [offPhotoSource, setOffPhotoSource] = useState<'upload' | 'url'>('upload');
  const [isUploadingOffPhoto, setIsUploadingOffPhoto] = useState(false);
  const [offPhotoUploadProgress, setOffPhotoUploadProgress] = useState(0);
  const [offPhotoUploadError, setOffPhotoUploadError] = useState<string | null>(null);
  const [offPendingPreview, setOffPendingPreview] = useState<string | null>(null);

  // --- 1B. SITE SETTINGS FORM STATE (Hero & Highlights) ---
  const [heroBadgeMr, setHeroBadgeMr] = useState('');
  const [heroBadgeEn, setHeroBadgeEn] = useState('');
  const [taglineMr, setTaglineMr] = useState('');
  const [taglineEn, setTaglineEn] = useState('');
  const [statsBeneficiariesMr, setStatsBeneficiariesMr] = useState('');
  const [statsBeneficiariesEn, setStatsBeneficiariesEn] = useState('');
  const [statsVillagesMr, setStatsVillagesMr] = useState('');
  const [statsVillagesEn, setStatsVillagesEn] = useState('');
  const [isSavingSettingKey, setIsSavingSettingKey] = useState<string | null>(null);

  useEffect(() => {
    if (siteSettings) {
      if (siteSettings.hero_badge) {
        setHeroBadgeMr(siteSettings.hero_badge.mr || '');
        setHeroBadgeEn(siteSettings.hero_badge.en || '');
      }
      if (siteSettings.sanstha_tagline) {
        setTaglineMr(siteSettings.sanstha_tagline.mr || '');
        setTaglineEn(siteSettings.sanstha_tagline.en || '');
      }
      if (siteSettings.hero_stats_beneficiaries) {
        setStatsBeneficiariesMr(siteSettings.hero_stats_beneficiaries.mr || '');
        setStatsBeneficiariesEn(siteSettings.hero_stats_beneficiaries.en || '');
      }
      if (siteSettings.hero_stats_villages) {
        setStatsVillagesMr(siteSettings.hero_stats_villages.mr || '');
        setStatsVillagesEn(siteSettings.hero_stats_villages.en || '');
      }
    }
  }, [siteSettings]);

  const resetOfficialForm = () => {
    setEditingOfficialId(null);
    setOffName('');
    setOffNameEn('');
    setOffRole('');
    setOffRoleEn('');
    setOffImageUrl('');
    setOffBio('');
    setOffBioEn('');
    setOffPhone('');
    setOffDisplayOrder(0);
    setOffPublished(true);
    setOfficialFormError(null);
    setOffPhotoUploadError(null);
    setOffPendingPreview(null);
    setIsUploadingOffPhoto(false);
    setOffPhotoUploadProgress(0);
  };

  const startEditOfficial = (item: OfficialItem) => {
    setEditingOfficialId(item.id);
    setOffName(item.name || '');
    setOffNameEn(item.nameEn || '');
    setOffRole(item.role || '');
    setOffRoleEn(item.roleEn || '');
    setOffImageUrl(item.imageUrl || '');
    setOffBio(item.bio || '');
    setOffBioEn(item.bioEn || '');
    setOffPhone(item.phone || '');
    setOffDisplayOrder(item.displayOrder ?? 0);
    setOffPublished(item.published !== false);
    setOfficialFormError(null);
    setOffPhotoUploadError(null);
    setOffPendingPreview(null);
    setIsUploadingOffPhoto(false);
    setOffPhotoUploadProgress(0);
    if (item.imageUrl?.startsWith('http://') || item.imageUrl?.startsWith('https://')) {
      setOffPhotoSource('url');
    } else {
      setOffPhotoSource('upload');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 2. VIDEO FORM STATE (Dual Source Support + Create + Edit + Cover Image Upload) ---
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [videoSourceType, setVideoSourceType] = useState<VideoSourceChoice>('youtube');
  const [ytUrl, setYtUrl] = useState('');
  const [videoUrlError, setVideoUrlError] = useState<string | null>(null);
  const [vidTitle, setVidTitle] = useState('');
  const [vidTitleEn, setVidTitleEn] = useState('');
  const [vidCategory, setVidCategory] = useState<CategoryKey>('शिक्षण');
  const [vidDesc, setVidDesc] = useState('');
  const [vidDescEn, setVidDescEn] = useState('');
  const [vidCoverUrl, setVidCoverUrl] = useState('');
  const [vidFeatured, setVidFeatured] = useState(true);
  const [vidPublished, setVidPublished] = useState(true);
  const [isSavingVideo, setIsSavingVideo] = useState(false);
  const [isDeletingVideoId, setIsDeletingVideoId] = useState<string | null>(null);
  const [isTogglingPublishVideoId, setIsTogglingPublishVideoId] = useState<string | null>(null);

  // Admin preview player states
  const [adminPreviewLoading, setAdminPreviewLoading] = useState<boolean>(false);
  const [adminPreviewError, setAdminPreviewError] = useState<boolean>(false);

  useEffect(() => {
    if (previewVideo?.videoUrl) {
      if (isYouTubeUrl(previewVideo.videoUrl)) {
        setAdminPreviewLoading(false);
        setAdminPreviewError(false);
      } else {
        setAdminPreviewLoading(true);
        setAdminPreviewError(false);
      }
    } else {
      setAdminPreviewLoading(false);
      setAdminPreviewError(false);
    }
  }, [previewVideo?.videoUrl, previewVideo?.id]);

  const resetVideoForm = () => {
    setEditingVideoId(null);
    setVideoSourceType('youtube');
    setYtUrl('');
    setVideoUrlError(null);
    setVidTitle('');
    setVidTitleEn('');
    setVidCategory('शिक्षण');
    setVidDesc('');
    setVidDescEn('');
    setVidCoverUrl('');
    setVidFeatured(false);
    setVidPublished(true);
  };

  const startEditVideo = (v: VideoItem) => {
    setEditingVideoId(v.id);
    const rawUrl = v.videoUrl || '';
    setYtUrl(rawUrl);
    setVideoSourceType(isYouTubeUrl(rawUrl) ? 'youtube' : 'direct');
    setVideoUrlError(null);
    setVidTitle(v.title || '');
    setVidTitleEn(v.titleEn || '');
    setVidCategory(v.category);
    setVidDesc(v.description || '');
    setVidDescEn(v.descriptionEn || '');
    setVidCoverUrl(v.thumbnailUrl || '');
    setVidFeatured(Boolean(v.featured));
    setVidPublished(v.published !== false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectVideoSource = (newSource: 'youtube' | 'direct') => {
    setVideoSourceType(newSource);
    // Preserve existing URL string; re-validate against newly selected source
    if (ytUrl.trim()) {
      const result = validateVideoSourceUrl(ytUrl.trim(), newSource);
      if (!result.isValid) {
        setVideoUrlError(lang === 'mr' ? result.errorMr || null : result.errorEn || null);
      } else {
        setVideoUrlError(null);
      }
    } else {
      setVideoUrlError(null);
    }
  };

  const handleVideoUrlChange = (newUrl: string) => {
    setYtUrl(newUrl);
    if (newUrl.trim()) {
      const result = validateVideoSourceUrl(newUrl.trim(), videoSourceType);
      if (!result.isValid) {
        setVideoUrlError(lang === 'mr' ? result.errorMr || null : result.errorEn || null);
      } else {
        setVideoUrlError(null);
      }
    } else {
      setVideoUrlError(null);
    }
  };

  // --- 3A. GALLERY ALBUMS FORM STATE ---
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [albumTitle, setAlbumTitle] = useState('');
  const [albumTitleEn, setAlbumTitleEn] = useState('');
  const [albumDesc, setAlbumDesc] = useState('');
  const [albumDescEn, setAlbumDescEn] = useState('');
  const [albumCategory, setAlbumCategory] = useState<CategoryKey>('शिक्षण');
  const [albumCoverUrl, setAlbumCoverUrl] = useState('');
  const [albumEventDate, setAlbumEventDate] = useState('2025-01-15');
  const [albumDisplayMode, setAlbumDisplayMode] = useState<'grid' | 'carousel'>('grid');
  const [albumDisplayOrder, setAlbumDisplayOrder] = useState<number>(0);
  const [albumPublished, setAlbumPublished] = useState<boolean>(true);
  const [isSavingAlbum, setIsSavingAlbum] = useState(false);
  const [isDeletingAlbumId, setIsDeletingAlbumId] = useState<string | null>(null);
  const [isUploadingAlbumCover, setIsUploadingAlbumCover] = useState(false);
  const [albumCoverUploadProgress, setAlbumCoverUploadProgress] = useState(0);

  const resetAlbumForm = () => {
    setEditingAlbumId(null);
    setAlbumTitle('');
    setAlbumTitleEn('');
    setAlbumDesc('');
    setAlbumDescEn('');
    setAlbumCategory('शिक्षण');
    setAlbumCoverUrl('');
    setAlbumEventDate(new Date().toISOString().split('T')[0]);
    setAlbumDisplayMode('grid');
    setAlbumDisplayOrder((state.albums?.length || 0) + 1);
    setAlbumPublished(true);
    setIsSavingAlbum(false);
    setIsUploadingAlbumCover(false);
    setAlbumCoverUploadProgress(0);
  };

  const startEditAlbum = (alb: GalleryAlbumItem) => {
    setEditingAlbumId(alb.id);
    setAlbumTitle(alb.title);
    setAlbumTitleEn(alb.titleEn || '');
    setAlbumDesc(alb.description || '');
    setAlbumDescEn(alb.descriptionEn || '');
    setAlbumCategory((alb.category as CategoryKey) || 'शिक्षण');
    setAlbumCoverUrl(alb.coverImageUrl || '');
    setAlbumEventDate(alb.eventDate || new Date().toISOString().split('T')[0]);
    setAlbumDisplayMode(alb.displayMode || 'grid');
    setAlbumDisplayOrder(alb.displayOrder || 0);
    setAlbumPublished(alb.published !== false);
    setShowAlbumModal(true);
  };

  // --- 3B. GALLERY PHOTOS FORM STATE (Multi-Upload + Batch DB + Album Assignment + Bilingual) ---
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoTitleEn, setPhotoTitleEn] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoCaptionEn, setPhotoCaptionEn] = useState('');
  const [photoCategory, setPhotoCategory] = useState<CategoryKey>('शिक्षण');
  const [photoAlbumId, setPhotoAlbumId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoDisplayOrder, setPhotoDisplayOrder] = useState<number>(0);
  const [photoFeaturedHome, setPhotoFeaturedHome] = useState(true);
  const [photoPublished, setPhotoPublished] = useState(true);
  const [selectedAlbumFilter, setSelectedAlbumFilter] = useState<string>('all');

  // Staging uploaded server images before saving
  const [stagedUploads, setStagedUploads] = useState<Array<{
    url: string;
    filename: string;
    title: string;
    titleEn: string;
    caption: string;
    captionEn: string;
  }>>([]);

  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [galleryUploadProgress, setGalleryUploadProgress] = useState(0);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isDeletingPhotoId, setIsDeletingPhotoId] = useState<string | null>(null);
  const [isTogglingPublishPhotoId, setIsTogglingPublishPhotoId] = useState<string | null>(null);

  const resetPhotoForm = () => {
    setEditingPhotoId(null);
    setPhotoTitle('');
    setPhotoTitleEn('');
    setPhotoCaption('');
    setPhotoCaptionEn('');
    setPhotoCategory('शिक्षण');
    setPhotoAlbumId(state.albums?.[0]?.id || '');
    setPhotoUrl('');
    setPhotoDisplayOrder(0);
    setPhotoFeaturedHome(true);
    setPhotoPublished(true);
    setStagedUploads([]);
    setIsUploadingGallery(false);
    setGalleryUploadProgress(0);
    setGalleryUploadError(null);
  };

  const startEditPhoto = (g: GalleryItem) => {
    setEditingPhotoId(g.id);
    setPhotoTitle(g.title);
    setPhotoTitleEn(g.titleEn || g.title);
    setPhotoCaption(g.caption || g.title);
    setPhotoCaptionEn(g.captionEn || g.caption || g.title);
    setPhotoCategory(g.category);
    setPhotoAlbumId(g.albumId || state.albums?.[0]?.id || '');
    setPhotoUrl(g.imageUrl);
    setPhotoDisplayOrder(g.displayOrder || 0);
    setPhotoFeaturedHome(g.featuredOnHome !== false);
    setPhotoPublished(g.published !== false);
    setStagedUploads([]);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // --- 4. INITIATIVES FORM STATE (Create + Edit + Cover Image + Multiple Images + Bilingual + Report Relationship) ---
  const [editingInitId, setEditingInitId] = useState<string | null>(null);
  const [initTitle, setInitTitle] = useState('');
  const [initTitleEn, setInitTitleEn] = useState('');
  const [initCategory, setInitCategory] = useState<CategoryKey>('शिक्षण');
  const [initDate, setInitDate] = useState('2025-03-01');
  const [initLocation, setInitLocation] = useState('नादरपूर, ता. कन्नड');
  const [initLocationEn, setInitLocationEn] = useState('Nadarpur, Tal. Kannad');
  const [initSummary, setInitSummary] = useState('');
  const [initSummaryEn, setInitSummaryEn] = useState('');
  const [initDesc, setInitDesc] = useState('');
  const [initDescEn, setInitDescEn] = useState('');
  const [initImageUrl, setInitImageUrl] = useState('');
  const [initExtraImages, setInitExtraImages] = useState<string[]>([]);
  const [initExtraUrlInput, setInitExtraUrlInput] = useState('');
  const [initPublished, setInitPublished] = useState(true);
  const [initFeatured, setInitFeatured] = useState(false);
  const [initRelatedReportId, setInitRelatedReportId] = useState('');
  const [isSavingInit, setIsSavingInit] = useState(false);
  const [isDeletingInitId, setIsDeletingInitId] = useState<string | null>(null);
  const [isTogglingPublishInitId, setIsTogglingPublishInitId] = useState<string | null>(null);

  const resetInitForm = () => {
    setEditingInitId(null);
    setInitTitle('');
    setInitTitleEn('');
    setInitCategory('शिक्षण');
    setInitDate('2025-03-01');
    setInitLocation('नादरपूर, ता. कन्नड');
    setInitLocationEn('Nadarpur, Tal. Kannad');
    setInitSummary('');
    setInitSummaryEn('');
    setInitDesc('');
    setInitDescEn('');
    setInitImageUrl('');
    setInitExtraImages([]);
    setInitExtraUrlInput('');
    setInitPublished(true);
    setInitFeatured(false);
    setInitRelatedReportId('');
  };

  const startEditInit = (item: InitiativeItem) => {
    setEditingInitId(item.id);
    setInitTitle(item.title || '');
    setInitTitleEn(item.titleEn || '');
    setInitCategory(item.category || 'शिक्षण');
    setInitDate(item.date || '');
    setInitLocation(item.location || '');
    setInitLocationEn(item.locationEn || '');
    setInitSummary(item.summary || '');
    setInitSummaryEn(item.summaryEn || '');
    setInitDesc(item.description || '');
    setInitDescEn(item.descriptionEn || '');
    setInitImageUrl(item.imageUrl || '');
    setInitExtraImages(item.images || []);
    setInitExtraUrlInput('');
    setInitPublished(item.published !== false);
    setInitFeatured(Boolean(item.featured));
    setInitRelatedReportId(item.relatedReportId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 5. NEWS & EVENTS FORM STATE (Create + Edit + Cover Image + Multiple Images) ---
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsTitle, setNewsTitle] = useState('');
  const [newsTitleEn, setNewsTitleEn] = useState('');
  const [newsDate, setNewsDate] = useState('२०२५-०४-१५');
  const [newsDateEn, setNewsDateEn] = useState('2025-04-15');
  const [newsCategory, setNewsCategory] = useState<CategoryKey>('शिक्षण');
  const [newsUpcoming, setNewsUpcoming] = useState(true);
  const [newsSummary, setNewsSummary] = useState('');
  const [newsSummaryEn, setNewsSummaryEn] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsContentEn, setNewsContentEn] = useState('');
  const [newsCoverUrl, setNewsCoverUrl] = useState('');
  const [newsExtraImages, setNewsExtraImages] = useState<string[]>([]);
  const [newsExtraUrlInput, setNewsExtraUrlInput] = useState('');
  const [newsPublished, setNewsPublished] = useState(true);
  const [isSavingNews, setIsSavingNews] = useState(false);
  const [isDeletingNewsId, setIsDeletingNewsId] = useState<string | null>(null);
  const [isTogglingPublishNewsId, setIsTogglingPublishNewsId] = useState<string | null>(null);

  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsTitle('');
    setNewsTitleEn('');
    setNewsDate('२०२५-०४-१५');
    setNewsDateEn('2025-04-15');
    setNewsCategory('शिक्षण');
    setNewsUpcoming(true);
    setNewsSummary('');
    setNewsSummaryEn('');
    setNewsContent('');
    setNewsContentEn('');
    setNewsCoverUrl('');
    setNewsExtraImages([]);
    setNewsPublished(true);
  };

  const startEditNews = (item: AnnouncementItem) => {
    setEditingNewsId(item.id);
    setNewsTitle(item.title);
    setNewsTitleEn(item.titleEn || '');
    setNewsDate(item.date);
    setNewsDateEn(item.dateEn || item.date);
    setNewsCategory(item.category);
    setNewsUpcoming(item.isUpcoming);
    setNewsSummary(item.summary);
    setNewsSummaryEn(item.summaryEn || '');
    setNewsContent(item.content || '');
    setNewsContentEn(item.contentEn || '');
    setNewsCoverUrl(item.coverImageUrl || '');
    setNewsExtraImages(item.images || []);
    setNewsPublished(item.published !== false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 5C. EVENTS MANAGEMENT FORM STATE (Bilingual + Dates + Time + Venue + Status + Photos) ---
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTitleEn, setEventTitleEn] = useState('');
  const [eventCategory, setEventCategory] = useState<CategoryKey>('शिक्षण');
  const [eventStartDate, setEventStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventEndDate, setEventEndDate] = useState('');
  const [eventDateTextMr, setEventDateTextMr] = useState('');
  const [eventDateTextEn, setEventDateTextEn] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('नादरपूर, ता. कन्नड');
  const [eventVenueEn, setEventVenueEn] = useState('Nadarpur, Tahsil Kannad');
  const [eventStatus, setEventStatus] = useState<EventStatus>('upcoming');
  const [eventSummary, setEventSummary] = useState('');
  const [eventSummaryEn, setEventSummaryEn] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDescriptionEn, setEventDescriptionEn] = useState('');
  const [eventCoverUrl, setEventCoverUrl] = useState('');
  const [eventExtraImages, setEventExtraImages] = useState<string[]>([]);
  const [eventExtraUrlInput, setEventExtraUrlInput] = useState('');
  const [eventIsFeatured, setEventIsFeatured] = useState(false);
  const [eventPublished, setEventPublished] = useState(true);
  const [eventDisplayOrder, setEventDisplayOrder] = useState<number>(0);
  const [isSavingEvent, setIsSavingEvent] = useState(false);
  const [isDeletingEventId, setIsDeletingEventId] = useState<string | null>(null);
  const [isTogglingPublishEventId, setIsTogglingPublishEventId] = useState<string | null>(null);
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [eventStatusFilter, setEventStatusFilter] = useState<'all' | EventStatus>('all');
  const [isUploadingEventCover, setIsUploadingEventCover] = useState(false);
  const [eventCoverUploadProgress, setEventCoverUploadProgress] = useState(0);
  const [eventCoverUploadError, setEventCoverUploadError] = useState<string | null>(null);
  const [isUploadingEventPhoto, setIsUploadingEventPhoto] = useState(false);
  const [eventPhotoUploadProgress, setEventPhotoUploadProgress] = useState(0);
  const [eventPhotoUploadError, setEventPhotoUploadError] = useState<string | null>(null);

  const resetEventForm = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventTitleEn('');
    setEventCategory('शिक्षण');
    setEventStartDate(new Date().toISOString().split('T')[0]);
    setEventEndDate('');
    setEventDateTextMr('');
    setEventDateTextEn('');
    setEventTime('');
    setEventVenue('नादरपूर, ता. कन्नड');
    setEventVenueEn('Nadarpur, Tahsil Kannad');
    setEventStatus('upcoming');
    setEventSummary('');
    setEventSummaryEn('');
    setEventDescription('');
    setEventDescriptionEn('');
    setEventCoverUrl('');
    setEventCoverUploadProgress(0);
    setEventCoverUploadError(null);
    setEventExtraImages([]);
    setEventExtraUrlInput('');
    setEventPhotoUploadProgress(0);
    setEventPhotoUploadError(null);
    setEventIsFeatured(false);
    setEventPublished(true);
    setEventDisplayOrder(0);
  };

  const startEditEvent = (item: EventItem) => {
    setEditingEventId(item.id);
    setEventTitle(item.title);
    setEventTitleEn(item.titleEn || '');
    setEventCategory(item.category);
    setEventStartDate(item.startDate || new Date().toISOString().split('T')[0]);
    setEventEndDate(item.endDate || '');
    setEventDateTextMr(item.eventDateTextMr || '');
    setEventDateTextEn(item.eventDateTextEn || '');
    setEventTime(item.eventTime || '');
    setEventVenue(item.venue || 'नादरपूर, ता. कन्नड');
    setEventVenueEn(item.venueEn || 'Nadarpur, Tahsil Kannad');
    setEventStatus(item.status || 'upcoming');
    setEventSummary(item.summary);
    setEventSummaryEn(item.summaryEn || '');
    setEventDescription(item.description || '');
    setEventDescriptionEn(item.descriptionEn || '');
    setEventCoverUrl(item.coverImageUrl || '');
    setEventCoverUploadError(null);
    setEventCoverUploadProgress(0);
    const photoUrls = (item.photos || []).map((p: any) => typeof p === 'string' ? p : (p.imageUrl || p.image_url || p.photo_url || p.url || '')).filter(Boolean);
    setEventExtraImages(photoUrls);
    setEventExtraUrlInput('');
    setEventPhotoUploadError(null);
    setEventPhotoUploadProgress(0);
    setEventIsFeatured(Boolean(item.isFeatured));
    setEventPublished(item.published !== false);
    setEventDisplayOrder(item.displayOrder || 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 5B. GOVERNMENT WELFARE SCHEMES FORM STATE ---
  const [editingSchemeId, setEditingSchemeId] = useState<string | null>(null);
  const [schemeTitle, setSchemeTitle] = useState('');
  const [schemeTitleEn, setSchemeTitleEn] = useState('');
  const [schemeDept, setSchemeDept] = useState('');
  const [schemeDeptEn, setSchemeDeptEn] = useState('');
  const [schemeBenCat, setSchemeBenCat] = useState('');
  const [schemeBenCatEn, setSchemeBenCatEn] = useState('');
  const [schemeSummary, setSchemeSummary] = useState('');
  const [schemeSummaryEn, setSchemeSummaryEn] = useState('');
  const [schemeEligibility, setSchemeEligibility] = useState('');
  const [schemeEligibilityEn, setSchemeEligibilityEn] = useState('');
  const [schemeDocs, setSchemeDocs] = useState('');
  const [schemeDocsEn, setSchemeDocsEn] = useState('');
  const [schemeBenefits, setSchemeBenefits] = useState('');
  const [schemeBenefitsEn, setSchemeBenefitsEn] = useState('');
  const [schemePortalUrl, setSchemePortalUrl] = useState('');
  const [schemeCoverUrl, setSchemeCoverUrl] = useState('');
  const [schemePublished, setSchemePublished] = useState(true);
  const [schemeFeatured, setSchemeFeatured] = useState(false);
  const [isSavingScheme, setIsSavingScheme] = useState(false);
  const [isDeletingSchemeId, setIsDeletingSchemeId] = useState<string | null>(null);
  const [isTogglingPublishSchemeId, setIsTogglingPublishSchemeId] = useState<string | null>(null);

  const resetSchemeForm = () => {
    setEditingSchemeId(null);
    setSchemeTitle('');
    setSchemeTitleEn('');
    setSchemeDept('');
    setSchemeDeptEn('');
    setSchemeBenCat('');
    setSchemeBenCatEn('');
    setSchemeSummary('');
    setSchemeSummaryEn('');
    setSchemeEligibility('');
    setSchemeEligibilityEn('');
    setSchemeDocs('');
    setSchemeDocsEn('');
    setSchemeBenefits('');
    setSchemeBenefitsEn('');
    setSchemePortalUrl('');
    setSchemeCoverUrl('');
    setSchemePublished(true);
    setSchemeFeatured(false);
  };

  const startEditScheme = (item: GovernmentSchemeItem) => {
    setEditingSchemeId(item.id);
    setSchemeTitle(item.title);
    setSchemeTitleEn(item.titleEn || '');
    setSchemeDept(item.department || '');
    setSchemeDeptEn(item.departmentEn || '');
    setSchemeBenCat(item.beneficiaryCategory || '');
    setSchemeBenCatEn(item.beneficiaryCategoryEn || '');
    setSchemeSummary(item.summary);
    setSchemeSummaryEn(item.summaryEn || '');
    setSchemeEligibility(item.eligibility || '');
    setSchemeEligibilityEn(item.eligibilityEn || '');
    setSchemeDocs(item.documentsRequired || '');
    setSchemeDocsEn(item.documentsRequiredEn || '');
    setSchemeBenefits(item.benefits || '');
    setSchemeBenefitsEn(item.benefitsEn || '');
    setSchemePortalUrl(item.officialPortalUrl || '');
    setSchemeCoverUrl(item.coverImageUrl || '');
    setSchemePublished(item.published !== false);
    setSchemeFeatured(Boolean(item.featured));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- 6. REPORTS & CONTACT FORM STATE (Bilingual + PDF Upload + Server Mutations) ---
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [repTitle, setRepTitle] = useState('');
  const [repTitleEn, setRepTitleEn] = useState('');
  const [repPeriod, setRepPeriod] = useState('वर्ष २०२४-२५');
  const [repPeriodEn, setRepPeriodEn] = useState('Year 2024-25');
  const [repCategory, setRepCategory] = useState('वार्षिक अहवाल');
  const [repCategoryEn, setRepCategoryEn] = useState('Annual Report');
  const [repSummary, setRepSummary] = useState('');
  const [repSummaryEn, setRepSummaryEn] = useState('');
  const [repDate, setRepDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [repFileSize, setRepFileSize] = useState('PDF');
  const [repCoverUrl, setRepCoverUrl] = useState('');
  const [repPdfUrl, setRepPdfUrl] = useState('');
  const [repPublished, setRepPublished] = useState<boolean>(true);
  const [isSavingReport, setIsSavingReport] = useState<boolean>(false);
  const [isDeletingReportId, setIsDeletingReportId] = useState<string | null>(null);
  const [isTogglingPublishReportId, setIsTogglingPublishReportId] = useState<string | null>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState<boolean>(false);
  const [pdfUploadProgress, setPdfUploadProgress] = useState<number>(0);
  const [isUploadingReportCover, setIsUploadingReportCover] = useState<boolean>(false);

  const resetReportForm = () => {
    setEditingReportId(null);
    setRepTitle('');
    setRepTitleEn('');
    setRepPeriod('वर्ष २०२४-२५');
    setRepPeriodEn('Year 2024-25');
    setRepCategory('वार्षिक अहवाल');
    setRepCategoryEn('Annual Report');
    setRepSummary('');
    setRepSummaryEn('');
    setRepDate(new Date().toISOString().split('T')[0]);
    setRepFileSize('PDF');
    setRepCoverUrl('');
    setRepPdfUrl('');
    setRepPublished(true);
  };

  const startEditReport = (r: ReportItem) => {
    setEditingReportId(r.id);
    setRepTitle(r.title || '');
    setRepTitleEn(r.titleEn || '');
    setRepPeriod(r.period || 'वर्ष २०२४-२५');
    setRepPeriodEn(r.periodEn || 'Year 2024-25');
    setRepCategory(r.category || 'वार्षिक अहवाल');
    setRepCategoryEn(r.categoryEn || 'Annual Report');
    setRepSummary(r.summary || '');
    setRepSummaryEn(r.summaryEn || '');
    setRepDate(r.date || new Date().toISOString().split('T')[0]);
    setRepFileSize(r.fileSize || 'PDF');
    setRepCoverUrl(r.coverImageUrl || '');
    setRepPdfUrl(r.pdfPlaceholderUrl === '#' ? '' : r.pdfPlaceholderUrl);
    setRepPublished(r.published !== false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [phoneInput, setPhoneInput] = useState(state.contactInfo?.phone || '');
  const [emailInput, setEmailInput] = useState(state.contactInfo?.email || '');
  const [addressInput, setAddressInput] = useState(state.contactInfo?.address || '');
  const [addressEnInput, setAddressEnInput] = useState(state.contactInfo?.addressEn || '');
  const [talukaInput, setTalukaInput] = useState(state.contactInfo?.taluka || '');
  const [talukaEnInput, setTalukaEnInput] = useState(state.contactInfo?.talukaEn || '');
  const [districtInput, setDistrictInput] = useState(state.contactInfo?.district || '');
  const [districtEnInput, setDistrictEnInput] = useState(state.contactInfo?.districtEn || '');
  const [hoursInput, setHoursInput] = useState(state.contactInfo?.visitingHours || '');
  const [hoursEnInput, setHoursEnInput] = useState(state.contactInfo?.visitingHoursEn || '');
  const [regNoInput, setRegNoInput] = useState(state.contactInfo?.regNoMr || '');
  const [regNoEnInput, setRegNoEnInput] = useState(state.contactInfo?.regNoEn || '');
  const [secretaryNameInput, setSecretaryNameInput] = useState(state.contactInfo?.secretaryNameMr || '');
  const [secretaryNameEnInput, setSecretaryNameEnInput] = useState(state.contactInfo?.secretaryNameEn || '');
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);

  useEffect(() => {
    if (state.contactInfo) {
      setPhoneInput(state.contactInfo.phone || '');
      setEmailInput(state.contactInfo.email || '');
      setAddressInput(state.contactInfo.address || '');
      setAddressEnInput(state.contactInfo.addressEn || '');
      setTalukaInput(state.contactInfo.taluka || '');
      setTalukaEnInput(state.contactInfo.talukaEn || '');
      setDistrictInput(state.contactInfo.district || '');
      setDistrictEnInput(state.contactInfo.districtEn || '');
      setHoursInput(state.contactInfo.visitingHours || '');
      setHoursEnInput(state.contactInfo.visitingHoursEn || '');
      setRegNoInput(state.contactInfo.regNoMr || '');
      setRegNoEnInput(state.contactInfo.regNoEn || '');
      setSecretaryNameInput(state.contactInfo.secretaryNameMr || '');
      setSecretaryNameEnInput(state.contactInfo.secretaryNameEn || '');
    }
  }, [state.contactInfo]);

  // Handle Login via Hardened Backend PHP Endpoint
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const result = await ApiClient.login(username.trim(), password);

      if (result.success && result.token) {
        setIsAuthenticated(true);
        setAdminProfile(result.admin || null);
        setPassword('');
        setLoginError(null);
      } else {
        if (result.statusCode === 429) {
          setLoginError(
            lang === 'mr'
              ? 'खूप चुकीचे प्रयत्न झाले आहेत. कृपया १५ मिनिटे प्रतीक्षा करा.'
              : 'Too many failed login attempts. Please wait 15 minutes before trying again.'
          );
        } else {
          setLoginError(
            lang === 'mr'
              ? result.error || 'चुकीचे युजरनेम किंवा पासवर्ड.'
              : result.error || 'Invalid username or password.'
          );
        }
      }
    } catch {
      // SECURE: Strictly NO fallback to hardcoded passwords!
      setLoginError(
        lang === 'mr'
          ? 'प्रमाणीकरण सर्व्हरशी संपर्क होऊ शकला नाही. कृपया सर्व्हर सुरू असल्याची खात्री करा.'
          : 'Could not connect to authentication server. Please verify the backend is running.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await ApiClient.logout();
    setIsAuthenticated(false);
    setAdminProfile(null);
    setUsername('');
    setPassword('');
  };

  // --- SUBMIT HANDLERS ---

  const handleSaveOfficial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingOfficial) return;

    if (!offName.trim()) {
      setOfficialFormError(lang === 'mr' ? 'कृपया पदाधिकाऱ्याचे मराठी नाव प्रविष्ट करा.' : 'Please enter official full name in Marathi.');
      showToast(lang === 'mr' ? 'कृपया नाव प्रविष्ट करा.' : 'Please enter name.');
      return;
    }
    if (!offRole.trim()) {
      setOfficialFormError(lang === 'mr' ? 'कृपया पदाधिकाऱ्याचे पद / भूमिका प्रविष्ट करा.' : 'Please enter official role.');
      showToast(lang === 'mr' ? 'कृपया पद प्रविष्ट करा.' : 'Please enter role.');
      return;
    }

    if (isUploadingOffPhoto) {
      setOfficialFormError(
        lang === 'mr'
          ? 'कृपया फोटो अपलोड पूर्ण होण्याची प्रतीक्षा करा.'
          : 'Please wait for the photo upload to finish.'
      );
      showToast(lang === 'mr' ? 'फोटो अपलोड सुरू आहे.' : 'Photo upload in progress.');
      return;
    }

    if (offImageUrl.trim()) {
      const trimmedUrl = offImageUrl.trim();
      const isServerUpload = trimmedUrl.startsWith('/backend-php-mysql/');
      const isHttps = trimmedUrl.startsWith('https://') || trimmedUrl.startsWith('http://');

      if (!isServerUpload && !isHttps) {
        setOfficialFormError(
          lang === 'mr'
            ? 'कृपया कॉम्प्युटरमधून फोटो अपलोड करा किंवा वैध HTTPS लिंक टाका.'
            : 'Please upload a photo from your computer or enter a valid HTTPS URL.'
        );
        showToast(lang === 'mr' ? 'अवैध फोटो लिंक.' : 'Invalid photo URL.');
        return;
      }
    }

    setOfficialFormError(null);
    setIsSavingOfficial(true);

    const existing = editingOfficialId ? (state.officials || []).find((o) => o.id === editingOfficialId) : null;

    const payload = {
      name: offName.trim(),
      nameEn: offNameEn.trim() || (existing?.nameEn ?? offName.trim()),
      role: offRole.trim(),
      roleEn: offRoleEn.trim() || (existing?.roleEn ?? offRole.trim()),
      imageUrl:
        offImageUrl.trim() ||
        existing?.imageUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      bio: offBio.trim() || (existing?.bio ?? ''),
      bioEn: offBioEn.trim() || (existing?.bioEn ?? offBio.trim()),
      phone: offPhone.trim() || (existing?.phone ?? ''),
      displayOrder: Number(offDisplayOrder) || 0,
      published: offPublished,
    };

    try {
      if (editingOfficialId) {
        const res = await updateOfficial(editingOfficialId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'पदाधिकारी माहिती यशस्वीरित्या अद्ययावत केली!' : 'Official updated successfully!');
          resetOfficialForm();
        } else {
          setOfficialFormError(res.error || (lang === 'mr' ? 'अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update official.'));
          showToast(res.error || (lang === 'mr' ? 'अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update official.'));
        }
      } else {
        const res = await addOfficial(payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन पदाधिकारी यशस्वीरित्या जोडले!' : 'Official added successfully!');
          resetOfficialForm();
        } else {
          setOfficialFormError(res.error || (lang === 'mr' ? 'जतन करण्यात त्रुटी आली.' : 'Failed to add official.'));
          showToast(res.error || (lang === 'mr' ? 'जतन करण्यात त्रुटी आली.' : 'Failed to add official.'));
        }
      }
    } catch (err: any) {
      setOfficialFormError(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingOfficial(false);
    }
  };

  const handleDeleteOfficial = async (off: OfficialItem) => {
    const confirmMsg =
      lang === 'mr'
        ? `तुम्ही खरोखर "${off.name}" या पदाधिकाऱ्यांची माहिती हटवू इच्छिता?`
        : `Are you sure you want to delete official "${off.nameEn || off.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingOfficialId(off.id);
    try {
      const res = await deleteOfficial(off.id);
      if (res.success) {
        showToast(lang === 'mr' ? 'पदाधिकारी यशस्वीरित्या हटवले.' : 'Official deleted successfully.');
        if (editingOfficialId === off.id) {
          resetOfficialForm();
        }
      } else {
        showToast(res.error || (lang === 'mr' ? 'हटवण्यात त्रुटी आली.' : 'Failed to delete official.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsDeletingOfficialId(null);
    }
  };

  const handleTogglePublishOfficial = async (off: OfficialItem) => {
    setIsTogglingPublishOfficialId(off.id);
    const newStatus = off.published === false ? true : false;
    try {
      const res = await updateOfficial(off.id, { published: newStatus });
      if (res.success) {
        showToast(
          newStatus
            ? lang === 'mr'
              ? 'पदाधिकारी प्रकाशित केले.'
              : 'Official published.'
            : lang === 'mr'
            ? 'पदाधिकारी मसुदा (Draft) ठेवले.'
            : 'Official unpublished to draft.'
        );
      } else {
        showToast(res.error || (lang === 'mr' ? 'स्थिती बदलण्यात त्रुटी आली.' : 'Failed to change status.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error.'));
    } finally {
      setIsTogglingPublishOfficialId(null);
    }
  };

  const handleSaveSetting = async (
    key: string,
    valueMr: string,
    valueEn: string,
    description?: string
  ) => {
    setIsSavingSettingKey(key);
    try {
      const res = await updateSiteSetting(key, { valueMr, valueEn, description });
      if (res.success) {
        showToast(
          lang === 'mr'
            ? 'सेटिंग्ज यशस्वीरित्या जतन केली!'
            : 'Site setting updated successfully!'
        );
      } else {
        showToast(res.error || (lang === 'mr' ? 'जतन करण्यात त्रुटी आली.' : 'Failed to save setting.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error.'));
    } finally {
      setIsSavingSettingKey(null);
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingVideo) return;

    if (!vidTitle.trim()) {
      showToast(lang === 'mr' ? 'कृपया व्हिडिओ शीर्षक प्रविष्ट करा.' : 'Please enter video title.');
      return;
    }
    if (!ytUrl.trim()) {
      showToast(lang === 'mr' ? 'कृपया व्हिडिओ लिंक प्रविष्ट करा.' : 'Please enter video URL.');
      return;
    }

    // Validate the URL format and source matching
    const validation = validateVideoSourceUrl(ytUrl.trim(), videoSourceType);
    if (!validation.isValid) {
      setVideoUrlError(lang === 'mr' ? validation.errorMr || null : validation.errorEn || null);
      showToast(lang === 'mr' ? validation.errorMr || 'अवैध व्हिडिओ लिंक.' : validation.errorEn || 'Invalid video link.');
      return;
    }

    const existing = editingVideoId ? state.videos.find((v) => v.id === editingVideoId) : null;

    const resolvedCover =
      vidCoverUrl.trim() ||
      (isYouTubeUrl(ytUrl.trim()) ? getYouTubeThumbnail(ytUrl.trim()) : null) ||
      existing?.thumbnailUrl ||
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75';

    if (vidCoverUrl.trim() && (!vidCoverUrl.trim().startsWith('https://') || vidCoverUrl.trim().length > 500)) {
      showToast(
        lang === 'mr'
          ? 'कव्हर फोटोसाठी कृपया वैध HTTPS लिंक टाका (कमाल ५०० अक्षरे).'
          : 'Please enter a valid HTTPS URL for cover image (max 500 characters).'
      );
      return;
    }

    const payload = {
      title: vidTitle.trim(),
      titleEn: vidTitleEn.trim() || (existing?.titleEn ?? vidTitle.trim()),
      description: vidDesc.trim() || (existing?.description ?? vidTitle.trim()),
      descriptionEn: vidDescEn.trim() || (existing?.descriptionEn ?? (vidDesc.trim() || vidTitle.trim())),
      category: vidCategory,
      durationSeconds: existing?.durationSeconds ?? 180,
      durationFormatted: existing?.durationFormatted ?? '०३:००',
      durationFormattedEn: existing?.durationFormattedEn ?? '03:00',
      videoUrl: ytUrl.trim(),
      thumbnailUrl: resolvedCover,
      date: existing?.date || new Date().toISOString().split('T')[0],
      published: vidPublished,
      featured: vidFeatured,
      relatedActivityTitle: existing?.relatedActivityTitle,
    };

    setIsSavingVideo(true);
    try {
      if (editingVideoId) {
        const res = await updateVideoItem(editingVideoId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'व्हिडिओ माहिती अद्ययावत केली!' : 'Video updated successfully!');
          resetVideoForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'व्हिडिओ अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update video.'));
        }
      } else {
        const res = await addVideoItem(payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'व्हिडिओ यशस्वीरित्या जतन केला!' : 'Video saved successfully!');
          resetVideoForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'व्हिडिओ जतन करण्यात त्रुटी आली.' : 'Failed to save video.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingVideo(false);
    }
  };

  const handleSaveAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!albumTitle.trim()) {
      showToast(lang === 'mr' ? 'कृपया अल्बमचे नाव प्रविष्ट करा.' : 'Please enter album title.');
      return;
    }
    setIsSavingAlbum(true);
    try {
      const payload: Partial<GalleryAlbumItem> = {
        title: albumTitle.trim(),
        titleEn: albumTitleEn.trim() || albumTitle.trim(),
        description: albumDesc.trim(),
        descriptionEn: albumDescEn.trim() || albumDesc.trim(),
        category: albumCategory,
        coverImageUrl: albumCoverUrl.trim(),
        eventDate: albumEventDate || new Date().toISOString().split('T')[0],
        displayMode: albumDisplayMode,
        displayOrder: Number(albumDisplayOrder) || 0,
        published: albumPublished,
      };

      if (editingAlbumId) {
        const res = await updateAlbum(editingAlbumId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'अल्बम यशस्वीरित्या अद्ययावत केला!' : 'Album updated successfully!');
          resetAlbumForm();
          setShowAlbumModal(false);
        } else {
          showToast(res.error || (lang === 'mr' ? 'अल्बम अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update album.'));
        }
      } else {
        const res = await addAlbum(payload as Omit<GalleryAlbumItem, 'id'>);
        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन अल्बम तयार केला!' : 'New album created successfully!');
          resetAlbumForm();
          setShowAlbumModal(false);
        } else {
          showToast(res.error || (lang === 'mr' ? 'अल्बम तयार करण्यात त्रुटी आली.' : 'Failed to create album.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsSavingAlbum(false);
    }
  };

  const handleDeleteAlbum = async (id: string) => {
    if (
      !window.confirm(
        lang === 'mr'
          ? 'तुम्हाला हा अल्बम नक्की हटवायचा आहे का? (फोटो गॅलरीत राहतील, अल्बम आयडी रिक्त होईल)'
          : 'Are you sure you want to delete this album? (Photos will remain in gallery)'
      )
    ) {
      return;
    }
    setIsDeletingAlbumId(id);
    try {
      const res = await deleteAlbum(id);
      if (res.success) {
        showToast(lang === 'mr' ? 'अल्बम हटवला.' : 'Album deleted successfully.');
        if (photoAlbumId === id) setPhotoAlbumId('');
        if (selectedAlbumFilter === id) setSelectedAlbumFilter('all');
      } else {
        showToast(res.error || (lang === 'mr' ? 'अल्बम हटवता आला नाही.' : 'Failed to delete album.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsDeletingAlbumId(null);
    }
  };

  const handleAlbumCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast(lang === 'mr' ? 'कव्हर फोटो ५ MB पेक्षा लहान असावा.' : 'Cover photo must be under 5MB.');
      return;
    }
    setIsUploadingAlbumCover(true);
    setAlbumCoverUploadProgress(20);
    try {
      const res = await ApiClient.uploadImage(file, (pct) => setAlbumCoverUploadProgress(pct), 'gallery');
      setAlbumCoverUrl(res.url);
      showToast(lang === 'mr' ? 'अल्बम कव्हर फोटो अपलोड झाला!' : 'Album cover uploaded successfully!');
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'कव्हर फोटो अपलोड अयशस्वी.' : 'Failed to upload cover photo.'));
    } finally {
      setIsUploadingAlbumCover(false);
      setAlbumCoverUploadProgress(0);
    }
  };

  const handleMultiPhotoFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);

    for (const f of fileArray) {
      if (f.size > 5 * 1024 * 1024) {
        setGalleryUploadError(
          lang === 'mr'
            ? `फाईल "${f.name}" ५ MB पेक्षा मोठी आहे.`
            : `File "${f.name}" exceeds 5MB limit.`
        );
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) {
        setGalleryUploadError(
          lang === 'mr'
            ? `फाईल "${f.name}" चे फॉरमॅट वैध नाही (फक्त JPEG, PNG, WebP).`
            : `File "${f.name}" is not a valid JPEG/PNG/WebP image.`
        );
        return;
      }
    }

    setGalleryUploadError(null);
    setIsUploadingGallery(true);
    setGalleryUploadProgress(10);

    try {
      const uploadResults = await ApiClient.uploadGalleryImages(fileArray, (pct) => {
        setGalleryUploadProgress(Math.max(10, pct));
      });

      if (editingPhotoId && uploadResults.length > 0) {
        setPhotoUrl(uploadResults[0].url);
      } else {
        const newStaged = uploadResults.map((item, idx) => ({
          url: item.url,
          filename: item.filename,
          title: photoTitle.trim() ? `${photoTitle.trim()} ${idx + 1}` : (item.originalName || `Photo ${idx + 1}`),
          titleEn: photoTitleEn.trim() ? `${photoTitleEn.trim()} ${idx + 1}` : (item.originalName || `Photo ${idx + 1}`),
          caption: photoCaption.trim() || photoTitle.trim() || item.originalName || 'Photo',
          captionEn: photoCaptionEn.trim() || photoTitleEn.trim() || item.originalName || 'Photo',
        }));
        setStagedUploads((prev) => [...prev, ...newStaged]);
      }
      showToast(
        lang === 'mr'
          ? `${uploadResults.length} फोटो यशस्वीरित्या सर्व्हरवर अपलोड झाले!`
          : `${uploadResults.length} photo(s) uploaded to server!`
      );
    } catch (err: any) {
      console.error('Gallery upload failed:', err);
      setGalleryUploadError(
        err?.message || (lang === 'mr' ? 'फोटो अपलोड करताना त्रुटी आली.' : 'Failed to upload photo(s).')
      );
    } finally {
      setIsUploadingGallery(false);
      setGalleryUploadProgress(0);
    }
  };

  const handleSavePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPhoto) return;

    if (editingPhotoId) {
      if (!photoTitle.trim()) {
        showToast(lang === 'mr' ? 'कृपया छायाचित्र शीर्षक प्रविष्ट करा.' : 'Please enter photo title.');
        return;
      }
      if (!photoUrl.trim()) {
        showToast(lang === 'mr' ? 'कृपया फोटो निवडा किंवा लिंक टाका.' : 'Please select a photo or enter URL.');
        return;
      }

      setIsSavingPhoto(true);
      try {
        const res = await updateGalleryItem(editingPhotoId, {
          title: photoTitle.trim(),
          titleEn: photoTitleEn.trim() || photoTitle.trim(),
          caption: photoCaption.trim() || photoTitle.trim(),
          captionEn: photoCaptionEn.trim() || photoCaption.trim() || photoTitle.trim(),
          altText: photoTitle.trim(),
          altTextEn: photoTitleEn.trim() || photoTitle.trim(),
          category: photoCategory,
          albumId: photoAlbumId || undefined,
          imageUrl: photoUrl.trim(),
          displayOrder: Number(photoDisplayOrder) || 0,
          published: photoPublished,
          featuredOnHome: photoFeaturedHome,
        });

        if (res.success) {
          showToast(lang === 'mr' ? 'छायाचित्र माहिती अद्ययावत केली!' : 'Photo updated successfully!');
          resetPhotoForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update photo.'));
        }
      } catch (err: any) {
        showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
      } finally {
        setIsSavingPhoto(false);
      }
      return;
    }

    const photosToSave: Array<Omit<GalleryItem, 'id'>> = [];

    if (stagedUploads.length > 0) {
      stagedUploads.forEach((item, idx) => {
        photosToSave.push({
          title: item.title.trim() || photoTitle.trim() || `Photo ${idx + 1}`,
          titleEn: item.titleEn.trim() || photoTitleEn.trim() || photoTitle.trim() || `Photo ${idx + 1}`,
          caption: item.caption.trim() || photoCaption.trim() || item.title.trim() || photoTitle.trim() || 'Photo',
          captionEn: item.captionEn.trim() || photoCaptionEn.trim() || item.titleEn.trim() || 'Photo',
          altText: item.title.trim() || photoTitle.trim() || 'Photo',
          altTextEn: item.titleEn.trim() || photoTitleEn.trim() || 'Photo',
          category: photoCategory,
          albumId: photoAlbumId || undefined,
          imageUrl: item.url,
          year: new Date().getFullYear(),
          displayOrder: (Number(photoDisplayOrder) || 0) + idx,
          featuredOnHome: photoFeaturedHome,
          published: photoPublished,
        });
      });
    } else if (photoUrl.trim()) {
      if (!photoTitle.trim()) {
        showToast(lang === 'mr' ? 'कृपया छायाचित्र शीर्षक प्रविष्ट करा.' : 'Please enter photo title.');
        return;
      }
      photosToSave.push({
        title: photoTitle.trim(),
        titleEn: photoTitleEn.trim() || photoTitle.trim(),
        caption: photoCaption.trim() || photoTitle.trim(),
        captionEn: photoCaptionEn.trim() || photoCaption.trim() || photoTitle.trim(),
        altText: photoTitle.trim(),
        altTextEn: photoTitleEn.trim() || photoTitle.trim(),
        category: photoCategory,
        albumId: photoAlbumId || undefined,
        imageUrl: photoUrl.trim(),
        year: new Date().getFullYear(),
        displayOrder: Number(photoDisplayOrder) || 0,
        featuredOnHome: photoFeaturedHome,
        published: photoPublished,
      });
    } else {
      showToast(lang === 'mr' ? 'कृपया किमान एक फोटो निवडा किंवा अपलोड करा.' : 'Please select or upload at least one photo.');
      return;
    }

    setIsSavingPhoto(true);
    try {
      let res;
      if (photosToSave.length === 1) {
        res = await addGalleryItem(photosToSave[0]);
      } else {
        res = await addGalleryPhotosBatch(photosToSave);
      }

      if (res.success) {
        showToast(
          lang === 'mr'
            ? `${photosToSave.length} छायाचित्रे यशस्वीरित्या गॅलरीत जतन केली!`
            : `${photosToSave.length} photo(s) saved to gallery successfully!`
        );
        resetPhotoForm();
      } else {
        showToast(res.error || (lang === 'mr' ? 'छायाचित्रे जतन करताना त्रुटी आली.' : 'Failed to save photos.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (
      !window.confirm(
        lang === 'mr' ? 'तुम्हाला हे छायाचित्र नक्की हटवायचे आहे का?' : 'Are you sure you want to delete this photo?'
      )
    ) {
      return;
    }
    setIsDeletingPhotoId(id);
    try {
      const res = await deleteGalleryItem(id);
      if (res.success) {
        showToast(lang === 'mr' ? 'छायाचित्र हटवले.' : 'Photo deleted successfully.');
      } else {
        showToast(res.error || (lang === 'mr' ? 'छायाचित्र हटवता आले नाही.' : 'Failed to delete photo.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsDeletingPhotoId(null);
    }
  };

  const handleTogglePublishPhoto = async (g: GalleryItem) => {
    setIsTogglingPublishPhotoId(g.id);
    try {
      const res = await updateGalleryItem(g.id, { published: !g.published });
      if (res.success) {
        showToast(
          !g.published
            ? (lang === 'mr' ? 'छायाचित्र प्रकाशित केले.' : 'Photo published.')
            : (lang === 'mr' ? 'छायाचित्र ड्राफ्ट केले.' : 'Photo set to draft.')
        );
      }
    } finally {
      setIsTogglingPublishPhotoId(null);
    }
  };

  const handleSaveInitiative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingInit) return;

    if (!initTitle.trim()) {
      showToast(lang === 'mr' ? 'कृपया उपक्रमाचे नाव प्रविष्ट करा.' : 'Please enter initiative title.');
      return;
    }
    if (!initSummary.trim()) {
      showToast(lang === 'mr' ? 'कृपया संक्षिप्त माहिती प्रविष्ट करा.' : 'Please enter short summary.');
      return;
    }

    if (initImageUrl.trim() && (!initImageUrl.trim().startsWith('https://') || initImageUrl.trim().length > 500)) {
      showToast(
        lang === 'mr'
          ? 'कव्हर फोटोसाठी कृपया वैध HTTPS लिंक टाका (कमाल ५०० अक्षरे).'
          : 'Please enter a valid HTTPS URL for cover image (max 500 characters).'
      );
      return;
    }

    const existing = editingInitId ? state.initiatives.find((i) => i.id === editingInitId) : null;

    const cover =
      initImageUrl.trim() ||
      initExtraImages[0] ||
      existing?.imageUrl ||
      'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=800&q=80';

    const payload = {
      title: initTitle.trim(),
      titleEn: initTitleEn.trim() || (existing?.titleEn ?? initTitle.trim()),
      category: initCategory,
      date: initDate.trim() || (existing?.date ?? new Date().toISOString().split('T')[0]),
      location: initLocation.trim(),
      locationEn: initLocationEn.trim() || (existing?.locationEn ?? initLocation.trim()),
      summary: initSummary.trim(),
      summaryEn: initSummaryEn.trim() || (existing?.summaryEn ?? initSummary.trim()),
      description: initDesc.trim() || (existing?.description ?? initSummary.trim()),
      descriptionEn: initDescEn.trim() || (existing?.descriptionEn ?? (initDesc.trim() || initSummary.trim())),
      imageUrl: cover,
      images: initExtraImages,
      isGovernmentSchemeAwareness: initCategory === 'शासकीय योजना जनजागृती',
      published: initPublished,
      featured: initFeatured,
      relatedReportId: initRelatedReportId || undefined,
      tags: [initCategory],
    };

    setIsSavingInit(true);
    try {
      if (editingInitId) {
        const res = await updateInitiative(editingInitId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'उपक्रम माहिती अद्ययावत केली!' : 'Initiative updated successfully!');
          resetInitForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'उपक्रम अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update initiative.'));
        }
      } else {
        const res = await addInitiative(payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन उपक्रम यशस्वीरित्या जतन केला!' : 'Initiative created successfully!');
          resetInitForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'उपक्रम जतन करण्यात त्रुटी आली.' : 'Failed to save initiative.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingInit(false);
    }
  };

  // --- 5D. EVENT ACTION HANDLERS ---
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingEvent) return;

    if (!eventTitle.trim()) {
      showToast(lang === 'mr' ? 'कृपया कार्यक्रमाचे नाव (मराठी) प्रविष्ट करा.' : 'Please enter event title (Marathi).');
      return;
    }
    if (!eventSummary.trim()) {
      showToast(lang === 'mr' ? 'कृपया कार्यक्रमाचा सारांश प्रविष्ट करा.' : 'Please enter event summary.');
      return;
    }
    if (!eventStartDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(eventStartDate.trim())) {
      showToast(lang === 'mr' ? 'कृपया वैध सुरू होण्याची तारीख निवडा (YYYY-MM-DD).' : 'Please select a valid start date (YYYY-MM-DD).');
      return;
    }
    if (eventEndDate.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(eventEndDate.trim())) {
      showToast(lang === 'mr' ? 'कृपया समाप्तीची तारीख वैध स्वरूपात द्या (YYYY-MM-DD).' : 'Please enter a valid end date (YYYY-MM-DD).');
      return;
    }
    const trimmedCover = eventCoverUrl.trim();
    const isValidCover =
      !trimmedCover ||
      trimmedCover.startsWith('https://') ||
      trimmedCover.startsWith('/backend-php-mysql/uploads/') ||
      trimmedCover.startsWith('uploads/') ||
      trimmedCover.startsWith('data:image/');
    if (!isValidCover) {
      showToast(lang === 'mr' ? 'कव्हर फोटोसाठी सुरक्षित HTTPS किंवा अपलोड केलेली लिंक आवश्यक आहे.' : 'HTTPS URL or uploaded image is required for cover.');
      return;
    }

    const existing = editingEventId ? state.events.find((evt) => evt.id === editingEventId) : null;

    const photos: EventPhoto[] = eventExtraImages
      .map((url, idx) => ({
        eventId: editingEventId || undefined,
        imageUrl: url.trim(),
        displayOrder: idx + 1,
      }))
      .filter((p) => p.imageUrl && (
        p.imageUrl.startsWith('https://') ||
        p.imageUrl.startsWith('/backend-php-mysql/uploads/') ||
        p.imageUrl.startsWith('uploads/') ||
        p.imageUrl.startsWith('/')
      ));

    const payload: Omit<EventItem, 'id'> = {
      title: eventTitle.trim(),
      titleEn: eventTitleEn.trim() || (existing?.titleEn ?? eventTitle.trim()),
      category: eventCategory,
      startDate: eventStartDate.trim(),
      endDate: eventEndDate.trim() || undefined,
      eventDateTextMr: eventDateTextMr.trim() || undefined,
      eventDateTextEn: eventDateTextEn.trim() || undefined,
      eventTime: eventTime.trim() || undefined,
      venue: eventVenue.trim() || 'नादरपूर, ता. कन्नड',
      venueEn: eventVenueEn.trim() || 'Nadarpur, Tahsil Kannad',
      status: eventStatus,
      summary: eventSummary.trim(),
      summaryEn: eventSummaryEn.trim() || (existing?.summaryEn ?? eventSummary.trim()),
      description: eventDescription.trim() || (existing?.description ?? eventSummary.trim()),
      descriptionEn: eventDescriptionEn.trim() || (existing?.descriptionEn ?? (eventSummaryEn.trim() || eventSummary.trim())),
      coverImageUrl: eventCoverUrl.trim() || undefined,
      isFeatured: eventIsFeatured,
      published: eventPublished,
      displayOrder: Number(eventDisplayOrder) || 0,
      photos: photos,
    };

    setIsSavingEvent(true);
    try {
      if (editingEventId) {
        const res = await updateEvent(editingEventId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'कार्यक्रम यशस्वीरित्या अद्ययावत केला!' : 'Event updated successfully!');
          resetEventForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'कार्यक्रम अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update event.'));
        }
      } else {
        const res = await addEvent(payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन कार्यक्रम यशस्वीरित्या जतन केला!' : 'Event created successfully!');
          resetEventForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'कार्यक्रम जतन करण्यात त्रुटी आली.' : 'Failed to save event.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingEvent(false);
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    const confirmMsg =
      lang === 'mr'
        ? `"${title}" हा कार्यक्रम कायमचा हटवायचा आहे का?`
        : `Are you sure you want to permanently delete event "${title}"?`;
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingEventId(id);
    try {
      const res = await deleteEvent(id);
      if (res.success) {
        showToast(lang === 'mr' ? 'कार्यक्रम यशस्वीरित्या हटवला.' : 'Event deleted successfully.');
        if (editingEventId === id) resetEventForm();
      } else {
        showToast(res.error || (lang === 'mr' ? 'कार्यक्रम हटवण्यात त्रुटी आली.' : 'Failed to delete event.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
    } finally {
      setIsDeletingEventId(null);
    }
  };

  const handleTogglePublishEvent = async (item: EventItem) => {
    setIsTogglingPublishEventId(item.id);
    try {
      const res = await updateEvent(item.id, { published: !item.published });
      if (res.success) {
        showToast(
          !item.published
            ? lang === 'mr'
              ? 'कार्यक्रम प्रकाशित केला गेला.'
              : 'Event published successfully.'
            : lang === 'mr'
            ? 'कार्यक्रम अप्रकाशित (Draft) केला गेला.'
            : 'Event set to draft.'
        );
      } else {
        showToast(res.error || (lang === 'mr' ? 'स्थिती बदलण्यात त्रुटी आली.' : 'Failed to update publish state.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
    } finally {
      setIsTogglingPublishEventId(null);
    }
  };

  const handleSaveNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingNews) return;

    if (!newsTitle.trim()) {
      showToast(lang === 'mr' ? 'कृपया कार्यक्रम / बातमीचे शीर्षक प्रविष्ट करा.' : 'Please enter event / notice title.');
      return;
    }
    if (!newsSummary.trim()) {
      showToast(lang === 'mr' ? 'कृपया संक्षिप्त माहिती प्रविष्ट करा.' : 'Please enter summary.');
      return;
    }

    const existing = editingNewsId ? state.announcements.find((a) => a.id === editingNewsId) : null;

    const payload = {
      title: newsTitle.trim(),
      titleEn: newsTitleEn.trim() || (existing?.titleEn ?? newsTitle.trim()),
      date: newsDate.trim() || (existing?.date ?? new Date().toISOString().split('T')[0]),
      dateEn: newsDateEn.trim() || (existing?.dateEn ?? (newsDate.trim() || new Date().toISOString().split('T')[0])),
      isUpcoming: newsUpcoming,
      category: newsCategory,
      summary: newsSummary.trim(),
      summaryEn: newsSummaryEn.trim() || (existing?.summaryEn ?? newsSummary.trim()),
      content: newsContent.trim() || (existing?.content ?? newsSummary.trim()),
      contentEn: newsContentEn.trim() || (existing?.contentEn ?? (newsSummaryEn.trim() || newsSummary.trim())),
      coverImageUrl: newsCoverUrl.trim() || newsExtraImages[0] || existing?.coverImageUrl || undefined,
      images: newsExtraImages,
      published: newsPublished,
    };

    setIsSavingNews(true);
    try {
      if (editingNewsId) {
        const res = await updateAnnouncement(editingNewsId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'कार्यक्रम / बातमी यशस्वीरित्या अद्ययावत केली!' : 'Event / notice updated successfully!');
          resetNewsForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update announcement.'));
        }
      } else {
        const res = await addAnnouncement(payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन कार्यक्रम / बातमी यशस्वीरित्या जतन केली!' : 'Event / notice created successfully!');
          resetNewsForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'जतन करण्यात त्रुटी आली.' : 'Failed to save announcement.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingNews(false);
    }
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingScheme) return;

    if (!schemeTitle.trim()) {
      showToast(lang === 'mr' ? 'कृपया शासकीय योजनेचे नाव प्रविष्ट करा.' : 'Please enter scheme title.');
      return;
    }
    if (!schemeSummary.trim()) {
      showToast(lang === 'mr' ? 'कृपया योजनेची संक्षिप्त माहिती प्रविष्ट करा.' : 'Please enter scheme summary.');
      return;
    }

    if (schemePortalUrl.trim() && !schemePortalUrl.trim().startsWith('https://')) {
      showToast(lang === 'mr' ? 'अधिकृत पोर्टलसाठी सुरक्षित HTTPS लिंक आवश्यक आहे.' : 'HTTPS URL is required for official portal.');
      return;
    }

    const existing = editingSchemeId ? state.governmentSchemes.find((s) => s.id === editingSchemeId) : null;

    const payload = {
      title: schemeTitle.trim(),
      titleEn: schemeTitleEn.trim() || (existing?.titleEn ?? schemeTitle.trim()),
      department: schemeDept.trim() || (existing?.department ?? undefined),
      departmentEn: schemeDeptEn.trim() || (existing?.departmentEn ?? undefined),
      beneficiaryCategory: schemeBenCat.trim() || (existing?.beneficiaryCategory ?? undefined),
      beneficiaryCategoryEn: schemeBenCatEn.trim() || (existing?.beneficiaryCategoryEn ?? undefined),
      summary: schemeSummary.trim(),
      summaryEn: schemeSummaryEn.trim() || (existing?.summaryEn ?? schemeSummary.trim()),
      eligibility: schemeEligibility.trim() || (existing?.eligibility ?? undefined),
      eligibilityEn: schemeEligibilityEn.trim() || (existing?.eligibilityEn ?? undefined),
      documentsRequired: schemeDocs.trim() || (existing?.documentsRequired ?? undefined),
      documentsRequiredEn: schemeDocsEn.trim() || (existing?.documentsRequiredEn ?? undefined),
      benefits: schemeBenefits.trim() || (existing?.benefits ?? undefined),
      benefitsEn: schemeBenefitsEn.trim() || (existing?.benefitsEn ?? undefined),
      officialPortalUrl: schemePortalUrl.trim() || (existing?.officialPortalUrl ?? undefined),
      coverImageUrl: schemeCoverUrl.trim() || existing?.coverImageUrl || undefined,
      published: schemePublished,
      featured: schemeFeatured,
    };

    setIsSavingScheme(true);
    try {
      if (editingSchemeId) {
        const res = await updateGovernmentScheme(editingSchemeId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'शासकीय योजना यशस्वीरित्या अद्ययावत केली!' : 'Government scheme updated successfully!');
          resetSchemeForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update government scheme.'));
        }
      } else {
        const res = await addGovernmentScheme(payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन शासकीय योजना यशस्वीरित्या जोडली!' : 'Government scheme added successfully!');
          resetSchemeForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'जतन करण्यात त्रुटी आली.' : 'Failed to save government scheme.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingScheme(false);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast(lang === 'mr' ? 'कृपया केवळ PDF फाइल निवडा.' : 'Please select a valid PDF file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast(lang === 'mr' ? 'PDF फाइल आकार १५MB पेक्षा जास्त असू शकत नाही.' : 'PDF file size must not exceed 15MB.');
      return;
    }

    setIsUploadingPdf(true);
    setPdfUploadProgress(0);
    try {
      const res = await ApiClient.uploadImage(file, (progress) => {
        setPdfUploadProgress(progress);
      }, 'reports');

      setRepPdfUrl(res.url);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setRepFileSize(`${sizeMb} MB PDF`);
      showToast(lang === 'mr' ? 'PDF दस्तऐवज यशस्वीरित्या अपलोड झाले!' : 'PDF document uploaded successfully!');
    } catch (err: any) {
      console.error('PDF upload error:', err);
      showToast(err?.message || (lang === 'mr' ? 'PDF अपलोड अयशस्वी.' : 'PDF upload failed.'));
    } finally {
      setIsUploadingPdf(false);
      setPdfUploadProgress(0);
      if (e.target) e.target.value = '';
    }
  };

  const handleReportCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReportCover(true);
    try {
      const res = await ApiClient.uploadImage(file, undefined, 'reports');
      setRepCoverUrl(res.url);
      showToast(lang === 'mr' ? 'कव्हर फोटो अपलोड झाला!' : 'Cover photo uploaded!');
    } catch (err: any) {
      console.error('Cover upload error:', err);
      showToast(err?.message || (lang === 'mr' ? 'कव्हर फोटो अपलोड अयशस्वी.' : 'Cover photo upload failed.'));
    } finally {
      setIsUploadingReportCover(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repTitle.trim() || !repPeriod.trim() || !repSummary.trim()) {
      showToast(lang === 'mr' ? 'कृपया आवश्यक माहिती भरा.' : 'Please fill required fields.');
      return;
    }

    setIsSavingReport(true);
    const payload = {
      title: repTitle.trim(),
      titleEn: repTitleEn.trim(),
      period: repPeriod.trim(),
      periodEn: repPeriodEn.trim(),
      date: repDate.trim() || new Date().toISOString().split('T')[0],
      fileSize: repFileSize.trim() || 'PDF',
      category: repCategory.trim() || 'वार्षिक अहवाल',
      categoryEn: repCategoryEn.trim() || 'Annual Report',
      summary: repSummary.trim(),
      summaryEn: repSummaryEn.trim(),
      coverImageUrl: repCoverUrl.trim() || undefined,
      pdfPlaceholderUrl: repPdfUrl.trim() || '#',
      published: repPublished,
    };

    try {
      if (editingReportId) {
        const res = await updateReportItem(editingReportId, payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'अहवाल यशस्वीरित्या अद्ययावत केला!' : 'Report updated successfully!');
          resetReportForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'अहवाल अद्ययावत करणे अयशस्वी.' : 'Failed to update report.'));
        }
      } else {
        const res = await addReportItem(payload);
        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन अहवाल यशस्वीरित्या जोडला!' : 'Report added successfully!');
          resetReportForm();
        } else {
          showToast(res.error || (lang === 'mr' ? 'अहवाल जोडणे अयशस्वी.' : 'Failed to add report.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!window.confirm(lang === 'mr' ? 'आपणास खात्री आहे की हा अहवाल हटवायचा आहे?' : 'Are you sure you want to delete this report?')) {
      return;
    }
    setIsDeletingReportId(id);
    try {
      const res = await deleteReportItem(id);
      if (res.success) {
        showToast(lang === 'mr' ? 'अहवाल यशस्वीरित्या हटवला.' : 'Report deleted successfully.');
        if (editingReportId === id) resetReportForm();
      } else {
        showToast(res.error || (lang === 'mr' ? 'अहवाल हटवणे अयशस्वी.' : 'Failed to delete report.'));
      }
    } catch (err: any) {
      showToast(err?.message || 'Error deleting report');
    } finally {
      setIsDeletingReportId(null);
    }
  };

  const handleTogglePublishReport = async (report: ReportItem) => {
    setIsTogglingPublishReportId(report.id);
    try {
      const res = await updateReportItem(report.id, { published: !report.published });
      if (res.success) {
        showToast(
          !report.published
            ? (lang === 'mr' ? 'अहवाल प्रकाशित केला.' : 'Report published.')
            : (lang === 'mr' ? 'अहवाल अप्रकाशित केला.' : 'Report unpublished.')
        );
      } else {
        showToast(res.error || 'Failed to toggle status');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to toggle status');
    } finally {
      setIsTogglingPublishReportId(null);
    }
  };

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingContact(true);
    try {
      const res = await updateContactInfo({
        phone: phoneInput.trim(),
        email: emailInput.trim(),
        address: addressInput.trim(),
        addressEn: addressEnInput.trim(),
        taluka: talukaInput.trim(),
        talukaEn: talukaEnInput.trim(),
        district: districtInput.trim(),
        districtEn: districtEnInput.trim(),
        visitingHours: hoursInput.trim(),
        visitingHoursEn: hoursEnInput.trim(),
        regNoMr: regNoInput.trim(),
        regNoEn: regNoEnInput.trim(),
        secretaryNameMr: secretaryNameInput.trim(),
        secretaryNameEn: secretaryNameEnInput.trim(),
      });
      if (res.success) {
        showToast(lang === 'mr' ? 'संपर्क माहिती यशस्वीरित्या अद्ययावत केली!' : 'Contact details updated successfully!');
      } else {
        showToast(res.error || (lang === 'mr' ? 'संपर्क माहिती जतन करणे अयशस्वी.' : 'Failed to update contact info.'));
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to update contact details');
    } finally {
      setIsSavingContact(false);
    }
  };

  // ============================================================================
  // VIEW 0: VERIFYING SERVER SESSION STATE
  // ============================================================================
  if (isVerifyingSession) {
    return (
      <div className="min-h-screen bg-[#F7F2E8] flex items-center justify-center p-6 font-sans">
        <div className="bg-white border border-[#D8CEBE] p-8 rounded-2xl shadow-sm max-w-sm w-full text-center space-y-4">
          <div className="w-10 h-10 border-3 border-[#244A3A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#244A3A]">
            {lang === 'mr'
              ? 'प्रशासकीय सत्र तपासत आहे...'
              : 'Verifying administrative session...'}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 1: STRICT ADMIN LOGIN SCREEN
  // ============================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F7F2E8] flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
          <button
            onClick={() => setCurrentRoute('home')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#244A3A] hover:text-[#B58A4A] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'mr' ? 'वेबसाईटवर परत जा' : 'Back to Website'}</span>
          </button>

          <div className="inline-flex items-center bg-white border border-[#D8CEBE] rounded-lg px-1 py-0.5 text-xs">
            <button
              onClick={() => setLang('mr')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                lang === 'mr' ? 'bg-[#244A3A] text-white' : 'text-[#272B28]'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                lang === 'en' ? 'bg-[#244A3A] text-white' : 'text-[#272B28]'
              }`}
            >
              English
            </button>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto bg-white rounded-2xl border border-[#DFD5C3] shadow-lg p-6 sm:p-8 space-y-6 my-auto">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#244A3A] text-[#B58A4A] flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#244A3A]">
              {lang === 'mr' ? 'प्रशासकीय लॉगिन (Admin Login)' : 'Admin Login'}
            </h1>
            <p className="text-xs sm:text-sm text-[#55635B]">
              {lang === 'mr'
                ? 'वेबसाईटवरील माहिती व्यवस्थापित करण्यासाठी लॉगिन करा.'
                : 'Sign in to manage website content.'}
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 bg-[#FBECE9] border border-[#ECCAC3] rounded-xl text-xs text-[#8F3426] font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#244A3A] mb-1.5">
                {lang === 'mr' ? 'युजरनेम (Username)' : 'Username'}
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#244A3A] mb-1.5">
                {lang === 'mr' ? 'पासवर्ड (Password)' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-sm transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            >
              {isLoggingIn
                ? lang === 'mr'
                  ? 'पडताळणी सुरू आहे...'
                  : 'Signing in...'
                : lang === 'mr'
                ? 'लॉगिन करा'
                : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center text-xs text-[#55635B] py-2">
          श्रीकृष्ण सांस्कृतिक व ग्रामीण विकास संस्था
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: AUTHENTICATED FULL CMS DASHBOARD
  // ============================================================================
  const sidebarItems: { id: AdminTab; labelMr: string; labelEn: string; icon: React.FC<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', labelMr: 'डॅशबोर्ड', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'inbox', labelMr: 'संपर्क संदेश (Inbox)', labelEn: 'Contact Inbox', icon: Mail, badge: inquiryCounts.unread },
    { id: 'volunteers', labelMr: 'स्वयंसेवक नोंदणी (Volunteers)', labelEn: 'Volunteer Registrations', icon: HeartHandshake, badge: volunteerCounts.new },
    { id: 'officials', labelMr: 'पदाधिकारी (Officials)', labelEn: 'Officials', icon: Users },
    { id: 'videos', labelMr: 'व्हिडिओ व्यवस्थापन (Videos)', labelEn: 'Videos', icon: Video },
    { id: 'gallery', labelMr: 'छायाचित्रे (Photos)', labelEn: 'Photos', icon: ImageIcon },
    { id: 'initiatives', labelMr: 'उपक्रम (Initiatives)', labelEn: 'Initiatives', icon: Layers },
    { id: 'events', labelMr: 'कार्यक्रम व्यवस्थापन (Events)', labelEn: 'Events Management', icon: Calendar },
    { id: 'news', labelMr: 'बातम्या व सूचना (Announcements)', labelEn: 'News & Announcements', icon: MessageSquare },
    { id: 'schemes', labelMr: 'शासकीय योजना', labelEn: 'Govt Schemes', icon: Landmark },
    { id: 'reports', labelMr: 'अहवाल व संपर्क', labelEn: 'Reports & Contact', icon: FileText },
    { id: 'pages', labelMr: 'पृष्ठे व विभाग (Pages CMS)', labelEn: 'Pages & Sections', icon: FileText },
    { id: 'media', labelMr: 'मीडिया लायब्ररी (Media)', labelEn: 'Media Library', icon: Grid },
    { id: 'settings', labelMr: 'वेबसाईट सेटिंग्ज (Settings)', labelEn: 'Site Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#FAF8F3] flex flex-col overflow-x-hidden">
      {/* Top Admin Header */}
      <header className="bg-[#244A3A] text-white border-b border-[#B58A4A]/40 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <SansthaLogo variant="symbol" />
            <div className="min-w-0">
              <h1 className="font-serif font-bold text-sm sm:text-lg text-white truncate">
                {lang === 'mr' ? 'प्रशासकीय नियंत्रण कक्ष (CMS)' : 'Website Admin CMS'}
              </h1>
              <p className="text-[11px] text-[#D8E6DE] hidden sm:block">
                {lang === 'mr'
                  ? 'सर्व माहिती जोडा, संपादित करा (Update) किंवा हटवा (Delete)'
                  : 'Add, Edit/Update, or Delete all website content'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCurrentRoute('home')}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'mr' ? 'वेबसाईट पाहा' : 'View Site'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-[#8F3426] hover:bg-[#74281C] text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{lang === 'mr' ? 'बाहेर पडा' : 'Logout'}</span>
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Scrollable Admin Section Bar */}
        <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar px-3 py-2 bg-[#1B3A2D] border-t border-white/10">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  active ? 'bg-[#B58A4A] text-white' : 'text-[#D8E6DE] hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? item.labelMr : item.labelEn}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-600 text-white leading-tight">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#244A3A] text-white px-4 py-3 rounded-xl shadow-xl border border-[#B58A4A] flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
          <CheckCircle2 className="w-4 h-4 text-[#B58A4A] shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden lg:block lg:col-span-3">
          <nav className="bg-white rounded-2xl border border-[#E2DACB] p-3 space-y-1 sticky top-24">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-left text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-[#244A3A] text-white shadow-xs'
                      : 'text-[#272B28] hover:bg-[#F7F2E8]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#B58A4A]' : 'text-[#244A3A]'}`} />
                    <span className="truncate">{lang === 'mr' ? item.labelMr : item.labelEn}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shrink-0">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Active Tab Content */}
        <main className="lg:col-span-9 space-y-6">
          {/* ================================================================
              TAB 1: DASHBOARD OVERVIEW
          ================================================================ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB]">
                <h2 className="text-xl font-serif font-bold text-[#244A3A]">
                  {lang === 'mr' ? 'वेबसाईट सामग्री आढावा' : 'Website Content Summary'}
                </h2>
                <p className="text-xs sm:text-sm text-[#55635B] mt-1">
                  {lang === 'mr'
                    ? 'कोणत्याही विभागातील माहिती जोडण्यासाठी, बदलण्यासाठी (Update) किंवा हटवण्यासाठी खालील पर्याय निवडा.'
                    : 'Select any section below to add, edit/update, or delete content.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                  <div
                    onClick={() => setActiveTab('officials')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {(state.officials || []).length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'पदाधिकारी' : 'Officials'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('videos')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {state.videos.length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'YouTube व्हिडिओ' : 'Videos'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('gallery')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {state.gallery.length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'छायाचित्रे' : 'Photos'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('initiatives')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {state.initiatives.length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'उपक्रम' : 'Initiatives'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('events')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {state.events.length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'कार्यक्रम (Events)' : 'Events'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('news')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {state.announcements.length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'बातम्या व सूचना' : 'Announcements'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('reports')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {state.reports.length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'वार्षिक अहवाल' : 'Reports'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('settings')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#B58A4A] block">
                      {Object.keys(siteSettings || {}).length || 4}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'वेबसाईट सेटिंग्ज' : 'Site Settings'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('inbox')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                        {inquiryCounts.total}
                      </span>
                      {inquiryCounts.unread > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {inquiryCounts.unread} {lang === 'mr' ? 'नवीन' : 'New'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'संपर्क संदेश (Inbox)' : 'Contact Messages'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('volunteers')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                        {volunteerCounts.total}
                      </span>
                      {volunteerCounts.new > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                          {volunteerCounts.new} {lang === 'mr' ? 'नवीन' : 'New'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'स्वयंसेवक नोंदणी' : 'Volunteer Registrations'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('pages')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#244A3A] block">
                      {(state.pageSections || []).length}
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'पृष्ठे व विभाग (Pages CMS)' : 'Pages & Sections'}
                    </span>
                  </div>

                  <div
                    onClick={() => setActiveTab('media')}
                    className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] cursor-pointer transition-all"
                  >
                    <span className="text-2xl font-serif font-bold text-[#B58A4A] block">
                      23+
                    </span>
                    <span className="text-xs text-[#55635B] font-semibold">
                      {lang === 'mr' ? 'मीडिया लायब्ररी (Media)' : 'Media Library'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: CONTACT INBOX (List, Search, Status Filter, Read/Unread, Delete)
          ================================================================ */}
          {activeTab === 'inbox' && (
            <div className="space-y-6">
              {/* Inbox Header & Summary Statistics */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DACB] pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#244A3A] text-white flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                        {lang === 'mr' ? 'संपर्क संदेश इनबॉक्स' : 'Contact Inquiries Inbox'}
                      </h2>
                      <p className="text-xs text-[#55635B]">
                        {lang === 'mr'
                          ? 'नागरिक, विद्यार्थी व पालकांकडून प्राप्त झालेले संपर्क संदेश, चौकशी व अभिप्राय.'
                          : 'Inquiries, feedback, and messages received from website visitors.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={loadInquiries}
                    disabled={isLoadingInquiries}
                    className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F3] hover:bg-[#EAE2D2] text-[#244A3A] text-xs font-semibold rounded-xl border border-[#E2DACB] transition-colors cursor-pointer disabled:opacity-50"
                    title={lang === 'mr' ? 'संदेश रिफ्रेश करा' : 'Refresh inquiries'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingInquiries ? 'animate-spin text-[#B58A4A]' : ''}`} />
                    <span>{lang === 'mr' ? 'रिफ्रेश करा' : 'Refresh'}</span>
                  </button>
                </div>

                {/* Stat Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div
                    onClick={() => setInquiryFilter('all')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      inquiryFilter === 'all'
                        ? 'bg-[#244A3A] text-white border-[#244A3A] shadow-xs'
                        : 'bg-[#FAF8F3] text-[#244A3A] border-[#E2DACB] hover:border-[#B58A4A]'
                    }`}
                  >
                    <span className="text-xl font-serif font-bold block">{inquiryCounts.total}</span>
                    <span className={`text-[11px] font-semibold ${inquiryFilter === 'all' ? 'text-white/80' : 'text-[#55635B]'}`}>
                      {lang === 'mr' ? 'एकूण संदेश (All)' : 'Total Messages'}
                    </span>
                  </div>

                  <div
                    onClick={() => setInquiryFilter('new')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      inquiryFilter === 'new'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-serif font-bold block">{inquiryCounts.unread}</span>
                      {inquiryCounts.unread > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      )}
                    </div>
                    <span className={`text-[11px] font-semibold ${inquiryFilter === 'new' ? 'text-white/80' : 'text-amber-800'}`}>
                      {lang === 'mr' ? 'न वाचलेले (Unread)' : 'Unread'}
                    </span>
                  </div>

                  <div
                    onClick={() => setInquiryFilter('read')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      inquiryFilter === 'read'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-xl font-serif font-bold block">{inquiryCounts.read}</span>
                    <span className={`text-[11px] font-semibold ${inquiryFilter === 'read' ? 'text-white/80' : 'text-emerald-800'}`}>
                      {lang === 'mr' ? 'वाचलेले (Read)' : 'Read'}
                    </span>
                  </div>

                  <div
                    onClick={() => setInquiryFilter('replied')}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      inquiryFilter === 'replied'
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-blue-50/60 text-blue-900 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    <span className="text-xl font-serif font-bold block">{inquiryCounts.replied}</span>
                    <span className={`text-[11px] font-semibold ${inquiryFilter === 'replied' ? 'text-white/80' : 'text-blue-800'}`}>
                      {lang === 'mr' ? 'उत्तरे दिलेले (Replied)' : 'Replied'}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#55635B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={inquirySearchQuery}
                      onChange={(e) => setInquirySearchQuery(e.target.value)}
                      placeholder={
                        lang === 'mr'
                          ? 'नाव, ईमेल, फोन किंवा विषयानुसार शोधा...'
                          : 'Search by sender, contact, or subject...'
                      }
                      className="w-full pl-9 pr-8 py-2 bg-[#FAF8F3] border border-[#E2DACB] rounded-xl text-xs text-[#244A3A] focus:outline-hidden focus:border-[#244A3A] focus:bg-white transition-all placeholder:text-[#55635B]/60"
                    />
                    {inquirySearchQuery && (
                      <button
                        onClick={() => setInquirySearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#55635B] hover:text-[#244A3A] p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    {[
                      { id: 'all', labelMr: 'सर्व', labelEn: 'All' },
                      { id: 'new', labelMr: 'न वाचलेले', labelEn: 'Unread' },
                      { id: 'read', labelMr: 'वाचलेले', labelEn: 'Read' },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setInquiryFilter(pill.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                          inquiryFilter === pill.id
                            ? 'bg-[#244A3A] text-white'
                            : 'bg-[#FAF8F3] text-[#55635B] hover:bg-[#EAE2D2] border border-[#E2DACB]'
                        }`}
                      >
                        {lang === 'mr' ? pill.labelMr : pill.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Inquiries Content / List Area */}
              {isLoadingInquiries && inquiries.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-[#E2DACB] flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#B58A4A] animate-spin" />
                  <span className="text-xs text-[#55635B] font-semibold">
                    {lang === 'mr' ? 'संदेश लोड होत आहेत...' : 'Loading inquiries...'}
                  </span>
                </div>
              ) : inquiryError ? (
                <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                    <span>{inquiryError}</span>
                  </div>
                  <button
                    onClick={loadInquiries}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                  >
                    {lang === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry'}
                  </button>
                </div>
              ) : inquiries.filter((inq) => {
                  if (!inquirySearchQuery.trim()) return true;
                  const q = inquirySearchQuery.toLowerCase();
                  return (
                    inq.fullName.toLowerCase().includes(q) ||
                    inq.contactDetail.toLowerCase().includes(q) ||
                    inq.subject.toLowerCase().includes(q) ||
                    inq.message.toLowerCase().includes(q)
                  );
                }).length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-[#E2DACB] text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] border border-[#E2DACB] flex items-center justify-center mx-auto text-[#B58A4A]">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-serif font-bold text-base text-[#244A3A]">
                      {inquirySearchQuery || inquiryFilter !== 'all'
                        ? lang === 'mr'
                          ? 'शोध निकषांशी जुळणारे संदेश आढळले नाहीत'
                          : 'No matching inquiries found'
                        : lang === 'mr'
                        ? 'अद्याप कोणताही संपर्क संदेश प्राप्त झालेला नाही'
                        : 'No contact inquiries received yet'}
                    </h3>
                    <p className="text-xs text-[#55635B]">
                      {inquirySearchQuery || inquiryFilter !== 'all'
                        ? lang === 'mr'
                          ? 'कृपया वेगळा शोध शब्द वापरा किंवा फिल्टर बदला.'
                          : 'Try adjusting your search query or status filter.'
                        : lang === 'mr'
                        ? 'वेबसाईटवरील संपर्क फॉर्मद्वारे येणारे संदेश येथे दिसतील.'
                        : 'Messages submitted through the public contact form will appear here.'}
                    </p>
                  </div>
                  {(inquirySearchQuery || inquiryFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setInquirySearchQuery('');
                        setInquiryFilter('all');
                      }}
                      className="px-4 py-2 bg-[#244A3A] hover:bg-[#1B3A2D] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      {lang === 'mr' ? 'निकष साफ करा' : 'Clear Filters'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiries
                    .filter((inq) => {
                      if (!inquirySearchQuery.trim()) return true;
                      const q = inquirySearchQuery.toLowerCase();
                      return (
                        inq.fullName.toLowerCase().includes(q) ||
                        inq.contactDetail.toLowerCase().includes(q) ||
                        inq.subject.toLowerCase().includes(q) ||
                        inq.message.toLowerCase().includes(q)
                      );
                    })
                    .map((item) => {
                      const isUnread = item.status === 'new';
                      const isEmail = item.contactDetail.includes('@');
                      return (
                        <div
                          key={item.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isUnread
                              ? 'bg-[#FFFDF7] border-amber-300 shadow-xs'
                              : 'bg-white border-[#E2DACB] hover:border-[#244A3A]/40'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Sender Info & Subject */}
                            <div className="space-y-2 min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-serif font-bold text-sm sm:text-base text-[#244A3A] flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-[#B58A4A] shrink-0" />
                                  <span>{item.fullName}</span>
                                </span>

                                {/* Status badge */}
                                {isUnread ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                    {lang === 'mr' ? 'नवीन / न वाचलेला' : 'New / Unread'}
                                  </span>
                                ) : item.status === 'replied' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                    {lang === 'mr' ? 'उत्तर दिलेले' : 'Replied'}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FAF8F3] text-[#55635B] border border-[#E2DACB]">
                                    {lang === 'mr' ? 'वाचलेले' : 'Read'}
                                  </span>
                                )}

                                <span className="text-[11px] text-[#55635B] flex items-center gap-1 ml-auto sm:ml-0 font-sans">
                                  <Clock className="w-3 h-3 text-[#B58A4A]" />
                                  <span>{item.createdAt}</span>
                                </span>
                              </div>

                              {/* Contact Detail Link */}
                              <div className="flex items-center gap-2 text-xs text-[#55635B]">
                                <span className="font-semibold text-[#244A3A]">
                                  {lang === 'mr' ? 'संपर्क:' : 'Contact:'}
                                </span>
                                {isEmail ? (
                                  <a
                                    href={`mailto:${item.contactDetail}`}
                                    className="text-[#244A3A] underline hover:text-[#B58A4A] flex items-center gap-1 truncate"
                                  >
                                    <Mail className="w-3 h-3 shrink-0" />
                                    <span>{item.contactDetail}</span>
                                  </a>
                                ) : (
                                  <a
                                    href={`tel:${item.contactDetail.replace(/[^\d+]/g, '')}`}
                                    className="text-[#244A3A] underline hover:text-[#B58A4A] flex items-center gap-1 truncate"
                                  >
                                    <Phone className="w-3 h-3 shrink-0" />
                                    <span>{item.contactDetail}</span>
                                  </a>
                                )}
                              </div>

                              {/* Subject */}
                              <div className="text-xs sm:text-sm font-semibold text-[#244A3A]">
                                <span className="text-[#B58A4A] font-bold mr-1.5 font-serif">
                                  {lang === 'mr' ? 'विषय:' : 'Subject:'}
                                </span>
                                <span>{item.subject}</span>
                              </div>

                              {/* Message Preview */}
                              <p className="text-xs text-[#55635B] line-clamp-2 leading-relaxed bg-[#FAF8F3]/60 p-2.5 rounded-xl border border-[#E2DACB]/60">
                                {item.message}
                              </p>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DACB]/60">
                              <button
                                onClick={() => {
                                  setSelectedInquiry(item);
                                  if (item.status === 'new') {
                                    handleToggleInquiryStatus(item);
                                  }
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#244A3A] hover:bg-[#1B3A2D] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{lang === 'mr' ? 'तपशील' : 'View'}</span>
                              </button>

                              <button
                                onClick={() => handleToggleInquiryStatus(item)}
                                disabled={isUpdatingInquiryStatus === item.id}
                                className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors border ${
                                  isUnread
                                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                                    : 'bg-[#FAF8F3] hover:bg-[#EAE2D2] text-[#55635B] border-[#E2DACB]'
                                }`}
                                title={isUnread ? (lang === 'mr' ? 'वाचले म्हणून चिन्हांकित करा' : 'Mark as read') : (lang === 'mr' ? 'न वाचले म्हणून चिन्हांकित करा' : 'Mark as unread')}
                              >
                                {isUpdatingInquiryStatus === item.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : isUnread ? (
                                  <MailOpen className="w-3.5 h-3.5" />
                                ) : (
                                  <Mail className="w-3.5 h-3.5" />
                                )}
                                <span>
                                  {isUnread
                                    ? lang === 'mr'
                                      ? 'वाचले'
                                      : 'Mark Read'
                                    : lang === 'mr'
                                    ? 'न वाचले'
                                    : 'Mark Unread'}
                                </span>
                              </button>

                              <button
                                onClick={() => setInquiryToDelete(item)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                                title={lang === 'mr' ? 'हा संदेश हटवा' : 'Delete message'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB: VOLUNTEER REGISTRATIONS (Inbox, Filter, Workflow Status, Notes, Delete)
          ================================================================ */}
          {activeTab === 'volunteers' && (
            <div className="space-y-6">
              {/* Header & Stats */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2DACB] pb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#244A3A] text-white flex items-center justify-center shrink-0">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                        {lang === 'mr' ? 'स्वयंसेवक नोंदणी (Volunteer Registrations)' : 'Volunteer Registrations'}
                      </h2>
                      <p className="text-xs text-[#55635B]">
                        {lang === 'mr'
                          ? 'नागरिक, युवक व सामाजिक कार्यकर्त्यांकडून प्राप्त झालेली स्वयंसेवक नोंदणी व कार्यक्षेत्रे.'
                          : 'Volunteer registrations received from citizens, youth, and community members.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={loadVolunteers}
                    disabled={isLoadingVolunteers}
                    className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F3] hover:bg-[#EAE2D2] text-[#244A3A] text-xs font-semibold rounded-xl border border-[#E2DACB] transition-colors cursor-pointer disabled:opacity-50"
                    title={lang === 'mr' ? 'नोंदणी रिफ्रेश करा' : 'Refresh volunteers'}
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingVolunteers ? 'animate-spin text-[#B58A4A]' : ''}`} />
                    <span>{lang === 'mr' ? 'रिफ्रेश करा' : 'Refresh'}</span>
                  </button>
                </div>

                {/* Stat Counters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div
                    onClick={() => setVolunteerFilter('all')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      volunteerFilter === 'all'
                        ? 'bg-[#244A3A] text-white border-[#244A3A] shadow-xs'
                        : 'bg-[#FAF8F3] text-[#244A3A] border-[#E2DACB] hover:border-[#B58A4A]'
                    }`}
                  >
                    <span className="text-lg font-serif font-bold block">{volunteerCounts.total}</span>
                    <span className={`text-[10px] font-semibold ${volunteerFilter === 'all' ? 'text-white/80' : 'text-[#55635B]'}`}>
                      {lang === 'mr' ? 'एकूण (All)' : 'Total'}
                    </span>
                  </div>

                  <div
                    onClick={() => setVolunteerFilter('new')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      volunteerFilter === 'new'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-amber-50/60 text-amber-900 border-amber-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-serif font-bold block">{volunteerCounts.new}</span>
                      {volunteerCounts.new > 0 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold ${volunteerFilter === 'new' ? 'text-white/80' : 'text-amber-800'}`}>
                      {lang === 'mr' ? 'नवीन (New)' : 'New'}
                    </span>
                  </div>

                  <div
                    onClick={() => setVolunteerFilter('reviewing')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      volunteerFilter === 'reviewing'
                        ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                        : 'bg-purple-50/60 text-purple-900 border-purple-200 hover:border-purple-400'
                    }`}
                  >
                    <span className="text-lg font-serif font-bold block">{volunteerCounts.reviewing}</span>
                    <span className={`text-[10px] font-semibold ${volunteerFilter === 'reviewing' ? 'text-white/80' : 'text-purple-800'}`}>
                      {lang === 'mr' ? 'तपासणी सुरू' : 'Reviewing'}
                    </span>
                  </div>

                  <div
                    onClick={() => setVolunteerFilter('approved')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      volunteerFilter === 'approved'
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                        : 'bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:border-emerald-400'
                    }`}
                  >
                    <span className="text-lg font-serif font-bold block">{volunteerCounts.approved}</span>
                    <span className={`text-[10px] font-semibold ${volunteerFilter === 'approved' ? 'text-white/80' : 'text-emerald-800'}`}>
                      {lang === 'mr' ? 'मंजूर (Approved)' : 'Approved'}
                    </span>
                  </div>

                  <div
                    onClick={() => setVolunteerFilter('contacted')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      volunteerFilter === 'contacted'
                        ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                        : 'bg-blue-50/60 text-blue-900 border-blue-200 hover:border-blue-400'
                    }`}
                  >
                    <span className="text-lg font-serif font-bold block">{volunteerCounts.contacted}</span>
                    <span className={`text-[10px] font-semibold ${volunteerFilter === 'contacted' ? 'text-white/80' : 'text-blue-800'}`}>
                      {lang === 'mr' ? 'संपर्क साधला' : 'Contacted'}
                    </span>
                  </div>

                  <div
                    onClick={() => setVolunteerFilter('declined')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      volunteerFilter === 'declined'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-rose-50/60 text-rose-900 border-rose-200 hover:border-rose-400'
                    }`}
                  >
                    <span className="text-lg font-serif font-bold block">{volunteerCounts.declined}</span>
                    <span className={`text-[10px] font-semibold ${volunteerFilter === 'declined' ? 'text-white/80' : 'text-rose-800'}`}>
                      {lang === 'mr' ? 'अस्वीकृत' : 'Declined'}
                    </span>
                  </div>

                  <div
                    onClick={() => setVolunteerFilter('archived')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      volunteerFilter === 'archived'
                        ? 'bg-gray-700 text-white border-gray-700 shadow-xs'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-lg font-serif font-bold block">{volunteerCounts.archived}</span>
                    <span className={`text-[10px] font-semibold ${volunteerFilter === 'archived' ? 'text-white/80' : 'text-gray-600'}`}>
                      {lang === 'mr' ? 'अभिलेखात' : 'Archived'}
                    </span>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 text-[#55635B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={volunteerSearchQuery}
                      onChange={(e) => setVolunteerSearchQuery(e.target.value)}
                      placeholder={
                        lang === 'mr'
                          ? 'नाव, फोन, ईमेल, गाव किंवा जिल्ह्यानुसार शोधा...'
                          : 'Search by name, phone, email, village, or district...'
                      }
                      className="w-full pl-9 pr-8 py-2 bg-[#FAF8F3] border border-[#E2DACB] rounded-xl text-xs text-[#244A3A] focus:outline-hidden focus:border-[#244A3A] focus:bg-white transition-all placeholder:text-[#55635B]/60"
                    />
                    {volunteerSearchQuery && (
                      <button
                        onClick={() => setVolunteerSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#55635B] hover:text-[#244A3A] p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                    {[
                      { id: 'all', labelMr: 'सर्व', labelEn: 'All' },
                      { id: 'new', labelMr: 'नवीन', labelEn: 'New' },
                      { id: 'reviewing', labelMr: 'तपासणी', labelEn: 'Reviewing' },
                      { id: 'approved', labelMr: 'मंजूर', labelEn: 'Approved' },
                      { id: 'contacted', labelMr: 'संपर्क', labelEn: 'Contacted' },
                      { id: 'declined', labelMr: 'अस्वीकृत', labelEn: 'Declined' },
                      { id: 'archived', labelMr: 'अभिलेखात', labelEn: 'Archived' },
                    ].map((pill) => (
                      <button
                        key={pill.id}
                        onClick={() => setVolunteerFilter(pill.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                          volunteerFilter === pill.id
                            ? 'bg-[#244A3A] text-white'
                            : 'bg-[#FAF8F3] text-[#55635B] hover:bg-[#EAE2D2] border border-[#E2DACB]'
                        }`}
                      >
                        {lang === 'mr' ? pill.labelMr : pill.labelEn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Volunteers List Area */}
              {isLoadingVolunteers && volunteers.length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-[#E2DACB] flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-[#B58A4A] animate-spin" />
                  <span className="text-xs text-[#55635B] font-semibold">
                    {lang === 'mr' ? 'स्वयंसेवक माहिती लोड होत आहे...' : 'Loading volunteer registrations...'}
                  </span>
                </div>
              ) : volunteerError ? (
                <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5">
                    <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                    <span>{volunteerError}</span>
                  </div>
                  <button
                    onClick={loadVolunteers}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0"
                  >
                    {lang === 'mr' ? 'पुन्हा प्रयत्न करा' : 'Retry'}
                  </button>
                </div>
              ) : volunteers.filter((vol) => {
                  if (!volunteerSearchQuery.trim()) return true;
                  const q = volunteerSearchQuery.toLowerCase();
                  return (
                    vol.fullName.toLowerCase().includes(q) ||
                    vol.phone.toLowerCase().includes(q) ||
                    (vol.email && vol.email.toLowerCase().includes(q)) ||
                    vol.village.toLowerCase().includes(q) ||
                    vol.district.toLowerCase().includes(q) ||
                    vol.taluka.toLowerCase().includes(q) ||
                    vol.areasOfInterest.some((a) => a.toLowerCase().includes(q))
                  );
                }).length === 0 ? (
                <div className="bg-white p-12 rounded-2xl border border-[#E2DACB] text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#FAF8F3] border border-[#E2DACB] flex items-center justify-center mx-auto text-[#B58A4A]">
                    <HeartHandshake className="w-7 h-7" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h3 className="font-serif font-bold text-base text-[#244A3A]">
                      {volunteerSearchQuery || volunteerFilter !== 'all'
                        ? lang === 'mr'
                          ? 'शोध निकषांशी जुळणारे स्वयंसेवक आढळले नाहीत'
                          : 'No matching volunteer registrations found'
                        : lang === 'mr'
                        ? 'अद्याप कोणतीही स्वयंसेवक नोंदणी प्राप्त झालेली नाही'
                        : 'No volunteer registrations received yet'}
                    </h3>
                    <p className="text-xs text-[#55635B]">
                      {volunteerSearchQuery || volunteerFilter !== 'all'
                        ? lang === 'mr'
                          ? 'कृपया वेगळा शोध शब्द वापरा किंवा स्थिती फिल्टर बदला.'
                          : 'Try adjusting your search query or status filter.'
                        : lang === 'mr'
                        ? 'वेबसाईटवरील स्वयंसेवक फॉर्मद्वारे येणारी नोंदणी येथे दिसेल.'
                        : 'Applications submitted via the volunteer registration form will appear here.'}
                    </p>
                  </div>
                  {(volunteerSearchQuery || volunteerFilter !== 'all') && (
                    <button
                      onClick={() => {
                        setVolunteerSearchQuery('');
                        setVolunteerFilter('all');
                      }}
                      className="px-4 py-2 bg-[#244A3A] hover:bg-[#1B3A2D] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                    >
                      {lang === 'mr' ? 'निकष साफ करा' : 'Clear Filters'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {volunteers
                    .filter((vol) => {
                      if (!volunteerSearchQuery.trim()) return true;
                      const q = volunteerSearchQuery.toLowerCase();
                      return (
                        vol.fullName.toLowerCase().includes(q) ||
                        vol.phone.toLowerCase().includes(q) ||
                        (vol.email && vol.email.toLowerCase().includes(q)) ||
                        vol.village.toLowerCase().includes(q) ||
                        vol.district.toLowerCase().includes(q) ||
                        vol.taluka.toLowerCase().includes(q) ||
                        vol.areasOfInterest.some((a) => a.toLowerCase().includes(q))
                      );
                    })
                    .map((item) => {
                      const isNew = item.status === 'new';
                      return (
                        <div
                          key={item.id}
                          className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                            isNew
                              ? 'bg-[#FFFDF7] border-amber-300 shadow-xs'
                              : 'bg-white border-[#E2DACB] hover:border-[#244A3A]/40'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Volunteer Info & Tags */}
                            <div className="space-y-2.5 min-w-0 flex-1">
                              <div className="flex items-center flex-wrap gap-2">
                                <span className="font-serif font-bold text-sm sm:text-base text-[#244A3A] flex items-center gap-1.5">
                                  <User className="w-4 h-4 text-[#B58A4A] shrink-0" />
                                  <span>{item.fullName}</span>
                                </span>

                                <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E2DACB] text-[#55635B]">
                                  #VOL-{item.id}
                                </span>

                                {/* Status badge */}
                                {item.status === 'new' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                                    {lang === 'mr' ? 'नवीन' : 'New'}
                                  </span>
                                )}
                                {item.status === 'reviewing' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-300">
                                    {lang === 'mr' ? 'तपासणी सुरू' : 'Reviewing'}
                                  </span>
                                )}
                                {item.status === 'approved' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    {lang === 'mr' ? 'मंजूर' : 'Approved'}
                                  </span>
                                )}
                                {item.status === 'contacted' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                    {lang === 'mr' ? 'संपर्क साधला' : 'Contacted'}
                                  </span>
                                )}
                                {item.status === 'declined' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                                    {lang === 'mr' ? 'अस्वीकृत' : 'Declined'}
                                  </span>
                                )}
                                {item.status === 'archived' && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                                    {lang === 'mr' ? 'अभिलेखात' : 'Archived'}
                                  </span>
                                )}

                                <span className="text-[11px] text-[#55635B] flex items-center gap-1 ml-auto sm:ml-0 font-sans">
                                  <Clock className="w-3 h-3 text-[#B58A4A]" />
                                  <span>{item.createdAt}</span>
                                </span>
                              </div>

                              {/* Contact & Location Line */}
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#55635B]">
                                <a
                                  href={`tel:${item.phone}`}
                                  className="text-[#244A3A] font-semibold hover:text-[#B58A4A] underline flex items-center gap-1"
                                >
                                  <Phone className="w-3.5 h-3.5 shrink-0 text-[#B58A4A]" />
                                  <span>{item.phone}</span>
                                </a>

                                {item.email && (
                                  <a
                                    href={`mailto:${item.email}`}
                                    className="text-[#244A3A] hover:text-[#B58A4A] underline flex items-center gap-1"
                                  >
                                    <Mail className="w-3.5 h-3.5 shrink-0 text-[#B58A4A]" />
                                    <span>{item.email}</span>
                                  </a>
                                )}

                                <span className="flex items-center gap-1 text-[#55635B]">
                                  <MapPin className="w-3.5 h-3.5 shrink-0 text-[#B58A4A]" />
                                  <span>
                                    {item.village}, {item.taluka}, {item.district}
                                  </span>
                                </span>

                                {item.ageBracket && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E2DACB] text-[11px]">
                                    {lang === 'mr' ? 'वयोगट:' : 'Age:'} {item.ageBracket}
                                  </span>
                                )}

                                {item.availability && (
                                  <span className="px-2 py-0.5 rounded-md bg-[#EBF3EE] text-[#143B2A] border border-[#C5DDCB] text-[11px] font-medium">
                                    {lang === 'mr' ? 'वेळ:' : 'Avail:'} {item.availability}
                                  </span>
                                )}
                              </div>

                              {/* Areas of Interest Badges */}
                              {item.areasOfInterest.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <span className="text-[11px] font-semibold text-[#55635B] flex items-center gap-1 mr-1">
                                    <Tag className="w-3 h-3 text-[#B58A4A]" />
                                    <span>{lang === 'mr' ? 'आवडती कार्यक्षेत्रे:' : 'Interests:'}</span>
                                  </span>
                                  {item.areasOfInterest.map((area, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2.5 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E2DACB] text-[11px] font-medium text-[#244A3A]"
                                    >
                                      {area}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Motivation Message Preview */}
                              {item.message && (
                                <p className="text-xs text-[#55635B] line-clamp-2 leading-relaxed bg-[#FAF8F3]/60 p-2.5 rounded-xl border border-[#E2DACB]/60">
                                  <span className="font-semibold text-[#244A3A] mr-1">
                                    {lang === 'mr' ? 'संदेश:' : 'Note:'}
                                  </span>
                                  {item.message}
                                </p>
                              )}

                              {/* Admin Notes Preview (if already written) */}
                              {item.adminNotes && (
                                <div className="text-[11px] text-amber-900 bg-amber-50/70 border border-amber-200/80 px-2.5 py-1 rounded-lg">
                                  <span className="font-bold mr-1">
                                    {lang === 'mr' ? 'प्रशासकीय नोंद:' : 'Admin Note:'}
                                  </span>
                                  {item.adminNotes}
                                </div>
                              )}
                            </div>

                            {/* Actions Toolbar */}
                            <div className="flex sm:flex-col items-center sm:items-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DACB]/60">
                              <button
                                onClick={() => {
                                  setSelectedVolunteer(item);
                                  setVolunteerAdminNotesInput(item.adminNotes || '');
                                }}
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#244A3A] hover:bg-[#1B3A2D] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{lang === 'mr' ? 'तपशील' : 'View Details'}</span>
                              </button>

                              {/* Status Quick Select */}
                              <select
                                value={item.status}
                                onChange={(e) => handleUpdateVolunteerStatus(item, e.target.value as VolunteerStatus)}
                                disabled={isUpdatingVolunteerStatus === item.id}
                                className="px-2 py-1 text-[11px] font-semibold bg-[#FAF8F3] border border-[#E2DACB] rounded-lg text-[#244A3A] cursor-pointer focus:outline-none"
                              >
                                <option value="new">{lang === 'mr' ? 'नवीन (New)' : 'New'}</option>
                                <option value="reviewing">{lang === 'mr' ? 'तपासणी सुरू' : 'Reviewing'}</option>
                                <option value="approved">{lang === 'mr' ? 'मंजूर (Approved)' : 'Approved'}</option>
                                <option value="contacted">{lang === 'mr' ? 'संपर्क साधला' : 'Contacted'}</option>
                                <option value="declined">{lang === 'mr' ? 'अस्वीकृत' : 'Declined'}</option>
                                <option value="archived">{lang === 'mr' ? 'अभिलेखात' : 'Archived'}</option>
                              </select>

                              <button
                                onClick={() => setVolunteerToDelete(item)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-200"
                                title={lang === 'mr' ? 'नोंदणी हटवा' : 'Delete registration'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              TAB 2: OFFICIALS MANAGEMENT (Add, Edit/Update, Delete, Photo Upload, Order & Status)
          ================================================================ */}
          {activeTab === 'officials' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                      {editingOfficialId
                        ? lang === 'mr'
                          ? 'पदाधिकारी माहिती संपादित करा (Edit Official)'
                          : 'Edit Official Details'
                        : lang === 'mr'
                        ? 'नवीन पदाधिकारी जोडा (Add Official)'
                        : 'Add Institute Official'}
                    </h2>
                    <p className="text-xs text-[#55635B] mt-0.5">
                      {lang === 'mr'
                        ? 'मराठी आणि इंग्रजी दोन्ही भाषांमध्ये स्वतंत्र माहिती नोंदवा.'
                        : 'Register official profile with independent Marathi and English fields.'}
                    </p>
                  </div>
                  {editingOfficialId && (
                    <button
                      type="button"
                      onClick={resetOfficialForm}
                      className="text-xs font-semibold text-[#8F3426] underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'रद्द करा' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                {officialFormError && (
                  <div className="p-3 bg-[#FBECE9] border border-[#ECCAC3] rounded-xl text-xs text-[#8F3426] font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{officialFormError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveOfficial} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'पदाधिकाऱ्याचे पूर्ण नाव (मराठी) *' : 'Full Name (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={offName}
                        onChange={(e) => setOffName(e.target.value)}
                        placeholder="उदा. श्री. दिलीप निकम"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'नाव (English)' : 'Full Name (English)'}
                      </label>
                      <input
                        type="text"
                        value={offNameEn}
                        onChange={(e) => setOffNameEn(e.target.value)}
                        placeholder="e.g. Shri. Dilip Nikam"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'पद / भूमिका (मराठी) *' : 'Role / Designation (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={offRole}
                        onChange={(e) => setOffRole(e.target.value)}
                        placeholder="उदा. अध्यक्ष / सचिव / कोषाध्यक्ष"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'पद (English)' : 'Role / Designation (English)'}
                      </label>
                      <input
                        type="text"
                        value={offRoleEn}
                        onChange={(e) => setOffRoleEn(e.target.value)}
                        placeholder="e.g. President / Secretary"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संपर्क क्रमांक (Phone)' : 'Contact Phone'}
                      </label>
                      <input
                        type="text"
                        value={offPhone}
                        onChange={(e) => setOffPhone(e.target.value)}
                        placeholder="+91 98xxxxxxxx"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'प्रदर्शन क्रम (Display Order)' : 'Display Order (e.g. 1, 2, 3)'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={offDisplayOrder}
                        onChange={(e) => setOffDisplayOrder(parseInt(e.target.value, 10) || 0)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Photo Mode Selection and Input */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-[#244A3A]">
                        {lang === 'mr' ? 'पदाधिकाऱ्याचा फोटो (Official Photo)' : 'Official Photo'}
                      </label>
                      <div className="inline-flex p-1 bg-[#EFECE4] rounded-xl text-xs font-medium">
                        <button
                          type="button"
                          onClick={() => {
                            setOffPhotoSource('upload');
                            setOffPhotoUploadError(null);
                          }}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            offPhotoSource === 'upload'
                              ? 'bg-[#244A3A] text-white shadow-xs font-bold'
                              : 'text-[#55635B] hover:text-[#244A3A]'
                          }`}
                        >
                          {lang === 'mr' ? 'फाइल अपलोड करा' : 'Upload File'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOffPhotoSource('url');
                            setOffPhotoUploadError(null);
                          }}
                          className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                            offPhotoSource === 'url'
                              ? 'bg-[#244A3A] text-white shadow-xs font-bold'
                              : 'text-[#55635B] hover:text-[#244A3A]'
                          }`}
                        >
                          {lang === 'mr' ? 'बाह्य URL टाका' : 'External URL'}
                        </button>
                      </div>
                    </div>

                    {offPhotoSource === 'upload' ? (
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                          <label
                            className={`inline-flex items-center gap-2 px-4 py-2.5 bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0] rounded-xl text-xs font-bold cursor-pointer hover:bg-[#d8e8dc] shrink-0 transition-colors ${
                              isUploadingOffPhoto ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
                            }`}
                          >
                            {isUploadingOffPhoto ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#244A3A]" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span>
                              {isUploadingOffPhoto
                                ? (lang === 'mr' ? 'अपलोड होत आहे...' : 'Uploading...')
                                : (lang === 'mr' ? 'कॉम्प्युटरमधून फोटो निवडा' : 'Choose Local Photo')}
                            </span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                              className="hidden"
                              disabled={isUploadingOffPhoto}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;

                                // Client-side pre-validation
                                const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                                const validExts = ['.jpg', '.jpeg', '.png', '.webp'];
                                const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();

                                if (!validTypes.includes(file.type) && !validExts.includes(fileExt)) {
                                  setOffPhotoUploadError(
                                    lang === 'mr'
                                      ? 'केवळ JPG, PNG किंवा WebP फॉरमॅट समर्थित आहेत.'
                                      : 'Only JPG, PNG, or WebP image files are supported.'
                                  );
                                  return;
                                }

                                if (file.size > 5 * 1024 * 1024) {
                                  setOffPhotoUploadError(
                                    lang === 'mr'
                                      ? 'फोटोचा आकार ५MB पेक्षा कमी असावा.'
                                      : 'Photo file size must be under 5MB.'
                                  );
                                  return;
                                }

                                setOffPhotoUploadError(null);
                                setIsUploadingOffPhoto(true);
                                setOffPhotoUploadProgress(0);

                                const localBlobUrl = URL.createObjectURL(file);
                                setOffPendingPreview(localBlobUrl);

                                try {
                                  const res = await ApiClient.uploadImage(file, (percent) => {
                                    setOffPhotoUploadProgress(percent);
                                  });
                                  if (res?.url) {
                                    setOffImageUrl(res.url);
                                    setOffPhotoUploadError(null);
                                    showToast(
                                      lang === 'mr'
                                        ? 'फोटो यशस्वीरित्या अपलोड झाला!'
                                        : 'Photo uploaded successfully!'
                                    );
                                  }
                                } catch (err: any) {
                                  setOffPhotoUploadError(
                                    err?.message || (lang === 'mr' ? 'फोटो अपलोड अयशस्वी.' : 'Photo upload failed.')
                                  );
                                  showToast(
                                    lang === 'mr' ? 'फोटो अपलोड त्रुटी.' : 'Upload error.'
                                  );
                                } finally {
                                  setIsUploadingOffPhoto(false);
                                  URL.revokeObjectURL(localBlobUrl);
                                  setOffPendingPreview(null);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>

                          <div className="text-[11px] text-[#55635B]">
                            {lang === 'mr'
                              ? 'समर्थित: JPG, PNG, WebP (कमाल आकार: ५MB). सर्व्हरवर सुरक्षित साठवले जाईल.'
                              : 'Supported: JPG, PNG, WebP (Max 5MB). Stored safely on server.'}
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {isUploadingOffPhoto && (
                          <div className="w-full bg-[#E2DACB] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#244A3A] h-1.5 transition-all duration-300"
                              style={{ width: `${Math.max(offPhotoUploadProgress, 10)}%` }}
                            />
                          </div>
                        )}

                        {/* Upload Error */}
                        {offPhotoUploadError && (
                          <div className="flex items-center gap-2 p-2 bg-[#FBEAE8] border border-[#E8B4AF] rounded-xl text-xs text-[#8F3426]">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{offPhotoUploadError}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <input
                          type="url"
                          value={offImageUrl}
                          onChange={(e) => {
                            setOffImageUrl(e.target.value);
                            setOffPhotoUploadError(null);
                          }}
                          placeholder="https://example.com/photo.jpg"
                          className="w-full px-3.5 py-2 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                        />
                        <p className="text-[11px] text-[#78827A]">
                          {lang === 'mr'
                            ? 'केवळ सुरक्षित HTTPS बाह्य लिंक समर्थित आहेत.'
                            : 'Only secure HTTPS external image links are accepted.'}
                        </p>
                      </div>
                    )}

                    {/* Image Preview & Current URL indicator */}
                    {(offPendingPreview || offImageUrl) && (
                      <div className="pt-2 flex items-center gap-3 bg-[#FAF8F3] p-3 rounded-xl border border-[#E2DACB]">
                        <img
                          src={offPendingPreview || offImageUrl}
                          alt="Preview"
                          className="w-16 h-16 rounded-xl object-cover border border-[#D8CEBE] shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-[#244A3A] truncate">
                            {offPendingPreview
                              ? (lang === 'mr' ? 'अपलोड होत आहे...' : 'Uploading...')
                              : (offImageUrl.startsWith('/backend-php-mysql/')
                                ? (lang === 'mr' ? 'स्थानिक सर्व्हर फोटो साठवला गेला' : 'Server upload ready')
                                : (lang === 'mr' ? 'बाह्य HTTPS फोटो लिंक' : 'External HTTPS photo link'))}
                          </p>
                          <p className="text-[11px] text-[#78827A] truncate font-mono mt-0.5">
                            {offImageUrl || (lang === 'mr' ? 'प्रक्रिया सुरू आहे...' : 'Processing...')}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setOffImageUrl('');
                            setOffPendingPreview(null);
                            setOffPhotoUploadError(null);
                          }}
                          className="text-xs text-[#8F3426] hover:underline cursor-pointer shrink-0 px-2 py-1"
                        >
                          {lang === 'mr' ? 'काढा' : 'Remove'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त माहिती / बायो (मराठी)' : 'Short Bio / Info (Marathi)'}
                      </label>
                      <textarea
                        rows={2}
                        value={offBio}
                        onChange={(e) => setOffBio(e.target.value)}
                        placeholder={lang === 'mr' ? 'पदाधिकाऱ्याविषयी माहिती...' : 'Brief description in Marathi...'}
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'माहिती / बायो (English)' : 'Short Bio / Info (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={offBioEn}
                        onChange={(e) => setOffBioEn(e.target.value)}
                        placeholder="Brief bio in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#244A3A] block">
                        {lang === 'mr' ? 'वेबसाईटवर प्रकाशित करा (Publish on Website)' : 'Publish on Website'}
                      </span>
                      <span className="text-[11px] text-[#55635B]">
                        {offPublished
                          ? lang === 'mr'
                            ? 'हा पदाधिकारी वेबसाईटवर सर्वांना दिसेल.'
                            : 'This official will be publicly visible.'
                          : lang === 'mr'
                          ? 'केवळ मसुदा (Draft) - सामान्य जनतेला दिसणार नाही.'
                          : 'Draft only - hidden from public view.'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offPublished}
                        onChange={(e) => setOffPublished(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#244A3A]"></div>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingOfficial}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSavingOfficial ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#B58A4A]" />
                    )}
                    <span>
                      {isSavingOfficial
                        ? lang === 'mr'
                          ? 'जतन होत आहे...'
                          : 'Saving...'
                        : editingOfficialId
                        ? lang === 'mr'
                          ? 'बदल जतन करा (Update Official)'
                          : 'Update Official'
                        : lang === 'mr'
                        ? 'पदाधिकारी जोडा'
                        : 'Add Official'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Officials List with Publication Status and Delete Confirmation */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-serif font-bold text-[#244A3A]">
                    {lang === 'mr'
                      ? `सध्याचे पदाधिकारी (${(state.officials || []).length})`
                      : `Current Officials (${(state.officials || []).length})`}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(state.officials || []).map((off) => {
                    const isDeleting = isDeletingOfficialId === off.id;
                    const isToggling = isTogglingPublishOfficialId === off.id;
                    const isPub = off.published !== false;

                    return (
                      <div
                        key={off.id}
                        className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isPub
                            ? 'bg-[#FAF8F3] border-[#E2DACB]'
                            : 'bg-amber-50/40 border-amber-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={off.imageUrl}
                            alt={off.name}
                            className="w-14 h-14 rounded-xl object-cover border border-[#D8CEBE] shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-bold text-sm text-[#244A3A] truncate">
                                {lang === 'mr' ? off.name : off.nameEn || off.name}
                              </h4>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                  isPub
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isPub
                                  ? lang === 'mr'
                                    ? 'प्रकाशित'
                                    : 'Published'
                                  : lang === 'mr'
                                  ? 'मसुदा (Draft)'
                                  : 'Draft'}
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-[#B58A4A] block truncate">
                              {lang === 'mr' ? off.role : off.roleEn || off.role}
                            </span>
                            {off.phone && (
                              <span className="text-[11px] text-[#55635B] block truncate">
                                📞 {off.phone}
                              </span>
                            )}
                            {off.displayOrder !== undefined && (
                              <span className="text-[10px] text-gray-500 font-mono">
                                {lang === 'mr' ? `क्रम: ${off.displayOrder}` : `Order: ${off.displayOrder}`}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DACB]/60 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleTogglePublishOfficial(off)}
                            disabled={isToggling}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg border border-transparent hover:border-[#D8CEBE] cursor-pointer disabled:opacity-40"
                            title={
                              isPub
                                ? lang === 'mr'
                                  ? 'मसुदा करा (Unpublish)'
                                  : 'Unpublish to Draft'
                                : lang === 'mr'
                                ? 'प्रकाशित करा'
                                : 'Publish'
                            }
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#244A3A]" />
                            ) : isPub ? (
                              <Eye className="w-4 h-4 text-emerald-700" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-amber-700" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditOfficial(off)}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg border border-transparent hover:border-[#D8CEBE] cursor-pointer"
                            title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            disabled={isDeleting}
                            onClick={() => handleDeleteOfficial(off)}
                            className="p-2 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-40"
                            title={lang === 'mr' ? 'हटवा' : 'Delete'}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#8F3426]" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 3: YOUTUBE VIDEOS (Add, Edit/Update, Delete, Cover Image Upload)
          ================================================================ */}
          {/* ================================================================
              TAB 3: VIDEOS (YouTube + Direct MP4, Bilingual Fields, Cover Image)
          ================================================================ */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                    {editingVideoId
                      ? lang === 'mr'
                        ? 'व्हिडिओ संपादित करा (Edit Video)'
                        : 'Edit Video'
                      : lang === 'mr'
                      ? 'नवीन व्हिडिओ जोडा (Add Video)'
                      : 'Add Video'}
                  </h2>
                  {editingVideoId && (
                    <button
                      type="button"
                      onClick={resetVideoForm}
                      className="text-xs font-semibold text-[#8F3426] underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'रद्द करा' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveVideo} className="space-y-5">
                  {/* Video Source Selector */}
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1.5">
                      {lang === 'mr' ? 'व्हिडिओ प्रकार निवडा (Video Source) *' : 'Select Video Source *'}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSelectVideoSource('youtube')}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                          videoSourceType === 'youtube'
                            ? 'bg-[#EAF2EC] border-[#244A3A] text-[#244A3A] shadow-xs'
                            : 'bg-[#FAF8F3] border-[#D8CEBE] text-[#55635B] hover:border-[#244A3A]/40'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            videoSourceType === 'youtube'
                              ? 'bg-[#244A3A] text-white'
                              : 'bg-[#E2DACB] text-[#55635B]'
                          }`}
                        >
                          <Video className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm">
                            {lang === 'mr' ? 'YouTube व्हिडिओ' : 'YouTube Video'}
                          </div>
                          <div className="text-[11px] text-[#6E7B73]">
                            {lang === 'mr'
                              ? 'मानक watch, youtu.be, embed, shorts'
                              : 'Standard watch, youtu.be, embed, shorts'}
                          </div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectVideoSource('direct')}
                        className={`p-3.5 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer ${
                          videoSourceType === 'direct'
                            ? 'bg-[#EAF2EC] border-[#244A3A] text-[#244A3A] shadow-xs'
                            : 'bg-[#FAF8F3] border-[#D8CEBE] text-[#55635B] hover:border-[#244A3A]/40'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            videoSourceType === 'direct'
                              ? 'bg-[#244A3A] text-white'
                              : 'bg-[#E2DACB] text-[#55635B]'
                          }`}
                        >
                          <Film className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs sm:text-sm">
                            {lang === 'mr' ? 'थेट व्हिडिओ लिंक (MP4)' : 'Direct Video URL (MP4)'}
                          </div>
                          <div className="text-[11px] text-[#6E7B73]">
                            .mp4, .webm, .mov, .m4v
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Video URL Input & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {videoSourceType === 'youtube'
                          ? lang === 'mr'
                            ? 'YouTube व्हिडिओ लिंक (URL) *'
                            : 'YouTube Video Link *'
                          : lang === 'mr'
                          ? 'थेट व्हिडिओ फाईल लिंक (MP4/WebM) *'
                          : 'Direct Video URL (MP4/WebM) *'}
                      </label>
                      <input
                        type="url"
                        required
                        value={ytUrl}
                        onChange={(e) => handleVideoUrlChange(e.target.value)}
                        placeholder={
                          videoSourceType === 'youtube'
                            ? 'https://www.youtube.com/watch?v=VIDEO_ID'
                            : 'https://example.com/videos/community-event.mp4'
                        }
                        className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border rounded-xl focus:bg-white focus:outline-hidden ${
                          videoUrlError
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#D8CEBE] focus:border-[#244A3A]'
                        }`}
                      />
                      <p className="text-[11px] text-[#6E7B73] mt-1">
                        {videoSourceType === 'youtube'
                          ? lang === 'mr'
                            ? 'मानक watch, youtu.be, embed किंवा shorts लिंक्स समर्थित आहेत.'
                            : 'Supports standard watch, youtu.be, embed, and shorts links.'
                          : lang === 'mr'
                          ? 'थेट .mp4, .webm, .mov किंवा .m4v फाईलची थेट HTTPS लिंक टाका.'
                          : 'Enter a direct HTTPS link ending with .mp4, .webm, .mov, or .m4v.'}
                      </p>
                      {videoUrlError && (
                        <div className="text-[11px] text-[#8F3426] flex items-center gap-1 mt-1 font-semibold">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{videoUrlError}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'विभाग (Category) *' : 'Category *'}
                      </label>
                      <select
                        value={vidCategory}
                        onChange={(e) => setVidCategory(e.target.value as CategoryKey)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat, lang)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Bilingual Titles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'व्हिडिओ शीर्षक (मराठी) *' : 'Video Title (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={vidTitle}
                        onChange={(e) => setVidTitle(e.target.value)}
                        placeholder={lang === 'mr' ? 'उदा. CSC बाल विद्यालय उपक्रम व्हिडिओ' : 'Enter Marathi title'}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'व्हिडिओ शीर्षक (इंग्रजी / English)' : 'Video Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={vidTitleEn}
                        onChange={(e) => setVidTitleEn(e.target.value)}
                        placeholder="e.g. CSC Bal Vidyalaya Joyful Learning Documentary"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Descriptions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'व्हिडिओ माहिती (मराठी)' : 'Description (Marathi)'}
                      </label>
                      <textarea
                        rows={2}
                        value={vidDesc}
                        onChange={(e) => setVidDesc(e.target.value)}
                        placeholder={lang === 'mr' ? 'व्हिडिओविषयी संक्षिप्त मराठी माहिती...' : 'Short Marathi description...'}
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'व्हिडिओ माहिती (इंग्रजी / English)' : 'Description (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={vidDescEn}
                        onChange={(e) => setVidDescEn(e.target.value)}
                        placeholder="Short English description..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Cover Image Upload for Video */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#244A3A]">
                      {lang === 'mr'
                        ? 'व्हिडिओ कव्हर फोटो (Cover Image)'
                        : 'Video Cover Image (Upload File or URL)'}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0] rounded-xl text-xs font-bold cursor-pointer hover:bg-[#d8e8dc] shrink-0">
                        <Upload className="w-4 h-4" />
                        <span>{lang === 'mr' ? 'कव्हर फोटो निवडा' : 'Upload Cover Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const dataUrl = await readAndCompressImage(file);
                              setVidCoverUrl(dataUrl);
                            }
                          }}
                        />
                      </label>
                      <input
                        type="text"
                        value={vidCoverUrl}
                        onChange={(e) => setVidCoverUrl(e.target.value)}
                        placeholder={lang === 'mr' ? 'किंवा कव्हर फोटो URL टाका' : 'Or paste cover image URL'}
                        className="w-full px-3.5 py-2 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    {(vidCoverUrl || (isYouTubeUrl(ytUrl) && getYouTubeThumbnail(ytUrl))) && (
                      <div className="flex items-center gap-3 pt-1">
                        <img
                          src={vidCoverUrl || (isYouTubeUrl(ytUrl) ? getYouTubeThumbnail(ytUrl) || '' : '')}
                          alt="Video cover preview"
                          className="w-28 h-16 object-cover rounded-lg border border-[#D8CEBE]"
                        />
                        {vidCoverUrl && (
                          <button
                            type="button"
                            onClick={() => setVidCoverUrl('')}
                            className="text-xs text-[#8F3426] underline cursor-pointer"
                          >
                            {lang === 'mr' ? 'कव्हर फोटो काढा' : 'Clear Cover'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#244A3A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vidFeatured}
                        onChange={(e) => setVidFeatured(e.target.checked)}
                        className="rounded text-[#244A3A]"
                      />
                      <span>
                        {lang === 'mr'
                          ? 'मुख्यपृष्ठावर (Homepage) प्रमुख व्हिडिओ म्हणून दाखवा'
                          : 'Feature this video on the Homepage'}
                      </span>
                    </label>

                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#244A3A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={vidPublished}
                        onChange={(e) => setVidPublished(e.target.checked)}
                        className="rounded text-[#244A3A]"
                      />
                      <span>
                        {lang === 'mr'
                          ? 'वेबसाईटवर प्रकाशित करा (Publish on website)'
                          : 'Publish on website'}
                      </span>
                    </label>
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={isSavingVideo}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#244A3A] hover:bg-[#183328] disabled:opacity-60 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSavingVideo ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#B58A4A]" />
                      )}
                      <span>
                        {isSavingVideo
                          ? lang === 'mr'
                            ? 'जतन करत आहे...'
                            : 'Saving...'
                          : editingVideoId
                          ? lang === 'mr'
                            ? 'व्हिडिओ अद्ययावत करा (Update Video)'
                            : 'Update Video'
                          : lang === 'mr'
                          ? 'व्हिडिओ जतन करा'
                          : 'Save Video'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Existing Videos List */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <h3 className="text-base font-serif font-bold text-[#244A3A]">
                  {lang === 'mr'
                    ? `वेबसाईटवरील व्हिडिओ (${state.videos.length})`
                    : `Published Videos (${state.videos.length})`}
                </h3>

                <div className="space-y-3">
                  {state.videos.map((v) => {
                    const isYt = isYouTubeUrl(v.videoUrl);
                    const thumb =
                      v.thumbnailUrl ||
                      (isYt ? getYouTubeThumbnail(v.videoUrl) : null) ||
                      'https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=640&q=75';
                    return (
                      <div
                        key={v.id}
                        className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={thumb}
                            alt={v.title}
                            className="w-24 h-14 object-cover rounded-lg border border-[#D8CEBE] shrink-0 bg-black"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-sm text-[#244A3A] truncate">
                                {v.title}
                              </h4>
                              {isYt ? (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-md font-semibold shrink-0">
                                  <Video className="w-2.5 h-2.5" />
                                  <span>YouTube</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md font-semibold shrink-0">
                                  <Film className="w-2.5 h-2.5" />
                                  <span>MP4 / Direct</span>
                                </span>
                              )}
                            </div>
                            {v.titleEn && v.titleEn !== v.title && (
                              <p className="text-xs text-[#6E7B73] truncate">{v.titleEn}</p>
                            )}
                            <div className="flex items-center gap-2 text-[11px] text-[#B58A4A] font-semibold flex-wrap">
                              <span>{getCategoryLabel(v.category, lang)}</span>
                              {v.published === false ? (
                                <span className="text-[#8F3426] bg-[#FBECE9] px-1.5 py-0.5 rounded text-[10px] font-semibold border border-red-200">
                                  {lang === 'mr' ? 'अप्रकाशित (Draft)' : 'Draft / Unpublished'}
                                </span>
                              ) : (
                                <span className="text-[#244A3A] bg-[#EAF2EC] px-1.5 py-0.5 rounded text-[10px] font-semibold border border-[#C5DDD0]">
                                  {lang === 'mr' ? 'प्रकाशित (Published)' : 'Published'}
                                </span>
                              )}
                              {v.featured && (
                                <span className="text-[#244A3A] bg-[#EAF2EC] px-1.5 py-0.2 rounded text-[10px]">
                                  {lang === 'mr' ? 'प्रमुख (Featured)' : 'Featured'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DACB]/60 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => setPreviewVideo(v)}
                            className="px-3 py-1.5 bg-[#244A3A] text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 cursor-pointer hover:bg-[#183328] transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current text-[#B58A4A]" />
                            <span>{lang === 'mr' ? 'प्ले करा' : 'Play'}</span>
                          </button>
                          <button
                            disabled={isTogglingPublishVideoId === v.id}
                            onClick={async () => {
                              const newPub = v.published === false ? true : false;
                              setIsTogglingPublishVideoId(v.id);
                              try {
                                const res = await updateVideoItem(v.id, { published: newPub });
                                if (res.success) {
                                  showToast(
                                    newPub
                                      ? (lang === 'mr' ? 'व्हिडिओ प्रकाशित केला!' : 'Video published!')
                                      : (lang === 'mr' ? 'व्हिडिओ अप्रकाशित केला.' : 'Video unpublished.')
                                  );
                                } else {
                                  showToast(res.error || (lang === 'mr' ? 'अद्ययावत करण्यात त्रुटी आली.' : 'Failed to update publication status.'));
                                }
                              } finally {
                                setIsTogglingPublishVideoId(null);
                              }
                            }}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg border border-transparent hover:border-[#D8CEBE] cursor-pointer disabled:opacity-50"
                            title={
                              v.published === false
                                ? (lang === 'mr' ? 'प्रकाशित करा (Publish)' : 'Publish')
                                : (lang === 'mr' ? 'अप्रकाशित करा (Unpublish)' : 'Unpublish')
                            }
                          >
                            {isTogglingPublishVideoId === v.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                            ) : v.published === false ? (
                              <EyeOff className="w-4 h-4 text-amber-700" />
                            ) : (
                              <Eye className="w-4 h-4 text-emerald-700" />
                            )}
                          </button>
                          <button
                            onClick={() => startEditVideo(v)}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg border border-transparent hover:border-[#D8CEBE] cursor-pointer"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            disabled={isDeletingVideoId === v.id}
                            onClick={async () => {
                              const confirmMsg =
                                lang === 'mr'
                                  ? `"${v.title}" हा व्हिडिओ कायमस्वरूपी हटवायचा आहे का?`
                                  : `Are you sure you want to delete video "${v.titleEn || v.title}"?`;
                              if (window.confirm(confirmMsg)) {
                                setIsDeletingVideoId(v.id);
                                try {
                                  const res = await deleteVideoItem(v.id);
                                  if (res.success) {
                                    showToast(lang === 'mr' ? 'व्हिडिओ यशस्वीरित्या हटवला.' : 'Video deleted successfully.');
                                  } else {
                                    showToast(res.error || (lang === 'mr' ? 'व्हिडिओ हटवता आला नाही.' : 'Failed to delete video.'));
                                  }
                                } finally {
                                  setIsDeletingVideoId(null);
                                }
                              }
                            }}
                            className="p-2 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            title={lang === 'mr' ? 'हटवा (Delete)' : 'Delete'}
                          >
                            {isDeletingVideoId === v.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 4: PHOTO GALLERY & HOMEPAGE KEY PICTURES (Albums, Multi-Upload, Carousel/Grid, CRUD)
          ================================================================ */}
          {activeTab === 'gallery' && (
            <div className="space-y-8">
              {/* --- ALBUM MANAGEMENT MODAL --- */}
              {showAlbumModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                  <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-5 border border-[#E2DACB] shadow-2xl max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between pb-3 border-b border-[#E2DACB]">
                      <div className="flex items-center gap-2.5">
                        <FolderPlus className="w-5 h-5 text-[#244A3A]" />
                        <h3 className="text-lg font-serif font-bold text-[#244A3A]">
                          {editingAlbumId
                            ? lang === 'mr'
                              ? 'अल्बम संपादित करा (Edit Album)'
                              : 'Edit Album'
                            : lang === 'mr'
                            ? 'नवीन अल्बम तयार करा (Create Album)'
                            : 'Create New Album'}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAlbumModal(false);
                          resetAlbumForm();
                        }}
                        className="p-1 text-stone-500 hover:text-stone-800 rounded-lg cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveAlbum} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#244A3A] mb-1">
                            {lang === 'mr' ? 'अल्बम नाव (मराठी) *' : 'Album Title (Marathi) *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={albumTitle}
                            onChange={(e) => setAlbumTitle(e.target.value)}
                            placeholder="उदा. शिक्षण व बाल विकास"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#244A3A] mb-1">
                            {lang === 'mr' ? 'अल्बम नाव (English)' : 'Album Title (English)'}
                          </label>
                          <input
                            type="text"
                            value={albumTitleEn}
                            onChange={(e) => setAlbumTitleEn(e.target.value)}
                            placeholder="e.g. Education & Child Development"
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#244A3A] mb-1">
                            {lang === 'mr' ? 'वर्गवारी (Category)' : 'Category'}
                          </label>
                          <select
                            value={albumCategory}
                            onChange={(e) => setAlbumCategory(e.target.value as CategoryKey)}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {getCategoryLabel(cat, lang)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#244A3A] mb-1">
                            {lang === 'mr' ? 'तारीख (Event Date)' : 'Event Date'}
                          </label>
                          <input
                            type="date"
                            value={albumEventDate}
                            onChange={(e) => setAlbumEventDate(e.target.value)}
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Display Mode Selection: Grid vs Carousel */}
                      <div className="p-3.5 bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl space-y-2">
                        <label className="block text-xs font-bold text-[#244A3A]">
                          {lang === 'mr'
                            ? 'वेबसाईटवर अल्बमचा डिस्प्ले प्रकार (Display Mode) *'
                            : 'Album Display Mode on Public Website *'}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          <label
                            className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                              albumDisplayMode === 'grid'
                                ? 'bg-white border-[#244A3A] ring-2 ring-[#244A3A]/20'
                                : 'bg-transparent border-[#D8CEBE] hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="albumDisplayMode"
                              value="grid"
                              checked={albumDisplayMode === 'grid'}
                              onChange={() => setAlbumDisplayMode('grid')}
                              className="text-[#244A3A]"
                            />
                            <div className="flex items-center gap-2 text-xs font-bold text-[#244A3A]">
                              <Grid className="w-4 h-4 text-[#B58A4A]" />
                              <span>{lang === 'mr' ? 'ग्रिड मांडणी (Grid View)' : 'Grid View (Columns)'}</span>
                            </div>
                          </label>

                          <label
                            className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-colors ${
                              albumDisplayMode === 'carousel'
                                ? 'bg-white border-[#244A3A] ring-2 ring-[#244A3A]/20'
                                : 'bg-transparent border-[#D8CEBE] hover:bg-white'
                            }`}
                          >
                            <input
                              type="radio"
                              name="albumDisplayMode"
                              value="carousel"
                              checked={albumDisplayMode === 'carousel'}
                              onChange={() => setAlbumDisplayMode('carousel')}
                              className="text-[#244A3A]"
                            />
                            <div className="flex items-center gap-2 text-xs font-bold text-[#244A3A]">
                              <Sliders className="w-4 h-4 text-[#B58A4A]" />
                              <span>{lang === 'mr' ? 'कॅरोसेल स्लायडर (Carousel)' : 'Carousel Slider'}</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#244A3A] mb-1">
                            {lang === 'mr' ? 'वर्णन (मराठी)' : 'Description (Marathi)'}
                          </label>
                          <textarea
                            rows={2}
                            value={albumDesc}
                            onChange={(e) => setAlbumDesc(e.target.value)}
                            placeholder="अल्बमविषयी थोडक्यात माहिती..."
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-[#244A3A] mb-1">
                            {lang === 'mr' ? 'वर्णन (English)' : 'Description (English)'}
                          </label>
                          <textarea
                            rows={2}
                            value={albumDescEn}
                            onChange={(e) => setAlbumDescEn(e.target.value)}
                            placeholder="Short description of album..."
                            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Cover Image Upload / URL */}
                      <div>
                        <label className="block text-xs font-bold text-[#244A3A] mb-1">
                          {lang === 'mr' ? 'अल्बम कव्हर फोटो (Cover Photo)' : 'Album Cover Photo'}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0] rounded-xl text-xs font-bold cursor-pointer hover:bg-[#d8e8dc] shrink-0">
                            {isUploadingAlbumCover ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Upload className="w-4 h-4" />
                            )}
                            <span>{lang === 'mr' ? 'कव्हर फोटो निवडा' : 'Upload Cover'}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={handleAlbumCoverSelect}
                              disabled={isUploadingAlbumCover}
                            />
                          </label>
                          <input
                            type="text"
                            value={albumCoverUrl}
                            onChange={(e) => setAlbumCoverUrl(e.target.value)}
                            placeholder="किंवा कव्हर फोटो URL (https://...)"
                            className="w-full px-3.5 py-2 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                          />
                        </div>
                        {albumCoverUploadProgress > 0 && isUploadingAlbumCover && (
                          <div className="w-full bg-[#E2DACB] rounded-full h-1.5 mt-2 overflow-hidden">
                            <div
                              className="bg-[#244A3A] h-1.5 transition-all duration-200"
                              style={{ width: `${albumCoverUploadProgress}%` }}
                            />
                          </div>
                        )}
                        {albumCoverUrl && (
                          <div className="mt-2 relative inline-block">
                            <img
                              src={albumCoverUrl}
                              alt="Cover Preview"
                              className="w-24 h-16 object-cover rounded-lg border border-[#D8CEBE]"
                            />
                            <button
                              type="button"
                              onClick={() => setAlbumCoverUrl('')}
                              className="absolute -top-1.5 -right-1.5 bg-[#8F3426] text-white rounded-full p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#244A3A] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={albumPublished}
                              onChange={(e) => setAlbumPublished(e.target.checked)}
                              className="rounded text-[#244A3A]"
                            />
                            <span>{lang === 'mr' ? 'प्रकाशित (Published)' : 'Published'}</span>
                          </label>
                          <div className="flex items-center gap-1.5 text-xs text-stone-600">
                            <span>{lang === 'mr' ? 'क्रम:' : 'Order:'}</span>
                            <input
                              type="number"
                              min="0"
                              value={albumDisplayOrder}
                              onChange={(e) => setAlbumDisplayOrder(Number(e.target.value) || 0)}
                              className="w-16 px-2 py-1 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-lg"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAlbumModal(false);
                              resetAlbumForm();
                            }}
                            className="px-4 py-2 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                          >
                            {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingAlbum}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {isSavingAlbum && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>
                              {editingAlbumId
                                ? lang === 'mr'
                                  ? 'अद्ययावत करा'
                                  : 'Update Album'
                                : lang === 'mr'
                                ? 'अल्बम जतन करा'
                                : 'Save Album'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* --- SECTION 1: ALBUMS SHOWCASE & SELECTION --- */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A] flex items-center gap-2">
                      <FolderPlus className="w-5 h-5 text-[#B58A4A]" />
                      <span>
                        {lang === 'mr'
                          ? `गॅलरी अल्बम्स (${state.albums?.length || 0})`
                          : `Gallery Albums (${state.albums?.length || 0})`}
                      </span>
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {lang === 'mr'
                        ? 'प्रत्येक अल्बमसाठी स्वतंत्र ग्रिड किंवा स्लायडर/कॅरोसेल डिस्प्ले प्रकार निवडू शकता.'
                        : 'Choose independent Grid or Carousel display mode for each album.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      resetAlbumForm();
                      setShowAlbumModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4 text-[#B58A4A]" />
                    <span>{lang === 'mr' ? 'नवीन अल्बम तयार करा' : 'Create New Album'}</span>
                  </button>
                </div>

                {/* Albums Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
                  {(state.albums || []).map((alb) => {
                    const albumPhotoCount = state.gallery.filter((g) => g.albumId === alb.id).length;
                    const isSelected = photoAlbumId === alb.id;

                    return (
                      <div
                        key={alb.id}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#F2F7F4] border-[#244A3A] shadow-xs'
                            : 'bg-[#FAF8F3] border-[#E2DACB] hover:border-[#244A3A]/40'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            {alb.coverImageUrl ? (
                              <img
                                src={alb.coverImageUrl}
                                alt={alb.title}
                                className="w-14 h-12 object-cover rounded-lg border border-[#D8CEBE]"
                              />
                            ) : (
                              <div className="w-14 h-12 rounded-lg bg-[#EAE3D2] flex items-center justify-center text-[#244A3A]">
                                <ImageIcon className="w-6 h-6" />
                              </div>
                            )}

                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                alb.displayMode === 'carousel'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {alb.displayMode === 'carousel' ? (
                                <>
                                  <Sliders className="w-2.5 h-2.5" />
                                  <span>{lang === 'mr' ? 'स्लायडर' : 'Carousel'}</span>
                                </>
                              ) : (
                                <>
                                  <Grid className="w-2.5 h-2.5" />
                                  <span>{lang === 'mr' ? 'ग्रिड' : 'Grid'}</span>
                                </>
                              )}
                            </span>
                          </div>

                          <div>
                            <h4 className="font-serif font-bold text-xs text-[#244A3A] line-clamp-1">
                              {lang === 'mr' ? alb.title : alb.titleEn || alb.title}
                            </h4>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                              <span>{albumPhotoCount} {lang === 'mr' ? 'फोटो' : 'photos'}</span>
                              <span>•</span>
                              <span>{getCategoryLabel(alb.category as CategoryKey, lang)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-2 border-t border-[#E2DACB]/60">
                          <button
                            type="button"
                            onClick={() => {
                              setPhotoAlbumId(alb.id);
                              setSelectedAlbumFilter(alb.id);
                            }}
                            className={`text-[11px] font-bold cursor-pointer ${
                              isSelected ? 'text-[#244A3A] underline' : 'text-stone-600 hover:text-[#244A3A]'
                            }`}
                          >
                            {isSelected ? (lang === 'mr' ? 'निवडला आहे' : 'Selected') : (lang === 'mr' ? 'निवडा' : 'Select')}
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditAlbum(alb)}
                              className="p-1 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer"
                              title="Edit Album"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isDeletingAlbumId === alb.id}
                              onClick={() => handleDeleteAlbum(alb.id)}
                              className="p-1 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-50"
                              title="Delete Album"
                            >
                              {isDeletingAlbumId === alb.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* --- SECTION 2: PHOTO UPLOAD FORM (Multi-Photo Server Upload + Batch DB) --- */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                      {editingPhotoId
                        ? lang === 'mr'
                          ? 'छायाचित्र संपादित करा (Edit Photo)'
                          : 'Edit Photo'
                        : lang === 'mr'
                        ? 'छायाचित्रे जोडा (एक किंवा अनेक फोटो सर्व्हरवर अपलोड करा)'
                        : 'Upload Photos (Single or Batch Upload to Server)'}
                    </h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                      {lang === 'mr'
                        ? 'फोटो थेट सर्व्हर डिस्कवर अपलोड होतात आणि कायमस्वरूपी पाथ MySQL मध्ये सुरक्षित राहतात.'
                        : 'Photos are stored permanently on the server disk and indexed in MySQL.'}
                    </p>
                  </div>
                  {editingPhotoId && (
                    <button
                      type="button"
                      onClick={resetPhotoForm}
                      className="text-xs font-semibold text-[#8F3426] underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'रद्द करा' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSavePhoto} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Target Album Selection */}
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अल्बम निवडा (Target Album)' : 'Target Album'}
                      </label>
                      <select
                        value={photoAlbumId}
                        onChange={(e) => setPhotoAlbumId(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl font-medium"
                      >
                        <option value="">{lang === 'mr' ? '-- कोणताही अल्बम नाही (General) --' : '-- General Gallery (No Album) --'}</option>
                        {(state.albums || []).map((alb) => (
                          <option key={alb.id} value={alb.id}>
                            {lang === 'mr' ? alb.title : alb.titleEn || alb.title} ({alb.displayMode})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Photo Title Marathi */}
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'छायाचित्र नाव (मराठी) *' : 'Photo Title (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        value={photoTitle}
                        onChange={(e) => setPhotoTitle(e.target.value)}
                        placeholder={lang === 'mr' ? 'उदा. वृक्षारोपण मोहीम' : 'Enter photo title'}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      />
                    </div>

                    {/* Photo Title English */}
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'छायाचित्र नाव (English)' : 'Photo Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={photoTitleEn}
                        onChange={(e) => setPhotoTitleEn(e.target.value)}
                        placeholder="e.g. Tree Plantation Drive"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'विभाग (Category)' : 'Category'}
                      </label>
                      <select
                        value={photoCategory}
                        onChange={(e) => setPhotoCategory(e.target.value as CategoryKey)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat, lang)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त वर्णन (Caption Marathi)' : 'Caption (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={photoCaption}
                        onChange={(e) => setPhotoCaption(e.target.value)}
                        placeholder="उदा. मान्यवरांच्या हस्ते वृक्षारोपण..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'वर्णन (Caption English)' : 'Caption (English)'}
                      </label>
                      <input
                        type="text"
                        value={photoCaptionEn}
                        onChange={(e) => setPhotoCaptionEn(e.target.value)}
                        placeholder="Short caption in English..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Multi-Photo Server Upload Area */}
                  <div className="space-y-3 p-4 bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl">
                    <label className="block text-xs font-bold text-[#244A3A]">
                      {editingPhotoId
                        ? lang === 'mr'
                          ? 'छायाचित्र बदला (फाइल निवडा किंवा URL टाका) *'
                          : 'Change Photo (Select File or URL) *'
                        : lang === 'mr'
                        ? 'सर्व्हरवर फोटो अपलोड करा (एकाच वेळी अनेक फोटो निवडू शकता) *'
                        : 'Upload Photo(s) to Server Disk (Multiple Supported) *'}
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <label className="inline-flex items-center gap-2 px-5 py-3 bg-[#244A3A] hover:bg-[#183328] text-white rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors shadow-xs shrink-0">
                        {isUploadingGallery ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#B58A4A]" />
                        )}
                        <span>
                          {editingPhotoId
                            ? lang === 'mr'
                              ? 'नवीन फोटो फाइल निवडा'
                              : 'Select New Photo'
                            : lang === 'mr'
                            ? 'संगणकावरून फोटो निवडा (Multiple)'
                            : 'Choose Photo(s) to Upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple={!editingPhotoId}
                          className="hidden"
                          disabled={isUploadingGallery}
                          onChange={(e) => handleMultiPhotoFileSelect(e.target.files)}
                        />
                      </label>

                      <input
                        type="text"
                        value={photoUrl}
                        onChange={(e) => setPhotoUrl(e.target.value)}
                        placeholder="किंवा थेट सर्व्हर/वेब फोटो URL टाका (https://...)"
                        className="w-full px-3.5 py-2.5 text-xs bg-white border border-[#D8CEBE] rounded-xl"
                      />
                    </div>

                    {/* Upload Progress Bar */}
                    {isUploadingGallery && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xs font-bold text-[#244A3A]">
                          <span>{lang === 'mr' ? 'सर्व्हरवर फोटो अपलोड होत आहेत...' : 'Uploading photos to server...'}</span>
                          <span>{galleryUploadProgress}%</span>
                        </div>
                        <div className="w-full bg-[#E2DACB] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#244A3A] h-2 transition-all duration-300"
                            style={{ width: `${galleryUploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload Error Banner */}
                    {galleryUploadError && (
                      <div className="p-3 bg-[#FBECE9] border border-[#E8B4AC] rounded-xl text-xs text-[#8F3426] flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{galleryUploadError}</span>
                      </div>
                    )}

                    {/* Staged Uploaded Photos Preview Grid */}
                    {stagedUploads.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>
                              {lang === 'mr'
                                ? `${stagedUploads.length} फोटो सर्व्हरवर यशस्वीरित्या सेव्ह झाले (डेटाबेस नोंदणीसाठी तयार)`
                                : `${stagedUploads.length} photo(s) uploaded to server disk (Ready to save)`}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setStagedUploads([])}
                            className="text-xs text-[#8F3426] underline font-semibold cursor-pointer"
                          >
                            {lang === 'mr' ? 'सर्व काढा' : 'Clear all'}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {stagedUploads.map((item, idx) => (
                            <div
                              key={idx}
                              className="relative p-2 bg-white rounded-xl border border-[#D8CEBE] shadow-xs space-y-1.5"
                            >
                              <div className="relative">
                                <img
                                  src={item.url}
                                  alt={item.title}
                                  className="w-full h-24 object-cover rounded-lg border border-[#E2DACB]"
                                />
                                <button
                                  type="button"
                                  onClick={() => setStagedUploads((prev) => prev.filter((_, i) => i !== idx))}
                                  className="absolute -top-1.5 -right-1.5 bg-[#8F3426] text-white rounded-full p-1 shadow-xs hover:bg-red-700 cursor-pointer"
                                  title="Remove"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setStagedUploads((prev) =>
                                    prev.map((p, i) => (i === idx ? { ...p, title: val, titleEn: val } : p))
                                  );
                                }}
                                placeholder="Photo title"
                                className="w-full px-2 py-1 text-[11px] bg-[#FAF8F3] border border-[#D8CEBE] rounded-md"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Single Photo Preview when editing */}
                    {editingPhotoId && photoUrl && (
                      <div className="pt-2">
                        <span className="text-xs font-bold text-[#244A3A] block mb-1">
                          {lang === 'mr' ? 'सध्याचा फोटो पूर्वावलोकन:' : 'Current Photo Preview:'}
                        </span>
                        <img
                          src={photoUrl}
                          alt="Preview"
                          className="w-40 h-28 object-cover rounded-xl border border-[#D8CEBE]"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <div className="flex flex-wrap items-center gap-5">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#244A3A] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={photoFeaturedHome}
                          onChange={(e) => setPhotoFeaturedHome(e.target.checked)}
                          className="rounded text-[#244A3A]"
                        />
                        <span>
                          {lang === 'mr'
                            ? 'मुख्यपृष्ठावर प्रमुख छायाचित्रे (Homepage Showcase) मध्ये दाखवा'
                            : 'Showcase in Homepage Key Pictures'}
                        </span>
                      </label>

                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#244A3A] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={photoPublished}
                          onChange={(e) => setPhotoPublished(e.target.checked)}
                          className="rounded text-[#244A3A]"
                        />
                        <span>{lang === 'mr' ? 'प्रकाशित (Published)' : 'Published'}</span>
                      </label>

                      <div className="flex items-center gap-1.5 text-xs text-stone-600">
                        <span>{lang === 'mr' ? 'क्रम:' : 'Order:'}</span>
                        <input
                          type="number"
                          min="0"
                          value={photoDisplayOrder}
                          onChange={(e) => setPhotoDisplayOrder(Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-lg"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingPhoto}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSavingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                      ) : (
                        <Plus className="w-4 h-4 text-[#B58A4A]" />
                      )}
                      <span>
                        {editingPhotoId
                          ? lang === 'mr'
                            ? 'छायाचित्र अद्ययावत करा (Update)'
                            : 'Update Photo'
                          : stagedUploads.length > 1
                          ? lang === 'mr'
                            ? `${stagedUploads.length} छायाचित्रे जतन करा (Save All)`
                            : `Save ${stagedUploads.length} Photos`
                          : lang === 'mr'
                          ? 'छायाचित्र जतन करा'
                          : 'Save Photo'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>

              {/* --- SECTION 3: PUBLISHED PHOTOS GALLERY WITH ALBUM FILTER --- */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base font-serif font-bold text-[#244A3A]">
                    {lang === 'mr'
                      ? `वेबसाईटवरील छायाचित्रे (${state.gallery.length})`
                      : `Website Photos (${state.gallery.length})`}
                  </h3>

                  {/* Album Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedAlbumFilter('all')}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                        selectedAlbumFilter === 'all'
                          ? 'bg-[#244A3A] text-white'
                          : 'bg-[#FAF8F3] text-stone-700 hover:bg-[#eae3d2]'
                      }`}
                    >
                      {lang === 'mr' ? 'सर्व' : 'All'} ({state.gallery.length})
                    </button>

                    {(state.albums || []).map((alb) => {
                      const count = state.gallery.filter((g) => g.albumId === alb.id).length;
                      return (
                        <button
                          key={alb.id}
                          type="button"
                          onClick={() => setSelectedAlbumFilter(alb.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                            selectedAlbumFilter === alb.id
                              ? 'bg-[#244A3A] text-white'
                              : 'bg-[#FAF8F3] text-stone-700 hover:bg-[#eae3d2]'
                          }`}
                        >
                          {lang === 'mr' ? alb.title : alb.titleEn || alb.title} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Photos Grid */}
                {(() => {
                  const filteredPhotos =
                    selectedAlbumFilter === 'all'
                      ? state.gallery
                      : state.gallery.filter((g) => g.albumId === selectedAlbumFilter);

                  if (filteredPhotos.length === 0) {
                    return (
                      <div className="text-center py-12 text-stone-500 bg-[#FAF8F3] rounded-2xl border border-dashed border-[#D8CEBE]">
                        <ImageIcon className="w-10 h-10 mx-auto mb-2 text-stone-400" />
                        <p className="text-sm font-semibold">
                          {lang === 'mr' ? 'या अल्बममध्ये अजून कोणतेही छायाचित्र नाही.' : 'No photos in this album yet.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {filteredPhotos.map((g) => {
                        const album = (state.albums || []).find((a) => a.id === g.albumId);

                        return (
                          <div
                            key={g.id}
                            className="bg-[#FAF8F3] rounded-xl border border-[#E2DACB] overflow-hidden flex flex-col justify-between hover:shadow-xs transition-shadow"
                          >
                            <div className="relative">
                              <img src={g.imageUrl} alt={g.title} className="w-full h-40 object-cover" />
                              {album && (
                                <span className="absolute top-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {lang === 'mr' ? album.title : album.titleEn || album.title}
                                </span>
                              )}
                              {g.published === false && (
                                <span className="absolute top-2 right-2 bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                                  {lang === 'mr' ? 'ड्राफ्ट' : 'Draft'}
                                </span>
                              )}
                            </div>

                            <div className="p-3.5 space-y-2">
                              <div>
                                <h4 className="font-serif font-bold text-xs text-[#244A3A] line-clamp-1">
                                  {lang === 'mr' ? g.title : g.titleEn || g.title}
                                </h4>
                                {g.caption && (
                                  <p className="text-[11px] text-stone-600 line-clamp-1 mt-0.5">
                                    {lang === 'mr' ? g.caption : g.captionEn || g.caption}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-[#E2DACB]/60">
                                <span className="text-[#B58A4A] font-semibold">
                                  {g.featuredOnHome !== false
                                    ? lang === 'mr'
                                      ? '★ मुख्यपृष्ठ'
                                      : '★ Home'
                                    : getCategoryLabel(g.category, lang)}
                                </span>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    disabled={isTogglingPublishPhotoId === g.id}
                                    onClick={() => handleTogglePublishPhoto(g)}
                                    className="p-1.5 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer disabled:opacity-50"
                                    title={
                                      g.published === false
                                        ? (lang === 'mr' ? 'प्रकाशित करा' : 'Publish')
                                        : (lang === 'mr' ? 'ड्राफ्ट करा' : 'Set to draft')
                                    }
                                  >
                                    {isTogglingPublishPhotoId === g.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : g.published === false ? (
                                      <EyeOff className="w-3.5 h-3.5 text-amber-700" />
                                    ) : (
                                      <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => startEditPhoto(g)}
                                    className="p-1.5 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer"
                                    title="Edit"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isDeletingPhotoId === g.id}
                                    onClick={() => handleDeletePhoto(g.id)}
                                    className="p-1.5 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-50"
                                    title="Delete"
                                  >
                                    {isDeletingPhotoId === g.id ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 5: INITIATIVES (Add, Edit/Update, Delete, Bilingual, Reports FK, Photos)
          ================================================================ */}
          {activeTab === 'initiatives' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                    {editingInitId
                      ? lang === 'mr'
                        ? 'उपक्रम संपादित करा (Edit Initiative)'
                        : 'Edit Initiative'
                      : lang === 'mr'
                      ? 'नवीन उपक्रम जोडा'
                      : 'Add New Initiative'}
                  </h2>
                  {editingInitId && (
                    <button
                      type="button"
                      onClick={resetInitForm}
                      className="text-xs font-semibold text-[#8F3426] underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'रद्द करा' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveInitiative} className="space-y-4">
                  {/* Bilingual Title Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'उपक्रमाचे नाव (मराठी) *' : 'Initiative Title (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={initTitle}
                        onChange={(e) => setInitTitle(e.target.value)}
                        placeholder="उदा. मोफत आरोग्य व नेत्रतपासणी शिबीर"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'उपक्रमाचे नाव (इंग्रजी / English)' : 'Initiative Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={initTitleEn}
                        onChange={(e) => setInitTitleEn(e.target.value)}
                        placeholder="e.g. Free Health & Eye Checkup Camp"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Category & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'विभाग (Category) *' : 'Category *'}
                      </label>
                      <select
                        value={initCategory}
                        onChange={(e) => setInitCategory(e.target.value as CategoryKey)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat, lang)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'दिनांक (Date)' : 'Date'}
                      </label>
                      <input
                        type="text"
                        value={initDate}
                        onChange={(e) => setInitDate(e.target.value)}
                        placeholder="उदा. २०२५-०३-०१ किंवा 2025-03-01"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Locations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'ठिकाण (मराठी)' : 'Location (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={initLocation}
                        onChange={(e) => setInitLocation(e.target.value)}
                        placeholder="नादरपूर, ता. कन्नड"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'ठिकाण (इंग्रजी)' : 'Location (English)'}
                      </label>
                      <input
                        type="text"
                        value={initLocationEn}
                        onChange={(e) => setInitLocationEn(e.target.value)}
                        placeholder="Nadarpur, Tal. Kannad"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Cover Image + Multiple Images Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB]">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#244A3A]">
                        {lang === 'mr' ? '१. मुख्य कव्हर फोटो (Cover Image)' : '1. Cover Image'}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#244A3A] text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? 'कव्हर निवडा' : 'Upload Cover'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dataUrl = await readAndCompressImage(file);
                                setInitImageUrl(dataUrl);
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={initImageUrl}
                          onChange={(e) => setInitImageUrl(e.target.value)}
                          placeholder="किंवा URL (https://...)"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D8CEBE] rounded-lg"
                        />
                      </div>
                      {initImageUrl && (
                        <img
                          src={initImageUrl}
                          alt="Cover"
                          className="w-24 h-16 object-cover rounded-lg border border-[#D8CEBE]"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#244A3A]">
                        {lang === 'mr'
                          ? '२. स्लाईडसाठी इतर अनेक फोटो जोडा (Multiple Slide Photos)'
                          : '2. Additional Slide Photos (Multiple)'}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0] rounded-lg text-xs font-bold cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? 'अनेक फोटो निवडा' : 'Select Multiple Photos'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;
                              const urls = await Promise.all(files.map(readAndCompressImage));
                              setInitExtraImages((prev) => [...prev, ...urls]);
                            }}
                          />
                        </label>
                        <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                          <input
                            type="text"
                            value={initExtraUrlInput}
                            onChange={(e) => setInitExtraUrlInput(e.target.value)}
                            placeholder={lang === 'mr' ? 'किंवा फोटो URL टाका...' : 'Or paste photo URL...'}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D8CEBE] rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (initExtraUrlInput.trim()) {
                                setInitExtraImages((prev) => [...prev, initExtraUrlInput.trim()]);
                                setInitExtraUrlInput('');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-[#244A3A] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {initExtraImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {initExtraImages.map((u, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={u}
                                alt=""
                                className="w-16 h-12 object-cover rounded-md border border-[#D8CEBE]"
                              />
                              <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
                                #{idx + 2}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setInitExtraImages((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="absolute -top-1 -right-1 bg-[#8F3426] text-white rounded-full p-0.5 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bilingual Summary Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त माहिती (मराठी) *' : 'Short Summary (Marathi) *'}
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={initSummary}
                        onChange={(e) => setInitSummary(e.target.value)}
                        placeholder="उपक्रमाची मुख्य माहिती..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त माहिती (इंग्रजी)' : 'Short Summary (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={initSummaryEn}
                        onChange={(e) => setInitSummaryEn(e.target.value)}
                        placeholder="Brief summary in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Full Description */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सविस्तर वर्णन (मराठी)' : 'Full Description (Marathi)'}
                      </label>
                      <textarea
                        rows={3}
                        value={initDesc}
                        onChange={(e) => setInitDesc(e.target.value)}
                        placeholder="सविस्तर माहिती, लाभार्थी, उद्दिष्टे..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सविस्तर वर्णन (इंग्रजी)' : 'Full Description (English)'}
                      </label>
                      <textarea
                        rows={3}
                        value={initDescEn}
                        onChange={(e) => setInitDescEn(e.target.value)}
                        placeholder="Detailed description, beneficiaries, objectives..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Related Report Relationship (FK to reports.id) */}
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr'
                        ? 'संबंधित वार्षिक / आर्थिक अहवाल (Related Report / Audit)'
                        : 'Related Report / Audit'}
                    </label>
                    <select
                      value={initRelatedReportId}
                      onChange={(e) => setInitRelatedReportId(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                    >
                      <option value="">
                        {lang === 'mr' ? '-- कोणताही अहवाल जोडलेला नाही (None) --' : '-- No Report Linked (None) --'}
                      </option>
                      {state.reports.map((r) => (
                        <option key={r.id} value={r.id}>
                          {lang === 'mr' ? r.title : (r.titleEn || r.title)} ({r.period})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Published & Featured Controls */}
                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="initPublishedCheck"
                        checked={initPublished}
                        onChange={(e) => setInitPublished(e.target.checked)}
                        className="rounded border-[#D8CEBE] text-[#244A3A] focus:ring-[#244A3A] w-4 h-4"
                      />
                      <label htmlFor="initPublishedCheck" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                        {lang === 'mr' ? 'वेबसाईटवर प्रकाशित करा (Publish immediately)' : 'Publish immediately on website'}
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="initFeaturedCheck"
                        checked={initFeatured}
                        onChange={(e) => setInitFeatured(e.target.checked)}
                        className="rounded border-[#D8CEBE] text-[#244A3A] focus:ring-[#244A3A] w-4 h-4"
                      />
                      <label htmlFor="initFeaturedCheck" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                        {lang === 'mr' ? 'मुख्य पृष्ठावर दर्शवा (Featured on Home)' : 'Featured on Homepage'}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingInit}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#244A3A] hover:bg-[#183328] disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    {isSavingInit ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#B58A4A]" />
                    )}
                    <span>
                      {isSavingInit
                        ? lang === 'mr'
                          ? 'जतन होत आहे...'
                          : 'Saving...'
                        : editingInitId
                        ? lang === 'mr'
                          ? 'उपक्रम अद्ययावत करा (Update)'
                          : 'Update Initiative'
                        : lang === 'mr'
                        ? 'उपक्रम जतन करा'
                        : 'Save Initiative'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Initiatives List */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-3">
                <h3 className="text-base font-serif font-bold text-[#244A3A]">
                  {lang === 'mr'
                    ? `सर्व उपक्रम (${state.initiatives.length})`
                    : `All Initiatives (${state.initiatives.length})`}
                </h3>
                {state.initiatives.length === 0 ? (
                  <p className="text-xs text-[#55635B] py-4 text-center">
                    {lang === 'mr' ? 'कोणताही उपक्रम उपलब्ध नाही.' : 'No initiatives found.'}
                  </p>
                ) : (
                  state.initiatives.map((item) => {
                    const slideCount = (item.imageUrl ? 1 : 0) + (item.images ? item.images.length : 0);
                    const isPublished = item.published !== false;
                    const isToggling = isTogglingPublishInitId === item.id;
                    const isDeleting = isDeletingInitId === item.id;
                    const linkedReport = item.relatedReportId
                      ? state.reports.find((r) => r.id === item.relatedReportId)
                      : null;

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl && (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-16 h-12 object-cover rounded-lg border border-[#D8CEBE] shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-sm text-[#244A3A] truncate">
                                {lang === 'mr' ? item.title : (item.titleEn || item.title)}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPublished
                                    ? 'bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0]'
                                    : 'bg-[#FBECE9] text-[#8F3426] border border-[#F0C4BC]'
                                }`}
                              >
                                {isPublished
                                  ? lang === 'mr' ? 'प्रकाशित' : 'Published'
                                  : lang === 'mr' ? 'अप्रकाशित (Draft)' : 'Draft'}
                              </span>
                              {item.featured && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF2DC] text-[#7A5B15] border border-[#ECD9A8]">
                                  {lang === 'mr' ? 'प्रमुख (Featured)' : 'Featured'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#55635B] mt-0.5 flex-wrap">
                              <span>{item.date}</span>
                              <span>•</span>
                              <span>{getCategoryLabel(item.category, lang)}</span>
                              {item.location && (
                                <>
                                  <span>•</span>
                                  <span>{lang === 'mr' ? item.location : (item.locationEn || item.location)}</span>
                                </>
                              )}
                              {slideCount > 0 && (
                                <span className="px-2 py-0.5 bg-[#EAF2EC] text-[#143B2A] font-bold rounded-full text-[10px]">
                                  {lang === 'mr' ? `${slideCount} फोटो` : `${slideCount} Photos`}
                                </span>
                              )}
                              {linkedReport && (
                                <span className="px-2 py-0.5 bg-[#F4EFE6] text-[#6B5A3E] font-medium rounded-full text-[10px] flex items-center gap-1 border border-[#E0D7C6]">
                                  <FileText className="w-2.5 h-2.5" />
                                  <span>{lang === 'mr' ? linkedReport.title : (linkedReport.titleEn || linkedReport.title)}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DACB]/60 w-full sm:w-auto justify-end">
                          {/* Publish/Unpublish Toggle */}
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={async () => {
                              setIsTogglingPublishInitId(item.id);
                              try {
                                const res = await updateInitiative(item.id, { published: !isPublished });
                                if (res.success) {
                                  showToast(
                                    isPublished
                                      ? lang === 'mr' ? 'उपक्रम अप्रकाशित (Draft) केला.' : 'Initiative unpublished.'
                                      : lang === 'mr' ? 'उपक्रम प्रकाशित केला!' : 'Initiative published!'
                                  );
                                } else {
                                  showToast(res.error || (lang === 'mr' ? 'स्थिती बदलण्यात त्रुटी आली.' : 'Failed to update status.'));
                                }
                              } catch (err: any) {
                                showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
                              } finally {
                                setIsTogglingPublishInitId(null);
                              }
                            }}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer disabled:opacity-40"
                            title={isPublished ? (lang === 'mr' ? 'अप्रकाशित करा' : 'Unpublish') : (lang === 'mr' ? 'प्रकाशित करा' : 'Publish')}
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#244A3A]" />
                            ) : isPublished ? (
                              <Eye className="w-4 h-4 text-[#244A3A]" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-[#8F3426]" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => startEditInit(item)}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer"
                            title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                              const confirmMsg =
                                lang === 'mr'
                                  ? `"${item.title}" हा उपक्रम कायमचा हटवायचा आहे का?`
                                  : `Are you sure you want to delete initiative "${item.title}"?`;
                              if (!window.confirm(confirmMsg)) return;

                              setIsDeletingInitId(item.id);
                              try {
                                const res = await deleteInitiative(item.id);
                                if (res.success) {
                                  showToast(lang === 'mr' ? 'उपक्रम यशस्वीरित्या हटवला.' : 'Initiative deleted successfully.');
                                  if (editingInitId === item.id) resetInitForm();
                                } else {
                                  showToast(res.error || (lang === 'mr' ? 'उपक्रम हटवण्यात त्रुटी आली.' : 'Failed to delete initiative.'));
                                }
                              } catch (err: any) {
                                showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
                              } finally {
                                setIsDeletingInitId(null);
                              }
                            }}
                            className="p-2 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-40"
                            title={lang === 'mr' ? 'हटवा' : 'Delete'}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#8F3426]" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 5B: EVENTS MANAGEMENT (Add, Edit/Update, Delete, Publish/Unpublish, Bilingual)
          ================================================================ */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Form Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                    {editingEventId
                      ? lang === 'mr'
                        ? 'कार्यक्रम माहिती संपादित करा (Edit Event)'
                        : 'Edit Event'
                      : lang === 'mr'
                      ? 'नवीन कार्यक्रम जोडा (Add New Event)'
                      : 'Add New Event'}
                  </h2>
                  {editingEventId && (
                    <button
                      type="button"
                      onClick={resetEventForm}
                      className="text-xs font-semibold text-[#8F3426] underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'रद्द करा' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-4">
                  {/* Bilingual Title Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कार्यक्रमाचे नाव (मराठी) *' : 'Event Title (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        placeholder="उदा. वार्षिक शेतकरी मेळावा व कृषी तंत्रज्ञान कार्यशाळा"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कार्यक्रमाचे नाव (इंग्रजी / English)' : 'Event Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={eventTitleEn}
                        onChange={(e) => setEventTitleEn(e.target.value)}
                        placeholder="e.g. Annual Farmers Meet & Agri-Tech Workshop"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Category, Status, Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'विभाग (Category)' : 'Category'}
                      </label>
                      <select
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value as CategoryKey)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat, lang)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'स्थिती (Status)' : 'Status'}
                      </label>
                      <select
                        value={eventStatus}
                        onChange={(e) => setEventStatus(e.target.value as EventStatus)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl font-medium"
                      >
                        <option value="upcoming">{lang === 'mr' ? 'आगामी (Upcoming)' : 'Upcoming'}</option>
                        <option value="ongoing">{lang === 'mr' ? 'सुरू असलेले (Ongoing)' : 'Ongoing'}</option>
                        <option value="completed">{lang === 'mr' ? 'संपन्न (Completed)' : 'Completed'}</option>
                        <option value="cancelled">{lang === 'mr' ? 'रद्द (Cancelled)' : 'Cancelled'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सुरू तारीख (Start Date) *' : 'Start Date (YYYY-MM-DD) *'}
                      </label>
                      <input
                        type="date"
                        required
                        value={eventStartDate}
                        onChange={(e) => setEventStartDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'समाप्ती तारीख (End Date)' : 'End Date (YYYY-MM-DD)'}
                      </label>
                      <input
                        type="date"
                        value={eventEndDate}
                        onChange={(e) => setEventEndDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Time & Custom Date Texts */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कार्यक्रमाची वेळ (Event Time)' : 'Event Time'}
                      </label>
                      <input
                        type="text"
                        value={eventTime}
                        onChange={(e) => setEventTime(e.target.value)}
                        placeholder="उदा. सकाळी १०:०० ते दुपारी ०२:००"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'तारीख मजकूर (मराठी)' : 'Date Text (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={eventDateTextMr}
                        onChange={(e) => setEventDateTextMr(e.target.value)}
                        placeholder="उदा. १५ व १६ एप्रिल २०२५"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'तारीख मजकूर (English)' : 'Date Text (English)'}
                      </label>
                      <input
                        type="text"
                        value={eventDateTextEn}
                        onChange={(e) => setEventDateTextEn(e.target.value)}
                        placeholder="e.g. 15 & 16 April 2025"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Venue Bilingual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'स्थळ / ठिकाण (मराठी) *' : 'Venue (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={eventVenue}
                        onChange={(e) => setEventVenue(e.target.value)}
                        placeholder="उदा. नादरपूर, ता. कन्नड, जि. छत्रपती संभाजीनगर"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'स्थळ / ठिकाण (English)' : 'Venue (English)'}
                      </label>
                      <input
                        type="text"
                        value={eventVenueEn}
                        onChange={(e) => setEventVenueEn(e.target.value)}
                        placeholder="e.g. Nadarpur, Tahsil Kannad, Dist. Chhatrapati Sambhajinagar"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Summary Bilingual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त सारांश (मराठी) *' : 'Summary (Marathi) *'}
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={eventSummary}
                        onChange={(e) => setEventSummary(e.target.value)}
                        placeholder="कार्यक्रमाचा मुख्य हेतू व ठळक वैशिष्ट्ये..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त सारांश (इंग्रजी / English)' : 'Summary (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={eventSummaryEn}
                        onChange={(e) => setEventSummaryEn(e.target.value)}
                        placeholder="Brief summary and key highlights..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Description Bilingual */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सविस्तर माहिती (मराठी)' : 'Detailed Description (Marathi)'}
                      </label>
                      <textarea
                        rows={3}
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        placeholder="कार्यक्रमाचे सविस्तर वर्णन, प्रमुख पाहुणे, उपस्थिती व रूपरेषा..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सविस्तर माहिती (इंग्रजी / English)' : 'Detailed Description (English)'}
                      </label>
                      <textarea
                        rows={3}
                        value={eventDescriptionEn}
                        onChange={(e) => setEventDescriptionEn(e.target.value)}
                        placeholder="Detailed overview, guests, itinerary, and agenda..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Cover Image */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#244A3A]">
                        {lang === 'mr' ? 'मुख्य कव्हर फोटो (Cover Image)' : 'Cover Image (URL or Upload)'}
                      </label>
                      <span className="text-[11px] text-[#55635B]">
                        {lang === 'mr' ? 'JPG, PNG, WebP (कमाल ५ MB)' : 'JPG, PNG, WebP (Max 5 MB)'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={eventCoverUrl}
                        onChange={(e) => {
                          setEventCoverUrl(e.target.value);
                          setEventCoverUploadError(null);
                        }}
                        placeholder="https://... किंवा फाइल निवडून अपलोड करा"
                        className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                      <label className={`px-4 py-2.5 bg-[#FAF8F3] hover:bg-[#EAE4D7] text-[#244A3A] border border-[#D8CEBE] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 ${
                        isUploadingEventCover ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}>
                        {isUploadingEventCover ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                        ) : (
                          <Upload className="w-4 h-4 text-[#B58A4A]" />
                        )}
                        <span>
                          {isUploadingEventCover
                            ? lang === 'mr'
                              ? `अपलोड होत आहे (${eventCoverUploadProgress}%)`
                              : `Uploading (${eventCoverUploadProgress}%)`
                            : lang === 'mr'
                            ? 'कव्हर फोटो निवडा'
                            : 'Upload Cover'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={isUploadingEventCover}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                              /\.(jpe?g|png|webp)$/i.test(file.name);
                            if (!isImage) {
                              const err = lang === 'mr' ? 'केवळ JPG, PNG किंवा WebP फॉरमॅट समर्थित आहे.' : 'Only JPG, PNG or WebP files are supported.';
                              setEventCoverUploadError(err);
                              showToast(err);
                              e.target.value = '';
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              const err = lang === 'mr' ? 'फोटो आकार ५MB पेक्षा जास्त असू नये.' : 'Image size must not exceed 5MB.';
                              setEventCoverUploadError(err);
                              showToast(err);
                              e.target.value = '';
                              return;
                            }

                            setIsUploadingEventCover(true);
                            setEventCoverUploadProgress(15);
                            setEventCoverUploadError(null);
                            try {
                              const res = await ApiClient.uploadImage(
                                file,
                                (pct) => setEventCoverUploadProgress(pct),
                                'events'
                              );
                              if (res?.url) {
                                setEventCoverUrl(res.url);
                                setEventCoverUploadProgress(100);
                                showToast(lang === 'mr' ? 'कव्हर फोटो यशस्वीरित्या अपलोड झाला!' : 'Cover image uploaded successfully!');
                              } else {
                                throw new Error(lang === 'mr' ? 'सर्व्हरने फोटो URL परत केली नाही.' : 'Server did not return image URL.');
                              }
                            } catch (err: any) {
                              const errMsg = err?.message || (lang === 'mr' ? 'फोटो अपलोड अयशस्वी.' : 'Failed to upload photo.');
                              setEventCoverUploadError(errMsg);
                              showToast(errMsg);
                            } finally {
                              setIsUploadingEventCover(false);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                      {eventCoverUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setEventCoverUrl('');
                            setEventCoverUploadProgress(0);
                            setEventCoverUploadError(null);
                          }}
                          className="px-3 py-2.5 text-xs text-[#8F3426] hover:bg-[#FBECE9] rounded-xl border border-[#F0C4BC] cursor-pointer"
                        >
                          {lang === 'mr' ? 'काढून टाका' : 'Remove'}
                        </button>
                      )}
                    </div>

                    {/* Cover Progress Bar */}
                    {isUploadingEventCover && (
                      <div className="w-full bg-[#EAE4D7] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#244A3A] h-full transition-all duration-300"
                          style={{ width: `${eventCoverUploadProgress}%` }}
                        />
                      </div>
                    )}

                    {/* Cover Error Message */}
                    {eventCoverUploadError && (
                      <p className="text-xs text-[#8F3426] flex items-center gap-1.5 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{eventCoverUploadError}</span>
                      </p>
                    )}

                    {/* Cover Preview */}
                    {eventCoverUrl && (
                      <div className="mt-2 flex items-center gap-3 p-2 bg-[#FAF8F3] rounded-xl border border-[#D8CEBE]">
                        <img
                          src={eventCoverUrl}
                          alt="Cover Preview"
                          className="w-16 h-12 object-cover rounded-lg border border-[#D8CEBE]"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" viewBox="0 0 64 48"><rect width="64" height="48" fill="%23EAE4D7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%238C7A6B">Invalid</text></svg>';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#244A3A] truncate">
                            {eventCoverUrl.startsWith('/backend-php-mysql/uploads/')
                              ? eventCoverUrl.split('/').pop()
                              : eventCoverUrl}
                          </p>
                          <span className="text-[11px] text-[#55635B]">
                            {lang === 'mr' ? '✓ कव्हर फोटो निवडला गेला आहे' : '✓ Cover image attached'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Additional Event Photos */}
                  <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="block text-xs font-bold text-[#244A3A]">
                        {lang === 'mr'
                          ? 'कार्यक्रमाची अतिरिक्त छायाचित्रे (Event Photos Slider)'
                          : 'Additional Event Photos (Photo Slider)'}
                      </label>
                      <span className="text-[11px] text-[#55635B]">
                        {lang === 'mr' ? 'एकाच वेळी अनेक फोटो निवडू शकता' : 'Multiple photos can be selected'}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={eventExtraUrlInput}
                        onChange={(e) => {
                          setEventExtraUrlInput(e.target.value);
                          setEventPhotoUploadError(null);
                        }}
                        placeholder="https://... किंवा /backend-php-mysql/uploads/... फोटो लिंक"
                        className="flex-1 px-3.5 py-2 text-xs bg-white border border-[#D8CEBE] rounded-xl focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = eventExtraUrlInput.trim();
                          if (trimmed) {
                            if (!trimmed.startsWith('https://') && !trimmed.startsWith('/backend-php-mysql/uploads/') && !trimmed.startsWith('uploads/')) {
                              const err = lang === 'mr' ? 'कृपया वैध HTTPS किंवा सर्व्हर फोटो लिंक द्या.' : 'Please enter a valid HTTPS or server image URL.';
                              setEventPhotoUploadError(err);
                              showToast(err);
                              return;
                            }
                            setEventExtraImages((prev) => [...prev, trimmed]);
                            setEventExtraUrlInput('');
                            setEventPhotoUploadError(null);
                            showToast(lang === 'mr' ? 'छायाचित्र जोडले.' : 'Photo added.');
                          }
                        }}
                        className="px-4 py-2 bg-[#244A3A] text-white rounded-xl text-xs font-bold hover:bg-[#1B3A2D] cursor-pointer shrink-0"
                      >
                        {lang === 'mr' ? 'जोडा' : 'Add URL'}
                      </button>

                      <label className={`px-4 py-2 bg-white hover:bg-[#FAF8F3] text-[#244A3A] border border-[#D8CEBE] rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 ${
                        isUploadingEventPhoto ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      }`}>
                        {isUploadingEventPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B58A4A]" />
                        ) : (
                          <Upload className="w-3.5 h-3.5 text-[#B58A4A]" />
                        )}
                        <span>
                          {isUploadingEventPhoto
                            ? lang === 'mr'
                              ? `अपलोड होत आहे (${eventPhotoUploadProgress}%)`
                              : `Uploading (${eventPhotoUploadProgress}%)`
                            : lang === 'mr'
                            ? 'फोटो अपलोड करा'
                            : 'Upload Photos'}
                        </span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          multiple
                          className="hidden"
                          disabled={isUploadingEventPhoto}
                          onChange={async (e) => {
                            const files = e.target.files;
                            if (!files || files.length === 0) return;

                            setIsUploadingEventPhoto(true);
                            setEventPhotoUploadProgress(10);
                            setEventPhotoUploadError(null);
                            let successCount = 0;
                            const newUrls: string[] = [];

                            try {
                              const total = files.length;
                              for (let i = 0; i < total; i++) {
                                const file = files[i];
                                const isImage = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ||
                                  /\.(jpe?g|png|webp)$/i.test(file.name);
                                if (!isImage) {
                                  continue;
                                }
                                if (file.size > 5 * 1024 * 1024) {
                                  continue;
                                }

                                const res = await ApiClient.uploadImage(
                                  file,
                                  (pct) => {
                                    const overall = Math.round(((i + pct / 100) / total) * 100);
                                    setEventPhotoUploadProgress(overall);
                                  },
                                  'events'
                                );

                                if (res?.url) {
                                  newUrls.push(res.url);
                                  successCount++;
                                }
                              }

                              if (newUrls.length > 0) {
                                setEventExtraImages((prev) => [...prev, ...newUrls]);
                                setEventPhotoUploadProgress(100);
                                showToast(
                                  lang === 'mr'
                                    ? `${successCount} छायाचित्रे यशस्वीरित्या जोडली!`
                                    : `${successCount} photo(s) uploaded successfully!`
                                );
                              } else {
                                const err = lang === 'mr'
                                  ? 'कोणताही फोटो अपलोड होऊ शकला नाही. JPG/PNG/WebP (<५MB) तपासा.'
                                  : 'No valid photos uploaded. Check JPG/PNG/WebP (<5MB).';
                                setEventPhotoUploadError(err);
                                showToast(err);
                              }
                            } catch (err: any) {
                              const errMsg = err?.message || (lang === 'mr' ? 'फोटो अपलोड अयशस्वी.' : 'Failed to upload photos.');
                              setEventPhotoUploadError(errMsg);
                              showToast(errMsg);
                            } finally {
                              setIsUploadingEventPhoto(false);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Photo Progress Bar */}
                    {isUploadingEventPhoto && (
                      <div className="w-full bg-[#EAE4D7] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-[#244A3A] h-full transition-all duration-300"
                          style={{ width: `${eventPhotoUploadProgress}%` }}
                        />
                      </div>
                    )}

                    {/* Photo Error Message */}
                    {eventPhotoUploadError && (
                      <p className="text-xs text-[#8F3426] flex items-center gap-1.5 pt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{eventPhotoUploadError}</span>
                      </p>
                    )}

                    {/* Photo Thumbnails */}
                    {eventExtraImages.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                        {eventExtraImages.map((img, idx) => (
                          <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#D8CEBE] bg-white aspect-video shadow-xs">
                            <img
                              src={img}
                              alt={`Slide ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="48" viewBox="0 0 64 48"><rect width="64" height="48" fill="%23EAE4D7"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="10" fill="%238C7A6B">Invalid</text></svg>';
                              }}
                            />
                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-bold">
                              #{idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => setEventExtraImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-md text-[10px] cursor-pointer transition-colors shadow-xs"
                              title={lang === 'mr' ? 'काढून टाका' : 'Remove'}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Options & Action Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#EAE4D7]">
                    <div className="flex flex-wrap items-center gap-5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="eventPublishedCheck"
                          checked={eventPublished}
                          onChange={(e) => setEventPublished(e.target.checked)}
                          className="rounded border-[#D8CEBE] text-[#244A3A] focus:ring-[#244A3A] w-4 h-4"
                        />
                        <label htmlFor="eventPublishedCheck" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                          {lang === 'mr' ? 'वेबसाईटवर प्रकाशित करा (Publish immediately)' : 'Publish immediately on website'}
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="eventFeaturedCheck"
                          checked={eventIsFeatured}
                          onChange={(e) => setEventIsFeatured(e.target.checked)}
                          className="rounded border-[#D8CEBE] text-[#244A3A] focus:ring-[#244A3A] w-4 h-4"
                        />
                        <label htmlFor="eventFeaturedCheck" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                          {lang === 'mr' ? 'ठळक कार्यक्रम (Featured)' : 'Featured Event'}
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-[#244A3A]">
                          {lang === 'mr' ? 'क्रम:' : 'Order:'}
                        </label>
                        <input
                          type="number"
                          value={eventDisplayOrder}
                          onChange={(e) => setEventDisplayOrder(Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-lg text-center"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {editingEventId && (
                        <button
                          type="button"
                          onClick={resetEventForm}
                          className="px-4 py-2.5 text-xs font-bold text-[#55635B] hover:text-[#244A3A] border border-[#D8CEBE] rounded-xl cursor-pointer"
                        >
                          {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSavingEvent}
                        className="px-6 py-2.5 bg-[#244A3A] hover:bg-[#1B3A2D] text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isSavingEvent && <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />}
                        <span>
                          {editingEventId
                            ? lang === 'mr'
                              ? 'बदल जतन करा (Update Event)'
                              : 'Update Event'
                            : lang === 'mr'
                            ? 'कार्यक्रम जतन करा (Save Event)'
                            : 'Save Event'}
                        </span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Events List Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-serif font-bold text-[#244A3A]">
                      {lang === 'mr'
                        ? `कार्यक्रमांची यादी (${state.events.length})`
                        : `Events List (${state.events.length})`}
                    </h3>
                    <p className="text-xs text-[#55635B]">
                      {lang === 'mr'
                        ? 'स्थानिक डेटाबेस (events) मध्ये जतन केलेले सर्व कार्यक्रम'
                        : 'All events stored directly in database events table'}
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-[#55635B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={eventSearchQuery}
                      onChange={(e) => setEventSearchQuery(e.target.value)}
                      placeholder={lang === 'mr' ? 'कार्यक्रम / ठिकाण शोधा...' : 'Search events...'}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                    />
                  </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#F0ECE2]">
                  {(['all', 'upcoming', 'ongoing', 'completed', 'cancelled'] as const).map((st) => {
                    const count = st === 'all'
                      ? state.events.length
                      : state.events.filter((e) => e.status === st).length;
                    const active = eventStatusFilter === st;

                    const labelMap: Record<string, { mr: string; en: string }> = {
                      all: { mr: 'सर्व', en: 'All' },
                      upcoming: { mr: 'आगामी', en: 'Upcoming' },
                      ongoing: { mr: 'सुरू असलेले', en: 'Ongoing' },
                      completed: { mr: 'संपन्न', en: 'Completed' },
                      cancelled: { mr: 'रद्द', en: 'Cancelled' },
                    };

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setEventStatusFilter(st)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#244A3A] text-white shadow-xs'
                            : 'bg-[#FAF8F3] text-[#55635B] hover:bg-[#EAE4D7] border border-[#E2DACB]'
                        }`}
                      >
                        {lang === 'mr' ? labelMap[st].mr : labelMap[st].en} ({count})
                      </button>
                    );
                  })}
                </div>

                {/* List Items */}
                {(() => {
                  const filtered = state.events.filter((evt) => {
                    if (eventStatusFilter !== 'all' && evt.status !== eventStatusFilter) return false;
                    if (eventSearchQuery.trim()) {
                      const q = eventSearchQuery.trim().toLowerCase();
                      const matchTitleMr = evt.title.toLowerCase().includes(q);
                      const matchTitleEn = (evt.titleEn || '').toLowerCase().includes(q);
                      const matchVenue = (evt.venue || '').toLowerCase().includes(q) || (evt.venueEn || '').toLowerCase().includes(q);
                      const matchDate = (evt.startDate || '').includes(q) || (evt.eventDateTextMr || '').includes(q);
                      if (!matchTitleMr && !matchTitleEn && !matchVenue && !matchDate) return false;
                    }
                    return true;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="text-center py-8 bg-[#FAF8F3] rounded-xl border border-dashed border-[#D8CEBE]">
                        <Calendar className="w-8 h-8 text-[#B58A4A] mx-auto mb-2 opacity-60" />
                        <p className="text-xs font-semibold text-[#55635B]">
                          {lang === 'mr'
                            ? 'कोणताही कार्यक्रम आढळला नाही.'
                            : 'No events found matching your criteria.'}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map((evt) => {
                        const isPublished = evt.published !== false;
                        const isToggling = isTogglingPublishEventId === evt.id;
                        const isDeleting = isDeletingEventId === evt.id;
                        const photoCount = (evt.coverImageUrl ? 1 : 0) + (evt.photos ? evt.photos.length : 0);

                        const statusBadgeStyles: Record<EventStatus, string> = {
                          upcoming: 'bg-amber-100 text-amber-800 border-amber-300',
                          ongoing: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                          completed: 'bg-blue-100 text-blue-800 border-blue-300',
                          cancelled: 'bg-red-100 text-red-800 border-red-300',
                        };

                        const statusLabels: Record<EventStatus, { mr: string; en: string }> = {
                          upcoming: { mr: 'आगामी', en: 'Upcoming' },
                          ongoing: { mr: 'सुरू असलेले', en: 'Ongoing' },
                          completed: { mr: 'संपन्न', en: 'Completed' },
                          cancelled: { mr: 'रद्द', en: 'Cancelled' },
                        };

                        return (
                          <div
                            key={evt.id}
                            className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] hover:border-[#244A3A] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                          >
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              {evt.coverImageUrl ? (
                                <img
                                  src={evt.coverImageUrl}
                                  alt={evt.title}
                                  className="w-20 h-16 object-cover rounded-lg border border-[#D8CEBE] shrink-0"
                                />
                              ) : (
                                <div className="w-20 h-16 bg-[#EAE4D7] rounded-lg border border-[#D8CEBE] flex items-center justify-center shrink-0">
                                  <Calendar className="w-6 h-6 text-[#8C7A6B]" />
                                </div>
                              )}

                              <div className="min-w-0 space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h4 className="font-serif font-bold text-sm sm:text-base text-[#244A3A] truncate">
                                    {lang === 'mr' ? evt.title : (evt.titleEn || evt.title)}
                                  </h4>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeStyles[evt.status] || statusBadgeStyles.upcoming}`}
                                  >
                                    {lang === 'mr' ? statusLabels[evt.status]?.mr : statusLabels[evt.status]?.en}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                      isPublished
                                        ? 'bg-[#EAF2EC] text-[#244A3A] border-[#C5DDD0]'
                                        : 'bg-[#FBECE9] text-[#8F3426] border-[#F0C4BC]'
                                    }`}
                                  >
                                    {isPublished
                                      ? lang === 'mr' ? 'प्रकाशित' : 'Published'
                                      : lang === 'mr' ? 'अप्रकाशित (Draft)' : 'Draft'}
                                  </span>
                                  {evt.isFeatured && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF3E4] text-[#9A6B26] border border-[#F3DFC1]">
                                      {lang === 'mr' ? 'ठळक' : 'Featured'}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs text-[#55635B]">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Calendar className="w-3.5 h-3.5 text-[#B58A4A]" />
                                    <span>
                                      {formatEventDate(
                                        evt.startDate,
                                        evt.endDate,
                                        lang,
                                        lang === 'mr' ? evt.eventDateTextMr : evt.eventDateTextEn
                                      )}
                                    </span>
                                  </span>

                                  {evt.eventTime && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 text-[#55635B]" />
                                      <span>{evt.eventTime}</span>
                                    </span>
                                  )}

                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-[#55635B]" />
                                    <span className="truncate max-w-[200px]">
                                      {lang === 'mr' ? evt.venue : (evt.venueEn || evt.venue)}
                                    </span>
                                  </span>

                                  {photoCount > 0 && (
                                    <span className="text-[11px] bg-white px-2 py-0.5 rounded-md border border-[#D8CEBE]">
                                      📷 {photoCount} {lang === 'mr' ? 'छायाचित्रे' : 'Photos'}
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-[#55635B] line-clamp-2 pt-0.5">
                                  {lang === 'mr' ? evt.summary : (evt.summaryEn || evt.summary)}
                                </p>
                              </div>
                            </div>

                            {/* Card Actions */}
                            <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-[#EAE4D7]">
                              {/* Quick Toggle Publish */}
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleTogglePublishEvent(evt)}
                                className={`p-2 rounded-lg cursor-pointer transition-colors ${
                                  isPublished
                                    ? 'bg-[#EAF2EC] hover:bg-[#D5E7DB]'
                                    : 'bg-[#FBECE9] hover:bg-[#F5D8D3]'
                                }`}
                                title={
                                  isPublished
                                    ? lang === 'mr' ? 'अप्रकाशित करा (Draft)' : 'Unpublish'
                                    : lang === 'mr' ? 'प्रकाशित करा' : 'Publish'
                                }
                              >
                                {isToggling ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#244A3A]" />
                                ) : isPublished ? (
                                  <Eye className="w-4 h-4 text-[#244A3A]" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-[#8F3426]" />
                                )}
                              </button>

                              {/* Edit */}
                              <button
                                type="button"
                                onClick={() => startEditEvent(evt)}
                                className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer border border-transparent hover:border-[#D8CEBE]"
                                title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteEvent(evt.id, evt.title)}
                                className="p-2 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-40"
                                title={lang === 'mr' ? 'हटवा' : 'Delete'}
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#8F3426]" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 6: NEWS & ANNOUNCEMENTS (Add, Edit/Update, Delete, Cover + Multiple Images)
          ================================================================ */}
          {activeTab === 'news' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A]">
                    {editingNewsId
                      ? lang === 'mr'
                        ? 'सूचना संपादित करा (Edit Announcement)'
                        : 'Edit Announcement'
                      : lang === 'mr'
                      ? 'नवीन बातमी किंवा सूचना जोडा'
                      : 'Add Announcement'}
                  </h2>
                  {editingNewsId && (
                    <button
                      type="button"
                      onClick={resetNewsForm}
                      className="text-xs font-semibold text-[#8F3426] underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'रद्द करा' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveNews} className="space-y-4">
                  {/* Bilingual Title Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'शीर्षक (मराठी) *' : 'Title (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={newsTitle}
                        onChange={(e) => setNewsTitle(e.target.value)}
                        placeholder="उदा. वार्षिक स्नेहसंमेलन व पुरस्कार वितरण"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'शीर्षक (इंग्रजी / English)' : 'Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={newsTitleEn}
                        onChange={(e) => setNewsTitleEn(e.target.value)}
                        placeholder="e.g. Annual Gathering & Award Ceremony"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Dates & Category & Status */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'तारीख (मराठी)' : 'Date (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={newsDate}
                        onChange={(e) => setNewsDate(e.target.value)}
                        placeholder="उदा. १५ एप्रिल २०२५"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'तारीख (इंग्रजी)' : 'Date (English)'}
                      </label>
                      <input
                        type="text"
                        value={newsDateEn}
                        onChange={(e) => setNewsDateEn(e.target.value)}
                        placeholder="e.g. 15 April 2025"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'विभाग (Category)' : 'Category'}
                      </label>
                      <select
                        value={newsCategory}
                        onChange={(e) => setNewsCategory(e.target.value as CategoryKey)}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {getCategoryLabel(cat, lang)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'स्थिती (Status)' : 'Status'}
                      </label>
                      <select
                        value={newsUpcoming ? 'upcoming' : 'completed'}
                        onChange={(e) => setNewsUpcoming(e.target.value === 'upcoming')}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl"
                      >
                        <option value="upcoming">{lang === 'mr' ? 'आगामी कार्यक्रम' : 'Upcoming Event'}</option>
                        <option value="completed">{lang === 'mr' ? 'संपन्न कार्यक्रम' : 'Completed Event'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Event Cover Image & Multiple Images Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB]">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#244A3A]">
                        {lang === 'mr' ? '१. कार्यक्रम कव्हर फोटो (Cover Image URL)' : '1. Event Cover Image URL'}
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#244A3A] text-white rounded-lg text-xs font-semibold cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? 'कव्हर निवडा' : 'Upload Cover'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const dataUrl = await readAndCompressImage(file);
                                setNewsCoverUrl(dataUrl);
                              }
                            }}
                          />
                        </label>
                        <input
                          type="text"
                          value={newsCoverUrl}
                          onChange={(e) => setNewsCoverUrl(e.target.value)}
                          placeholder="किंवा URL (उदा. https://...)"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D8CEBE] rounded-lg"
                        />
                      </div>
                      {newsCoverUrl && (
                        <img
                          src={newsCoverUrl}
                          alt="Cover"
                          className="w-24 h-16 object-cover rounded-lg border border-[#D8CEBE]"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[#244A3A]">
                        {lang === 'mr'
                          ? '२. कार्यक्रमाचे स्लाईड फोटो (Multiple Event Slide Photos)'
                          : '2. Event Slide Photos (Add Multiple Pictures)'}
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0] rounded-lg text-xs font-bold cursor-pointer shrink-0">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? 'अनेक फोटो निवडा' : 'Select Multiple Photos'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={async (e) => {
                              const files = Array.from(e.target.files || []);
                              if (files.length === 0) return;
                              const urls = await Promise.all(files.map(readAndCompressImage));
                              setNewsExtraImages((prev) => [...prev, ...urls]);
                            }}
                          />
                        </label>
                        <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                          <input
                            type="text"
                            value={newsExtraUrlInput}
                            onChange={(e) => setNewsExtraUrlInput(e.target.value)}
                            placeholder={lang === 'mr' ? 'किंवा फोटो URL टाका...' : 'Or paste photo URL...'}
                            className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#D8CEBE] rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newsExtraUrlInput.trim()) {
                                setNewsExtraImages((prev) => [...prev, newsExtraUrlInput.trim()]);
                                setNewsExtraUrlInput('');
                              }
                            }}
                            className="px-2.5 py-1.5 bg-[#244A3A] text-white text-xs font-bold rounded-lg shrink-0 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      {newsExtraImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {newsExtraImages.map((u, idx) => (
                            <div key={idx} className="relative">
                              <img
                                src={u}
                                alt=""
                                className="w-16 h-12 object-cover rounded-md border border-[#D8CEBE]"
                              />
                              <span className="absolute bottom-0.5 left-0.5 bg-black/70 text-white text-[9px] px-1 rounded">
                                #{idx + 2}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setNewsExtraImages((prev) => prev.filter((_, i) => i !== idx))
                                }
                                className="absolute -top-1 -right-1 bg-[#8F3426] text-white rounded-full p-0.5 cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bilingual Summary Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त माहिती (मराठी) *' : 'Summary (Marathi) *'}
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={newsSummary}
                        onChange={(e) => setNewsSummary(e.target.value)}
                        placeholder="संक्षिप्त माहिती प्रविष्ट करा..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त माहिती (इंग्रजी)' : 'Summary (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={newsSummaryEn}
                        onChange={(e) => setNewsSummaryEn(e.target.value)}
                        placeholder="Enter summary in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Content Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सविस्तर माहिती (मराठी)' : 'Full Details (Marathi)'}
                      </label>
                      <textarea
                        rows={2}
                        value={newsContent}
                        onChange={(e) => setNewsContent(e.target.value)}
                        placeholder="सविस्तर माहिती..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सविस्तर माहिती (इंग्रजी)' : 'Full Details (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={newsContentEn}
                        onChange={(e) => setNewsContentEn(e.target.value)}
                        placeholder="Full details in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Published Checkbox */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="newsPublishedCheck"
                      checked={newsPublished}
                      onChange={(e) => setNewsPublished(e.target.checked)}
                      className="rounded border-[#D8CEBE] text-[#244A3A] focus:ring-[#244A3A] w-4 h-4"
                    />
                    <label htmlFor="newsPublishedCheck" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                      {lang === 'mr' ? 'वेबसाईटवर प्रकाशित करा (Publish immediately)' : 'Publish immediately on website'}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingNews}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#244A3A] hover:bg-[#183328] disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    {isSavingNews ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#B58A4A]" />
                    )}
                    <span>
                      {isSavingNews
                        ? lang === 'mr'
                          ? 'जतन होत आहे...'
                          : 'Saving...'
                        : editingNewsId
                        ? lang === 'mr'
                          ? 'कार्यक्रम अद्ययावत करा (Update)'
                          : 'Update Event'
                        : lang === 'mr'
                        ? 'कार्यक्रम / बातमी जतन करा'
                        : 'Save Event'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Announcements List */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-3">
                <h3 className="text-base font-serif font-bold text-[#244A3A]">
                  {lang === 'mr'
                    ? `कार्यक्रम व सूचना यादी (${state.announcements.length})`
                    : `Announcements List (${state.announcements.length})`}
                </h3>
                {state.announcements.length === 0 ? (
                  <p className="text-xs text-[#55635B] py-4 text-center">
                    {lang === 'mr' ? 'कोणतीही बातमी किंवा सूचना उपलब्ध नाही.' : 'No announcements or events found.'}
                  </p>
                ) : (
                  state.announcements.map((a) => {
                    const slideCount = (a.coverImageUrl ? 1 : 0) + (a.images ? a.images.length : 0);
                    const isPublished = a.published !== false;
                    const isToggling = isTogglingPublishNewsId === a.id;
                    const isDeleting = isDeletingNewsId === a.id;

                    return (
                      <div
                        key={a.id}
                        className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {a.coverImageUrl && (
                            <img
                              src={a.coverImageUrl}
                              alt={a.title}
                              className="w-16 h-12 object-cover rounded-lg border border-[#D8CEBE] shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-serif font-bold text-sm text-[#244A3A] truncate">
                                {lang === 'mr' ? a.title : (a.titleEn || a.title)}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPublished
                                    ? 'bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0]'
                                    : 'bg-[#FBECE9] text-[#8F3426] border border-[#F0C4BC]'
                                }`}
                              >
                                {isPublished
                                  ? lang === 'mr' ? 'प्रकाशित' : 'Published'
                                  : lang === 'mr' ? 'अप्रकाशित (Draft)' : 'Draft'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#55635B] mt-0.5">
                              <span>{lang === 'mr' ? a.date : (a.dateEn || a.date)}</span>
                              <span>•</span>
                              <span>{getCategoryLabel(a.category, lang)}</span>
                              {slideCount > 0 && (
                                <span className="px-2 py-0.5 bg-[#EAF2EC] text-[#143B2A] font-bold rounded-full text-[10px]">
                                  {lang === 'mr' ? `${slideCount} स्लाईड फोटो` : `${slideCount} Slide Photos`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DACB]/60 w-full sm:w-auto justify-end">
                          {/* Publish/Unpublish Toggle */}
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={async () => {
                              setIsTogglingPublishNewsId(a.id);
                              try {
                                const res = await updateAnnouncement(a.id, { published: !isPublished });
                                if (res.success) {
                                  showToast(
                                    isPublished
                                      ? lang === 'mr' ? 'सूचना अप्रकाशित (Draft) केली.' : 'Announcement unpublished.'
                                      : lang === 'mr' ? 'सूचना प्रकाशित केली!' : 'Announcement published!'
                                  );
                                } else {
                                  showToast(res.error || (lang === 'mr' ? 'स्थिती बदलण्यात त्रुटी आली.' : 'Failed to update status.'));
                                }
                              } catch (err: any) {
                                showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
                              } finally {
                                setIsTogglingPublishNewsId(null);
                              }
                            }}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer disabled:opacity-40"
                            title={isPublished ? (lang === 'mr' ? 'अप्रकाशित करा' : 'Unpublish') : (lang === 'mr' ? 'प्रकाशित करा' : 'Publish')}
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#244A3A]" />
                            ) : isPublished ? (
                              <Eye className="w-4 h-4 text-[#244A3A]" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-[#8F3426]" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => startEditNews(a)}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer"
                            title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                              const confirmMsg =
                                lang === 'mr'
                                  ? `"${a.title}" ही सूचना कायमची हटवायची आहे का?`
                                  : `Are you sure you want to delete announcement "${a.title}"?`;
                              if (!window.confirm(confirmMsg)) return;

                              setIsDeletingNewsId(a.id);
                              try {
                                const res = await deleteAnnouncement(a.id);
                                if (res.success) {
                                  showToast(lang === 'mr' ? 'सूचना यशस्वीरित्या हटवली.' : 'Announcement deleted successfully.');
                                } else {
                                  showToast(res.error || (lang === 'mr' ? 'सूचना हटवण्यात त्रुटी आली.' : 'Failed to delete announcement.'));
                                }
                              } catch (err: any) {
                                showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
                              } finally {
                                setIsDeletingNewsId(null);
                              }
                            }}
                            className="p-2 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-40"
                            title={lang === 'mr' ? 'हटवा' : 'Delete'}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#8F3426]" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 6B: GOVERNMENT SCHEMES (Add, Edit/Update, Delete, Publish/Unpublish, Bilingual)
          ================================================================ */}
          {activeTab === 'schemes' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#244A3A] flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-[#B58A4A]" />
                    <span>
                      {editingSchemeId
                        ? lang === 'mr'
                          ? 'शासकीय योजना संपादित करा (Edit Government Scheme)'
                          : 'Edit Government Welfare Scheme'
                        : lang === 'mr'
                        ? 'नवीन शासकीय कल्याणकारी योजना जोडा'
                        : 'Add New Government Welfare Scheme'}
                    </span>
                  </h2>
                  {editingSchemeId && (
                    <button
                      type="button"
                      onClick={resetSchemeForm}
                      className="text-xs font-semibold text-[#8F3426] underline cursor-pointer"
                    >
                      {lang === 'mr' ? 'रद्द करा' : 'Cancel Edit'}
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveScheme} className="space-y-4">
                  {/* Bilingual Scheme Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'योजनेचे नाव (मराठी) *' : 'Scheme Name (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={schemeTitle}
                        onChange={(e) => setSchemeTitle(e.target.value)}
                        placeholder="उदा. संजय गांधी निराधार अनुदान योजना"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'योजनेचे नाव (इंग्रजी / English)' : 'Scheme Name (English)'}
                      </label>
                      <input
                        type="text"
                        value={schemeTitleEn}
                        onChange={(e) => setSchemeTitleEn(e.target.value)}
                        placeholder="e.g. Sanjay Gandhi Niradhar Yojana"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संबंधित विभाग (मराठी)' : 'Department (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={schemeDept}
                        onChange={(e) => setSchemeDept(e.target.value)}
                        placeholder="उदा. सामाजिक न्याय व विशेष सहाय्य विभाग"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संबंधित विभाग (इंग्रजी)' : 'Department (English)'}
                      </label>
                      <input
                        type="text"
                        value={schemeDeptEn}
                        onChange={(e) => setSchemeDeptEn(e.target.value)}
                        placeholder="e.g. Social Justice & Special Assistance Dept"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Beneficiary Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'लाभार्थी प्रवर्ग (मराठी)' : 'Beneficiary Category (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={schemeBenCat}
                        onChange={(e) => setSchemeBenCat(e.target.value)}
                        placeholder="उदा. निराधार, वृद्ध, दिव्यांग व्यक्ती"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'लाभार्थी प्रवर्ग (इंग्रजी)' : 'Beneficiary Category (English)'}
                      </label>
                      <input
                        type="text"
                        value={schemeBenCatEn}
                        onChange={(e) => setSchemeBenCatEn(e.target.value)}
                        placeholder="e.g. Destitute, Elderly, Differently-abled"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Official Portal URL & Cover Image */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अधिकृत पोर्टल लिंक (HTTPS URL)' : 'Official Portal URL (HTTPS)'}
                      </label>
                      <input
                        type="url"
                        value={schemePortalUrl}
                        onChange={(e) => setSchemePortalUrl(e.target.value)}
                        placeholder="https://sjsa.maharashtra.gov.in"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कव्हर फोटो URL (पर्यायी)' : 'Cover Image URL (Optional)'}
                      </label>
                      <input
                        type="url"
                        value={schemeCoverUrl}
                        onChange={(e) => setSchemeCoverUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त माहिती (मराठी) *' : 'Summary (Marathi) *'}
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={schemeSummary}
                        onChange={(e) => setSchemeSummary(e.target.value)}
                        placeholder="योजनेची संक्षिप्त माहिती..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'संक्षिप्त माहिती (इंग्रजी)' : 'Summary (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={schemeSummaryEn}
                        onChange={(e) => setSchemeSummaryEn(e.target.value)}
                        placeholder="Summary in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Eligibility */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'पात्रता अटी (मराठी)' : 'Eligibility Criteria (Marathi)'}
                      </label>
                      <textarea
                        rows={2}
                        value={schemeEligibility}
                        onChange={(e) => setSchemeEligibility(e.target.value)}
                        placeholder="उदा. वार्षिक उत्पन्न मर्यादा, वयोमर्यादा..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'पात्रता अटी (इंग्रजी)' : 'Eligibility Criteria (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={schemeEligibilityEn}
                        onChange={(e) => setSchemeEligibilityEn(e.target.value)}
                        placeholder="Eligibility criteria in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Benefits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'मिळणारे लाभ (मराठी)' : 'Benefits (Marathi)'}
                      </label>
                      <textarea
                        rows={2}
                        value={schemeBenefits}
                        onChange={(e) => setSchemeBenefits(e.target.value)}
                        placeholder="उदा. दरमहा आर्थिक सहाय्य..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'मिळणारे लाभ (इंग्रजी)' : 'Benefits (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={schemeBenefitsEn}
                        onChange={(e) => setSchemeBenefitsEn(e.target.value)}
                        placeholder="Benefits in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Bilingual Documents Required */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'आवश्यक कागदपत्रे (मराठी)' : 'Required Documents (Marathi)'}
                      </label>
                      <textarea
                        rows={2}
                        value={schemeDocs}
                        onChange={(e) => setSchemeDocs(e.target.value)}
                        placeholder="उदा. आधार कार्ड, रेशन कार्ड, उत्पन्नाचा दाखला..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'आवश्यक कागदपत्रे (इंग्रजी)' : 'Required Documents (English)'}
                      </label>
                      <textarea
                        rows={2}
                        value={schemeDocsEn}
                        onChange={(e) => setSchemeDocsEn(e.target.value)}
                        placeholder="Required documents in English..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:outline-none focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Checkboxes: Published & Featured */}
                  <div className="flex flex-wrap items-center gap-6 pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="schemePublishedCheck"
                        checked={schemePublished}
                        onChange={(e) => setSchemePublished(e.target.checked)}
                        className="rounded border-[#D8CEBE] text-[#244A3A] focus:ring-[#244A3A] w-4 h-4"
                      />
                      <label htmlFor="schemePublishedCheck" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                        {lang === 'mr' ? 'वेबसाईटवर प्रकाशित करा (Publish immediately)' : 'Publish immediately on website'}
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="schemeFeaturedCheck"
                        checked={schemeFeatured}
                        onChange={(e) => setSchemeFeatured(e.target.checked)}
                        className="rounded border-[#D8CEBE] text-[#244A3A] focus:ring-[#244A3A] w-4 h-4"
                      />
                      <label htmlFor="schemeFeaturedCheck" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                        {lang === 'mr' ? 'मुख्य पृष्ठावर दर्शवा (Featured on Home)' : 'Featured on Homepage'}
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingScheme}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#244A3A] hover:bg-[#183328] disabled:opacity-50 text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    {isSavingScheme ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#B58A4A]" />
                    )}
                    <span>
                      {isSavingScheme
                        ? lang === 'mr'
                          ? 'जतन होत आहे...'
                          : 'Saving...'
                        : editingSchemeId
                        ? lang === 'mr'
                          ? 'योजना अद्ययावत करा (Update Scheme)'
                          : 'Update Scheme'
                        : lang === 'mr'
                        ? 'शासकीय योजना जतन करा'
                        : 'Save Government Scheme'}
                    </span>
                  </button>
                </form>
              </div>

              {/* Schemes List */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-3">
                <h3 className="text-base font-serif font-bold text-[#244A3A] flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-[#B58A4A]" />
                  <span>
                    {lang === 'mr'
                      ? `शासकीय योजना यादी (${state.governmentSchemes.length})`
                      : `Government Schemes List (${state.governmentSchemes.length})`}
                  </span>
                </h3>
                {state.governmentSchemes.length === 0 ? (
                  <p className="text-xs text-[#55635B] py-4 text-center">
                    {lang === 'mr' ? 'कोणतीही शासकीय योजना उपलब्ध नाही.' : 'No government schemes found.'}
                  </p>
                ) : (
                  state.governmentSchemes.map((s) => {
                    const isPublished = s.published !== false;
                    const isToggling = isTogglingPublishSchemeId === s.id;
                    const isDeleting = isDeletingSchemeId === s.id;

                    return (
                      <div
                        key={s.id}
                        className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {s.coverImageUrl && (
                            <img
                              src={s.coverImageUrl}
                              alt={s.title}
                              className="w-16 h-12 object-cover rounded-lg border border-[#D8CEBE] shrink-0"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-sm text-[#244A3A] truncate">
                                {lang === 'mr' ? s.title : (s.titleEn || s.title)}
                              </h4>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  isPublished
                                    ? 'bg-[#EAF2EC] text-[#244A3A] border border-[#C5DDD0]'
                                    : 'bg-[#FBECE9] text-[#8F3426] border border-[#F0C4BC]'
                                }`}
                              >
                                {isPublished
                                  ? lang === 'mr' ? 'प्रकाशित' : 'Published'
                                  : lang === 'mr' ? 'अप्रकाशित (Draft)' : 'Draft'}
                              </span>
                              {s.featured && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0E1] text-[#B58A4A] border border-[#E9D6BE]">
                                  {lang === 'mr' ? 'मुख्य पृष्ठावर' : 'Featured'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#55635B] mt-0.5 flex-wrap">
                              {s.department && (
                                <span>{lang === 'mr' ? s.department : (s.departmentEn || s.department)}</span>
                              )}
                              {s.beneficiaryCategory && (
                                <>
                                  <span>•</span>
                                  <span>{lang === 'mr' ? s.beneficiaryCategory : (s.beneficiaryCategoryEn || s.beneficiaryCategory)}</span>
                                </>
                              )}
                              {s.officialPortalUrl && (
                                <>
                                  <span>•</span>
                                  <a
                                    href={s.officialPortalUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-[#244A3A] hover:underline"
                                  >
                                    <span>{lang === 'mr' ? 'अधिकृत पोर्टल' : 'Official Portal'}</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 self-end sm:self-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2DACB]/60 w-full sm:w-auto justify-end">
                          {/* Publish/Unpublish Toggle */}
                          <button
                            type="button"
                            disabled={isToggling}
                            onClick={async () => {
                              setIsTogglingPublishSchemeId(s.id);
                              try {
                                const res = await updateGovernmentScheme(s.id, { published: !isPublished });
                                if (res.success) {
                                  showToast(
                                    isPublished
                                      ? lang === 'mr' ? 'योजना अप्रकाशित (Draft) केली.' : 'Scheme unpublished.'
                                      : lang === 'mr' ? 'योजना प्रकाशित केली!' : 'Scheme published!'
                                  );
                                } else {
                                  showToast(res.error || (lang === 'mr' ? 'स्थिती बदलण्यात त्रुटी आली.' : 'Failed to update status.'));
                                }
                              } catch (err: any) {
                                showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
                              } finally {
                                setIsTogglingPublishSchemeId(null);
                              }
                            }}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer disabled:opacity-40"
                            title={isPublished ? (lang === 'mr' ? 'अप्रकाशित करा' : 'Unpublish') : (lang === 'mr' ? 'प्रकाशित करा' : 'Publish')}
                          >
                            {isToggling ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#244A3A]" />
                            ) : isPublished ? (
                              <Eye className="w-4 h-4 text-[#244A3A]" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-[#8F3426]" />
                            )}
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => startEditScheme(s)}
                            className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer"
                            title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={async () => {
                              const confirmMsg =
                                lang === 'mr'
                                  ? `"${s.title}" ही शासकीय योजना कायमची हटवायची आहे का?`
                                  : `Are you sure you want to delete scheme "${s.title}"?`;
                              if (!window.confirm(confirmMsg)) return;

                              setIsDeletingSchemeId(s.id);
                              try {
                                const res = await deleteGovernmentScheme(s.id);
                                if (res.success) {
                                  showToast(lang === 'mr' ? 'शासकीय योजना यशस्वीरित्या हटवली.' : 'Government scheme deleted successfully.');
                                } else {
                                  showToast(res.error || (lang === 'mr' ? 'योजना हटवण्यात त्रुटी आली.' : 'Failed to delete scheme.'));
                                }
                              } catch (err: any) {
                                showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'Error occurred.'));
                              } finally {
                                setIsDeletingSchemeId(null);
                              }
                            }}
                            className="p-2 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-40"
                            title={lang === 'mr' ? 'हटवा' : 'Delete'}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#8F3426]" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 7: REPORTS & CONTACT INFO (Add, Edit/Update, Delete)
          ================================================================ */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Contact Information Form */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2DACB]/60 pb-3">
                  <h2 className="text-lg font-serif font-bold text-[#244A3A] flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#B58A4A]" />
                    <span>{lang === 'mr' ? 'संस्थेची अधिकृत संपर्क माहिती (Contact Details)' : 'Institute Contact Details'}</span>
                  </h2>
                  <span className="text-xs text-[#55635B] bg-[#FAF8F3] px-2.5 py-1 rounded-lg border border-[#E2DACB]">
                    {lang === 'mr' ? 'MySQL तक्ता: contact_info (ID: 1)' : 'MySQL table: contact_info (ID: 1)'}
                  </span>
                </div>

                <form onSubmit={handleSaveContact} className="space-y-4">
                  {/* Phone and Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'दूरध्वनी क्रमांक (Phone Number) *' : 'Phone Number *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="+91 9923512482"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'ईमेल पत्ता (Email Address) *' : 'Email Address *'}
                      </label>
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="contact@shrikrushnasanstha.org"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Office Address (Bilingual MR & EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कार्यालयाचा पत्ता (मराठी) *' : 'Office Address (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={addressInput}
                        onChange={(e) => setAddressInput(e.target.value)}
                        placeholder="मु. पो. मांडवगण, ता. जामनेर, जि. जळगाव"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कार्यालयाचा पत्ता (English)' : 'Office Address (English)'}
                      </label>
                      <input
                        type="text"
                        value={addressEnInput}
                        onChange={(e) => setAddressEnInput(e.target.value)}
                        placeholder="At Post Mandavgan, Taluka Jamner, Dist Jalgaon"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Taluka & District (Bilingual MR & EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'तालुका (मराठी)' : 'Taluka (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={talukaInput}
                        onChange={(e) => setTalukaInput(e.target.value)}
                        placeholder="जामनेर"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'तालुका (English)' : 'Taluka (English)'}
                      </label>
                      <input
                        type="text"
                        value={talukaEnInput}
                        onChange={(e) => setTalukaEnInput(e.target.value)}
                        placeholder="Jamner"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'जिल्हा (मराठी)' : 'District (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={districtInput}
                        onChange={(e) => setDistrictInput(e.target.value)}
                        placeholder="जळगाव"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'जिल्हा (English)' : 'District (English)'}
                      </label>
                      <input
                        type="text"
                        value={districtEnInput}
                        onChange={(e) => setDistrictEnInput(e.target.value)}
                        placeholder="Jalgaon"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Visiting Hours (Bilingual MR & EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कार्यालयीन वेळ (मराठी)' : 'Visiting Hours (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={hoursInput}
                        onChange={(e) => setHoursInput(e.target.value)}
                        placeholder="सोमवार ते शनिवार: सकाळी १०:०० ते सायंकाळी ५:००"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'कार्यालयीन वेळ (English)' : 'Visiting Hours (English)'}
                      </label>
                      <input
                        type="text"
                        value={hoursEnInput}
                        onChange={(e) => setHoursEnInput(e.target.value)}
                        placeholder="Mon - Sat: 10:00 AM - 5:00 PM"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Registration Number & Secretary Name (Bilingual MR & EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'नोंदणी क्रमांक (मराठी)' : 'Reg. No. (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={regNoInput}
                        onChange={(e) => setRegNoInput(e.target.value)}
                        placeholder="महा/१२३४/जळगाव"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'नोंदणी क्रमांक (English)' : 'Reg. No. (English)'}
                      </label>
                      <input
                        type="text"
                        value={regNoEnInput}
                        onChange={(e) => setRegNoEnInput(e.target.value)}
                        placeholder="MAH/1234/Jalgaon"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सचिव नाव (मराठी)' : 'Secretary Name (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={secretaryNameInput}
                        onChange={(e) => setSecretaryNameInput(e.target.value)}
                        placeholder="संस्था सचिव"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'सचिव नाव (English)' : 'Secretary Name (English)'}
                      </label>
                      <input
                        type="text"
                        value={secretaryNameEnInput}
                        onChange={(e) => setSecretaryNameEnInput(e.target.value)}
                        placeholder="Secretary"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingContact}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSavingContact ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-[#B58A4A]" />
                    )}
                    <span>
                      {isSavingContact
                        ? (lang === 'mr' ? 'जतन करत आहे...' : 'Saving...')
                        : (lang === 'mr' ? 'संपर्क माहिती अद्ययावत करा' : 'Update Contact Details')}
                    </span>
                  </button>
                </form>
              </div>

              {/* Add / Edit Report Form */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E2DACB]/60 pb-3">
                  <h2 className="text-lg font-serif font-bold text-[#244A3A] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#B58A4A]" />
                    <span>
                      {editingReportId
                        ? lang === 'mr'
                          ? 'अहवाल संपादित करा (Edit Report)'
                          : 'Edit Report'
                        : lang === 'mr'
                        ? 'नवीन अहवाल व दस्तऐवज जोडा (Add Report)'
                        : 'Add Report & Document'}
                    </span>
                  </h2>
                  {editingReportId && (
                    <button
                      type="button"
                      onClick={resetReportForm}
                      className="text-xs font-semibold text-[#8F3426] hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{lang === 'mr' ? 'संपादन रद्द करा' : 'Cancel Edit'}</span>
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveReport} className="space-y-4">
                  {/* Titles (MR & EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अहवाल शीर्षक (मराठी) *' : 'Report Title (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={repTitle}
                        onChange={(e) => setRepTitle(e.target.value)}
                        placeholder="उदा. वार्षिक अहवाल २०२४-२५"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अहवाल शीर्षक (English)' : 'Report Title (English)'}
                      </label>
                      <input
                        type="text"
                        value={repTitleEn}
                        onChange={(e) => setRepTitleEn(e.target.value)}
                        placeholder="e.g. Annual Report 2024-25"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Period & Categories (MR & EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'आर्थिक वर्ष / कालावधी (मराठी) *' : 'Period (Marathi) *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={repPeriod}
                        onChange={(e) => setRepPeriod(e.target.value)}
                        placeholder="वर्ष २०२४-२५"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'आर्थिक वर्ष / कालावधी (English)' : 'Period (English)'}
                      </label>
                      <input
                        type="text"
                        value={repPeriodEn}
                        onChange={(e) => setRepPeriodEn(e.target.value)}
                        placeholder="Year 2024-25"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अहवाल श्रेणी (मराठी)' : 'Category (Marathi)'}
                      </label>
                      <input
                        type="text"
                        value={repCategory}
                        onChange={(e) => setRepCategory(e.target.value)}
                        placeholder="वार्षिक अहवाल"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अहवाल श्रेणी (English)' : 'Category (English)'}
                      </label>
                      <input
                        type="text"
                        value={repCategoryEn}
                        onChange={(e) => setRepCategoryEn(e.target.value)}
                        placeholder="Annual Report"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Date & File Size / Label */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अहवाल तारीख (Report Date)' : 'Report Date'}
                      </label>
                      <input
                        type="date"
                        value={repDate}
                        onChange={(e) => setRepDate(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'फाईल साईझ / लेबल (File Size / Label)' : 'File Size / Label'}
                      </label>
                      <input
                        type="text"
                        value={repFileSize}
                        onChange={(e) => setRepFileSize(e.target.value)}
                        placeholder="PDF (2.4 MB)"
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Summaries (MR & EN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अहवाल गोषवारा (मराठी) *' : 'Report Summary (Marathi) *'}
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={repSummary}
                        onChange={(e) => setRepSummary(e.target.value)}
                        placeholder="संस्थेच्या वर्षभरातील उपक्रम, शेती, शिक्षण व आरोग्य कामांचा सविस्तर आढावा..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#244A3A] mb-1">
                        {lang === 'mr' ? 'अहवाल गोषवारा (English)' : 'Report Summary (English)'}
                      </label>
                      <textarea
                        rows={3}
                        value={repSummaryEn}
                        onChange={(e) => setRepSummaryEn(e.target.value)}
                        placeholder="Detailed overview of agriculture, education, healthcare and community initiatives..."
                        className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Secure PDF Upload & URL */}
                  <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#D8CEBE] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#244A3A] flex items-center gap-1.5">
                        <Upload className="w-4 h-4 text-[#B58A4A]" />
                        <span>{lang === 'mr' ? 'सुरक्षित पीडीएफ अपलोड (PDF Document - कमाल १५ MB)' : 'Secure PDF Upload (Max 15MB)'}</span>
                      </label>
                      {repPdfUrl && repPdfUrl !== '#' && (
                        <div className="flex items-center gap-2">
                          <a
                            href={repPdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#244A3A] font-semibold hover:underline bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                          >
                            <ExternalLink className="w-3 h-3 text-[#244A3A]" />
                            <span>{lang === 'mr' ? 'अपलोड केलेली PDF पहा' : 'View Uploaded PDF'}</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => setRepPdfUrl('')}
                            className="text-xs text-[#8F3426] hover:underline cursor-pointer"
                            title={lang === 'mr' ? 'PDF लिंक काढा' : 'Remove PDF Link'}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        disabled={isUploadingPdf}
                        onChange={handlePdfUpload}
                        className="text-xs text-[#55635B] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#244A3A] file:text-white hover:file:bg-[#183328] file:cursor-pointer cursor-pointer"
                      />
                      {isUploadingPdf && (
                        <div className="flex items-center gap-2 text-xs text-[#244A3A] font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{lang === 'mr' ? `अपलोड होत आहे... (${pdfUploadProgress}%)` : `Uploading... (${pdfUploadProgress}%)`}</span>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-[#E2DACB]">
                      <label className="block text-[11px] font-semibold text-[#55635B] mb-1">
                        {lang === 'mr' ? 'किंवा थेट सर्व्हर PDF URL (Manual / Server URL):' : 'Or direct PDF URL (Manual / Server URL):'}
                      </label>
                      <input
                        type="text"
                        value={repPdfUrl}
                        onChange={(e) => setRepPdfUrl(e.target.value)}
                        placeholder="https://... किंवा /backend-php-mysql/uploads/reports/..."
                        className="w-full px-3 py-1.5 text-xs bg-white border border-[#D8CEBE] rounded-lg focus:outline-hidden focus:border-[#244A3A]"
                      />
                    </div>
                  </div>

                  {/* Optional Report Cover Image Upload */}
                  <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#D8CEBE] space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-xs font-bold text-[#244A3A] flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#B58A4A]" />
                        <span>{lang === 'mr' ? 'अहवाल कव्हर फोटो (Cover Image - ऐच्छिक)' : 'Report Cover Image (Optional)'}</span>
                      </label>
                      {repCoverUrl && (
                        <div className="flex items-center gap-2">
                          <img
                            src={repCoverUrl}
                            alt="Cover Preview"
                            className="w-8 h-8 object-cover rounded border border-[#D8CEBE]"
                          />
                          <button
                            type="button"
                            onClick={() => setRepCoverUrl('')}
                            className="text-xs text-[#8F3426] hover:underline cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingReportCover}
                        onChange={handleReportCoverUpload}
                        className="text-xs text-[#55635B] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#244A3A] file:text-white hover:file:bg-[#183328] file:cursor-pointer cursor-pointer"
                      />
                      {isUploadingReportCover && (
                        <div className="flex items-center gap-2 text-xs text-[#244A3A] font-medium">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{lang === 'mr' ? 'फोटो अपलोड होत आहे...' : 'Uploading image...'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Published Checkbox Toggle */}
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="repPublishedCheckbox"
                      checked={repPublished}
                      onChange={(e) => setRepPublished(e.target.checked)}
                      className="w-4 h-4 rounded text-[#244A3A] border-[#D8CEBE] focus:ring-[#244A3A] cursor-pointer"
                    />
                    <label htmlFor="repPublishedCheckbox" className="text-xs font-bold text-[#244A3A] cursor-pointer">
                      {lang === 'mr' ? 'वेबसाईटवर प्रकाशित करा (Publish on Website)' : 'Publish on Website'}
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={isSavingReport}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSavingReport ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Plus className="w-4 h-4 text-[#B58A4A]" />
                    )}
                    <span>
                      {isSavingReport
                        ? (lang === 'mr' ? 'जतन करत आहे...' : 'Saving...')
                        : editingReportId
                        ? (lang === 'mr' ? 'अहवाल अद्ययावत करा (Update)' : 'Update Report')
                        : (lang === 'mr' ? 'नवीन अहवाल जोडा' : 'Add Report')}
                    </span>
                  </button>
                </form>

                {/* Reports Listing in Admin */}
                <div className="pt-6 border-t border-[#E2DACB] space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-serif font-bold text-[#244A3A]">
                      {lang === 'mr' ? `उपलब्ध अहवाल (${state.reports.length})` : `Available Reports (${state.reports.length})`}
                    </h3>
                  </div>

                  {state.reports.length === 0 ? (
                    <p className="text-xs text-[#55635B] py-3 text-center">
                      {lang === 'mr' ? 'कोणताही अहवाल उपलब्ध नाही.' : 'No reports available.'}
                    </p>
                  ) : (
                    state.reports.map((r) => {
                      const isPublished = r.published !== false;
                      const isToggling = isTogglingPublishReportId === r.id;
                      const isDeleting = isDeletingReportId === r.id;

                      return (
                        <div
                          key={r.id}
                          className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-[#244A3A]/40 transition-colors"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {r.coverImageUrl ? (
                              <img
                                src={r.coverImageUrl}
                                alt={r.title}
                                className="w-12 h-14 object-cover rounded-lg border border-[#D8CEBE] shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-white rounded-lg border border-[#D8CEBE] flex items-center justify-center shrink-0 text-[#244A3A]">
                                <FileText className="w-5 h-5 text-[#B58A4A]" />
                              </div>
                            )}

                            <div className="min-w-0 space-y-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <h4 className="font-serif font-bold text-sm text-[#244A3A] truncate">
                                  {r.title}
                                </h4>
                                {r.titleEn && r.titleEn !== r.title && (
                                  <span className="text-xs text-[#55635B] truncate">
                                    ({r.titleEn})
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#55635B]">
                                <span className="px-2 py-0.5 rounded bg-white border border-[#D8CEBE] font-medium">
                                  {r.period}
                                </span>
                                {r.category && (
                                  <span className="px-2 py-0.5 rounded bg-[#EAF2EC] text-[#244A3A] font-medium">
                                    {r.category}
                                  </span>
                                )}
                                <span className="text-[11px] text-[#55635B]">{r.fileSize || 'PDF'}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    isPublished
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {isPublished
                                    ? (lang === 'mr' ? 'प्रकाशित' : 'Published')
                                    : (lang === 'mr' ? 'मसुदा (Draft)' : 'Draft')}
                                </span>
                              </div>

                              {r.summary && (
                                <p className="text-xs text-[#55635B] line-clamp-1 max-w-xl">
                                  {r.summary}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end md:self-auto shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E2DACB]/60 w-full md:w-auto justify-end">
                            {/* View / Download PDF Link */}
                            {r.pdfPlaceholderUrl && r.pdfPlaceholderUrl !== '#' && (
                              <a
                                href={r.pdfPlaceholderUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer"
                                title={lang === 'mr' ? 'PDF पहा / डाऊनलोड करा' : 'View / Download PDF'}
                              >
                                <Download className="w-4 h-4 text-[#244A3A]" />
                              </a>
                            )}

                            {/* Publish / Unpublish Toggle */}
                            <button
                              type="button"
                              disabled={isToggling}
                              onClick={() => handleTogglePublishReport(r)}
                              className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer disabled:opacity-40"
                              title={
                                isPublished
                                  ? (lang === 'mr' ? 'अप्रकाशित करा (Draft)' : 'Unpublish')
                                  : (lang === 'mr' ? 'प्रकाशित करा' : 'Publish')
                              }
                            >
                              {isToggling ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#244A3A]" />
                              ) : isPublished ? (
                                <Eye className="w-4 h-4 text-[#244A3A]" />
                              ) : (
                                <EyeOff className="w-4 h-4 text-[#8F3426]" />
                              )}
                            </button>

                            {/* Edit */}
                            <button
                              type="button"
                              onClick={() => startEditReport(r)}
                              className="p-2 text-[#244A3A] hover:bg-white rounded-lg cursor-pointer"
                              title={lang === 'mr' ? 'संपादित करा' : 'Edit'}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteReport(r.id)}
                              className="p-2 text-[#8F3426] hover:bg-[#FBECE9] rounded-lg cursor-pointer disabled:opacity-40"
                              title={lang === 'mr' ? 'हटवा' : 'Delete'}
                            >
                              {isDeleting ? (
                                <Loader2 className="w-4 h-4 animate-spin text-[#8F3426]" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB 8: SITE SETTINGS & HOMEPAGE SECTIONS
          ================================================================ */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#244A3A] text-[#B58A4A] flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold text-[#244A3A]">
                      {lang === 'mr' ? 'वेबसाईट मुख्य सेटिंग्ज (Site Settings)' : 'Homepage & Site Settings'}
                    </h2>
                    <p className="text-xs text-[#55635B]">
                      {lang === 'mr'
                        ? 'मुख्यपृष्ठावरील टॅगलाईन, बॅज आणि ठळक आकडेवारी थेट बदला.'
                        : 'Manage dynamic hero badge, tagline, and homepage impact metrics directly.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Hero Badge Setting */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-[#244A3A]">
                    {lang === 'mr' ? '१. मुख्यपृष्ठ बॅज (Hero Badge)' : '1. Hero Top Badge'}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">key: hero_badge</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'बॅज मजकूर (मराठी)' : 'Badge Text (Marathi)'}
                    </label>
                    <input
                      type="text"
                      value={heroBadgeMr}
                      onChange={(e) => setHeroBadgeMr(e.target.value)}
                      placeholder="उदा. ग्रामीण परिवर्तन आणि लोककल्याण"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'बॅज मजकूर (English)' : 'Badge Text (English)'}
                    </label>
                    <input
                      type="text"
                      value={heroBadgeEn}
                      onChange={(e) => setHeroBadgeEn(e.target.value)}
                      placeholder="e.g. Rural Transformation & Public Welfare"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSavingSettingKey === 'hero_badge'}
                  onClick={() =>
                    handleSaveSetting(
                      'hero_badge',
                      heroBadgeMr,
                      heroBadgeEn,
                      'Homepage top hero badge text'
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettingKey === 'hero_badge' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B58A4A]" />
                  ) : null}
                  <span>{lang === 'mr' ? 'बॅज जतन करा' : 'Save Badge'}</span>
                </button>
              </div>

              {/* 2. Sanstha Tagline Setting */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-[#244A3A]">
                    {lang === 'mr' ? '२. संस्थेची मुख्य टॅगलाईन (Tagline)' : '2. Sanstha Main Tagline'}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">key: sanstha_tagline</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'टॅगलाईन (मराठी)' : 'Tagline (Marathi)'}
                    </label>
                    <input
                      type="text"
                      value={taglineMr}
                      onChange={(e) => setTaglineMr(e.target.value)}
                      placeholder="उदा. नादरपूर व परिसरातील सर्वांगीण विकासासाठी कटिबद्ध"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'टॅगलाईन (English)' : 'Tagline (English)'}
                    </label>
                    <input
                      type="text"
                      value={taglineEn}
                      onChange={(e) => setTaglineEn(e.target.value)}
                      placeholder="e.g. Committed to holistic development in Nadarpur and surrounding villages"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSavingSettingKey === 'sanstha_tagline'}
                  onClick={() =>
                    handleSaveSetting(
                      'sanstha_tagline',
                      taglineMr,
                      taglineEn,
                      'Primary Sanstha tagline'
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettingKey === 'sanstha_tagline' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B58A4A]" />
                  ) : null}
                  <span>{lang === 'mr' ? 'टॅगलाईन जतन करा' : 'Save Tagline'}</span>
                </button>
              </div>

              {/* 3. Beneficiaries Stat Setting */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-[#244A3A]">
                    {lang === 'mr' ? '३. एकूण लाभार्थी आकडेवारी (Beneficiaries Metric)' : '3. Beneficiaries Metric'}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">key: hero_stats_beneficiaries</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'आकडा (मराठी)' : 'Metric Value (Marathi)'}
                    </label>
                    <input
                      type="text"
                      value={statsBeneficiariesMr}
                      onChange={(e) => setStatsBeneficiariesMr(e.target.value)}
                      placeholder="उदा. २५,०००+"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'आकडा (English)' : 'Metric Value (English)'}
                    </label>
                    <input
                      type="text"
                      value={statsBeneficiariesEn}
                      onChange={(e) => setStatsBeneficiariesEn(e.target.value)}
                      placeholder="e.g. 25,000+"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSavingSettingKey === 'hero_stats_beneficiaries'}
                  onClick={() =>
                    handleSaveSetting(
                      'hero_stats_beneficiaries',
                      statsBeneficiariesMr,
                      statsBeneficiariesEn,
                      'Total rural beneficiaries count'
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettingKey === 'hero_stats_beneficiaries' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B58A4A]" />
                  ) : null}
                  <span>{lang === 'mr' ? 'लाभार्थी संख्या जतन करा' : 'Save Beneficiaries Stat'}</span>
                </button>
              </div>

              {/* 4. Covered Villages Stat Setting */}
              <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-serif font-bold text-[#244A3A]">
                    {lang === 'mr' ? '४. समाविष्ट गावे आकडेवारी (Villages Metric)' : '4. Villages Metric'}
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">key: hero_stats_villages</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'आकडा (मराठी)' : 'Metric Value (Marathi)'}
                    </label>
                    <input
                      type="text"
                      value={statsVillagesMr}
                      onChange={(e) => setStatsVillagesMr(e.target.value)}
                      placeholder="उदा. १००+"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      {lang === 'mr' ? 'आकडा (English)' : 'Metric Value (English)'}
                    </label>
                    <input
                      type="text"
                      value={statsVillagesEn}
                      onChange={(e) => setStatsVillagesEn(e.target.value)}
                      placeholder="e.g. 100+"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSavingSettingKey === 'hero_stats_villages'}
                  onClick={() =>
                    handleSaveSetting(
                      'hero_stats_villages',
                      statsVillagesMr,
                      statsVillagesEn,
                      'Total covered villages count'
                    )
                  }
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettingKey === 'hero_stats_villages' ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B58A4A]" />
                  ) : null}
                  <span>{lang === 'mr' ? 'गावे संख्या जतन करा' : 'Save Villages Stat'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              TAB: PAGES & SECTIONS CMS
          ================================================================ */}
          {activeTab === 'pages' && (
            <PagesSectionsModule lang={lang} showToast={showToast} />
          )}

          {/* ================================================================
              TAB: MEDIA ASSET LIBRARY
          ================================================================ */}
          {activeTab === 'media' && (
            <MediaLibraryModule lang={lang} showToast={showToast} />
          )}
        </main>
      </div>

      {/* Compact Video Preview Modal in Admin */}
      {previewVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setPreviewVideo(null)}
        >
          <div
            className="bg-white border border-[#D8CEBE] rounded-2xl overflow-hidden max-w-xl w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#244A3A] text-white flex items-center justify-between">
              <span className="text-xs sm:text-sm font-serif font-bold truncate pr-4">
                {previewVideo.title}
              </span>
              <button
                onClick={() => setPreviewVideo(null)}
                className="p-1 text-white hover:text-[#B58A4A] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative aspect-video bg-black flex items-center justify-center">
              {isYouTubeUrl(previewVideo.videoUrl) ? (
                <iframe
                  src={getYouTubeEmbedUrl(previewVideo.videoUrl, true) || ''}
                  title={previewVideo.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <>
                  <video
                    key={previewVideo.videoUrl || previewVideo.id}
                    src={previewVideo.videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedData={() => setAdminPreviewLoading(false)}
                    onCanPlay={() => setAdminPreviewLoading(false)}
                    onError={() => {
                      setAdminPreviewLoading(false);
                      setAdminPreviewError(true);
                    }}
                    className={`w-full h-full ${adminPreviewError ? 'hidden' : 'block'}`}
                  />

                  {adminPreviewLoading && !adminPreviewError && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center space-y-2 pointer-events-none z-10">
                      <Loader2 className="w-8 h-8 text-[#B58A4A] animate-spin" />
                      <span className="text-xs text-white/90 font-sans">
                        {lang === 'mr' ? 'व्हिडिओ लोड होत आहे...' : 'Loading video...'}
                      </span>
                    </div>
                  )}

                  {adminPreviewError && (
                    <div className="absolute inset-0 bg-[#14261C] p-6 flex flex-col items-center justify-center text-center space-y-3 z-10 animate-in fade-in duration-200">
                      <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 max-w-sm">
                        <p className="text-sm font-semibold text-[#FAF7EE] font-serif">
                          {lang === 'mr'
                            ? 'व्हिडिओ लोड करता आला नाही. लिंक तपासा किंवा दुसरी लिंक वापरा.'
                            : 'Unable to load the video. Check the URL or try another link.'}
                        </p>
                        <p className="text-xs text-[#D8E6DE] font-sans leading-relaxed">
                          {lang === 'mr'
                            ? 'व्हिडिओ स्त्रोत अनुपलब्ध, प्रतिबंधित किंवा फॉरमॅट असमर्थित असू शकतो.'
                            : 'The video stream may be unavailable, restricted, or in an unsupported format.'}
                        </p>
                      </div>
                      {previewVideo.videoUrl && isValidHttpUrl(previewVideo.videoUrl) && (
                        <a
                          href={previewVideo.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#B58A4A] hover:bg-[#9E7438] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{lang === 'mr' ? 'थेट लिंक उघडा' : 'Open Video Link'}</span>
                        </a>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: CONTACT INQUIRY DETAIL
      ================================================================ */}
      {selectedInquiry && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedInquiry(null)}
        >
          <div
            className="bg-white border border-[#D8CEBE] rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#244A3A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <MailOpen className="w-4 h-4 text-[#D8E6DE]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                    {lang === 'mr' ? 'संपर्क संदेश तपशील' : 'Inquiry Details'}
                  </h3>
                  <p className="text-[11px] text-[#A3B899]">
                    ID: #{selectedInquiry.id} • {selectedInquiry.createdAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto">
              {/* Sender Info Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB]">
                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'प्रेषक / नाव' : 'Sender Name'}
                  </span>
                  <span className="text-sm font-serif font-bold text-[#244A3A] flex items-center gap-1.5 mt-0.5">
                    <User className="w-4 h-4 text-[#B58A4A] shrink-0" />
                    <span>{selectedInquiry.fullName}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'संपर्क माहिती' : 'Contact Detail'}
                  </span>
                  <div className="text-sm font-semibold text-[#14261C] mt-0.5 flex items-center gap-1.5">
                    {selectedInquiry.contactDetail.includes('@') ? (
                      <a
                        href={`mailto:${selectedInquiry.contactDetail}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`}
                        className="text-[#244A3A] hover:text-[#B58A4A] underline flex items-center gap-1 truncate"
                        title={lang === 'mr' ? 'ईमेल पाठवा' : 'Send email'}
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{selectedInquiry.contactDetail}</span>
                      </a>
                    ) : (
                      <a
                        href={`tel:${selectedInquiry.contactDetail}`}
                        className="text-[#244A3A] hover:text-[#B58A4A] underline flex items-center gap-1"
                        title={lang === 'mr' ? 'कॉल करा' : 'Call phone'}
                      >
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{selectedInquiry.contactDetail}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'स्थिती' : 'Status'}
                  </span>
                  <div className="mt-1">
                    {selectedInquiry.status === 'new' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                        {lang === 'mr' ? 'न वाचलेले (Unread)' : 'Unread'}
                      </span>
                    ) : selectedInquiry.status === 'read' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        {lang === 'mr' ? 'वाचलेले (Read)' : 'Read'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        {selectedInquiry.status}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'नोंदणी तारीख' : 'Date & Time'}
                  </span>
                  <span className="text-xs text-[#55635B] flex items-center gap-1.5 mt-1 font-sans">
                    <Clock className="w-3.5 h-3.5 text-[#55635B] shrink-0" />
                    <span>{selectedInquiry.createdAt}</span>
                  </span>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#55635B] uppercase tracking-wider block">
                  {lang === 'mr' ? 'विषय / Subject' : 'Subject'}
                </span>
                <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] font-serif font-bold text-sm text-[#244A3A]">
                  {selectedInquiry.subject}
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#55635B] uppercase tracking-wider block">
                  {lang === 'mr' ? 'संदेश मजकूर / Message' : 'Message'}
                </span>
                <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] text-sm text-[#14261C] leading-relaxed whitespace-pre-wrap font-sans min-h-[120px]">
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-[#F5EFE6] border-t border-[#E2DACB] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleInquiryStatus(selectedInquiry)}
                  disabled={isUpdatingInquiryStatus === selectedInquiry.id}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF8F3] border border-[#D8CEBE] text-xs font-semibold text-[#244A3A] rounded-xl transition-colors cursor-pointer"
                >
                  {isUpdatingInquiryStatus === selectedInquiry.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : selectedInquiry.status === 'new' ? (
                    <MailOpen className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <Mail className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span>
                    {selectedInquiry.status === 'new'
                      ? lang === 'mr'
                        ? 'वाचलेले म्हणून नोंदवा'
                        : 'Mark as Read'
                      : lang === 'mr'
                      ? 'न वाचलेले म्हणून नोंदवा'
                      : 'Mark as Unread'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    const item = selectedInquiry;
                    setSelectedInquiry(null);
                    setInquiryToDelete(item);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-700 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'हटवा' : 'Delete'}</span>
                </button>
              </div>

              <button
                onClick={() => setSelectedInquiry(null)}
                className="px-4 py-2 bg-[#244A3A] hover:bg-[#1B3A2D] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: DELETE INQUIRY CONFIRMATION
      ================================================================ */}
      {inquiryToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingInquiry) setInquiryToDelete(null);
          }}
        >
          <div
            className="bg-white border border-red-200 rounded-2xl overflow-hidden max-w-md w-full shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif font-bold text-lg text-[#244A3A]">
                {lang === 'mr' ? 'हा संदेश हटवायचा आहे का?' : 'Delete This Inquiry?'}
              </h3>
              <p className="text-xs text-[#55635B] leading-relaxed">
                {lang === 'mr'
                  ? `"${inquiryToDelete.fullName}" यांच्याकडून आलेला संदेश (विषय: "${inquiryToDelete.subject}") कायमचा हटवला जाईल. ही क्रिया पूर्ववत करता येणार नाही.`
                  : `The message from "${inquiryToDelete.fullName}" (Subject: "${inquiryToDelete.subject}") will be permanently deleted. This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2DACB]">
              <button
                onClick={() => setInquiryToDelete(null)}
                disabled={isDeletingInquiry}
                className="px-4 py-2 bg-white hover:bg-[#FAF8F3] border border-[#D8CEBE] text-xs font-semibold text-[#55635B] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmDeleteInquiry}
                disabled={isDeletingInquiry}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingInquiry ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'mr' ? 'हटवत आहे...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'होय, हटवा' : 'Yes, Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: VOLUNTEER REGISTRATION DETAIL & WORKFLOW
      ================================================================ */}
      {selectedVolunteer && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedVolunteer(null)}
        >
          <div
            className="bg-white border border-[#D8CEBE] rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 bg-[#244A3A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <HeartHandshake className="w-4 h-4 text-[#D8E6DE]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-serif font-bold text-white">
                    {lang === 'mr' ? 'स्वयंसेवक नोंदणी तपशील' : 'Volunteer Application Details'}
                  </h3>
                  <p className="text-[11px] text-[#A3B899]">
                    Ref: #VOL-{selectedVolunteer.id} • {selectedVolunteer.createdAt}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVolunteer(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
              {/* Applicant Profile Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB]">
                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'पूर्ण नाव' : 'Full Name'}
                  </span>
                  <span className="text-sm font-serif font-bold text-[#244A3A] flex items-center gap-1.5 mt-0.5">
                    <User className="w-4 h-4 text-[#B58A4A] shrink-0" />
                    <span>{selectedVolunteer.fullName}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'मोबाईल क्रमांक' : 'Phone Number'}
                  </span>
                  <div className="text-sm font-semibold text-[#14261C] mt-0.5">
                    <a
                      href={`tel:${selectedVolunteer.phone}`}
                      className="text-[#244A3A] hover:text-[#B58A4A] underline flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#B58A4A] shrink-0" />
                      <span>{selectedVolunteer.phone}</span>
                    </a>
                  </div>
                </div>

                {selectedVolunteer.email && (
                  <div>
                    <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                      {lang === 'mr' ? 'ईमेल पत्ता' : 'Email'}
                    </span>
                    <a
                      href={`mailto:${selectedVolunteer.email}`}
                      className="text-xs text-[#244A3A] hover:text-[#B58A4A] underline flex items-center gap-1.5 mt-0.5 truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#B58A4A] shrink-0" />
                      <span>{selectedVolunteer.email}</span>
                    </a>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'पत्ता / गाव' : 'Location'}
                  </span>
                  <span className="text-xs text-[#244A3A] font-medium flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-[#B58A4A] shrink-0" />
                    <span>
                      {selectedVolunteer.village}, {selectedVolunteer.taluka}, {selectedVolunteer.district}
                    </span>
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'वयोगट व लिंग' : 'Age & Gender'}
                  </span>
                  <span className="text-xs text-[#244A3A] font-medium block mt-0.5">
                    {selectedVolunteer.ageBracket || '—'} {selectedVolunteer.gender ? `• ${selectedVolunteer.gender}` : ''}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'उपलब्धता' : 'Availability'}
                  </span>
                  <span className="text-xs font-semibold text-[#143B2A] block mt-0.5">
                    {selectedVolunteer.availability || 'लवचिक (Flexible)'}
                  </span>
                </div>
              </div>

              {/* Areas of Interest */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#55635B] uppercase tracking-wider block">
                  {lang === 'mr' ? 'निवडलेली कार्यक्षेत्रे (Areas of Interest)' : 'Areas of Interest'}
                </span>
                <div className="flex flex-wrap gap-2 p-3 bg-[#FAF8F3] rounded-xl border border-[#E2DACB]">
                  {selectedVolunteer.areasOfInterest.map((area, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white border border-[#C5DDCB] text-xs font-semibold text-[#143B2A] shadow-2xs"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Message / Motivation */}
              {selectedVolunteer.message && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[#55635B] uppercase tracking-wider block">
                    {lang === 'mr' ? 'संक्षिप्त संदेश / अनुभव' : 'Motivation / Message'}
                  </span>
                  <div className="p-3.5 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] text-xs sm:text-sm text-[#14261C] leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedVolunteer.message}
                  </div>
                </div>
              )}

              {/* Status Workflow Selector */}
              <div className="space-y-2 p-4 bg-[#EBF3EE] rounded-xl border border-[#C5DDCB]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#143B2A] uppercase tracking-wider">
                    {lang === 'mr' ? 'नोंदणी स्थिती बदला (Status Workflow)' : 'Update Status Workflow'}
                  </span>
                  <span className="text-xs font-mono font-bold text-[#143B2A]">
                    {lang === 'mr' ? 'सद्यस्थिती:' : 'Current:'} {selectedVolunteer.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(
                    [
                      { id: 'new', labelMr: 'नवीन (New)', labelEn: 'New' },
                      { id: 'reviewing', labelMr: 'तपासणी सुरू', labelEn: 'Reviewing' },
                      { id: 'approved', labelMr: 'मंजूर (Approved)', labelEn: 'Approved' },
                      { id: 'contacted', labelMr: 'संपर्क साधला', labelEn: 'Contacted' },
                      { id: 'declined', labelMr: 'अस्वीकृत', labelEn: 'Declined' },
                      { id: 'archived', labelMr: 'अभिलेखात', labelEn: 'Archived' },
                    ] as { id: VolunteerStatus; labelMr: string; labelEn: string }[]
                  ).map((st) => (
                    <button
                      key={st.id}
                      onClick={() => handleUpdateVolunteerStatus(selectedVolunteer, st.id, volunteerAdminNotesInput)}
                      disabled={isUpdatingVolunteerStatus === selectedVolunteer.id}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all border ${
                        selectedVolunteer.status === st.id
                          ? 'bg-[#143B2A] text-white border-[#143B2A] shadow-xs'
                          : 'bg-white text-[#244A3A] border-[#D5CFC2] hover:bg-[#FAF8F3]'
                      }`}
                    >
                      {lang === 'mr' ? st.labelMr : st.labelEn}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Notes Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#55635B] uppercase tracking-wider block">
                  {lang === 'mr' ? 'प्रशासकीय नोंदी (Internal Admin Notes)' : 'Internal Admin Notes'}
                </label>
                <textarea
                  rows={2}
                  value={volunteerAdminNotesInput}
                  onChange={(e) => setVolunteerAdminNotesInput(e.target.value)}
                  placeholder={
                    lang === 'mr'
                      ? 'उदा. दिनांक २२ रोजी फोनवरून चर्चा झाली; नादरपूर शिबिरात सहभागी होणार...'
                      : 'e.g. Spoke via phone; confirmed participation in upcoming camp...'
                  }
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-none focus:border-[#244A3A]"
                />
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateVolunteerStatus(
                      selectedVolunteer,
                      selectedVolunteer.status,
                      volunteerAdminNotesInput
                    )
                  }
                  disabled={isUpdatingVolunteerStatus === selectedVolunteer.id}
                  className="px-3.5 py-1.5 bg-[#244A3A] hover:bg-[#1B3A2D] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{lang === 'mr' ? 'नोंद जतन करा' : 'Save Notes'}</span>
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-[#F5EFE6] border-t border-[#E2DACB] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                onClick={() => {
                  const item = selectedVolunteer;
                  setSelectedVolunteer(null);
                  setVolunteerToDelete(item);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-xs font-semibold text-red-700 rounded-xl transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{lang === 'mr' ? 'नोंदणी हटवा' : 'Delete Application'}</span>
              </button>

              <button
                onClick={() => setSelectedVolunteer(null)}
                className="px-5 py-2 bg-[#244A3A] hover:bg-[#1B3A2D] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'बंद करा' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          MODAL: DELETE VOLUNTEER CONFIRMATION
      ================================================================ */}
      {volunteerToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeletingVolunteer) setVolunteerToDelete(null);
          }}
        >
          <div
            className="bg-white border border-red-200 rounded-2xl overflow-hidden max-w-md w-full shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif font-bold text-lg text-[#244A3A]">
                {lang === 'mr' ? 'ही स्वयंसेवक नोंदणी हटवायची आहे का?' : 'Delete This Volunteer Registration?'}
              </h3>
              <p className="text-xs text-[#55635B] leading-relaxed">
                {lang === 'mr'
                  ? `"${volunteerToDelete.fullName}" (मोबाईल: ${volunteerToDelete.phone}, गाव: ${volunteerToDelete.village}) यांची स्वयंसेवक नोंदणी (#VOL-${volunteerToDelete.id}) कायमची हटवली जाईल. ही क्रिया पूर्ववत करता येणार नाही.`
                  : `The volunteer registration for "${volunteerToDelete.fullName}" (Phone: ${volunteerToDelete.phone}, Ref: #VOL-${volunteerToDelete.id}) will be permanently deleted. This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2DACB]">
              <button
                onClick={() => setVolunteerToDelete(null)}
                disabled={isDeletingVolunteer}
                className="px-4 py-2 bg-white hover:bg-[#FAF8F3] border border-[#D8CEBE] text-xs font-semibold text-[#55635B] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmDeleteVolunteer}
                disabled={isDeletingVolunteer}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingVolunteer ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{lang === 'mr' ? 'हटवत आहे...' : 'Deleting...'}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'mr' ? 'होय, हटवा' : 'Yes, Delete'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
