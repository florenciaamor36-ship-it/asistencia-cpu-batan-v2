import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  const getBg = () => {
    if (type === 'error') return 'bg-red-600 text-white';
    if (type === 'info') return 'bg-amber-600 text-white';
    return 'bg-emerald-600 text-white';
  };

  const getIcon = () => {
    if (type === 'error') return <AlertCircle className="w-4 h-4" />;
    if (type === 'info') return <Info className="w-4 h-4" />;
    return <CheckCircle2 className="w-4 h-4" />;
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 px-4 py-3 rounded-2xl shadow-xl ${getBg()} animate-slide-up`}>
      {getIcon()}
      <span className="text-xs font-semibold">{message}</span>
      <button onClick={onClose} className="p-1 rounded-full hover:bg-black/20 transition">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
