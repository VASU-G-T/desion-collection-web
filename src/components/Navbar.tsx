import React from 'react';
import { Printer, ShieldCheck, UploadCloud, LogIn, LogOut, Sparkles, Search } from 'lucide-react';
import { AdminUser, SiteSettings } from '../types';

interface NavbarProps {
  adminUser: AdminUser | null;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenMockupStudio: () => void;
  totalArtworks: number;
  totalDownloads: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSyncing: boolean;
  siteSettings: SiteSettings | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  adminUser,
  onOpenAdmin,
  onOpenLogin,
  onLogout,
  onOpenMockupStudio,
  totalArtworks,
  totalDownloads,
  searchQuery,
  setSearchQuery,
  isSyncing,
  siteSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            {siteSettings?.logoUrl ? (
              <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden">
                <img src={siteSettings.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-sky-500 via-sky-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                <Printer className="w-6 h-6" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-sky-700 bg-clip-text text-transparent">
                  {siteSettings?.siteName || 'NextPrinters'}
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-sky-500/20 text-sky-600 border border-sky-500/30">
                  Vault
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search print designs, tags, or print methods..."
              className="w-full bg-slate-50/80 border border-slate-300/80 rounded-full pl-10 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Tools & Auth Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Stats Pill */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-300 text-xs text-slate-700">
              <div>
                <span className="text-slate-400">Designs:</span>{' '}
                <strong className="text-white font-semibold">{totalArtworks}</strong>
              </div>
              <div className="w-px h-3 bg-slate-700"></div>
              <div>
                <span className="text-slate-400">Downloads:</span>{' '}
                <strong className="text-sky-400 font-semibold">{totalDownloads}</strong>
              </div>
            </div>

            {/* Mockup Studio Button */}
            <button
              onClick={onOpenMockupStudio}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-700 border border-slate-300/80 text-sky-600 hover:text-sky-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title="Interactive Garment & Cloth Color Mockup Studio"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Mockup Studio</span>
            </button>

            {/* Admin Upload / Control */}
            {adminUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdmin}
                  className="bg-sky-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-sky-500/20"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span className="hidden sm:inline">Admin Manager</span>
                </button>
                <div className="flex items-center gap-2 bg-slate-100/80 pl-2 pr-1 py-1 rounded-lg border border-slate-300">
                  <span className="text-xs text-slate-800 font-medium hidden md:inline">
                    {adminUser.displayName || adminUser.email}
                  </span>
                  <button
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-700 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-slate-100 hover:bg-slate-700 text-slate-800 hover:text-white font-medium px-3.5 py-2 rounded-lg text-xs border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-sky-400" />
                <span>Admin Login</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search Input */}
        <div className="pb-3 md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search print designs, tags, print methods..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

      </div>
    </header>
  );
};
