import React from 'react';
import { Calendar, Plus, QrCode } from 'lucide-react';
import ManualAttendanceButton from './ManualAttendanceButton';

const HOCHeader = ({ profile, onNewCourse, onStartSession, onManualAttendance }) => {
  return (
    <header className="relative overflow-hidden bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">
            Welcome, <span className="text-indigo-600">{profile?.full_name?.split(' ')[0] || 'HOC'}</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
            <Calendar size={14} className="text-indigo-400" />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <ManualAttendanceButton onClick={onManualAttendance} />
          <button
            onClick={onNewCourse}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all"
          >
            <Plus size={18} /> New Course
          </button>
          <button
            onClick={onStartSession}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
          >
            <QrCode size={18} /> Start Session
          </button>
        </div>
      </div>
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
    </header>
  );
};

export default HOCHeader;