// components/lecturer/HOCManagement.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { UserCheck, UserX, Clock, Eye, RefreshCw, Shield } from 'lucide-react';

const HOCManagement = ({ courses, lecturerId }) => {
  const [hocs, setHocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');

  useEffect(() => {
    if (courses.length) {
      fetchHOCs();
    }
  }, [courses]);

  const fetchHOCs = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('course_representatives')
        .select(`
          id,
          course_id,
          courses (
            course_code,
            course_title
          ),
          students (
            id,
            matric_no,
            profiles (
              full_name,
              email
            )
          )
        `)
        .in('course_id', courses.map(c => c.id));

      if (error) throw error;

      // Get recent activity for each HOC
      const hocsWithActivity = await Promise.all(
        data.map(async (hoc) => {
          const { count: sessionCount } = await supabase
            .from('attendance_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', hoc.students?.profiles?.id)
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          return {
            ...hoc,
            recentSessions: sessionCount || 0
          };
        })
      );

      setHocs(hocsWithActivity);
    } catch (error) {
      console.error('Error fetching HOCs:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateHOCStatus = async (hocId, action) => {
    // Implement status update (activate/deactivate)
  };

  const filteredHocs = selectedCourse
    ? hocs.filter(h => h.course_id === selectedCourse)
    : hocs;

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">HOC Management</h2>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
        >
          <option value="">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.course_code}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredHocs.map((hoc) => (
          <div
            key={hoc.id}
            className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-200 transition-colors"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <Shield size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">
                    {hoc.students?.profiles?.full_name}
                  </h3>
                  <p className="text-sm text-slate-500">{hoc.students?.matric_no}</p>
                  <p className="text-xs text-indigo-600 mt-1">
                    {hoc.courses?.course_code} - {hoc.courses?.course_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600 flex items-center gap-1">
                  <Clock size={14} />
                  <span>{hoc.recentSessions} sessions this week</span>
                </div>
                <button
                  onClick={() => {/* View HOC details */}}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                >
                  <Eye size={18} className="text-slate-500" />
                </button>
              </div>
            </div>

            {/* Activity indicators */}
            <div className="mt-3 flex gap-2">
              {hoc.recentSessions > 0 ? (
                <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full flex items-center gap-1">
                  <UserCheck size={12} />
                  Active
                </span>
              ) : (
                <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-600 rounded-full flex items-center gap-1">
                  <UserX size={12} />
                  Inactive this week
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HOCManagement;