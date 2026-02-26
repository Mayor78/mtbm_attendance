// components/lecturer/CourseGroup.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { ChevronRight, Users, TrendingUp, Clock, Eye } from 'lucide-react';

const CourseGroup = ({ group, onViewGroup }) => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    avgAttendance: 0,
    activeSessions: 0
  });

  useEffect(() => {
    calculateGroupStats();
  }, [group]);

  const calculateGroupStats = async () => {
    let totalStudents = 0;
    let totalAttendance = 0;
    let totalSessions = 0;
    let activeCount = 0;

    for (const course of group.courses) {
      // Get enrolled students
      const { count: studentCount } = await supabase
        .from('course_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id);
      
      totalStudents += studentCount || 0;

      // Get sessions
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id, is_active')
        .eq('course_id', course.id);
      
      const sessionCount = sessions?.length || 0;
      totalSessions += sessionCount;
      activeCount += sessions?.filter(s => s.is_active).length || 0;

      // Get attendance records
      if (sessionCount > 0) {
        const sessionIds = sessions.map(s => s.id);
        const { count: attendanceCount } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds);
        
        totalAttendance += attendanceCount || 0;
      }
    }

    const avgAttendance = totalSessions > 0 && totalStudents > 0 
      ? Math.round((totalAttendance / (totalSessions * totalStudents)) * 100) 
      : 0;

    setStats({
      totalStudents,
      avgAttendance,
      activeSessions: activeCount
    });
  };

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
            <p className="text-2xl font-bold text-green-600">{stats.avgAttendance}%</p>
            <p className="text-xs text-slate-500">Attendance</p>
          </div>
        </div>

        <div className="flex gap-2">
          {stats.activeSessions > 0 && (
            <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full flex items-center gap-1">
              <Clock size={12} />
              {stats.activeSessions} active
            </span>
          )}
          <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full flex items-center gap-1">
            <Users size={12} />
            {group.courses.length} courses
          </span>
        </div>
      </div>
    </div>
  );
};

export default CourseGroup;