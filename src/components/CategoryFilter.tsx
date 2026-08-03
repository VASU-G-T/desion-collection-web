import React from 'react';
import { Category, FilterState } from '../types';
import { Sparkles, Grid, Sliders } from 'lucide-react';

interface CategoryFilterProps {
  activeCategory: Category;
  onSelectCategory: (category: Category) => void;
  categoryCounts: Record<string, number>;
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
}

const CATEGORIES: Category[] = [
  'All',
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

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onSelectCategory,
  categoryCounts,
  filter,
  setFilter
}) => {
  return (
    <div className="bg-slate-950/80 border-b border-cyan-500/10 px-4 sm:px-6 lg:px-8 py-3.5 font-sans">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Category Pills Slider */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase tracking-wider whitespace-nowrap pr-1 flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Taxonomy:
          </span>
          {CATEGORIES.map((cat) => {
            const count = cat === 'All'
              ? (Object.values(categoryCounts) as number[]).reduce((a, b) => a + b, 0)
              : (categoryCounts[cat] || 0);

            const isActive = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-2xl font-bold transition-all flex items-center space-x-2 border text-xs ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-400 to-amber-400 text-slate-950 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-cyan-500/30'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-slate-950/30 text-slate-950 font-black' : 'bg-slate-950 text-cyan-400 border border-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Aspect Ratio Filter Strip */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 border-t border-slate-800/60 font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 flex items-center gap-1 uppercase tracking-wider text-[11px] font-bold">
              <Grid className="w-3.5 h-3.5 text-cyan-400" />
              Orientation:
            </span>
            {(['all', 'landscape', 'square', 'portrait'] as const).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setFilter(prev => ({ ...prev, aspectRatioFilter: ratio }))}
                className={`capitalize px-2.5 py-1 rounded-xl text-[11px] transition-colors font-bold ${
                  filter.aspectRatioFilter === ratio
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          <div className="hidden sm:block text-[11px] text-slate-500 font-mono">
            NextPrinters Apparel Collections Vault
          </div>
        </div>

      </div>
    </div>
  );
};
