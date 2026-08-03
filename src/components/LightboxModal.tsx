import React, { useEffect, useState } from 'react';
import { ImageItem } from '../types';
import { X, Heart, Download, ChevronLeft, ChevronRight, Share2, Calendar, HardDrive, Check, Info, Shirt, Trash2, Cpu } from 'lucide-react';

interface LightboxModalProps {
  image: ImageItem | null;
  imageList: ImageItem[];
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onRequestDelete?: (image: ImageItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  image,
  imageList,
  onClose,
  onToggleFavorite,
  onRequestDelete
}) => {
  const [copied, setCopied] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

  if (!image) return null;

  const currentIndex = imageList.findIndex(img => img.id === image.id);
  const currentItem = imageList[currentIndex] || image;

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      const prevItem = imageList[currentIndex - 1];
      window.dispatchEvent(new CustomEvent('change-lightbox-image', { detail: prevItem }));
    }
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (currentIndex < imageList.length - 1) {
      const nextItem = imageList[currentIndex + 1];
      window.dispatchEvent(new CustomEvent('change-lightbox-image', { detail: nextItem }));
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, imageList]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentItem.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = `${currentItem.title.replace(/\s+/g, '_')}_nextprinters.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 lg:p-6 animate-fadeIn font-sans">
      
      {/* Header Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white font-mono">
        <div className="flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-cyan-500/30 text-xs shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="font-bold text-cyan-400">{currentIndex + 1}</span>
          <span className="text-slate-500">/</span>
          <span className="text-slate-400">{imageList.length}</span>
          <span className="text-slate-700">|</span>
          <span className="truncate max-w-[180px] sm:max-w-xs font-bold text-slate-100">{currentItem.title}</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`p-2.5 rounded-2xl transition-colors border ${
              showInfo ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]' : 'bg-slate-900/80 text-slate-300 border-slate-800'
            }`}
            title="Toggle details sidebar"
          >
            <Info className="w-5 h-5" />
          </button>

          <button
            onClick={() => onToggleFavorite(currentItem.id)}
            className={`p-2.5 rounded-2xl transition-colors border ${
              currentItem.isFavorite
                ? 'bg-rose-500 text-white border-rose-500 shadow-lg'
                : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:bg-rose-500 hover:text-white'
            }`}
            title="Favorite photo"
          >
            <Heart className={`w-5 h-5 ${currentItem.isFavorite ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleDownload}
            className="p-2.5 bg-slate-900/80 hover:bg-cyan-400 text-slate-300 hover:text-slate-950 rounded-2xl border border-slate-800 transition-colors"
            title="Download image"
          >
            <Download className="w-5 h-5" />
          </button>

          <button
            onClick={onClose}
            className="p-2.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-2xl border border-slate-800 transition-colors"
            title="Close viewer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Viewport */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-center pt-16 pb-4 gap-6">
        
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className="absolute left-2 sm:left-4 z-20 p-3 rounded-2xl bg-slate-900/90 hover:bg-cyan-400 text-slate-200 hover:text-slate-950 border border-slate-800 hover:border-cyan-400 transition-all shadow-xl"
            title="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {currentIndex < imageList.length - 1 && (
          <button
            onClick={handleNext}
            className="absolute right-2 sm:right-4 z-20 p-3 rounded-2xl bg-slate-900/90 hover:bg-cyan-400 text-slate-200 hover:text-slate-950 border border-slate-800 hover:border-cyan-400 transition-all shadow-xl"
            title="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Center Display */}
        <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden p-2">
          <img
            src={currentItem.url}
            alt={currentItem.title}
            className="max-h-[82vh] max-w-full object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] border border-slate-800"
          />
        </div>

        {/* Sidebar */}
        {showInfo && (
          <div className="w-full lg:w-80 bg-slate-900/90 border border-cyan-500/30 rounded-3xl p-5 text-slate-200 flex flex-col justify-between max-h-[80vh] overflow-y-auto space-y-4 shadow-2xl backdrop-blur-md">
            <div>
              <div className="flex items-center justify-between font-mono">
                <span className="text-[11px] font-bold uppercase bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-lg">
                  {currentItem.category}
                </span>
                <span className="text-xs text-slate-400">
                  {currentItem.width} × {currentItem.height} px
                </span>
              </div>

              <h2 className="text-lg font-black text-white mt-3 leading-snug">
                {currentItem.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Designed by <strong className="text-slate-200">{currentItem.author}</strong>
              </p>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed border-t border-slate-800 pt-3">
                {currentItem.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-3 font-mono">
                {currentItem.tags.map((tag) => (
                  <span key={tag} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded-md border border-slate-800">
                    #{tag}
                  </span>
                ))}
              </div>

              {/* T-Shirt Specs Box */}
              <div className="mt-4 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2 font-mono">
                <div className="flex items-center text-cyan-400 font-bold gap-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Print Specifications</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                  <div>
                    <span className="block text-slate-500 text-[10px]">Method</span>
                    <span className="text-slate-200 font-bold">{currentItem.printSpec?.method || 'Screen Print'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-[10px]">Placement</span>
                    <span className="text-slate-200 font-bold">{currentItem.printSpec?.placement || 'Front Center'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-400 border-t border-slate-800 pt-3 font-mono">
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-cyan-400" /> Size</span>
                  <span className="text-slate-200 font-bold">{currentItem.fileSize}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> Uploaded</span>
                  <span className="text-slate-200 font-bold">{new Date(currentItem.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 space-y-2 font-mono">
              <button
                onClick={handleCopyLink}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-800 transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-cyan-400" />}
                <span>{copied ? 'Direct Link Copied!' : 'Share Direct Photo Link'}</span>
              </button>

              {onRequestDelete && (
                <button
                  onClick={() => onRequestDelete(currentItem)}
                  className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-rose-500/30 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Request Removal / Delete</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
