import React, { useState, useEffect } from 'react';
import { MediaFileItem } from '../../types';
import { ApiClient } from '../../services/apiClient';
import {
  Grid,
  Upload,
  Search,
  Copy,
  Check,
  Trash2,
  Edit3,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  X,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface MediaLibraryModuleProps {
  lang: 'mr' | 'en';
  showToast: (msg: string) => void;
}

export const MediaLibraryModule: React.FC<MediaLibraryModuleProps> = ({
  lang,
  showToast,
}) => {
  const [mediaFiles, setMediaFiles] = useState<MediaFileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'pdf'>('all');
  const [usageFilter, setUsageFilter] = useState<'all' | 'in_use' | 'unreferenced'>('all');

  // Copy state
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Upload state
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadCategory, setUploadCategory] = useState<string>('general');

  // Alt text edit modal
  const [editingMedia, setEditingMedia] = useState<MediaFileItem | null>(null);
  const [altTextMr, setAltTextMr] = useState<string>('');
  const [altTextEn, setAltTextEn] = useState<string>('');
  const [isSavingAlt, setIsSavingAlt] = useState<boolean>(false);

  // Deletion modal
  const [mediaToDelete, setMediaToDelete] = useState<MediaFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [inUseBlockedMedia, setInUseBlockedMedia] = useState<MediaFileItem | null>(null);

  // Load media files from backend
  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const files = await ApiClient.getMediaFiles();
      setMediaFiles(files);
    } catch (err: any) {
      console.error('Failed to load media files:', err);
      showToast(lang === 'mr' ? 'मीडिया फाइल्स लोड करता आल्या नाहीत.' : 'Failed to load media library.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Format bytes to KB/MB
  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Copy URL to clipboard
  const handleCopyUrl = async (file: MediaFileItem) => {
    try {
      await navigator.clipboard.writeText(file.filePath);
      setCopiedId(file.id);
      showToast(lang === 'mr' ? 'लिंक क्लिपबोर्डवर कॉपी केली!' : 'URL copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      showToast(lang === 'mr' ? 'लिंक कॉपी करता आली नाही.' : 'Failed to copy URL.');
    }
  };

  // Direct file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast(lang === 'mr' ? 'फाइल १५ MB पेक्षा लहान असावी.' : 'File size must be under 15MB.');
      return;
    }

    setIsUploading(true);
    try {
      await ApiClient.uploadImage(file, undefined, uploadCategory);
      showToast(lang === 'mr' ? 'फाइल यशस्वीरित्या अपलोड झाली!' : 'File uploaded successfully!');
      await loadMedia();
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'फाइल अपलोड अयशस्वी.' : 'Upload failed.'));
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Edit Alt text
  const openAltEditModal = (file: MediaFileItem) => {
    setEditingMedia(file);
    setAltTextMr(file.altTextMr || '');
    setAltTextEn(file.altTextEn || '');
  };

  const handleSaveAltText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    setIsSavingAlt(true);
    try {
      const updated = await ApiClient.updateMediaFile(editingMedia.id, {
        altTextMr: altTextMr.trim(),
        altTextEn: altTextEn.trim(),
      });

      setMediaFiles((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      showToast(lang === 'mr' ? 'Alt मजकूर अद्ययावत केला!' : 'Alt text updated successfully!');
      setEditingMedia(null);
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsSavingAlt(false);
    }
  };

  // Delete handling
  const handleDeleteClick = (file: MediaFileItem) => {
    const refCount = file.referenceCount ?? 0;
    if (refCount > 0) {
      // In use! Cannot delete. Show in-use blocked modal.
      setInUseBlockedMedia(file);
    } else {
      // Safe to delete. Show confirmation modal.
      setMediaToDelete(file);
    }
  };

  const handleConfirmDelete = async () => {
    if (!mediaToDelete) return;

    setIsDeleting(true);
    try {
      const result = await ApiClient.deleteMediaFile(mediaToDelete.id);
      if (result.success) {
        showToast(lang === 'mr' ? 'फाइल यशस्वीरित्या हटवली.' : 'File deleted successfully.');
        setMediaFiles((prev) => prev.filter((m) => m.id !== mediaToDelete.id));
        setMediaToDelete(null);
      } else if (result.inUse) {
        setMediaToDelete(null);
        setInUseBlockedMedia(mediaToDelete);
      } else {
        showToast(result.message || (lang === 'mr' ? 'फाइल हटवता आली नाही.' : 'Failed to delete file.'));
      }
    } catch (err: any) {
      showToast(err?.message || (lang === 'mr' ? 'त्रुटी आली.' : 'An error occurred.'));
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter media files
  const filteredFiles = mediaFiles.filter((file) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (file.fileName || '').toLowerCase().includes(q);
      const matchUrl = (file.filePath || '').toLowerCase().includes(q);
      const matchAltMr = (file.altTextMr || '').toLowerCase().includes(q);
      const matchAltEn = (file.altTextEn || '').toLowerCase().includes(q);
      if (!matchName && !matchUrl && !matchAltMr && !matchAltEn) return false;
    }

    // Type filter
    if (typeFilter === 'image') {
      if (!file.mimeType?.startsWith('image/')) return false;
    } else if (typeFilter === 'pdf') {
      if (file.mimeType !== 'application/pdf') return false;
    }

    // Usage filter
    const refCount = file.referenceCount ?? 0;
    if (usageFilter === 'in_use' && refCount === 0) return false;
    if (usageFilter === 'unreferenced' && refCount > 0) return false;

    return true;
  });

  const inUseCount = mediaFiles.filter((m) => (m.referenceCount ?? 0) > 0).length;
  const unreferencedCount = mediaFiles.filter((m) => (m.referenceCount ?? 0) === 0).length;

  return (
    <div className="space-y-6">
      {/* Top Header & Stats Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2DACB] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-[#244A3A]">
              {lang === 'mr' ? 'मीडिया लायब्ररी (Media Library)' : 'Media Asset Library'}
            </h2>
            <p className="text-xs sm:text-sm text-[#55635B] mt-1">
              {lang === 'mr'
                ? 'वेबसाईटवरील सर्व अपलोड केलेल्या प्रतिमा, दस्तऐवज आणि त्यांचे डेटाबेस संदर्भ व्यवस्थापित करा.'
                : 'Browse, upload, inspect references, and manage all website media assets safely.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadMedia}
              disabled={isLoading}
              className="p-2.5 rounded-xl border border-[#D8CEBE] hover:bg-[#FAF8F3] text-[#55635B] transition-colors cursor-pointer disabled:opacity-50"
              title="रिफ्रेश करा"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#B58A4A]' : ''}`} />
            </button>

            <label className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#244A3A] hover:bg-[#183328] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer shrink-0">
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#B58A4A]" />
              ) : (
                <Upload className="w-4 h-4 text-[#B58A4A]" />
              )}
              <span>{isUploading ? 'अपलोड होत आहे...' : lang === 'mr' ? 'नवीन फाइल अपलोड करा' : 'Upload New File'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-[#F2ECE1]">
          <div className="p-4 bg-[#FAF8F3] rounded-xl border border-[#E2DACB]">
            <span className="text-xs text-[#55635B] font-semibold block">
              {lang === 'mr' ? 'एकूण नोंदणीकृत फाइल्स' : 'Total Registered Files'}
            </span>
            <span className="text-2xl font-serif font-bold text-[#244A3A] mt-1 block">
              {mediaFiles.length}
            </span>
          </div>

          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
            <span className="text-xs text-emerald-800 font-semibold block">
              {lang === 'mr' ? 'वापरात असलेल्या फाइल्स' : 'In-Use / Referenced Files'}
            </span>
            <span className="text-2xl font-serif font-bold text-emerald-700 mt-1 block">
              {inUseCount}
            </span>
          </div>

          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200">
            <span className="text-xs text-amber-800 font-semibold block">
              {lang === 'mr' ? 'अप्रयुक्त फाइल्स (असुरक्षित डिलीटपासून संरक्षित)' : 'Unreferenced Files (Retained)'}
            </span>
            <span className="text-2xl font-serif font-bold text-amber-700 mt-1 block">
              {unreferencedCount}
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#9E9585] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'mr' ? 'फाइल नाव किंवा Alt मजकूराने शोधा...' : 'Search by filename or alt text...'}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
            >
              <option value="all">{lang === 'mr' ? 'सर्व प्रकार (All Types)' : 'All File Types'}</option>
              <option value="image">{lang === 'mr' ? 'फक्त प्रतिमा (Images)' : 'Images Only'}</option>
              <option value="pdf">{lang === 'mr' ? 'दस्तऐवज (PDFs)' : 'PDFs Only'}</option>
            </select>
          </div>

          {/* Usage Filter */}
          <div className="sm:col-span-3">
            <select
              value={usageFilter}
              onChange={(e) => setUsageFilter(e.target.value as any)}
              className="w-full px-3 py-2.5 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
            >
              <option value="all">{lang === 'mr' ? 'सर्व वापर (All Usage)' : 'All Usage Status'}</option>
              <option value="in_use">{lang === 'mr' ? 'वापरात आहे (In Use)' : 'In Use Only'}</option>
              <option value="unreferenced">{lang === 'mr' ? 'वापरात नाही (Unreferenced)' : 'Unreferenced Only'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Media Files Grid */}
      {isLoading ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E2DACB] text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#B58A4A] animate-spin mx-auto" />
          <p className="text-xs text-[#55635B]">
            {lang === 'mr' ? 'मीडिया फाइल्स लोड होत आहेत...' : 'Loading media inventory...'}
          </p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white p-16 rounded-2xl border border-[#E2DACB] text-center space-y-3">
          <Grid className="w-10 h-10 text-gray-400 mx-auto" />
          <h3 className="text-base font-serif font-bold text-[#244A3A]">
            {lang === 'mr' ? 'कोणतीही मीडिया फाइल सापडली नाही.' : 'No media files match your criteria.'}
          </h3>
          <p className="text-xs text-[#55635B]">
            {lang === 'mr' ? 'कृपया शोध निकष बदला किंवा नवीन फाइल अपलोड करा.' : 'Try adjusting your filters or upload a new file.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFiles.map((file) => {
            const isImage = file.mimeType?.startsWith('image/');
            const refCount = file.referenceCount ?? 0;
            const isInUse = refCount > 0;
            const isCopied = copiedId === file.id;

            return (
              <div
                key={file.id}
                className="bg-white rounded-2xl border border-[#E2DACB] overflow-hidden shadow-2xs hover:border-[#244A3A] transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Media Thumbnail */}
                  <div className="relative aspect-16/10 bg-[#FAF8F3] border-b border-[#EFE9DC] overflow-hidden flex items-center justify-center">
                    {isImage ? (
                      <img
                        src={file.filePath}
                        alt={file.altTextMr || file.altTextEn || file.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-[#55635B] space-y-2 p-4">
                        <FileText className="w-12 h-12 text-[#9A6B26]" />
                        <span className="text-[11px] font-mono text-center truncate max-w-[200px]">
                          {file.fileName}
                        </span>
                      </div>
                    )}

                    {/* Usage Badge (Top Right) */}
                    <div className="absolute top-2.5 right-2.5">
                      {isInUse ? (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-600/90 text-white backdrop-blur-xs shadow-xs">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>वापरात आहे ({refCount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/90 text-white backdrop-blur-xs shadow-xs">
                          <Info className="w-3 h-3" />
                          <span>वापरात नाही (0)</span>
                        </span>
                      )}
                    </div>

                    {/* Type Badge (Top Left) */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                        {file.fileType}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3">
                    {/* Filename and Size */}
                    <div className="space-y-1">
                      <h4
                        className="text-xs font-serif font-bold text-[#244A3A] truncate"
                        title={file.fileName}
                      >
                        {file.fileName}
                      </h4>
                      <div className="flex items-center justify-between text-[11px] text-[#55635B] font-mono">
                        <span>{formatFileSize(file.fileSizeBytes)}</span>
                        <span>{file.createdAt?.substring(0, 10)}</span>
                      </div>
                    </div>

                    {/* Relative File URL box */}
                    <div className="p-2 bg-[#FAF8F3] rounded-lg border border-[#EFE9DC] text-[11px] font-mono text-[#55635B] truncate">
                      {file.filePath}
                    </div>

                    {/* Alt text snippet if set */}
                    {(file.altTextMr || file.altTextEn) && (
                      <div className="text-[11px] text-[#7A5C32] italic space-y-0.5">
                        {file.altTextMr && <p className="truncate">MR: {file.altTextMr}</p>}
                        {file.altTextEn && <p className="truncate">EN: {file.altTextEn}</p>}
                      </div>
                    )}

                    {/* References breakdown if in-use */}
                    {isInUse && file.references && file.references.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10.5px] font-bold text-[#55635B] uppercase tracking-wider block mb-1">
                          {lang === 'mr' ? 'वापर ठिकाणे:' : 'Referenced In:'}
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                          {file.references.map((ref, rIdx) => (
                            <span
                              key={rIdx}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                            >
                              {ref.table} #{ref.id}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="px-4 py-3 bg-[#FAF8F3] border-t border-[#EFE9DC] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleCopyUrl(file)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-[#F2ECE1] border border-[#D8CEBE] rounded-lg text-xs font-semibold text-[#244A3A] transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">{lang === 'mr' ? 'कॉपी झाले!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{lang === 'mr' ? 'लिंक कॉपी' : 'Copy URL'}</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openAltEditModal(file)}
                      title="Alt मजकूर बदला"
                      className="p-1.5 rounded-lg border border-[#D8CEBE] hover:bg-white text-[#55635B] transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDeleteClick(file)}
                      title={
                        isInUse
                          ? 'हा घटक इतरत्र वापरात असल्याने हटवता येत नाही'
                          : 'फाइल हटवा'
                      }
                      className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                        isInUse
                          ? 'border border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100'
                          : 'border border-red-200 text-red-700 bg-red-50 hover:bg-red-100'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Alt Text Edit Modal */}
      {editingMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isSavingAlt) setEditingMedia(null);
          }}
        >
          <div
            className="bg-white border border-[#D8CEBE] rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E2DACB] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#B58A4A]" />
                <h3 className="font-serif font-bold text-base text-[#244A3A]">
                  {lang === 'mr' ? 'Alt मजकूर संपादित करा' : 'Edit Media Alt Text'}
                </h3>
              </div>
              <button
                onClick={() => setEditingMedia(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAltText} className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-[#55635B] block mb-1">
                  {editingMedia.fileName}
                </span>
                <span className="text-[11px] font-mono text-gray-400 block truncate">
                  {editingMedia.filePath}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#244A3A] mb-1">
                  Alt मजकूर (मराठी)
                </label>
                <input
                  type="text"
                  value={altTextMr}
                  onChange={(e) => setAltTextMr(e.target.value)}
                  placeholder="दृष्टीहीन वापरकर्त्यांसाठी मराठीत वर्णन"
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#244A3A] mb-1">
                  Alt Text (English)
                </label>
                <input
                  type="text"
                  value={altTextEn}
                  onChange={(e) => setAltTextEn(e.target.value)}
                  placeholder="Accessible description in English"
                  className="w-full px-3.5 py-2 text-xs bg-[#FAF8F3] border border-[#D8CEBE] rounded-xl focus:bg-white focus:outline-hidden focus:border-[#244A3A]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E2DACB]">
                <button
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  disabled={isSavingAlt}
                  className="px-4 py-2 bg-white hover:bg-[#FAF8F3] border border-[#D8CEBE] text-xs font-semibold text-[#55635B] rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSavingAlt}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#244A3A] hover:bg-[#183328] text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {isSavingAlt ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#B58A4A]" />
                      <span>{lang === 'mr' ? 'जतन करत आहे...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#B58A4A]" />
                      <span>{lang === 'mr' ? 'जतन करा' : 'Save'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* In-Use Blocked Alert Modal */}
      {inUseBlockedMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setInUseBlockedMedia(null)}
        >
          <div
            className="bg-white border border-amber-300 rounded-2xl overflow-hidden max-w-md w-full shadow-2xl p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-serif font-bold text-lg text-[#244A3A]">
                {lang === 'mr' ? 'हा मीडिया घटक हटवता येत नाही' : 'Cannot Delete Media in Active Use'}
              </h3>
              <p className="text-xs text-[#55635B] leading-relaxed">
                {lang === 'mr'
                  ? `"${inUseBlockedMedia.fileName}" ही फाइल संकेतस्थळावरील ${inUseBlockedMedia.referenceCount ?? 0} घटकांमध्ये (इव्हेंट्स, फोटो गॅलरी किंवा अहवाल) थेट वापरली जात आहे.`
                  : `"${inUseBlockedMedia.fileName}" is actively referenced across ${inUseBlockedMedia.referenceCount ?? 0} item(s) on the website.`}
              </p>
            </div>

            {/* List of references */}
            {inUseBlockedMedia.references && inUseBlockedMedia.references.length > 0 && (
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1 max-h-36 overflow-y-auto">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-amber-800">
                  {lang === 'mr' ? 'सक्रिय संदर्भ (Active References):' : 'Active References:'}
                </span>
                {inUseBlockedMedia.references.map((ref, idx) => (
                  <div key={idx} className="font-mono text-[11px] flex items-center gap-1.5">
                    <span>•</span>
                    <span className="font-bold">{ref.table}</span>
                    <span>(ID: #{ref.id}, column: {ref.column})</span>
                  </div>
                ))}
              </div>
            )}

            <p className="text-[11px] text-[#7A5C32] italic text-center">
              {lang === 'mr'
                ? 'कृपया ही फाइल हटवण्यापूर्वी संबंधित कार्यक्रम किंवा गॅलरीमधून हा फोटो काढा अथवा बदला.'
                : 'Please remove or replace this media in the respective modules before deleting.'}
            </p>

            <div className="flex justify-center pt-2 border-t border-[#E2DACB]">
              <button
                onClick={() => setInUseBlockedMedia(null)}
                className="px-6 py-2 bg-[#244A3A] hover:bg-[#183328] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                {lang === 'mr' ? 'समजले' : 'Understood'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Unreferenced Files */}
      {mediaToDelete && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => {
            if (!isDeleting) setMediaToDelete(null);
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
                {lang === 'mr' ? 'ही मीडिया फाइल हटवायची आहे का?' : 'Delete This Media File?'}
              </h3>
              <p className="text-xs text-[#55635B] leading-relaxed">
                {lang === 'mr'
                  ? `"${mediaToDelete.fileName}" (${mediaToDelete.filePath}) ही अप्रयुक्त फाइल कायमची हटवली जाईल. ही क्रिया पूर्ववत करता येणार नाही.`
                  : `"${mediaToDelete.fileName}" (${mediaToDelete.filePath}) is unreferenced and will be permanently deleted from disk and database. This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E2DACB]">
              <button
                onClick={() => setMediaToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white hover:bg-[#FAF8F3] border border-[#D8CEBE] text-xs font-semibold text-[#55635B] rounded-xl cursor-pointer disabled:opacity-50"
              >
                {lang === 'mr' ? 'रद्द करा' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50"
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
