import React, { useState, useEffect, useMemo } from 'react';
import { ImageItem, FilterState, AdminUser, SortOption, Category, MockupBackground, Offer, SiteSettings } from './types';
import { subscribeToAuthChanges, logout } from './services/authService';
import {
  subscribeToGallery,
  subscribeToBackgrounds,
  incrementDownloadCount,
  incrementViewCount,
  toggleFavoriteInFirestore,
  deleteImage,
  subscribeToOffers,
  getSiteSettings,
  subscribeToCustomerNotifications
} from './services/firebaseGalleryService';

import { Navbar } from './components/Navbar';
import { IntroOffersModal } from './components/IntroOffersModal';
import { FilterBar } from './components/FilterBar';
import { ImageCard } from './components/ImageCard';
import { LightboxModal } from './components/LightboxModal';
import { MockupModal } from './components/MockupModal';
import { AdminPanel } from './components/AdminPanel';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CustomerOrderPortalModal, getLocalCustomerOrderRefs } from './components/CustomerOrderPortalModal';

import { Printer, UploadCloud, AlertCircle } from 'lucide-react';

const LOCAL_FAVORITES_KEY = 'nextprinters_favorite_ids';

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [customBackgrounds, setCustomBackgrounds] = useState<MockupBackground[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Local favorites set
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Filter & Search State
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    category: 'All',
    sortBy: 'newest',
    onlyFavorites: false,
    selectedTag: null,
  });

  // Modal States
  const [lightboxImage, setLightboxImage] = useState<ImageItem | null>(null);
  const [mockupImage, setMockupImage] = useState<ImageItem | null>(null);
  const [isMockupOpen, setIsMockupOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isOrderPortalOpen, setIsOrderPortalOpen] = useState(false);
  const [portalOrderRef, setPortalOrderRef] = useState<{ id: string; phone: string }>({ id: '', phone: '' });
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [uploadCategory, setUploadCategory] = useState<Category>('T-Shirt');

  const handleOpenOrderPortal = (orderId = '', phone = '') => {
    setPortalOrderRef({ id: orderId, phone });
    setIsOrderPortalOpen(true);
  };

  useEffect(() => {
    const refs = getLocalCustomerOrderRefs();
    if (refs.length === 0) return;
    const unsub = subscribeToCustomerNotifications(
      refs.map((r) => r.id),
      (list) => {
        setUnreadNotificationsCount(list.filter((n) => !n.read).length);
      }
    );
    return () => unsub();
  }, [isOrderPortalOpen]);

  const handleOpenUploadForCategory = (cat: Category) => {
    setUploadCategory(cat);
    if (adminUser) {
      setIsAdminPanelOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  // Save favorites to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(Array.from(favoriteIds)));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }, [favoriteIds]);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubAuth = subscribeToAuthChanges((user) => {
      setAdminUser(user);
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to Firebase Firestore real-time gallery updates
  useEffect(() => {
    setIsSyncing(true);
    const unsubGallery = subscribeToGallery(
      (items) => {
        setImages(items);
        setIsSyncing(false);
        setErrorState(null);
      },
      (err) => {
        setIsSyncing(false);
        setErrorState(`Firebase sync error: ${err.message}`);
      }
    );

    const unsubBgs = subscribeToBackgrounds(
      (bgs) => {
        setCustomBackgrounds(bgs);
      },
      (err) => {
        console.warn('Backgrounds subscription error:', err);
      }
    );

    const unsubOffers = subscribeToOffers(
      (offs) => {
        setOffers(offs);
        const activeOffers = offs.filter(o => o.isActive);
        if (activeOffers.length > 0 && !sessionStorage.getItem('hasSeenIntro')) {
          setShowIntroModal(true);
        }
      }
    );

    getSiteSettings().then(data => {
      if (data) setSiteSettings(data);
    });

    return () => {
      unsubGallery();
      unsubBgs();
      unsubOffers();
    };
  }, []);

  // Toggle Favorite
  const handleToggleFavorite = async (imageId: string) => {
    const isFav = favoriteIds.has(imageId);
    const newSet = new Set(favoriteIds);
    let delta = 1;

    if (isFav) {
      newSet.delete(imageId);
      delta = -1;
    } else {
      newSet.add(imageId);
      delta = 1;
    }
    setFavoriteIds(newSet);

    // Sync count change with Firebase Firestore
    try {
      await toggleFavoriteInFirestore(imageId, delta);
    } catch (err) {
      console.warn('Could not sync favorite to Firebase:', err);
    }
  };

  // Download Artwork
  const handleDownloadArtwork = async (image: ImageItem) => {
    try {
      // Create temporary anchor to force browser download
      const res = await fetch(image.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const fileExt = image.url.includes('.png') ? 'png' : 'jpg';
      a.download = `${image.title.replace(/[^a-zA-Z0-9]/g, '_')}_NextPrinters.${fileExt}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      // Increment count in Firebase Firestore
      await incrementDownloadCount(image.id);
    } catch (err) {
      // Fallback: direct window open
      window.open(image.url, '_blank');
      incrementDownloadCount(image.id).catch(() => {});
    }
  };

  // Open Lightbox with view count increment
  const handleOpenLightbox = (image: ImageItem) => {
    setLightboxImage(image);
    incrementViewCount(image.id).catch(() => {});
  };

  // Delete Artwork
  const handleDeleteArtwork = async (image: ImageItem) => {
    try {
      await deleteImage(image.id, image.storagePath);
      if (lightboxImage?.id === image.id) setLightboxImage(null);
    } catch (err: any) {
      alert(`Failed to delete artwork: ${err.message}`);
    }
  };

  // Extract all available tags across collection
  const availableTags = useMemo(() => {
    const tagMap = new Map<string, number>();
    images.forEach((img) => {
      img.tags?.forEach((t) => {
        const clean = t.trim();
        if (clean) {
          tagMap.set(clean, (tagMap.get(clean) || 0) + 1);
        }
      });
    });
    return Array.from(tagMap.keys()).sort((a, b) => (tagMap.get(b) || 0) - (tagMap.get(a) || 0));
  }, [images]);

  // Total downloads aggregate
  const totalDownloads = useMemo(() => {
    return images.reduce((acc, img) => acc + (img.downloadCount || 0), 0);
  }, [images]);

  // Filter & Sort Logic
  const filteredImages = useMemo(() => {
    return images
      .map((img) => ({
        ...img,
        isFavorite: favoriteIds.has(img.id),
      }))
      .filter((img) => {
        // Search Query Filter
        if (filterState.searchQuery) {
          const q = filterState.searchQuery.toLowerCase();
          const matchesTitle = img.title.toLowerCase().includes(q);
          const matchesAuthor = img.author.toLowerCase().includes(q);
          const matchesDesc = img.description.toLowerCase().includes(q);
          const matchesCategory = img.category.toLowerCase().includes(q);
          const matchesMethod = img.printSpec?.method?.toLowerCase().includes(q) || false;
          const matchesTags = img.tags?.some((t) => t.toLowerCase().includes(q)) || false;
          if (!matchesTitle && !matchesAuthor && !matchesDesc && !matchesCategory && !matchesMethod && !matchesTags) {
            return false;
          }
        }

        // Category Filter
        if (filterState.category !== 'All' && img.category !== filterState.category) {
          return false;
        }

        // Tag Filter
        if (filterState.selectedTag && !img.tags?.includes(filterState.selectedTag)) {
          return false;
        }

        // Favorites Filter
        if (filterState.onlyFavorites && !img.isFavorite) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filterState.sortBy === 'downloads') {
          return (b.downloadCount || 0) - (a.downloadCount || 0);
        }
        if (filterState.sortBy === 'favorites') {
          return (b.favoriteCount || 0) - (a.favoriteCount || 0);
        }
        if (filterState.sortBy === 'views') {
          return (b.views || 0) - (a.views || 0);
        }
        if (filterState.sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        // Default: newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [images, favoriteIds, filterState]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-slate-950">
      
      {/* Top Navbar */}
      <Navbar
        siteSettings={siteSettings}
        adminUser={adminUser}
        onOpenAdmin={() => {
          if (adminUser) {
            setIsAdminPanelOpen(true);
          } else {
            setIsLoginModalOpen(true);
          }
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={() => logout()}
        onOpenMockupStudio={() => {
          if (filteredImages.length > 0) {
            setMockupImage(filteredImages[0]);
          } else if (images.length > 0) {
            setMockupImage(images[0]);
          } else {
            setMockupImage(null);
          }
          setIsMockupOpen(true);
        }}
        onOpenOrderTracker={() => handleOpenOrderPortal()}
        unreadNotificationsCount={unreadNotificationsCount}
        totalArtworks={images.length}
        totalDownloads={totalDownloads}
        searchQuery={filterState.searchQuery}
        setSearchQuery={(q) => setFilterState((prev) => ({ ...prev, searchQuery: q }))}
        isSyncing={isSyncing}
        artworks={images}
      />

      {/* Filter Toolbar */}
      <FilterBar
        filterState={filterState}
        setFilterState={setFilterState}
        totalCount={filteredImages.length}
        availableTags={availableTags}
        onUploadCategory={adminUser ? handleOpenUploadForCategory : undefined}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error notification if any */}
        {errorState && (
          <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorState}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sky-400 hover:underline font-bold"
            >
              Reload Page
            </button>
          </div>
        )}

        {/* Gallery Masonry/Grid Showcase */}
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                isAdmin={!!adminUser}
                onOpenLightbox={handleOpenLightbox}
                onOpenMockup={(img) => {
                  setMockupImage(img);
                  setIsMockupOpen(true);
                }}
                onToggleFavorite={handleToggleFavorite}
                onDownload={handleDownloadArtwork}
                onDelete={handleDeleteArtwork}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white/60 border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto space-y-4 my-12">
            <div className="w-16 h-16 bg-slate-100 text-sky-400 rounded-2xl border border-slate-300 flex items-center justify-center mx-auto shadow-inner">
              <Printer className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No Artwork Items Found</h3>
              <p className="text-xs text-slate-400">
                {filterState.searchQuery || filterState.category !== 'All' || filterState.onlyFavorites
                  ? 'No artwork matching your search criteria or filters.'
                  : 'Your Firebase Collections Vault is currently empty.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {(filterState.searchQuery || filterState.category !== 'All' || filterState.onlyFavorites) ? (
                <button
                  onClick={() =>
                    setFilterState({
                      searchQuery: '',
                      category: 'All',
                      sortBy: 'newest',
                      onlyFavorites: false,
                      selectedTag: null,
                    })
                  }
                  className="bg-slate-100 hover:bg-slate-700 text-slate-800 px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 transition-colors"
                >
                  Reset All Filters
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (adminUser) {
                      setIsAdminPanelOpen(true);
                    } else {
                      setIsLoginModalOpen(true);
                    }
                  }}
                  className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors shadow-lg shadow-sky-500/20 flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload First Print Artwork</span>
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-900 py-8 text-center text-xs text-slate-400 space-y-2">
        <div className="flex items-center justify-center gap-2 font-medium text-slate-400">
          <Printer className="w-4 h-4 text-sky-400" />
          <span>NextPrinters Master Collections Vault</span>
        </div>
        <p>Backed by Firebase Authentication, Cloud Firestore, and Firebase Storage.</p>
      </footer>

      {/* Lightbox Modal */}
      <LightboxModal
        image={lightboxImage}
        onClose={() => setLightboxImage(null)}
        onToggleFavorite={handleToggleFavorite}
        onDownload={handleDownloadArtwork}
        onOpenMockup={(img) => {
          setMockupImage(img);
          setIsMockupOpen(true);
        }}
      />

      {/* Garment Mockup Studio Modal */}
      <MockupModal
        isOpen={isMockupOpen}
        image={mockupImage}
        allImages={images}
        customBackgrounds={customBackgrounds}
        adminUser={adminUser}
        siteSettings={siteSettings}
        onOpenOrderPortal={(orderId, phone) => handleOpenOrderPortal(orderId, phone)}
        onClose={() => {
          setIsMockupOpen(false);
          setMockupImage(null);
        }}
      />

      {/* Customer Order Tracking & Payment Submission Portal */}
      <CustomerOrderPortalModal
        isOpen={isOrderPortalOpen}
        onClose={() => setIsOrderPortalOpen(false)}
        siteSettings={siteSettings}
        initialOrderId={portalOrderRef.id}
        initialPhone={portalOrderRef.phone}
      />

      {/* Admin Panel Manager */}
      <AdminPanel
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        images={images}
        customBackgrounds={customBackgrounds}
        adminUser={adminUser}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        initialCategory={uploadCategory}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(user) => {
          if (user) setAdminUser(user);
          setIsAdminPanelOpen(true);
        }}
      />

      {/* Intro Offers Modal */}
      {showIntroModal && (
        <IntroOffersModal 
          offers={offers}
          onClose={() => {
            setShowIntroModal(false);
            sessionStorage.setItem('hasSeenIntro', 'true');
          }}
        />
      )}

    </div>
  );
}
