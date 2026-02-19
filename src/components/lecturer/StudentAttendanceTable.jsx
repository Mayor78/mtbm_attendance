import React, { useState } from 'react';
import StatusBadge from '../common/StatusBadge';
import Button from '../common/Button';

const StudentAttendanceTable = ({
  courseCode = 'CS101',
  showFilters = true,
  onViewDetails,
  className = ''
}) => {
  const [filter, setFilter] = useState('all'); // 'all', 'present', 'absent', 'late'
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'semester'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'course', 'status'

  const attendanceData = [
    {
      id: 1,
      course: 'Introduction to Programming',
      courseCode: 'CS101',
      date: '2024-01-15',
      day: 'Monday',
      time: '10:00 AM - 11:30 AM',
      status: 'present',
      checkInTime: '10:02 AM',
      checkInMethod: 'QR Scan',
      lecturer: 'Dr. Sarah Smith',
      topic: 'Variables and Data Types',
      notes: '',
      duration: '1.5 hours'
    },
    {
      id: 2,
      course: 'Calculus II',
      courseCode: 'MATH202',
      date: '2024-01-15',
      day: 'Monday',
      time: '2:00 PM - 4:00 PM',
      status: 'present',
      checkInTime: '2:00 PM',
      checkInMethod: 'Numeric Code',
      lecturer: 'Prof. Robert Johnson',
      topic: 'Integration Techniques',
      notes: '',
      duration: '2 hours'
    },
    {
      id: 3,
      course: 'Physics Fundamentals',
      courseCode: 'PHY101',
      date: '2024-01-14',
      day: 'Sunday',
      time: '11:00 AM - 1:00 PM',
      status: 'absent',
      checkInTime: null,
      checkInMethod: null,
      lecturer: 'Dr. Michael Williams',
      topic: 'Newton\'s Laws',
      notes: 'Medical emergency - submitted note',
      duration: '2 hours'
    },
    {
      id: 4,
      course: 'English Literature',
      courseCode: 'ENG205',
      date: '2024-01-14',
      day: 'Sunday',
      time: '9:00 AM - 10:30 AM',
      status: 'late',
      checkInTime: '9:20 AM',
      checkInMethod: 'QR Scan',
      lecturer: 'Prof. Jennifer Brown',
      topic: 'Shakespearean Sonnets',
      notes: 'Traffic delay',
      duration: '1.5 hours'
    },
    {
      id: 5,
      course: 'Data Structures',
      courseCode: 'CS201',
      date: '2024-01-13',
      day: 'Saturday',
      time: '10:00 AM - 12:00 PM',
      status: 'present',
      checkInTime: '10:00 AM',
      checkInMethod: 'QR Scan',
      lecturer: 'Dr. Sarah Smith',
      topic: 'Linked Lists',
      notes: '',
      duration: '2 hours'
    },
    {
      id: 6,
      course: 'Linear Algebra',
      courseCode: 'MATH301',
      date: '2024-01-13',
      day: 'Saturday',
      time: '2:00 PM - 3:30 PM',
      status: 'present',
      checkInTime: '2:05 PM',
      checkInMethod: 'Numeric Code',
      lecturer: 'Prof. Robert Johnson',
      topic: 'Vector Spaces',
      notes: '',
      duration: '1.5 hours'
    },
    {
      id: 7,
      course: 'Organic Chemistry',
      courseCode: 'CHEM301',
      date: '2024-01-12',
      day: 'Friday',
      time: '3:00 PM - 6:00 PM',
      status: 'absent',
      checkInTime: null,
      checkInMethod: null,
      lecturer: 'Dr. David Miller',
      topic: 'Hydrocarbons',
      notes: 'Submitted assignment instead',
      duration: '3 hours'
    },
    {
      id: 8,
      course: 'Artificial Intelligence',
      courseCode: 'CS401',
      date: '2024-01-12',
      day: 'Friday',
      time: '1:00 PM - 3:00 PM',
      status: 'late',
      checkInTime: '1:30 PM',
      checkInMethod: 'QR Scan',
      lecturer: 'Dr. Alan Turing',
      topic: 'Search Algorithms',
      notes: '',
      duration: '2 hours'
    },
    {
      id: 9,
      course: 'Introduction to Programming',
      courseCode: 'CS101',
      date: '2024-01-10',
      day: 'Wednesday',
      time: '10:00 AM - 11:30 AM',
      status: 'present',
      checkInTime: '10:00 AM',
      checkInMethod: 'QR Scan',
      lecturer: 'Dr. Sarah Smith',
      topic: 'Control Structures',
      notes: '',
      duration: '1.5 hours'
    },
    {
      id: 10,
      course: 'Calculus II',
      courseCode: 'MATH202',
      date: '2024-01-09',
      day: 'Tuesday',
      time: '2:00 PM - 4:00 PM',
      status: 'present',
      checkInTime: '2:02 PM',
      checkInMethod: 'Numeric Code',
      lecturer: 'Prof. Robert Johnson',
      topic: 'Applications of Integration',
      notes: '',
      duration: '2 hours'
    }
  ];

  // Calculate statistics
  const totalClasses = attendanceData.length;
  const presentCount = attendanceData.filter(a => a.status === 'present').length;
  const absentCount = attendanceData.filter(a => a.status === 'absent').length;
  const lateCount = attendanceData.filter(a => a.status === 'late').length;
  const attendanceRate = Math.round((presentCount / totalClasses) * 100);

  // Filter data
  const filteredData = attendanceData.filter(record => {
    if (filter !== 'all' && record.status !== filter) return false;
    
    const recordDate = new Date(record.date);
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    if (dateRange === 'week' && recordDate < weekAgo) return false;
    if (dateRange === 'month' && recordDate < monthAgo) return false;
    
    return true;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (sortBy === 'date') {
      return new Date(b.date) - new Date(a.date);
    }
    if (sortBy === 'course') {
      return a.course.localeCompare(b.course);
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'present': return 'text-green-600';
      case 'absent': return 'text-red-600';
      case 'late': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'present': return 'bg-green-50';
      case 'absent': return 'bg-red-50';
      case 'late': return 'bg-yellow-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-2xl font-bold text-gray-800">{totalClasses}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Present</p>
          <p className="text-2xl font-bold text-green-600">{presentCount}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">Absent</p>
          <p className="text-2xl font-bold text-red-600">{absentCount}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Late</p>
          <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
        </div>
      </div>

      {/* Attendance Rate Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blue-600 font-medium">Overall Attendance Rate</span>
          <span className={`text-lg font-bold ${
            attendanceRate >= 75 ? 'text-green-600' : 
            attendanceRate >= 50 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {attendanceRate}%
          </span>
        </div>
        <div className="w-full h-3 bg-white rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              attendanceRate >= 75 ? 'bg-green-600' : 
              attendanceRate >= 50 ? 'bg-yellow-600' : 
              'bg-red-600'
            }`}
            style={{ width: `${attendanceRate}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {attendanceRate >= 75 ? 'Good standing' : 
           attendanceRate >= 50 ? 'Warning: Attendance below 75%' : 
           'Critical: Attendance below 50%'}
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="all">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="semester">This Semester</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="date">Sort by Date</option>
            <option value="course">Sort by Course</option>
            <option value="status">Sort by Status</option>
          </select>

          <Button variant="secondary" size="sm" icon="📥">
            Export
          </Button>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Course</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Lecturer</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Topic</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Check-in</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map(record => (
              <tr 
                key={record.id}
                className={`hover:bg-gray-50 transition-colors ${getStatusBg(record.status)}`}
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">{record.day}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-800">{record.course}</p>
                    <p className="text-xs text-gray-500">{record.courseCode}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.time}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{record.lecturer}</td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-600">{record.topic}</p>
                  {record.notes && (
                    <p className="text-xs text-gray-400 mt-1">{record.notes}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={record.status} />
                </td>
                <td className="px-4 py-3">
                  {record.checkInTime ? (
                    <div>
                      <p className="text-sm font-medium text-gray-800">{record.checkInTime}</p>
                      <p className="text-xs text-gray-500">{record.checkInMethod}</p>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onViewDetails && onViewDetails(record)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Empty State */}
        {sortedData.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-500">No attendance records found</p>
          </div>
        )}
      </div>

      {/* Summary by Course */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance by Course</h3>
        <div className="space-y-3">
          {['CS101', 'MATH202', 'PHY101', 'ENG205', 'CS201'].map(course => {
            const courseRecords = attendanceData.filter(r => r.courseCode === course);
            const coursePresent = courseRecords.filter(r => r.status === 'present').length;
            const courseTotal = courseRecords.length;
            const courseRate = courseTotal > 0 ? Math.round((coursePresent / courseTotal) * 100) : 0;
            
            return (
              <div key={course} className="flex items-center gap-3">
                <span className="text-xs font-medium text-gray-600 w-16">{course}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">{coursePresent}/{courseTotal} classes</span>
                    <span className={`font-medium ${
                      courseRate >= 75 ? 'text-green-600' : 
                      courseRate >= 50 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {courseRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        courseRate >= 75 ? 'bg-green-600' : 
                        courseRate >= 50 ? 'bg-yellow-600' : 
                        'bg-red-600'
                      }`}
                      style={{ width: `${courseRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Attendance Details Modal
export const AttendanceDetailsModal = ({ record, isOpen, onClose }) => {
  if (!isOpen || !record) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Attendance Details</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {/* Status Badge */}
          <div className="mb-4">
            <StatusBadge status={record.status} size="lg" />
          </div>

          {/* Details Grid */}
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500">Course</p>
              <p className="text-sm font-medium text-gray-800">{record.course} ({record.courseCode})</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date & Time</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(record.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-sm text-gray-600">{record.time}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lecturer</p>
              <p className="text-sm font-medium text-gray-800">{record.lecturer}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Topic</p>
              <p className="text-sm font-medium text-gray-800">{record.topic}</p>
            </div>
            {record.checkInTime && (
              <div>
                <p className="text-xs text-gray-500">Check-in Time</p>
                <p className="text-sm font-medium text-gray-800">
                  {record.checkInTime} via {record.checkInMethod}
                </p>
              </div>
            )}
            {record.notes && (
              <div>
                <p className="text-xs text-gray-500">Notes</p>
                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{record.notes}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button variant="primary" fullWidth>Download Certificate</Button>
            <Button variant="secondary" fullWidth onClick={onClose}>Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendanceTable;