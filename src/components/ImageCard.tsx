import React, { useState } from 'react';
import { ImageItem } from '../types';
import { Download, Heart, Eye, Trash2, Layers, Sparkles, Tag, Shirt } from 'lucide-react';

interface ImageCardProps {
  image: ImageItem;
  isAdmin: boolean;
  onOpenLightbox: (image: ImageItem) => void;
  onOpenMockup?: (image: ImageItem) => void;
  onToggleFavorite: (imageId: string) => void;
  onDownload: (image: ImageItem) => void;
  onDelete: (image: ImageItem) => void;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  image,
  isAdmin,
  onOpenLightbox,
  onOpenMockup,
  onToggleFavorite,
  onDownload,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="group relative bg-white rounded-xl border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl hover:border-sky-500/40 transition-all duration-300 flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Preview Container */}
      <div
        className="relative w-full aspect-square bg-slate-50 overflow-hidden cursor-pointer"
        onClick={() => onOpenLightbox(image)}
      >
        {!imageLoaded && (
          <div className="absolute inset-0 bg-slate-100 animate-pulse flex items-center justify-center text-slate-600">
            <Layers className="w-8 h-8 animate-spin" />
          </div>
        )}
        <img
          src={image.url}
          alt={image.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Hover Quick Overlay Controls */}
        <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-between p-4 pointer-events-none">
          <div className="flex justify-end pointer-events-auto">
            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(image.id);
              }}
              className={`p-2 rounded-full transition-transform active:scale-90 ${
                image.isFavorite
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-white/90 text-slate-800 hover:text-red-400 hover:bg-white'
              }`}
              title={image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart className={`w-4 h-4 ${image.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenLightbox(image);
              }}
              className="p-2 bg-white/90 hover:bg-slate-100 text-slate-800 rounded-lg border border-slate-300 transition-colors"
              title="View Full Resolution Photo"
            >
              <Eye className="w-4 h-4 text-slate-700" />
            </button>

            {onOpenMockup && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMockup(image);
                }}
                className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-2 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-colors shadow-md"
                title="Preview Artwork on Apparel & Clothing Colors"
              >
                <Shirt className="w-3.5 h-3.5" />
                <span className="truncate">Garment Mockup</span>
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(image);
              }}
              className="p-2 bg-white/90 hover:bg-slate-100 text-white rounded-lg border border-slate-300 transition-colors"
              title="Download High-Res Artwork"
            >
              <Download className="w-4 h-4 text-sky-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Card Body Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <h3
            onClick={() => onOpenLightbox(image)}
            className="font-bold text-slate-900 text-sm truncate hover:text-sky-400 cursor-pointer transition-colors"
            title={image.title}
          >
            {image.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
            By {image.author} • {image.fileSize}
          </p>
        </div>

        {/* Footer Metrics & Actions */}
        <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-slate-400" title="Total Downloads">
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>{image.downloadCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400" title="Total Favorites">
              <Heart className="w-3.5 h-3.5 text-red-400" />
              <span>{image.favoriteCount || 0}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-400 hidden sm:flex" title="Views">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>{image.views || 0}</span>
            </span>
          </div>

          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${image.title}" permanently from Firebase Storage & Firestore?`)) {
                  onDelete(image);
                }
              }}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-100 rounded transition-colors"
              title="Admin Delete Artwork"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
