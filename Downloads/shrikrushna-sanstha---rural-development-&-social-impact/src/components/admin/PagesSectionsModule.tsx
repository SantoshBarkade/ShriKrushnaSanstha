import React, { useState, useEffect } from 'react';
import { useSanstha } from '../../context/SansthaContext';
import { PageSectionItem } from '../../types';
import { ApiClient } from '../../services/apiClient';
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Upload,
  X,
  Layers,
  ArrowUpDown,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Globe,
} from 'lucide-react';

interface PagesSectionsModuleProps {
  lang: 'mr' | 'en';
  showToast: (msg: string) => void;
}

export const PagesSectionsModule: React.FC<PagesSectionsModuleProps> = ({
  lang,
  showToast,
}) => {
  const { state, addPageSection, updatePageSection, deletePageSection, updateSitePage } = useSanstha();

  const [selectedPageSlug, setSelectedPageSlug] = useState<string>('about');
  const [editingSection, setEditingSection] = useState<PageSectionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTogglingPublishId, setIsTogglingPublishId] = useState<number | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<PageSectionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Selected Page Metadata & SEO state
  const activePageItem = (state.sitePages || []).find((p) => p.slug === selectedPageSlug);
  const [pageTitleMr, setPageTitleMr] = useState<string>('');
  const [pageTitleEn, setPageTitleEn] = useState<string>('');
  const [pageMetaDescMr, setPageMetaDescMr] = useState<string>('');
  const [pageMetaDescEn, setPageMetaDescEn] = useState<string>('');
  const [isSavingPageMeta, setIsSavingPageMeta] = useState<boolean>(false);
  const [isPageMetaOpen, setIsPageMetaOpen] = useState<boolean>(false);

  useEffect(() => {
    if (activePageItem) {
      setPageTitleMr(activePageItem.titleMr || '');
      setPageTitleEn(activePageItem.titleEn || '');
      setPageMetaDescMr(activePageItem.metaDescriptionMr || '');
      setPageMetaDescEn(activePageItem.metaDescriptionEn || '');
    } else {
      setPageTitleMr('');
      setPageTitleEn('');
      setPageMetaDescMr('');
      setPageMetaDescEn('');
    }
  }, [selectedPageSlug, activePageItem]);

  const handleSavePageMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPageMeta(true);
    try {
      const res = await updateSitePage(selectedPageSlug, {
        titleMr: pageTitleMr.trim(),
        titleEn: pageTitleEn.trim(),
        metaDescriptionMr: pageMetaDescMr.trim(),
        metaDescriptionEn: pageMetaDescEn.trim(),
      });
      if (res.success) {
        showToast(
          lang === 'mr'
            ? 'पृष्ठ शीर्षक व एसईओ माहिती यशस्वीरित्या अद्ययावत केली!'
            : 'Page title and SEO metadata updated successfully!'
        );
      } else {
        showToast(
          res.error || (lang === 'mr' ? 'माहिती जतन करताना त्रुटी आली.' : 'Failed to save page metadata.')
        );
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'सर्व्हर त्रुटी आली.' : 'Server error occurred.'));
    } finally {
      setIsSavingPageMeta(false);
    }
  };

  // Form state
  const [formPageSlug, setFormPageSlug] = useState<string>('about');
  const [formSectionKey, setFormSectionKey] = useState<string>('');
  const [formTitleMr, setFormTitleMr] = useState<string>('');
  const [formTitleEn, setFormTitleEn] = useState<string>('');
  const [formSubtitleMr, setFormSubtitleMr] = useState<string>('');
  const [formSubtitleEn, setFormSubtitleEn] = useState<string>('');
  const [formContentMr, setFormContentMr] = useState<string>('');
  const [formContentEn, setFormContentEn] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string>('');
  const [formImageAltMr, setFormImageAltMr] = useState<string>('');
  const [formImageAltEn, setFormImageAltEn] = useState<string>('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(0);
  const [formIsPublished, setFormIsPublished] = useState<boolean>(true);

  const pagesList = [
    { slug: 'about', labelMr: 'संस्थेविषयी पृष्ठ (About Us)', labelEn: 'About Us Page' },
    { slug: 'privacy', labelMr: 'गोपनीयता धोरण (Privacy Policy)', labelEn: 'Privacy Policy Page' },
    { slug: 'work', labelMr: 'कार्यस्तंभ (Work Pillars)', labelEn: 'Work Pillars' },
    { slug: 'home', labelMr: 'मुख्यपृष्ठ विभाग (Home Sections)', labelEn: 'Home Page Sections' },
  ];

  interface BuiltinHomePreset {
    key: string;
    nameMr: string;
    nameEn: string;
    defaultTitleMr: string;
    defaultTitleEn: string;
    defaultSubtitleMr: string;
    defaultSubtitleEn: string;
    defaultContentMr: string;
    defaultContentEn: string;
    displayOrder: number;
  }

  const BUILTIN_HOME_PRESETS: BuiltinHomePreset[] = [
    {
      key: 'identity',
      nameMr: 'संस्थेची ओळख (Our Identity)',
      nameEn: 'Our Identity',
      defaultTitleMr: 'ग्रामीण विकासासाठी समर्पित संस्था',
      defaultTitleEn: 'An Institution Dedicated to Rural Transformation',
      defaultSubtitleMr: 'आमची ओळख',
      defaultSubtitleEn: 'Our Identity',
      defaultContentMr:
        'नादरपूर व परिसरातील ग्रामीण भागात शिक्षण, कला-संस्कृती, आरोग्य, पर्यावरण आणि सामाजिक विकास यासाठी कार्य करणारी एक सेवाभावी संस्था. स्थानिक समुदायासोबत सहकार्याने शाश्वत विकासाच्या उपक्रमांवर आमचा भर आहे.',
      defaultContentEn:
        'A public welfare organization working tirelessly across Nadarpur and surrounding rural regions for education, arts & culture, public health, environment, and social upliftment through active community cooperation.',
      displayOrder: 10,
    },
    {
      key: 'mission',
      nameMr: 'संस्थेचे ध्येय (Mission Quote)',
      nameEn: 'Mission Quote',
      defaultTitleMr: 'संस्थेचे ध्येय',
      defaultTitleEn: 'Sanstha Mission',
      defaultSubtitleMr: 'ध्येय धोरण',
      defaultSubtitleEn: 'Mission & Vision',
      defaultContentMr:
        '“संस्कृतीचे जतन, शिक्षणाचा प्रसार, आणि समृद्ध ग्रामीण विकास हीच आमची दिशा.”',
      defaultContentEn:
        '“Preserving culture, advancing education, and fostering sustainable rural progress is our core direction.”',
      displayOrder: 20,
    },
    {
      key: 'join_cta',
      nameMr: 'सहभाग आवाहन (Join CTA)',
      nameEn: 'Join Call-to-Action',
      defaultTitleMr: 'आपणही या परिवर्तनाच्या प्रवासाचा भाग व्हा',
      defaultTitleEn: 'Become Part of this Journey of Transformation',
      defaultSubtitleMr: 'सहकार्य आवाहन',
      defaultSubtitleEn: 'Call for Cooperation',
      defaultContentMr:
        'शिक्षण, आरोग्य, संस्कृती आणि ग्रामीण विकासासाठी आमच्यासोबत हातमिळवणी करा.',
      defaultContentEn:
        'Join hands with us for education, healthcare, cultural heritage, and rural empowerment.',
      displayOrder: 30,
    },
  ];

  const uncustomizedHomePresets =
    selectedPageSlug === 'home'
      ? BUILTIN_HOME_PRESETS.filter(
          (preset) =>
            !(state.pageSections || []).some(
              (s) =>
                s.pageSlug === 'home' &&
                (s.sectionKey === preset.key ||
                  (preset.key === 'identity' && s.sectionKey === 'about_sanstha') ||
                  (preset.key === 'join_cta' && s.sectionKey === 'cta'))
            )
        )
      : [];

  // Filter sections by active page slug and sort by display order
  const currentSections = (state.pageSections || [])
    .filter((s) => s.pageSlug === selectedPageSlug)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const resetForm = () => {
    setEditingSection(null);
    setFormPageSlug(selectedPageSlug);
    setFormSectionKey('');
    setFormTitleMr('');
    setFormTitleEn('');
    setFormSubtitleMr('');
    setFormSubtitleEn('');
    setFormContentMr('');
    setFormContentEn('');
    setFormImageUrl('');
    setFormImageAltMr('');
    setFormImageAltEn('');
    setFormDisplayOrder(currentSections.length * 10);
    setFormIsPublished(true);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (sec: PageSectionItem) => {
    setEditingSection(sec);
    setFormPageSlug(sec.pageSlug);
    setFormSectionKey(sec.sectionKey);
    setFormTitleMr(sec.titleMr || '');
    setFormTitleEn(sec.titleEn || '');
    setFormSubtitleMr(sec.subtitleMr || '');
    setFormSubtitleEn(sec.subtitleEn || '');
    setFormContentMr(sec.contentMr || '');
    setFormContentEn(sec.contentEn || '');
    setFormImageUrl(sec.imageUrl || '');
    setFormImageAltMr(sec.imageAltMr || '');
    setFormImageAltEn(sec.imageAltEn || '');
    setFormDisplayOrder(sec.displayOrder || 0);
    setFormIsPublished(sec.isPublished);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast(lang === 'mr' ? 'प्रतिमेचा आकार १० MB पेक्षा कमी असावा.' : 'Image size must be under 10MB.');
      return;
    }

    setIsUploadingImage(true);
    try {
      const res = await ApiClient.uploadImage(file, undefined, 'pages');
      setFormImageUrl(res.url);
      showToast(lang === 'mr' ? 'प्रतिमा यशस्वीरित्या अपलोड झाली!' : 'Image uploaded successfully!');
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'प्रतिमा अपलोड अयशस्वी.' : 'Image upload failed.'));
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitleMr.trim()) {
      showToast(lang === 'mr' ? 'कृपया मराठी शीर्षक प्रविष्ट करा.' : 'Please enter Marathi title.');
      return;
    }
    if (!formTitleEn.trim()) {
      showToast(lang === 'mr' ? 'कृपया इंग्रजी शीर्षक प्रविष्ट करा.' : 'Please enter English title.');
      return;
    }
    if (!formContentMr.trim()) {
      showToast(lang === 'mr' ? 'कृपया मराठी मजकूर प्रविष्ट करा.' : 'Please enter Marathi content.');
      return;
    }
    if (!formContentEn.trim()) {
      showToast(lang === 'mr' ? 'कृपया इंग्रजी मजकूर प्रविष्ट करा.' : 'Please enter English content.');
      return;
    }

    const sectionKeyFinal =
      formSectionKey.trim() ||
      `${formPageSlug}_sec_${Date.now().toString(36)}`;

    setIsSaving(true);
    try {
      if (editingSection) {
        const res = await updatePageSection(editingSection.id, {
          pageSlug: formPageSlug,
          sectionKey: sectionKeyFinal,
          titleMr: formTitleMr.trim(),
          titleEn: formTitleEn.trim(),
          subtitleMr: formSubtitleMr.trim(),
          subtitleEn: formSubtitleEn.trim(),
          contentMr: formContentMr.trim(),
          contentEn: formContentEn.trim(),
          imageUrl: formImageUrl.trim(),
          imageAltMr: formImageAltMr.trim(),
          imageAltEn: formImageAltEn.trim(),
          displayOrder: Number(formDisplayOrder) || 0,
          isPublished: formIsPublished,
        });

        if (res.success) {
          showToast(lang === 'mr' ? 'विभाग यशस्वीरित्या अद्ययावत केला!' : 'Section updated successfully!');
          setIsModalOpen(false);
        } else {
          showToast(res.error || (lang === 'mr' ? 'विभाग जतन करताना त्रुटी आली.' : 'Failed to save section.'));
        }
      } else {
        const res = await addPageSection({
          pageSlug: formPageSlug,
          sectionKey: sectionKeyFinal,
          titleMr: formTitleMr.trim(),
          titleEn: formTitleEn.trim(),
          subtitleMr: formSubtitleMr.trim(),
          subtitleEn: formSubtitleEn.trim(),
          contentMr: formContentMr.trim(),
          contentEn: formContentEn.trim(),
          imageUrl: formImageUrl.trim(),
          imageAltMr: formImageAltMr.trim(),
          imageAltEn: formImageAltEn.trim(),
          displayOrder: Number(formDisplayOrder) || 0,
          isPublished: formIsPublished,
        });

        if (res.success) {
          showToast(lang === 'mr' ? 'नवीन विभाग यशस्वीरित्या जोडला!' : 'New section added successfully!');
          setIsModalOpen(false);
        } else {
          showToast(res.error || (lang === 'mr' ? 'विभाग जोडताना त्रुटी आली.' : 'Failed to add section.'));
        }
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (sec: PageSectionItem) => {
    setIsTogglingPublishId(sec.id);
    try {
      const nextStatus = !sec.isPublished;
      const res = await updatePageSection(sec.id, { isPublished: nextStatus });
      if (res.success) {
        showToast(
          lang === 'mr'
            ? nextStatus
              ? 'विभाग प्रकाशित केला गेला.'
              : 'विभाग अप्रकाशित (ड्राफ्ट) केला गेला.'
            : nextStatus
              ? 'Section published successfully.'
              : 'Section set to draft.'
        );
      } else {
        showToast(res.error || (lang === 'mr' ? 'स्थिती बदलता आली नाही.' : 'Failed to update status.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsTogglingPublishId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!sectionToDelete) return;
    setIsDeleting(true);
    try {
      const res = await deletePageSection(sectionToDelete.id);
      if (res.success) {
        showToast(lang === 'mr' ? 'विभाग यशस्वीरित्या हटवला.' : 'Section deleted successfully.');
        setSectionToDelete(null);
      } else {
        showToast(res.error || (lang === 'mr' ? 'विभाग हटवता आला नाही.' : 'Failed to delete section.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Page Selector */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#244A3A]">
              {lang === 'mr' ? 'पृष्ठे व विभाग व्यवस्थापन (CMS)' : 'Pages & Sections CMS'}
            </h2>
            <p className="text-xs sm:text-sm text-[#55635B] mt-1">
              {lang === 'mr'
                ? 'संस्थेच्या संकेतस्थळावरील प्रमुख पृष्ठे (संस्थेविषयी, गोपनीयता धोरण, कार्यस्तंभ इत्यादी) मधील विभाग संपादित करा.'
                : 'Manage and update dynamic bilingual sections for About, Privacy Policy, Work Pillars, and Home pages.'}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#244A3A] hover:bg-[#183328] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-[#B58A4A]" />
            <span>{lang === 'mr' ? 'नवीन विभाग जोडा' : 'Add New Section'}</span>
          </button>
        </div>

        {/* Page Selector Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F2ECE1]">
          {pagesList.map((p) => {
            const active = selectedPageSlug === p.slug;
            const count = (state.pageSections || []).filter((s) => s.pageSlug === p.slug).length;

            return (
              <button
                key={p.slug}
                onClick={() => setSelectedPageSlug(p.slug)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  active
                    ? 'bg-[#244A3A] text-white shadow-xs'
                    : 'bg-[#FAF8F3] text-[#3B4540] border border-[#E2DACB] hover:bg-[#F2ECE1]'
                }`}
              >
                <span>{lang === 'mr' ? p.labelMr : p.labelEn}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-[#B58A4A] text-white' : 'bg-[#E2DACB] text-[#244A3A]'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Title & SEO Metadata Card */}
      <div className="bg-white rounded-2xl border border-[#E2DACB] overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => setIsPageMetaOpen((prev) => !prev)}
          className="w-full px-5 sm:px-6 py-4 flex items-center justify-between text-left hover:bg-[#FAF8F3] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-[#B58A4A]" />
            <div>
              <span className="text-xs sm:text-sm font-serif font-bold text-[#244A3A] block">
                {lang === 'mr' ? 'पृष्ठ शीर्षक व एसईओ वर्णन (Page SEO & Meta)' : 'Page Title & SEO Meta Description'}
              </span>
              <span className="text-[11px] text-[#55635B]">
                {lang === 'mr'
                  ? `निवडलेले पृष्ठ: ${selectedPageSlug} | ब्राऊझर टायटल व सर्च इंजिन वर्णन संपादित करा`
                  : `Selected page: ${selectedPageSlug} | Manage browser title and search engine description`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#244A3A]">
            <span>{isPageMetaOpen ? (lang === 'mr' ? 'बंद करा' : 'Collapse') : (lang === 'mr' ? 'संपादित करा' : 'Edit')}</span>
            {isPageMetaOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isPageMetaOpen && (
          <form onSubmit={handleSavePageMeta} className="px-5 sm:px-6 pb-6 pt-2 border-t border-[#F2ECE1] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#244A3A] mb-1">
                  {lang === 'mr' ? 'पृष्ठ शीर्षक (मराठी)' : 'Page Title (Marathi)'}
                </label>
                <input
                  type="text"
                  value={pageTitleMr}
                  onChange={(e) => setPageTitleMr(e.target.value)}
                  placeholder="उदा. मुख्यपृष्ठ | श्रीकृष्ण संस्था"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#244A3A] mb-1">
                  {lang === 'mr' ? 'पृष्ठ शीर्षक (English)' : 'Page Title (English)'}
                </label>
                <input
                  type="text"
                  value={pageTitleEn}
                  onChange={(e) => setPageTitleEn(e.target.value)}
                  placeholder="e.g. Home | Shrikrushna Sanstha"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#244A3A] mb-1">
                  {lang === 'mr' ? 'एसईओ मेटा वर्णन (मराठी)' : 'Meta Description (Marathi)'}
                </label>
                <textarea
                  rows={2}
                  value={pageMetaDescMr}
                  onChange={(e) => setPageMetaDescMr(e.target.value)}
                  placeholder="सर्च इंजिनसाठी अधिकृत वर्णन..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A] resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#244A3A] mb-1">
                  {lang === 'mr' ? 'एसईओ मेटा वर्णन (English)' : 'Meta Description (English)'}
                </label>
                <textarea
                  rows={2}
                  value={pageMetaDescEn}
                  onChange={(e) => setPageMetaDescEn(e.target.value)}
                  placeholder="Official search engine summary..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isSavingPageMeta}
                className="inline-flex items-center gap-2 px-5 py-2 bg-[#244A3A] hover:bg-[#183328] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {isSavingPageMeta ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B58A4A]" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#B58A4A]" />
                )}
                <span>
                  {isSavingPageMeta
                    ? lang === 'mr'
                      ? 'जतन करत आहे...'
                      : 'Saving...'
                    : lang === 'mr'
                    ? 'एसईओ माहिती जतन करा'
                    : 'Save SEO & Title'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {selectedPageSlug === 'home' && uncustomizedHomePresets.length > 0 && (
          <div className="bg-[#FAF8F3] p-5 sm:p-6 rounded-2xl border border-[#E2DACB] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#244A3A]">
                  {lang === 'mr'
                    ? 'मुख्यपृष्ठाचे मूलभूत विभाग (डीफॉल्ट मजकूर सक्रिय)'
                    : 'Built-in Home Sections (Default Fallbacks Active)'}
                </h3>
                <p className="text-[11px] sm:text-xs text-[#55635B] mt-0.5">
                  {lang === 'mr'
                    ? 'हे विभाग सध्या अधिकृत डीफॉल्ट मजकुरासह संकेतस्थळावर थेट सुरू आहेत. त्यांचा मजकूर बदलण्यासाठी "सानुकूलित करा" वर क्लिक करा.'
                    : 'These sections are currently live using canonical defaults. Click "Customize" to create a manageable override.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {uncustomizedHomePresets.map((preset) => (
                <div
                  key={preset.key}
                  className="bg-white p-4 rounded-xl border border-[#D8CEBE] shadow-2xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 bg-[#FAF8F3] border border-[#E2DACB] rounded text-[#7A5C32]">
                        key: {preset.key}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        {lang === 'mr' ? 'डीफॉल्ट सक्रिय' : 'Default Active'}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#244A3A]">
                      {lang === 'mr' ? preset.nameMr : preset.nameEn}
                    </h4>
                    <p className="text-[11px] text-[#55635B] line-clamp-3 leading-relaxed">
                      {lang === 'mr' ? preset.defaultContentMr : preset.defaultContentEn}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setFormPageSlug('home');
                      setFormSectionKey(preset.key);
                      setFormTitleMr(preset.defaultTitleMr);
                      setFormTitleEn(preset.defaultTitleEn);
                      setFormSubtitleMr(preset.defaultSubtitleMr);
                      setFormSubtitleEn(preset.defaultSubtitleEn);
                      setFormContentMr(preset.defaultContentMr);
                      setFormContentEn(preset.defaultContentEn);
                      setFormDisplayOrder(preset.displayOrder);
                      setFormIsPublished(true);
                      setIsModalOpen(true);
                    }}
                    className="w-full py-2 px-3 bg-[#244A3A] hover:bg-[#183328] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#B58A4A]" />
                    <span>{lang === 'mr' ? 'सानुकूलित करा' : 'Customize'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentSections.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#E2DACB] text-center space-y-3">
            <Layers className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-serif font-bold text-[#244A3A]">
              {selectedPageSlug === 'home'
                ? lang === 'mr'
                  ? 'मुख्यपृष्ठासाठी कोणतेही सानुकूल विभाग जतन केलेले नाहीत.'
                  : 'No custom section overrides saved for Home page.'
                : lang === 'mr'
                ? 'या पृष्ठावर अद्याप कोणतेही विभाग नाहीत.'
                : 'No sections found for this page.'}
            </h3>
            <p className="text-xs text-[#55635B] max-w-md mx-auto">
              {selectedPageSlug === 'home'
                ? lang === 'mr'
                  ? 'वरील मूलभूत विभाग डीफॉल्ट मजकुरासह कार्यरत आहेत. नवीन सानुकूल विभाग जोडण्यासाठी वर "+ नवीन विभाग जोडा" वर क्लिक करा.'
                  : 'Built-in sections above are active with defaults. Click "+ Add New Section" to add more custom sections.'
                : lang === 'mr'
                ? 'वर दिलेल्या "+ नवीन विभाग जोडा" बटणावर क्लिक करून या पृष्ठासाठी नवीन विभाग तयार करा.'
                : 'Click "+ Add New Section" above to create dynamic content for this page.'}
            </p>
          </div>
        ) : (
          currentSections.map((sec) => {
            const isToggling = isTogglingPublishId === sec.id;

            return (
              <div
                key={sec.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-[#E2DACB] shadow-2xs hover:border-[#244A3A] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E2DACB] text-[#55635B]">
                        क्रम: #{sec.displayOrder}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-[#FAF8F3] border border-[#E2DACB] text-[#7A5C32]">
                        key: {sec.sectionKey}
                      </span>
                      {sec.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          <Eye className="w-3 h-3" />
                          <span>{lang === 'mr' ? 'प्रकाशित' : 'Published'}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700">
                          <EyeOff className="w-3 h-3" />
                          <span>{lang === 'mr' ? 'ड्राफ्ट / अप्रकाशित' : 'Draft'}</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-serif font-bold text-[#244A3A] pt-1">
                      {sec.titleMr}
                    </h3>
                    {sec.titleEn && sec.titleEn !== sec.titleMr && (
                      <p className="text-xs font-semibold text-[#55635B] italic">
                        {sec.titleEn}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTogglePublish(sec)}
                      disabled={isToggling}
                      title={sec.isPublished ? 'अप्रकाशित करा' : 'प्रकाशित करा'}
                      className="p-2 rounded-xl border border-[#D8CEBE] hover:bg-[#FAF8F3] text-[#55635B] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isToggling ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                      ) : sec.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4 text-emerald-700" />
                      )}
                    </button>

                    <button
                      onClick={() => openEditModal(sec)}
                      title="संपादित करा"
                      className="p-2 rounded-xl bg-[#244A3A] hover:bg-[#183328] text-white transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSectionToDelete(sec)}
                      title="हटवा"
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Subtitle preview if present */}
                {(sec.subtitleMr || sec.subtitleEn) && (
                  <div className="text-xs text-[#7A5C32] font-semibold">
                    <span>{sec.subtitleMr || sec.subtitleEn}</span>
                    {sec.subtitleEn && sec.subtitleMr && (
                      <span className="text-gray-400 ml-2 font-normal">({sec.subtitleEn})</span>
                    )}
                  </div>
                )}

                {/* Content snippet */}
                <div className="p-3 bg-[#FAF8F3] rounded-xl border border-[#EFE9DC] text-xs text-[#3B4540] leading-relaxed line-clamp-3 whitespace-pre-line">
                  {sec.contentMr || sec.contentEn}
                </div>

                {/* Image info if present */}
                {sec.imageUrl && (
                  <div className="flex items-center gap-3 pt-1">
                    <img
                      src={sec.imageUrl}
                      alt={sec.imageAltMr || sec.imageAltEn || 'Section image'}
                      className="w-12 h-12 object-cover rounded-lg border border-[#DED5C4]"
                    />
                    <div className="text-xs text-[#55635B] truncate">
                      <span className="font-semibold block truncate">{sec.imageUrl}</span>
                      <span className="text-[11px] text-gray-400">
                        Alt: {sec.imageAltMr || sec.imageAltEn || '—'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Section Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isSaving) setIsModalOpen(false);
          }}
        >
          <div
            className="bg-white border border-[#D8CEBE] rounded-2xl overflow-hidden max-w-4xl w-full shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#244A3A] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#B58A4A]" />
                <h3 className="font-serif font-bold text-base sm:text-lg">
                  {editingSection
                    ? lang === 'mr'
                      ? 'विभाग माहिती संपादित करा'
                      : 'Edit Page Section'
                    : lang === 'mr'
                      ? 'नवीन विभाग जोडा'
                      : 'Add New Page Section'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveSection} className="p-6 space-y-6 overflow-y-auto">
              {/* Home Quick Presets (Available when page is Home) */}
              {formPageSlug === 'home' && !editingSection && (
                <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] space-y-2">
                  <span className="text-xs font-bold text-[#244A3A] block">
                    {lang === 'mr' ? 'जलद प्रीसेट निवडा (Quick Home Presets):' : 'Select a Quick Preset:'}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {BUILTIN_HOME_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => {
                          setFormSectionKey(p.key);
                          setFormTitleMr(p.defaultTitleMr);
                          setFormTitleEn(p.defaultTitleEn);
                          setFormSubtitleMr(p.defaultSubtitleMr);
                          setFormSubtitleEn(p.defaultSubtitleEn);
                          setFormContentMr(p.defaultContentMr);
                          setFormContentEn(p.defaultContentEn);
                          setFormDisplayOrder(p.displayOrder);
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border ${
                          formSectionKey === p.key
                            ? 'bg-[#244A3A] text-white border-[#244A3A]'
                            : 'bg-white text-[#244A3A] border-[#D8CEBE] hover:border-[#244A3A]'
                        }`}
                      >
                        {lang === 'mr' ? p.nameMr : p.nameEn}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setFormSectionKey(`home_sec_${Date.now().toString(36)}`);
                        setFormTitleMr('');
                        setFormTitleEn('');
                        setFormSubtitleMr('');
                        setFormSubtitleEn('');
                        setFormContentMr('');
                        setFormContentEn('');
                        setFormDisplayOrder(currentSections.length * 10 || 40);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer border bg-white text-[#55635B] border-[#D8CEBE] hover:border-[#244A3A]"
                    >
                      {lang === 'mr' ? '+ नवीन सानुकूल विभाग' : '+ New Custom Section'}
                    </button>
                  </div>
                </div>
              )}

              {/* Meta Row: Page Slug, Section Key, Display Order, Published */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB]">
                <div>
                  <label className="block text-xs font-bold text-[#244A3A] mb-1">
                    {lang === 'mr' ? 'पृष्ठ निवडा' : 'Page'} *
                  </label>
                  <select
                    value={formPageSlug}
                    onChange={(e) => setFormPageSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                  >
                    <option value="about">About (संस्थेविषयी)</option>
                    <option value="privacy">Privacy (गोपनीयता धोरण)</option>
                    <option value="work">Work (कार्यस्तंभ)</option>
                    <option value="home">Home (मुख्यपृष्ठ)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#244A3A] mb-1">
                    {lang === 'mr' ? 'विभाग की (Section Key)' : 'Section Key'}
                  </label>
                  <input
                    type="text"
                    value={formSectionKey}
                    onChange={(e) => setFormSectionKey(e.target.value)}
                    placeholder="उदा. about_intro"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D8CEBE] rounded-xl font-mono focus:outline-hidden focus:border-[#244A3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#244A3A] mb-1">
                    {lang === 'mr' ? 'क्रम (Order)' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    value={formDisplayOrder}
                    onChange={(e) => setFormDisplayOrder(Number(e.target.value))}
                    min={0}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="inline-flex items-center gap-2 text-xs font-bold text-[#244A3A] cursor-pointer py-2">
                    <input
                      type="checkbox"
                      checked={formIsPublished}
                      onChange={(e) => setFormIsPublished(e.target.checked)}
                      className="w-4 h-4 rounded-sm text-[#244A3A] accent-[#244A3A]"
                    />
                    <span>{lang === 'mr' ? 'प्रकाशित करा' : 'Published'}</span>
                  </label>
                </div>
              </div>

              {/* Bilingual Inputs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Marathi Column */}
                <div className="space-y-4 p-4 rounded-xl border border-[#E2DACB] bg-[#FFFDF9]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#B58A4A] block border-b border-[#F2ECE1] pb-2">
                    मराठी सामग्री (Marathi Content)
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      शीर्षक (Title MR) *
                    </label>
                    <input
                      type="text"
                      value={formTitleMr}
                      onChange={(e) => setFormTitleMr(e.target.value)}
                      placeholder="मराठीत शीर्षक प्रविष्ट करा"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      उपशीर्षक (Subtitle MR)
                    </label>
                    <input
                      type="text"
                      value={formSubtitleMr}
                      onChange={(e) => setFormSubtitleMr(e.target.value)}
                      placeholder="उदा. प्रस्तावना व पार्श्वभूमी"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      मजकूर (Content MR) *
                    </label>
                    <textarea
                      rows={6}
                      value={formContentMr}
                      onChange={(e) => setFormContentMr(e.target.value)}
                      placeholder="मराठीतील सविस्तर मजकूर..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A] leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      प्रतिमा Alt मजकूर (Image Alt MR)
                    </label>
                    <input
                      type="text"
                      value={formImageAltMr}
                      onChange={(e) => setFormImageAltMr(e.target.value)}
                      placeholder="प्रतिमेचे वर्णन मराठीत"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                </div>

                {/* English Column */}
                <div className="space-y-4 p-4 rounded-xl border border-[#E2DACB] bg-[#FFFDF9]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#244A3A] block border-b border-[#F2ECE1] pb-2">
                    English Content (इंग्रजी सामग्री)
                  </span>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      Title (EN) *
                    </label>
                    <input
                      type="text"
                      value={formTitleEn}
                      onChange={(e) => setFormTitleEn(e.target.value)}
                      placeholder="Enter title in English"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      Subtitle (EN)
                    </label>
                    <input
                      type="text"
                      value={formSubtitleEn}
                      onChange={(e) => setFormSubtitleEn(e.target.value)}
                      placeholder="e.g. Introduction & Genesis"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      Content (EN) *
                    </label>
                    <textarea
                      rows={6}
                      value={formContentEn}
                      onChange={(e) => setFormContentEn(e.target.value)}
                      placeholder="Enter detailed content in English..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A] leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#244A3A] mb-1">
                      Image Alt Text (EN)
                    </label>
                    <input
                      type="text"
                      value={formImageAltEn}
                      onChange={(e) => setFormImageAltEn(e.target.value)}
                      placeholder="Image description in English"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>
                </div>
              </div>

              {/* Image Attachment Row */}
              <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB] space-y-3">
                <span className="text-xs font-bold text-[#244A3A] block">
                  {lang === 'mr' ? 'प्रतिमा जोडणी (Image Attachment - पर्यायी)' : 'Image Attachment (Optional)'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-8">
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={(e) => setFormImageUrl(e.target.value)}
                      placeholder="/uploads/pages/... किंवा बाह्य URL"
                      className="w-full px-3.5 py-2 text-xs bg-white border border-[#D8CEBE] rounded-xl focus:outline-hidden focus:border-[#244A3A]"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#F2ECE1] border border-[#D8CEBE] text-xs font-semibold text-[#244A3A] rounded-xl cursor-pointer transition-colors">
                      {isUploadingImage ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5" />
                      )}
                      <span>{isUploadingImage ? 'अपलोड होत आहे...' : 'फाइल निवडा'}</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isUploadingImage}
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>

                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormImageUrl('')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                        title="प्रतिमा काढा"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {formImageUrl && (
                  <div className="pt-2 flex items-center gap-3">
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-[#D8CEBE]"
                    />
                    <span className="text-[11px] text-[#55635B] truncate">{formImageUrl}</span>
                  </div>
                )}
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DACB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-white hover:bg-[#FAF8F3] border border-[#D8CEBE] text-xs font-semibold text-[#55635B] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#244A3A] hover:bg-[#183328] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
                      <span>{lang === 'mr' ? 'जतन करत आहे...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#B58A4A]" />
                      <span>{lang === 'mr' ? 'विभाग जतन करा' : 'Save Section'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {sectionToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeleting) setSectionToDelete(null);
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
                {lang === 'mr' ? 'हा विभाग हटवायचा आहे का?' : 'Delete This Section?'}
              </h3>
              <p className="text-xs text-[#55635B] leading-relaxed">
                {lang === 'mr'
                  ? `"${sectionToDelete.titleMr}" (${sectionToDelete.sectionKey}) हा विभाग कायमचा हटवला जाईल. ही क्रिया पूर्ववत करता येणार नाही.`
                  : `"${sectionToDelete.titleEn || sectionToDelete.titleMr}" (${sectionToDelete.sectionKey}) will be permanently deleted. This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2DACB]">
              <button
                onClick={() => setSectionToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white hover:bg-[#FAF8F3] border border-[#D8CEBE] text-xs font-semibold text-[#55635B] rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
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
