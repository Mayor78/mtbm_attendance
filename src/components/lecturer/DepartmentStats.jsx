import React from 'react';
import { Users, GraduationCap, TrendingUp, AlertCircle } from 'lucide-react';
import LevelBadge from './LevelBadge';

const DepartmentStats = ({ department, students }) => {
  const totalStudents = students.length;
  
  const levelStats = students.reduce((acc, student) => {
    acc[student.level] = (acc[student.level] || 0) + 1;
    return acc;
  }, {});

  const attendanceStats = students.reduce((acc, student) => {
    if (student.attendanceRate >= 75) acc.good++;
    else if (student.attendanceRate >= 50) acc.average++;
    else acc.poor++;
    return acc;
  }, { good: 0, average: 0, poor: 0 });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <Users size={18} className="text-indigo-600" />
          {department} Overview
        </h3>
        <span className="text-sm text-gray-500">{totalStudents} Students</span>
      </div>

      {/* Level Distribution */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Students by Level</p>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(levelStats).map(([level, count]) => (
            <div key={level} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <LevelBadge level={level} />
              <span className="text-sm font-medium text-gray-700">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Overview */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Attendance Distribution</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-green-600">Good (75%+)</span>
            <span className="font-medium">{attendanceStats.good}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full"
              style={{ width: `${(attendanceStats.good / totalStudents) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-yellow-600">Average (50-74%)</span>
            <span className="font-medium">{attendanceStats.average}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-yellow-500 rounded-full"
              style={{ width: `${(attendanceStats.average / totalStudents) * 100}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-red-600">At Risk (Below 50%)</span>
            <span className="font-medium">{attendanceStats.poor}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-red-500 rounded-full"
              style={{ width: `${(attendanceStats.poor / totalStudents) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepartmentStats;