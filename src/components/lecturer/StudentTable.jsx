import React, { useState } from 'react';
import { Search, Filter, Download, ChevronRight, MoreHorizontal } from 'lucide-react';
import LevelBadge from './LevelBadge';

const StudentTable = ({ students, onViewStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  const levels = ['100', '200', '300', '400'];

  // LOGIC PRESERVED
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.matric_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = levelFilter === 'all' || student.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'name') return a.full_name.localeCompare(b.full_name);
    if (sortBy === 'level') return a.level.localeCompare(b.level);
    if (sortBy === 'attendance') return b.attendanceRate - a.attendanceRate;
    return 0;
  });

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header with filters */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          <div className="flex flex-1 flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, matric, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm transition-all focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            
            {/* Filters Group */}
            <div className="flex gap-2">
              <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
                className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="all">All Levels</option>
                {levels.map(level => (
                  <option key={level} value={level}>Level {level}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239ca3af%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
              >
                <option value="name">Sort by Name</option>
                <option value="level">Sort by Level</option>
                <option value="attendance">Sort by Attendance</option>
              </select>
            </div>
          </div>

          <button className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 gap-2">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Summary */}
        <div className="mt-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
          {filteredStudents.length} students found
          {levelFilter !== 'all' && <span className="text-indigo-500"> • Level {levelFilter}</span>}
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Student Detail</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Matric No</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Level</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Enrolled Courses</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">Avg Attendance</th>
              <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedStudents.length > 0 ? (
              sortedStudents.map((student) => (
                <tr 
                  key={student.id} 
                  className="group hover:bg-indigo-50/30 cursor-pointer transition-all"
                  onClick={() => onViewStudent(student)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">{student.full_name}</span>
                      <span className="text-xs text-gray-400 font-normal">{student.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-mono text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                      {student.matric_no}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <LevelBadge level={student.level} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                      {student.courses?.slice(0, 2).map(c => (
                        <span key={c.id} className="inline-flex items-center text-[10px] font-bold bg-white text-gray-500 border border-gray-200 px-2 py-0.5 rounded shadow-sm">
                          {c.course_code}
                        </span>
                      ))}
                      {student.courses?.length > 2 && (
                        <span className="inline-flex items-center text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded">
                          +{student.courses.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-3 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              student.attendanceRate >= 75 ? 'bg-emerald-500' :
                              student.attendanceRate >= 50 ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`}
                            style={{ width: `${student.attendanceRate}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold tabular-nums ${
                          student.attendanceRate >= 75 ? 'text-emerald-600' :
                          student.attendanceRate >= 50 ? 'text-amber-600' :
                          'text-rose-600'
                        }`}>
                          {student.attendanceRate}%
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 italic">
                        Active: {student.lastActive || 'Never'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-full transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-12 text-center text-gray-400 italic">
                  No students found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;