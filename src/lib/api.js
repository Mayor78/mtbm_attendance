import { supabase } from './supabase';

// Query keys for TanStack Query
export const queryKeys = {
  course: (id) => ['course', id],
  courses: () => ['courses'],
  sessions: (courseId) => ['sessions', courseId],
  session: (id) => ['session', id],
  students: (courseId) => ['students', courseId],
  student: (id) => ['student', id],
  attendance: (sessionId) => ['attendance', sessionId],
  profiles: () => ['profiles'],
  profile: (id) => ['profile', id],
  geocode: (lat, lng) => ['geocode', lat, lng],
  lecturerData: (lecturerId) => ['lecturer', lecturerId],
  hocData: (userId) => ['hoc', userId],
  studentData: (userId) => ['student', userId],
  currentLocation: () => ['currentLocation'],
};

// API functions
export const api = {
  // ===== COURSE RELATED =====
  fetchCourseInfo: async (courseId) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (error) throw error;
    return data;
  },

  fetchCoursesByDepartment: async (department, level) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('department', department)
      .eq('level', level)
      .order('course_code');
    if (error) throw error;
    return data || [];
  },

  createCourse: async (courseData) => {
    const { data, error } = await supabase
      .from('courses')
      .insert(courseData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  updateCourse: async (courseId, courseData) => {
    const { error } = await supabase
      .from('courses')
      .update(courseData)
      .eq('id', courseId);
    if (error) throw error;
    return true;
  },

  deleteCourse: async (courseId) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    if (error) throw error;
    return true;
  },

  // ===== SESSION RELATED =====
  fetchSessionsWithAttendance: async (courseId) => {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select(`
        *,
        attendance_records (
          *,
          students (
            matric_no,
            profiles (
              full_name
            )
          )
        )
      `)
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  fetchActiveSessions: async (courseIds) => {
    if (!courseIds || courseIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('course_id', courseIds)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());
    
    if (error) throw error;
    return data || [];
  },

  fetchActiveSessionsWithRecords: async (courseIds) => {
    if (!courseIds || courseIds.length === 0) return {};
    
    const sessions = {};
    for (const courseId of courseIds) {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          attendance_records (
            id,
            student_id,
            scanned_at
          )
        `)
        .eq('course_id', courseId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (!error && data) {
        sessions[courseId] = data;
      }
    }
    return sessions;
  },

  createSession: async (sessionData) => {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert(sessionData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  endSession: async (sessionId) => {
    const { error } = await supabase
      .from('attendance_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);
    if (error) throw error;
    return true;
  },

  // ===== ATTENDANCE RECORDS =====
  markAttendance: async (attendanceData) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendanceData)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  markBulkAttendance: async (attendanceRecords) => {
    const { data, error } = await supabase
      .from('attendance_records')
      .insert(attendanceRecords)
      .select();
    if (error) throw error;
    return data;
  },

  deleteAttendanceRecord: async (recordId) => {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId);
    if (error) throw error;
    return true;
  },

  markAsSuspicious: async (recordId) => {
    const { error } = await supabase
      .from('attendance_records')
      .update({ is_suspicious: true })
      .eq('id', recordId);
    if (error) throw error;
    return true;
  },

  // ===== STUDENT RELATED =====
  fetchStudentByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  fetchStudentsByDepartmentLevel: async (department, level) => {
    const { data, error } = await supabase
      .from('students')
      .select(`
        id,
        matric_no,
        full_name,
        level,
        department,
        profiles (
          full_name,
          email
        )
      `)
      .eq('department', department)
      .eq('level', level);
    
    if (error) throw error;
    return data || [];
  },

  fetchStudentAttendance: async (studentId, courseIds) => {
    if (!courseIds || courseIds.length === 0) return [];
    
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('id')
      .in('course_id', courseIds);

    if (!sessions || sessions.length === 0) return [];

    const sessionIds = sessions.map(s => s.id);
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('student_id', studentId)
      .in('session_id', sessionIds);
    
    if (error) throw error;
    return data || [];
  },

  // ===== LECTURER RELATED =====
  fetchLecturerByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('lecturers')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  fetchLecturerCourses: async (lecturerId) => {
    const { data, error } = await supabase
      .from('course_lecturers')
      .select(`
        id,
        is_coordinator,
        academic_year,
        semester,
        course_id,
        courses!inner (
          id,
          course_code,
          course_title,
          department,
          level,
          created_at
        )
      `)
      .eq('lecturer_id', lecturerId);
    
    if (error) throw error;
    return data || [];
  },

  // ===== HOC RELATED =====
  fetchHOCStudentInfo: async (userId) => {
    const { data, error } = await supabase
      .from('students')
      .select('id, department, level, matric_no, full_name')
      .eq('user_id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  fetchHOCRepresentedCourses: async (studentId) => {
    const { data, error } = await supabase
      .from('course_representatives')
      .select(`
        course_id,
        courses (
          id,
          course_code,
          course_title,
          department,
          level,
          semester,
          created_at
        )
      `)
      .eq('student_id', studentId);
    
    if (error) throw error;
    return data || [];
  },

  fetchCoursesWithStats: async (courseIds) => {
    if (!courseIds || courseIds.length === 0) return [];
    
    const coursesWithStats = await Promise.all(
      courseIds.map(async (courseId) => {
        // Get course details
        const { data: course } = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();

        if (!course) return null;

        // Get sessions
        const { data: sessions } = await supabase
          .from('attendance_sessions')
          .select('id')
          .eq('course_id', courseId);

        // Get total students
        const { count: totalStudents } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('department', course.department)
          .eq('level', course.level);

        // Get attendance records
        let attendanceRecords = [];
        if (sessions && sessions.length > 0) {
          const { data: records } = await supabase
            .from('attendance_records')
            .select('id, student_id, scanned_at, session_id')
            .in('session_id', sessions.map(s => s.id));
          attendanceRecords = records || [];
        }

        const uniqueStudents = new Set(attendanceRecords.map(r => r.student_id));

        return {
          ...course,
          totalStudents: totalStudents || 0,
          attendanceRecords,
          uniqueStudents: uniqueStudents.size,
          overallPercentage: sessions?.length > 0 && totalStudents > 0
            ? Math.round((attendanceRecords.length / (sessions.length * totalStudents)) * 100)
            : 0
        };
      })
    );

    return coursesWithStats.filter(Boolean);
  },

  addCourseRepresentative: async (studentId, courseId) => {
    const { error } = await supabase
      .from('course_representatives')
      .insert({ student_id: studentId, course_id: courseId });
    if (error) throw error;
    return true;
  },

  // ===== PROFILE RELATED =====
  fetchProfiles: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, email');
    
    if (error) throw error;
    
    // Convert to object for easy lookup
    return (data || []).reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {});
  },

  // ===== GEOCODING =====
  geocodeLocation: async ({ lat, lng }) => {
    try {
      // Try your Supabase function first
      const response = await fetch(
        `https://tywhkdmlhjiluslmxdjt.supabase.co/functions/v1/geocode?lat=${lat}&lng=${lng}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.warn('Supabase geocoding failed, trying fallback:', error);
    }

    // Fallback to OpenStreetMap
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'UniversityAttendanceSystem/1.0'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to fetch location');
      
      const data = await response.json();
      
      let address = '';
      if (data.address) {
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city || data.address.town || data.address.village) {
          parts.push(data.address.city || data.address.town || data.address.village);
        }
        if (data.address.state) parts.push(data.address.state);
        address = parts.join(', ');
      }
      
      return address || data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown location';
    } catch (error) {
      console.error('Geocoding error:', error);
      return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
    }
  },
};