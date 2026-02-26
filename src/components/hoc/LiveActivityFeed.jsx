import React from 'react';
import { Activity, X } from 'lucide-react';

const LiveActivityFeed = ({ activities = [], onClose }) => {
  // Ensure activities is an array
  const safeActivities = Array.isArray(activities) ? activities : [];
  
  if (safeActivities.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden z-50 animate-slide-in-right">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 text-white flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity size={16} className="animate-pulse" />
          <span className="font-bold text-sm">Live Activity</span>
        </div>
        <button 
          onClick={onClose}
          className="hover:bg-white/20 p-1 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto p-2 space-y-2">
        {safeActivities.map((item) => (
          <div 
            key={item.id} 
            className="bg-slate-50 rounded-xl p-3 text-sm animate-slide-in-bottom hover:bg-indigo-50 transition-colors group"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold group-hover:scale-110 transition-transform">
                {item.studentName?.charAt(0) || '?'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800">{item.studentName || 'Unknown'}</p>
                <p className="text-xs text-slate-500">{item.matricNo || 'N/A'} • {item.courseCode || 'Unknown'}</p>
                <p className="text-[10px] text-indigo-400 mt-1">
                  {item.time || 'Just now'}
                  {item.isManual && ' (Manual)'}
                </p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveActivityFeed;