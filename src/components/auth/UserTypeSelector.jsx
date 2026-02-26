import React from 'react';

const UserTypeSelector = ({ userType, onSelect, isLogin }) => {
  return (
    <div className="flex gap-1 mb-4 p-0.5 bg-gray-100 rounded-lg">
      <button
        type="button"
        onClick={() => onSelect('student')}
        className={`
          flex-1 py-1.5 text-xs font-medium rounded-md transition-all
          ${userType === 'student' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        Student
      </button>
      <button
        type="button"
        onClick={() => onSelect('lecturer')}
        className={`
          flex-1 py-1.5 text-xs font-medium rounded-md transition-all
          ${userType === 'lecturer' 
            ? 'bg-white text-gray-900 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
          }
        `}
      >
        Lecturer
      </button>
    </div>
  );
};

export default UserTypeSelector;