import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, ChevronDown, ChevronUp, BookOpen, Clock, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SessionDetailsModal from './SessionDetailsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SessionOverview = ({ courses, lecturerId }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [dateFilter, setDateFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // Fetch sessions with TanStack Query
  const { data: groupedSessions = {}, isLoading } = useQuery({
    queryKey: ['sessions', lecturerId, dateFilter, courseFilter],
    queryFn: async () => {
      if (!courses || courses.length === 0) return {};

      const courseIds = courses.map(c => c.id);
      
      // Fetch sessions
      const { data: sessions, error } = await supabase
        .from('attendance_sessions')
        .select(`
          *,
          attendance_records (
            id,
            student_id,
            scanned_at,
            marked_manually,
            manual_reason
          )
        `)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Apply date filter
      let filteredSessions = sessions || [];
      if (dateFilter !== 'all') {
        const now = new Date();
        const cutoff = new Date();
        if (dateFilter === 'week') cutoff.setDate(now.getDate() - 7);
        if (dateFilter === 'month') cutoff.setMonth(now.getMonth() - 1);
        filteredSessions = filteredSessions.filter(s => new Date(s.created_at) >= cutoff);
      }

      // Group by course
      const grouped = {};
      for (const session of filteredSessions) {
        const course = courses.find(c => c.id === session.course_id);
        if (!course) continue;

        if (!grouped[course.id]) {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('department', course.department)
            .eq('level', course.level);
          
          grouped[course.id] = {
            course,
            totalStudents: count || 0,
            sessions: []
          };
        }
        
        grouped[course.id].sessions.push({
          ...session,
          totalStudents: grouped[course.id].totalStudents
        });
      }

      return grouped;
    },
    enabled: courses.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Apply course filter
  const filteredGroupedSessions = Object.entries(groupedSessions).reduce((acc, [courseId, data]) => {
    if (courseFilter !== 'all' && courseId !== courseFilter) return acc;
    acc[courseId] = data;
    return acc;
  }, {});

  const toggleCourse = (courseId) => {
    setExpandedCourses(prev => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const handleViewDetails = (session, course) => {
    setSelectedSession(session);
    setSelectedCourse(course);
    setShowModal(true);
  };

  const handleExportCourse = (courseData) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text(`${courseData.course.course_code} - Sessions`, 14, 20);
    
    const tableRows = courseData.sessions.map(s => [
      new Date(s.created_at).toLocaleDateString(),
      new Date(s.start_time).toLocaleTimeString(),
      s.is_active ? 'Active' : 'Ended',
      `${s.attendance_records?.length || 0}/${courseData.totalStudents}`,
      `${Math.round((s.attendance_records?.length || 0) / courseData.totalStudents * 100)}%`
    ]);

    autoTable(doc, {
      head: [["Date", "Time", "Status", "Attendance", "Rate"]],
      body: tableRows,
      startY: 30,
      headStyles: { fillColor: [31, 41, 55] },
      styles: { fontSize: 9 }
    });
    
    doc.save(`${courseData.course.course_code}_sessions.pdf`);
  };

  const handleExportAll = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    let yOffset = 20;
    
    Object.values(filteredGroupedSessions).forEach((courseData, index) => {
      if (index > 0) {
        doc.addPage();
        yOffset = 20;
      }
      
      doc.setFontSize(14);
      doc.text(courseData.course.course_code, 14, yOffset);
      
      const tableRows = courseData.sessions.map(s => [
        new Date(s.created_at).toLocaleDateString(),
        new Date(s.start_time).toLocaleTimeString(),
        s.is_active ? 'Active' : 'Ended',
        `${s.attendance_records?.length || 0}/${courseData.totalStudents}`,
        `${Math.round((s.attendance_records?.length || 0) / courseData.totalStudents * 100)}%`
      ]);

      autoTable(doc, {
        head: [["Date", "Time", "Status", "Att", "Rate"]],
        body: tableRows,
        startY: yOffset + 10,
        headStyles: { fillColor: [31, 41, 55] },
        styles: { fontSize: 8 }
      });
      
      yOffset = doc.lastAutoTable.finalY + 10;
    });
    
    doc.save(`all_sessions.pdf`);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        </div>
        <p className="mt-3 text-sm text-gray-400">Loading sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <h2 className="text-sm font-medium text-gray-700">Sessions</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border-0 outline-none"
              >
                <option value="all">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>{course.course_code}</option>
                ))}
              </select>
              <div className="w-px bg-gray-200" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-white border-0 outline-none"
              >
                <option value="all">All Time</option>
                <option value="week">7 Days</option>
                <option value="month">30 Days</option>
              </select>
            </div>

            <button
              onClick={handleExportAll}
              className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              title="Export all"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Course Groups */}
      <div className="space-y-2">
        {Object.entries(filteredGroupedSessions).length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
            <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-500">No sessions found</p>
          </div>
        ) : (
          Object.entries(filteredGroupedSessions).map(([courseId, courseData]) => (
            <div key={courseId} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              {/* Course Header */}
              <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleCourse(courseId)}
              >
                <div className="flex items-center gap-3">
                  <BookOpen size={16} className="text-gray-400" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{courseData.course.course_code}</h3>
                    <p className="text-xs text-gray-400">
                      {courseData.sessions.length} sessions • {courseData.totalStudents} students
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleExportCourse(courseData); }}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <Download size={14} />
                  </button>
                  {expandedCourses[courseId] ? 
                    <ChevronUp size={18} className="text-gray-400" /> : 
                    <ChevronDown size={18} className="text-gray-400" />
                  }
                </div>
              </div>

              {/* Sessions List */}
              {expandedCourses[courseId] && (
                <div className="border-t border-gray-50">
                  {courseData.sessions.map(session => {
                    const attendanceCount = session.attendance_records?.length || 0;
                    const attendanceRate = Math.round((attendanceCount / courseData.totalStudents) * 100);

                    return (
                      <div 
                        key={session.id}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 text-xs">
                            <Calendar size={12} className="text-gray-400" />
                            <span>{new Date(session.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <Clock size={12} className="text-gray-400" />
                            <span>{new Date(session.start_time).toLocaleTimeString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4">
                          <div className="flex items-center gap-2">
                            <Users size={12} className="text-gray-400" />
                            <span className="text-xs">{attendanceCount}/{courseData.totalStudents}</span>
                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gray-900" 
                                style={{ width: `${attendanceRate}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              session.is_active 
                                ? 'bg-green-50 text-green-600' 
                                : 'bg-gray-50 text-gray-400'
                            }`}>
                              {session.is_active ? 'Active' : 'Ended'}
                            </span>
                            
                            <button
                              onClick={() => handleViewDetails(session, courseData.course)}
                              className="text-xs text-gray-400 hover:text-gray-600"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <SessionDetailsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        session={selectedSession}
        course={selectedCourse}
      />
    </div>
  );
};

export default SessionOverview;