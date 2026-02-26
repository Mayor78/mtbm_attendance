import React from 'react';
import { ChevronRight, CheckCircle, XCircle } from 'lucide-react';

const SessionSelector = ({ sessions, selectedSession, onSessionChange, loading }) => {
  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
        Attendance Sessions
      </label>
      <div className="relative">
        <select
          value={selectedSession?.id || ''}
          onChange={(e) => onSessionChange(sessions.find(s => s.id === e.target.value))}
          disabled={loading}
          className="w-full bg-slate-50 border-none rounded-xl py-3 pl-4 pr-10 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 appearance-none transition-all disabled:opacity-50"
        >
          <option value="">Select a session</option>
          {sortedSessions.map((session) => (
            <option key={session.id} value={session.id}>
              {new Date(session.created_at).toLocaleDateString('en-US', {
                year: "numeric",
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              {' • '}
              {session.is_active ? '🟢 Active' : '⚫ Ended'} 
              {' • '}
              {session.attendanceRecords?.length || 0} present
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronRight size={16} className="rotate-90" />
        </div>
      </div>
      
      {/* Active session indicator */}
      {sessions.some(s => s.is_active) && (
        <div className="mt-2 flex items-center gap-1 text-xs text-green-600">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
          Live session in progress
        </div>
      )}
    </div>
  );
};

export default SessionSelector;