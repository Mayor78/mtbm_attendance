import React, { useEffect, useState } from 'react';
import Button from './Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnClickOutside = true,
  closeOnEsc = true,
  actions,
  loading = false,
  className = '',
  footerClassName = '',
  headerClassName = '',
  bodyClassName = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  // Handle modal visibility animation and body overflow
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Save the original overflow value
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Store original value to restore later
      return () => {
        document.body.style.overflow = originalOverflow || 'auto';
        document.documentElement.style.overflow = 'auto';
      };
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Ensure body overflow is restored when modal closes
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }, 300);
      
      return () => {
        clearTimeout(timer);
        // Also restore on cleanup
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [closeOnEsc, isOpen, onClose]);

  // Additional safety: restore overflow on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

  if (!isVisible && !isOpen) return null;

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] w-full'
  };

  // Animation classes
  const overlayClasses = `
    fixed inset-0 bg-black transition-opacity duration-300 z-50
    ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}
  `;

  const modalClasses = `
    fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2
    w-full ${sizeClasses[size]}
    bg-white rounded-xl shadow-2xl z-50
    transition-all duration-300
    ${isOpen 
      ? 'opacity-100 scale-100' 
      : 'opacity-0 scale-95 pointer-events-none'
    }
    max-h-[90vh] overflow-hidden
    flex flex-col
    ${className}
  `;

  const handleOverlayClick = (e) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={overlayClasses}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className={modalClasses} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        {/* Header */}
        <div className={`px-6 py-4 border-b border-gray-200 flex items-center justify-between ${headerClassName}`}>
          <h3 id="modal-title" className="text-lg font-semibold text-gray-800">
            {title}
          </h3>
          {showCloseButton && (
            <button
              onClick={() => {
                onClose();
                // Immediate overflow restoration
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg p-1"
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className={`px-6 py-4 overflow-y-auto flex-1 ${bodyClassName}`}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer - only show if actions are provided */}
        {actions && (
          <div className={`px-6 py-4 border-t border-gray-200 bg-gray-50 ${footerClassName}`}>
            {actions}
          </div>
        )}
      </div>
    </>
  );
};

// Confirmation Modal Component
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'primary',
  size = 'sm',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      actions={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="py-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            confirmVariant === 'danger' ? 'bg-red-100' :
            confirmVariant === 'warning' ? 'bg-yellow-100' :
            'bg-blue-100'
          }`}>
            {confirmVariant === 'danger' && <span className="text-2xl">⚠️</span>}
            {confirmVariant === 'warning' && <span className="text-2xl">⚠️</span>}
            {confirmVariant === 'primary' && <span className="text-2xl">❓</span>}
            {confirmVariant === 'success' && <span className="text-2xl">✓</span>}
          </div>
          <div>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      </div>
    </Modal>
  );
};

// Form Modal Component
export const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Submit',
  cancelText = 'Cancel',
  size = 'md',
  loading = false,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      actions={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            type="submit"
            variant="primary" 
            onClick={handleSubmit}
            loading={loading}
          >
            {submitText}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {children}
      </form>
    </Modal>
  );
};

// Info Modal Component
export const InfoModal = ({
  isOpen,
  onClose,
  title,
  message,
  type = 'info',
  size = 'sm',
}) => {
  const icons = {
    info: { emoji: 'ℹ️', bg: 'bg-blue-100', text: 'text-blue-600' },
    success: { emoji: '✅', bg: 'bg-green-100', text: 'text-green-600' },
    warning: { emoji: '⚠️', bg: 'bg-yellow-100', text: 'text-yellow-600' },
    error: { emoji: '❌', bg: 'bg-red-100', text: 'text-red-600' }
  };

  const icon = icons[type] || icons.info;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      actions={
        <div className="flex justify-center w-full">
          <Button variant="primary" onClick={onClose}>
            Got it
          </Button>
        </div>
      }
    >
      <div className="py-6 text-center">
        <div className={`w-16 h-16 ${icon.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className={`text-3xl ${icon.text}`}>{icon.emoji}</span>
        </div>
        <p className="text-gray-600">{message}</p>
      </div>
    </Modal>
  );
};

// Slide-over Modal (from right)
export const SlideOver = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'auto';
        document.documentElement.style.overflow = 'auto';
      }, 300);
      return () => clearTimeout(timer);
    }
    
    return () => {
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full w-full'
  };

  const overlayClasses = `
    fixed inset-0 bg-black transition-opacity duration-300 z-50
    ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'}
  `;

  const panelClasses = `
    fixed top-0 right-0 h-full w-full ${sizeClasses[size]}
    bg-white shadow-2xl z-50
    transition-transform duration-300 ease-in-out transform
    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    flex flex-col
  `;

  return (
    <>
      <div
        className={overlayClasses}
        onClick={() => {
          onClose();
          document.body.style.overflow = 'auto';
          document.documentElement.style.overflow = 'auto';
        }}
        aria-hidden="true"
      />
      
      <div className={panelClasses}>
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {showCloseButton && (
            <button
              onClick={() => {
                onClose();
                document.body.style.overflow = 'auto';
                document.documentElement.style.overflow = 'auto';
              }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </>
  );
};

export default Modal;