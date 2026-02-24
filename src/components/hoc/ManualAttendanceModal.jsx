import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const ManualAttendanceModal = ({
  isOpen,
  onClose,
  courses,
  user,
  profile,
  onSuccess,
  supabase,
  setError: setParentError,
  setSuccess: setParentSuccess,
  refetch
}) => {
  // All hooks at the top
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [courseSessions, setCourseSessions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [studentsList, setStudentsList] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (selectedCourse && isOpen) {
      fetchCourseSessions(selectedCourse);
    } else {
      setCourseSessions([]);
      setSelectedSession('');
    }
  }, [selectedCourse, isOpen]);

  const fetchCourseSessions = async (courseId) => {
    try {
      setLoadingSessions(true);
      setModalError('');
      
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          start_time,
          expires_at,
          is_active,
          created_at,
          is_manual
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(20); // Limit to recent sessions

      if (error) throw error;
      setCourseSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setModalError('Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchStudentsForCourse = async (courseId) => {
    try {
      setManualLoading(true);
      setModalError('');
      
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('level, department')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;

      const { data: students, error: studentsError } = await supabase
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
        .eq('level', courseData.level)
        .eq('department', courseData.department)
        .limit(50); // Limit students

      if (studentsError) throw studentsError;

      const formattedStudents = students.map(student => ({
        id: student.id,
        matric_no: student.matric_no,
        full_name: student.profiles?.full_name || student.full_name,
        level: student.level,
        department: student.department,
        profiles: student.profiles
      }));

      setStudentsList(formattedStudents || []);
      
    } catch (error) {
      console.error('Error in fetchStudentsForCourse:', error);
      setModalError('Failed to load students: ' + error.message);
      setStudentsList([]);
    } finally {
      setManualLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setSelectedSession('');
    setSelectedStudent('');
    setSearchStudent('');
    setModalError('');
    setModalSuccess('');
    if (courseId) {
      fetchStudentsForCourse(courseId);
    } else {
      setStudentsList([]);
    }
  };

  const handleManualAttendance = async () => {
    if (!selectedCourse || !selectedSession || !selectedStudent || !manualReason) {
      setModalError('Please select course, session, student, and provide a reason');
      return;
    }

    try {
      setManualLoading(true);
      setModalError('');
      setModalSuccess('');
      
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id, scanned_at')
        .eq('session_id', selectedSession)
        .eq('student_id', selectedStudent)
        .maybeSingle();

      if (existing) {
        const student = studentsList.find(s => s.id === selectedStudent);
        const studentName = student?.full_name || 'Student';
        setModalError(`${studentName} already marked present for this session at ${new Date(existing.scanned_at).toLocaleTimeString()}`);
        setManualLoading(false);
        return;
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: selectedSession,
          student_id: selectedStudent,
          scanned_at: new Date().toISOString(),
          marked_by: user.id,
          marked_manually: true,
          manual_reason: manualReason,
          device_info: {
            marked_by: profile?.full_name,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      const student = studentsList.find(s => s.id === selectedStudent);
      const studentName = student?.full_name || 'Student';
      
      const session = courseSessions.find(s => s.id === selectedSession);
      const sessionDate = session ? new Date(session.start_time).toLocaleDateString() : 'selected session';
      
      setModalSuccess(`${studentName} added to ${sessionDate} session successfully!`);
      setParentSuccess('Attendance marked successfully');
      
      setTimeout(() => {
        onSuccess();
        resetForm();
      }, 1500);

    } catch (error) {
      console.error('Error marking manual attendance:', error);
      setModalError(error.message);
      setParentError(error.message);
    } finally {
      setManualLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedCourse('');
    setSelectedSession('');
    setCourseSessions([]);
    setSelectedStudent('');
    setStudentsList([]);
    setSearchStudent('');
    setManualReason('');
    setModalError('');
    setModalSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredStudents = studentsList.filter(s => 
    s.full_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.matric_no?.toLowerCase().includes(searchStudent.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-[110]">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Sticky */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <UserPlus size={18} className="text-purple-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Manual Attendance</h3>
          </div>
          <button 
            onClick={handleClose} 
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Messages */}
          {modalError && (
            <div className="bg-red-50 p-3 rounded-lg flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>{modalError}</p>
            </div>
          )}

          {modalSuccess && (
            <div className="bg-green-50 p-3 rounded-lg flex items-start gap-2 text-green-700 text-sm">
              <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>{modalSuccess}</p>
            </div>
          )}

          {/* Course Selection */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
            >
              <option value="">Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.course_code} - {course.course_title}
                </option>
              ))}
            </select>
          </div>

          {/* Session Selection */}
          {selectedCourse && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Session <span className="text-red-500">*</span>
              </label>
              {loadingSessions ? (
                <div className="flex items-center justify-center py-3 bg-slate-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                >
                  <option value="">Select a session...</option>
                  {courseSessions.map(session => (
                    <option key={session.id} value={session.id}>
                      {new Date(session.start_time).toLocaleDateString()} {new Date(session.start_time).toLocaleTimeString()} 
                      {session.is_active ? ' (🟢)' : ' (⚫)'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Student Search */}
          {selectedCourse && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Student <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Search by name or matric..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm mb-2"
              />
              
              {manualLoading ? (
                <div className="flex items-center justify-center py-4 bg-slate-50 rounded-lg">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y">
                  {filteredStudents.length === 0 ? (
                    <div className="p-3 text-center text-sm text-slate-500">
                      No students found
                    </div>
                  ) : (
                    filteredStudents.map(student => (
                      <div
                        key={student.id}
                        onClick={() => setSelectedStudent(student.id)}
                        className={`p-2.5 cursor-pointer transition-colors ${
                          selectedStudent === student.id
                            ? 'bg-purple-50 border-l-2 border-purple-500'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
                        <p className="text-xs text-slate-500">{student.matric_no}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Reason Input */}
          {selectedStudent && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="e.g., Technical issues, medical reason..."
                rows="2"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer - Sticky */}
        <div className="border-t border-slate-200 p-4 bg-white flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleManualAttendance}
            disabled={!selectedSession || !selectedStudent || !manualReason || manualLoading}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
          >
            {manualLoading ? 'Adding...' : 'Add to Session'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;