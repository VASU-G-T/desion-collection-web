import React from 'react';
import { Search, Heart, X, Lock, ShieldCheck, LogOut, Terminal, Cpu, Zap, Database, Camera } from 'lucide-react';
import { FilterState } from '../types';
import { ShopLogo } from './ShopLogo';

interface HeaderProps {
  filter: FilterState;
  setFilter: React.Dispatch<React.SetStateAction<FilterState>>;
  totalImagesCount: number;
  filteredCount: number;
  selectedCount: number;
  onClearSelection: () => void;
  onScrollToAdmin: () => void;
  favoritesCount: number;
  isAdminLoggedIn?: boolean;
  onOpenAdminLogin?: () => void;
  onLogoutAdmin?: () => void;
  customLogoUrl?: string | null;
  onOpenLogoModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filter,
  setFilter,
  totalImagesCount,
  filteredCount,
  selectedCount,
  onClearSelection,
  onScrollToAdmin,
  favoritesCount,
  isAdminLoggedIn = false,
  onOpenAdminLogin,
  onLogoutAdmin,
  customLogoUrl,
  onOpenLogoModal
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-cyan-500/20 text-slate-100 px-4 sm:px-6 lg:px-8 py-4 transition-all shadow-[0_0_25px_rgba(6,182,212,0.1)] font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Sci-Fi Stats Badge */}
        <div className="flex items-center space-x-3.5">
          <div 
            onClick={isAdminLoggedIn ? onOpenLogoModal : undefined}
            className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/50 flex items-center justify-center p-2 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] relative group overflow-hidden ${isAdminLoggedIn ? 'cursor-pointer hover:border-cyan-400' : ''}`}
            title={isAdminLoggedIn ? 'Click to change shop logo (Admin)' : 'NextPrinters Collections'}
          >
            <div className="absolute inset-0 bg-cyan-500/10 blur-sm group-hover:bg-cyan-500/20 transition-all"></div>
            <ShopLogo customLogoUrl={customLogoUrl} className="w-8 h-8 text-cyan-400 relative z-10 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]" animated />
            {isAdminLoggedIn && (
              <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20 text-cyan-400">
                <Camera className="w-5 h-5" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              NextPrinters
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-cyan-950/80 text-cyan-400 px-2.5 py-0.5 rounded-md border border-cyan-500/40 shadow-inner">
                COLLECTIONS VAULT
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {filteredCount === totalImagesCount ? (
                <span>Indexed <strong className="text-cyan-400 font-bold">{totalImagesCount}</strong> T-shirt print designs</span>
              ) : (
                <span>Showing <strong className="text-cyan-400 font-bold">{filteredCount}</strong> of {totalImagesCount} designs</span>
              )}
            </p>
          </div>
        </div>

        {/* Live Search & Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Live Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400 pointer-events-none" />
            <input
              type="text"
              value={filter.searchQuery}
              onChange={(e) => setFilter(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search by title, category, author, tag..."
              className="w-full bg-slate-900/90 border border-slate-800 text-slate-100 text-xs font-medium rounded-2xl pl-10 pr-9 py-2.5 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/50 placeholder-slate-500 transition-all shadow-inner"
            />
            {filter.searchQuery && (
              <button
                onClick={() => setFilter(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Action Pills */}
          <div className="flex items-center space-x-2">
            
            {/* Filter Favorites Only Toggle */}
            <button
              onClick={() => setFilter(prev => ({ ...prev, onlyFavorites: !prev.onlyFavorites }))}
              className={`flex items-center space-x-1.5 text-xs font-mono font-bold px-3.5 py-2.5 rounded-2xl border transition-all ${
                filter.onlyFavorites
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.25)]'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${filter.onlyFavorites ? 'fill-rose-500 text-rose-500' : 'text-slate-400'}`} />
              <span>Saved</span>
              <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-slate-950 rounded-full text-cyan-400 border border-slate-800">
                {favoritesCount}
              </span>
            </button>

            {/* Sort Dropdown */}
            <select
              value={filter.sortBy}
              onChange={(e) => setFilter(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="bg-slate-900 text-slate-200 text-xs font-mono border border-slate-800 rounded-2xl px-3 py-2.5 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="popular">Most Popular</option>
              <option value="title">Alphabetical</option>
            </select>

            {/* Admin Management Button */}
            {isAdminLoggedIn && (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={onScrollToAdmin}
                  className="flex items-center space-x-1.5 text-xs font-mono font-bold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-3.5 py-2.5 rounded-2xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                >
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Manage Collections</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition-all text-xs"
                  title="Logout Admin Session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Selection Notification Bar */}
      {selectedCount > 0 && (
        <div className="mt-3 max-w-7xl mx-auto bg-cyan-950/80 border border-cyan-500/40 rounded-2xl p-2.5 px-4 flex items-center justify-between text-xs font-mono text-cyan-300 animate-fadeIn shadow-[0_0_20px_rgba(6,182,212,0.2)]">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span><strong className="font-bold text-white">{selectedCount}</strong> artwork file(s) selected for batch action</span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white flex items-center space-x-1 hover:underline text-[11px]"
          >
            <span>Deselect all</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
};
