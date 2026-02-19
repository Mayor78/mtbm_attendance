import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';


export const useStudentAttendance = (userId) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalClasses: 0,
    attended: 0,
    percentage: 0
  });

  useEffect(() => {
    if (userId) {
      console.log('🟢 useStudentAttendance hook triggered for user:', userId);
      fetchStudentAttendance();
    }
  }, [userId]);

  const fetchStudentAttendance = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Fetching student attendance for user:', userId);

      // Get student ID
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (studentError) throw studentError;
      
      console.log('✅ Student found:', student);

      // Get attendance records
      const { data: recordsData, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('student_id', student.id);

      if (error) throw error;

      console.log('📊 Attendance records:', recordsData);

      // Get session details for each record
      const enrichedRecords = await Promise.all(
        (recordsData || []).map(async (record) => {
          const { data: session } = await supabase
            .from('attendance_sessions')
            .select('*, courses(*)')
            .eq('id', record.session_id)
            .single();
          
          return {
            id: record.id,
            scanned_at: record.scanned_at,
            created_at: record.created_at,
            attendance_sessions: session
          };
        })
      );

      console.log('✅ Enriched records:', enrichedRecords);
      setRecords(enrichedRecords);

      // Calculate stats
      const totalSessions = await getTotalSessions(student.id);
      const attended = enrichedRecords.length;
      const percentage = totalSessions > 0 
        ? Math.round((attended / totalSessions) * 100 * 10) / 10 
        : 0;

      setStats({
        totalClasses: totalSessions,
        attended: attended,
        percentage: percentage
      });

    } catch (error) {
      console.error('❌ Error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTotalSessions = async (studentId) => {
    try {
      // Get student's enrolled courses
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollError) throw enrollError;
      
      if (!enrollments || enrollments.length === 0) return 0;

      const courseIds = enrollments.map(e => e.course_id);

      // Get total sessions for these courses (past sessions only)
      const { count, error: countError } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .lt('expires_at', new Date().toISOString()); // Only count expired sessions

      if (countError) throw countError;
      
      return count || 0;
    } catch (error) {
      console.error('Error in getTotalSessions:', error);
      return 0;
    }
  };

  return { records, loading, error, stats, refetch: fetchStudentAttendance };
};


export const useHOCAttendance = (userId) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchHOCAttendance();
    }
  }, [userId]);

  const fetchHOCAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching HOC attendance for user:', userId);

      // Get student ID
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (studentError) throw studentError;

      console.log('✅ Student found:', student);

      // Get courses where user is HOC
      const { data: repCourses, error: repError } = await supabase
        .from('course_representatives')
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

      if (repError) throw repError;

      const coursesList = repCourses.map(item => item.courses).filter(Boolean);
      console.log('📚 Courses where user is HOC:', coursesList);

      if (coursesList.length === 0) {
        setCourses([]);
        return;
      }

      // For each course, get attendance stats
      const coursesWithStats = await Promise.all(
        coursesList.map(async (course) => {
          console.log(`📊 Processing course: ${course.course_code}`);

          // Get all sessions for this course
          const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('id, created_at, expires_at, is_active')
            .eq('course_id', course.id)
            .order('created_at', { ascending: false });

          if (sessionsError) throw sessionsError;

          console.log(`  Found ${sessions?.length || 0} sessions`);

          const sessionIds = sessions?.map(s => s.id) || [];

          // Get attendance records for these sessions with student details
          let records = [];
          if (sessionIds.length > 0) {
            const { data: recordsData, error: recordsError } = await supabase
              .from('attendance_records')
              .select(`
                id,
                scanned_at,
                session_id,
                student_id,
                students (
                  id,
                  matric_no,
                  user_id,
                  profiles (
                    full_name
                  )
                )
              `)
              .in('session_id', sessionIds)
              .order('scanned_at', { ascending: false });

            if (recordsError) throw recordsError;
            records = recordsData || [];
          }

          console.log(`  Found ${records.length} attendance records`);

          // Get total enrolled students
          const { count: totalStudents, error: countError } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          if (countError) throw countError;

          // Calculate unique students who have attended
          const uniqueStudentIds = new Set(records.map(r => r.student_id));
          
          // Calculate attendance by session for today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todaySessions = sessions?.filter(s => 
            new Date(s.created_at) >= today
          ) || [];
          
          const todaySessionIds = todaySessions.map(s => s.id);
          
          const todayAttendance = records.filter(r => 
            todaySessionIds.includes(r.session_id)
          ).length;

          // Calculate overall attendance percentage
          const totalPossibleAttendances = (sessions?.length || 0) * (totalStudents || 1);
          const overallPercentage = totalPossibleAttendances > 0 
            ? Math.round((records.length / totalPossibleAttendances) * 100) 
            : 0;

          return {
            ...course,
            totalSessions: sessions?.length || 0,
            totalStudents: totalStudents || 0,
            attendanceRecords: records,
            uniqueStudents: uniqueStudentIds.size,
            todayAttendance,
            overallPercentage,
            sessions: sessions || []
          };
        })
      );

      console.log('✅ Final courses with stats:', coursesWithStats);
      setCourses(coursesWithStats);
    } catch (error) {
      console.error('❌ Error fetching HOC attendance:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { courses, loading, error, refetch: fetchHOCAttendance };
};

export const useCourseAttendance = (courseId) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (courseId) {
      fetchCourseAttendance();
    }
  }, [courseId]);

  const fetchCourseAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      // Get all sessions for this course
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessionsData || sessionsData.length === 0) {
        setSessions([]);
        return;
      }

      const sessionIds = sessionsData.map(s => s.id);
      
      // Get attendance records from the view
      const { data: recordsData, error: recordsError } = await supabase
        .from('attendance_with_students')
        .select('*')
        .in('session_id', sessionIds);

      if (recordsError) throw recordsError;

      console.log('Raw view data:', recordsData); // Check the structure

      // Group records by session with correct data structure
      const recordsBySession = {};
      recordsData?.forEach(record => {
        if (!recordsBySession[record.session_id]) {
          recordsBySession[record.session_id] = [];
        }
        
        // The view gives us full_name directly at the top level
        recordsBySession[record.session_id].push({
          id: record.record_id,
          scanned_at: record.scanned_at,
          session_id: record.session_id,
          student_id: record.student_id,
          student_name: record.full_name, // Direct access to full_name
          matric_no: record.matric_no
        });
      });

      // Combine sessions with their records
      const sessionsWithRecords = sessionsData.map(session => ({
        ...session,
        attendanceRecords: recordsBySession[session.id] || []
      }));

      setSessions(sessionsWithRecords);
    } catch (error) {
      console.error('Error fetching course attendance:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { sessions, loading, error, refetch: fetchCourseAttendance };
};

