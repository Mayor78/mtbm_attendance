import React, { useEffect, useState } from 'react';

const Toast = ({
  message,
  type = 'info',
  duration = 3000,
  onClose,
  position = 'top-right',
  showIcon = true,
  showCloseButton = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const endTime = startTime + duration;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;
      const progressPercent = (remaining / duration) * 100;

      if (remaining <= 0) {
        clearInterval(timer);
        setProgress(0);
        handleClose();
      } else {
        setProgress(progressPercent);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [duration]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: '✅',
      progress: 'bg-green-500'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: '❌',
      progress: 'bg-red-500'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: '⚠️',
      progress: 'bg-yellow-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'ℹ️',
      progress: 'bg-blue-500'
    }
  };

  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  const styles = typeStyles[type] || typeStyles.info;

  return (
    <div
      className={`
        fixed z-50
        ${positionStyles[position]}
        ${className}
      `}
    >
      <div
        className={`
          ${styles.bg} ${styles.border} ${styles.text}
          border rounded-lg shadow-lg
          min-w-[320px] max-w-md
          animate-slide-in
        `}
      >
        {/* Progress bar */}
        <div
          className={`${styles.progress} h-1 rounded-t-lg transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        ></div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            {showIcon && (
              <div className="flex-shrink-0 text-xl">
                {styles.icon}
              </div>
            )}

            {/* Message */}
            <div className="flex-1">
              <p className={`text-sm font-medium ${styles.text}`}>
                {message}
              </p>
            </div>

            {/* Close button */}
            {showCloseButton && (
              <button
                onClick={handleClose}
                className={`
                  flex-shrink-0 ml-2
                  ${styles.text} opacity-60 hover:opacity-100
                  transition-opacity
                `}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, onClose }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id || index}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          position={toast.position}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </>
  );
};

// Toast Provider/Hook for managing toasts
export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, options = {}) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      type: options.type || 'info',
      duration: options.duration || 3000,
      position: options.position || 'top-right'
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration + 300); // Add 300ms for animation

    return id;
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const success = (message, options = {}) => {
    return showToast(message, { ...options, type: 'success' });
  };

  const error = (message, options = {}) => {
    return showToast(message, { ...options, type: 'error' });
  };

  const warning = (message, options = {}) => {
    return showToast(message, { ...options, type: 'warning' });
  };

  const info = (message, options = {}) => {
    return showToast(message, { ...options, type: 'info' });
  };

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info
  };
};

// Toast Provider Component
export const ToastProvider = ({ children }) => {
  const { toasts, removeToast } = useToast();

  return (
    <>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

// Usage Examples
export const ToastExamples = () => {
  const toast = useToast();

  return (
    <div className="space-y-4 p-4">
      <div className="space-x-2">
        <button
          onClick={() => toast.success('Operation completed successfully!')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Success Toast
        </button>
        <button
          onClick={() => toast.error('Something went wrong!')}
          className="px-4 py-2 bg-red-600 text-white rounded-lg"
        >
          Error Toast
        </button>
        <button
          onClick={() => toast.warning('Please check your input')}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg"
        >
          Warning Toast
        </button>
        <button
          onClick={() => toast.info('New message received')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Info Toast
        </button>
      </div>

      <div className="space-x-2">
        <button
          onClick={() => toast.showToast('Custom duration toast', { duration: 5000 })}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          5 Seconds
        </button>
        <button
          onClick={() => toast.showToast('Bottom right toast', { position: 'bottom-right' })}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          Bottom Right
        </button>
        <button
          onClick={() => toast.showToast('No icon toast', { showIcon: false })}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg"
        >
          No Icon
        </button>
      </div>
    </div>
  );
};

export default Toast;