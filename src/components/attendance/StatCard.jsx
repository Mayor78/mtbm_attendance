import React from 'react';

// Mobile-optimized Stat Card
export const StatCardMobile = ({ label, value, icon, color }) => (
  <div className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2 ${color}`}>
    <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

// Desktop Stat Card
export const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

export default StatCardMobile;