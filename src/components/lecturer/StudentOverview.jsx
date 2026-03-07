import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, X, Grid, List, Download } from 'lucide-react';
import StudentCard from './StudentCard';
import StudentTable from './StudentTable';
import LevelBadge from './LevelBadge';

const StudentOverview = ({ 
  lecturerId, 
  courses,
  getAllDepartmentStudents 
}) => {
  const [viewMode, setViewMode] = useState('grid');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const departmentName = courses?.[0]?.department || 'Department';

  // Use TanStack Query for students data
  const { 
    data: students = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['departmentStudents', lecturerId, departmentName],
    queryFn: async () => {
      if (!getAllDepartmentStudents) return [];
      const data = await getAllDepartmentStudents();
      return data || [];
    },
    enabled: !!lecturerId && !!getAllDepartmentStudents,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const levels = ['100', '200', '300', '400'];
  
  const filteredStudents = students.filter(student => {
    const matchesLevel = selectedLevel === 'all' || student.level === selectedLevel;
    const matchesSearch = student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.matric_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const levelCounts = students.reduce((acc, student) => {
    acc[student.level] = (acc[student.level] || 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        </div>
        <p className="mt-3 text-sm text-gray-400">Loading students...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-red-100 p-12 text-center">
        <p className="text-sm text-red-600">Error loading students. Please try again.</p>
        <button 
          onClick={() => refetch()}
          className="mt-3 text-xs text-gray-500 hover:text-gray-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <h2 className="text-sm font-medium text-gray-700">
              {departmentName}
            </h2>
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
              {students.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:flex-none">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-7 py-1.5 text-sm bg-gray-50 border-0 rounded-lg focus:ring-1 focus:ring-gray-300 w-full sm:w-48"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-400'}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 ${viewMode === 'table' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-400'}`}
              >
                <List size={16} />
              </button>
            </div>

            <button 
              onClick={() => refetch()}
              className="p-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
              title="Refresh data"
            >
              <Download size={16} />
            </button>
          </div>
        </div>

        {/* Level Filters */}
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-50">
          <button
            onClick={() => setSelectedLevel('all')}
            className={`px-2 py-1 text-xs rounded-md ${
              selectedLevel === 'all' 
                ? 'bg-gray-900 text-white' 
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            All ({students.length})
          </button>
          {levels.map(level => (
            <button
              key={level}
              onClick={() => setSelectedLevel(level)}
              className={`px-2 py-1 text-xs rounded-md ${
                selectedLevel === level 
                  ? 'bg-gray-900 text-white' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              L{level} ({levelCounts[level] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            {searchTerm ? 'No students match your search' : 'No students found'}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredStudents.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              onViewDetails={setSelectedStudent}
            />
          ))}
        </div>
      ) : (
        <StudentTable
          students={filteredStudents}
          onViewStudent={setSelectedStudent}
        />
      )}

      {/* Student Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/20" onClick={() => setSelectedStudent(null)} />
          
          <div className="relative bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-medium text-gray-900">Student Details</h3>
              <button onClick={() => setSelectedStudent(null)} className="p-1 hover:bg-gray-100 rounded">
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className="text-xs text-gray-400">Name</p>
                <p className="text-sm font-medium">{selectedStudent.full_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Matric No</p>
                <p className="text-sm">{selectedStudent.matric_no}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Level</p>
                <LevelBadge level={selectedStudent.level} />
              </div>
              <div>
                <p className="text-xs text-gray-400">Email</p>
                <p className="text-sm">{selectedStudent.email}</p>
              </div>
              {selectedStudent.attendanceRate !== undefined && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Attendance</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-900 rounded-full"
                        style={{ width: `${selectedStudent.attendanceRate}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{selectedStudent.attendanceRate}%</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOverview;