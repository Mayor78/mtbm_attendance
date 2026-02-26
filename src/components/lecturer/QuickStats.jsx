// components/lecturer/QuickStats.jsx
import React from 'react';
import { BookOpen, Users, TrendingUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';

const QuickStats = ({ stats }) => {
  const statCards = [
    {
      label: 'Courses',
      value: stats.totalCourses,
      icon: BookOpen,
      color: 'bg-blue-50 text-blue-600',
      bg: 'bg-blue-500'
    },
    {
      label: 'Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'bg-green-50 text-green-600',
      bg: 'bg-green-500'
    },
    {
      label: 'Avg Attendance',
      value: `${stats.avgAttendance}%`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      bg: 'bg-purple-500'
    },
    {
      label: 'Active Sessions',
      value: stats.activeSessions,
      icon: Clock,
      color: 'bg-orange-50 text-orange-600',
      bg: 'bg-orange-500'
    },
    {
      label: 'Pending Approvals',
      value: stats.pendingApprovals,
      icon: AlertCircle,
      color: 'bg-yellow-50 text-yellow-600',
      bg: 'bg-yellow-500'
    },
    {
      label: 'At-Risk Students',
      value: stats.atRiskStudents,
      icon: Users,
      color: 'bg-red-50 text-red-600',
      bg: 'bg-red-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900">{stat.value}</p>
            </div>
          </div>
          <div className={`mt-3 h-1 rounded-full ${stat.bg} opacity-20`} style={{ width: '60%' }}></div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;