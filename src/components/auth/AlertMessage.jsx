import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const AlertMessage = ({ type, message, onDismiss }) => {
  if (!message) return null;

  const styles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertCircle
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: CheckCircle
    }
  };

  const { bg, border, text, icon: Icon } = styles[type];

  return (
    <div className={`${bg} ${border} ${text} px-4 py-3 rounded-lg text-sm mb-4 flex items-start gap-2`}>
      <Icon size={16} className="mt-0.5 flex-shrink-0" />
      <p className="flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      )}
    </div>
  );
};

export default AlertMessage;