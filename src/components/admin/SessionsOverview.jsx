import React, { useState } from 'react';
import Table from '../common/Table';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import Card from '../common/Card';
import { ConfirmModal, InfoModal } from '../common/Modal';

const SessionsOverview = ({ searchQuery = '', filters = {} }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'calendar'
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [sessionToCancel, setSessionToCancel] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSessionDetails, setShowSessionDetails] = useState(false);

  const columns = [
    { 
      header: 'Session ID', 
      accessor: 'sessionId',
      sortable: true,
      render: (value) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{value}</span>
    },
    { 
      header: 'Course', 
      accessor: 'course',
      sortable: true,
      render: (value, row) => (
        <div>
          <p className="font-medium text-gray-800">{value}</p>
          <p className="text-xs text-gray-500">{row.courseCode}</p>
        </div>
      )
    },
    { 
      header: 'Lecturer', 
      accessor: 'lecturer',
      sortable: true 
    },
    { 
      header: 'Date', 
      accessor: 'date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    },
    { 
      header: 'Time', 
      accessor: 'time',
      sortable: true 
    },
    { 
      header: 'Duration', 
      accessor: 'duration',
      sortable: true 
    },
    { 
      header: 'Location', 
      accessor: 'location',
      sortable: true 
    },
    { 
      header: 'Attendance', 
      accessor: 'attendance',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{value}</span>
          <span className="text-xs text-gray-500">({row.present}/{row.total})</span>
        </div>
      )
    },
    { 
      header: 'Rate', 
      accessor: 'rate',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <span className={`font-medium ${
            value >= 75 ? 'text-green-600' : 
            value >= 50 ? 'text-yellow-600' : 
            'text-red-600'
          }`}>
            {value}%
          </span>
          <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full ${
                value >= 75 ? 'bg-green-600' : 
                value >= 50 ? 'bg-yellow-600' : 
                'bg-red-600'
              }`}
              style={{ width: `${value}%` }}
            ></div>
          </div>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status',
      render: (value) => <StatusBadge status={value} />
    },
    { 
      header: 'Actions', 
      accessor: 'actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              setSelectedSession(row);
              setShowSessionDetails(true);
            }}
          >
            View
          </Button>
          {row.status === 'scheduled' && (
            <Button 
              variant="danger" 
              size="sm"
              onClick={() => {
                setSessionToCancel(row);
                setShowCancelConfirm(true);
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      )
    }
  ];

  const sessionData = [
    {
      id: 1,
      sessionId: 'SESS001',
      course: 'Introduction to Programming',
      courseCode: 'CS101',
      lecturer: 'Dr. Sarah Smith',
      date: '2024-01-15',
      time: '10:00 AM - 11:30 AM',
      duration: '1.5 hours',
      location: 'Room 301, CS Building',
      present: 42,
      total: 45,
      attendance: '42/45',
      rate: 93,
      status: 'completed',
      type: 'Lecture',
      qrCode: 'QR-001',
      numericCode: '482195',
      startTime: '10:00 AM',
      endTime: '11:30 AM',
      notes: 'Regular lecture. All students attended on time.',
      students: [
        { id: 'STU001', name: 'John Doe', status: 'present', checkInTime: '10:02 AM' },
        { id: 'STU002', name: 'Jane Smith', status: 'present', checkInTime: '10:00 AM' },
        { id: 'STU003', name: 'Michael Johnson', status: 'absent', checkInTime: null },
        { id: 'STU004', name: 'Emily Brown', status: 'present', checkInTime: '10:05 AM' },
        { id: 'STU005', name: 'David Wilson', status: 'late', checkInTime: '10:15 AM' }
      ]
    },
    {
      id: 2,
      sessionId: 'SESS002',
      course: 'Calculus II',
      courseCode: 'MATH202',
      lecturer: 'Prof. Robert Johnson',
      date: '2024-01-15',
      time: '2:00 PM - 4:00 PM',
      duration: '2 hours',
      location: 'Room 205, Math Building',
      present: 35,
      total: 38,
      attendance: '35/38',
      rate: 92,
      status: 'completed',
      type: 'Tutorial',
      qrCode: 'QR-002',
      numericCode: '739284',
      startTime: '2:00 PM',
      endTime: '4:00 PM',
      notes: 'Quiz day. 3 students absent.',
      students: [
        { id: 'STU006', name: 'Alice Cooper', status: 'present', checkInTime: '2:01 PM' },
        { id: 'STU007', name: 'Bob Martin', status: 'present', checkInTime: '2:00 PM' },
        { id: 'STU008', name: 'Carol White', status: 'absent', checkInTime: null },
        { id: 'STU009', name: 'Dan Brown', status: 'present', checkInTime: '2:03 PM' },
        { id: 'STU010', name: 'Eva Green', status: 'present', checkInTime: '2:00 PM' }
      ]
    },
    {
      id: 3,
      sessionId: 'SESS003',
      course: 'Physics Fundamentals',
      courseCode: 'PHY101',
      lecturer: 'Dr. Michael Williams',
      date: '2024-01-14',
      time: '11:00 AM - 1:00 PM',
      duration: '2 hours',
      location: 'Lab 101, Science Building',
      present: 32,
      total: 42,
      attendance: '32/42',
      rate: 76,
      status: 'completed',
      type: 'Lab',
      qrCode: 'QR-003',
      numericCode: '561238',
      startTime: '11:00 AM',
      endTime: '1:00 PM',
      notes: 'Lab session. Several students arrived late.',
      students: [
        { id: 'STU011', name: 'Frank Ocean', status: 'present', checkInTime: '11:00 AM' },
        { id: 'STU012', name: 'Grace Hopper', status: 'present', checkInTime: '11:02 AM' },
        { id: 'STU013', name: 'Henry Ford', status: 'late', checkInTime: '11:20 AM' },
        { id: 'STU014', name: 'Ivy League', status: 'absent', checkInTime: null },
        { id: 'STU015', name: 'Jack Black', status: 'absent', checkInTime: null }
      ]
    },
    {
      id: 4,
      sessionId: 'SESS004',
      course: 'English Literature',
      courseCode: 'ENG205',
      lecturer: 'Prof. Jennifer Brown',
      date: '2024-01-14',
      time: '9:00 AM - 10:30 AM',
      duration: '1.5 hours',
      location: 'Room 102, Arts Building',
      present: 33,
      total: 35,
      attendance: '33/35',
      rate: 94,
      status: 'completed',
      type: 'Seminar',
      qrCode: 'QR-004',
      numericCode: '924567',
      startTime: '9:00 AM',
      endTime: '10:30 AM',
      notes: 'Discussion on Shakespeare. Good participation.',
      students: [
        { id: 'STU016', name: 'Kate Winslet', status: 'present', checkInTime: '9:00 AM' },
        { id: 'STU017', name: 'Leonardo DiCaprio', status: 'present', checkInTime: '9:00 AM' },
        { id: 'STU018', name: 'Meryl Streep', status: 'present', checkInTime: '9:05 AM' },
        { id: 'STU019', name: 'Tom Hanks', status: 'absent', checkInTime: null },
        { id: 'STU020', name: 'Julia Roberts', status: 'present', checkInTime: '9:02 AM' }
      ]
    },
    {
      id: 5,
      sessionId: 'SESS005',
      course: 'Data Structures',
      courseCode: 'CS201',
      lecturer: 'Dr. Sarah Smith',
      date: '2024-01-16',
      time: '10:00 AM - 12:00 PM',
      duration: '2 hours',
      location: 'Room 305, CS Building',
      present: 0,
      total: 40,
      attendance: '0/40',
      rate: 0,
      status: 'scheduled',
      type: 'Lecture',
      qrCode: null,
      numericCode: null,
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      notes: 'Scheduled for tomorrow.',
      students: []
    },
    {
      id: 6,
      sessionId: 'SESS006',
      course: 'Organic Chemistry',
      courseCode: 'CHEM301',
      lecturer: 'Dr. David Miller',
      date: '2024-01-15',
      time: '3:00 PM - 6:00 PM',
      duration: '3 hours',
      location: 'Lab 203, Chemistry Building',
      present: 28,
      total: 30,
      attendance: '28/30',
      rate: 93,
      status: 'active',
      type: 'Lab',
      qrCode: 'QR-006',
      numericCode: '378912',
      startTime: '3:00 PM',
      endTime: '6:00 PM',
      notes: 'Lab experiment in progress.',
      students: [
        { id: 'STU021', name: 'Walter White', status: 'present', checkInTime: '3:00 PM' },
        { id: 'STU022', name: 'Jesse Pinkman', status: 'present', checkInTime: '3:05 PM' },
        { id: 'STU023', name: 'Gale Boetticher', status: 'present', checkInTime: '3:00 PM' },
        { id: 'STU024', name: 'Mike Ehrmantraut', status: 'absent', checkInTime: null },
        { id: 'STU025', name: 'Saul Goodman', status: 'present', checkInTime: '3:10 PM' }
      ]
    },
    {
      id: 7,
      sessionId: 'SESS007',
      course: 'Artificial Intelligence',
      courseCode: 'CS401',
      lecturer: 'Dr. Alan Turing',
      date: '2024-01-16',
      time: '1:00 PM - 3:00 PM',
      duration: '2 hours',
      location: 'Room 401, CS Building',
      present: 0,
      total: 25,
      attendance: '0/25',
      rate: 0,
      status: 'cancelled',
      type: 'Lecture',
      qrCode: null,
      numericCode: null,
      startTime: '1:00 PM',
      endTime: '3:00 PM',
      notes: 'Cancelled due to conference.',
      students: []
    },
    {
      id: 8,
      sessionId: 'SESS008',
      course: 'Linear Algebra',
      courseCode: 'MATH301',
      lecturer: 'Prof. Robert Johnson',
      date: '2024-01-17',
      time: '11:00 AM - 12:30 PM',
      duration: '1.5 hours',
      location: 'Room 201, Math Building',
      present: 0,
      total: 35,
      attendance: '0/35',
      rate: 0,
      status: 'scheduled',
      type: 'Lecture',
      qrCode: null,
      numericCode: null,
      startTime: '11:00 AM',
      endTime: '12:30 PM',
      notes: 'Regular lecture.',
      students: []
    }
  ];

  // Filter data based on search query and filters
  const filteredData = sessionData.filter(session => {
    let matchesSearch = true;
    let matchesFilters = true;

    if (searchQuery) {
      matchesSearch = 
        session.course.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.lecturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.sessionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.location.toLowerCase().includes(searchQuery.toLowerCase());
    }

    if (filters.status && filters.status !== 'all') {
      matchesFilters = matchesFilters && session.status === filters.status;
    }

    if (filters.type && filters.type !== 'all') {
      matchesFilters = matchesFilters && session.type === filters.type;
    }

    if (filters.date && filters.date !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const sessionDate = session.date;
      
      if (filters.date === 'today') {
        matchesFilters = matchesFilters && sessionDate === today;
      } else if (filters.date === 'week') {
        // Simple week filter - in real app would calculate date range
        const sessionDateObj = new Date(sessionDate);
        const todayObj = new Date();
        const weekLater = new Date(todayObj);
        weekLater.setDate(weekLater.getDate() + 7);
        matchesFilters = matchesFilters && sessionDateObj >= todayObj && sessionDateObj <= weekLater;
      }
    }

    return matchesSearch && matchesFilters;
  });

  // Summary stats
  const totalSessions = sessionData.length;
  const activeSessions = sessionData.filter(s => s.status === 'active').length;
  const scheduledSessions = sessionData.filter(s => s.status === 'scheduled').length;
  const completedSessions = sessionData.filter(s => s.status === 'completed').length;
  const avgAttendance = Math.round(
    sessionData
      .filter(s => s.status === 'completed')
      .reduce((acc, s) => acc + s.rate, 0) / completedSessions
  ) || 0;

  // Calendar View Component
  const CalendarView = ({ sessions }) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const [currentDate, setCurrentDate] = useState(new Date());
    
    const getDaysInMonth = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = () => {
      return new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    };

    const daysInMonth = getDaysInMonth();
    const firstDay = getFirstDayOfMonth();
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getSessionsForDay = (day) => {
      const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return sessions.filter(s => s.date === dateStr);
    };

    return (
      <Card>
        <div className="p-4">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              >
                ←
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button 
                size="sm" 
                variant="secondary"
                onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              >
                →
              </Button>
            </div>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {days.map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square bg-gray-50 rounded-lg"></div>
            ))}

            {/* Days of month */}
            {daysArray.map(day => {
              const daySessions = getSessionsForDay(day);
              const hasSessions = daySessions.length > 0;
              
              return (
                <div 
                  key={day}
                  className={`aspect-square p-1 rounded-lg border ${
                    hasSessions ? 'bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100' : 'bg-white border-gray-200'
                  }`}
                  onClick={() => hasSessions && console.log('Show sessions for', day)}
                >
                  <div className="h-full flex flex-col">
                    <span className={`text-xs font-medium ${hasSessions ? 'text-blue-600' : 'text-gray-400'}`}>
                      {day}
                    </span>
                    {hasSessions && (
                      <div className="mt-1">
                        <div className="flex -space-x-1">
                          {daySessions.slice(0, 3).map((session, idx) => (
                            <div 
                              key={idx}
                              className={`w-2 h-2 rounded-full ${
                                session.status === 'active' ? 'bg-green-500' :
                                session.status === 'completed' ? 'bg-blue-500' :
                                session.status === 'scheduled' ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              title={`${session.course} - ${session.time}`}
                            ></div>
                          ))}
                          {daySessions.length > 3 && (
                            <span className="text-xs text-gray-500 ml-1">+{daySessions.length - 3}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  // Session Details Modal
  const SessionDetailsModal = ({ session, onClose }) => {
    if (!session) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold text-gray-800">{session.course}</h2>
                  <StatusBadge status={session.status} />
                </div>
                <p className="text-sm text-gray-500">{session.courseCode} • {session.sessionId}</p>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Session Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Date</p>
                <p className="text-sm font-medium text-gray-800">{new Date(session.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Time</p>
                <p className="text-sm font-medium text-gray-800">{session.time}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Duration</p>
                <p className="text-sm font-medium text-gray-800">{session.duration}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm font-medium text-gray-800">{session.type}</p>
              </div>
            </div>

            {/* Lecturer & Location */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-gray-500">Lecturer</p>
                <p className="text-sm font-medium text-gray-800">{session.lecturer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-sm font-medium text-gray-800">{session.location}</p>
              </div>
            </div>

            {/* Attendance Stats */}
            {session.status !== 'scheduled' && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Attendance Summary</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{session.present}</p>
                    <p className="text-xs text-gray-600">Present</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">{session.total - session.present}</p>
                    <p className="text-xs text-gray-600">Absent</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-yellow-600">{session.late || 0}</p>
                    <p className="text-xs text-gray-600">Late</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{session.rate}%</p>
                    <p className="text-xs text-gray-600">Rate</p>
                  </div>
                </div>
              </div>
            )}

            {/* QR & Code Info */}
            {session.status === 'active' && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-700 mb-3">Active Session Codes</h3>
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-blue-600">QR Code</p>
                    <p className="font-mono text-sm text-gray-800">{session.qrCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">Numeric Code</p>
                    <p className="font-mono text-sm text-gray-800">{session.numericCode}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {session.notes && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{session.notes}</p>
              </div>
            )}

            {/* Student List */}
            {session.students && session.students.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Student Attendance</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Student ID</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Name</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Status</th>
                        <th className="px-4 py-2 text-left text-xs text-gray-500">Check-in Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {session.students.map((student, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-xs font-mono">{student.id}</td>
                          <td className="px-4 py-2 text-xs">{student.name}</td>
                          <td className="px-4 py-2">
                            <StatusBadge status={student.status} size="sm" />
                          </td>
                          <td className="px-4 py-2 text-xs">{student.checkInTime || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button variant="primary" fullWidth>Export Report</Button>
              {session.status === 'scheduled' && (
                <Button variant="danger" fullWidth>Cancel Session</Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Total Sessions</p>
            <p className="text-2xl font-bold text-gray-800">{totalSessions}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Active Now</p>
            <p className="text-2xl font-bold text-green-600">{activeSessions}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Scheduled</p>
            <p className="text-2xl font-bold text-yellow-600">{scheduledSessions}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{completedSessions}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Avg. Attendance</p>
            <p className="text-2xl font-bold text-purple-600">{avgAttendance}%</p>
          </div>
        </Card>
      </div>

      {/* View Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={viewMode === 'table' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('table')}
        >
          📊 Table View
        </Button>
        <Button
          variant={viewMode === 'calendar' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('calendar')}
        >
          📅 Calendar View
        </Button>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <Table
          columns={columns}
          data={filteredData}
          showSearch={false}
          showPagination={true}
          itemsPerPage={10}
          onRowClick={(row) => {
            setSelectedSession(row);
            setShowSessionDetails(true);
          }}
        />
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarView sessions={filteredData} />
      )}

      {/* Session Details Modal */}
      {showSessionDetails && selectedSession && (
        <SessionDetailsModal 
          session={selectedSession} 
          onClose={() => {
            setShowSessionDetails(false);
            setSelectedSession(null);
          }}
        />
      )}

      {/* Cancel Session Confirmation */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => {
          setShowCancelConfirm(false);
          setSessionToCancel(null);
        }}
        onConfirm={() => {
          // Handle cancel session
          setShowCancelConfirm(false);
          setSessionToCancel(null);
          setShowSuccess(true);
        }}
        title="Cancel Session"
        message={`Are you sure you want to cancel the session for ${sessionToCancel?.course} on ${sessionToCancel?.date}?`}
        confirmText="Yes, Cancel Session"
        cancelText="No, Keep Session"
        confirmVariant="danger"
      />

      {/* Success Modal */}
      <InfoModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Session Cancelled"
        message="The session has been cancelled successfully."
        type="success"
      />
    </div>
  );
};

export default SessionsOverview;