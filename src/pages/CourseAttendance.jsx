import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, Calendar, Users, Clock, 
  CheckCircle, FileText, RefreshCcw, ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCourseAttendance } from '../hooks/useAttendance';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const CourseAttendance = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { sessions, loading, error, refetch } = useCourseAttendance(courseId);
  const [selectedSession, setSelectedSession] = useState(null);
  const [courseInfo, setCourseInfo] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchCourseInfo();
  }, [courseId]);

  const fetchCourseInfo = async () => {
    const { data } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();
    if (data) setCourseInfo(data);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const exportToPDF = () => {
    if (!selectedSession || !courseInfo) return;
    const records = selectedSession.attendanceRecords || [];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `${courseInfo.course_code}_${dateStr}.pdf`;
    
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`${courseInfo.course_code} - ${courseInfo.course_title}`, 14, 20);
    doc.setFontSize(10);
    doc.text(`Session: ${new Date(selectedSession.created_at).toLocaleString()}`, 14, 30);
    doc.text(`Total Present: ${records.length}`, 14, 35);
    
    const tableRows = records
      .sort((a, b) => new Date(a.scanned_at) - new Date(b.scanned_at))
      .map(r => [
        r.matric_no || r.students?.matric_no || 'N/A',
        r.student_name || r.students?.profiles?.full_name || 'N/A',
        new Date(r.scanned_at).toLocaleTimeString()
      ]);

    autoTable(doc, {
      head: [["Matric No", "Student Name", "Time"]],
      body: tableRows,
      startY: 45,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(filename);
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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      
      {/* Navigation & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Link 
            to="/dashboard" 
            className="mt-1 p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
              {courseInfo?.course_code}
            </h1>
            <p className="text-sm text-slate-500 font-medium truncate max-w-[250px] sm:max-w-none">
              {courseInfo?.course_title}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
        >
          <RefreshCcw size={16} className={`${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Session Selection Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Attendance Sessions
        </label>
        <div className="relative">
          <select
            value={selectedSession?.id || ''}
            onChange={(e) => setSelectedSession(sessions.find(s => s.id === e.target.value))}
            className="w-full bg-slate-50 border-none rounded-xl py-3 pl-4 pr-10 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
          >
            <option value="">Select a date to view records</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {new Date(session.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                {session.is_active ? ' — 🟢 Active' : ' — ⚪ Ended'}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronRight size={18} className="rotate-90" />
          </div>
        </div>
      </div>

      {selectedSession ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard 
              label="Students" 
              value={selectedSession.attendanceRecords?.length || 0} 
              icon={<Users className="text-indigo-600" size={20} />}
              color="bg-indigo-50"
            />
            <StatCard 
              label="Status" 
              value={selectedSession.is_active ? 'Active' : 'Closed'} 
              icon={<div className={`w-2.5 h-2.5 rounded-full ${selectedSession.is_active ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />}
              color={selectedSession.is_active ? 'bg-green-50' : 'bg-slate-50'}
            />
            <StatCard 
              label="Start Time" 
              value={new Date(selectedSession.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
              icon={<Calendar className="text-amber-600" size={20} />}
              color="bg-amber-50"
            />
            <button 
              onClick={exportToPDF}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md group"
            >
              <FileText size={20} className="mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-bold tracking-tighter">Export PDF</span>
            </button>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Verified Attendees</h3>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                {selectedSession.attendanceRecords?.length || 0} Total
              </span>
            </div>

            {/* Desktop Table / Mobile List toggle */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Matric No</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right sm:text-left">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {selectedSession.attendanceRecords?.length > 0 ? (
                    [...selectedSession.attendanceRecords]
                      .sort((a, b) => new Date(a.scanned_at) - new Date(b.scanned_at))
                      .map((record) => (
                        <tr key={record.id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-slate-900">
                                {record.student_name || record.students?.profiles?.full_name || 'Anonymous'}
                              </span>
                              <span className="sm:hidden text-xs text-slate-500">
                                {record.matric_no || record.students?.matric_no}
                              </span>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-6 py-4 text-sm font-medium text-slate-600">
                            {record.matric_no || record.students?.matric_no}
                          </td>
                          <td className="px-6 py-4 text-right sm:text-left">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                              <Clock size={12} />
                              {new Date(record.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center opacity-40">
                          <Users size={40} className="mb-2" />
                          <p className="text-sm font-medium">No one has checked in yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
          <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
          <h2 className="text-slate-900 font-bold">No Session Selected</h2>
          <p className="text-slate-500 text-sm mt-1">Pick a date above to view the attendance log.</p>
        </div>
      )}
    </div>
  );
};

// Sub-component for clean stats
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