import React, { useEffect, useState, useMemo } from 'react';
import { ImageItem, Category, FilterState, StorageStats, AuditLogEntry } from './types';
import { storageService } from './services/storageService';
import { Header } from './components/Header';
import { ImageGrid } from './components/ImageGrid';
import { LightboxModal } from './components/LightboxModal';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { RemovalRequestModal } from './components/RemovalRequestModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { EditImageModal } from './components/EditImageModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { LogoChangeModal } from './components/LogoChangeModal';

export default function App() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Toasts State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Admin Session State (Username: next, Password: printers)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('admin_session') === 'active';
  });
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);

  // Custom Shop Logo State
  const [customShopLogo, setCustomShopLogo] = useState<string | null>(() => {
    return localStorage.getItem('nextprinters_custom_logo');
  });
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  // Modals State
  const [isRemovalModalOpen, setIsRemovalModalOpen] = useState(false);
  const [removalTargetImage, setRemovalTargetImage] = useState<ImageItem | null>(null);

  const [editingImage, setEditingImage] = useState<ImageItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deletingImage, setDeletingImage] = useState<ImageItem | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('nextprinters_audit_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filter State
  const [filter, setFilter] = useState<FilterState>({
    searchQuery: '',
    category: 'All',
    onlyFavorites: false,
    sortBy: 'newest',
    aspectRatioFilter: 'all'
  });

  // Selected Images Set (for bulk actions)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Lightbox Modal Image
  const [lightboxImage, setLightboxImage] = useState<ImageItem | null>(null);

  // Storage Stats
  const [stats, setStats] = useState<StorageStats>({
    totalCount: 0,
    maxCapacity: 10000,
    usedBytes: 0,
    categoryCounts: {}
  });

  // Toast Helper
  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const newToast: ToastMessage = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      title,
      message
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Audit Log Helper
  const recordAuditLog = (action: AuditLogEntry['action'], fileName: string, fileId: string) => {
    const newEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      adminName: 'next',
      action,
      fileName,
      fileId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' ' + new Date().toLocaleDateString()
    };
    setAuditLogs(prev => {
      const updated = [newEntry, ...prev].slice(0, 50);
      try {
        localStorage.setItem('nextprinters_audit_logs', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save audit logs', e);
      }
      return updated;
    });
  };

  const handleClearAuditLogs = () => {
    setAuditLogs([]);
    localStorage.removeItem('nextprinters_audit_logs');
    addToast('info', 'Trail Cleared', 'Audit trail history cleared.');
  };

  // Fetch Images on Mount
  const refreshImages = async () => {
    try {
      const data = await storageService.getAllImages();
      const sanitized = data.map(img => {
        const isRawFilename = /^(screenshot|img[_-]|dsc[_-]|\d{8}[_-]|photo[_-])/i.test(img.title) || /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(img.title);
        if (isRawFilename) {
          return {
            ...img,
            title: img.category || 'Custom Print'
          };
        }
        return img;
      });
      setImages(sanitized);
      const computedStats = await storageService.getStorageStats(sanitized);
      setStats(computedStats);
    } catch (err) {
      console.error('Failed to load gallery images', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshImages();
  }, []);

  // Listen for lightbox image navigation events
  useEffect(() => {
    const handleLightboxChange = (e: Event) => {
      const customEvt = e as CustomEvent<ImageItem>;
      if (customEvt.detail) {
        setLightboxImage(customEvt.detail);
      }
    };
    window.addEventListener('change-lightbox-image', handleLightboxChange);
    return () => window.removeEventListener('change-lightbox-image', handleLightboxChange);
  }, []);

  // Toggle Favorite
  const handleToggleFavorite = async (id: string) => {
    try {
      const isFav = await storageService.toggleFavorite(id);
      setImages(prev => prev.map(img => img.id === id ? { ...img, isFavorite: isFav } : img));
      if (lightboxImage && lightboxImage.id === id) {
        setLightboxImage(prev => prev ? { ...prev, isFavorite: isFav } : null);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  // Toggle Selection Box
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Admin Session Handlers
  const handleAdminLoginSuccess = () => {
    localStorage.setItem('admin_session', 'active');
    setIsAdminLoggedIn(true);
    setIsAdminLoginOpen(false);
    addToast('success', 'Admin Session Online', 'Authenticated as admin "next".');
    setTimeout(() => {
      const adminEl = document.getElementById('admin-panel-section');
      if (adminEl) {
        adminEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('admin_session');
    setIsAdminLoggedIn(false);
    addToast('info', 'Admin Logout', 'Logged out of admin session.');
  };

  // Edit Action Handlers
  const handleOpenEditModal = (image: ImageItem) => {
    setEditingImage(image);
    setIsEditModalOpen(true);
  };

  const handleSaveEditedImage = async (updatedImg: ImageItem) => {
    try {
      await storageService.updateImage(updatedImg);
      setImages(prev => prev.map(img => img.id === updatedImg.id ? updatedImg : img));
      if (lightboxImage?.id === updatedImg.id) {
        setLightboxImage(updatedImg);
      }
      recordAuditLog('Edit Details', updatedImg.title, updatedImg.id);
      addToast('success', 'Details Updated', `Updated metadata for "${updatedImg.title}".`);
    } catch (err) {
      console.error('Failed to update image', err);
      addToast('error', 'Update Failed', 'Could not save file details.');
    }
  };

  // Single File Delete Handlers
  const handleOpenDeleteConfirm = (image: ImageItem) => {
    if (!isAdminLoggedIn) {
      setRemovalTargetImage(image);
      setIsRemovalModalOpen(true);
      return;
    }
    setDeletingImage(image);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmSingleDelete = async () => {
    if (!deletingImage) {
      console.error('❌ Deletion failed: No image selected.');
      return;
    }

    const targetId = deletingImage.id;
    const targetTitle = deletingImage.title;

    console.log(`Starting deletion...`);
    console.log(`Received image ID: ${targetId}`);

    // Security Check: Only authenticated admins can delete
    if (!isAdminLoggedIn) {
      console.error('❌ Permission denied: Admin authentication required.');
      addToast('error', 'Permission Denied', 'Only authenticated administrators can delete files.');
      throw new Error('Permission denied');
    }

    try {
      // Step 1: Delete from storage and database completely
      await storageService.deleteImage(targetId);

      // Step 2: Update UI state & Memory Cache ONLY after successful storage deletion
      setImages(prev => {
        const updated = prev.filter(img => img.id !== targetId);
        storageService.getStorageStats(updated).then(newStats => setStats(newStats));
        return updated;
      });

      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });

      if (lightboxImage?.id === targetId) {
        setLightboxImage(null);
      }

      recordAuditLog('Delete Permanently', targetTitle, targetId);
      addToast('success', 'File Deleted', `Successfully deleted "${targetTitle}".`);
    } catch (err: any) {
      console.error(`❌ Deletion failed for image ${targetId}:`, err);
      const msg = err?.message || 'Failed to delete image from storage';
      addToast('error', 'Delete Failed', msg);
      throw err; // Re-throw so DeleteConfirmModal displays the error and prevents closing dialog
    } finally {
      setDeletingImage(null);
    }
  };

  // Bulk Files Delete Handlers
  const handleOpenBulkDeleteConfirm = (ids: string[]) => {
    if (!isAdminLoggedIn) {
      setIsAdminLoginOpen(true);
      return;
    }
    setBulkDeleteIds(ids);
    setIsBulkDeleteConfirmOpen(true);
  };

  const handleConfirmBulkDelete = async () => {
    if (!bulkDeleteIds || bulkDeleteIds.length === 0) {
      console.error('❌ Bulk deletion failed: No item IDs provided.');
      return;
    }

    console.log(`Starting bulk deletion...`);
    console.log(`Received ${bulkDeleteIds.length} image IDs`);

    if (!isAdminLoggedIn) {
      console.error('❌ Permission denied: Admin authentication required.');
      addToast('error', 'Permission Denied', 'Only authenticated administrators can delete files.');
      throw new Error('Permission denied');
    }

    const idsToDelete = [...bulkDeleteIds];
    const idSet = new Set(idsToDelete);

    try {
      await storageService.deleteMultipleImages(idsToDelete);

      setImages(prev => {
        const updated = prev.filter(img => !idSet.has(img.id));
        storageService.getStorageStats(updated).then(newStats => setStats(newStats));
        return updated;
      });

      setSelectedIds(prev => {
        const next = new Set(prev);
        idsToDelete.forEach(i => next.delete(i));
        return next;
      });

      if (lightboxImage && idSet.has(lightboxImage.id)) {
        setLightboxImage(null);
      }

      recordAuditLog('Bulk Delete', `${idsToDelete.length} files`, idsToDelete.join(', '));
      addToast('success', 'Bulk Files Deleted', `${idsToDelete.length} files permanently erased.`);
    } catch (err: any) {
      console.error('❌ Bulk delete failed:', err);
      const msg = err?.message || 'Failed to delete images from storage';
      addToast('error', 'Bulk Delete Failed', msg);
      throw err;
    } finally {
      setBulkDeleteIds([]);
    }
  };

  // Direct Add Single Image
  const handleAddImage = async (newImg: ImageItem) => {
    await storageService.addImage(newImg);
    recordAuditLog('File Upload', newImg.title, newImg.id);
    await refreshImages();
  };

  // Bulk Seed Action
  const handleSeedBulk = async (count: number) => {
    await storageService.seedBulkImages(count);
    await refreshImages();
  };

  // Restore Defaults
  const handleRestoreDefaults = async () => {
    if (confirm('Restore default sample T-shirt print designs into cloud storage?')) {
      await storageService.restoreDefaultImages();
      await refreshImages();
    }
  };

  // Clear All Database
  const handleClearAll = async () => {
    setImages([]);
    setSelectedIds(new Set());
    setLightboxImage(null);
    setStats({
      totalCount: 0,
      maxCapacity: 10000,
      usedBytes: 0,
      categoryCounts: {}
    });
    recordAuditLog('Clear Storage', 'All Records Wiped', 'DATABASE_WIPE');
    await storageService.clearAllImages();
    addToast('info', 'Database Wiped', 'All files removed from cloud storage.');
  };

  // Scroll Helpers
  const handleScrollToAdmin = () => {
    if (isAdminLoggedIn) {
      const adminEl = document.getElementById('admin-panel-section');
      if (adminEl) {
        adminEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filtered and Sorted Images
  const filteredImages = useMemo(() => {
    return images.filter(img => {
      // Search query
      if (filter.searchQuery.trim()) {
        const q = filter.searchQuery.toLowerCase();
        const matchesTitle = img.title.toLowerCase().includes(q);
        const matchesCategory = img.category.toLowerCase().includes(q);
        const matchesAuthor = img.author.toLowerCase().includes(q);
        const matchesTag = img.tags.some(t => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesCategory && !matchesAuthor && !matchesTag) {
          return false;
        }
      }

      // Category filter
      if (filter.category !== 'All' && img.category !== filter.category) {
        return false;
      }

      // Favorites filter
      if (filter.onlyFavorites && !img.isFavorite) {
        return false;
      }

      // Aspect Ratio filter
      if (filter.aspectRatioFilter !== 'all' && img.aspectRatio !== filter.aspectRatioFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (filter.sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filter.sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filter.sortBy === 'popular') {
        return (b.views || 0) - (a.views || 0);
      }
      if (filter.sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [images, filter]);

  // Count Favorites
  const favoritesCount = useMemo(() => {
    return images.filter(i => i.isFavorite).length;
  }, [images]);

  // Bulk Actions for User Grid
  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredImages.length && filteredImages.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredImages.map(img => img.id)));
    }
  };

  const handleBulkFavorite = async () => {
    for (const id of selectedIds) {
      await storageService.toggleFavorite(id);
    }
    await refreshImages();
  };

  const handleBulkDownload = () => {
    const selectedItems = images.filter(img => selectedIds.has(img.id));
    selectedItems.forEach((img, idx) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img.url;
        link.download = `${img.title.replace(/\s+/g, '_')}_nextprinters.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, idx * 300);
    });
  };

  const handleResetFilters = () => {
    setFilter({
      searchQuery: '',
      category: 'All',
      onlyFavorites: false,
      sortBy: 'newest',
      aspectRatioFilter: 'all'
    });
  };

  const handleSaveShopLogo = (newLogoUrl: string | null) => {
    if (newLogoUrl) {
      localStorage.setItem('nextprinters_custom_logo', newLogoUrl);
      setCustomShopLogo(newLogoUrl);
      addToast('success', 'Shop Logo Updated', 'The new shop logo image is active across the application.');
      recordAuditLog('Edit Details', 'Updated Shop Logo Image', 'system-logo');
    } else {
      localStorage.removeItem('nextprinters_custom_logo');
      setCustomShopLogo(null);
      addToast('info', 'Default Emblem Restored', 'Restored original NextPrinters logo emblem.');
      recordAuditLog('Edit Details', 'Reset Shop Logo to Default', 'system-logo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-400 selection:text-slate-950">
      
      {/* System Toast Notifications */}
      <ToastContainer toasts={toasts} onCloseToast={removeToast} />

      {/* Header */}
      <Header
        filter={filter}
        setFilter={setFilter}
        totalImagesCount={images.length}
        filteredCount={filteredImages.length}
        selectedCount={selectedIds.size}
        onClearSelection={handleClearSelection}
        onScrollToAdmin={handleScrollToAdmin}
        favoritesCount={favoritesCount}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={handleAdminLogout}
        customLogoUrl={customShopLogo}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center font-mono">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(6,182,212,0.4)]"></div>
            <p className="text-xs text-cyan-400">CONNECTING TO NEXTPRINTERS COLLECTIONS VAULT...</p>
          </div>
        ) : (
          <ImageGrid
            images={filteredImages}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleFavorite={handleToggleFavorite}
            onOpenLightbox={(img) => setLightboxImage(img)}
            onRequestDelete={isAdminLoggedIn ? handleOpenDeleteConfirm : undefined}
            onSelectAll={handleSelectAllFiltered}
            onBulkFavorite={handleBulkFavorite}
            onBulkDownload={handleBulkDownload}
            onResetFilters={handleResetFilters}
          />
        )}
      </main>

      {/* Lightbox Viewer Modal */}
      <LightboxModal
        image={lightboxImage}
        imageList={filteredImages}
        onClose={() => setLightboxImage(null)}
        onToggleFavorite={handleToggleFavorite}
        onRequestDelete={isAdminLoggedIn ? handleOpenDeleteConfirm : undefined}
      />

      {/* Bottom Admin Panel */}
      <AdminPanel
        images={images}
        stats={stats}
        onAddImage={handleAddImage}
        onDeleteImage={handleConfirmSingleDelete}
        onDeleteMultiple={handleConfirmBulkDelete}
        onSeedBulk={handleSeedBulk}
        onClearAll={handleClearAll}
        onRestoreDefaults={handleRestoreDefaults}
        onRefresh={refreshImages}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        onLogoutAdmin={handleAdminLogout}
        onRequestRemoval={(img) => {
          setRemovalTargetImage(img);
          setIsRemovalModalOpen(true);
        }}
        onViewImage={(img) => setLightboxImage(img)}
        onEditImage={handleOpenEditModal}
        onOpenDeleteConfirm={handleOpenDeleteConfirm}
        onOpenBulkDeleteConfirm={handleOpenBulkDeleteConfirm}
        auditLogs={auditLogs}
        onClearAuditLogs={handleClearAuditLogs}
        customLogoUrl={customShopLogo}
        onOpenLogoModal={() => setIsLogoModalOpen(true)}
      />

      {/* Footer */}
      <Footer
        totalCount={images.length}
        favoritesCount={favoritesCount}
        onScrollToTop={handleScrollToTop}
        onScrollToAdmin={handleScrollToAdmin}
        customLogoUrl={customShopLogo}
      />

      {/* Modals */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

      <RemovalRequestModal
        isOpen={isRemovalModalOpen}
        onClose={() => {
          setIsRemovalModalOpen(false);
          setRemovalTargetImage(null);
        }}
        image={removalTargetImage}
        isAdminLoggedIn={isAdminLoggedIn}
        onAdminLoginSuccess={handleAdminLoginSuccess}
        onDirectDelete={async (id) => {
          const img = images.find(i => i.id === id);
          if (img) {
            setDeletingImage(img);
            setIsDeleteConfirmOpen(true);
          }
          setIsRemovalModalOpen(false);
        }}
      />

      <EditImageModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingImage(null);
        }}
        image={editingImage}
        onSave={handleSaveEditedImage}
      />

      {/* Single File Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setDeletingImage(null);
        }}
        file={deletingImage}
        onConfirmDelete={handleConfirmSingleDelete}
      />

      {/* Bulk Files Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteConfirmOpen}
        onClose={() => {
          setIsBulkDeleteConfirmOpen(false);
          setBulkDeleteIds([]);
        }}
        bulkCount={bulkDeleteIds.length}
        onConfirmDelete={handleConfirmBulkDelete}
      />

      {/* Shop Logo Customization Modal */}
      <LogoChangeModal
        isOpen={isLogoModalOpen}
        onClose={() => setIsLogoModalOpen(false)}
        currentLogoUrl={customShopLogo}
        onSaveLogo={handleSaveShopLogo}
      />

    </div>
  );
}
