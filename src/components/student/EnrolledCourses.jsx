import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { BookOpen, Clock, Calendar, ChevronRight } from 'lucide-react';

const EnrolledCourses = ({ userId }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const [attendanceStats, setAttendanceStats] = useState({});

  useEffect(() => {
    fetchStudentAndCourses();
  }, [userId]);

  const fetchStudentAndCourses = async () => {
    try {
      // Get student details with department and level
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, department, level, full_name, matric_no')
        .eq('user_id', userId)
        .single();

      if (studentError) throw studentError;
      
      setStudentInfo(student);
      console.log('👤 Student info:', student);

      // Get ALL courses for this student's department and level
      // This ensures they only see courses meant for their class
      const { data: availableCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, course_code, course_title, department, level, semester')
        .eq('department', student.department)
        .eq('level', student.level)
        .order('course_code');

      if (coursesError) throw coursesError;

      console.log(`📚 Found ${availableCourses.length} courses for ${student.department} Level ${student.level}`);
      setCourses(availableCourses || []);
      
      // Check for active sessions in these courses
      if (availableCourses && availableCourses.length > 0) {
        checkActiveSessions(availableCourses);
        fetchAttendanceStats(student.id, availableCourses);
      }

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
        .select('id, expires_at, start_time')
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

  const fetchAttendanceStats = async (studentId, coursesList) => {
    const stats = {};
    
    for (const course of coursesList) {
      // Get total sessions for this course
      const { count: totalSessions } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('course_id', course.id);

      // Get student's attendance records for this course
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('id, status, scanned_at, session_id')
        .eq('student_id', studentId)
        .in('session_id', (
          await supabase
            .from('attendance_sessions')
            .select('id')
            .eq('course_id', course.id)
        ).data?.map(s => s.id) || []);

      const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
      const attendanceRate = totalSessions > 0 
        ? Math.round((presentCount / totalSessions) * 100) 
        : 0;

      stats[course.id] = {
        totalSessions: totalSessions || 0,
        presentCount,
        attendanceRate
      };
    }
    
    setAttendanceStats(stats);
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min remaining`;
    
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} remaining`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
        <h3 className="text-lg font-medium text-gray-700">No Courses Available</h3>
        <p className="text-sm text-gray-500 mt-1">
          {studentInfo 
            ? `No courses found for ${studentInfo.department} Level ${studentInfo.level}`
            : 'Please complete your profile setup'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Student Info Header */}
      {studentInfo && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4">
          <p className="text-sm text-indigo-700">
            <span className="font-medium">{studentInfo.department}</span> • Level {studentInfo.level}
          </p>
          <p className="text-xs text-indigo-500 mt-1">{studentInfo.matric_no}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-white group"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-800 text-lg">{course.course_code}</h3>
                  {activeSessions[course.id] && (
                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-medium animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{course.course_title}</p>
                
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    {course.department}
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                    Semester: {course.semester || 'Current'}
                  </p>
                </div>

                {/* Attendance Stats */}
                {attendanceStats[course.id] && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Attendance</span>
                      <span className={`font-medium ${
                        attendanceStats[course.id].attendanceRate >= 75 ? 'text-green-600' :
                        attendanceStats[course.id].attendanceRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {attendanceStats[course.id].attendanceRate}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          attendanceStats[course.id].attendanceRate >= 75 ? 'bg-green-500' :
                          attendanceStats[course.id].attendanceRate >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${attendanceStats[course.id].attendanceRate}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {attendanceStats[course.id].presentCount} of {attendanceStats[course.id].totalSessions} sessions
                    </p>
                  </div>
                )}

                {/* Active Session Info */}
                {activeSessions[course.id] && (
                  <div className="mt-3 bg-green-50 rounded-lg p-2 flex items-center gap-2">
                    <Clock size={12} className="text-green-600 animate-pulse" />
                    <span className="text-[10px] text-green-700 font-medium">
                      {getTimeRemaining(activeSessions[course.id].expires_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => window.location.href = `/course/${course.id}/attendance`}
              className="mt-4 w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors group"
            >
              <span className="text-xs font-medium text-gray-600 group-hover:text-indigo-600">
                View Course
              </span>
              <ChevronRight size={14} className="text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnrolledCourses;