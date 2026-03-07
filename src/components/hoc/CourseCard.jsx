import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, ChevronRight, BarChart3, Users } from 'lucide-react';

const CourseCard = ({ course, onEdit, onDelete }) => {
  return (
    <div className="group bg-white rounded-[2rem] p-7 border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:shadow-gray-200/50 hover:-translate-y-1 flex flex-col h-full">
      
      {/* Top Section: Icon & Actions */}
      <div className="flex justify-between items-start mb-8">
        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shadow-gray-200 group-hover:bg-indigo-600 transition-colors duration-500">
          <span className="text-[10px] font-black tracking-widest leading-none mb-0.5">CODE</span>
          <span className="font-black text-xs">{course.course_code?.substring(0, 3)}</span>
        </div>
        
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button 
            onClick={() => onEdit(course)} 
            className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
          >
            <Edit size={16} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => onDelete(course.id)} 
            className="p-2.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
      
      {/* Title Section */}
      <div className="flex-1 space-y-2">
        <h3 className="font-black text-gray-900 text-xl leading-tight tracking-tight">
          {course.course_title}
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
            {course.course_code}
          </span>
          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
            {course.semester || 'Semester'}
          </span>
        </div>
      </div>

      {/* Stats Grid: Minimalist Labels */}
      <div className="grid grid-cols-2 gap-6 mt-10 pt-6 border-t border-gray-50">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">
            <BarChart3 size={10} className="text-gray-300" /> Success
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tighter">
            {course.overallPercentage}%
          </p>
        </div>
        <div className="space-y-1 text-right">
          <div className="flex items-center justify-end gap-1.5 text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">
             Students <Users size={10} className="text-gray-300" />
          </div>
          <p className="text-2xl font-black text-gray-900 tracking-tighter">
            {course.uniqueStudents}
          </p>
        </div>
      </div>

      {/* Primary Action */}
      <Link 
        to={`/course/${course.id}/attendance`}
        className="mt-8 group/btn w-full flex items-center justify-between px-6 py-4 bg-gray-50 text-gray-900 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all hover:bg-gray-900 hover:text-white"
      >
        <span>Manage Attendance</span>
        <ChevronRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
      </Link>
    </div>
  );
};

export default CourseCard;