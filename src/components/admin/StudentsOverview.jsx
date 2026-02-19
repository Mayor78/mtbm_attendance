import React, { useState } from 'react';
import Table from '../common/Table';
import Button from '../common/Button';
import StatusBadge from '../common/StatusBadge';
import Card from '../common/Card';

const StudentsOverview = ({ searchQuery = '', filters = {} }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  const columns = [
    { 
      header: 'Student', 
      accessor: 'name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
            {row.avatar || value.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-800">{value}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Student ID', 
      accessor: 'studentId',
      sortable: true 
    },
    { 
      header: 'Program', 
      accessor: 'program',
      sortable: true 
    },
    { 
      header: 'Year', 
      accessor: 'year',
      sortable: true 
    },
    { 
      header: 'Enrolled Courses', 
      accessor: 'enrolledCourses',
      sortable: true 
    },
    { 
      header: 'Attendance Rate', 
      accessor: 'attendanceRate',
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
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
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
            onClick={() => setSelectedStudent(row)}
          >
            View
          </Button>
          <Button variant="ghost" size="sm">📧</Button>
        </div>
      )
    }
  ];

  const studentData = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@university.edu',
      studentId: 'STU2024001',
      program: 'Computer Science',
      year: '3rd Year',
      enrolledCourses: 5,
      attendanceRate: 87,
      status: 'active',
      avatar: '👨‍🎓',
      phone: '+1 234 567 890',
      joinDate: '2022-09-01',
      address: '123 University Ave, City',
      emergencyContact: 'Jane Doe - +1 234 567 891',
      recentAttendance: [
        { course: 'CS101', date: '2024-01-15', status: 'present' },
        { course: 'MATH202', date: '2024-01-14', status: 'present' },
        { course: 'PHY101', date: '2024-01-13', status: 'absent' },
        { course: 'ENG205', date: '2024-01-12', status: 'late' }
      ]
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@university.edu',
      studentId: 'STU2024002',
      program: 'Mathematics',
      year: '2nd Year',
      enrolledCourses: 4,
      attendanceRate: 94,
      status: 'active',
      avatar: '👩‍🎓',
      phone: '+1 234 567 892',
      joinDate: '2023-09-01',
      address: '456 College Rd, City',
      emergencyContact: 'Bob Smith - +1 234 567 893',
      recentAttendance: [
        { course: 'MATH202', date: '2024-01-15', status: 'present' },
        { course: 'STAT101', date: '2024-01-14', status: 'present' },
        { course: 'CS101', date: '2024-01-13', status: 'present' },
        { course: 'PHY101', date: '2024-01-12', status: 'present' }
      ]
    },
    {
      id: 3,
      name: 'Michael Johnson',
      email: 'michael.j@university.edu',
      studentId: 'STU2024003',
      program: 'Physics',
      year: '4th Year',
      enrolledCourses: 6,
      attendanceRate: 62,
      status: 'warning',
      avatar: '👨‍🔬',
      phone: '+1 234 567 894',
      joinDate: '2021-09-01',
      address: '789 Science Blvd, City',
      emergencyContact: 'Sarah Johnson - +1 234 567 895',
      recentAttendance: [
        { course: 'PHY401', date: '2024-01-15', status: 'absent' },
        { course: 'MATH301', date: '2024-01-14', status: 'late' },
        { course: 'CS201', date: '2024-01-13', status: 'present' },
        { course: 'PHY301', date: '2024-01-12', status: 'absent' }
      ]
    },
    {
      id: 4,
      name: 'Emily Brown',
      email: 'emily.b@university.edu',
      studentId: 'STU2024004',
      program: 'English Literature',
      year: '1st Year',
      enrolledCourses: 4,
      attendanceRate: 100,
      status: 'active',
      avatar: '👩‍🏫',
      phone: '+1 234 567 896',
      joinDate: '2024-09-01',
      address: '321 Literature Ln, City',
      emergencyContact: 'David Brown - +1 234 567 897',
      recentAttendance: [
        { course: 'ENG101', date: '2024-01-15', status: 'present' },
        { course: 'ENG205', date: '2024-01-14', status: 'present' },
        { course: 'HIST101', date: '2024-01-13', status: 'present' },
        { course: 'PHIL101', date: '2024-01-12', status: 'present' }
      ]
    },
    {
      id: 5,
      name: 'David Wilson',
      email: 'david.w@university.edu',
      studentId: 'STU2024005',
      program: 'Chemistry',
      year: '3rd Year',
      enrolledCourses: 5,
      attendanceRate: 78,
      status: 'inactive',
      avatar: '👨‍🔬',
      phone: '+1 234 567 898',
      joinDate: '2022-09-01',
      address: '654 Chem Ave, City',
      emergencyContact: 'Lisa Wilson - +1 234 567 899',
      recentAttendance: [
        { course: 'CHEM301', date: '2024-01-15', status: 'present' },
        { course: 'CHEM202', date: '2024-01-14', status: 'absent' },
        { course: 'BIO101', date: '2024-01-13', status: 'present' },
        { course: 'MATH202', date: '2024-01-12', status: 'late' }
      ]
    },
    {
      id: 6,
      name: 'Sarah Lee',
      email: 'sarah.lee@university.edu',
      studentId: 'STU2024006',
      program: 'Computer Science',
      year: '2nd Year',
      enrolledCourses: 5,
      attendanceRate: 91,
      status: 'active',
      avatar: '👩‍💻',
      phone: '+1 234 567 900',
      joinDate: '2023-09-01',
      address: '987 Tech Park, City',
      emergencyContact: 'James Lee - +1 234 567 901',
      recentAttendance: [
        { course: 'CS201', date: '2024-01-15', status: 'present' },
        { course: 'CS101', date: '2024-01-14', status: 'present' },
        { course: 'MATH202', date: '2024-01-13', status: 'present' },
        { course: 'CS301', date: '2024-01-12', status: 'late' }
      ]
    }
  ];

  // Filter data based on search query and filters
  const filteredData = studentData.filter(student => {
    let matchesSearch = true;
    let matchesFilters = true;

    if (searchQuery) {
      matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.program.toLowerCase().includes(searchQuery.toLowerCase());
    }

    if (filters.program && filters.program !== 'all') {
      matchesFilters = matchesFilters && student.program === filters.program;
    }

    if (filters.year && filters.year !== 'all') {
      matchesFilters = matchesFilters && student.year === filters.year;
    }

    if (filters.status && filters.status !== 'all') {
      matchesFilters = matchesFilters && student.status === filters.status;
    }

    return matchesSearch && matchesFilters;
  });

  // Summary stats
  const totalStudents = studentData.length;
  const activeStudents = studentData.filter(s => s.status === 'active').length;
  const avgAttendance = Math.round(studentData.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents);
  const atRiskStudents = studentData.filter(s => s.attendanceRate < 70).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-gray-800">{totalStudents}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Active Students</p>
            <p className="text-2xl font-bold text-green-600">{activeStudents}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Avg. Attendance</p>
            <p className="text-2xl font-bold text-blue-600">{avgAttendance}%</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">At Risk</p>
            <p className="text-2xl font-bold text-red-600">{atRiskStudents}</p>
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
          variant={viewMode === 'grid' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => setViewMode('grid')}
        >
          📱 Grid View
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
          onRowClick={(row) => setSelectedStudent(row)}
          selectable={true}
          onSelectionChange={(selected) => console.log('Selected:', selected)}
        />
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map(student => (
            <Card 
              key={student.id} 
              hoverable 
              onClick={() => setSelectedStudent(student)}
              className="relative"
            >
              <div className="p-4">
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <StatusBadge status={student.status} />
                </div>

                {/* Student Info */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                    {student.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{student.name}</h4>
                    <p className="text-xs text-gray-500">{student.studentId}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📚</span>
                    <span>{student.program} • {student.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📧</span>
                    <span className="truncate">{student.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span>📞</span>
                    <span>{student.phone}</span>
                  </div>
                </div>

                {/* Attendance */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Attendance Rate</span>
                    <span className={`text-xs font-medium ${
                      student.attendanceRate >= 75 ? 'text-green-600' : 
                      student.attendanceRate >= 50 ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {student.attendanceRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        student.attendanceRate >= 75 ? 'bg-green-600' : 
                        student.attendanceRate >= 50 ? 'bg-yellow-600' : 
                        'bg-red-600'
                      }`}
                      style={{ width: `${student.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 flex gap-2">
                  <Button variant="secondary" size="sm" fullWidth>
                    View Details
                  </Button>
                  <Button variant="ghost" size="sm">📧</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
                    {selectedStudent.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-800">{selectedStudent.name}</h2>
                    <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500">Program</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStudent.program}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Year</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStudent.year}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStudent.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Join Date</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStudent.joinDate}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Emergency Contact</p>
                  <p className="text-sm font-medium text-gray-800">{selectedStudent.emergencyContact}</p>
                </div>
              </div>

              {/* Address */}
              <div className="mb-6">
                <p className="text-xs text-gray-500">Address</p>
                <p className="text-sm font-medium text-gray-800">{selectedStudent.address}</p>
              </div>

              {/* Recent Attendance */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Attendance</h3>
                <div className="space-y-2">
                  {selectedStudent.recentAttendance.map((att, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{att.course}</p>
                        <p className="text-xs text-gray-500">{att.date}</p>
                      </div>
                      <StatusBadge status={att.status} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="primary" fullWidth>Edit Student</Button>
                <Button variant="secondary" fullWidth>View Full History</Button>
                <Button variant="danger" fullWidth>Deactivate</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentsOverview;