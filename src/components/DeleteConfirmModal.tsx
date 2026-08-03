import React from 'react';
import { ImageItem } from '../types';
import { AlertTriangle, Trash2, X, ShieldAlert, Cpu, HardDrive } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => Promise<void> | void;
  onConfirmDelete?: () => Promise<void> | void;
  file?: ImageItem | null;
  targetImage?: ImageItem | null;
  bulkCount?: number;
  targetCount?: number;
  isBulk?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onConfirmDelete,
  file,
  targetImage,
  bulkCount,
  targetCount = 1,
  isBulk = false
}) => {
  const [deleting, setDeleting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const activeImage = file || targetImage;
  const activeCount = bulkCount || targetCount || 1;
  const activeIsBulk = isBulk || (bulkCount !== undefined && bulkCount > 0);
  const activeConfirm = onConfirmDelete || onConfirm;

  const handleConfirmClick = async () => {
    setDeleting(true);
    setErrorMessage(null);
    try {
      if (activeConfirm) {
        await activeConfirm();
      }
      onClose();
    } catch (err: any) {
      console.error('[DELETE MODAL ERROR]', err);
      setErrorMessage(err?.message || 'Failed to delete image from storage.');
    } finally {
      setDeleting(false);
    }
  };

  const handleModalClose = () => {
    if (deleting) return;
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative max-w-lg w-full bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(244,63,94,0.25)] space-y-6 text-slate-100 overflow-hidden">
        
        {/* Futuristic Background Glows */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                SYSTEM PERMANENT DELETION
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
                Confirm File Deletion
              </h3>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            disabled={deleting}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Callout if deletion fails */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 text-xs flex items-start gap-2.5 shadow-lg">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-rose-300">Deletion Error</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-rose-500/20 text-slate-200 text-sm space-y-2">
            <p className="font-semibold text-rose-300 flex items-center gap-2 text-base">
              <AlertTriangle className="w-5 h-5 text-rose-400" />
              <span>Are you sure you want to permanently delete this file?</span>
            </p>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              This action <strong className="text-rose-400">cannot be undone</strong>. The selected {activeIsBulk ? `${activeCount} files` : 'artwork design'} will be permanently erased from IndexedDB storage and database records. It will immediately cease to be visible to all users.
            </p>
          </div>

          {/* Item details preview */}
          {!activeIsBulk && activeImage && (
            <div className="flex items-center space-x-4 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
              <img
                src={activeImage.url}
                alt={activeImage.title}
                className="w-16 h-16 object-cover rounded-xl border border-slate-700 flex-shrink-0 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate">{activeImage.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
                  <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                    {activeImage.category}
                  </span>
                  <span>{activeImage.fileSize}</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono mt-1 truncate">ID: {activeImage.id}</p>
              </div>
            </div>
          )}

          {activeIsBulk && (
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Total Bulk Selection:
              </span>
              <span className="text-rose-400 font-bold bg-rose-950/60 px-3 py-1 rounded-full border border-rose-800">
                {activeCount} Files Queued
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleModalClose}
            disabled={deleting}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={deleting}
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] border border-rose-400/50 transition-all flex items-center space-x-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {deleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting File...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
