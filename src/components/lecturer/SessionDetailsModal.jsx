import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  X, Download, Users, Clock, MapPin, Calendar, 
  AlertCircle, XCircle, FileText, UserX, UserCheck, Flag, 
  AlertTriangle, PlusCircle, Loader 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../contexts/AuthContext';

const SessionDetailsModal = ({ isOpen, onClose, session, course }) => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('present');
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualReason, setManualReason] = useState('');

  // Fetch attendance details with TanStack Query
  const { data: students = [], isLoading } = useQuery({
    queryKey: ['session-attendance', session?.id],
    queryFn: async () => {
      if (!session || !course) return [];

      // Get all students in this course
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select('id, matric_no, full_name, level, department, email')
        .eq('department', course.department)
        .eq('level', course.level);

      if (studentsError) throw studentsError;

      // Get attendance records for this session
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', session.id);

      if (recordsError) throw recordsError;

      // Create attendance map
      const attendanceMap = {};
      records?.forEach(record => {
        attendanceMap[record.student_id] = record;
      });

      // Combine students with attendance status
      return (allStudents || []).map(student => ({
        ...student,
        attendance: attendanceMap[student.id] || null,
        status: attendanceMap[student.id] ? 'present' : 'absent',
        scanned_at: attendanceMap[student.id]?.scanned_at,
        marked_manually: attendanceMap[student.id]?.marked_manually || false,
        manual_reason: attendanceMap[student.id]?.manual_reason,
        is_suspicious: attendanceMap[student.id]?.is_suspicious || false
      }));
    },
    enabled: isOpen && !!session && !!course,
    staleTime: 0,
  });

  // Mark as suspicious mutation
  const markSuspicious = useMutation({
    mutationFn: async (student) => {
      if (!student.attendance) return;
      
      const { error } = await supabase
        .from('attendance_records')
        .update({ is_suspicious: true })
        .eq('id', student.attendance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-attendance', session?.id] });
    },
  });

  // Clear suspicious mutation
  const clearSuspicious = useMutation({
    mutationFn: async (student) => {
      if (!student.attendance) return;
      
      const { error } = await supabase
        .from('attendance_records')
        .update({ is_suspicious: false })
        .eq('id', student.attendance.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-attendance', session?.id] });
    },
  });

  // Manual attendance mutation
  const manualAttendance = useMutation({
    mutationFn: async ({ student, reason }) => {
      // Check if already marked
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (existing) {
        throw new Error('Student already marked present');
      }

      // Insert manual attendance
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: student.id,
          scanned_at: new Date().toISOString(),
          marked_by: user.id,
          marked_manually: true,
          manual_reason: reason,
          device_info: {
            marked_by: profile?.full_name || 'Lecturer',
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-attendance', session?.id] });
      setShowManualModal(false);
      setSelectedStudent(null);
      setManualReason('');
    },
  });

  const getHumanReadableAddress = async (record) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${record.location_lat}&lon=${record.location_lng}&zoom=18`,
        { headers: { 'User-Agent': 'UniversityAttendanceSystem/1.0' } }
      );
      const data = await response.json();
      
      if (data.address) {
        const parts = [
          data.address.road,
          data.address.suburb,
          data.address.city || data.address.town
        ].filter(Boolean);
        return parts.join(', ') || data.display_name;
      }
      return `${record.location_lat.toFixed(4)}°, ${record.location_lng.toFixed(4)}°`;
    } catch {
      return `${record.location_lat.toFixed(4)}°, ${record.location_lng.toFixed(4)}°`;
    }
  };

  const exportSessionPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(16);
    doc.text(`${course?.course_code} - Session Report`, 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Course: ${course?.course_title}`, 14, 30);
    doc.text(`Date: ${new Date(session.created_at).toLocaleDateString()}`, 14, 37);
    doc.text(`Time: ${new Date(session.start_time).toLocaleTimeString()}`, 14, 44);
    
    const presentCount = students.filter(s => s.status === 'present' && !s.is_suspicious).length;
    const suspiciousCount = students.filter(s => s.status === 'present' && s.is_suspicious).length;
    
    doc.text(`Present: ${presentCount} | Suspicious: ${suspiciousCount} | Absent: ${students.filter(s => s.status === 'absent').length}`, 14, 51);
    
    const tableRows = students
      .filter(s => s.status === 'present')
      .map(s => [
        s.matric_no,
        s.full_name,
        s.scanned_at ? new Date(s.scanned_at).toLocaleTimeString() : 'N/A',
        s.marked_manually ? 'Manual' : 'QR',
        s.is_suspicious ? 'Cheater' : 'Valid'
      ]);

    autoTable(doc, {
      head: [["Matric", "Name", "Time", "Method", "Status"]],
      body: tableRows,
      startY: 60,
      headStyles: { fillColor: [31, 41, 55] },
      styles: { fontSize: 8 }
    });
    
    doc.save(`${course?.course_code}_session.pdf`);
  };

  if (!isOpen) return null;

  const presentCount = students.filter(s => s.status === 'present' && !s.is_suspicious).length;
  const suspiciousCount = students.filter(s => s.status === 'present' && s.is_suspicious).length;
  const absentCount = students.filter(s => s.status === 'absent').length;

  const filteredStudents = students.filter(s => {
    if (activeTab === 'present') return s.status === 'present' && !s.is_suspicious;
    if (activeTab === 'suspicious') return s.status === 'present' && s.is_suspicious;
    if (activeTab === 'absent') return s.status === 'absent';
    return true;
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/20" onClick={onClose} />
        
        <div className="relative bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-gray-400" />
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  {course?.course_code} • Session
                </h2>
                <p className="text-xs text-gray-400">{course?.course_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportSessionPDF}
                className="p-1.5 text-gray-400 hover:text-gray-600"
              >
                <Download size={16} />
              </button>
              <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="p-4 overflow-y-auto">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <Calendar size={14} className="text-gray-400 mb-1" />
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-medium">{new Date(session.created_at).toLocaleDateString()}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <Clock size={14} className="text-gray-400 mb-1" />
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-sm font-medium">{new Date(session.start_time).toLocaleTimeString()}</p>
              </div>
              <button 
                onClick={() => setActiveTab('present')}
                className={`p-3 rounded-lg text-left ${activeTab === 'present' ? 'bg-green-50' : 'bg-gray-50'}`}
              >
                <p className="text-xs text-gray-400">Present</p>
                <p className="text-lg font-medium text-green-600">{presentCount}</p>
              </button>
              <button 
                onClick={() => setActiveTab('suspicious')}
                className={`p-3 rounded-lg text-left ${activeTab === 'suspicious' ? 'bg-amber-50' : 'bg-gray-50'}`}
              >
                <p className="text-xs text-gray-400">Suspicious</p>
                <p className="text-lg font-medium text-amber-600">{suspiciousCount}</p>
              </button>
              <button 
                onClick={() => setActiveTab('absent')}
                className={`p-3 rounded-lg text-left ${activeTab === 'absent' ? 'bg-red-50' : 'bg-gray-50'}`}
              >
                <p className="text-xs text-gray-400">Absent</p>
                <p className="text-lg font-medium text-red-600">{absentCount}</p>
              </button>
            </div>

            {/* Table */}
            <div className="border border-gray-100 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Matric</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500">Name</th>
                      {activeTab !== 'absent' && (
                        <>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Time</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Method</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Location</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500"></th>
                        </>
                      )}
                      {activeTab === 'absent' && (
                        <>
                          <th className="px-3 py-2 text-left text-xs text-gray-500">Status</th>
                          <th className="px-3 py-2 text-left text-xs text-gray-500"></th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {isLoading ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center">
                          <Loader size={20} className="animate-spin mx-auto text-gray-300" />
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-8 text-center text-gray-400">
                          No students
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => (
                        <tr key={student.id} className={student.is_suspicious ? 'bg-amber-50/30' : ''}>
                          <td className="px-3 py-2 font-mono text-xs">{student.matric_no}</td>
                          <td className="px-3 py-2">
                            <p className="text-sm font-medium">{student.full_name}</p>
                            {student.is_suspicious && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px]">
                                <Flag size={8} />
                                Cheater
                              </span>
                            )}
                          </td>
                          
                          {activeTab !== 'absent' ? (
                            <>
                              <td className="px-3 py-2 text-sm">
                                {student.scanned_at ? new Date(student.scanned_at).toLocaleTimeString() : '—'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`text-xs px-1.5 py-0.5 rounded ${
                                  student.marked_manually ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                                }`}>
                                  {student.marked_manually ? 'Manual' : 'QR'}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-400">
                                {student.attendance?.location_lat ? '📍' : '—'}
                              </td>
                              <td className="px-3 py-2">
                                {student.is_suspicious ? (
                                  <button
                                    onClick={() => clearSuspicious.mutate(student)}
                                    className="text-xs text-green-600 hover:text-green-700"
                                  >
                                    Clear
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => markSuspicious.mutate(student)}
                                    className="text-xs text-amber-600 hover:text-amber-700"
                                  >
                                    Flag
                                  </button>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2">
                                <span className="text-xs text-gray-400">Not recorded</span>
                              </td>
                              <td className="px-3 py-2">
                                <button
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowManualModal(true);
                                  }}
                                  className="text-xs text-indigo-600 hover:text-indigo-700"
                                >
                                  Mark
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Modal */}
      {showManualModal && selectedStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowManualModal(false)} />
          
          <div className="relative bg-white rounded-xl max-w-md w-full p-4">
            <h3 className="font-medium mb-2">Mark Attendance</h3>
            <p className="text-sm text-gray-500 mb-3">
              {selectedStudent.full_name}
            </p>

            <textarea
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              placeholder="Reason..."
              rows="2"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowManualModal(false)}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => manualAttendance.mutate({ student: selectedStudent, reason: manualReason })}
                disabled={!manualReason || manualAttendance.isPending}
                className="flex-1 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                {manualAttendance.isPending ? 'Marking...' : 'Mark'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionDetailsModal;