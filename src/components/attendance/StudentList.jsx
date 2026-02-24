import React, { useState } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

const StudentList = ({ 
  students, 
  sessions, 
  onRemoveStudent,
  userRole 
}) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(null);

  const handleRemoveClick = (student) => {
    setShowRemoveConfirm(student);
  };

  const confirmRemove = () => {
    if (showRemoveConfirm) {
      onRemoveStudent(showRemoveConfirm);
      setShowRemoveConfirm(null);
    }
  };

  return (
    <>
      <div className="space-y-2">
        {students.map((student) => (
          <div key={student.id} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm relative group">
            {/* Remove Button - Only for HOC/Lecturer */}
            {(userRole === 'hoc' || userRole === 'lecturer') && (
              <button
                onClick={() => handleRemoveClick(student)}
                className="absolute top-4 right-4 p-1.5 bg-rose-50 text-rose-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-100"
                title="Remove from attendance"
              >
                <Trash2 size={14} />
              </button>
            )}

            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">{student.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{student.matricNo}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${student.attendanceGrade.bg} ${student.attendanceGrade.color}`}>
                {student.attendanceGrade.label}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Present</p>
                <p className="text-sm font-semibold text-indigo-600">
                  {student.totalPresent} <span className="text-xs text-slate-400">/ {sessions.length}</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase">Percentage</p>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${student.attendancePercentage}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-700">
                    {student.attendancePercentage}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between text-[10px] text-slate-400">
              <span>First: {new Date(student.firstAttendance).toLocaleDateString()}</span>
              <span>Last: {new Date(student.lastAttendance).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <AlertCircle size={20} className="text-rose-600" />
              </div>
              <h3 className="font-bold text-slate-900">Remove Student?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              Are you sure you want to remove {showRemoveConfirm.name} from this course? 
              This will delete all their attendance records.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 py-2 bg-rose-600 text-white rounded-xl font-medium hover:bg-rose-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentList;