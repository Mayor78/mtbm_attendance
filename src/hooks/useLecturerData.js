import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export const useLecturerData = (lecturerId) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    departments: [],
    levels: [],
    avgAttendance: 0,
    activeSessions: 0,
    pendingApprovals: 0,
    atRiskStudents: 0
  });

  const fetchLecturerData = useCallback(async () => {
    if (!lecturerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      console.log('📚 Fetching courses for lecturer:', lecturerId);

      // FIRST: Get ONLY courses assigned to this lecturer
      const { data: assignments, error: assignError } = await supabase
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

      if (assignError) throw assignError;

      console.log('📦 Lecturer assignments:', assignments);

      if (!assignments || assignments.length === 0) {
        setCourses([]);
        setStats({
          totalCourses: 0,
          totalStudents: 0,
          departments: [],
          levels: [],
          avgAttendance: 0,
          activeSessions: 0,
          pendingApprovals: 0,
          atRiskStudents: 0
        });
        setLoading(false);
        return;
      }

      // Extract course list from assignments
      const courseList = assignments.map(a => ({
        ...a.courses,
        assignment_id: a.id,
        is_coordinator: a.is_coordinator || false,
        academic_year: a.academic_year,
        semester: a.semester
      }));

      console.log('📋 Lecturer courses:', courseList.map(c => c.course_code));
      setCourses(courseList);

      // Get unique departments and levels from assigned courses
      const departmentsSet = new Set();
      const levelsSet = new Set();
      courseList.forEach(c => {
        departmentsSet.add(c.department);
        levelsSet.add(c.level);
      });

      // Get course IDs for filtering
      const courseIds = courseList.map(c => c.id);

      // ===== FIXED: Count students using rule-based enrollment =====
      // Students are determined by department + level, not course_enrollments
      let totalStudents = 0;
      
      // For each department and level combination, count students
      for (const dept of departmentsSet) {
        for (const level of levelsSet) {
          const { count, error: countError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('department', dept)
            .eq('level', level);

          if (!countError) {
            totalStudents += count || 0;
          }
        }
      }

      console.log(`👥 Found ${totalStudents} students across departments/levels`);

      // Get active sessions for these courses
      const { data: activeSessions, error: sessionsError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .in('course_id', courseIds)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (sessionsError) throw sessionsError;

      // Get all sessions for attendance calculation
      const { data: allSessions, error: allSessionsError } = await supabase
        .from('attendance_sessions')
        .select('id')
        .in('course_id', courseIds);

      if (allSessionsError) throw allSessionsError;

      const totalSessions = allSessions?.length || 0;

      // Get attendance records for these sessions
      let totalAttendance = 0;
      let pendingCount = 0;
      
      if (totalSessions > 0) {
        const sessionIds = allSessions.map(s => s.id);

        // Count total attendance records
        const { count: attendanceCount, error: attendanceError } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds);

        if (attendanceError) throw attendanceError;
        totalAttendance = attendanceCount || 0;

        // Count pending manual approvals
        const { count: pending, error: pendingError } = await supabase
          .from('attendance_records')
          .select('*', { count: 'exact', head: true })
          .in('session_id', sessionIds)
          .eq('marked_manually', true)
          .is('verified_by', null);

        if (pendingError) throw pendingError;
        pendingCount = pending || 0;
      }

      // Calculate average attendance
      const totalPossibleAttendance = totalStudents * totalSessions;
      const avgAttendance = totalPossibleAttendance > 0
        ? Math.round((totalAttendance / totalPossibleAttendance) * 100)
        : 0;

      // Estimate at-risk students (those with attendance < 50%)
      const atRiskStudents = Math.round(totalStudents * 0.15); // Placeholder

      console.log('📊 Lecturer Stats:', {
        courses: courseList.length,
        students: totalStudents,
        sessions: totalSessions,
        attendance: totalAttendance,
        avgAttendance,
        activeSessions: activeSessions?.length || 0,
        pendingApprovals: pendingCount
      });

      setStats({
        totalCourses: courseList.length,
        totalStudents: totalStudents || 0,
        departments: Array.from(departmentsSet),
        levels: Array.from(levelsSet),
        avgAttendance,
        activeSessions: activeSessions?.length || 0,
        pendingApprovals: pendingCount,
        atRiskStudents
      });

    } catch (error) {
      console.error('❌ Error in useLecturerData:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [lecturerId]);

  // Get students for a specific course (using rule-based enrollment)
  const getCourseStudents = useCallback(async (courseId) => {
    try {
      // First get the course details
      const { data: course } = await supabase
        .from('courses')
        .select('department, level')
        .eq('id', courseId)
        .single();

      if (!course) return [];

      // Get students by department and level
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

  // Get attendance for a specific student in a course
  const getStudentAttendance = useCallback(async (studentId, courseId) => {
    try {
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select('id, start_time')
        .eq('course_id', courseId);

      if (!sessions || sessions.length === 0) return [];

      const sessionIds = sessions.map(s => s.id);

      const { data: attendance } = await supabase
        .from('attendance_records')
        .select(`
          id,
          scanned_at,
          session_id,
          marked_manually,
          manual_reason,
          sessions (
            start_time
          )
        `)
        .eq('student_id', studentId)
        .in('session_id', sessionIds);

      return attendance || [];
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      return [];
    }
  }, []);

  // Get all students across all lecturer's courses (using rule-based enrollment)
  const getAllStudents = useCallback(async (filters = {}) => {
    if (courses.length === 0) return [];

    // Get unique departments and levels from courses
    const departments = [...new Set(courses.map(c => c.department))];
    const levels = [...new Set(courses.map(c => c.level))];

    let query = supabase
      .from('students')
      .select(`
        id,
        matric_no,
        full_name,
        level,
        department,
        email
      `)
      .in('department', departments)
      .in('level', levels);

    // Apply filters if provided
    if (filters.level) {
      query = query.eq('level', filters.level);
    }
    if (filters.department) {
      query = query.eq('department', filters.department);
    }
    if (filters.search) {
      query = query.or(
        `matric_no.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching all students:', error);
      return [];
    }

    // For each student, add which of the lecturer's courses they're in
    const studentsWithCourses = data.map(student => ({
      ...student,
      courses: courses
        .filter(c => c.level === student.level && c.department === student.department)
        .map(c => ({ id: c.id, course_code: c.course_code }))
    }));

    return studentsWithCourses;
  }, [courses]);

  const getAllDepartmentStudents = useCallback(async () => {
    if (!lecturerId || courses.length === 0) return [];

    try {
      // Get lecturer's department from first course
      const lecturerDepartment = courses[0]?.department;
      if (!lecturerDepartment) return [];

      console.log('📊 Fetching all students in department:', lecturerDepartment);

      // Get all students in this department
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
        .eq('department', lecturerDepartment);

      if (error) throw error;

      console.log(`📦 Found ${students?.length || 0} students in ${lecturerDepartment}`);

      if (!students || students.length === 0) {
        return [];
      }

      // Get all course IDs that this lecturer teaches
      const lecturerCourseIds = courses.map(c => c.id);
      const lecturerCourseLevels = courses.map(c => c.level);

      // Process each student to add attendance stats (only for their level)
      const processedStudents = await Promise.all(students.map(async (student) => {
        // Only include courses at the student's level
        const relevantCourses = courses.filter(c => c.level === student.level);
        const relevantCourseIds = relevantCourses.map(c => c.id);
        
        let totalSessions = 0;
        let presentCount = 0;
        
        if (relevantCourseIds.length > 0) {
          // Get sessions for these courses
          const { data: sessions, error: sessionsError } = await supabase
            .from('attendance_sessions')
            .select('id')
            .in('course_id', relevantCourseIds);

          if (!sessionsError) {
            totalSessions = sessions?.length || 0;
            
            if (totalSessions > 0) {
              const sessionIds = sessions.map(s => s.id);
              
              // Get student's attendance records for these sessions
              const { count, error: countError } = await supabase
                .from('attendance_records')
                .select('*', { count: 'exact', head: true })
                .eq('student_id', student.id)
                .in('session_id', sessionIds);

              if (!countError) {
                presentCount = count || 0;
              }
            }
          }
        }

        // Get last active
        const { data: lastActive } = await supabase
          .from('attendance_records')
          .select('scanned_at')
          .eq('student_id', student.id)
          .order('scanned_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const attendanceRate = totalSessions > 0 
          ? Math.round((presentCount / totalSessions) * 100) 
          : 0;

        return {
          id: student.id,
          user_id: student.user_id,
          matric_no: student.matric_no,
          full_name: student.full_name || 'Unknown',
          level: student.level,
          department: student.department,
          email: student.email,
          courses: relevantCourses,
          totalSessions,
          presentCount,
          attendanceRate,
          lastActive: lastActive?.scanned_at
            ? new Date(lastActive.scanned_at).toLocaleDateString()
            : 'Never'
        };
      }));

      console.log(`✅ Found ${processedStudents.length} students in ${lecturerDepartment}`);
      return processedStudents;

    } catch (error) {
      console.error('Error fetching department students:', error);
      return [];
    }
  }, [lecturerId, courses]);

  useEffect(() => {
    if (lecturerId) {
      fetchLecturerData();
    } else {
      setLoading(false);
    }
  }, [lecturerId, fetchLecturerData]);

  // Group courses by department and level for display
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
    loading,
    error,
    stats,
    refetch: fetchLecturerData,
    getCourseStudents,
    getStudentAttendance,
    getAllStudents,
    getAllDepartmentStudents  
  };
};