import React, { useState, useEffect } from 'react';
import { 
  X, Download, Users, Clock, MapPin, Calendar, CheckCircle, 
  AlertCircle, XCircle, FileText, UserX, UserCheck, Flag, 
  AlertTriangle, PlusCircle, Loader 
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '../../contexts/AuthContext';

const SessionDetailsModal = ({ isOpen, onClose, session, course }) => {
  const { user, profile } = useAuth(); // Get user from auth context
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState({});
  const [activeTab, setActiveTab] = useState('present');
  const [updating, setUpdating] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [manualReason, setManualReason] = useState('');
  const [manualLoading, setManualLoading] = useState(false);

  useEffect(() => {
    if (isOpen && session) {
      fetchAttendanceDetails();
    }
  }, [isOpen, session]);

  const fetchAttendanceDetails = async () => {
    setLoading(true);
    try {
      // Get all students in this course
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select(`id, matric_no, full_name, level, department, email`)
        .eq('department', course?.department)
        .eq('level', course?.level);

      if (studentsError) throw studentsError;

      // Get attendance records for this session
      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select(`id, student_id, scanned_at, marked_manually, manual_reason, location_lat, location_lng, is_suspicious, verified_by, verified_at`)
        .eq('session_id', session.id);

      if (recordsError) throw recordsError;

      // Create attendance map
      const attendanceMap = {};
      records?.forEach(record => {
        attendanceMap[record.student_id] = record;
      });

      // Combine students with attendance status
      const studentsWithStatus = (allStudents || []).map(student => {
        const record = attendanceMap[student.id];
        return {
          ...student,
          attendance: record || null,
          status: record ? 'present' : 'absent',
          scanned_at: record?.scanned_at,
          marked_manually: record?.marked_manually || false,
          manual_reason: record?.manual_reason,
          is_suspicious: record?.is_suspicious || false,
          verified_by: record?.verified_by,
          verified_at: record?.verified_at
        };
      });

      setStudents(studentsWithStatus);

      // Get locations for present students
      const presentWithLocation = records?.filter(r => r.location_lat) || [];
      presentWithLocation.forEach(record => {
        if (record.location_lat) {
          getHumanReadableAddress(record);
        }
      });

    } catch (error) {
      console.error('Error fetching attendance details:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsSuspicious = async (student) => {
    if (!student.attendance) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ 
          is_suspicious: true,
          verified_by: null,
          verified_at: null
        })
        .eq('id', student.attendance.id);

      if (error) throw error;

      setStudents(prev => prev.map(s => 
        s.id === student.id 
          ? { ...s, is_suspicious: true }
          : s
      ));

    } catch (error) {
      console.error('Error marking as suspicious:', error);
    } finally {
      setUpdating(false);
    }
  };

  const clearSuspicious = async (student) => {
    if (!student.attendance) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('attendance_records')
        .update({ 
          is_suspicious: false,
          verified_by: null,
          verified_at: null
        })
        .eq('id', student.attendance.id);

      if (error) throw error;

      setStudents(prev => prev.map(s => 
        s.id === student.id 
          ? { ...s, is_suspicious: false }
          : s
      ));

    } catch (error) {
      console.error('Error clearing suspicious flag:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleManualAttendance = async () => {
    if (!selectedStudent || !manualReason) {
      alert('Please provide a reason');
      return;
    }

    // Check if user is available
    if (!user || !user.id) {
      alert('You must be logged in to mark attendance');
      return;
    }

    setManualLoading(true);
    try {
      // Check if already marked
      const { data: existing, error: checkError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', selectedStudent.id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        throw new Error('Student already marked present');
      }

      // Insert manual attendance
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: selectedStudent.id,
          scanned_at: new Date().toISOString(),
          marked_by: user.id,
          marked_manually: true,
          manual_reason: manualReason,
          device_info: {
            marked_by: profile?.full_name || 'Lecturer',
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;

      // Refresh data
      await fetchAttendanceDetails();
      setShowManualModal(false);
      setSelectedStudent(null);
      setManualReason('');

    } catch (error) {
      console.error('Error marking manual attendance:', error);
      alert(error.message);
    } finally {
      setManualLoading(false);
    }
  };

  const getHumanReadableAddress = async (record) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${record.location_lat}&lon=${record.location_lng}&zoom=18`,
        { headers: { 'User-Agent': 'UniversityAttendanceSystem/1.0' } }
      );
      if (!response.ok) throw new Error('Failed to fetch location');
      const data = await response.json();
      let address = '';
      if (data.address) {
        const parts = [];
        if (data.address.road) parts.push(data.address.road);
        if (data.address.suburb) parts.push(data.address.suburb);
        if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
        address = parts.join(', ');
      }
      setLocations(prev => ({ ...prev, [record.id]: address || data.display_name }));
    } catch (error) {
      setLocations(prev => ({ 
        ...prev, 
        [record.id]: `${record.location_lat.toFixed(4)}°, ${record.location_lng.toFixed(4)}°` 
      }));
    }
  };

  const exportSessionPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${course?.course_code} - Session Report`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Course: ${course?.course_title}`, 14, 30);
    doc.text(`Date: ${new Date(session.created_at).toLocaleDateString()}`, 14, 37);
    doc.text(`Time: ${new Date(session.start_time).toLocaleTimeString()}`, 14, 44);
    
    const presentCount = students.filter(s => s.status === 'present' && !s.is_suspicious).length;
    const suspiciousCount = students.filter(s => s.status === 'present' && s.is_suspicious).length;
    
    doc.text(`Valid Present: ${presentCount}`, 14, 51);
    doc.text(`Suspicious: ${suspiciousCount}`, 14, 58);
    doc.text(`Absent: ${students.filter(s => s.status === 'absent').length}`, 14, 65);
    
    const tableRows = students
      .filter(s => s.status === 'present')
      .map(s => [
        s.matric_no,
        s.full_name,
        s.scanned_at ? new Date(s.scanned_at).toLocaleTimeString() : 'N/A',
        s.marked_manually ? 'Manual' : 'QR Scan',
        s.is_suspicious ? '⚠️ CHEATER' : 'Valid'
      ]);

    autoTable(doc, {
      head: [["Matric No", "Student Name", "Check-in Time", "Method", "Status"]],
      body: tableRows,
      startY: 75,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`${course?.course_code}_session_${new Date().toISOString().split('T')[0]}.pdf`);
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
        
        <div className="relative bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm">
                <FileText className="text-indigo-600" size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 leading-tight">
                  {course?.course_code} <span className="font-medium text-gray-400 mx-2">|</span> Session Records
                </h2>
                <p className="text-sm font-medium text-gray-500">{course?.course_title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportSessionPDF}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <Download size={16} />
                Export PDF
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-gray-400">
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <Calendar size={16} className="text-gray-400 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</p>
                <p className="text-sm font-bold text-gray-800">{new Date(session.created_at).toLocaleDateString()}</p>
              </div>
              <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
                <Clock size={16} className="text-gray-400 mb-2" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Time Started</p>
                <p className="text-sm font-bold text-gray-800">{new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <button 
                onClick={() => setActiveTab('present')}
                className={`p-4 border transition-all rounded-2xl text-left ${activeTab === 'present' ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-500/10' : 'bg-white border-gray-100 shadow-sm opacity-60'}`}
              >
                <Users size={16} className="text-emerald-600 mb-2" />
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Present</p>
                <p className="text-xl font-black text-emerald-700">{presentCount}</p>
              </button>
              <button 
                onClick={() => setActiveTab('suspicious')}
                className={`p-4 border transition-all rounded-2xl text-left ${activeTab === 'suspicious' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/10' : 'bg-white border-gray-100 shadow-sm opacity-60'}`}
              >
                <AlertTriangle size={16} className="text-amber-600 mb-2" />
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Cheaters</p>
                <p className="text-xl font-black text-amber-700">{suspiciousCount}</p>
              </button>
              <button 
                onClick={() => setActiveTab('absent')}
                className={`p-4 border transition-all rounded-2xl text-left ${activeTab === 'absent' ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-500/10' : 'bg-white border-gray-100 shadow-sm opacity-60'}`}
              >
                <AlertCircle size={16} className="text-rose-600 mb-2" />
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Absent</p>
                <p className="text-xl font-black text-rose-700">{absentCount}</p>
              </button>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-fit mb-6">
              <button
                onClick={() => setActiveTab('present')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'present' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <UserCheck size={14} />
                Present ({presentCount})
              </button>
              <button
                onClick={() => setActiveTab('suspicious')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'suspicious' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Flag size={14} />
                Cheaters ({suspiciousCount})
              </button>
              <button
                onClick={() => setActiveTab('absent')}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'absent' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <UserX size={14} />
                Absent ({absentCount})
              </button>
            </div>

            {/* Table Container */}
            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Matric No</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Student Name</th>
                      {activeTab !== 'absent' && (
                        <>
                          <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Check-in</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Method</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Location</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Actions</th>
                        </>
                      )}
                      {activeTab === 'absent' && (
                        <>
                          <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Status</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Action</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                          </div>
                        </td>
                      </tr>
                    ) : filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center gap-2 opacity-30">
                            {activeTab === 'present' && <UserCheck size={48} />}
                            {activeTab === 'suspicious' && <Flag size={48} />}
                            {activeTab === 'absent' && <UserX size={48} />}
                            <p className="text-sm font-bold uppercase tracking-widest mt-2">
                              No students in this category
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(student => (
                        <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${student.is_suspicious ? 'bg-amber-50/30' : ''}`}>
                          <td className="px-6 py-4">
                            <span className={`font-mono text-xs font-bold ${student.is_suspicious ? 'text-amber-600 line-through decoration-2' : 'text-gray-500'}`}>
                              {student.matric_no}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className={`text-sm font-bold ${student.is_suspicious ? 'text-amber-700 line-through decoration-2' : 'text-gray-900'}`}>
                                {student.full_name}
                              </p>
                              <p className="text-[10px] text-gray-400">{student.email}</p>
                            </div>
                            {student.is_suspicious && (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold mt-1">
                                <Flag size={10} />
                                CHEATER
                              </div>
                            )}
                          </td>
                          
                          {activeTab !== 'absent' ? (
                            <>
                              <td className="px-6 py-4">
                                <span className={`text-sm font-medium ${student.is_suspicious ? 'text-amber-600 line-through' : 'text-gray-600'}`}>
                                  {student.scanned_at ? new Date(student.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {student.marked_manually ? (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${student.is_suspicious ? 'bg-amber-100 text-amber-600 border-amber-200 line-through' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                    Manual
                                  </span>
                                ) : (
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${student.is_suspicious ? 'bg-amber-100 text-amber-600 border-amber-200 line-through' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                    QR Scan
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 max-w-[200px]">
                                  <MapPin size={12} className={`${student.is_suspicious ? 'text-amber-400' : 'text-indigo-400'} shrink-0`} />
                                  <span className={`text-xs truncate italic ${student.is_suspicious ? 'text-amber-500 line-through' : 'text-gray-500'}`}>
                                    {locations[student.attendance?.id] || 'GPS Verified'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {student.is_suspicious ? (
                                  <button
                                    onClick={() => clearSuspicious(student)}
                                    disabled={updating}
                                    className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors disabled:opacity-50"
                                  >
                                    Clear Flag
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => markAsSuspicious(student)}
                                    disabled={updating}
                                    className="px-3 py-1 bg-amber-100 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-200 transition-colors disabled:opacity-50"
                                  >
                                    <Flag size={12} className="inline mr-1" />
                                    Mark Cheater
                                  </button>
                                )}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                                  <XCircle size={12} />
                                  Unrecorded
                                </span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedStudent(student);
                                    setShowManualModal(true);
                                  }}
                                  className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium hover:bg-indigo-200 transition-colors"
                                >
                                  <PlusCircle size={12} className="inline mr-1" />
                                  Mark Present
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
          
          {/* Mobile Export Button */}
          <div className="p-4 border-t border-gray-100 bg-white sm:hidden">
            <button
              onClick={exportSessionPDF}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg"
            >
              <Download size={18} />
              Export PDF Report
            </button>
          </div>
        </div>
      </div>

      {/* Manual Attendance Modal */}
      {showManualModal && selectedStudent && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowManualModal(false)} />
          
          <div className="relative bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Mark Manual Attendance</h3>
            <p className="text-sm text-gray-500 mb-4">
              Mark {selectedStudent.full_name} as present for this session
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Reason</label>
                <textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  placeholder="e.g., Medical emergency, Network issues, etc."
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowManualModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAttendance}
                  disabled={!manualReason || manualLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {manualLoading ? (
                    <>
                      <Loader size={14} className="animate-spin" />
                      Marking...
                    </>
                  ) : (
                    'Mark Present'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SessionDetailsModal;