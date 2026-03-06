import React from 'react';
import { ShieldCheck } from 'lucide-react';

const TypeSelectionLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-xl mb-4">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h2 className="text-2xl font-light text-gray-900 tracking-tight">
            HNDAttendance
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Select your account type to continue
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-sm">
          {children}
        </div>

        <p className="mt-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Fcmt Attendance System. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default TypeSelectionLayout;