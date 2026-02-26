// components/lecturer/CourseOverview.jsx
import React, { useState } from 'react';
import { Eye, Users, Clock, TrendingUp, ChevronRight, Download, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const CourseOverview = ({ courses, onRefresh }) => {
  const [expandedCourse, setExpandedCourse] = useState(null);

  if (!courses.length) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen size={24} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No Courses Found</h3>
        <p className="text-sm text-slate-500 mt-1">
          You haven't been assigned to any courses yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-200 transition-colors"
        >
          {/* Course Header */}
          <div
            onClick={() => setExpandedCourse(expandedCourse === course.id ? null : course.id)}
            className="p-4 bg-white cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{course.course_code}</h3>
                <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                  Level {course.level}
                </span>
              </div>
              <p className="text-sm text-slate-600 mt-1">{course.course_title}</p>
              <p className="text-xs text-slate-400 mt-1">{course.department} • {course.semester}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Users size={16} />
                <span>45 students</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock size={16} />
                <span>12 sessions</span>
              </div>
              <ChevronRight
                size={20}
                className={`text-slate-400 transition-transform ${
                  expandedCourse === course.id ? 'rotate-90' : ''
                }`}
              />
            </div>
          </div>

          {/* Expanded Details */}
          {expandedCourse === course.id && (
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Attendance Overview</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Average Attendance</span>
                      <span className="font-medium text-indigo-600">78%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500 mt-2">
                      <span>Total Sessions: 12</span>
                      <span>Avg per session: 35 students</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-slate-700 mb-3">HOC Information</h4>
                  <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Primary HOC:</span> John Doe
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Active Sessions:</span> 1 ongoing
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Last Session:</span> Today 10:30 AM
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <Link
                  to={`/course/${course.id}/attendance`}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Eye size={16} />
                  View Details
                </Link>
                <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                  <Download size={16} />
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CourseOverview;