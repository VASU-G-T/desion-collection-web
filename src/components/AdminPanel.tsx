import React, { useState, useRef } from 'react';
import { Category, PrintSpec, ImageItem, AdminUser, MockupBackground } from '../types';
import { uploadImageFile, validateImageFile, deleteImage } from '../services/firebaseGalleryService';
import { X, UploadCloud, Layers, CheckCircle2, AlertTriangle, Trash2, FileImage, Sparkles, HardDrive, ShieldCheck, Lock, Image as ImageIcon, Tag, Settings, ShoppingBag } from 'lucide-react';
import { AdminOffersTab } from './AdminOffersTab';
import { AdminSettingsTab } from './AdminSettingsTab';
import { AdminOrdersTab } from './AdminOrdersTab';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  images: ImageItem[];
  customBackgrounds?: MockupBackground[];
  adminUser: AdminUser | null;
  onOpenLogin: () => void;
  initialCategory?: Category;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  images,
  customBackgrounds = [],
  adminUser,
  onOpenLogin,
  initialCategory = 'T-Shirt',
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>(initialCategory);
  const [activeTab, setActiveTab] = useState<'artwork' | 'offers' | 'settings' | 'orders'>('artwork');

  // Update category if initialCategory changes
  React.useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory, isOpen]);
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('NextPrinters Studio');
  const [tagsInput, setTagsInput] = useState('ScreenPrint, Apparel, Vintage');

  // Print Spec State
  const [printMethod, setPrintMethod] = useState<PrintSpec['method']>('Screen Printing');
  const [colorWay, setColorWay] = useState('CMYK / 4-Color Process');
  const [material, setMaterial] = useState('100% Combed Ringspun Cotton');
  const [printLocation, setPrintLocation] = useState<PrintSpec['printLocation']>('Front Chest');
  const [dpi, setDpi] = useState<number>(300);

  // Status & Progress
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  if (!adminUser) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 text-center space-y-4">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">Admin Authentication Required</h2>
          <p className="text-xs text-slate-400">
            Only authenticated administrators can upload or delete artwork files in the NextPrinters Vault. Standard users are restricted to viewing, filtering, and downloading photos.
          </p>
          <button
            onClick={() => {
              onClose();
              onOpenLogin();
            }}
            className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs transition-colors shadow-lg shadow-sky-500/20"
          >
            Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const validation = validateImageFile(selectedFile);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid file');
      setFile(null);
      return;
    }
    setFile(selectedFile);
    if (!title) {
      // Auto-populate title from file name without extension
      const nameWithoutExt = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select an artwork file to upload.');
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);
      setSuccessMessage(null);
      setProgress(10);

      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const printSpec: PrintSpec = {
        method: printMethod,
        colorWay,
        material,
        printLocation,
        dpi: Number(dpi) || 300,
      };

      await uploadImageFile(
        file,
        {
          title: title.trim() || 'Untitled Artwork',
          category,
          description: description.trim(),
          author: author.trim() || 'NextPrinters Studio',
          tags,
          printSpec,
        },
        (p) => setProgress(p)
      );

      setSuccessMessage(`"${title || file.name}" uploaded successfully to Firebase Storage & Firestore!`);
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Upload Error:', err);
      setErrorMessage(err.message || 'Failed to upload artwork to Firebase.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteArtwork = async (item: ImageItem) => {
    if (confirm(`Permanently remove "${item.title}" from Firebase Storage and Firestore?`)) {
      try {
        await deleteImage(item.id, item.storagePath);
        setSuccessMessage(`Removed "${item.title}".`);
      } catch (err: any) {
        setErrorMessage(`Delete failed: ${err.message}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-lg border border-sky-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">NextPrinters Admin Control Vault</h2>
              <p className="text-xs text-slate-400">Firebase Storage & Firestore Master Content Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-100 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 py-2 border-b border-slate-200 bg-white overflow-x-auto">
          <button 
            onClick={() => setActiveTab('artwork')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'artwork' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <UploadCloud className="w-4 h-4" /> Artwork Vault
          </button>
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'orders' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <ShoppingBag className="w-4 h-4" /> Customer Orders
          </button>
          <button 
            onClick={() => setActiveTab('offers')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'offers' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Tag className="w-4 h-4" /> Manage Offers
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${activeTab === 'settings' ? 'bg-sky-500 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Settings className="w-4 h-4" /> Site Branding & QR
          </button>
        </div>

        {/* Form & Table Content */}
        <div className="p-6 overflow-y-auto space-y-8">
          
          {activeTab === 'orders' && <AdminOrdersTab />}
          {activeTab === 'offers' && <AdminOffersTab />}
          {activeTab === 'settings' && <AdminSettingsTab />}
          
          {activeTab === 'artwork' && (
            <>
              {/* Notification Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800/80 text-red-200 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Upload Form */}
          <form onSubmit={handleUploadSubmit} className="space-y-6">
            
            {/* File Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-sky-400 bg-sky-500/10'
                  : file
                  ? 'border-emerald-500/60 bg-emerald-950/20'
                  : 'border-slate-300/80 hover:border-sky-500/50 bg-slate-50/60'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileImage className="w-8 h-8 text-emerald-400 shrink-0" />
                  <div className="text-left">
                    <p className="text-sm font-bold text-emerald-300">{file.name}</p>
                    <p className="text-xs text-slate-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                    className="ml-auto text-xs text-slate-400 hover:text-red-400 p-1"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-10 h-10 text-sky-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-800">
                    Drag and drop your print artwork here, or <span className="text-sky-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400">
                    Supported formats: PNG, JPG, JPEG, WEBP • Max file size: <strong className="text-slate-800">500 MB</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Metadata Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Artwork Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyberpunk Neon Skull"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Collection Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  <option value="T-Shirt">T-Shirt</option>
                  <option value="Design">Design</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Designer / Studio</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="NextPrinters Studio"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Search Tags (Comma separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Vintage, Streetwear, Vector"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>

            {/* Print Specification Fields */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4" /> Print Production Specifications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Print Method</label>
                  <select
                    value={printMethod}
                    onChange={(e) => setPrintMethod(e.target.value as PrintSpec['method'])}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Screen Printing">Screen Printing</option>
                    <option value="DTG Direct-to-Garment">DTG Direct-to-Garment</option>
                    <option value="Sublimation">Sublimation</option>
                    <option value="Heat Transfer">Heat Transfer</option>
                    <option value="Embroidery">Embroidery</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Print Location</label>
                  <select
                    value={printLocation}
                    onChange={(e) => setPrintLocation(e.target.value as PrintSpec['printLocation'])}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  >
                    <option value="Front Chest">Front Chest</option>
                    <option value="Full Back">Full Back</option>
                    <option value="Left Sleeve">Left Sleeve</option>
                    <option value="Over-Sized Front">Over-Sized Front</option>
                    <option value="All Over">All Over</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Target DPI</label>
                  <input
                    type="number"
                    value={dpi}
                    onChange={(e) => setDpi(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Colorway Process</label>
                  <input
                    type="text"
                    value={colorWay}
                    onChange={(e) => setColorWay(e.target.value)}
                    placeholder="CMYK / 4-Color Process"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-medium text-slate-400 block mb-1">Garment Material Spec</label>
                  <input
                    type="text"
                    value={material}
                    onChange={(e) => setMaterial(e.target.value)}
                    placeholder="100% Combed Ringspun Cotton / Heavyweight"
                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Description / Print Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Recommended mesh count, flash curing settings, or design notes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Progress Indicator */}
            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-700">
                  <span>Uploading to Firebase Storage...</span>
                  <span className="font-mono text-sky-400 font-bold">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-sky-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={uploading || !file}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sky-500/20"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{uploading ? 'Uploading Artwork to Firebase...' : 'Publish to Firebase Collections Vault'}</span>
            </button>
          </form>

          {/* Existing Vault Items Management List */}
          <div className="pt-6 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Managed Vault Collection ({images.length} items)</span>
              <span className="text-[10px] text-emerald-400 font-medium">Live Firestore & Storage Documents</span>
            </h3>

            {images.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No artwork items stored in Firebase yet.</p>
            ) : (
              <div className="divide-y divide-slate-800/80 bg-slate-50/60 rounded-xl border border-slate-200 overflow-hidden max-h-64 overflow-y-auto">
                {images.map((img) => (
                  <div key={img.id} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={img.url}
                        alt={img.title}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-800 truncate">{img.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {img.category} • {img.fileSize || 'Image'} • {img.downloadCount || 0} downloads
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteArtwork(img)}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/50 border border-slate-200 hover:border-red-800/60 rounded-lg transition-colors shrink-0 flex items-center gap-1.5"
                      title="Delete artwork from Firebase"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium hidden sm:inline">Delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          </>
          )}

        </div>
      </div>
    </div>
  );
};
