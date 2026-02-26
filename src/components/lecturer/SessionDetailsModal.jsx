import React, { useState, useEffect } from 'react';
import { X, Download, Users, Clock, MapPin, Calendar, CheckCircle, AlertCircle, XCircle, FileText, UserX, UserCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SessionDetailsModal = ({ isOpen, onClose, session, course }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState({});
  const [activeTab, setActiveTab] = useState('present'); // Default to showing present students

  useEffect(() => {
    if (isOpen && session) {
      fetchAttendanceDetails();
    }
  }, [isOpen, session]);

  const fetchAttendanceDetails = async () => {
    setLoading(true);
    try {
      const { data: allStudents, error: studentsError } = await supabase
        .from('students')
        .select(`id, matric_no, full_name, level, department, email`)
        .eq('department', course?.department)
        .eq('level', course?.level);

      if (studentsError) throw studentsError;

      const { data: records, error: recordsError } = await supabase
        .from('attendance_records')
        .select(`id, student_id, scanned_at, marked_manually, manual_reason, location_lat, location_lng`)
        .eq('session_id', session.id);

      if (recordsError) throw recordsError;

      const attendanceMap = {};
      records?.forEach(record => {
        attendanceMap[record.student_id] = record;
      });

      const studentsWithStatus = (allStudents || []).map(student => ({
        ...student,
        attendance: attendanceMap[student.id] || null,
        status: attendanceMap[student.id] ? 'present' : 'absent',
        scanned_at: attendanceMap[student.id]?.scanned_at,
        marked_manually: attendanceMap[student.id]?.marked_manually || false,
        manual_reason: attendanceMap[student.id]?.manual_reason
      }));

      setStudents(studentsWithStatus);

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
    doc.text(`Total Present: ${students.filter(s => s.status === 'present').length} students`, 14, 51);
    
    const tableRows = students
      .filter(s => s.status === 'present')
      .map(s => [
        s.matric_no,
        s.full_name,
        s.scanned_at ? new Date(s.scanned_at).toLocaleTimeString() : 'N/A',
        s.marked_manually ? 'Manual' : 'QR Scan'
      ]);

    autoTable(doc, {
      head: [["Matric No", "Student Name", "Check-in Time", "Method"]],
      body: tableRows,
      startY: 60,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`${course?.course_code}_session_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (!isOpen) return null;

  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const filteredStudents = students.filter(s => s.status === activeTab);

  return (
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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              onClick={() => setActiveTab('absent')}
              className={`p-4 border transition-all rounded-2xl text-left ${activeTab === 'absent' ? 'bg-rose-50 border-rose-200 ring-2 ring-rose-500/10' : 'bg-white border-gray-100 shadow-sm opacity-60'}`}
            >
              <AlertCircle size={16} className="text-rose-600 mb-2" />
              <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Absent</p>
              <p className="text-xl font-black text-rose-700">{absentCount}</p>
            </button>
          </div>

          {/* Segmented Control / Tab Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl w-full sm:w-fit mb-6">
            <button
              onClick={() => setActiveTab('present')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'present' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserCheck size={14} />
              Present List
            </button>
            <button
              onClick={() => setActiveTab('absent')}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'absent' ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <UserX size={14} />
              Absent List
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
                    {activeTab === 'present' && (
                      <>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Check-in</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Method</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100">Verified Location</th>
                      </>
                    )}
                    {activeTab === 'absent' && (
                       <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Contact Status</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 animate-pulse">
                          <div className="h-2 w-32 bg-gray-200 rounded-full" />
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          {activeTab === 'present' ? <UserCheck size={48} /> : <CheckCircle size={48} />}
                          <p className="text-sm font-bold uppercase tracking-widest mt-2">
                            {activeTab === 'present' ? 'No attendance records yet' : 'Perfect Attendance! No one is absent'}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-gray-500">{student.matric_no}</td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-gray-900">{student.full_name}</p>
                          <p className="text-[10px] text-gray-400">{student.email}</p>
                        </td>
                        
                        {activeTab === 'present' ? (
                          <>
                            <td className="px-6 py-4 text-sm font-medium text-gray-600">
                              {student.scanned_at ? new Date(student.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                            </td>
                            <td className="px-6 py-4">
                              {student.marked_manually ? (
                                <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded shadow-sm">Manual</span>
                              ) : (
                                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded shadow-sm">QR Scan</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 max-w-[200px]">
                                <MapPin size={12} className="text-indigo-400 shrink-0" />
                                <span className="text-xs text-gray-500 truncate italic">
                                  {locations[student.attendance?.id] || 'GPS Verified'}
                                </span>
                              </div>
                            </td>
                          </>
                        ) : (
                          <td className="px-6 py-4 text-right">
                             <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-400 rounded-full text-[10px] font-bold uppercase tracking-tighter">
                              <XCircle size={12} />
                              Unrecorded
                            </span>
                          </td>
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
  );
};

export default SessionDetailsModal;