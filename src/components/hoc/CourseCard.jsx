import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Trash2, ChevronRight } from 'lucide-react';

const CourseCard = ({ course, onEdit, onDelete }) => {
  return (
    <div className="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full">
      <div className="flex justify-between items-start mb-6">
        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs">
          {course.course_code?.substring(0, 3)}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(course)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
            <Edit size={16} />
          </button>
          <button onClick={() => onDelete(course.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1">
        <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
          {course.course_title}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">
            {course.course_code}
          </span>
          <span className="text-slate-300">•</span>
          <span className="text-xs text-slate-400 font-medium">{course.semester}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
        <div>
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Success Rate</p>
          <p className="text-2xl font-black text-indigo-600 tracking-tighter">{course.overallPercentage}%</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Student Count</p>
          <p className="text-2xl font-black text-slate-800 tracking-tighter">{course.uniqueStudents}</p>
        </div>
      </div>

      <Link 
        to={`/course/${course.id}/attendance`}
        className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
      >
        Manage Attendance <ChevronRight size={16} />
      </Link>
    </div>
  );
};

export default CourseCard;