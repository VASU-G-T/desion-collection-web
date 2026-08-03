import React from 'react';
import { Database, Heart, Sparkles, ArrowUp, Cpu } from 'lucide-react';
import { ShopLogo } from './ShopLogo';

interface FooterProps {
  totalCount: number;
  favoritesCount: number;
  onScrollToTop: () => void;
  onScrollToAdmin: () => void;
  customLogoUrl?: string | null;
}

export const Footer: React.FC<FooterProps> = ({
  totalCount,
  favoritesCount,
  onScrollToTop,
  onScrollToAdmin,
  customLogoUrl
}) => {
  return (
    <footer className="bg-slate-950 border-t border-cyan-500/20 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 transition-colors font-sans">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
        
        {/* Brand & Note */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-cyan-500/40 flex items-center justify-center p-1.5 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]">
            <ShopLogo customLogoUrl={customLogoUrl} className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <span className="font-extrabold text-white block text-sm">NextPrinters Collections — Vault Grid</span>
            <span className="text-slate-500 text-[11px] font-mono">Sci-Fi Apparel Collections Engine • IndexedDB Local Vault</span>
          </div>
        </div>

        {/* Quick Footer Links */}
        <div className="flex items-center space-x-6 font-mono text-xs">
          <button
            onClick={onScrollToAdmin}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center space-x-1.5 transition-all bg-cyan-950/80 border border-cyan-500/30 px-3.5 py-2 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Manage Collections Portal</span>
          </button>

          <button
            onClick={onScrollToTop}
            className="text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-slate-500 gap-2">
        <p>© 2026 NextPrinters Collections. Permanent file management and sci-fi apparel artwork system.</p>
        <div className="flex items-center space-x-4">
          <span>{totalCount} Total Print Files</span>
          <span>•</span>
          <span>{favoritesCount} Favorites Saved</span>
        </div>
      </div>
    </footer>
  );
};
