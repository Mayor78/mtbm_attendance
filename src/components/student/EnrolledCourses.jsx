import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const EnrolledCourses = ({ userId }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState({});

  useEffect(() => {
    fetchEnrolledCourses();
  }, [userId]);

  const fetchEnrolledCourses = async () => {
    try {
      // Get student ID
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!student) return;

      // Get enrolled courses
      const { data, error } = await supabase
        .from('course_enrollments')
        .select(`
          course_id,
          courses (
            id,
            course_code,
            course_title,
            department,
            semester
          )
        `)
        .eq('student_id', student.id);

      if (error) throw error;

      const enrolledCourses = data.map(item => item.courses);
      setCourses(enrolledCourses);
      
      // Check for active sessions
      checkActiveSessions(enrolledCourses);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveSessions = async (coursesList) => {
    const sessions = {};
    
    for (const course of coursesList) {
      const { data } = await supabase
        .from('attendance_sessions')
        .select('id, expires_at')
        .eq('course_id', course.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data) {
        sessions[course.id] = data;
      }
    }
    
    setActiveSessions(sessions);
  };

  if (loading) {
    return <div className="text-center py-4">Loading courses...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        You are not enrolled in any courses yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="border rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-800">{course.course_code}</h3>
              <p className="text-sm text-gray-600 mt-1">{course.course_title}</p>
              <p className="text-xs text-gray-500 mt-2">{course.department}</p>
              <p className="text-xs text-gray-400">Semester: {course.semester}</p>
            </div>
            {activeSessions[course.id] && (
              <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">
                Live Session
              </span>
            )}
          </div>
          <button
            onClick={() => {/* View course details */}}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View Details →
          </button>
        </div>
      ))}
    </div>
  );
};

export default EnrolledCourses;