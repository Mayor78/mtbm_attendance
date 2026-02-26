import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Users, TrendingUp, Clock, Eye } from 'lucide-react';

const CourseGroup = ({ group, onViewGroup }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 0,
    activeSessions: 0,
    totalSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateGroupStats();
  }, [group]);

  const calculateGroupStats = async () => {
    setLoading(true);
    
    try {
      // Get department and level from the group
      const department = group.department;
      const level = group.level;
      
      console.log(`📊 Calculating stats for ${department} Level ${level}`);

      // 1. Get total students in this department and level (rule-based)
      const { count: studentCount, error: studentError } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('department', department)
        .eq('level', level);

      if (studentError) throw studentError;
      
      const totalStudents = studentCount || 0;
      console.log(`👥 Found ${totalStudents} students in ${department} Level ${level}`);

      // 2. Get all course IDs in this group
      const courseIds = group.courses.map(c => c.id);
      
      // 3. Get all sessions for these courses
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id, is_active, expires_at')
        .in('course_id', courseIds);

      if (sessionsError) throw sessionsError;

      const totalSessions = sessions?.length || 0;
      const now = new Date().toISOString();
      const activeCount = sessions?.filter(s => 
        s.is_active && s.expires_at > now
      ).length || 0;

      console.log(`📅 Found ${totalSessions} sessions (${activeCount} active)`);

      // 4. Get attendance records for these sessions
      let totalAttendance = 0;
      
      if (totalSessions > 0) {
        const sessionIds = sessions.map(s => s.id);
        
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds);

        if (attendanceError) throw attendanceError;
        
        totalAttendance = attendanceCount || 0;
        console.log(`✅ Found ${totalAttendance} attendance records`);
      }

      // 5. Calculate average attendance
      const totalPossibleAttendance = totalStudents * totalSessions;
      const avgAttendance = totalPossibleAttendance > 0
        ? Math.round((totalAttendance / totalPossibleAttendance) * 100)
        : 0;

      console.log(`📊 Avg attendance: ${avgAttendance}%`);

      setStats({
        totalStudents,
        avgAttendance,
        activeSessions: activeCount,
        totalSessions
      });

    } catch (error) {
      console.error('Error calculating group stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-8 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
              <div className="h-8 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-200 transition-colors">
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-slate-900">{group.department}</h3>
            <p className="text-sm text-indigo-600">Level {group.level}</p>
          </div>
          <button
            onClick={onViewGroup}
            className="p-2 hover:bg-white rounded-lg transition-colors"
            title="View all courses in this group"
          >
            <ChevronRight size={20} className="text-indigo-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{group.courses.length}</p>
            <p className="text-xs text-slate-500">Courses</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900">{stats.totalStudents}</p>
            <p className="text-xs text-slate-500">Students</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${
              stats.avgAttendance >= 75 ? 'text-green-600' :
              stats.avgAttendance >= 50 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {stats.avgAttendance}%
            </p>
            <p className="text-xs text-slate-500">Attendance</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {stats.activeSessions > 0 && (
            <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full flex items-center gap-1">
              <Clock size={12} />
              {stats.activeSessions} active {stats.activeSessions === 1 ? 'session' : 'sessions'}
            </span>
          )}
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
            <Users size={12} />
            {stats.totalStudents} {stats.totalStudents === 1 ? 'student' : 'students'}
          </span>
          {stats.totalSessions > 0 && (
            <span className="text-xs px-2 py-1 bg-purple-50 text-purple-600 rounded-full flex items-center gap-1">
              <TrendingUp size={12} />
              {stats.totalSessions} total sessions
            </span>
          )}
        </div>

        {/* Attendance progress bar */}
        {stats.totalSessions > 0 && (
          <div className="mt-3">
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${
                  stats.avgAttendance >= 75 ? 'bg-green-500' :
                  stats.avgAttendance >= 50 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${stats.avgAttendance}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseGroup;