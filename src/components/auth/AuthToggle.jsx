import React from 'react';

const AuthToggle = ({ isLogin, onToggle }) => {
  return (
    <div className="flex gap-1 mb-6 p-0.5 bg-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => onToggle(true)}
        className={`
          flex-1 py-2 text-xs font-medium rounded-md transition-all
          ${isLogin 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onToggle(false)}
        className={`
          flex-1 py-2 text-xs font-medium rounded-md transition-all
          ${!isLogin 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        Sign Up
      </button>
    </div>
  );
};

export default AuthToggle;