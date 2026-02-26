import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useHOCData = (userId) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hocInfo, setHocInfo] = useState(null);
  const [liveActivity, setLiveActivity] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalSessions: 0,
    activeSessions: 0,
    averageAttendance: 0,
    department: '',
    level: ''
  });

  const fetchHOCData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('👤 Fetching HOC student info for user:', userId);

      // FIRST: Get HOC's student information (department and level)
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, department, level, matric_no, full_name')
        .eq('user_id', userId)
        .single();

      if (studentError) throw studentError;
      
      if (!student) {
        throw new Error('Student profile not found');
      }

      console.log('📚 HOC Student info:', student);
      setHocInfo(student);

      // SECOND: Get ALL courses for this HOC's department and level
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select(`
          id,
          course_code,
          course_title,
          department,
          level,
          semester,
          created_at
        `)
        .eq('department', student.department)
        .eq('level', student.level)
        .order('course_code');

      if (coursesError) throw coursesError;

      console.log(`📋 Found ${coursesData?.length || 0} courses for ${student.department} Level ${student.level}`);
      setCourses(coursesData || []);

      // THIRD: Get ALL students in this department and level (rule-based enrollment)
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, matric_no, full_name')
        .eq('department', student.department)
        .eq('level', student.level);

      if (studentsError) throw studentsError;

      const totalStudents = allStudents?.length || 0;
      console.log(`👥 Found ${totalStudents} students in ${student.department} Level ${student.level}`);

      // FOURTH: Get all sessions for these courses with attendance records
      const courseIds = coursesData?.map(c => c.id) || [];
      
      let activeSessionsCount = 0;
      let totalSessionsCount = 0;
      let totalAttendance = 0;
      let recentActivity = [];

      if (courseIds.length > 0) {
        // Get all sessions for these courses
        const { data: sessions, error: sessionsError } = await supabase
          .from('attendance_sessions')
          .select(`
            id,
            is_active,
            expires_at,
            course_id,
            created_at,
            start_time,
            attendance_records (
              id,
              student_id,
              scanned_at,
              marked_manually,
              manual_reason,
              students (
                id,
                matric_no,
                full_name
              )
            )
          `)
          .in('course_id', courseIds)
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        totalSessionsCount = sessions?.length || 0;
        
        // Count active sessions (not expired)
        const now = new Date().toISOString();
        activeSessionsCount = sessions?.filter(s => 
          s.is_active && s.expires_at > now
        ).length || 0;

        // Count total attendance and collect recent activity
        sessions?.forEach(session => {
          const sessionAttendance = session.attendance_records?.length || 0;
          totalAttendance += sessionAttendance;
          
          // Find course code for this session
          const course = coursesData.find(c => c.id === session.course_id);
          
          // Collect recent activity (last 10)
          session.attendance_records?.forEach(record => {
            if (recentActivity.length < 10) {
              recentActivity.push({
                id: record.id,
                studentName: record.students?.full_name || 'Unknown',
                matricNo: record.students?.matric_no || 'N/A',
                courseCode: course?.course_code || 'Unknown',
                time: new Date(record.scanned_at).toLocaleTimeString(),
                isManual: record.marked_manually || false
              });
            }
          });
        });
      }

      // Calculate average attendance based on rule-based enrollment
      // Total possible attendance = totalStudents * totalSessionsCount
      const totalPossibleAttendance = totalStudents * totalSessionsCount;
      const avgAttendance = totalPossibleAttendance > 0
        ? Math.round((totalAttendance / totalPossibleAttendance) * 100)
        : 0;

      console.log('📊 HOC Stats:', {
        courses: coursesData?.length,
        students: totalStudents,
        sessions: totalSessionsCount,
        active: activeSessionsCount,
        attendance: totalAttendance,
        possible: totalPossibleAttendance,
        avgPercentage: avgAttendance
      });

      setLiveActivity(recentActivity);

      setStats({
        totalCourses: coursesData?.length || 0,
        totalStudents: totalStudents,
        totalSessions: totalSessionsCount,
        activeSessions: activeSessionsCount,
        averageAttendance: avgAttendance,
        department: student.department,
        level: student.level,
        totalAttendance: totalAttendance
      });

    } catch (error) {
      console.error('❌ Error in useHOCData:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Get all students in HOC's department and level (rule-based)
  const getDepartmentStudents = useCallback(async () => {
    if (!hocInfo) return [];

    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          matric_no,
          full_name,
          level,
          department,
          email,
          user_id
        `)
        .eq('department', hocInfo.department)
        .eq('level', hocInfo.level);

      if (error) throw error;
      
      // For each student, calculate their attendance for these courses
      const courseIds = courses.map(c => c.id);
      
      const studentsWithAttendance = await Promise.all(data.map(async (student) => {
        // Get all sessions for these courses
        const { data: sessions } = await supabase
          .from('attendance_sessions')
          .select('id')
          .in('course_id', courseIds);

        const totalSessions = sessions?.length || 0;

        // Get student's attendance records
        const { count: presentCount } = await supase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', student.id)
          .in('session_id', sessions?.map(s => s.id) || []);

        const attendanceRate = totalSessions > 0 
          ? Math.round((presentCount / totalSessions) * 100) 
          : 0;

        return {
          ...student,
          totalSessions,
          presentCount: presentCount || 0,
          attendanceRate
        };
      }));

      return studentsWithAttendance || [];

    } catch (error) {
      console.error('Error fetching department students:', error);
      return [];
    }
  }, [hocInfo, courses]);

  // Get attendance for a specific course
  const getCourseAttendance = useCallback(async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          start_time,
          expires_at,
          is_active,
          attendance_records (
            id,
            student_id,
            scanned_at,
            marked_manually,
            manual_reason,
            students (
              matric_no,
              full_name
            )
          )
        `)
        .eq('course_id', courseId)
        .order('start_time', { ascending: false });

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching course attendance:', error);
      return [];
    }
  }, []);

  // Get students for a specific course (rule-based)
  const getCourseStudents = useCallback(async (courseId) => {
    try {
      // Get the course details first
      const { data: course } = await supabase
        .from('courses')
        .select('department, level')
        .eq('id', courseId)
        .single();

      if (!course) return [];

      // Get all students in that department and level (rule-based enrollment)
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          matric_no,
          full_name,
          level,
          department,
          email
        `)
        .eq('department', course.department)
        .eq('level', course.level);

      if (error) throw error;
      return data || [];

    } catch (error) {
      console.error('Error fetching course students:', error);
      return [];
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchHOCData();
    } else {
      setLoading(false);
    }
  }, [userId, fetchHOCData]);

  // Group courses by department and level
  const getGroupedCourses = useCallback(() => {
    const grouped = {};
    courses.forEach(course => {
      const key = `${course.department} - Level ${course.level}`;
      if (!grouped[key]) {
        grouped[key] = {
          department: course.department,
          level: course.level,
          courses: []
        };
      }
      grouped[key].courses.push(course);
    });
    return grouped;
  }, [courses]);

  return {
    courses,
    groupedCourses: getGroupedCourses(),
    hocInfo,
    loading,
    error,
    stats,
    liveActivity,
    refetch: fetchHOCData,
    getDepartmentStudents,
    getCourseAttendance,
    getCourseStudents
  };
};