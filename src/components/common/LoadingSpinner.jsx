import React from 'react';

const LoadingSpinner = ({ message = "Loading records..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">{message}</p>
    </div>
  );
};

export default LoadingSpinner;