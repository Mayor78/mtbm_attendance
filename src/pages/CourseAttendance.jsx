import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Download, Calendar, Users, Clock, 
  CheckCircle, FileText, RefreshCcw, ChevronRight,
  MapPin, Map, Loader
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

  useEffect(() => {
    fetchCourseInfo();
  }, [courseId]);

  useEffect(() => {
    if (selectedSession?.attendanceRecords) {
      // Make sure attendanceRecords is an array
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Reverse geocoding function with safe array handling
  const getHumanReadableAddress = async (records) => {
    // Ensure records is an array
    if (!records || !Array.isArray(records) || records.length === 0) return;
    
    // Filter records that need geocoding
    const recordsToGeocode = records.filter(record => {
      if (!record?.location_lat || !record?.location_lng) return false;
      const cacheKey = `${record.location_lat},${record.location_lng}`;
      return !locationCache[cacheKey] && !loadingLocations[record.id];
    });

    if (recordsToGeocode.length === 0) return;

    // Process them one by one with delay
    for (let i = 0; i < recordsToGeocode.length; i++) {
      const record = recordsToGeocode[i];
      
      // Wait 1 second between requests (respects Nominatim policy)
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
        
        // Format the address
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
        
        // Cache it
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

  const exportToPDF = () => {
    if (!selectedSession || !courseInfo) return;
    
    // Ensure attendanceRecords is an array
    const records = Array.isArray(selectedSession.attendanceRecords) 
      ? selectedSession.attendanceRecords 
      : [];
      
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const filename = `${courseInfo.course_code}_${dateStr}_attendance.pdf`;
    
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
        new Date(r.scanned_at).toLocaleTimeString(),
        r.location_lat && r.location_lng 
          ? `${r.location_lat.toFixed(4)}, ${r.location_lng.toFixed(4)}`
          : 'No location'
      ]);

    autoTable(doc, {
      head: [["Matric No", "Student Name", "Time", "Location"]],
      body: tableRows,
      startY: 45,
      headStyles: { fillColor: [79, 70, 229] }
    });
    doc.save(filename);
  };

  // Helper function to get accuracy description
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      
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

            {/* Desktop Table with Location */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                    <th className="hidden sm:table-cell px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Matric No</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Location</th>
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
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">
                              <Clock size={12} />
                              {new Date(record.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-start gap-2">
                              <MapPin size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
                              <div className="flex flex-col">
                                {record.location_lat && record.location_lng ? (
                                  <>
                                    {loadingLocations[record.id] ? (
                                      <div className="flex items-center gap-1 text-xs text-slate-400">
                                        <Loader size={12} className="animate-spin" />
                                        <span>Getting location...</span>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="text-xs font-medium text-slate-700">
                                          {locations[record.id] || `${record.location_lat.toFixed(4)}°, ${record.location_lng.toFixed(4)}°`}
                                        </span>
                                        {record.location_accuracy && (
                                          <span className="text-[10px] text-slate-400">
                                            {getAccuracyDescription(record.location_accuracy)} (±{Math.round(record.location_accuracy)}m)
                                          </span>
                                        )}
                                      </>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-xs text-slate-400">No location data</span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
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

          {/* Location Summary */}
          {selectedSession.attendanceRecords?.some(r => r.location_lat) && (
            <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Map size={18} className="text-indigo-600" />
                <h4 className="font-semibold text-indigo-900">Location Summary</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(new Set(
                  selectedSession.attendanceRecords
                    .filter(r => r.location_lat && locations[r.id])
                    .map(r => locations[r.id].split(',')[0].trim())
                )).slice(0, 5).map((area, i) => (
                  <div key={i} className="text-xs bg-white/80 rounded-lg px-3 py-2 text-indigo-700 border border-indigo-100">
                    📍 {area}
                  </div>
                ))}
              </div>
            </div>
          )}
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