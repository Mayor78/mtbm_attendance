import React from 'react';
import { UserPlus } from 'lucide-react';

const ManualAttendanceButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-green-200 hover:bg-green-700 transition-all"
    >
      <UserPlus size={18} /> Manual Mark
    </button>
  );
};

export default ManualAttendanceButton;