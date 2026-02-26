import React from 'react';
import { BookMarked, RefreshCw, GraduationCap } from 'lucide-react';
import CourseCard from './CourseCard';
import Pagination from './Pagination';

const CourseGrid = ({ 
  courses, 
  paginatedCourses, 
  currentPage, 
  totalPages, 
  onPageChange, 
  onRefresh, 
  onAddCourse,
  onEditCourse,
  onDeleteCourse
}) => {
  if (courses.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
          <GraduationCap size={40} />
        </div>
        <h3 className="text-slate-900 font-black text-xl">No courses registered</h3>
        <p className="text-slate-500 mb-8 max-w-xs mx-auto">
          Build your academic portfolio by adding your first course today.
        </p>
        <button 
          onClick={onAddCourse} 
          className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:shadow-xl transition-all"
        >
          Add First Course
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <BookMarked size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">My Courses</h2>
        </div>
        <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {paginatedCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEdit={onEditCourse}
            onDelete={onDeleteCourse}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </section>
  );
};

export default CourseGrid;