import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { 
  BookOpen, Clock, ChevronRight, Activity, X, 
  Calendar, AlertCircle, TrendingUp, TrendingDown, Users
} from 'lucide-react';

// Query keys
const queryKeys = {
  student: (userId) => ['student', userId],
  courses: (studentId, department, level) => ['courses', studentId, department, level],
  activeSessions: (courseIds) => ['activeSessions', courseIds],
  attendanceStats: (studentId, courseIds) => ['attendanceStats', studentId, courseIds],
  courseDetails: (courseId, studentId) => ['courseDetails', courseId, studentId],
};

const EnrolledCourses = ({ userId }) => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch student info
  const { data: studentInfo, isLoading: studentLoading } = useQuery({
    queryKey: queryKeys.student(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, department, level, full_name, matric_no')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch courses
  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: queryKeys.courses(userId, studentInfo?.department, studentInfo?.level),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, course_code, course_title, department, level, semester')
        .eq('department', studentInfo.department)
        .eq('level', studentInfo.level)
        .order('course_code');

      if (error) throw error;
      return data || [];
    },
    enabled: !!studentInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch active sessions
  const { data: activeSessions = {} } = useQuery({
    queryKey: queryKeys.activeSessions(courses.map(c => c.id)),
    queryFn: async () => {
      const sessions = {};
      for (const course of courses) {
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
      return sessions;
    },
    enabled: courses.length > 0,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 0,
  });

  // Fetch attendance stats
  const { data: attendanceStats = {} } = useQuery({
    queryKey: queryKeys.attendanceStats(studentInfo?.id, courses.map(c => c.id)),
    queryFn: async () => {
      const stats = {};
      
      for (const course of courses) {
        // Get all sessions for this course
        const { data: sessions } = await supabase
          .from('attendance_sessions')
          .select('id')
          .eq('course_id', course.id);

        const totalSessions = sessions?.length || 0;
        const sessionIds = sessions?.map(s => s.id) || [];

        // Get student's attendance records
        let presentCount = 0;
        if (sessionIds.length > 0) {
          const { data: attendance } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('student_id', studentInfo.id)
            .in('session_id', sessionIds);

          presentCount = attendance?.length || 0;
        }
        
        const absentCount = totalSessions - presentCount;
        const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;
        
        stats[course.id] = {
          totalSessions,
          presentCount,
          absentCount,
          attendanceRate
        };
      }
      
      return stats;
    },
    enabled: !!studentInfo && courses.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Fetch course details for modal
  const { data: courseDetails, isLoading: modalLoading } = useQuery({
    queryKey: queryKeys.courseDetails(selectedCourse?.id, studentInfo?.id),
    queryFn: async () => {
      if (!selectedCourse || !studentInfo) return null;

      // Get all sessions for this course
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          start_time,
          created_at,
          is_active
        `)
        .eq('course_id', selectedCourse.id)
        .order('created_at', { ascending: false });

      // Get student's attendance for each session
      const sessionsWithAttendance = await Promise.all((sessions || []).map(async (session) => {
        const { data: record } = await supabase
          .from('attendance_records')
          .select('id, scanned_at')
          .eq('session_id', session.id)
          .eq('student_id', studentInfo.id)
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
      const overallRate = attendanceStats[selectedCourse.id]?.attendanceRate || 0;
      const trend = recentRate > overallRate ? 'up' : recentRate < overallRate ? 'down' : 'stable';

      return {
        ...selectedCourse,
        sessions: sessionsWithAttendance,
        recentRate,
        trend
      };
    },
    enabled: !!selectedCourse && !!studentInfo,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleCourseClick = (course) => {
    setSelectedCourse(course);
    setShowModal(true);
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return '';
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry - now;
    if (diffMs <= 0) return 'Expired';
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins < 60 ? `${diffMins}m` : `${Math.floor(diffMins / 60)}h`;
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

  if (studentLoading || coursesLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <BookOpen size={32} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No courses found</p>
      </div>
    );
  }

  const sortedCourses = [...courses].sort((a, b) => {
    const aLive = activeSessions[a.id] ? 1 : 0;
    const bLive = activeSessions[b.id] ? 1 : 0;
    return bLive - aLive; 
  });

  return (
    <>
      <div className="divide-y divide-gray-100">
        {sortedCourses.map((course) => {
          const isLive = !!activeSessions[course.id];
          const stats = attendanceStats[course.id];

          return (
            <div 
              key={course.id} 
              onClick={() => handleCourseClick(course)}
              className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isLive ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'
                }`}>
                  {isLive ? <Activity size={16} /> : <BookOpen size={16} />}
                </div>

                {/* Course Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {course.course_code}
                    </span>
                    {isLive && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded-full whitespace-nowrap">
                        Live
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 truncate max-w-[150px] sm:max-w-xs">
                    {course.course_title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Attendance Rate */}
                {stats && (
                  <span className={`text-xs font-medium ${
                    stats.attendanceRate >= 75 ? 'text-green-600' : 
                    stats.attendanceRate > 0 ? 'text-orange-500' : 
                    'text-gray-300'
                  }`}>
                    {stats.attendanceRate}%
                  </span>
                )}

                {/* Live Timer or Arrow */}
                {isLive ? (
                  <span className="text-xs text-green-600 whitespace-nowrap">
                    {getTimeRemaining(activeSessions[course.id]?.expires_at)}
                  </span>
                ) : (
                  <ChevronRight size={16} className="text-gray-300" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Course Details Modal */}
      {showModal && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 p-4 flex justify-between items-center">
              <div>
                <h3 className="font-medium text-gray-900">{selectedCourse.course_code}</h3>
                <p className="text-xs text-gray-400">{selectedCourse.course_title}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {modalLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                </div>
              ) : courseDetails && (
                <>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-2 rounded-lg text-center">
                      <p className="text-lg font-semibold text-green-600">
                        {attendanceStats[selectedCourse.id]?.presentCount || 0}
                      </p>
                      <p className="text-[10px] text-green-500">Present</p>
                    </div>
                    <div className="bg-red-50 p-2 rounded-lg text-center">
                      <p className="text-lg font-semibold text-red-600">
                        {attendanceStats[selectedCourse.id]?.absentCount || 0}
                      </p>
                      <p className="text-[10px] text-red-500">Absent</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-lg text-center">
                      <p className="text-lg font-semibold text-gray-600">
                        {attendanceStats[selectedCourse.id]?.totalSessions || 0}
                      </p>
                      <p className="text-[10px] text-gray-400">Total</p>
                    </div>
                  </div>

                  {/* Attendance Progress */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Attendance</span>
                      <span className="text-sm font-medium text-gray-900">
                        {attendanceStats[selectedCourse.id]?.attendanceRate || 0}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-900 rounded-full"
                        style={{ width: `${attendanceStats[selectedCourse.id]?.attendanceRate || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Recent Trend */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Last 5 sessions</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {courseDetails.recentRate}%
                        </span>
                        {courseDetails.trend === 'up' && <TrendingUp size={14} className="text-green-500" />}
                        {courseDetails.trend === 'down' && <TrendingDown size={14} className="text-red-500" />}
                      </div>
                    </div>
                  </div>

                  {/* Session History */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">Session History</p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {courseDetails.sessions.map((session) => (
                        <div key={session.id} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${session.isPresent ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-xs text-gray-600">
                              {formatDate(session.start_time)}
                            </span>
                          </div>
                          <span className={`text-xs ${session.isPresent ? 'text-green-600' : 'text-red-600'}`}>
                            {session.isPresent ? 'Present' : 'Absent'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EnrolledCourses;