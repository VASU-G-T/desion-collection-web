import React from 'react';
import { X, Layers, Check, Info, FileText, Sparkles, Printer, Shield } from 'lucide-react';

interface PrintSpecGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrintSpecGuideModal: React.FC<PrintSpecGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-3xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-6 overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">NextPrinters Master Print Specification Standards</h2>
            <p className="text-xs text-slate-400">Garment Screen Printing, DTG, and Prepress Resolution Guidelines</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          {/* Resolution & DPI */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sky-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /> Prepress Resolution Standards
            </h3>
            <ul className="space-y-1.5 text-slate-700">
              <li>• <strong className="text-white">Optimal Resolution:</strong> 300 DPI at 100% final output size.</li>
              <li>• <strong className="text-white">Minimum DPI:</strong> 150 DPI for vector linework, 200 DPI for half-tones.</li>
              <li>• <strong className="text-white">Transparency:</strong> 8-bit PNG with clean alpha mask or transparent TIFF.</li>
              <li>• <strong className="text-white">Color Space:</strong> CMYK for screen separations; RGB for DTG engines.</li>
            </ul>
          </div>

          {/* Screen Mesh Recommendations */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sky-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4" /> Screen Mesh Standards
            </h3>
            <ul className="space-y-1.5 text-slate-700">
              <li>• <strong className="text-white">110 - 160 Mesh:</strong> Underbase white & heavy opacity plastisol.</li>
              <li>• <strong className="text-white">200 - 230 Mesh:</strong> Detailed top colors, waterbase inks.</li>
              <li>• <strong className="text-white">305 Mesh:</strong> Ultra fine halftone process (45 - 55 LPI).</li>
              <li>• <strong className="text-white">DTG Pretreatment:</strong> 18g - 22g for dark 100% cotton garments.</li>
            </ul>
          </div>

          {/* Placement Standards */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sky-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <FileText className="w-4 h-4" /> Placement Standards
            </h3>
            <ul className="space-y-1.5 text-slate-700">
              <li>• <strong className="text-white">Full Front Chest:</strong> 12" × 16" centered 3" down from collar.</li>
              <li>• <strong className="text-white">Left Chest Pocket:</strong> 3.5" × 3.5" aligned 3" down from collar seam.</li>
              <li>• <strong className="text-white">Over-Sized Streetwear:</strong> 14" × 18" top aligned.</li>
              <li>• <strong className="text-white">Sleeve Print:</strong> 3.5" × 14" max width on arm seam.</li>
            </ul>
          </div>

          {/* Curing & Garment Materials */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <h3 className="font-bold text-sky-400 flex items-center gap-1.5 text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" /> Curing & Fabric Specs
            </h3>
            <ul className="space-y-1.5 text-slate-700">
              <li>• <strong className="text-white">Plastisol Inks:</strong> Gel at 220°F, full cure at 320°F for 1 minute.</li>
              <li>• <strong className="text-white">Waterbase & Discharge:</strong> Cure at 330°F for 2 minutes.</li>
              <li>• <strong className="text-white">Poly Blends:</strong> Low-bleed ink underbase required to prevent dye migration.</li>
              <li>• <strong className="text-white">Heavyweight Tees:</strong> 220 GSM combed cotton recommended for DTG.</li>
            </ul>
          </div>

        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-100 hover:bg-slate-700 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors"
        >
          Close Specification Guide
        </button>

      </div>
    </div>
  );
};
