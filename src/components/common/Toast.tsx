import React, { useEffect } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useBudget();

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{
  toast: { id: string; type: 'success' | 'warning' | 'info' | 'error'; title: string; message: string };
  onClose: () => void;
}> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />;
      default:
        return <Info className="w-5 h-5 text-sky-500 flex-shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (toast.type) {
      case 'success':
        return 'border-l-4 border-l-emerald-500 bg-white text-slate-800';
      case 'warning':
        return 'border-l-4 border-l-amber-500 bg-white text-slate-800';
      case 'error':
        return 'border-l-4 border-l-rose-500 bg-white text-slate-800';
      default:
        return 'border-l-4 border-l-sky-500 bg-white text-slate-800';
    }
  };

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border border-slate-100 ${getBorder()} animate-toast`}
      role="alert"
    >
      {getIcon()}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900">{toast.title}</h4>
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
