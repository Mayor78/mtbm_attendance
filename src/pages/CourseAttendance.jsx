import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, Calendar, Users, Clock, 
  CheckCircle, FileText, RefreshCcw, ChevronRight,
  MapPin, Map, Loader, BarChart2, Award, TrendingUp,
  UserCheck, UserX, Eye, Filter
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCourseAttendance } from '../hooks/useAttendance';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Cache for location addresses (using plain object instead of Map)
const locationCache = {};

export const CourseAttendance = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { sessions, loading, error, refetch } = useCourseAttendance(courseId);
  const [selectedSession, setSelectedSession] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [locations, setLocations] = useState({});
  const [loadingLocations, setLoadingLocations] = useState({});
  const [viewMode, setViewMode] = useState('sessions'); // 'sessions' or 'students'
  const [studentStats, setStudentStats] = useState([]);
  const [sortBy, setSortBy] = useState('name'); // 'name', 'attendance', 'percentage'
  const [filterAttendance, setFilterAttendance] = useState('all'); // 'all', 'high', 'medium', 'low'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const fetchCourseInfo = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (data) setCourseInfo(data);
  };

  const calculateStudentStats = () => {
    // Use object instead of Map
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
    
    // Convert object to array
    const stats = Object.values(studentMap).map(student => ({
      ...student,
      attendancePercentage: sessions.length > 0 ? Math.round((student.totalPresent / sessions.length) * 100) : 0,
      attendanceGrade: getAttendanceGrade(sessions.length > 0 ? student.totalPresent / sessions.length : 0)
    }));
    
    // Sort based on current sortBy
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
        case 'name':
          return a.name.localeCompare(b.name);
        case 'attendance':
          return b.totalPresent - a.totalPresent;
        case 'percentage':
          return b.attendancePercentage - a.attendancePercentage;
        default:
          return a.name.localeCompare(b.name);
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
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${record.location_lat}&lon=${record.location_lng}&zoom=18&addressdetails=1`,
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
        
        const displayAddress = address || data.display_name?.split(',').slice(0, 3).join(',') || 'Unknown location';
        locationCache[cacheKey] = displayAddress;
        setLocations(prev => ({ ...prev, [record.id]: displayAddress }));
        
      } catch (error) {
        console.error('Error getting location address:', error);
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
    
    // Title
    doc.setFontSize(18);
    doc.text(`${courseInfo.course_code} - Session Attendance Report`, 14, 20);
    
    // Course Info
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
    
    // Attendance Records Table
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
    
    // Title
    doc.setFontSize(18);
    doc.text(`${courseInfo.course_code} - Student Attendance Report`, 14, 20);
    
    // Course Info
    doc.setFontSize(11);
    doc.text(`Course: ${courseInfo.course_title}`, 14, 30);
    doc.text(`Total Sessions: ${sessions.length}`, 14, 37);
    doc.text(`Total Students: ${studentStats.length}`, 14, 44);
    doc.text(`Average Attendance: ${studentStats.length > 0 
      ? Math.round(studentStats.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentStats.length)
      : 0}%`, 14, 51);
    doc.text(`Generated: ${now.toLocaleString()}`, 14, 58);
    
    // Students Table
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

  const getAccuracyDescription = (accuracy) => {
    if (!accuracy) return null;
    if (accuracy < 10) return 'High accuracy';
    if (accuracy < 30) return 'Medium accuracy';
    if (accuracy < 100) return 'Low accuracy';
    return 'Poor accuracy';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24">
      
      {/* Navigation & Title - Mobile Optimized */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <Link 
            to="/dashboard" 
            className="mt-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex-shrink-0"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-tight truncate">
              {courseInfo?.course_code}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
              {courseInfo?.course_title}
            </p>
          </div>
        </div>
        
        {/* Mobile-optimized view toggle */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full">
            <button
              onClick={() => setViewMode('sessions')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                viewMode === 'sessions' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600'
              }`}
            >
              <Calendar size={14} />
              <span className="hidden xs:inline">Sessions</span>
            </button>
            <button
              onClick={() => setViewMode('students')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1 ${
                viewMode === 'students' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600'
              }`}
            >
              <Users size={14} />
              <span className="hidden xs:inline">Students</span>
            </button>
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all flex-shrink-0"
          >
            <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* View Mode Content */}
      {viewMode === 'sessions' ? (
        /* SESSIONS VIEW - Mobile Optimized */
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Attendance Sessions
            </label>
            <div className="relative">
              <select
                value={selectedSession?.id || ''}
                onChange={(e) => setSelectedSession(sessions.find(s => s.id === e.target.value))}
                className="w-full bg-slate-50 border-none rounded-xl py-3 pl-4 pr-10 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
              >
                <option value="">Select a session</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {new Date(session.created_at).toLocaleDateString('en-US', {year: "numeric" ,month: 'short', day: 'numeric' })}
                    
                    {session.is_active ? ' Active' : 'Ended'} 
                    ({session.attendanceRecords?.length || 0})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight size={16} className="rotate-90" />
              </div>
            </div>
          </div>

          {selectedSession && (
            <div className="space-y-4">
              {/* Stats Cards - Mobile Grid */}
              <div className="grid grid-cols-2 gap-2">
                <StatCardMobile 
                  label="Present" 
                  value={selectedSession.attendanceRecords?.length || 0} 
                  icon={<Users size={16} className="text-indigo-600" />}
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

              {/* Attendance Records - Mobile Optimized Card View */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-slate-800">Attendance Records</h3>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                    {selectedSession.attendanceRecords?.length || 0} Present
                  </span>
                </div>
                
                {/* Mobile Card View - Visible on small screens */}
                <div className="block sm:hidden divide-y divide-slate-100">
                  {selectedSession.attendanceRecords?.map((record) => (
                    <div key={record.id} className="p-4 space-y-2 hover:bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-slate-900 text-sm">
                            {record.student_name || record.students?.profiles?.full_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {record.matric_no || record.students?.matric_no}
                          </p>
                        </div>
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                          {new Date(record.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {record.location_lat && (
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg">
                          <MapPin size={12} className="text-indigo-500 flex-shrink-0" />
                          <span className="truncate">
                            {locations[record.id] || 'Loading location...'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table View - Hidden on mobile */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr>
                        <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Student</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Matric No</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Time</th>
                        <th className="px-4 py-3 text-xs font-bold text-slate-400 uppercase">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {selectedSession.attendanceRecords?.map((record) => (
                        <tr key={record.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-sm">
                            {record.student_name || record.students?.profiles?.full_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {record.matric_no || record.students?.matric_no}
                          </td>
                          <td className="px-4 py-3 text-sm text-indigo-600">
                            {new Date(record.scanned_at).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {record.location_lat ? (
                              locations[record.id] || 'Loading...'
                            ) : (
                              <span className="text-slate-400">No location</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* STUDENTS VIEW - Mobile Optimized */
        <div className="space-y-4">
          {/* Summary Stats - Mobile Grid */}
          <div className="grid grid-cols-2 gap-2">
            <StatCardMobile 
              label="Total" 
              value={studentStats.length} 
              icon={<Users size={16} className="text-indigo-600" />}
              color="bg-indigo-50"
            />
            <StatCardMobile 
              label="Avg %" 
              value={studentStats.length > 0 
                ? Math.round(studentStats.reduce((acc, s) => acc + s.attendancePercentage, 0) / studentStats.length) + '%'
                : '0%'} 
              icon={<TrendingUp size={16} className="text-green-600" />}
              color="bg-green-50"
            />
            <StatCardMobile 
              label="Sessions" 
              value={sessions.length} 
              icon={<Calendar size={16} className="text-purple-600" />}
              color="bg-purple-50"
            />
            <button
              onClick={exportStudentReport}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md"
            >
              <Download size={16} className="mb-1" />
              <span className="text-[10px] uppercase font-bold">Export</span>
            </button>
          </div>

          {/* Filters - Mobile Optimized */}
          <div className="flex flex-wrap gap-2">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="name">Sort: Name</option>
              <option value="attendance">Sort: Count</option>
              <option value="percentage">Sort: %</option>
            </select>
            
            <select
              value={filterAttendance}
              onChange={(e) => setFilterAttendance(e.target.value)}
              className="flex-1 min-w-[120px] px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Students</option>
              <option value="high">High (75%+)</option>
              <option value="medium">Medium (50-74%)</option>
              <option value="low">Low (below 50%)</option>
            </select>
          </div>

          {/* Students List - Mobile Card View */}
          <div className="space-y-2">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-slate-900 text-sm">{student.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{student.matricNo}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${student.attendanceGrade.bg} ${student.attendanceGrade.color}`}>
                    {student.attendanceGrade.label}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Present</p>
                    <p className="text-sm font-semibold text-indigo-600">
                      {student.totalPresent} <span className="text-xs text-slate-400">/ {sessions.length}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase">Percentage</p>
                    <div className="flex items-center gap-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-600 rounded-full"
                          style={{ width: `${student.attendancePercentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700">
                        {student.attendancePercentage}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between text-[10px] text-slate-400">
                  <span>First: {new Date(student.firstAttendance).toLocaleDateString()}</span>
                  <span>Last: {new Date(student.lastAttendance).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Location Summary - Mobile Optimized */}
          {studentStats.some(s => s.locations.length > 0) && (
            <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Map size={14} className="text-indigo-600" />
                <h4 className="text-xs font-semibold text-indigo-900">Check-in Locations</h4>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Array.from(new Set(
                  studentStats
                    .flatMap(s => s.locations)
                    .filter(l => locations[l.time])
                    .map(l => locations[l.time].split(',')[0].trim())
                )).slice(0, 6).map((area, i) => (
                  <span key={i} className="text-[10px] bg-white rounded-full px-2 py-1 text-indigo-700 border border-indigo-100">
                    📍 {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Mobile-optimized Stat Card
const StatCardMobile = ({ label, value, icon, color }) => (
  <div className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2 ${color}`}>
    <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-900 truncate">{value}</p>
    </div>
  </div>
);

// Desktop Stat Card (kept for reference)
const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
    <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-slate-900 truncate">{value}</p>
    </div>
  </div>
);