import  { useState, useEffect } from 'react';
import { QrCode, X } from 'lucide-react';






const LiveSessionCard = ({ 
  session, 
  course, 
  count = 0, 
  liveActivity = [], // Default to empty array
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

  // Safely filter live activity for this course
  const courseActivities = Array.isArray(liveActivity) 
    ? liveActivity.filter(a => a?.courseCode === course?.course_code)
    : [];


   

  return (
    <div className="bg-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group hover:shadow-2xl transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-start">
          <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
            🟢 Live
          </div>
          <button 
            onClick={() => onEndSession(session.id)} 
            className="text-xs bg-rose-500 hover:bg-rose-600 px-4 py-1.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
          >
            End Session
          </button>
        </div>
        
        <div>
          <h3 className="text-lg font-black leading-tight line-clamp-1">{course?.course_code}</h3>
          <p className="text-indigo-100 text-xs font-medium line-clamp-1">{course?.course_title}</p>
          <p className="text-indigo-200 text-[10px] mt-1 font-mono">
            Started {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        
        <div className="flex items-end justify-between border-t border-white/10 pt-4">
          <div className="flex items-baseline gap-2">
            <div className="relative">
              <span 
                key={count} 
                className="text-4xl font-black tabular-nums inline-block animate-number-pop"
              >
                {count}
              </span>
              <span className="absolute -top-1 -right-2 text-[10px] bg-white/20 px-1 rounded-full">
                {count === 1 ? 'student' : 'students'}
              </span>
            </div>
            <span className="text-indigo-200 text-xs font-bold uppercase tracking-tighter ml-2">
              Checked-in
            </span>
          </div>
          
          {/* Live Activity Avatars */}
          {courseActivities.length > 0 && (
            <div className="flex items-center gap-1 animate-slide-in-right">
              <div className="flex -space-x-2">
                {courseActivities.slice(0, 3).map((activity, i) => (
                  <div 
                    key={i} 
                    className="w-6 h-6 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-[8px] font-bold animate-fade-in"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    {activity?.studentName?.charAt(0) || '?'}
                  </div>
                ))}
              </div>
              <span className="text-[10px] text-white/80 animate-pulse">
                +{courseActivities.length}
              </span>
            </div>
          )}
          {timeRemaining && (
  <div className="text-xs text-white/80 mt-1">
    ⏱️ {timeRemaining} remaining
  </div>
)}
          
          <button 
            onClick={() => onShowQR(session, course)}
            className="p-3 bg-white text-indigo-600 rounded-2xl hover:scale-110 transition-transform duration-300 shadow-lg hover:rotate-3 active:scale-95"
          >
            <QrCode size={20} />
          </button>
        </div>
      </div>
      
      <QrCode className="absolute -right-4 -bottom-4 text-white/5 rotate-12 transition-all duration-500 group-hover:scale-125 group-hover:rotate-6" size={160} />
      <div className="absolute inset-x-0 h-0.5 bg-white/30 animate-scan-line"></div>
    </div>
  );
};

export default LiveSessionCard;