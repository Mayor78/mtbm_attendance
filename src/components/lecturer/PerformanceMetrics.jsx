// components/lecturer/PerformanceMetrics.jsx
import React from 'react';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';

const PerformanceMetrics = ({ courses, groupedCourses, dateRange }) => {
  const metrics = Object.entries(groupedCourses).map(([key, group]) => {
    const attendance = group.courses.reduce((acc, course) => {
      // This would be calculated from actual data
      return acc + (course.attendance || 75);
    }, 0) / group.courses.length;

    return {
      group: key,
      attendance: Math.round(attendance),
      trend: attendance > 75 ? 'up' : 'down',
      students: group.totalStudents || 0
    };
  });

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <PieChart size={18} className="text-indigo-500" />
        Performance by Class
      </h3>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-slate-600">{metric.group}</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.attendance}%
                </span>
                {metric.trend === 'up' ? (
                  <TrendingUp size={14} className="text-green-500" />
                ) : (
                  <TrendingDown size={14} className="text-red-500" />
                )}
              </div>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  metric.attendance >= 75 ? 'bg-green-500' :
                  metric.attendance >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${metric.attendance}%` }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {metric.students} students
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PerformanceMetrics;