import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle, CheckCircle, Users, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [courseSessions, setCourseSessions] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [searchStudent, setSearchStudent] = useState('');
  const [manualReason, setManualReason] = useState('');
  const [manualLoading, setManualLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [showStudentList, setShowStudentList] = useState(true);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    if (selectedCourse && isOpen) {
      fetchCourseSessions(selectedCourse);
    } else {
      setCourseSessions([]);
      setSelectedSession('');
    }
  }, [selectedCourse, isOpen]);

  useEffect(() => {
    if (selectedSession && selectedCourse) {
      fetchAvailableStudents();
    }
  }, [selectedSession, selectedCourse]);

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
        .limit(20);

      if (error) throw error;
      setCourseSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setModalError('Failed to load sessions');
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchAvailableStudents = async () => {
    try {
      setManualLoading(true);
      setModalError('');
      
      // Get course details
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('level, department')
        .eq('id', selectedCourse)
        .single();

      if (courseError) throw courseError;

      // Get all students in this department and level
      const { data: allStudents, error: studentsError } = await supabase
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
        .eq('department', courseData.department);

      if (studentsError) throw studentsError;

      // Get students already marked for this session
      const { data: markedStudents, error: markedError } = await supabase
        .from('attendance_records')
        .select('student_id')
        .eq('session_id', selectedSession);

      if (markedError) throw markedError;

      const markedIds = new Set(markedStudents.map(m => m.student_id));

      // Filter out students already marked
      const formattedStudents = allStudents
        .filter(student => !markedIds.has(student.id))
        .map(student => ({
          id: student.id,
          matric_no: student.matric_no,
          full_name: student.profiles?.full_name || student.full_name,
          level: student.level,
          department: student.department,
          profiles: student.profiles,
          selected: false
        }));

      setAvailableStudents(formattedStudents || []);
      setSelectAll(false);
      
    } catch (error) {
      console.error('Error fetching students:', error);
      setModalError('Failed to load students: ' + error.message);
      setAvailableStudents([]);
    } finally {
      setManualLoading(false);
    }
  };

  const handleCourseChange = (courseId) => {
    setSelectedCourse(courseId);
    setSelectedSession('');
    setSelectedStudents([]);
    setAvailableStudents([]);
    setSearchStudent('');
    setModalError('');
    setModalSuccess('');
    setSelectAll(false);
  };

  const handleSessionChange = (sessionId) => {
    setSelectedSession(sessionId);
    setSelectedStudents([]);
    setSearchStudent('');
    setSelectAll(false);
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      const newSelected = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];
      
      // Update selectAll based on new selection
      setSelectAll(newSelected.length === filteredStudents.length && filteredStudents.length > 0);
      return newSelected;
    });

    // Update the student's selected status in availableStudents
    setAvailableStudents(prev => 
      prev.map(s => 
        s.id === studentId 
          ? { ...s, selected: !s.selected }
          : s
      )
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all
      setSelectedStudents([]);
      setAvailableStudents(prev => prev.map(s => ({ ...s, selected: false })));
    } else {
      // Select all filtered students
      const filteredIds = filteredStudents.map(s => s.id);
      setSelectedStudents(filteredIds);
      setAvailableStudents(prev => 
        prev.map(s => 
          filteredIds.includes(s.id) ? { ...s, selected: true } : s
        )
      );
    }
    setSelectAll(!selectAll);
  };

  const handleBulkManualAttendance = async () => {
    if (!selectedCourse || !selectedSession || selectedStudents.length === 0 || !manualReason) {
      setModalError('Please select course, session, at least one student, and provide a reason');
      return;
    }

    try {
      setManualLoading(true);
      setModalError('');
      setModalSuccess('');

      // Prepare all attendance records
      const attendanceRecords = selectedStudents.map(studentId => ({
        session_id: selectedSession,
        student_id: studentId,
        scanned_at: new Date().toISOString(),
        marked_by: user.id,
        marked_manually: true,
        manual_reason: manualReason,
        device_info: {
          marked_by: profile?.full_name,
          timestamp: new Date().toISOString(),
          bulk_action: true,
          student_count: selectedStudents.length
        }
      }));

      // Insert all records
      const { error } = await supabase
        .from('attendance_records')
        .insert(attendanceRecords);

      if (error) throw error;

      // Get student names for success message
      const studentNames = selectedStudents
        .map(id => availableStudents.find(s => s.id === id)?.full_name)
        .filter(Boolean);

      const successMessage = selectedStudents.length === 1
        ? `${studentNames[0]} added to session successfully!`
        : `${selectedStudents.length} students added to session successfully!`;

      setModalSuccess(successMessage);
      setParentSuccess(successMessage);

      // Refresh available students list
      await fetchAvailableStudents();
      setSelectedStudents([]);
      setManualReason('');
      setSelectAll(false);

      setTimeout(() => {
        onSuccess();
        if (selectedStudents.length === 0) {
          // Only close if no students are left to add
          // You might want to keep it open for bulk adding
        }
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
    setSelectedStudents([]);
    setAvailableStudents([]);
    setSearchStudent('');
    setManualReason('');
    setModalError('');
    setModalSuccess('');
    setSelectAll(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const filteredStudents = availableStudents.filter(s => 
    s.full_name?.toLowerCase().includes(searchStudent.toLowerCase()) ||
    s.matric_no?.toLowerCase().includes(searchStudent.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 z-[110]">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
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
                  onChange={(e) => handleSessionChange(e.target.value)}
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

          {/* Student Selection */}
          {selectedSession && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-500">
                  Select Students <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={() => setShowStudentList(!showStudentList)}
                  className="text-xs text-purple-600 flex items-center gap-1"
                >
                  {showStudentList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {showStudentList ? 'Hide' : 'Show'} students
                </button>
              </div>

              {showStudentList && (
                <>
                  {/* Search */}
                  <input
                    type="text"
                    value={searchStudent}
                    onChange={(e) => setSearchStudent(e.target.value)}
                    placeholder="Search by name or matric..."
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm mb-2"
                  />

                  {/* Select All */}
                  {filteredStudents.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg mb-2">
                      <input
                        type="checkbox"
                        checked={selectAll}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-slate-700">Select All ({filteredStudents.length})</span>
                      <span className="text-xs text-slate-400 ml-auto">
                        {selectedStudents.length} selected
                      </span>
                    </div>
                  )}
                  
                  {/* Student List */}
                  {manualLoading ? (
                    <div className="flex items-center justify-center py-4 bg-slate-50 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg divide-y">
                      {filteredStudents.length === 0 ? (
                        <div className="p-3 text-center text-sm text-slate-500">
                          {searchStudent ? 'No matching students' : 'All students already marked'}
                        </div>
                      ) : (
                        filteredStudents.map(student => (
                          <div
                            key={student.id}
                            onClick={() => handleStudentToggle(student.id)}
                            className={`p-2.5 cursor-pointer transition-colors flex items-start gap-2 ${
                              selectedStudents.includes(student.id)
                                ? 'bg-purple-50'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => {}}
                              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900">{student.full_name}</p>
                              <p className="text-xs text-slate-500">{student.matric_no}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reason Input - Only show if students are selected */}
          {selectedStudents.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={manualReason}
                onChange={(e) => setManualReason(e.target.value)}
                placeholder="e.g., Technical issues, medical reasons..."
                rows="2"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm resize-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4 bg-white flex gap-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleBulkManualAttendance}
            disabled={!selectedSession || selectedStudents.length === 0 || !manualReason || manualLoading}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {manualLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Adding...
              </>
            ) : (
              <>
                <UserPlus size={16} />
                Add {selectedStudents.length > 0 ? `(${selectedStudents.length})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManualAttendanceModal;