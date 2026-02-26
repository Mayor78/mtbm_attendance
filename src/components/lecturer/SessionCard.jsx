import React from 'react';
import { Calendar, Clock, Users, Eye, Download, CheckCircle, XCircle, MoreVertical } from 'lucide-react';

const SessionCard = ({ session, course, onViewDetails, onExport }) => {
  const attendanceCount = session.attendance_records?.length || 0;
  const totalStudents = session.totalStudents || 0;
  const attendanceRate = totalStudents > 0 
    ? Math.round((attendanceCount / totalStudents) * 100) 
    : 0;

  // Modern Semantic Colors
  const getStatusStyles = () => {
    if (session.is_active) return 'bg-emerald-50 text-emerald-700 border-emerald-100 ring-1 ring-emerald-500/20';
    return 'bg-gray-50 text-gray-500 border-gray-100';
  };

  const getAttendanceColor = () => {
    if (attendanceRate >= 75) return 'text-emerald-600';
    if (attendanceRate >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getProgressBg = () => {
    if (attendanceRate >= 75) return 'bg-emerald-500';
    if (attendanceRate >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all">
      {/* Header Area */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
            {course?.course_code}
          </h3>
          <p className="text-xs font-bold text-gray-400 mt-0.5 line-clamp-1">
            {course?.course_title}
          </p>
        </div>
        
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyles()}`}>
          {session.is_active && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          {session.is_active ? 'Active' : 'Ended'}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
            <Calendar size={14} className="text-gray-400 group-hover:text-indigo-500" />
          </div>
          <span className="text-xs font-semibold text-gray-600">
            {new Date(session.created_at).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-indigo-50 transition-colors">
            <Clock size={14} className="text-gray-400 group-hover:text-indigo-500" />
          </div>
          <span className="text-xs font-mono font-bold text-gray-500">
            {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span className="mx-2 text-gray-200">|</span>
            {session.duration || '1.5h'}
          </span>
        </div>

        <div className="space-y-2 pt-1">
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-2 text-gray-400">
              <Users size={12} />
              <span>Attendance</span>
            </div>
            <span className={getAttendanceColor()}>{attendanceRate}%</span>
          </div>
          <div className="w-full h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${getProgressBg()}`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <p className="text-[10px] font-bold text-gray-400 text-right">
            {attendanceCount} of {totalStudents} present
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => onViewDetails(session, course)}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
        >
          <Eye size={14} strokeWidth={3} />
          Details
        </button>
        <button
          onClick={() => onExport(session, course)}
          className="px-4 py-2.5 bg-white border border-gray-100 text-gray-400 rounded-xl text-xs font-bold hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95"
          title="Export Session Data"
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
};

export default SessionCard;