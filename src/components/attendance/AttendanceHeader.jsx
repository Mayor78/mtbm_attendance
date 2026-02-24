import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Users, RefreshCcw } from 'lucide-react';

const AttendanceHeader = ({ 
  courseCode, 
  courseTitle, 
  viewMode, 
  onViewModeChange, 
  onRefresh, 
  isRefreshing 
}) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        <Link 
          to="/dashboard" 
          className="mt-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
        >
          <ArrowLeft size={18} className="text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight truncate">
            {courseCode}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
            {courseTitle}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full">
          <button
            onClick={() => onViewModeChange('sessions')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
              viewMode === 'sessions' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-600'
            }`}
          >
            <Calendar size={14} />
            <span className="hidden xs:inline">Sessions</span>
          </button>
          <button
            onClick={() => onViewModeChange('students')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
              viewMode === 'students' 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-slate-600'
            }`}
          >
            <Users size={14} />
            <span className="hidden xs:inline">Students</span>
          </button>
        </div>
        <button
          onClick={onRefresh}
          className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all flex-shrink-0"
        >
          <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
};

export default AttendanceHeader;