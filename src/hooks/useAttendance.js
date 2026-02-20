import { useState, useEffect, useCallback, useRef } from 'react';
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
  
  const isMounted = useRef(true);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    if (userId) {
      console.log('🟢 useStudentAttendance hook triggered for user:', userId);
      fetchStudentAttendance();
    }
    
    return () => {
      isMounted.current = false;
    };
  }, [userId]);

  const fetchStudentAttendance = useCallback(async () => {
    if (isFetching.current || !userId) return;
    
    isFetching.current = true;
    
    try {
      setLoading(true);
      setError('');
      
      console.log('📡 Fetching student attendance for user:', userId);

      // Get student ID with department and level
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, department, level')
        .eq('user_id', userId)
        .single();

      if (studentError) throw studentError;
      
      console.log('✅ Student found:', student);

      // Get attendance records for this student
      const { data: recordsData, error } = await supabase
        .from('attendance_records')
        .select(`
          id,
          scanned_at,
          session_id,
          attendance_sessions (
            id,
            course_id,
            courses (
              course_code,
              course_title,
              department,
              level
            )
          )
        `)
        .eq('student_id', student.id);

      if (error) throw error;

      console.log('📊 Attendance records:', recordsData);

      // Filter records to only include courses matching student's department/level
      const validRecords = (recordsData || []).filter(record => {
        const course = record.attendance_sessions?.courses;
        return course && 
               course.department === student.department && 
               course.level === student.level;
      });

      console.log('✅ Valid records after filtering:', validRecords);
      setRecords(validRecords);

      // Calculate stats
      const totalSessions = await getTotalSessions(student.id, student.department, student.level);
      const attended = validRecords.length;
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
      if (isMounted.current) {
        setError(error.message);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isFetching.current = false;
    }
  }, [userId]);

  const getTotalSessions = async (studentId, department, level) => {
    try {
      // Get student's enrolled courses (filtered by department/level)
      const { data: enrollments, error: enrollError } = await supabase
        .from('course_enrollments')
        .select(`
          course_id,
          courses!inner (
            department,
            level
          )
        `)
        .eq('student_id', studentId)
        .eq('courses.department', department)
        .eq('courses.level', level);

      if (enrollError) throw enrollError;
      
      if (!enrollments || enrollments.length === 0) return 0;

      const courseIds = enrollments.map(e => e.course_id);

      // Get total sessions for these courses (past sessions only)
      const { count, error: countError } = await supabase
        .from('attendance_sessions')
        .select('*', { count: 'exact', head: true })
        .in('course_id', courseIds)
        .lt('expires_at', new Date().toISOString());

      if (countError) throw countError;
      
      return count || 0;
    } catch (error) {
      console.error('Error in getTotalSessions:', error);
      return 0;
    }
  };

  return { records, loading, error, stats, refetch: fetchStudentAttendance };
};


// Batch processor for real-time updates
const useBatchProcessor = (batchInterval = 100) => {
  const batchRef = useRef([]);
  const timeoutRef = useRef();

  const addToBatch = useCallback((item) => {
    batchRef.current.push(item);
    
    clearTimeout(timeoutRef.current);
    return new Promise(resolve => {
      timeoutRef.current = setTimeout(() => {
        const batch = [...batchRef.current];
        batchRef.current = [];
        resolve(batch);
      }, batchInterval);
    });
  }, [batchInterval]);

  return { addToBatch };
};

// Retry utility with exponential backoff
const executeWithRetry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err?.code === '53300' || err?.message?.includes('too many connections')) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
};

export const useHOCAttendance = (userId) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSessions, setActiveSessions] = useState({});
  const [liveActivity, setLiveActivity] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    activeSessions: 0
  });

  const { addToBatch } = useBatchProcessor(100);
  const mountedRef = useRef(true);
  const channelRef = useRef(null);
  const fetchAttemptedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    fetchAttemptedRef.current = false;
    
    return () => {
      mountedRef.current = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  // Fetch data when userId changes
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    if (!fetchAttemptedRef.current) {
      fetchAttemptedRef.current = true;
      fetchHOCAttendance();
    }
  }, [userId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!courses.length || !Object.keys(activeSessions).length) return;

    const activeSessionIds = Object.values(activeSessions).map(s => s.id);
    
    // Single channel for all updates
    channelRef.current = supabase
      .channel('attendance-all')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'attendance_records' 
        },
        async (payload) => {
          // Client-side filtering
          if (!activeSessionIds.includes(payload.new.session_id)) return;

          try {
            // Fetch student data with retry
            const studentData = await executeWithRetry(async () => {
              const { data, error } = await supabase
                .from('students')
                .select(`
                  id,
                  matric_no,
                  department,
                  level,
                  profiles (
                    full_name
                  )
                `)
                .eq('id', payload.new.student_id)
                .single();
              
              if (error) throw error;
              return data;
            });

            if (!mountedRef.current) return;

            // Find course
            const course = courses.find(c => 
              c.sessions?.some(s => s.id === payload.new.session_id)
            );

            if (!course) return;

            // Batch the update
            const batch = await addToBatch({
              record: payload.new,
              studentData,
              courseCode: course.course_code
            });

            if (!mountedRef.current) return;

            // Process batch updates
            setCourses(prev => {
              const newCourses = [...prev];
              
              batch.forEach(({ record, studentData }) => {
                const courseIndex = newCourses.findIndex(c => 
                  c.sessions?.some(s => s.id === record.session_id)
                );
                
                if (courseIndex !== -1) {
                  const uniqueStudents = new Set([
                    ...(newCourses[courseIndex].attendanceRecords?.map(r => r.student_id) || []),
                    record.student_id
                  ]);
                  
                  newCourses[courseIndex] = {
                    ...newCourses[courseIndex],
                    attendanceRecords: [
                      ...(newCourses[courseIndex].attendanceRecords || []),
                      {
                        id: record.id,
                        scanned_at: record.scanned_at,
                        session_id: record.session_id,
                        student_id: record.student_id,
                        students: studentData
                      }
                    ],
                    uniqueStudents: uniqueStudents.size
                  };
                }
              });
              
              return newCourses;
            });

            // Update live activity (limited to 30)
            setLiveActivity(prev => {
              const newActivities = batch.map(b => ({
                id: b.record.id,
                studentName: b.studentData?.profiles?.full_name || 'Unknown',
                matricNo: b.studentData?.matric_no || 'N/A',
                courseCode: b.courseCode,
                time: new Date().toLocaleTimeString(),
                timestamp: Date.now()
              }));
              
              return [...newActivities, ...prev].slice(0, 30);
            });

          } catch (err) {
            console.error('Error processing real-time update:', err);
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [courses, activeSessions, addToBatch]);

  const fetchHOCAttendance = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('🔍 Fetching HOC attendance for user:', userId);

      // Get student info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, department, level')
        .eq('user_id', userId)
        .single();

      if (studentError) {
        console.error('Student error:', studentError);
        throw studentError;
      }

      console.log('✅ Student found:', student);

      // Get HOC courses
      const { data: repCourses, error: repError } = await supabase
        .from('course_representatives')
        .select(`
          course_id,
          courses (
            id,
            course_code,
            course_title,
            department,
            semester,
            level
          )
        `)
        .eq('student_id', student.id);

      if (repError) {
        console.error('Rep error:', repError);
        throw repError;
      }

      console.log('📚 Raw courses:', repCourses);

      let coursesList = repCourses
        .map(item => item.courses)
        .filter(Boolean)
        .filter(course => course.department === student.department);

      console.log('📚 Filtered courses:', coursesList);

      if (!coursesList.length) {
        setCourses([]);
        setStats({
          totalStudents: 0,
          totalCourses: 0,
          activeSessions: 0
        });
        setLoading(false);
        return;
      }

      // Get active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .in('course_id', coursesList.map(c => c.id))
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (sessionsError) {
        console.error('Sessions error:', sessionsError);
      }

      const activeSessionsMap = {};
      sessionsData?.forEach(session => {
        activeSessionsMap[session.course_id] = session;
      });
      setActiveSessions(activeSessionsMap);

      // Get attendance stats for each course
      const coursesWithStats = await Promise.all(
        coursesList.map(async (course) => {
          console.log(`📊 Processing course: ${course.course_code}`);
          
          // Get sessions
          const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('id, created_at, expires_at, is_active')
            .eq('course_id', course.id)
            .order('created_at', { ascending: false });

          if (sessionsError) {
            console.error('Sessions error for course:', course.course_code, sessionsError);
          }

          // Get total students
          const { count: totalStudents, error: countError } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          if (countError) {
            console.error('Count error for course:', course.course_code, countError);
          }

          let records = [];
          if (sessions && sessions.length > 0) {
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
                  department,
                  level,
                  profiles (
                    full_name
                  )
                )
              `)
              .in('session_id', sessions.map(s => s.id))
              .order('scanned_at', { ascending: false })
              .limit(1000);

            if (recordsError) {
              console.error('Records error for course:', course.course_code, recordsError);
            } else {
              records = recordsData || [];
            }
          }

          // Filter records
          const validRecords = records.filter(r => 
            r.students?.department === student.department
          );

          const uniqueStudentIds = new Set(validRecords.map(r => r.student_id));

          // Calculate today's attendance
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const todaySessions = sessions?.filter(s => 
            new Date(s.created_at) >= today
          ) || [];
          
          const todaySessionIds = todaySessions.map(s => s.id);
          const todayAttendance = validRecords.filter(r => 
            todaySessionIds.includes(r.session_id)
          ).length;

          const totalPossible = (sessions?.length || 0) * (totalStudents || 1);
          const overallPercentage = totalPossible > 0 
            ? Math.round((validRecords.length / totalPossible) * 100) 
            : 0;

          return {
            ...course,
            totalSessions: sessions?.length || 0,
            totalStudents: totalStudents || 0,
            attendanceRecords: validRecords,
            uniqueStudents: uniqueStudentIds.size,
            todayAttendance,
            overallPercentage,
            sessions: sessions || []
          };
        })
      );

      console.log('✅ Courses with stats:', coursesWithStats);

      if (mountedRef.current) {
        setCourses(coursesWithStats);
        setStats({
          totalStudents: coursesWithStats.reduce((acc, c) => acc + c.uniqueStudents, 0),
          totalCourses: coursesWithStats.length,
          activeSessions: Object.keys(activeSessionsMap).length
        });
        setLoading(false);
      }

    } catch (err) {
      console.error('❌ Error fetching HOC attendance:', err);
      if (mountedRef.current) {
        setError(err.message);
        setLoading(false);
      }
    }
  }, [userId]);

  const refetch = useCallback(() => {
    fetchAttemptedRef.current = false;
    fetchHOCAttendance();
  }, [fetchHOCAttendance]);

  return { 
    courses, 
    loading, 
    error, 
    activeSessions,
    liveActivity,
    stats,
    refetch 
  };
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
      
      // Get attendance records from the view (now includes location fields)
      const { data: recordsData, error: recordsError } = await supabase
        .from('attendance_with_students')
        .select('*')
        .in('session_id', sessionIds);

      if (recordsError) throw recordsError;

      console.log('Raw view data with location:', recordsData);

      // Group records by session with ALL data including location
      const recordsBySession = {};
      recordsData?.forEach(record => {
        if (!recordsBySession[record.session_id]) {
          recordsBySession[record.session_id] = [];
        }
        
        recordsBySession[record.session_id].push({
          id: record.record_id,
          scanned_at: record.scanned_at,
          session_id: record.session_id,
          student_id: record.student_id,
          student_name: record.full_name,
          matric_no: record.matric_no,
          location_lat: record.location_lat,
          location_lng: record.location_lng,
          location_accuracy: record.location_accuracy,
          device_info: record.device_info
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

