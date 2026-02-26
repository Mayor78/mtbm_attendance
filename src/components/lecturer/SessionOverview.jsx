import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, ChevronDown, ChevronUp, BookOpen, Clock, Users, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import SessionDetailsModal from './SessionDetailsModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SessionOverview = ({ courses, lecturerId }) => {
  const [groupedSessions, setGroupedSessions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [dateFilter, setDateFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');

  // --- LOGIC PRESERVED ---
  useEffect(() => {
    fetchAllSessions();
  }, [courses]);

  const fetchAllSessions = async () => {
    if (!courses || courses.length === 0) return;
    setLoading(true);
    try {
      const courseIds = courses.map(c => c.id);
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select(`*, attendance_records (id, student_id, scanned_at, marked_manually, manual_reason)`)
        .in('course_id', courseIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped = {};
      for (const session of data || []) {
        const course = courses.find(c => c.id === session.course_id);
        if (course) {
          if (!grouped[course.id]) {
            const { count } = await supabase
              .from('students')
              .select('*', { count: 'exact', head: true })
              .eq('department', course.department)
              .eq('level', course.level);
            
            grouped[course.id] = {
              course: course,
              totalStudents: count || 0,
              sessions: []
            };
          }
          grouped[course.id].sessions.push({
            ...session,
            totalStudents: grouped[course.id].totalStudents
          });
        }
      }
      setGroupedSessions(grouped);
      const courseIds_list = Object.keys(grouped);
      if (courseIds_list.length > 0 && Object.keys(expandedCourses).length === 0) {
        setExpandedCourses({ [courseIds_list[0]]: true });
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroupedSessions = Object.entries(groupedSessions).reduce((acc, [courseId, data]) => {
    if (courseFilter !== 'all' && courseId !== courseFilter) return acc;
    const filteredSessions = data.sessions.filter(session => {
      if (dateFilter !== 'all') {
        const sessionDate = new Date(session.created_at);
        const now = new Date();
        if (dateFilter === 'week') {
          const weekAgo = new Date(now.setDate(now.getDate() - 7));
          if (sessionDate < weekAgo) return false;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
          if (sessionDate < monthAgo) return false;
        }
      }
      return true;
    });
    if (filteredSessions.length > 0) {
      acc[courseId] = { ...data, sessions: filteredSessions };
    }
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
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${courseData.course.course_code} - Session Report`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Course: ${courseData.course.course_title}`, 14, 30);
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
      startY: 60,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(`${courseData.course.course_code}_sessions.pdf`);
  };

  const handleExportAll = () => {
    const doc = new jsPDF();
    let yOffset = 30;
    Object.values(filteredGroupedSessions).forEach((courseData, index) => {
      if (index > 0) { doc.addPage(); yOffset = 20; }
      doc.text(`${courseData.course.course_code}`, 14, yOffset);
      const tableRows = courseData.sessions.map(s => [
        new Date(s.created_at).toLocaleDateString(),
        new Date(s.start_time).toLocaleTimeString(),
        s.is_active ? 'Active' : 'Ended',
        `${s.attendance_records?.length || 0}/${courseData.totalStudents}`
      ]);
      autoTable(doc, { head: [["Date", "Time", "Status", "Att"]], body: tableRows, startY: yOffset + 10 });
      yOffset = doc.lastAutoTable.finalY + 10;
    });
    doc.save(`all_sessions.pdf`);
  };
  // --- END LOGIC ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100">
        <div className="relative flex h-10 w-10">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-20"></span>
          <div className="relative inline-flex rounded-full h-10 w-10 border-t-2 border-indigo-600 animate-spin"></div>
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-widest text-gray-400">Syncing Sessions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Calendar className="text-indigo-600" size={22} strokeWidth={2.5} />
            Session Logs
          </h2>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Manage Historical Data</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="bg-transparent px-3 py-1.5 text-xs font-bold text-gray-600 outline-none"
            >
              <option value="all">All Courses</option>
              {courses.map(course => <option key={course.id} value={course.id}>{course.course_code}</option>)}
            </select>
            <div className="w-[1px] h-4 bg-gray-200" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent px-3 py-1.5 text-xs font-bold text-gray-600 outline-none"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>

          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-gray-200"
          >
            <Download size={14} />
            Export All
          </button>
        </div>
      </div>

      {/* Course Groups */}
      <div className="space-y-4">
        {Object.entries(filteredGroupedSessions).map(([courseId, courseData]) => (
          <div key={courseId} className="group bg-white rounded-3xl border border-gray-100 overflow-hidden hover:border-indigo-100 transition-all shadow-sm">
            <div 
              className={`p-5 cursor-pointer transition-colors ${expandedCourses[courseId] ? 'bg-indigo-50/30' : 'bg-white'}`}
              onClick={() => toggleCourse(courseId)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl transition-all ${expandedCourses[courseId] ? 'bg-indigo-600 text-white rotate-12' : 'bg-gray-50 text-gray-400'}`}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 leading-none">{courseData.course.course_code}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1.5 uppercase tracking-tighter">
                      {courseData.sessions.length} Sessions • {courseData.totalStudents} Students
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                   <button
                    onClick={(e) => { e.stopPropagation(); handleExportCourse(courseData); }}
                    className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-indigo-600 hover:border-indigo-200 transition-all"
                  >
                    <Download size={14} /> Report
                  </button>
                  <div className={`p-2 rounded-full transition-transform duration-300 ${expandedCourses[courseId] ? 'rotate-180 bg-indigo-100 text-indigo-600' : 'text-gray-300'}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>
            </div>

            {expandedCourses[courseId] && (
              <div className="p-4 sm:p-6 bg-white border-t border-gray-50 space-y-3">
                {courseData.sessions.map(session => (
                  <div 
                    key={session.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-all gap-4"
                  >
                    <div className="flex items-center gap-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                          <Calendar size={12} className="text-indigo-500" />
                          {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                          <Clock size={12} />
                          {new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="h-8 w-[1px] bg-gray-100 hidden sm:block" />

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-black text-gray-900 uppercase">
                          <Users size={12} className="text-indigo-500" />
                          {session.attendance_records?.length || 0} / {courseData.totalStudents}
                        </div>
                        <div className="w-16 h-1 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-indigo-500" 
                            style={{ width: `${Math.round((session.attendance_records?.length || 0) / courseData.totalStudents * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-0 border-gray-50">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        session.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                      }`}>
                        {session.is_active ? 'Active' : 'Ended'}
                      </span>
                      
                      <button
                        onClick={() => handleViewDetails(session, courseData.course)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all group/btn"
                      >
                        Details
                        <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
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