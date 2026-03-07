import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const PerformanceMetrics = ({ courses, groupedCourses, dateRange }) => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateMetrics();
  }, [groupedCourses, dateRange]);

  const calculateMetrics = async () => {
    setLoading(true);
    
    try {
      const metricsData = [];

      for (const [key, group] of Object.entries(groupedCourses)) {
        const [department, levelPart] = key.split(' - Level ');
        const level = levelPart;

        // Get student count
        const { count: studentCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('department', department)
          .eq('level', level);

        const totalStudents = studentCount || 0;
        const courseIds = group.courses.map(c => c.id);

        // Date filter
        let query = supabase
          .from('attendance_sessions')
          .select('id')
          .in('course_id', courseIds);

        if (dateRange === 'week') {
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', weekAgo);
        } else if (dateRange === 'month') {
          const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          query = query.gte('created_at', monthAgo);
        }

        const { data: sessions } = await query;
        const totalSessions = sessions?.length || 0;

        // Attendance records
        let totalAttendance = 0;
        if (totalSessions > 0) {
          const sessionIds = sessions.map(s => s.id);
          const { count } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .in('session_id', sessionIds);
          totalAttendance = count || 0;
        }

        // Calculate percentage
        const totalPossible = totalStudents * totalSessions;
        const percentage = totalPossible > 0 ? Math.round((totalAttendance / totalPossible) * 100) : 0;

        // Simple trend based on percentage
        const trend = percentage >= 75 ? 'up' : percentage >= 50 ? 'stable' : 'down';

        metricsData.push({
          department,
          level,
          percentage,
          trend,
          students: totalStudents,
          sessions: totalSessions,
          attendance: totalAttendance
        });
      }

      setMetrics(metricsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-200 border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <p className="text-sm text-gray-400 text-center py-4">No data available</p>
      </div>
    );
  }

  const getTrendIcon = (trend) => {
    if (trend === 'up') return <TrendingUp size={12} className="text-green-500" />;
    if (trend === 'down') return <TrendingDown size={12} className="text-red-500" />;
    return null;
  };

  const getBarColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const avgPercentage = metrics.length > 0 
    ? Math.round(metrics.reduce((acc, m) => acc + m.percentage, 0) / metrics.length) 
    : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PieChart size={16} className="text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">Class Performance</h3>
        </div>
        <span className="text-xs text-gray-400">
          {dateRange === 'week' ? '7d' : dateRange === 'month' ? '30d' : 'all'}
        </span>
      </div>

      <div className="space-y-3">
        {metrics.map((metric, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600">
                {metric.department} L{metric.level}
              </span>
              <div className="flex items-center gap-1">
                <span className={`font-medium ${
                  metric.percentage >= 75 ? 'text-green-600' :
                  metric.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {metric.percentage}%
                </span>
                {getTrendIcon(metric.trend)}
              </div>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${getBarColor(metric.percentage)}`}
                style={{ width: `${metric.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{metric.students} students</span>
              <span>{metric.sessions} sessions</span>
            </div>
          </div>
        ))}
      </div>

      {metrics.length > 1 && (
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="flex justify-between text-xs">
            <span className="text-gray-400">Average</span>
            <span className="font-medium text-gray-700">{avgPercentage}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMetrics;