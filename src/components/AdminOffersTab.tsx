import React, { useState, useEffect } from 'react';
import { Offer } from '../types';
import { subscribeToOffers, uploadOfferBanner, deleteOffer, updateOffer } from '../services/firebaseGalleryService';
import { Plus, Trash2, Image as ImageIcon, Power, Loader2 } from 'lucide-react';

export const AdminOffersTab: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const unsub = subscribeToOffers((data) => {
      setOffers(data);
      setIsLoading(false);
    }, (err) => {
      console.error(err);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    try {
      setIsUploading(true);
      await uploadOfferBanner(
        file,
        { title, description, couponCode, isActive: true },
        (p) => setUploadProgress(p)
      );
      
      // Reset form
      setFile(null);
      setTitle('');
      setDescription('');
      setCouponCode('');
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed: ' + (err as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleToggleActive = async (offer: Offer) => {
    try {
      await updateOffer(offer.id, { isActive: !offer.isActive });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (offer: Offer) => {
    if (window.confirm('Delete this offer banner?')) {
      try {
        await deleteOffer(offer.id, offer.storagePath);
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading offers...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-200">
      
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus className="text-sky-500" /> Create New Offer
        </h3>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image (Required)</label>
              <div className="flex items-center gap-3">
                <label className="flex-1 cursor-pointer bg-white border border-slate-300 border-dashed rounded-lg p-3 text-center hover:bg-sky-50 transition-colors">
                  <ImageIcon className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-xs text-slate-500">{file ? file.name : 'Select Banner Image'}</span>
                  <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} required />
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Offer Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-sky-500 outline-none"
                  placeholder="e.g., Summer Freedom Sale"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Coupon Code (Optional)</label>
                <input 
                  type="text" 
                  value={couponCode} 
                  onChange={e => setCouponCode(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-sky-600 focus:border-sky-500 outline-none uppercase"
                  placeholder="e.g., SAVE50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input 
              type="text" 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:border-sky-500 outline-none"
              placeholder="e.g., Get 50% off on all items this weekend."
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isUploading || !file}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading {uploadProgress}%</>
              ) : (
                'Upload Offer Banner'
              )}
            </button>
          </div>
        </form>
      </div>

      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">Active & Past Offers</h3>
        {offers.length === 0 ? (
          <p className="text-slate-500 text-sm">No offers created yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {offers.map(offer => (
              <div key={offer.id} className={`flex bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${offer.isActive ? 'border-sky-200 ring-1 ring-sky-500/20' : 'border-slate-200 opacity-60'}`}>
                <div className="w-1/3 bg-slate-100 flex-shrink-0">
                  <img src={offer.imageUrl} alt={offer.title} className="w-full h-full object-cover" />
                </div>
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-slate-900 line-clamp-1">{offer.title}</h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${offer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {offer.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    {offer.couponCode && (
                      <div className="mt-1 font-mono text-xs text-sky-600 font-bold tracking-wide">
                        Code: {offer.couponCode}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <button 
                      onClick={() => handleToggleActive(offer)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors flex-1 flex justify-center"
                      title={offer.isActive ? "Deactivate" : "Activate"}
                    >
                      <Power className={`w-4 h-4 ${offer.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                    </button>
                    <button 
                      onClick={() => handleDelete(offer)}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
