import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, queryKeys } from '../lib/api';
import { supabase } from '../lib/supabase';

export const useHOCData = (userId) => {
  const queryClient = useQueryClient();

  // Fetch HOC data
  const hocQuery = useQuery({
    queryKey: queryKeys.hocData(userId),
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      console.log('👤 Fetching HOC student info for user:', userId);

      // Get HOC's student information
      const student = await api.fetchHOCStudentInfo(userId);
      
      console.log('📚 HOC Student info:', student);

      // Get ALL courses for this HOC's department and level
      const coursesData = await api.fetchCoursesByDepartment(student.department, student.level);

      console.log(`📋 Found ${coursesData?.length || 0} courses for ${student.department} Level ${student.level}`);

      // Get ALL students in this department and level
      const allStudents = await api.fetchStudentsByDepartmentLevel(student.department, student.level);
      const totalStudents = allStudents?.length || 0;
      
      console.log(`👥 Found ${totalStudents} students in ${student.department} Level ${student.level}`);

      // Get all sessions for these courses with attendance records
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

      // Calculate average attendance
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

      return {
        hocInfo: student,
        courses: coursesData || [],
        allStudents,
        stats: {
          totalCourses: coursesData?.length || 0,
          totalStudents,
          totalSessions: totalSessionsCount,
          activeSessions: activeSessionsCount,
          averageAttendance: avgAttendance,
          department: student.department,
          level: student.level,
          totalAttendance
        },
        liveActivity: recentActivity
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });

  // Get all students in HOC's department and level with attendance
  const departmentStudentsQuery = useQuery({
    queryKey: [...queryKeys.hocData(userId), 'departmentStudents'],
    queryFn: async () => {
      const hocInfo = hocQuery.data?.hocInfo;
      const courses = hocQuery.data?.courses || [];
      
      if (!hocInfo || courses.length === 0) return [];

      const { data: students, error } = await supabase
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
      
      // Get all sessions for these courses
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id')
        .in('course_id', courseIds);

      const totalSessions = sessions?.length || 0;
      const sessionIds = sessions?.map(s => s.id) || [];

      const studentsWithAttendance = await Promise.all((students || []).map(async (student) => {
        // Get student's attendance records
        const { count: presentCount } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', student.id)
          .in('session_id', sessionIds);

        const attendanceRate = totalSessions > 0 
          ? Math.round(((presentCount || 0) / totalSessions) * 100) 
          : 0;

        return {
          ...student,
          totalSessions,
          presentCount: presentCount || 0,
          attendanceRate
        };
      }));

      return studentsWithAttendance || [];

    },
    enabled: !!hocQuery.data?.hocInfo && hocQuery.data?.courses.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Get attendance for a specific course
  const useCourseAttendance = (courseId) => {
    return useQuery({
      queryKey: queryKeys.attendance(courseId),
      queryFn: async () => {
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
      },
      enabled: !!courseId,
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get students for a specific course (rule-based)
  const useCourseStudents = (courseId) => {
    return useQuery({
      queryKey: [...queryKeys.students(courseId)],
      queryFn: async () => {
        // Get the course details first
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('department, level')
          .eq('id', courseId)
          .single();

        if (courseError) throw courseError;
        if (!course) return [];

        // Get all students in that department and level
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
      },
      enabled: !!courseId,
      staleTime: 5 * 60 * 1000,
    });
  };

  // Group courses by department and level
  const getGroupedCourses = (courses) => {
    const grouped = {};
    (courses || []).forEach(course => {
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
  };

  return {
    // Data
    courses: hocQuery.data?.courses || [],
    groupedCourses: getGroupedCourses(hocQuery.data?.courses),
    hocInfo: hocQuery.data?.hocInfo,
    stats: hocQuery.data?.stats || {
      totalCourses: 0,
      totalStudents: 0,
      totalSessions: 0,
      activeSessions: 0,
      averageAttendance: 0,
      department: '',
      level: '',
      totalAttendance: 0
    },
    liveActivity: hocQuery.data?.liveActivity || [],
    departmentStudents: departmentStudentsQuery.data || [],
    
    // Loading states
    loading: hocQuery.isLoading || departmentStudentsQuery.isLoading,
    isFetching: hocQuery.isFetching || departmentStudentsQuery.isFetching,
    
    // Errors
    error: hocQuery.error || departmentStudentsQuery.error,
    
    // Query status
    isSuccess: hocQuery.isSuccess,
    isError: hocQuery.isError,
    
    // Actions
    refetch: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.hocData(userId) });
    },
    
    // Helper hooks
    useCourseAttendance,
    useCourseStudents,
    
    // Manual refetch for department students
    refetchDepartmentStudents: () => {
      queryClient.invalidateQueries({ 
        queryKey: [...queryKeys.hocData(userId), 'departmentStudents'] 
      });
    }
  };
};