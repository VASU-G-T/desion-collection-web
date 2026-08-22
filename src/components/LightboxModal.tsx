import React, { useState } from 'react';
import { ImageItem } from '../types';
import { X, Download, Heart, Copy, Check, Shirt, Layers, Calendar, HardDrive, Tag, Eye, Info, Sparkles, AlertCircle } from 'lucide-react';

interface LightboxModalProps {
  image: ImageItem | null;
  onClose: () => void;
  onToggleFavorite: (imageId: string) => void;
  onDownload: (image: ImageItem) => void;
  onOpenMockup?: (image: ImageItem) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  image,
  onClose,
  onToggleFavorite,
  onDownload,
  onOpenMockup,
}) => {
  if (!image) return null;

  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(image.url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const formattedDate = new Date(image.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row my-auto max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 text-slate-400 hover:text-white bg-slate-50/70 hover:bg-slate-50 rounded-full transition-colors border border-slate-300/60"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: High-Res Image Showcase */}
        <div className="lg:w-3/5 bg-slate-50 p-6 flex items-center justify-center relative min-h-[320px] lg:min-h-[500px]">
          <img
            src={image.url}
            alt={image.title}
            referrerPolicy="no-referrer"
            className="max-h-[70vh] w-auto object-contain rounded-lg shadow-2xl border border-slate-200"
          />
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md border border-slate-200 px-3 py-1.5 rounded-lg text-xs text-slate-700">
            <span>{image.width} × {image.height} px</span>
            <span className="mx-2">•</span>
            <span>{image.fileSize}</span>
          </div>
        </div>

        {/* Right: Print Specs & Detailed Info */}
        <div className="lg:w-2/5 p-6 flex flex-col justify-between overflow-y-auto space-y-6">
          <div className="space-y-4">
            
            {/* Title & Author */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-sky-500/20 text-sky-600 border border-sky-500/30">
                  {image.category}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {formattedDate}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white">{image.title}</h2>
              <p className="text-xs text-slate-400 font-medium">By {image.author}</p>
            </div>

            {/* Description */}
            {image.description && (
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/60 border border-slate-200 p-3 rounded-lg">
                {image.description}
              </p>
            )}

            {/* Master Print Specifications Box */}
            <div className="bg-slate-50 border border-sky-500/20 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Print Specifications
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  Target DPI: <strong className="text-emerald-400">{image.printSpec?.dpi || 300} DPI</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Print Method</span>
                  <span className="font-semibold text-slate-800">{image.printSpec?.method || 'Screen Printing'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Print Location</span>
                  <span className="font-semibold text-slate-800">{image.printSpec?.printLocation || 'Front Chest'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Garment Material</span>
                  <span className="font-semibold text-slate-800">{image.printSpec?.material || '100% Cotton'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Colorway Process</span>
                  <span className="font-semibold text-slate-800">{image.printSpec?.colorWay || 'CMYK / Spot Color'}</span>
                </div>
              </div>
            </div>

            {/* Storage Path & Firebase Info */}
            {image.storagePath && (
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-50/40 p-2.5 rounded-lg border border-slate-200">
                <span className="truncate flex items-center gap-1.5 text-slate-400">
                  <HardDrive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate font-mono text-[10px]">{image.storagePath}</span>
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="text-sky-400 hover:text-sky-600 font-medium ml-2 shrink-0 flex items-center gap-1 text-[11px]"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>
            )}

            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {image.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded border border-slate-300/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDownload(image)}
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-lg shadow-sky-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Print File ({image.fileSize})</span>
              </button>

              <button
                onClick={() => onToggleFavorite(image.id)}
                className={`p-3 rounded-xl border transition-colors ${
                  image.isFavorite
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:text-white'
                }`}
                title="Toggle Favorite"
              >
                <Heart className={`w-5 h-5 ${image.isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {onOpenMockup && (
              <button
                onClick={() => {
                  onClose();
                  onOpenMockup(image);
                }}
                className="w-full bg-slate-100 hover:bg-slate-700 text-slate-800 border border-slate-300 font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Shirt className="w-4 h-4 text-sky-400" />
                <span>Preview on Apparel in Garment Studio</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
