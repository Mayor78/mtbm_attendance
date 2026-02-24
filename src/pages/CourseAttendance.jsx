import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourseAttendance } from '../hooks/useAttendance';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import components
import LoadingSpinner from '../components/common/LoadingSpinner';
import AttendanceHeader from '../components/attendance/AttendanceHeader';
import SessionSelector from '../components/attendance/SessionSelector';
import SessionStats from '../components/attendance/SessionStats';
import AttendanceRecordsList from '../components/attendance/AttendanceRecordsList';
import StudentStatsCards from '../components/attendance/StudentStatsCards';
import StudentFilters from '../components/attendance/StudentFilters';
import StudentList from '../components/attendance/StudentList';
import LocationSummary from '../components/attendance/LocationSummary';
import StatCardMobile from '../components/attendance/StatCard';
import { Clock, FileText, User } from 'lucide-react';

// Cache for location addresses
const locationCache = {};

export const CourseAttendance = () => {
  const { courseId } = useParams();
  const { user, profile } = useAuth();
  const { sessions, loading, error, refetch } = useCourseAttendance(courseId);
  const [selectedSession, setSelectedSession] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locations, setLocations] = useState({});
  const [loadingLocations, setLoadingLocations] = useState({});
  const [viewMode, setViewMode] = useState('sessions');
  const [studentStats, setStudentStats] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [filterAttendance, setFilterAttendance] = useState('all');

  useEffect(() => {
    fetchCourseInfo();
  }, [courseId]);

  useEffect(() => {
    if (sessions.length > 0) {
      calculateStudentStats();
    }
  }, [sessions]);

  useEffect(() => {
    if (selectedSession?.attendanceRecords) {
      const records = Array.isArray(selectedSession.attendanceRecords) 
        ? selectedSession.attendanceRecords 
        : [];
      
      if (records.length > 0) {
        getHumanReadableAddress(records);
      }
    }
  }, [selectedSession]);

  const handleRemoveFromSession = async (record) => {
  try {
    // Delete only this specific attendance record
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', record.id);

    if (error) throw error;

    // Refresh the data
    await refetch();
    
    // Update selected session by removing this record from the list
    if (selectedSession) {
      const updatedRecords = selectedSession.attendanceRecords?.filter(r => r.id !== record.id) || [];
      setSelectedSession({
        ...selectedSession,
        attendanceRecords: updatedRecords
      });
    }

    // Optional: Show success message
    console.log('Student removed from session successfully');

  } catch (error) {
    console.error('Error removing student from session:', error);
    alert('Failed to remove student from session: ' + error.message);
  }
};

  const fetchCourseInfo = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (data) setCourseInfo(data);
  };

  const calculateStudentStats = () => {
    const studentMap = {};
    
    sessions.forEach(session => {
      const records = session.attendanceRecords || [];
      records.forEach(record => {
        const studentId = record.student_id;
        const studentName = record.student_name || record.students?.profiles?.full_name || 'Unknown';
        const matricNo = record.matric_no || record.students?.matric_no || 'N/A';
        
        if (!studentMap[studentId]) {
          studentMap[studentId] = {
            id: studentId,
            name: studentName,
            matricNo: matricNo,
            totalPresent: 0,
            sessionsAttended: [],
            firstAttendance: record.scanned_at,
            lastAttendance: record.scanned_at,
            locations: []
          };
        }
        
        const student = studentMap[studentId];
        student.totalPresent++;
        student.sessionsAttended.push(session.id);
        
        if (new Date(record.scanned_at) < new Date(student.firstAttendance)) {
          student.firstAttendance = record.scanned_at;
        }
        if (new Date(record.scanned_at) > new Date(student.lastAttendance)) {
          student.lastAttendance = record.scanned_at;
        }
        
        if (record.location_lat && record.location_lng) {
          student.locations.push({
            lat: record.location_lat,
            lng: record.location_lng,
            time: record.scanned_at
          });
        }
      });
    });
    
    const stats = Object.values(studentMap).map(student => ({
      ...student,
      attendancePercentage: sessions.length > 0 ? Math.round((student.totalPresent / sessions.length) * 100) : 0,
      attendanceGrade: getAttendanceGrade(sessions.length > 0 ? student.totalPresent / sessions.length : 0)
    }));
    
    const sortedStats = sortStudents(stats, sortBy);
    setStudentStats(sortedStats);
  };

  const getAttendanceGrade = (ratio) => {
    if (ratio >= 0.9) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (ratio >= 0.75) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (ratio >= 0.5) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const sortStudents = (stats, sortKey) => {
    return [...stats].sort((a, b) => {
      switch(sortKey) {
        case 'name': return a.name.localeCompare(b.name);
        case 'attendance': return b.totalPresent - a.totalPresent;
        case 'percentage': return b.attendancePercentage - a.attendancePercentage;
        default: return a.name.localeCompare(b.name);
      }
    });
  };

  const handleSortChange = (key) => {
    setSortBy(key);
    setStudentStats(sortStudents(studentStats, key));
  };

  const filteredStudents = studentStats.filter(student => {
    if (filterAttendance === 'all') return true;
    if (filterAttendance === 'high') return student.attendancePercentage >= 75;
    if (filterAttendance === 'medium') return student.attendancePercentage >= 50 && student.attendancePercentage < 75;
    if (filterAttendance === 'low') return student.attendancePercentage < 50;
    return true;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

 const getHumanReadableAddress = async (records) => {
  if (!records || !Array.isArray(records) || records.length === 0) return;
  
  const recordsToGeocode = records.filter(record => {
    if (!record?.location_lat || !record?.location_lng) return false;
    const cacheKey = `${record.location_lat},${record.location_lng}`;
    return !locationCache[cacheKey] && !loadingLocations[record.id];
  });

  if (recordsToGeocode.length === 0) return;

  for (let i = 0; i < recordsToGeocode.length; i++) {
    const record = recordsToGeocode[i];
    
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 1100));
    }
    
    setLoadingLocations(prev => ({ ...prev, [record.id]: true }));
    
    try {
      const cacheKey = `${record.location_lat},${record.location_lng}`;
      
      // Use a CORS proxy
      const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
      const targetUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${record.location_lat}&lon=${record.location_lng}&zoom=18&addressdetails=1`;
      
      const response = await fetch(proxyUrl + targetUrl, {
        headers: {
          'User-Agent': 'UniversityAttendanceSystem/1.0'
        }
      });
      
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
      
      const displayAddress = address || data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown location';
      locationCache[cacheKey] = displayAddress;
      setLocations(prev => ({ ...prev, [record.id]: displayAddress }));
      
    } catch (error) {
      console.error('Error getting location address:', error);
      // Fallback to coordinates
      const fallback = `${record.location_lat.toFixed(4)}°, ${record.location_lng.toFixed(4)}°`;
      locationCache[`${record.location_lat},${record.location_lng}`] = fallback;
      setLocations(prev => ({ ...prev, [record.id]: fallback }));
    } finally {
      setLoadingLocations(prev => ({ ...prev, [record.id]: false }));
    }
  }
};

  const exportSessionReport = () => {
    if (!selectedSession || !courseInfo) return;
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const sessionDate = new Date(selectedSession.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).replace(/\s/g, '_');
    
    const filename = `${courseInfo.course_code}_session_${sessionDate}_${dateStr}.pdf`;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`${courseInfo.course_code} - Session Attendance Report`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Course: ${courseInfo.course_title}`, 14, 30);
    doc.text(`Date: ${new Date(selectedSession.created_at).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 14, 37);
    doc.text(`Time: ${new Date(selectedSession.start_time).toLocaleTimeString()}`, 14, 44);
    doc.text(`Status: ${selectedSession.is_active ? 'Active' : 'Closed'}`, 14, 51);
    doc.text(`Total Present: ${selectedSession.attendanceRecords?.length || 0} students`, 14, 58);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 65);
    
    const tableRows = (selectedSession.attendanceRecords || []).map(record => [
      record.student_name || record.students?.profiles?.full_name || 'Unknown',
      record.matric_no || record.students?.matric_no || 'N/A',
      new Date(record.scanned_at).toLocaleTimeString(),
      record.location_lat ? '📍 With Location' : '📍 No Location'
    ]);

    autoTable(doc, {
      head: [["Student Name", "Matric No", "Check-in Time", "Location"]],
      body: tableRows,
      startY: 70,
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 60 }
      }
    });
    
    doc.save(filename);
  };

  const exportStudentReport = () => {
    if (!courseInfo) return;
    
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `${courseInfo.course_code}_student_report_${dateStr}.pdf`;
    
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`${courseInfo.course_code} - Student Attendance Report`, 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Course: ${courseInfo.course_title}`, 14, 30);
    doc.text(`Total Sessions: ${sessions.length}`, 14, 37);
    doc.text(`Total Students: ${studentStats.length}`, 14, 44);
    doc.text(`Average Attendance: ${studentStats.length > 0 
      ? Math.round(studentStats.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentStats.length)
      : 0}%`, 14, 51);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 58);
    
    const tableRows = filteredStudents.map(s => [
      s.matricNo,
      s.name,
      s.totalPresent.toString(),
      `${s.attendancePercentage}%`,
      s.attendanceGrade.label
    ]);

    autoTable(doc, {
      head: [["Matric No", "Student Name", "Present", "Percentage", "Grade"]],
      body: tableRows,
      startY: 65,
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 55 },
        2: { cellWidth: 25 },
        3: { cellWidth: 30 },
        4: { cellWidth: 25 }
      }
    });
    
    doc.save(filename);
  };

  // Remove student from course
  const handleRemoveStudent = async (student) => {
    try {
      // Delete all attendance records for this student in this course
      const { error: recordsError } = await supabase
        .from('attendance_records')
        .delete()
        .eq('student_id', student.id)
        .in('session_id', sessions.map(s => s.id));

      if (recordsError) throw recordsError;

      // Delete course enrollment
      const { error: enrollmentError } = await supabase
        .from('course_enrollments')
        .delete()
        .eq('course_id', courseId)
        .eq('student_id', student.id);

      if (enrollmentError) throw enrollmentError;

      // Refresh data
      await refetch();
      
    } catch (error) {
      console.error('Error removing student:', error);
      alert('Failed to remove student: ' + error.message);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
      
      <AttendanceHeader
        courseCode={courseInfo?.course_code}
        courseTitle={courseInfo?.course_title}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {viewMode === 'sessions' ? (
        <>
          <SessionSelector
            sessions={sessions}
            selectedSession={selectedSession}
            onSessionChange={setSelectedSession}
          />


{selectedSession && (
  <div className="space-y-4">
    {/* Stats Cards - Mobile Grid */}
    <div className="grid grid-cols-2 gap-2">
      <StatCardMobile 
        label="Present" 
        value={selectedSession.attendanceRecords?.length || 0} 
        icon={<User size={16} className="text-indigo-600" />}
        color="bg-indigo-50"
      />
      <StatCardMobile 
        label="Status" 
        value={selectedSession.is_active ? 'Active' : 'Closed'} 
        icon={<div className={`w-2 h-2 rounded-full ${selectedSession.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />}
        color={selectedSession.is_active ? 'bg-green-50' : 'bg-slate-50'}
      />
      <StatCardMobile 
        label="Start" 
        value={new Date(selectedSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
        icon={<Clock size={16} className="text-amber-600" />}
        color="bg-amber-50"
      />
      <button 
        onClick={exportSessionReport}
        className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md group"
      >
        <FileText size={16} className="mb-1 group-hover:scale-110 transition-transform" />
        <span className="text-[10px] uppercase font-bold">PDF</span>
      </button>
    </div>

    {/* Attendance Records */}
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-50 flex justify-between items-center">
        <h3 className="font-bold text-sm text-slate-800">Attendance Records</h3>
        <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
          {selectedSession.attendanceRecords?.length || 0} Present
        </span>
      </div>
      
      <AttendanceRecordsList
        records={selectedSession.attendanceRecords}
        locations={locations}
  onRemoveFromSession={handleRemoveFromSession}
  userRole={profile?.role}
      />
    </div>
  </div>
)}
        </>
      ) : (
        <div className="space-y-4">
          <StudentStatsCards
            totalStudents={studentStats.length}
            avgAttendance={studentStats.length > 0 
              ? Math.round(studentStats.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentStats.length)
              : 0}
            totalSessions={sessions.length}
            onExport={exportStudentReport}
          />

          <StudentFilters
            sortBy={sortBy}
            onSortChange={handleSortChange}
            filterAttendance={filterAttendance}
            onFilterChange={setFilterAttendance}
          />

          <StudentList
            students={filteredStudents}
            sessions={sessions}
            onRemoveStudent={handleRemoveStudent}
            userRole={profile?.role}
          />

          <LocationSummary
            locations={locations}
            studentStats={studentStats}
          />
        </div>
      )}
    </div>
  );
};

export default CourseAttendance;