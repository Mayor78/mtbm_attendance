import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, Clock, CalendarDays, MapPin, 
  Grid, List, ChevronLeft, ChevronRight,
  BookOpen, Award, TrendingUp
} from 'lucide-react';

const AttendanceHistory = ({ records, loading }) => {
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'table'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Sort records by date (newest first)
  const sortedRecords = useMemo(() => {
    return [...records].sort((a, b) => 
      new Date(b.scanned_at) - new Date(a.scanned_at)
    );
  }, [records]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = sortedRecords.length;
    const uniqueCourses = new Set(
      sortedRecords.map(r => r.attendance_sessions?.courses?.course_code)
    ).size;
    
    // Calculate attendance streak (simplified)
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < sortedRecords.length; i++) {
      const recordDate = new Date(sortedRecords[i].scanned_at);
      const diffDays = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) streak++;
      else break;
    }

    return { total, uniqueCourses, streak };
  }, [sortedRecords]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage);
  const paginatedRecords = sortedRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatRelativeTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        <p className="mt-3 text-sm text-gray-400">Loading history...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock size={24} className="text-gray-300" />
        </div>
        <h3 className="text-sm font-medium text-gray-900">No Attendance Records</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
          Your attendance history will appear here once you check in
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-lg font-semibold text-gray-900">{stats.total}</p>
          <p className="text-[10px] text-gray-400">Total Classes</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-lg font-semibold text-gray-900">{stats.uniqueCourses}</p>
          <p className="text-[10px] text-gray-400">Courses</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-lg font-semibold text-gray-900">{stats.streak}</p>
          <p className="text-[10px] text-gray-400">7-Day Streak</p>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {sortedRecords.length} {sortedRecords.length === 1 ? 'record' : 'records'} total
        </p>
        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('timeline')}
            className={`p-1.5 ${viewMode === 'timeline' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-400'}`}
          >
            <Clock size={16} />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-1.5 ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-400'}`}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'timeline' ? (
        // Timeline View
        <div className="space-y-2">
          {paginatedRecords.map((record) => {
            const session = record.attendance_sessions;
            const course = session?.courses;
            
            return (
              <div key={record.id} className="bg-white border border-gray-100 rounded-lg p-3">
                <div className="flex items-start gap-3">
                  {/* Status Icon */}
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 size={16} className="text-green-600" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-900">
                        {course?.course_code || 'Unknown'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full">
                        Present
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {course?.course_title || 'No Title'}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatRelativeTime(record.scanned_at)}
                      </span>
                      <span className="text-gray-400 flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(record.scanned_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Table View
        <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Course</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Time</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedRecords.map((record) => {
                  const session = record.attendance_sessions;
                  const course = session?.courses;
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {formatDate(record.scanned_at)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="text-xs font-medium text-gray-900">
                          {course?.course_code || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">
                          {course?.course_title || 'No Title'}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {formatTime(record.scanned_at)}
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-50 text-green-700 rounded-full text-[10px]">
                          <CheckCircle2 size={8} />
                          Present
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-6 h-6 text-xs rounded ${
                  currentPage === page
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Footer note */}
      {sortedRecords.length > 0 && (
        <p className="text-center text-[10px] text-gray-300 pt-2">
          {sortedRecords.length} total attendance records
        </p>
      )}
    </div>
  );
};

export default AttendanceHistory;