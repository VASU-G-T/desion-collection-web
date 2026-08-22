import React, { useState, useEffect } from 'react';
import { SiteSettings } from '../types';
import { getSiteSettings, updateSiteSettings, uploadSiteLogo, uploadPaymentQrCode } from '../services/firebaseGalleryService';
import { Image as ImageIcon, QrCode, Save, Loader2 } from 'lucide-react';

export const AdminSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  
  const [siteName, setSiteName] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      if (data) {
        setSettings(data);
        setSiteName(data.siteName || '');
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      let finalLogoUrl = settings.logoUrl;
      let finalLogoPath = settings.logoStoragePath;
      let finalQrUrl = settings.qrCodeUrl;
      let finalQrPath = settings.qrCodeStoragePath;

      if (logoFile) {
        const res = await uploadSiteLogo(logoFile);
        finalLogoUrl = res.url;
        finalLogoPath = res.storagePath;
      }

      if (qrFile) {
        const res = await uploadPaymentQrCode(qrFile);
        finalQrUrl = res.url;
        finalQrPath = res.storagePath;
      }

      const newSettings: SiteSettings = {
        siteName,
        logoUrl: finalLogoUrl,
        logoStoragePath: finalLogoPath,
        qrCodeUrl: finalQrUrl,
        qrCodeStoragePath: finalQrPath,
      };

      await updateSiteSettings(newSettings);
      setSettings(newSettings);
      setLogoFile(null);
      setQrFile(null);
      alert('Settings & Payment QR Code saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-slate-900">Site Branding & Payment QR Settings</h3>
        
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Main Application Logo</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-xl bg-slate-200 flex items-center justify-center overflow-hidden border border-slate-300">
                {logoFile ? (
                  <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain" />
                ) : settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Current Logo" className="w-full h-full object-contain p-1" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2 hover:bg-sky-50 transition-colors text-sm font-semibold text-slate-700">
                  <ImageIcon className="w-4 h-4 text-sky-500" />
                  <span>Choose New Logo</span>
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/svg+xml" onChange={(e) => e.target.files?.[0] && setLogoFile(e.target.files[0])} />
                </label>
                <p className="text-xs text-slate-500 mt-2">Recommended: Transparent PNG, square aspect ratio.</p>
              </div>
            </div>
          </div>

          {/* Payment QR Code Upload */}
          <div className="border-t border-slate-200 pt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Payment UPI / Bank QR Code</label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl bg-white flex items-center justify-center overflow-hidden border border-slate-300 p-1.5 shadow-sm">
                {qrFile ? (
                  <img src={URL.createObjectURL(qrFile)} alt="QR Preview" className="w-full h-full object-contain" />
                ) : settings.qrCodeUrl ? (
                  <img src={settings.qrCodeUrl} alt="Current QR Code" className="w-full h-full object-contain" />
                ) : (
                  <QrCode className="w-10 h-10 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <label className="inline-flex cursor-pointer items-center gap-2 bg-white border border-slate-300 rounded-lg px-4 py-2 hover:bg-sky-50 transition-colors text-sm font-semibold text-slate-700">
                  <QrCode className="w-4 h-4 text-sky-500" />
                  <span>Upload Admin Payment QR</span>
                  <input type="file" className="hidden" accept="image/png, image/jpeg, image/jpg" onChange={(e) => e.target.files?.[0] && setQrFile(e.target.files[0])} />
                </label>
                <p className="text-xs text-slate-500 mt-2">Customers scan this QR code during checkout to complete payments.</p>
              </div>
            </div>
          </div>

          {/* Site Name */}
          <div className="border-t border-slate-200 pt-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Application Title</label>
            <input 
              type="text" 
              value={siteName} 
              onChange={e => setSiteName(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:border-sky-500 outline-none"
              placeholder="e.g., NextPrinters VAULT"
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={isSaving}
            className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings & Payment QR'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
