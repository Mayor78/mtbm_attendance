import React from 'react';
import { Users, TrendingUp, Calendar, Download } from 'lucide-react';
import { StatCardMobile } from './StatCard';

const StudentStatsCards = ({ totalStudents, avgAttendance, totalSessions, onExport }) => {
  const stats = [
    {
      label: "Total",
      value: totalStudents,
      icon: <Users size={16} className="text-indigo-600" />,
      color: "bg-indigo-50"
    },
    {
      label: "Avg %",
      value: avgAttendance + '%',
      icon: <TrendingUp size={16} className="text-green-600" />,
      color: "bg-green-50"
    },
    {
      label: "Sessions",
      value: totalSessions,
      icon: <Calendar size={16} className="text-purple-600" />,
      color: "bg-purple-50"
    }
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {stats.map((stat, index) => (
        <StatCardMobile key={index} {...stat} />
      ))}
      <button
        onClick={onExport}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md"
      >
        <Download size={16} className="mb-1" />
        <span className="text-[10px] uppercase font-bold">Export</span>
      </button>
    </div>
  );
};

export default StudentStatsCards;