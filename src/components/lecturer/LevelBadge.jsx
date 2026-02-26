import React from 'react';

const LevelBadge = ({ level, showLabel = true }) => {
  const colors = {
    '100': 'bg-blue-100 text-blue-700 border-blue-200',
    '200': 'bg-green-100 text-green-700 border-green-200',
    '300': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    '400': 'bg-purple-100 text-purple-700 border-purple-200',
    '500': 'bg-red-100 text-red-700 border-red-200'
  };

  const color = colors[level] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${color}`}>
      {showLabel ? `Level ${level}` : level}
    </span>
  );
};

export default LevelBadge;