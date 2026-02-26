// components/lecturer/AttendanceAnalytics.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const AttendanceAnalytics = ({ courses, dateRange }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courses.length) {
      fetchAnalytics();
    }
  }, [courses, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const analytics = [];
      
      for (const course of courses) {
        // Get sessions in date range
        let query = supabase
          .from('attendance_sessions')
          .select('id, created_at')
          .eq('course_id', course.id);

        if (dateRange === 'week') {
          query = query.gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
        } else if (dateRange === 'month') {
          query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
        }

        const { data: sessions } = await query;

        if (!sessions?.length) continue;

        // Get attendance records
        const { data: records } = await supabase
          .from('attendance_records')
          .select('id, scanned_at')
          .in('session_id', sessions.map(s => s.id));

        // Get total students
        const { count: totalStudents } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .eq('course_id', course.id);

        const attendanceRate = totalStudents 
          ? Math.round(((records?.length || 0) / (sessions.length * totalStudents)) * 100) 
          : 0;

        analytics.push({
          course: course.course_code,
          sessions: sessions.length,
          attendance: records?.length || 0,
          totalStudents: totalStudents || 0,
          rate: attendanceRate,
          trend: attendanceRate > 75 ? 'good' : attendanceRate > 50 ? 'warning' : 'bad'
        });
      }

      setData(analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
          <div className="h-20 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <TrendingUp size={18} className="text-indigo-500" />
        Attendance Trends
      </h3>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{item.course}</span>
              <span className={`font-medium ${
                item.trend === 'good' ? 'text-green-600' :
                item.trend === 'warning' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {item.rate}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  item.trend === 'good' ? 'bg-green-500' :
                  item.trend === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${item.rate}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>{item.sessions} sessions</span>
              <span>{item.attendance} of {item.totalStudents * item.sessions} marks</span>
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <p className="text-sm text-slate-500 text-center py-4">
          No data available for this period
        </p>
      )}
    </div>
  );
};

export default AttendanceAnalytics;