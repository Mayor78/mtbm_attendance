import React from 'react';
import { Calendar, Plus, QrCode } from 'lucide-react';
import ManualAttendanceButton from './ManualAttendanceButton';

const HOCHeader = ({ profile, onNewCourse, onStartSession, onManualAttendance }) => {
  // --- GREETING LOGIC ---
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <header className="py-8 px-4 sm:px-2 border-b border-gray-100 mb-10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
        
        {/* Left: Identity & Date */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            <Calendar size={12} strokeWidth={2.5} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            {getGreeting()}, {profile?.full_name?.split(' ')[0] || 'HOC'}.
          </h1>
        </div>
        
        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <ManualAttendanceButton onClick={onManualAttendance} />
          
          <button
            onClick={onNewCourse}
            className="group flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-900 transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            New Course
          </button>

          <button
            onClick={onStartSession}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-xl shadow-gray-200"
          >
            <QrCode size={16} strokeWidth={2.5} />
            Start Session
          </button>
        </div>
      </div>
    </header>
  );
};

export default HOCHeader;