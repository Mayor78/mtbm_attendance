import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, Clock, ChevronRight, Activity, X, 
  Calendar, CheckCircle, AlertCircle, BarChart2,
  TrendingUp, TrendingDown, Target, Users
} from 'lucide-react';

const EnrolledCourses = ({ userId }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const [attendanceStats, setAttendanceStats] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchStudentAndCourses();
  }, [userId]);

  const fetchStudentAndCourses = async () => {
    try {
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, department, level, full_name, matric_no')
        .eq('user_id', userId)
        .single();

      if (studentError) throw studentError;
      setStudentInfo(student);

      const { data: availableCourses, error: coursesError } = await supabase
        .from('courses')
        .select('id, course_code, course_title, department, level, semester')
        .eq('department', student.department)
        .eq('level', student.level)
        .order('course_code');

      if (coursesError) throw coursesError;
      setCourses(availableCourses || []);
      
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
      if (data) sessions[course.id] = data;
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

      // Get all session IDs for this course
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .eq('course_id', course.id);

      const sessionIds = sessions?.map(s => s.id) || [];

      // Get student's attendance records for these sessions
      let presentCount = 0;
      let lateCount = 0;

      if (sessionIds.length > 0) {
        const { data: attendance } = await supabase
          .from('attendance_records')
          .select('id, scanned_at')
          .eq('student_id', studentId)
          .in('session_id', sessionIds);

        presentCount = attendance?.length || 0;
        // Since we don't have a status column, we can't determine late vs present
        // All records are considered present
      }
      
      const absentCount = (totalSessions || 0) - presentCount;
      
      stats[course.id] = {
        totalSessions: totalSessions || 0,
        presentCount,
        lateCount: 0, // Can't determine late without status column
        absentCount,
        attendanceRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0,
        lastAttended: null // Would need to fetch last attendance
      };
    }
    setAttendanceStats(stats);
  };

  const fetchCourseDetails = async (course) => {
    setModalLoading(true);
    try {
      // Get all sessions for this course
      const { data: sessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          start_time,
          created_at,
          is_active
        `)
        .eq('course_id', course.id)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Get student's attendance for each session
      const studentId = studentInfo?.id;
      const sessionsWithAttendance = await Promise.all((sessions || []).map(async (session) => {
        // Check if student has an attendance record for this session
        const { data: record } = await supabase
          .from('attendance_records')
          .select('id, scanned_at')
          .eq('session_id', session.id)
          .eq('student_id', studentId)
          .maybeSingle();

        return {
          ...session,
          isPresent: !!record,
          scannedAt: record?.scanned_at
        };
      }));

      // Calculate trends
      const recentSessions = sessionsWithAttendance.slice(0, 5);
      const recentPresent = recentSessions.filter(s => s.isPresent).length;
      const recentRate = recentSessions.length > 0 ? Math.round((recentPresent / recentSessions.length) * 100) : 0;
      const overallRate = attendanceStats[course.id]?.attendanceRate || 0;
      const trend = recentRate > overallRate ? 'up' : recentRate < overallRate ? 'down' : 'stable';

      setCourseDetails({
        ...course,
        sessions: sessionsWithAttendance,
        recentRate,
        trend
      });
    } catch (error) {
      console.error('Error fetching course details:', error);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    fetchCourseDetails(course);
    setShowModal(true);
  };

  const getTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    if (diffMs <= 0) return 'Expired';
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 60 ? `${diffMins}m left` : `${Math.floor(diffMins / 60)}h left`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortedCourses = [...courses].sort((a, b) => {
    const aLive = activeSessions[a.id] ? 1 : 0;
    const bLive = activeSessions[b.id] ? 1 : 0;
    return bLive - aLive; 
  });

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="w-6 h-6 border-2 border-gray-100 border-t-gray-900 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <div className="divide-y divide-gray-50">
        {sortedCourses.map((course) => {
          const isLive = !!activeSessions[course.id];
          const stats = attendanceStats[course.id];

          return (
            <div 
              key={course.id} 
              onClick={() => handleCourseClick(course)}
              className="group flex items-center justify-between p-4 hover:bg-gray-50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isLive ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}>
                  {isLive ? <Activity size={20} className="animate-pulse" /> : <BookOpen size={20} />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                      {course.course_code}
                    </h4>
                    {isLive && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full tracking-widest uppercase">
                        <span className="w-1 h-1 bg-emerald-600 rounded-full animate-ping" />
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-400 line-clamp-1 max-w-[180px] sm:max-w-xs">
                    {course.course_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="hidden sm:flex flex-col items-end">
                  <span className={`text-xs font-black ${stats?.attendanceRate >= 75 ? 'text-gray-900' : 'text-orange-500'}`}>
                    {stats ? `${stats.attendanceRate}%` : '--'}
                  </span>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">
                    Attendance
                  </span>
                </div>

                <div className="flex items-center">
                  {isLive ? (
                    <div className="flex flex-col items-end bg-emerald-600 px-3 py-1 rounded-xl shadow-lg shadow-emerald-100">
                      <span className="text-[10px] font-black text-white whitespace-nowrap">
                        {getTimeRemaining(activeSessions[course.id].expires_at)}
                      </span>
                    </div>
                  ) : (
                    <ChevronRight size={18} className="text-gray-200 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Details Modal */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          
          <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-900">{selectedCourse.course_code}</h3>
                <p className="text-xs text-gray-500">{selectedCourse.course_title}</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {modalLoading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-gray-100 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
              </div>
            ) : courseDetails && (
              <div className="p-4 space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 p-3 rounded-xl text-center">
                    <p className="text-2xl font-black text-emerald-600">
                      {attendanceStats[selectedCourse.id]?.presentCount || 0}
                    </p>
                    <p className="text-[10px] font-bold text-emerald-400 uppercase">Present</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl text-center">
                    <p className="text-2xl font-black text-gray-400">
                      {attendanceStats[selectedCourse.id]?.absentCount || 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase">Absent</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl text-center">
                    <p className="text-2xl font-black text-gray-400">
                      {attendanceStats[selectedCourse.id]?.totalSessions || 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase">Total</p>
                  </div>
                </div>

                {/* Overall Attendance */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Overall Attendance</span>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-black text-gray-900">
                        {attendanceStats[selectedCourse.id]?.attendanceRate || 0}%
                      </span>
                      {courseDetails.trend === 'up' && <TrendingUp size={16} className="text-green-500" />}
                      {courseDetails.trend === 'down' && <TrendingDown size={16} className="text-red-500" />}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${attendanceStats[selectedCourse.id]?.attendanceRate || 0}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {attendanceStats[selectedCourse.id]?.presentCount} of {attendanceStats[selectedCourse.id]?.totalSessions} sessions attended
                  </p>
                </div>

                {/* Recent Trend */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Recent Performance</h4>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Last 5 sessions</p>
                      <p className="text-xl font-black text-gray-900">{courseDetails.recentRate}%</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      courseDetails.recentRate >= 75 ? 'bg-green-100 text-green-700' :
                      courseDetails.recentRate >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {courseDetails.recentRate >= 75 ? 'Good' :
                       courseDetails.recentRate >= 50 ? 'Average' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>

                {/* Session History */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Session History</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {courseDetails.sessions.map((session, index) => (
                      <div key={session.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${session.isPresent ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-xs text-gray-600">
                            {formatDate(session.start_time)}
                          </span>
                        </div>
                        <span className={`text-xs font-medium ${session.isPresent ? 'text-green-600' : 'text-red-600'}`}>
                          {session.isPresent ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default EnrolledCourses;