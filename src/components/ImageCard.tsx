import React, { useState } from 'react';
import { ImageItem } from '../types';
import { Heart, Eye, Download, Check, Sparkles, Maximize2, Trash2, Shirt, Edit3 } from 'lucide-react';

interface ImageCardProps {
  image: ImageItem;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenLightbox: (image: ImageItem) => void;
  onRequestDelete?: (image: ImageItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isSelected,
  onToggleSelect,
  onToggleFavorite,
  onOpenLightbox,
  onRequestDelete
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = image.url;
    link.download = `${image.title.replace(/\s+/g, '_')}_nextprinters.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenLightbox(image)}
      className={`group relative bg-slate-900 rounded-3xl overflow-hidden border transition-all duration-300 cursor-pointer flex flex-col font-sans ${
        isSelected
          ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.3)]'
          : 'border-slate-800/80 hover:border-cyan-500/40 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
      }`}
    >
      {/* Thumbnail Aspect Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950">
        
        {/* Loading Skeleton */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-500/40 animate-spin" />
          </div>
        )}

        {/* Thumbnail Image */}
        <img
          src={image.thumbnailUrl || image.url}
          alt={image.title}
          onLoad={() => setIsLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
        />

        {/* Top Overlay Controls */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-end z-10">
          
          {/* Right Group: Save & Delete */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(image.id);
              }}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                image.isFavorite
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                  : 'bg-slate-950/70 hover:bg-rose-500/80 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700/60'
              }`}
              title={image.isFavorite ? 'Saved to favorites' : 'Save design'}
            >
              <Heart className={`w-4 h-4 ${image.isFavorite ? 'fill-current' : ''}`} />
            </button>

            {onRequestDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestDelete(image);
                }}
                className="w-8 h-8 rounded-xl bg-slate-950/70 hover:bg-rose-600 text-slate-300 hover:text-white backdrop-blur-md border border-slate-700/60 flex items-center justify-center transition-all"
                title="Delete artwork"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              </button>
            )}
          </div>

        </div>

        {/* Category Pill Overlay Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10 flex flex-wrap gap-1 font-mono">
          <span className="text-[10px] font-bold bg-slate-950/90 text-cyan-300 backdrop-blur-md px-2.5 py-1 rounded-lg border border-cyan-500/30 shadow-sm">
            {image.category}
          </span>
          {image.printSpec?.method && (
            <span className="text-[10px] font-bold bg-slate-950/90 text-slate-300 backdrop-blur-md px-2 py-1 rounded-lg border border-slate-800 shadow-sm">
              {image.printSpec.method.split(' ')[0]}
            </span>
          )}
        </div>

        {/* Expand Button Hover Overlay Center */}
        <div className={`absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="bg-slate-900/95 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 border border-cyan-500/40 shadow-2xl scale-95 group-hover:scale-100 transition-transform">
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Preview Artwork</span>
          </div>
        </div>

      </div>

      {/* Card Details Body */}
      <div className="p-4 flex flex-col justify-between flex-1 bg-slate-900/90">
        <div>
          <h3 className="text-sm font-extrabold text-slate-100 line-clamp-1 group-hover:text-cyan-300 transition-colors">
            {image.title}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-mono">
            By <span className="text-slate-300 font-semibold">{image.author}</span>
          </p>
        </div>

        {/* Card Footer */}
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-2">
            <span>{image.fileSize}</span>
            <span>•</span>
            <span className="capitalize">{image.aspectRatio}</span>
          </div>

          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
            title="Download full resolution photo"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
