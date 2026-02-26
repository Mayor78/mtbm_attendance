import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Download, X, Grid, List, LayoutGrid } from 'lucide-react';
import StudentCard from './StudentCard';
import StudentTable from './StudentTable';
import LevelBadge from './LevelBadge';
import DepartmentStats from './DepartmentStats';

const StudentOverview = ({ 
  lecturerId, 
  courses,
  getAllDepartmentStudents 
}) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [departmentName, setDepartmentName] = useState('');

  // LOGIC PRESERVED
  useEffect(() => {
    if (courses && courses.length > 0) {
      setDepartmentName(courses[0].department);
    }
  }, [courses]);

  useEffect(() => {
    loadStudents();
  }, [lecturerId]);

  const loadStudents = async () => {
    if (!getAllDepartmentStudents) return;
    setLoading(true);
    try {
      const data = await getAllDepartmentStudents();
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['100', '200', '300', '400'];
  
  const filteredStudents = students.filter(student => {
    const matchesLevel = selectedLevel === 'all' || student.level === selectedLevel;
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.matric_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const levelCounts = students.reduce((acc, student) => {
    acc[student.level] = (acc[student.level] || 0) + 1;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-20 flex flex-col items-center shadow-sm">
        <div className="relative flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          <Users size={16} className="absolute text-indigo-600" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-400 animate-pulse">Synchronizing Student Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header Section */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Users size={24} className="text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                {departmentName || "Department"} Overview
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-1 ml-11">
              Managing <span className="font-semibold text-gray-700">{students.length}</span> students across <span className="font-semibold text-gray-700">{Object.keys(levelCounts).length}</span> academic levels.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Minimalist Search */}
            <div className="relative group">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                type="text"
                placeholder="Search repository..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 py-2.5 text-sm bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500/10 focus:bg-white w-64 transition-all outline-none"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View Mode Switcher */}
            <div className="flex p-1 bg-gray-50 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List size={18} />
              </button>
            </div>

            <button className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all shadow-md active:scale-95">
              <Download size={16} />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* Level Distribution Bar - Minimalist Version */}
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-50">
          {levels.map(level => (
            <button 
              key={level}
              onClick={() => setSelectedLevel(selectedLevel === level ? 'all' : level)}
              className={`text-left group transition-all p-2 rounded-xl hover:bg-gray-50 ${selectedLevel === level ? 'ring-1 ring-indigo-100 bg-indigo-50/30' : ''}`}
            >
              <div className="flex justify-between items-end mb-2 px-1">
                <span className={`text-[11px] font-bold uppercase tracking-widest ${selectedLevel === level ? 'text-indigo-600' : 'text-gray-400'}`}>
                  L-{level}
                </span>
                <span className="text-sm font-bold text-gray-700">{levelCounts[level] || 0}</span>
              </div>
              <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${selectedLevel === level ? 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]' : 'bg-gray-300'}`}
                  style={{ width: `${((levelCounts[level] || 0) / (students.length || 1)) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[400px]">
        {filteredStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-100 py-24 text-center">
            <div className="inline-flex p-4 bg-gray-50 rounded-full mb-4">
              <Users size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 tracking-tight">Search Result Empty</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto mt-2">
              We couldn't find any students matching "{searchTerm}". Try refining your search parameters.
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
      </div>

      {/* Modern Student Details Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" onClick={() => setSelectedStudent(null)} />
          
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/20">
            {/* Modal Header */}
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-200">
                  {selectedStudent.full_name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">{selectedStudent.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                      {selectedStudent.matric_no}
                    </span>
                    <LevelBadge level={selectedStudent.level} />
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudent(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="p-8 pt-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { label: 'Department', value: selectedStudent.department },
                  { label: 'Primary Email', value: selectedStudent.email },
                  { label: 'Contact Number', value: selectedStudent.phone || 'Not Provided' },
                  { label: 'Enrolled Courses', value: `${selectedStudent.courses?.length || 0} Registered` }
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-700">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Attendance Section */}
              <div className="p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-4">Engagement Analytics</h4>
                  <div className="flex items-end justify-between mb-2">
                    <span className="text-5xl font-black">{selectedStudent.attendanceRate}%</span>
                    <span className="text-xs font-medium opacity-80 pb-2">Overall Attendance</span>
                  </div>
                  <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-white rounded-full shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                      style={{ width: `${selectedStudent.attendanceRate}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs font-bold">
                    <span className="bg-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {selectedStudent.presentCount} Present
                    </span>
                    <span className="bg-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {selectedStudent.totalSessions - selectedStudent.presentCount} Absent
                    </span>
                  </div>
                </div>
                {/* Decorative Pattern */}
                <Users size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
              </div>
              
              <div className="mt-8 flex justify-end">
                 <button className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all">
                    Full Profile
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentOverview;