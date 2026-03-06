import React from 'react';
import stud from '../../assets/stud.jpg';
import lec from '../../assets/lect.jpg';

const UserTypeCard = ({ type, title, onSelect }) => {
  // Map images based on type
  const thumbnail = type === 'student' ? stud : lec;

  const getColor = () => {
    switch(type) {
      case 'student':
        return { ring: 'group-hover:ring-blue-400' };
      case 'lecturer':
        return { ring: 'group-hover:ring-emerald-400' };
      default:
        return { ring: 'group-hover:ring-gray-300' };
    }
  };

  const colors = getColor();

  return (
    <button
      onClick={() => onSelect(type)}
      className="group flex flex-col items-center justify-center w-full transition-all duration-300 active:scale-90"
    >
      {/* Avatar Circle with Image */}
      <div className={`relative w-30 h-30 sm:w-40 sm:h-40 rounded-full mb-3 p-1 transition-all duration-500 ring-0 group-hover:ring-4 ${colors.ring}`}>
        <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-white shadow-sm">
          <img 
            src={thumbnail} 
            alt={title}
            className="w-full h-full object-cover transition-all duration-500 md:grayscale group-hover:grayscale-0 group-hover:scale-110"
          />
        </div>
        
        {/* Active Status Dot */}
        <div className="absolute bottom-1 right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md sm:w-6 sm:h-6">
          <div className={`w-3 h-3 rounded-full ${type === 'student' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
        </div>
      </div>

      {/* Identity Text */}
      <span className="text-sm font-bold text-gray-600 tracking-tight group-hover:text-gray-900 transition-colors sm:text-base">
        {title}
      </span>
      
      {/* Google-style subtle sub-text */}
      <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        Login
      </span>
    </button>
  );
};

export default UserTypeCard;