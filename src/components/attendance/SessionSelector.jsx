import React from 'react';
import { ChevronRight } from 'lucide-react';

const SessionSelector = ({ sessions, selectedSession, onSessionChange }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        Attendance Sessions
      </label>
      <div className="relative">
        <select
          value={selectedSession?.id || ''}
          onChange={(e) => onSessionChange(sessions.find(s => s.id === e.target.value))}
          className="w-full bg-slate-50 border-none rounded-xl py-3 pl-4 pr-10 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
        >
          <option value="">Select a session</option>
          {sessions.map((session) => (
            <option key={session.id} value={session.id}>
              {new Date(session.created_at).toLocaleDateString('en-US', {
                year: "numeric",
                month: 'short', 
                day: 'numeric' 
              })}
              {session.is_active ? ' Active' : ' Ended'} 
              ({session.attendanceRecords?.length || 0})
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronRight size={16} className="rotate-90" />
        </div>
      </div>
    </div>
  );
};

export default SessionSelector;