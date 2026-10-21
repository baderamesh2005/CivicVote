import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export const Modal = ({ isOpen, onClose, onConfirm, title, children, confirmText = 'Confirm', confirmVariant = 'primary', isLoading = false }) => {
  if (!isOpen) return null;

  const btnClass = 'text-sm font-medium px-4 py-2.5 rounded-lg text-white transition-colors shadow-sm disabled:opacity-50 ' +
    (confirmVariant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800'
      : 'bg-teal-600 hover:bg-teal-700 active:bg-teal-800');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        role="dialog"
      >
        <div className="px-6 pt-5 pb-4 flex items-center justify-between border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {confirmVariant === 'danger' && <AlertTriangle className="w-5 h-5 text-rose-600" />}
            {title}
          </h3>
          <button 
            onClick={onClose}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-4 text-sm text-slate-600">
          {children}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="civic-btn-outline text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={btnClass}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
