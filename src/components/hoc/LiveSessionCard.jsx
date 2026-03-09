import { useState, useEffect } from 'react';
import { QrCode, X, Clock, Users, Activity, Radio } from 'lucide-react';

const LiveSessionCard = ({ 
  session, 
  course, 
  count = 0, 
  liveActivity = [],
  onEndSession, 
  onShowQR 
}) => {
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (session?.expires_at) {
      const interval = setInterval(() => {
        const now = new Date();
        const expiry = new Date(session.expires_at);
        const diffMs = expiry - now;
        
        if (diffMs <= 0) {
          setTimeRemaining('Expired');
          clearInterval(interval);
        } else {
          const mins = Math.floor(diffMs / 60000);
          const secs = Math.floor((diffMs % 60000) / 1000);
          setTimeRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [session]);

  if (!session || !course) return null;

  const courseActivities = Array.isArray(liveActivity) 
    ? liveActivity.filter(a => a?.courseCode === course?.course_code)
    : [];

  return (
    <div className="relative group overflow-hidden bg-white border border-emerald-100 rounded-[2.5rem] p-7 transition-all duration-500 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col h-full">
      
      {/* Subtle Top Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-400 opacity-80" />

      {/* Background Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-40 group-hover:opacity-60 transition-opacity" />

      {/* Top Bar: Status & Kill Switch */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-emerald-50 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">Live Recording</span>
        </div>
        
        <button 
          onClick={() => onEndSession(session.id)} 
          className="p-2 text-gray-300 hover:text-white hover:bg-rose-500 rounded-xl transition-all active:scale-90"
          title="Terminate"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
      
      {/* Identity Section */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center gap-2 mb-2">
           <Radio size={14} className="text-emerald-500" />
           <h3 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
            {course?.course_code}
          </h3>
        </div>
        <p className="text-[11px] font-bold text-gray-400 truncate uppercase tracking-[0.1em] pl-6">
          {course?.course_title}
        </p>
      </div>
      
      {/* Metrics Row */}
      <div className="relative z-10 flex items-end justify-between mb-10">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <Users size={12} className="text-emerald-500" /> Check-ins
          </div>
          <p className="text-5xl font-black text-gray-900 tracking-tighter drop-shadow-sm">
            {count}
          </p>
        </div>
        
        {/* Modern Activity Avatars */}
        {courseActivities.length > 0 && (
          <div className="flex flex-col items-end gap-3">
            <div className="flex -space-x-3">
              {courseActivities.slice(0, 3).map((activity, i) => (
                <div 
                  key={i} 
                  className="w-9 h-9 rounded-2xl bg-white border-2 border-emerald-50 flex items-center justify-center text-[11px] font-black text-gray-700 shadow-sm transition-transform hover:-translate-y-1"
                >
                  {activity?.studentName?.charAt(0) || '?'}
                </div>
              ))}
              {courseActivities.length > 3 && (
                <div className="w-9 h-9 rounded-2xl bg-gray-900 border-2 border-white flex items-center justify-center text-[9px] font-black text-white shadow-lg">
                  +{courseActivities.length - 3}
                </div>
              )}
            </div>
            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1.5">
               Live Activity <Activity size={10} className="animate-pulse" />
            </span>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="relative z-10 mt-auto grid grid-cols-2 gap-4 pt-8 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
             <Clock size={18} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Time Remaining</span>
            <span className="text-base font-black text-gray-900 tabular-nums leading-none">
              {timeRemaining}
            </span>
          </div>
        </div>
        
        <button 
          onClick={() => onShowQR(session, course)}
          className="flex items-center justify-center gap-2 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gray-200 hover:bg-emerald-600 hover:shadow-emerald-200 transition-all active:scale-95"
        >
          <QrCode size={16} strokeWidth={2.5} />
          Show QR
        </button>
      </div>
    </div>
  );
};

export default LiveSessionCard;