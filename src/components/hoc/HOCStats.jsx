import React from 'react';
import { BookOpen, Users, Calendar, Target, TrendingUp, Clock } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </div>
);

const HOCStats = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={BookOpen}
        label="Department Courses"
        value={stats.totalCourses}
        color="bg-blue-600"
        subtext={`${stats.department} • Level ${stats.level}`}
      />
      
      <StatCard
        icon={Users}
        label="Total Students"
        value={stats.totalStudents}
        color="bg-green-600"
        subtext="In your department"
      />
      
      <StatCard
        icon={Calendar}
        label="Total Sessions"
        value={stats.totalSessions}
        color="bg-purple-600"
        subtext={`${stats.activeSessions} active now`}
      />
      
      <StatCard
        icon={Target}
        label="Avg Attendance"
        value={`${stats.averageAttendance}%`}
        color="bg-amber-600"
        subtext="Across all courses"
      />
    </div>
  );
};

export default HOCStats;