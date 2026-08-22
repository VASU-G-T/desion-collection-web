import React from 'react';
import { Category, SortOption, FilterState } from '../types';
import { Heart, ArrowUpDown, Grid, Shirt, Palette, Image as ImageIcon, Sparkles, UploadCloud, Plus } from 'lucide-react';

interface FilterBarProps {
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  totalCount: number;
  availableTags: string[];
  onUploadCategory?: (category: Category) => void;
}

const CATEGORY_TABS: { id: Category; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'All', label: 'All Collections', icon: Grid },
  { id: 'T-Shirt', label: 'T-Shirts & Apparel', icon: Shirt },
  { id: 'Design', label: 'Print Designs & Logos', icon: Palette },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  setFilterState,
  totalCount,
  onUploadCategory,
}) => {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilterState((prev) => ({ ...prev, sortBy: e.target.value as SortOption }));
  };

  const handleToggleFavorites = () => {
    setFilterState((prev) => ({ ...prev, onlyFavorites: !prev.onlyFavorites }));
  };

  const handleCategorySelect = (cat: Category) => {
    setFilterState((prev) => ({ ...prev, category: cat }));
  };

  return (
    <div className="bg-white border-b border-slate-200 py-3.5 px-4 sm:px-6 lg:px-8 space-y-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = filterState.category === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleCategorySelect(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20 font-bold'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Action Tools: Upload Buttons & Sorting */}
        <div className="flex items-center flex-wrap sm:flex-nowrap justify-between md:justify-end gap-2.5">
          
          {/* Individual Category Upload Buttons */}
          {onUploadCategory && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUploadCategory('T-Shirt')}
                className="bg-slate-100 hover:bg-slate-700 border border-slate-300 text-sky-600 hover:text-sky-700 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Upload new T-Shirt or Garment Blank"
              >
                <Shirt className="w-3.5 h-3.5 text-sky-400" />
                <span>+ Upload T-Shirt</span>
              </button>

              <button
                onClick={() => onUploadCategory('Design')}
                className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-sky-500/10"
                title="Upload new Print Artwork or Logo"
              >
                <Palette className="w-3.5 h-3.5" />
                <span>+ Upload Design</span>
              </button>
            </div>
          )}

          <div className="h-4 w-px bg-slate-100 hidden sm:block" />

          {/* Favorites Filter Toggle */}
          <button
            onClick={handleToggleFavorites}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all border ${
              filterState.onlyFavorites
                ? 'bg-red-500/20 border-red-500/50 text-red-400 font-semibold'
                : 'bg-slate-100/80 border-slate-300/80 text-slate-700 hover:text-white'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${filterState.onlyFavorites ? 'fill-red-400 text-red-400' : ''}`} />
            <span className="hidden sm:inline">Favorites</span>
          </button>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-300/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <select
              value={filterState.sortBy}
              onChange={handleSortChange}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="newest" className="bg-white text-slate-800">Newest Uploads</option>
              <option value="downloads" className="bg-white text-slate-800">Most Downloaded</option>
              <option value="favorites" className="bg-white text-slate-800">Most Favorited</option>
              <option value="views" className="bg-white text-slate-800">Most Viewed</option>
              <option value="title" className="bg-white text-slate-800">Alphabetical (A-Z)</option>
            </select>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 bg-slate-100/80 border border-slate-300/80 px-2 py-1 rounded-xl hidden xl:inline">
            {totalCount} {totalCount === 1 ? 'Item' : 'Items'}
          </span>

        </div>

      </div>
    </div>
  );
};
