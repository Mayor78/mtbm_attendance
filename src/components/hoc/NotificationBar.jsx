import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';

const NotificationBar = ({ error, hookError, success, onClearError, onClearSuccess }) => {
  return (
    <>
      {(error || hookError) && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={20} />
          <span className="flex-1 text-sm font-medium">{error || hookError}</span>
          <button onClick={onClearError} className="p-1 hover:bg-rose-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Check size={20} />
          <span className="flex-1 text-sm font-medium">{success}</span>
          <button onClick={onClearSuccess} className="p-1 hover:bg-emerald-100 rounded-lg">
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
};

export default NotificationBar;