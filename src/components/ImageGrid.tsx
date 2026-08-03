import React from 'react';
import { ImageItem } from '../types';
import { ImageCard } from './ImageCard';
import { ImageIcon, SearchX, Download, Heart, Trash2, CheckCircle2 } from 'lucide-react';

interface ImageGridProps {
  images: ImageItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenLightbox: (image: ImageItem) => void;
  onRequestDelete?: (image: ImageItem) => void;
  onSelectAll: () => void;
  onBulkFavorite: () => void;
  onBulkDownload: () => void;
  onResetFilters: () => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  selectedIds,
  onToggleSelect,
  onToggleFavorite,
  onOpenLightbox,
  onRequestDelete,
  onSelectAll,
  onBulkFavorite,
  onBulkDownload,
  onResetFilters
}) => {
  const isAllSelected = images.length > 0 && selectedIds.size === images.length;

  if (images.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto px-4">
        <div className="w-16 h-16 rounded-3xl bg-stone-800/80 border border-stone-700/60 flex items-center justify-center text-stone-400 mb-4 shadow-inner">
          <SearchX className="w-8 h-8 text-amber-500/80" />
        </div>
        <h3 className="text-lg font-bold text-stone-100">No photos found</h3>
        <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
          We couldn't find any images matching your filter or search criteria. Try clearing search filters or selecting a different category.
        </p>
        <button
          onClick={onResetFilters}
          className="mt-5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
        >
          Reset All Filters
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Grid Quick Tools Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
        <div className="flex items-center space-x-3">
          <button
            onClick={onSelectAll}
            className="flex items-center space-x-1.5 text-stone-300 hover:text-white transition-colors bg-stone-800/60 hover:bg-stone-800 px-3 py-1.5 rounded-lg border border-stone-700/60"
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${isAllSelected ? 'text-amber-400' : ''}`} />
            <span>{isAllSelected ? 'Deselect All' : 'Select All Listed'}</span>
          </button>
          <span>•</span>
          <span>Showing {images.length} photos</span>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onBulkFavorite}
              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg border border-rose-500/30 transition-colors"
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>Favorite ({selectedIds.size})</span>
            </button>
            <button
              onClick={onBulkDownload}
              className="flex items-center space-x-1 px-3 py-1.5 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 rounded-lg border border-amber-500/30 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download ({selectedIds.size})</span>
            </button>
          </div>
        )}
      </div>

      {/* 4-Column Neat Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
        {images.map((img) => (
          <ImageCard
            key={img.id}
            image={img}
            isSelected={selectedIds.has(img.id)}
            onToggleSelect={onToggleSelect}
            onToggleFavorite={onToggleFavorite}
            onOpenLightbox={onOpenLightbox}
            onRequestDelete={onRequestDelete}
          />
        ))}
      </div>

    </div>
  );
};
