import React, { useState } from 'react';
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
} from 'lucide-react';

interface PagesSectionsModuleProps {
  lang: 'mr' | 'en';
  showToast: (msg: string) => void;
}

export const PagesSectionsModule: React.FC<PagesSectionsModuleProps> = ({
  lang,
  showToast,
}) => {
  const { state, addPageSection, updatePageSection, deletePageSection } = useSanstha();

  const [selectedPageSlug, setSelectedPageSlug] = useState<string>('about');
  const [editingSection, setEditingSection] = useState<PageSectionItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTogglingPublishId, setIsTogglingPublishId] = useState<number | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<PageSectionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

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

      {/* Sections List */}
      <div className="space-y-4">
        {currentSections.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-[#E2DACB] text-center space-y-3">
            <Layers className="w-10 h-10 text-gray-400 mx-auto" />
            <h3 className="text-base font-serif font-bold text-[#244A3A]">
              {lang === 'mr' ? 'या पृष्ठावर अद्याप कोणतेही विभाग नाहीत.' : 'No sections found for this page.'}
            </h3>
            <p className="text-xs text-[#55635B] max-w-md mx-auto">
              {lang === 'mr'
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
