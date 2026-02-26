import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown, Loader } from 'lucide-react';
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
        // Get department and level from the group key
        const [department, levelPart] = key.split(' - Level ');
        const level = levelPart;

        console.log(`📊 Calculating metrics for ${department} Level ${level}`);

        // Get all students in this department and level
        const { count: studentCount, error: studentError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('department', department)
          .eq('level', level);

        if (studentError) throw studentError;
        
        const totalStudents = studentCount || 0;

        // Get all course IDs for this group
        const courseIds = group.courses.map(c => c.id);

        // Get date filter based on dateRange
        let dateFilter = {};
        const now = new Date();
        if (dateRange === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          dateFilter = { gte: weekAgo.toISOString() };
        } else if (dateRange === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          dateFilter = { gte: monthAgo.toISOString() };
        }

        // Get sessions for these courses
        let query = supabase
          .from('attendance_sessions')
          .select('id, created_at')
          .in('course_id', courseIds);

        if (dateFilter.gte) {
          query = query.gte('created_at', dateFilter.gte);
        }

        const { data: sessions, error: sessionsError } = await query;

        if (sessionsError) throw sessionsError;

        const totalSessions = sessions?.length || 0;

        // Get attendance records
        let totalAttendance = 0;
        
        if (totalSessions > 0) {
          const sessionIds = sessions.map(s => s.id);
          
          const { count: attendanceCount, error: attendanceError } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .in('session_id', sessionIds);

          if (attendanceError) throw attendanceError;
          
          totalAttendance = attendanceCount || 0;
        }

        // Calculate attendance percentage
        const totalPossibleAttendance = totalStudents * totalSessions;
        const attendancePercentage = totalPossibleAttendance > 0
          ? Math.round((totalAttendance / totalPossibleAttendance) * 100)
          : 0;

        // Determine trend based on previous period (simplified)
        // In a real app, you'd compare with previous week/month
        const trend = attendancePercentage >= 75 ? 'up' : attendancePercentage >= 50 ? 'stable' : 'down';

        metricsData.push({
          group: key,
          department,
          level,
          attendance: attendancePercentage,
          trend,
          students: totalStudents,
          totalSessions,
          totalAttendance
        });
      }

      setMetrics(metricsData);

    } catch (error) {
      console.error('Error calculating metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={18} className="text-indigo-500" />
          <h3 className="font-semibold">Performance by Class</h3>
        </div>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <PieChart size={18} className="text-indigo-500" />
          <h3 className="font-semibold">Performance by Class</h3>
        </div>
        <p className="text-sm text-slate-400 text-center py-4">
          No performance data available
        </p>
      </div>
    );
  }

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up':
        return <TrendingUp size={14} className="text-green-500" />;
      case 'down':
        return <TrendingDown size={14} className="text-red-500" />;
      default:
        return <span className="w-3.5 h-3.5 rounded-full bg-yellow-400"></span>;
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center gap-2 mb-4">
        <PieChart size={18} className="text-indigo-500" />
        <h3 className="font-semibold">Performance by Class</h3>
        <span className="text-xs text-slate-400 ml-auto">
          {dateRange === 'week' ? 'Last 7 days' : 
           dateRange === 'month' ? 'Last 30 days' : 'This semester'}
        </span>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => (
          <div key={index} className="space-y-2">
            <div className="flex justify-between text-sm">
              <div>
                <span className="font-medium text-slate-700">{metric.department}</span>
                <span className="text-xs text-slate-400 ml-2">Level {metric.level}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${getTextColor(metric.attendance)}`}>
                  {metric.attendance}%
                </span>
                {getTrendIcon(metric.trend)}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${getAttendanceColor(metric.attendance)}`}
                style={{ width: `${metric.attendance}%` }}
              />
            </div>

            {/* Stats Row */}
            <div className="flex justify-between text-xs text-slate-400">
              <span>{metric.students} students</span>
              <span>{metric.totalSessions} sessions</span>
              <span>{metric.totalAttendance} check-ins</span>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <div className="flex justify-between text-xs">
          <span className="text-slate-500">Average across all classes:</span>
          <span className="font-medium text-slate-700">
            {metrics.length > 0 
              ? Math.round(metrics.reduce((acc, m) => acc + m.attendance, 0) / metrics.length) 
              : 0}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;