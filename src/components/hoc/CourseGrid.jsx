import React from 'react';
import { BookMarked, RefreshCw, GraduationCap, Plus } from 'lucide-react';
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
      <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <GraduationCap size={36} className="text-gray-300" />
        </div>
        <h3 className="text-gray-900 font-semibold text-lg mb-2">No Courses Yet</h3>
        <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
          Get started by adding your first course.
        </p>
        <button 
          onClick={onAddCourse} 
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <Plus size={16} />
          Add Course
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookMarked size={18} className="text-gray-400" />
          <h2 className="text-sm font-medium text-gray-700">My Courses</h2>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
            {courses.length}
          </span>
        </div>
        
        <button 
          onClick={onRefresh} 
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedCourses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onEdit={onEditCourse}
            onDelete={onDeleteCourse}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-gray-100">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default CourseGrid;