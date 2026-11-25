import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';
import { downloadScreenshotImage } from '../utils/orderHelpers';

interface ScreenshotViewerModalProps {
  imageUrl: string | null;
  orderId?: string;
  title?: string;
  onClose: () => void;
}

export const ScreenshotViewerModal: React.FC<ScreenshotViewerModalProps> = ({
  imageUrl,
  orderId = 'order',
  title = 'Uploaded Payment Screenshot',
  onClose,
}) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    setZoom(1);
  }, [imageUrl]);

  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">{title}</h4>
            <p className="text-[11px] font-mono text-sky-600">#{orderId}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono font-bold text-slate-700 w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-sky-50 hover:text-sky-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              title="Reset Zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => downloadScreenshotImage(imageUrl, orderId)}
              className="px-3 py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Download Screenshot"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-center justify-center min-h-[300px]">
          <img
            src={imageUrl}
            alt="Payment Screenshot"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            className="max-w-full max-h-[65vh] object-contain rounded-xl shadow-md transition-transform duration-150 bg-white"
          />
        </div>
      </div>
    </div>
  );
};
