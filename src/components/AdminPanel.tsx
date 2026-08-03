import React, { useState, useRef, useMemo } from 'react';
import { ImageItem, Category, StorageStats, AuditLogEntry } from '../types';
import { ShopLogo } from './ShopLogo';
import {
  UploadCloud,
  Trash2,
  Plus,
  Link as LinkIcon,
  HardDrive,
  CheckCircle,
  AlertTriangle,
  Layers,
  Database,
  Search,
  ShieldCheck,
  Sparkles,
  FileText,
  Lock,
  X,
  Eye,
  Edit3,
  Cpu,
  Terminal,
  Activity,
  History,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Zap,
  Globe,
  Camera
} from 'lucide-react';

interface AdminPanelProps {
  images: ImageItem[];
  stats: StorageStats;
  onAddImage: (img: ImageItem) => Promise<void>;
  onDeleteImage: (id: string) => Promise<void>;
  onDeleteMultiple: (ids: string[]) => Promise<void>;
  onSeedBulk: (count: number) => Promise<void>;
  onClearAll: () => Promise<void>;
  onRestoreDefaults?: () => Promise<void>;
  onRefresh: () => void;
  isAdminLoggedIn: boolean;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onRequestRemoval: (image: ImageItem) => void;
  onViewImage: (image: ImageItem) => void;
  onEditImage: (image: ImageItem) => void;
  onOpenDeleteConfirm: (image: ImageItem) => void;
  onOpenBulkDeleteConfirm: (ids: string[]) => void;
  auditLogs: AuditLogEntry[];
  onClearAuditLogs: () => void;
  customLogoUrl?: string | null;
  onOpenLogoModal?: () => void;
}

const CATEGORIES: Category[] = [
  'Typography & Quotes',
  'Vintage & Retro',
  'Streetwear & Urban',
  'Anime & Manga',
  'Cyberpunk & Sci-Fi',
  'Minimalist Graphics',
  'Gym & Fitness',
  'Nature & Wildlife',
  'Gaming & Pop Culture',
  'Abstract & Pattern'
];

interface FileUploadLog {
  id: string;
  fileName: string;
  title: string;
  size: string;
  category: string;
  previewUrl: string;
  uploadedAt: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  images,
  stats,
  onAddImage,
  onDeleteImage,
  onDeleteMultiple,
  onSeedBulk,
  onClearAll,
  onRestoreDefaults,
  onRefresh,
  isAdminLoggedIn,
  onOpenAdminLogin,
  onLogoutAdmin,
  onRequestRemoval,
  onViewImage,
  onEditImage,
  onOpenDeleteConfirm,
  onOpenBulkDeleteConfirm,
  auditLogs,
  onClearAuditLogs,
  customLogoUrl,
  onOpenLogoModal
}) => {
  const [activeTab, setActiveTab] = useState<'manage' | 'upload' | 'url' | 'audit'>('manage');

  // URL Upload Form State
  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<Category>('Typography & Quotes');
  const [authorInput, setAuthorInput] = useState('Apparel Designer');
  const [tagsInput, setTagsInput] = useState('tshirt, print, vector, graphic');
  const [descriptionInput, setDescriptionInput] = useState('T-shirt print graphic uploaded to collection database');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState('');

  // File Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedLogs, setUploadedLogs] = useState<FileUploadLog[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage Collections Controls State
  const [adminSearch, setAdminSearch] = useState('');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<string>('All');
  const [adminSortBy, setAdminSortBy] = useState<'newest' | 'oldest' | 'title' | 'size'>('newest');
  const [selectedAdminIds, setSelectedAdminIds] = useState<Set<string>>(new Set());
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [bulkSeedCount, setBulkSeedCount] = useState<number>(50);
  const [isSeeding, setIsSeeding] = useState(false);

  // URL Upload Handler
  const handleUrlUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !titleInput.trim()) return;

    setIsSubmitting(true);
    const assignedCat = categoryInput.trim() || 'Custom Print';
    const newImage: ImageItem = {
      id: `file-url-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: titleInput.trim(),
      url: urlInput.trim(),
      thumbnailUrl: urlInput.trim(),
      category: assignedCat,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      author: authorInput.trim() || 'Admin User',
      description: descriptionInput.trim(),
      aspectRatio: 'landscape',
      width: 1920,
      height: 1080,
      fileSize: '3.2 MB',
      createdAt: new Date().toISOString(),
      isFavorite: false,
      views: 1
    };

    try {
      await onAddImage(newImage);
      setUploadSuccessMsg(`Successfully uploaded "${titleInput.trim()}" to Cloud Storage!`);
      setUrlInput('');
      setTitleInput('');
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag & Drop / File Input Processing
  const handleProcessFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsSubmitting(true);

    const newLogRecords: FileUploadLog[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const formattedSize = file.size >= 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
          : `${(file.size / 1024).toFixed(1)} KB`;

        const assignedCat = categoryInput.trim() || 'Custom Print';
        const displayTitle = files.length > 1 ? `${assignedCat} #${i + 1}` : assignedCat;

        const newImg: ImageItem = {
          id: `file-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          title: displayTitle,
          url: dataUrl,
          thumbnailUrl: dataUrl,
          category: assignedCat,
          tags: ['file-upload', 'cloud-storage', assignedCat.toLowerCase()],
          author: 'Admin Upload',
          description: `Uploaded ${assignedCat} print artwork (${formattedSize})`,
          aspectRatio: 'square',
          width: 1200,
          height: 1200,
          fileSize: formattedSize,
          createdAt: new Date().toISOString(),
          isFavorite: false
        };

        await onAddImage(newImg);

        newLogRecords.unshift({
          id: newImg.id,
          fileName: displayTitle,
          title: displayTitle,
          size: formattedSize,
          category: assignedCat,
          previewUrl: dataUrl,
          uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }

      setUploadedLogs(prev => [...newLogRecords, ...prev]);
      setUploadSuccessMsg(`Successfully uploaded and stored ${files.length} artwork design file(s)!`);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err) {
      console.error('File processing error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFiles(e.dataTransfer.files);
    }
  };

  // Seed Bulk Images
  const handleRunBulkSeed = async () => {
    setIsSeeding(true);
    try {
      await onSeedBulk(bulkSeedCount);
      setUploadSuccessMsg(`Generated +${bulkSeedCount} high-res print designs into database!`);
      setTimeout(() => setUploadSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Bulk seed failed', err);
    } finally {
      setIsSeeding(false);
    }
  };

  // Filtered, Categorized and Sorted Images for Manage Collections
  const filteredAdminImages = useMemo(() => {
    return images.filter(img => {
      // Search term
      if (adminSearch.trim()) {
        const q = adminSearch.toLowerCase();
        const matchesTitle = img.title.toLowerCase().includes(q);
        const matchesCategory = img.category.toLowerCase().includes(q);
        const matchesAuthor = img.author.toLowerCase().includes(q);
        const matchesId = img.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCategory && !matchesAuthor && !matchesId) {
          return false;
        }
      }

      // Category filter
      if (adminCategoryFilter !== 'All' && img.category !== adminCategoryFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (adminSortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (adminSortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (adminSortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (adminSortBy === 'size') {
        return (parseFloat(b.fileSize) || 0) - (parseFloat(a.fileSize) || 0);
      }
      return 0;
    });
  }, [images, adminSearch, adminCategoryFilter, adminSortBy]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredAdminImages.length / pageSize));
  const paginatedImages = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAdminImages.slice(start, start + pageSize);
  }, [filteredAdminImages, currentPage, pageSize]);

  // Checkbox Selection
  const toggleSelectAdminItem = (id: string) => {
    const next = new Set(selectedAdminIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAdminIds(next);
  };

  const selectAllPageAdminItems = () => {
    const currentPageIds = paginatedImages.map(img => img.id);
    const allSelectedOnPage = currentPageIds.every(id => selectedAdminIds.has(id));

    const next = new Set(selectedAdminIds);
    if (allSelectedOnPage) {
      currentPageIds.forEach(id => next.delete(id));
    } else {
      currentPageIds.forEach(id => next.add(id));
    }
    setSelectedAdminIds(next);
  };

  const capacityPercentage = Math.min(100, Math.round((stats.totalCount / stats.maxCapacity) * 100));

  if (!isAdminLoggedIn) {
    return null;
  }

  return (
    <section id="admin-panel-section" className="bg-slate-950 border-t-2 border-cyan-500/30 text-slate-100 pt-10 pb-16 px-4 sm:px-6 lg:px-8 mt-16 transition-all relative overflow-hidden font-sans">
      
      {/* Futuristic Background Glows & Grid */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Futuristic Cyber Banner Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-cyan-500/20">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 border border-cyan-500/40 px-3 py-1 rounded-md flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                CYBER CONTROL CENTER :: ADMIN 'next'
              </span>
              <span className="text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                ENCRYPTED SESSION :: ONLINE
              </span>
            </div>

            <h2 className="text-2xl font-black text-white mt-2 flex items-center gap-3 tracking-tight">
              <span 
                onClick={onOpenLogoModal}
                className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-500/40 p-1 flex items-center justify-center text-cyan-400 shrink-0 cursor-pointer hover:border-cyan-400 transition-all group relative overflow-hidden"
                title="Click to change shop logo"
              >
                <ShopLogo customLogoUrl={customLogoUrl} className="w-6 h-6 text-cyan-400" />
              </span>
              <span>NextPrinters Collections — Admin Master Portal</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl font-mono">
              Full administrative privileges granted. Manage collections, edit artwork metadata, execute permanent file deletions, and review audit history.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenLogoModal}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-500/40 hover:bg-cyan-900/60 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              title="Upload or change shop logo image"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Change Shop Logo</span>
            </button>

            <button
              onClick={onLogoutAdmin}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition-all flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Lock / Logout Admin</span>
            </button>

            <button
              onClick={async () => {
                if (confirm("System Alert: Confirm permanent wipe of ALL artwork designs from database?")) {
                  await onClearAll();
                }
              }}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
              title="Delete all records from collection"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Wipe Entire Database ({images.length})</span>
            </button>
          </div>
        </div>

        {/* Futuristic Cyber Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(6,182,212,0.1)] relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
              <span>Collection Capacity</span>
              <HardDrive className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white font-mono">
                {stats.totalCount.toLocaleString()} <span className="text-xs text-slate-400 font-normal">/ 10,000 Files</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full mt-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${capacityPercentage}%` }}
                />
              </div>
              <span className="text-[10px] text-cyan-400 font-mono font-semibold mt-1.5 block">
                {capacityPercentage}% Database Allocated
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(168,85,247,0.1)]">
            <div className="flex items-center justify-between text-xs font-mono text-purple-400 font-bold uppercase tracking-wider">
              <span>Cloud Storage Size</span>
              <Database className="w-4 h-4 text-purple-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white font-mono">
                {(stats.usedBytes / (1024 * 1024)).toFixed(1)} <span className="text-xs text-slate-400 font-normal">MB Used</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-1.5">
                Optimized IndexedDB client engine
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <div className="flex items-center justify-between text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">
              <span>Active Categories</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-white font-mono">
                {Object.keys(stats.categoryCounts).length} <span className="text-xs text-slate-400 font-normal">Taxonomy Taxa</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-1.5">
                Categorized T-shirt design index
              </span>
            </div>
          </div>

        </div>

        {/* Upload Success Banner */}
        {uploadSuccessMsg && (
          <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs rounded-2xl p-3.5 px-5 flex items-center justify-between animate-fadeIn shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="font-mono">{uploadSuccessMsg}</span>
            </div>
            <button onClick={() => setUploadSuccessMsg('')} className="p-1 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Cyberpunk Navigation Tabs */}
        <div className="flex border-b border-slate-800 space-x-2 text-xs font-mono font-bold">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-5 py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Manage Collections ({images.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Drag & Drop File Upload</span>
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`px-5 py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'url'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            <span>Add Artwork by URL</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-5 py-3 border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'audit'
                ? 'border-cyan-400 text-cyan-400 bg-cyan-950/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: MANAGE COLLECTIONS DASHBOARD TABLE */}
        {activeTab === 'manage' && (
          <div className="bg-slate-900/90 border border-cyan-500/20 rounded-3xl p-6 space-y-6 shadow-2xl animate-fadeIn">
            
            {/* Search, Filters, and Bulk Action Controls */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 text-xs">
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Search by Title, ID, Category, Author..."
                  value={adminSearch}
                  onChange={(e) => {
                    setAdminSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-2xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              {/* Category & Sorting Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                  <Filter className="w-3.5 h-3.5 text-cyan-400" />
                  <select
                    value={adminCategoryFilter}
                    onChange={(e) => {
                      setAdminCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none font-mono"
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5">
                  <ArrowUpDown className="w-3.5 h-3.5 text-purple-400" />
                  <select
                    value={adminSortBy}
                    onChange={(e) => setAdminSortBy(e.target.value as any)}
                    className="bg-transparent text-slate-200 text-xs focus:outline-none font-mono"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="title">Title (A-Z)</option>
                    <option value="size">File Size (Large)</option>
                  </select>
                </div>

                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-2xl px-3 py-1.5 font-mono text-[11px] text-slate-400">
                  <span>Per Page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent text-cyan-400 font-bold focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Bulk Action Controls */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <button
                  onClick={selectAllPageAdminItems}
                  className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-mono text-xs rounded-xl border border-slate-800 transition-colors"
                >
                  {paginatedImages.length > 0 && paginatedImages.every(img => selectedAdminIds.has(img.id))
                    ? 'Deselect Page'
                    : 'Select Page'}
                </button>

                {selectedAdminIds.size > 0 && (
                  <button
                    onClick={() => onOpenBulkDeleteConfirm(Array.from(selectedAdminIds))}
                    className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-[0_0_20px_rgba(244,63,94,0.3)] transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Selected ({selectedAdminIds.size})</span>
                  </button>
                )}
              </div>

            </div>

            {/* Manage Collections Cyber Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/90 shadow-inner">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/90 text-cyan-400 font-mono uppercase text-[10px] tracking-widest border-b border-slate-800 sticky top-0 backdrop-blur-md">
                  <tr>
                    <th className="p-3.5 w-12 text-center">Select</th>
                    <th className="p-3.5">Thumbnail & Artwork Title</th>
                    <th className="p-3.5">Collection / Category</th>
                    <th className="p-3.5">Uploaded By</th>
                    <th className="p-3.5">Upload Date</th>
                    <th className="p-3.5">File Size</th>
                    <th className="p-3.5 text-right pr-6">Permanent Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {paginatedImages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 font-mono">
                        <Database className="w-8 h-8 text-slate-600 mx-auto mb-2 animate-bounce" />
                        No artwork files match search filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedImages.map((img) => (
                      <tr key={img.id} className="hover:bg-cyan-950/20 transition-colors group">
                        
                        {/* Checkbox */}
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedAdminIds.has(img.id)}
                            onChange={() => toggleSelectAdminItem(img.id)}
                            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0 cursor-pointer w-4 h-4"
                          />
                        </td>

                        {/* Thumbnail & Title */}
                        <td className="p-3.5 flex items-center space-x-3.5">
                          <img
                            src={img.thumbnailUrl || img.url}
                            alt=""
                            className="w-11 h-11 rounded-xl object-cover bg-slate-900 border border-slate-800 group-hover:border-cyan-500/50 transition-colors flex-shrink-0 shadow-md"
                          />
                          <div className="min-w-0">
                            <span className="font-bold text-slate-100 block truncate max-w-xs text-sm group-hover:text-cyan-300 transition-colors">
                              {img.title}
                            </span>
                            <span className="text-[10px] text-cyan-400 font-mono block truncate">
                              ID: {img.id}
                            </span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <span className="text-[10px] font-mono font-bold bg-cyan-950/80 text-cyan-300 px-2.5 py-1 rounded-lg border border-cyan-800/60">
                            {img.category}
                          </span>
                        </td>

                        {/* Uploaded By */}
                        <td className="p-3.5 text-slate-300 font-medium">
                          {img.author}
                        </td>

                        {/* Upload Date */}
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {new Date(img.createdAt).toLocaleDateString()}
                        </td>

                        {/* File Size */}
                        <td className="p-3.5 font-mono text-[11px] text-slate-400">
                          {img.fileSize}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-3.5 text-right pr-6">
                          <div className="flex items-center justify-end space-x-1.5">
                            
                            {/* 👁 View Action */}
                            <button
                              onClick={() => onViewImage(img)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-400 border border-slate-800 hover:border-cyan-500/40 transition-all"
                              title="👁 View Artwork Lightbox"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* ✏ Edit Details Action */}
                            <button
                              onClick={() => onEditImage(img)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-purple-500/20 text-slate-300 hover:text-purple-400 border border-slate-800 hover:border-purple-500/40 transition-all"
                              title="✏ Edit Artwork Metadata & Specs"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* 🗑 Delete Permanently Action */}
                            <button
                              onClick={() => onOpenDeleteConfirm(img)}
                              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 transition-all"
                              title="🗑 Permanently Delete File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <div>
                Showing <strong className="text-cyan-400">{(currentPage - 1) * pageSize + 1}</strong> to{' '}
                <strong className="text-cyan-400">{Math.min(currentPage * pageSize, filteredAdminImages.length)}</strong> of{' '}
                <strong className="text-slate-200">{filteredAdminImages.length}</strong> records
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-xl text-cyan-400 font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        )}

        {/* TAB 2: DRAG & DROP UPLOADER */}
        {activeTab === 'upload' && (
          <div className="space-y-4 animate-fadeIn">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
                  : 'border-slate-800 hover:border-cyan-500/50 bg-slate-900/50 hover:bg-slate-900'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleProcessFiles(e.target.files)}
                className="hidden"
              />

              <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                <UploadCloud className="w-8 h-8" />
              </div>

              <h3 className="text-base font-bold text-white">
                Drag & Drop Artwork Files Here, or <span className="text-cyan-400 underline">Browse Local Files</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Supports JPEG, PNG, WEBP, GIF, SVG formats. Stores directly in IndexedDB.
              </p>

              <div className="mt-4 inline-flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2 text-xs text-slate-300 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800" onClick={(e) => e.stopPropagation()}>
                <span className="text-slate-400 font-mono font-semibold">Assign Category:</span>
                <input
                  type="text"
                  list="category-suggestions"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="Type category name..."
                  className="bg-slate-900 text-cyan-400 font-bold focus:outline-none rounded-xl px-3 py-1 border border-cyan-500/40 text-xs w-56 font-mono"
                />
                <datalist id="category-suggestions">
                  {CATEGORIES.map(c => <option key={c} value={c} />)}
                  {Object.keys(stats.categoryCounts).map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>

            {uploadedLogs.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2 font-mono">
                  <span className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    Uploaded Prints ({uploadedLogs.length})
                  </span>
                  <button
                    onClick={() => setUploadedLogs([])}
                    className="text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    Clear History
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {uploadedLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs">
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <img src={log.previewUrl} alt={log.title} className="w-9 h-9 object-cover rounded-lg border border-slate-800 flex-shrink-0" />
                        <div className="truncate">
                          <p className="font-bold text-cyan-300 truncate font-mono">{log.title}</p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                            <span className="bg-slate-900 text-cyan-400 px-2 py-0.5 rounded border border-slate-800">{log.category}</span>
                            <span>{log.size}</span>
                            <span>• {log.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full flex-shrink-0">
                        Stored
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADD BY URL */}
        {activeTab === 'url' && (
          <form onSubmit={handleUrlUpload} className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
              <Plus className="w-4 h-4 text-cyan-400" />
              Add Custom Artwork Image by Direct URL
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="block text-cyan-400 mb-1 font-bold">Image Direct URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/photo-..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1 font-bold">Image Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Cyberpunk Streetwear Print"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1 font-bold">Category</label>
                <input
                  type="text"
                  list="category-suggestions"
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  placeholder="Category name..."
                  className="w-full bg-slate-950 border border-slate-800 text-cyan-300 font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-cyan-400 mb-1 font-bold">Author / Designer</label>
                <input
                  type="text"
                  placeholder="e.g., Cyber Studio"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 font-bold text-xs font-mono px-6 py-2.5 rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'Uploading...' : 'Upload Image to Storage'}
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: AUDIT LOGS TRAIL */}
        {activeTab === 'audit' && (
          <div className="bg-slate-900 border border-cyan-500/20 rounded-3xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Admin Action Audit Trail
                </h3>
              </div>
              {auditLogs.length > 0 && (
                <button
                  onClick={onClearAuditLogs}
                  className="text-xs font-mono text-slate-400 hover:text-slate-200"
                >
                  Clear Trail History
                </button>
              )}
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 font-mono text-center py-8">
                No admin actions recorded in audit log yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2 font-mono text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {log.action}
                      </span>
                      <div>
                        <span className="font-bold text-slate-200">{log.fileName}</span>
                        <span className="text-[10px] text-slate-500 block">ID: {log.fileId}</span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <p className="text-emerald-400 font-bold">Admin: {log.adminName}</p>
                      <p>{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
