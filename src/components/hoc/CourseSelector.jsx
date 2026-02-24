// CourseSelector.jsx
import React from 'react';

const CourseSelector = ({ courses, selectedCourse, onCourseChange }) => {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
        Select Course
      </label>
      <select
        value={selectedCourse}
        onChange={(e) => onCourseChange(e.target.value)}
        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
      >
        <option value="">Choose a course...</option>
        {courses.map((course) => (
          <option key={course.id} value={course.id}>
            {course.course_code} - {course.course_title} (Level {course.level})
          </option>
        ))}
      </select>
    </div>
  );
};

export default CourseSelector;