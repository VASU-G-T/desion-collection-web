import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, Zap } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss?: (id: string) => void;
  onCloseToast?: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss, onCloseToast }) => {
  const handleDismiss = onDismiss || onCloseToast || (() => {});
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={handleDismiss} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onDismiss: (id: string) => void }> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const getTheme = () => {
    switch (toast.type) {
      case 'success':
        return {
          border: 'border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] bg-slate-900/95',
          iconBg: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40',
          icon: <CheckCircle2 className="w-5 h-5 text-cyan-400" />,
          glow: 'bg-cyan-500/10'
        };
      case 'error':
        return {
          border: 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.25)] bg-slate-900/95',
          iconBg: 'bg-rose-500/20 text-rose-400 border border-rose-500/40',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
          glow: 'bg-rose-500/10'
        };
      case 'info':
      default:
        return {
          border: 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.25)] bg-slate-900/95',
          iconBg: 'bg-purple-500/20 text-purple-400 border border-purple-500/40',
          icon: <Info className="w-5 h-5 text-purple-400" />,
          glow: 'bg-purple-500/10'
        };
    }
  };

  const theme = getTheme();

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl transition-all animate-in fade-in slide-in-from-bottom-5 duration-300 relative overflow-hidden ${theme.border}`}
    >
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-2xl pointer-events-none ${theme.glow}`} />

      <div className={`p-2 rounded-xl flex-shrink-0 ${theme.iconBg}`}>
        {theme.icon}
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-cyan-400 font-bold">
          <Zap className="w-3 h-3 text-cyan-400" />
          <span>{toast.title}</span>
        </div>
        <p className="text-xs text-slate-200 mt-1 leading-relaxed font-sans font-medium">
          {toast.message}
        </p>
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
