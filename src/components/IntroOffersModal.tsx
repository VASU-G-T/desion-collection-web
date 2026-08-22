import React, { useState } from 'react';
import { Offer } from '../types';
import { X, Copy, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';

interface IntroOffersModalProps {
  offers: Offer[];
  onClose: () => void;
}

export const IntroOffersModal: React.FC<IntroOffersModalProps> = ({ offers, onClose }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!offers || offers.length === 0) return null;

  const activeOffers = offers.filter(o => o.isActive);
  if (activeOffers.length === 0) return null;

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentOffer = activeOffers[currentIndex];

  const nextOffer = () => {
    setCurrentIndex((prev) => (prev + 1) % activeOffers.length);
  };

  const prevOffer = () => {
    setCurrentIndex((prev) => (prev - 1 + activeOffers.length) % activeOffers.length);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-300">
        
        {/* Skip button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 backdrop-blur-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-[60vh] min-h-[400px] w-full bg-slate-100 flex items-center justify-center">
          {currentOffer.imageUrl ? (
            <img 
              src={currentOffer.imageUrl} 
              alt={currentOffer.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-slate-400">No banner image</div>
          )}

          {/* Navigation Arrows */}
          {activeOffers.length > 1 && (
            <>
              <button 
                onClick={prevOffer}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button 
                onClick={nextOffer}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Offer Details Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 pt-20">
            <h2 className="text-3xl font-bold text-white mb-2">{currentOffer.title}</h2>
            <p className="text-slate-200 mb-4 max-w-2xl">{currentOffer.description}</p>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              {currentOffer.couponCode && (
                <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md p-2 rounded-xl border border-white/30">
                  <span className="font-mono font-bold text-xl text-white px-2 tracking-wider">
                    {currentOffer.couponCode}
                  </span>
                  <button
                    onClick={() => handleCopy(currentOffer.couponCode, currentOffer.id)}
                    className="bg-white text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-100 transition-colors"
                  >
                    {copiedId === currentOffer.id ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              
              <button 
                onClick={onClose}
                className="text-white hover:text-sky-300 font-semibold underline underline-offset-4 transition-colors"
              >
                Skip to Home Page →
              </button>
            </div>
          </div>
        </div>

        {/* Dots indicator */}
        {activeOffers.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {activeOffers.map((_, idx) => (
              <div 
                key={idx}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/50'}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
