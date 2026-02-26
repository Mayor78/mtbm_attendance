import React from 'react';
import { Mail, Phone, BookOpen, Calendar, ChevronRight, User } from 'lucide-react';
import LevelBadge from './LevelBadge';

const StudentCard = ({ student, onViewDetails }) => {
  // Logic preserved - using modern emerald/amber/rose palette
  const attendanceColor = student.attendanceRate >= 75 ? 'text-emerald-600' :
                          student.attendanceRate >= 50 ? 'text-amber-600' :
                          'text-rose-600';

  const attendanceBg = student.attendanceRate >= 75 ? 'bg-emerald-500' :
                       student.attendanceRate >= 50 ? 'bg-amber-500' :
                       'bg-rose-500';

  return (
    <div 
      onClick={() => onViewDetails(student)}
      className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gray-50 rounded-bl-[100px] -mr-10 -mt-10 group-hover:bg-indigo-50/50 transition-colors -z-0" />

      <div className="relative z-10">
        {/* Top Section: Avatar & Basic Info */}
        <div className="flex items-start gap-3 mb-4">
          <div className="h-10 w-10 shrink-0 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm">
            {student.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {student.full_name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-mono font-bold text-gray-400">
                {student.matric_no}
              </span>
              <LevelBadge level={student.level} />
            </div>
          </div>
        </div>

        {/* Middle Section: Contact Details */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <div className="p-1 bg-gray-50 rounded-md">
              <Mail size={12} className="text-gray-400" />
            </div>
            <span className="truncate">{student.email}</span>
          </div>
          {student.phone && (
            <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <div className="p-1 bg-gray-50 rounded-md">
                <Phone size={12} className="text-gray-400" />
              </div>
              <span>{student.phone}</span>
            </div>
          )}
        </div>

        {/* Course Section */}
        <div className="mb-5">
          <div className="flex items-center gap-1 mb-2">
             <BookOpen size={10} className="text-gray-400" />
             <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
               Enrolled Courses
             </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {student.courses?.slice(0, 2).map(course => (
              <span key={course.id} className="text-[10px] font-semibold bg-gray-50 text-gray-600 border border-gray-100 px-2 py-0.5 rounded-md">
                {course.course_code}
              </span>
            ))}
            {student.courses?.length > 2 && (
              <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md">
                +{student.courses.length - 2}
              </span>
            )}
          </div>
        </div>

        {/* Footer Section: Attendance */}
        <div className="pt-4 border-t border-gray-50 flex items-end justify-between">
          <div className="flex-1">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Attendance</span>
              <span className={`text-xs font-black ${attendanceColor}`}>
                {student.attendanceRate}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-700 ${attendanceBg}`}
                style={{ width: `${student.attendanceRate}%` }}
              />
            </div>
          </div>
          
          <div className="ml-4 p-2 bg-gray-50 group-hover:bg-indigo-600 group-hover:text-white rounded-xl transition-all">
            <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;