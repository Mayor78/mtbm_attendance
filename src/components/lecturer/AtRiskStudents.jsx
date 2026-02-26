// components/lecturer/AtRiskStudents.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { AlertCircle, TrendingDown, Mail, Eye } from 'lucide-react';

const AtRiskStudents = ({ courses }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courses.length) {
      calculateAtRiskStudents();
    }
  }, [courses]);

  const calculateAtRiskStudents = async () => {
    try {
      setLoading(true);
      
      // This is a simplified version - you'd need more complex logic
      const atRisk = [];
      
      for (const course of courses) {
        // Get all enrolled students
        const { data: enrollments } = await supabase
          .from('course_enrollments')
          .select(`
            student_id,
            students (
              matric_no,
              profiles (
                full_name
              )
            )
          `)
          .eq('course_id', course.id);

        // Get total sessions for this course
        const { data: sessions } = await supabase
          .from('attendance_sessions')
          .select('id')
          .eq('course_id', course.id);

        if (!sessions?.length) continue;

        // For each student, count their attendance
        for (const enrollment of enrollments) {
          const { count } = await supabase
            .from('attendance_records')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', enrollment.student_id)
            .in('session_id', sessions.map(s => s.id));

          const attendancePercentage = (count / sessions.length) * 100;
          
          if (attendancePercentage < 75) {
            atRisk.push({
              name: enrollment.students?.profiles?.full_name,
              matricNo: enrollment.students?.matric_no,
              course: course.course_code,
              attendance: Math.round(attendancePercentage),
              sessionsMissed: sessions.length - count
            });
          }
        }
      }

      setStudents(atRisk.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Error calculating at-risk students:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
          <div className="h-10 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <AlertCircle size={18} className="text-red-500" />
          At-Risk Students
        </h3>
        <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">
          {students.length} students
        </span>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          No at-risk students found
        </p>
      ) : (
        <div className="space-y-3">
          {students.map((student, index) => (
            <div key={index} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-900">{student.name}</p>
                  <p className="text-xs text-slate-500">{student.matricNo}</p>
                  <p className="text-xs text-indigo-600 mt-1">{student.course}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">{student.attendance}%</p>
                  <p className="text-xs text-slate-500">{student.sessionsMissed} missed</p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <button className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 flex items-center gap-1">
                  <Mail size={12} />
                  Notify
                </button>
                <button className="text-xs px-2 py-1 bg-slate-100 rounded hover:bg-slate-200 flex items-center gap-1">
                  <Eye size={12} />
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AtRiskStudents;