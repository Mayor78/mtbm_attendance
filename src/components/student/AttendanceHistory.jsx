import React from 'react';
import { CheckCircle2, Clock, CalendarDays, MapPin } from 'lucide-react';

const AttendanceHistory = ({ records, loading }) => {
  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3">
        <div className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-xs font-medium text-slate-400">Fetching history...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12 px-4 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-slate-300" />
        </div>
        <h3 className="text-slate-900 font-bold">No Records Yet</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-[200px] mx-auto">
          Your timeline will grow once you start checking into classes.
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Central Timeline Line (only visible on small screens & up) */}
      <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100 md:left-6"></div>

      <div className="space-y-8 relative">
        {records.map((record, index) => {
          const session = record.attendance_sessions;
          const course = session?.courses;
          
          return (
            <div key={record.id} className="relative pl-10 md:pl-14 group">
              {/* Timeline Indicator Dot */}
              <div className="absolute left-0 top-1 w-8 h-8 md:w-12 md:h-12 flex items-center justify-center z-10">
                <div className="w-3 h-3 rounded-full bg-white border-2 border-indigo-600 group-hover:scale-125 transition-transform shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"></div>
              </div>

              {/* Card content */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 hover:shadow-md hover:shadow-indigo-50/50 transition-all">
                
                {/* Course & Date Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                      {course?.course_code || 'Unknown'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[10px] font-bold text-emerald-600 uppercase">
                      Present
                    </span>
                  </div>
                  <h4 className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px]">
                    {course?.course_title || 'No Title Available'}
                  </h4>
                  
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-semibold">
                      <CalendarDays size={12} />
                      {formatDate(record.scanned_at)}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-indigo-500 font-bold">
                      <Clock size={12} />
                      {formatTime(record.scanned_at)}
                    </div>
                  </div>
                </div>

                {/* Status Badge (Desktop/Tablet version) */}
                <div className="hidden sm:flex flex-col items-end">
                   <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                      <CheckCircle2 size={20} className="text-emerald-500" />
                   </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer hint */}
      <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
        End of recent activity
      </p>
    </div>
  );
};

export default AttendanceHistory;