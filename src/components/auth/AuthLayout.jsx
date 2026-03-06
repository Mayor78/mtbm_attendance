import React from 'react';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuthLayout = ({ children, title, showBackButton = true }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        {/* Back button */}
        {showBackButton && (
          <button
            onClick={() => navigate('/select-type')}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Change account type</span>
          </button>
        )}

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-xl mb-4 shadow-lg">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            {title || 'HNDAttendance'}
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Maritime Academy • Attendance System
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {children}
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            Need help? Contact the IT Support Desk
          </p>
          <p className="text-xs text-gray-400 mt-1">
            &copy; {new Date().getFullYear()} University Registrar Office
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;