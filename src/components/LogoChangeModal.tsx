import React, { useState, useRef } from 'react';
import { Image, Upload, RefreshCw, X, Check, Sparkles, Shield, Camera } from 'lucide-react';
import { ShopLogo } from './ShopLogo';

interface LogoChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLogoUrl: string | null;
  onSaveLogo: (newLogoUrl: string | null) => void;
}

export const LogoChangeModal: React.FC<LogoChangeModalProps> = ({
  isOpen,
  onClose,
  currentLogoUrl,
  onSaveLogo
}) => {
  const [logoMode, setLogoMode] = useState<'upload' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl);
  const [urlInput, setUrlInput] = useState<string>(currentLogoUrl || '');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (PNG, JPG, WEBP, SVG, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 5MB limit. Please select a smaller image.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setPreviewUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) {
      setErrorMsg('Please enter a valid image URL.');
      return;
    }
    setErrorMsg(null);
    setPreviewUrl(urlInput.trim());
  };

  const handleSave = () => {
    onSaveLogo(previewUrl);
    onClose();
  };

  const handleResetToDefault = () => {
    setPreviewUrl(null);
    setUrlInput('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-cyan-500/30 w-full max-w-lg rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.25)] relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Accent Header */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500"></div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Change Shop Logo</span>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded-md">
                  ADMIN ONLY
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Upload custom store branding or logo image
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Logo Preview Box */}
        <div className="my-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 flex flex-col items-center justify-center relative">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">
            Header Preview
          </span>
          <div className="flex items-center space-x-3 bg-slate-900/90 border border-cyan-500/40 px-4 py-2.5 rounded-2xl shadow-lg">
            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-cyan-500/50 flex items-center justify-center p-1.5 overflow-hidden text-cyan-400">
              <ShopLogo customLogoUrl={previewUrl} className="w-full h-full text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-tight flex items-center gap-1.5">
                NextPrinters
                <span className="text-[9px] font-mono bg-cyan-950 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  VAULT
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Shop Logo Display</div>
            </div>
          </div>
        </div>

        {/* Toggle Mode: File Upload vs URL */}
        <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 mb-4">
          <button
            onClick={() => setLogoMode('upload')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              logoMode === 'upload'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image File</span>
          </button>
          <button
            onClick={() => setLogoMode('url')}
            className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              logoMode === 'url'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            <span>Paste Image URL</span>
          </button>
        </div>

        {/* Mode Content */}
        {logoMode === 'upload' ? (
          <div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/40 scale-[1.01]'
                  : 'border-slate-800 hover:border-cyan-500/50 bg-slate-950/40 hover:bg-slate-950/80'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200">
                Click to browse or drag & drop shop logo
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Supports PNG, JPG, WEBP, SVG, GIF (Max 5MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold text-slate-300 block">
              Direct Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/my-shop-logo.png"
                className="flex-1 bg-slate-950 border border-slate-800 focus:border-cyan-500 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none font-mono"
              />
              <button
                onClick={handleApplyUrl}
                className="bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all"
              >
                Preview
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <p className="text-xs font-mono text-rose-400 mt-3 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-xl">
            {errorMsg}
          </p>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-5 mt-5 border-t border-slate-800">
          <button
            onClick={handleResetToDefault}
            className="text-xs font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1.5 transition-colors"
            title="Reset to default flame icon"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Default Emblem</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Save Shop Logo</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
