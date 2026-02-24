import React from 'react';
import { Users, Clock, FileText } from 'lucide-react';
import { StatCardMobile } from './StatCard';

const SessionStats = ({ session, onExportPDF }) => {
  const stats = [
    {
      label: "Present",
      value: session?.attendanceRecords?.length || 0,
      icon: <Users size={16} className="text-indigo-600" />,
      color: "bg-indigo-50"
    },
    {
      label: "Status",
      value: session?.is_active ? 'Active' : 'Closed',
      icon: <div className={`w-2 h-2 rounded-full ${session?.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />,
      color: session?.is_active ? 'bg-green-50' : 'bg-slate-50'
    },
    {
      label: "Start",
      value: new Date(session?.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      icon: <Clock size={16} className="text-amber-600" />,
      color: "bg-amber-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat, index) => (
        <StatCardMobile key={index} {...stat} />
      ))}
      <button 
        onClick={onExportPDF}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md group"
      >
        <FileText size={16} className="mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] uppercase font-bold">PDF</span>
      </button>
    </div>
  );
};

export default SessionStats;