import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCourseAttendance } from '../hooks/useAttendance';
import { useLocation } from '../hooks/useLocation';
import { useGeocoding } from '../hooks/useGeocoding';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Import components
import LoadingSpinner from '../components/common/LoadingSpinner';
import AttendanceHeader from '../components/attendance/AttendanceHeader';
import SessionSelector from '../components/attendance/SessionSelector';
import AttendanceRecordsList from '../components/attendance/AttendanceRecordsList';
import StudentStatsCards from '../components/attendance/StudentStatsCards';
import StudentFilters from '../components/attendance/StudentFilters';
import StudentList from '../components/attendance/StudentList';
import LocationSummary from '../components/attendance/LocationSummary';
import StatCardMobile from '../components/attendance/StatCard';
import { Clock, FileText, User } from 'lucide-react';

export const CourseAttendance = () => {
  const { courseId } = useParams();
  const { profile } = useAuth();
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('sessions');
  const [sortBy, setSortBy] = useState('name');
  const [filterAttendance, setFilterAttendance] = useState('all');

  // Use TanStack Query hooks
  const { 
    course,
    sessions,
    profiles,
    isLoading,
    deleteAttendance,
    refetch
  } = useCourseAttendance(courseId);

  // Use location hook
  const { 
    getCurrentLocation
  } = useLocation();

  // Geocoding for selected session
  const { locations } = useGeocoding(
    selectedSession?.attendanceRecords
  );

  // Debug logging
  useEffect(() => {
    console.log('🔍 CourseAttendance Debug:');
    console.log('- course:', course);
    console.log('- sessions:', sessions);
    console.log('- selectedSession:', selectedSession);
    console.log('- isLoading:', isLoading);
  }, [course, sessions, selectedSession, isLoading]);

  // Calculate student stats
  const studentStats = useMemo(() => 
    calculateStudentStats(sessions), 
    [sessions]
  );

  const filteredStudents = useMemo(() => 
    filterStudents(studentStats, filterAttendance, sortBy),
    [studentStats, filterAttendance, sortBy]
  );

  // Preload location when component mounts
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSessionChange = (session) => {
    console.log('📅 Session selected:', session);
    setSelectedSession(session);
  };

  const handleRemoveFromSession = async (record) => {
  if (!deleteAttendance) {
    console.error('deleteAttendance is not available');
    alert('Delete function not available');
    return;
  }
  
  try {
    await deleteAttendance(record.id);
    // The data will auto-refresh from the hook
  } catch (error) {
    console.error('Error removing student:', error);
    alert('Failed to remove student: ' + error.message);
  }
};

  const handleRefresh = () => {
    refetch();
  };

const exportSessionReport = () => {
  console.log('📄 Exporting session report...');
  if (!selectedSession) {
    alert('Please select a session first');
    return;
  }
  if (!course) {
    alert('Course data not available');
    return;
  }

  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const sessionDate = new Date(selectedSession.created_at).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    }).replace(/\s/g, '_');
    
    const filename = `${course.course_code}_session_${sessionDate}_${dateStr}.pdf`;
    
    // Use landscape for better width
    const doc = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: 'a4' 
    });
    
    // Header Section - Bolder
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${course.course_code} - Session Attendance Report`, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Course: ${course.course_title}`, 14, 30);
    doc.text(`Date: ${new Date(selectedSession.created_at).toLocaleDateString()}`, 14, 36);
    doc.text(`Time: ${new Date(selectedSession.start_time).toLocaleTimeString()}`, 14, 42);
    doc.text(`Total Present: ${selectedSession.attendanceRecords?.length || 0}`, 14, 48);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 54);
    
    const records = selectedSession.attendanceRecords || [];
    
    const tableRows = records.map((record, index) => {
      let studentName = record.student_name || record.students?.profiles?.full_name || record.students?.full_name || 'Unknown';
      let matricNo = record.matric_no || record.students?.matric_no || 'N/A';

      // Clean and format matric number
      matricNo = String(matricNo).replace(/\s+/g, ' ').trim();
      
      // Hide first part of matric number, show only last 4 characters
      // Example: "2025/MTBM/HND/302" becomes "********302"
      const hiddenMatric = maskMatricNumber(matricNo);

      let locationText = 'No Location';
      if (record.location_lat && record.location_lng) {
        const rawLoc = locations && locations[record.id] ? locations[record.id] : `${record.location_lat.toFixed(4)}, ${record.location_lng.toFixed(4)}`;
        // Shorten if needed but keep readable
        locationText = rawLoc.length > 40 ? rawLoc.split(',').slice(0, 2).join(',') + '...' : rawLoc;
      }

      return [
        (index + 1).toString(),
        studentName,
        hiddenMatric, // Use hidden version
        new Date(record.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        locationText
      ];
    });

    autoTable(doc, {
      head: [["S/N", "Student Name", "Matric No", "Time", "Location"]],
      body: tableRows,
      startY: 62,
      headStyles: { 
        fillColor: [31, 41, 55], 
        textColor: 255, 
        fontStyle: 'bold', 
        fontSize: 10, // Increased from 9
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0]
      },
      styles: { 
        fontSize: 9, // Increased from 8
        cellPadding: 3, // Slightly more padding
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, // S/N bold
        1: { cellWidth: 60, fontStyle: 'bold' }, // Name - bold
        2: { cellWidth: 45, halign: 'center', fontStyle: 'bold', font: 'courier' }, // Matric - bold, monospace
        3: { cellWidth: 25, halign: 'center', fontStyle: 'bold' }, // Time - bold
        4: { cellWidth: 'auto', fontStyle: 'normal' } // Location (normal weight)
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      },
      didDrawPage: (data) => {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
      }
    });
    
    doc.save(filename);
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Failed to generate PDF.');
  }
};

const exportStudentReport = () => {
  if (!course || studentStats.length === 0) {
    alert('No student data available');
    return;
  }

  try {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `${course.course_code}_summary_${dateStr}.pdf`;
    
    // Use landscape for better width
    const doc = new jsPDF({ 
      orientation: 'landscape', 
      unit: 'mm', 
      format: 'a4' 
    });
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${course.course_code} - Cumulative Report`, 14, 20);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Course: ${course.course_title}`, 14, 30);
    doc.text(`Total Sessions: ${sessions.length}`, 14, 37);
    doc.text(`Average Attendance: ${studentStats.length > 0 ? Math.round(studentStats.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentStats.length) : 0}%`, 14, 44);
    
    const studentsToExport = filteredStudents.length > 0 ? filteredStudents : studentStats;
    
    const tableRows = studentsToExport.map((s, index) => {
      // Get name safely
      let studentName = 'Unknown';
      if (s.name) studentName = s.name;
      else if (s.full_name) studentName = s.full_name;
      else if (s.student_name) studentName = s.student_name;
      else if (s.profiles?.full_name) studentName = s.profiles.full_name;
      
      // Get matric number and mask it
      let matricNo = 'N/A';
      if (s.matricNo) matricNo = String(s.matricNo).replace(/\s+/g, ' ').trim();
      else if (s.matric_no) matricNo = String(s.matric_no).replace(/\s+/g, ' ').trim();
      
      // Hide first part of matric number, show only last 4 characters
      const hiddenMatric = maskMatricNumber(matricNo);
      
      // Get present count
      let present = '0';
      if (s.totalPresent !== undefined) present = s.totalPresent.toString();
      else if (s.presentCount !== undefined) present = s.presentCount.toString();
      
      // Get percentage
      let percentage = '0%';
      if (s.attendancePercentage !== undefined) percentage = `${s.attendancePercentage}%`;
      else if (s.percentage !== undefined) percentage = `${s.percentage}%`;
      
      // Get grade
      let grade = 'N/A';
      if (s.attendanceGrade?.label) grade = s.attendanceGrade.label;
      else if (s.grade) grade = s.grade;

      return [
        (index + 1).toString(),
        hiddenMatric,
        studentName,
        present,
        percentage,
        grade
      ];
    });

    autoTable(doc, {
      head: [["S/N", "Matric No", "Student Name", "Pres.", "%", "Grade"]],
      body: tableRows,
      startY: 55,
      headStyles: { 
        fillColor: [31, 41, 55], 
        textColor: 255,
        fontSize: 10, // Increased
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.5
      },
      styles: { 
        fontSize: 9, // Increased
        cellPadding: 3,
        overflow: 'linebreak',
        valign: 'middle',
        lineColor: [200, 200, 200],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, // S/N bold
        1: { cellWidth: 40, halign: 'center', fontStyle: 'bold', font: 'courier' }, // Matric - bold, monospace
        2: { cellWidth: 70, fontStyle: 'bold' }, // Student Name - bold
        3: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // Present - bold
        4: { cellWidth: 15, halign: 'center', fontStyle: 'bold' }, // Percentage - bold
        5: { cellWidth: 25, halign: 'center', fontStyle: 'bold' } // Grade - bold
      },
      alternateRowStyles: {
        fillColor: [245, 245, 250]
      }
    });
    
    doc.save(filename);
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to generate PDF.');
  }
};

// Helper function to mask matric number (show only last 4 characters)
const maskMatricNumber = (matricNo) => {
  if (!matricNo || matricNo === 'N/A') return 'N/A';
  
  const matricStr = String(matricNo);
  const lastFour = matricStr.slice(-4);
  
  if (matricStr.length <= 4) return matricStr;
  
  // Create masked version with asterisks
  const masked = '*'.repeat(Math.min(matricStr.length - 4, 8)) + lastFour;
  return masked;
};


  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
      
      <AttendanceHeader
        courseCode={course?.course_code}
        courseTitle={course?.course_title}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={handleRefresh}
        isRefreshing={false}
      />

      {viewMode === 'sessions' ? (
        <>
          <SessionSelector
            sessions={sessions}
            selectedSession={selectedSession}
            onSessionChange={handleSessionChange}
          />

          {selectedSession && (
            <div className="space-y-4">
              {/* Stats Cards */}
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
                  profiles={profiles}
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
            onSortChange={setSortBy}
            filterAttendance={filterAttendance}
            onFilterChange={setFilterAttendance}
          />

          <StudentList
            students={filteredStudents}
            sessions={sessions}
            onRemoveStudent={() => {}}
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

// Helper functions (keep these the same)
const calculateStudentStats = (sessions) => {
  const studentMap = {};
  
  sessions.forEach(session => {
    const records = session.attendanceRecords || [];
    records.forEach(record => {
      const studentId = record.student_id;
      
      // IMPROVED: Better name extraction with multiple fallbacks
      let studentName = 'Unknown';
      if (record.student_name) {
        studentName = record.student_name;
      } else if (record.students?.profiles?.full_name) {
        studentName = record.students.profiles.full_name;
      } else if (record.students?.full_name) {
        studentName = record.students.full_name;
      } else if (record.profiles?.full_name) {
        studentName = record.profiles.full_name;
      }
      
      // IMPROVED: Better matric extraction
      let matricNo = 'N/A';
      if (record.matric_no) {
        matricNo = record.matric_no;
      } else if (record.students?.matric_no) {
        matricNo = record.students.matric_no;
      }
      
      console.log(`👤 Student ${studentId}: name="${studentName}", matric="${matricNo}"`);
      
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
      } else {
        // Update name if we have a better one
        const existing = studentMap[studentId];
        if (existing.name === 'Unknown' && studentName !== 'Unknown') {
          existing.name = studentName;
        }
        if (existing.matricNo === 'N/A' && matricNo !== 'N/A') {
          existing.matricNo = matricNo;
        }
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
  
  console.log('📊 Final student stats:', stats);
  return stats;
};

const getAttendanceGrade = (ratio) => {
  if (ratio >= 0.9) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
  if (ratio >= 0.75) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
  if (ratio >= 0.5) return { label: 'Average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
  return { label: 'Poor', color: 'text-red-600', bg: 'bg-red-100' };
};

const filterStudents = (students, filter, sortBy) => {
  let filtered = students;
  
  if (filter !== 'all') {
    filtered = students.filter(student => {
      if (filter === 'high') return student.attendancePercentage >= 75;
      if (filter === 'medium') return student.attendancePercentage >= 50 && student.attendancePercentage < 75;
      if (filter === 'low') return student.attendancePercentage < 50;
      return true;
    });
  }
  
  return filtered.sort((a, b) => {
    switch(sortBy) {
      case 'name': return a.name.localeCompare(b.name);
      case 'attendance': return b.totalPresent - a.totalPresent;
      case 'percentage': return b.attendancePercentage - a.attendancePercentage;
      default: return a.name.localeCompare(b.name);
    }
  });
};

export default CourseAttendance;