import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Printer, UploadCloud, LogIn, LogOut, Sparkles, Search, Clock, Tag, Folder, X, ArrowRight, Package } from 'lucide-react';
import { AdminUser, SiteSettings, ImageItem } from '../types';

interface NavbarProps {
  adminUser: AdminUser | null;
  onOpenAdmin: () => void;
  onOpenLogin: () => void;
  onLogout: () => void;
  onOpenMockupStudio: () => void;
  onOpenOrderTracker?: () => void;
  unreadNotificationsCount?: number;
  totalArtworks: number;
  totalDownloads: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSyncing: boolean;
  siteSettings: SiteSettings | null;
  artworks?: ImageItem[];
}

export const Navbar: React.FC<NavbarProps> = ({
  adminUser,
  onOpenAdmin,
  onOpenLogin,
  onLogout,
  onOpenMockupStudio,
  onOpenOrderTracker,
  unreadNotificationsCount = 0,
  totalArtworks,
  totalDownloads,
  searchQuery,
  setSearchQuery,
  isSyncing,
  siteSettings,
  artworks = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nextprinters_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch (e) {
      console.warn('Could not load recent searches', e);
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term || !term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...recentSearches.filter((s) => s.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem('nextprinters_recent_searches', JSON.stringify(updated));
    } catch (e) {}
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live search suggestions based on input
  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const list: Array<{ id: string; text: string; subtext?: string; type: 'title' | 'tag' | 'category' | 'spec' }> = [];
    const added = new Set<string>();

    // 1. Titles
    artworks.forEach((art) => {
      if (art.title && art.title.toLowerCase().includes(q) && !added.has(art.title.toLowerCase())) {
        added.add(art.title.toLowerCase());
        list.push({ id: `t-${art.id}`, text: art.title, subtext: `In ${art.category}`, type: 'title' });
      }
    });

    // 2. Tags
    artworks.forEach((art) => {
      art.tags?.forEach((tag) => {
        if (tag.toLowerCase().includes(q) && !added.has(tag.toLowerCase())) {
          added.add(tag.toLowerCase());
          list.push({ id: `tag-${tag}`, text: tag, subtext: 'Tag Keyword', type: 'tag' });
        }
      });
    });

    // 3. Category Names
    artworks.forEach((art) => {
      if (art.category && art.category.toLowerCase().includes(q) && !added.has(art.category.toLowerCase())) {
        added.add(art.category.toLowerCase());
        list.push({ id: `cat-${art.category}`, text: `${art.category} Collection`, type: 'category' });
      }
    });

    // 4. Print Spec methods
    artworks.forEach((art) => {
      if (art.printSpec?.method && art.printSpec.method.toLowerCase().includes(q) && !added.has(art.printSpec.method.toLowerCase())) {
        added.add(art.printSpec.method.toLowerCase());
        list.push({ id: `spec-${art.printSpec.method}`, text: art.printSpec.method, subtext: 'Print Method', type: 'spec' });
      }
    });

    return list.slice(0, 7);
  }, [searchQuery, artworks]);

  const handleSelect = (term: string) => {
    setSearchQuery(term);
    saveRecentSearch(term);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const activeItems = searchQuery ? suggestions : recentSearches.map((s) => ({ text: s, type: 'history' }));
    if (!isOpen || activeItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < activeItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activeItems.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < activeItems.length) {
        e.preventDefault();
        const selected = activeItems[selectedIndex];
        handleSelect(selected.text);
      } else if (searchQuery) {
        saveRecentSearch(searchQuery);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Helper to render matching query highlighted text
  const renderHighlightedText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="font-bold text-sky-400 underline decoration-sky-400/50">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 shrink-0">
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

          {/* Search Bar with Autocomplete Dropdown (Desktop) */}
          <div ref={containerRef} className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpen(true);
                  setSelectedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search collection names, designs, tags..."
                className="w-full bg-slate-100/90 border border-slate-300 rounded-full pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-inner transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setIsOpen(false);
                  }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown Panel */}
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* When User has typed input -> Show Autocomplete Suggestions */}
                {searchQuery.trim() ? (
                  suggestions.length > 0 ? (
                    <div className="py-2">
                      <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                        <span>Related Collection Results</span>
                        <span className="text-[10px] text-sky-400">{suggestions.length} matches</span>
                      </div>
                      {suggestions.map((item, idx) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(item.text)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                            selectedIndex === idx ? 'bg-sky-600/30 text-sky-200 border-l-4 border-sky-400 pl-3' : 'hover:bg-slate-800/80 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {item.type === 'title' ? (
                              <Search className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            ) : item.type === 'tag' ? (
                              <Tag className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            ) : item.type === 'category' ? (
                              <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            )}
                            <span className="font-medium">{renderHighlightedText(item.text, searchQuery)}</span>
                          </div>
                          {item.subtext && (
                            <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full shrink-0">
                              {item.subtext}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-4 text-center text-xs text-slate-400">
                      No matching collection names found for "<span className="text-white font-medium">{searchQuery}</span>"
                    </div>
                  )
                ) : (
                  /* When Input is Empty -> Show Recent Searches & Popular Tags */
                  <div className="py-2">
                    {recentSearches.length > 0 && (
                      <div>
                        <div className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1 flex items-center justify-between">
                          <span>Recent Searches</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRecentSearches([]);
                              localStorage.removeItem('nextprinters_recent_searches');
                            }}
                            className="text-[10px] text-slate-400 hover:text-red-400 transition-colors"
                          >
                            Clear history
                          </button>
                        </div>
                        {recentSearches.map((term, idx) => (
                          <div
                            key={`hist-${idx}`}
                            onClick={() => handleSelect(term)}
                            onMouseEnter={() => setSelectedIndex(idx)}
                            className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                              selectedIndex === idx ? 'bg-sky-600/30 text-sky-200 border-l-4 border-sky-400 pl-3' : 'hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-medium">{term}</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Popular Collections */}
                    <div className="p-3 border-t border-slate-800/60 mt-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Popular Collections
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['Cyberpunk', 'Samurai', 'Streetwear', 'Synthwave', 'Vintage', 'Minimal'].map((pop) => (
                          <button
                            key={pop}
                            onClick={() => handleSelect(pop)}
                            className="px-2.5 py-1 text-[11px] rounded-lg bg-slate-800 hover:bg-sky-500/20 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition-colors"
                          >
                            #{pop}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Tools & Auth Status */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Stats Pill */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-lg bg-slate-100/80 border border-slate-300 text-xs text-slate-700">
              <div>
                <span className="text-slate-400">Designs:</span>{' '}
                <strong className="text-slate-900 font-semibold">{totalArtworks}</strong>
              </div>
              <div className="w-px h-3 bg-slate-300"></div>
              <div>
                <span className="text-slate-400">Downloads:</span>{' '}
                <strong className="text-sky-600 font-semibold">{totalDownloads}</strong>
              </div>
            </div>

            {/* Track Order & Submit Payment Button */}
            {onOpenOrderTracker && (
              <button
                onClick={onOpenOrderTracker}
                className="relative p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 text-slate-800 hover:text-sky-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                title="Track Order, Courier Status & Submit Payment"
              >
                <Package className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Track Order</span>
                {unreadNotificationsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-extrabold">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Mockup Studio Button */}
            <button
              onClick={onOpenMockupStudio}
              className="p-2 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 text-sky-600 hover:text-sky-700 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title="Interactive Garment & Cloth Color Mockup Studio"
            >
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">Mockup Studio</span>
            </button>

            {/* Admin Upload / Control */}
            {adminUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenAdmin}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-3 py-2 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-sky-500/20"
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
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-slate-200 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium px-3.5 py-2 rounded-lg text-xs border border-slate-300 transition-colors flex items-center gap-1.5"
              >
                <LogIn className="w-4 h-4 text-sky-500" />
                <span>Admin Login</span>
              </button>
            )}

          </div>
        </div>

        {/* Mobile Search Input with Autocomplete */}
        <div className="pb-3 md:hidden relative">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Search print designs, tags, print methods..."
              className="w-full bg-slate-100 border border-slate-300 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Mobile Autocomplete Popup */}
          {isOpen && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50 text-slate-100">
              {suggestions.map((item) => (
                <div
                  key={`m-${item.id}`}
                  onClick={() => handleSelect(item.text)}
                  className="px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Search className="w-3 h-3 text-sky-400" />
                    <span>{renderHighlightedText(item.text, searchQuery)}</span>
                  </div>
                  {item.subtext && <span className="text-[10px] text-slate-400">{item.subtext}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

