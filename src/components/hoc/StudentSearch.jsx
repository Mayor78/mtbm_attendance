import React from 'react';

const StudentSearch = ({ 
  students, 
  selectedStudent, 
  onStudentSelect, 
  searchTerm, 
  onSearchChange,
  loading 
}) => {
  // Ensure students is an array
  const safeStudents = Array.isArray(students) ? students : [];
  
  console.log('Students in search:', safeStudents);

  const filteredStudents = safeStudents.filter(s => {
    if (!s) return false;
    
    const fullName = (s.full_name || s.profiles?.full_name || '').toLowerCase();
    const matricNo = (s.matric_no || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || matricNo.includes(searchLower);
  });

  const getStudentName = (student) => {
    return student?.full_name || student?.profiles?.full_name || 'Unknown Student';
  };

  const getStudentMatric = (student) => {
    return student?.matric_no || 'N/A';
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-bold text-slate-500 uppercase ml-1">
          Search Student
        </label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Type name or matric number..."
          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-green-600 outline-none"
        />
      </div>

      <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-2">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
          </div>
        ) : safeStudents.length === 0 ? (
          <p className="text-center py-4 text-slate-500">No students enrolled</p>
        ) : filteredStudents.length === 0 ? (
          <p className="text-center py-4 text-slate-500">No matching students</p>
        ) : (
          filteredStudents.map((student) => (
            <div
              key={student.id}
              onClick={() => onStudentSelect(student.id)}
              className={`p-3 rounded-xl cursor-pointer transition-colors ${
                selectedStudent === student.id
                  ? 'bg-green-100 border-green-300'
                  : 'hover:bg-slate-50'
              }`}
            >
              <p className="font-medium text-slate-900">{getStudentName(student)}</p>
              <p className="text-xs text-slate-500">{getStudentMatric(student)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StudentSearch;