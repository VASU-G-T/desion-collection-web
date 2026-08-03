import React, { useState } from 'react';
import { ImageItem } from '../types';
import { Mail, AlertTriangle, Send, X, Shield, Lock, Key, CheckCircle } from 'lucide-react';

interface RemovalRequestModalProps {
  image: ImageItem | null;
  isOpen: boolean;
  isAdminLoggedIn: boolean;
  onClose: () => void;
  onAdminLoginSuccess: () => void;
  onDirectDelete: (imageId: string) => Promise<void>;
}

export const RemovalRequestModal: React.FC<RemovalRequestModalProps> = ({
  image,
  isOpen,
  isAdminLoggedIn,
  onClose,
  onAdminLoginSuccess,
  onDirectDelete
}) => {
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [reason, setReason] = useState('Copyright / Intellectual Property');
  const [details, setDetails] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  // Admin login toggle inside modal
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isOpen || !image) return null;

  const handleSendEmailRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const adminEmail = 'papathambi143@gmail.com';
    const subject = `[T-Shirt Removal Request] ${image.title} (ID: ${image.id})`;
    const body = `T-Shirt Design Removal Request Details:\n----------------------------------------\nDesign Title: ${image.title}\nDesign ID: ${image.id}\nCategory: ${image.category}\nDesigner: ${image.author}\nImage URL: ${image.url}\n\nRequester Name: ${userName || 'User'}\nRequester Contact: ${userEmail || 'N/A'}\nReason for Removal: ${reason}\n\nAdditional Details:\n${details || 'No additional details provided.'}\n\nSent to Admin Email: ${adminEmail}`;

    const mailtoUrl = `mailto:${adminEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    setRequestSent(true);
  };

  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser.trim() === 'next' && adminPass === 'printers') {
      setLoginError('');
      localStorage.setItem('admin_session', 'active');
      onAdminLoginSuccess();
      setShowAdminLogin(false);
      // Perform direct deletion since user is now verified admin
      onDirectDelete(image.id);
      onClose();
    } else {
      setLoginError('Invalid admin credentials. Please enter correct Username and Password.');
    }
  };

  const handleDirectAdminDelete = async () => {
    if (confirm(`Confirm permanent deletion of "${image.title}"?`)) {
      await onDirectDelete(image.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow-2xl text-stone-100 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Image Removal Request</h3>
            <p className="text-xs text-stone-400">Target Admin Email: <span className="text-amber-400 font-semibold">papathambi143@gmail.com</span></p>
          </div>
        </div>

        {/* Selected Image Preview Box */}
        <div className="mb-5 p-3 bg-stone-950 border border-stone-800 rounded-xl flex items-center gap-3">
          <img
            src={image.thumbnailUrl || image.url}
            alt={image.title}
            className="w-14 h-14 object-cover rounded-lg border border-stone-800"
          />
          <div className="text-xs overflow-hidden">
            <span className="font-bold text-white block truncate">{image.title}</span>
            <span className="text-stone-400 block text-[11px]">Category: {image.category} • ID: {image.id}</span>
            <span className="text-stone-500 block text-[10px]">Designer: {image.author}</span>
          </div>
        </div>

        {/* IF ALREADY LOGGED IN AS ADMIN */}
        {isAdminLoggedIn ? (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <Shield className="w-4 h-4" />
              <span>Admin Verified Session (User: next)</span>
            </div>
            <p className="text-stone-300 leading-relaxed">
              You are currently logged in as administrator <strong className="text-white">next</strong>. You have direct authorization to delete this image immediately from cloud database storage.
            </p>
            <button
              onClick={handleDirectAdminDelete}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Delete Image Directly Now</span>
            </button>
          </div>
        ) : showAdminLogin ? (
          /* ADMIN LOGIN FORM INSIDE MODAL */
          <div className="space-y-4 pt-2">
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-300">
              <span className="font-bold text-amber-400 block mb-1">Admin Authentication</span>
              Enter credentials (<strong className="text-white">next</strong> / <strong className="text-white">printers</strong>) to bypass email request and delete immediately.
            </div>

            {loginError && (
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminAuth} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Admin Username</label>
                <input
                  type="text"
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="e.g. next"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">Admin Password</label>
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="e.g. printers"
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className="w-1/2 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs"
                >
                  Back to Email Form
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs"
                >
                  Log In & Delete
                </button>
              </div>
            </form>
          </div>
        ) : requestSent ? (
          /* SUCCESS STATE */
          <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">Removal Email Request Sent!</h4>
            <p className="text-xs text-stone-300 leading-relaxed">
              Your image removal request for <strong className="text-white">{image.title}</strong> has been transmitted to <span className="text-amber-400 font-semibold">papathambi143@gmail.com</span>.
            </p>
            <p className="text-[11px] text-stone-400">
              Administrator <strong>next</strong> will review the details and remove the design from the cloud database.
            </p>
            <button
              onClick={onClose}
              className="mt-3 px-6 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs"
            >
              Done & Close
            </button>
          </div>
        ) : (
          /* REGULAR EMAIL REQUEST FORM */
          <form onSubmit={handleSendEmailRequest} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Your Name</label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Your Email Address</label>
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="e.g. user@example.com"
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Reason for Removal</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Copyright / Intellectual Property">Copyright / Intellectual Property Issue</option>
                <option value="Incorrect Print Specifications">Incorrect Print Specifications</option>
                <option value="Discontinued Design / Out of Stock">Discontinued Design / Out of Stock</option>
                <option value="Quality or Resolution Issue">Quality or Resolution Issue</option>
                <option value="Other">Other Reason</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">Additional Details (Optional)</label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={2}
                placeholder="Provide any additional notes for admin review..."
                className="w-full bg-stone-950 border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleDirectAdminDelete}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Delete Design Immediately</span>
              </button>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 border border-amber-500/30 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Removal Request to papathambi143@gmail.com</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAdminLogin(true)}
                className="w-full py-2 rounded-xl bg-stone-800/80 hover:bg-stone-800 text-stone-300 font-medium text-xs flex items-center justify-center gap-1.5 border border-stone-700/50"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin Login ('next' / 'printers')</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
