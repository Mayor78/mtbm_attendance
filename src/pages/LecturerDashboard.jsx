import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLecturerData } from '../hooks/useLecturerData';
import { 
  BookOpen, Users, TrendingUp, AlertCircle,
  Calendar, RefreshCw, Layers, BookMarked,
  UserCheck, UserX, PieChart 
} from 'lucide-react';

// Import components
import CourseGroup from '../components/lecturer/CourseGroup';
import SessionOverview from '../components/lecturer/SessionOverview';
import PerformanceMetrics from '../components/lecturer/PerformanceMetrics';
import QuickStats from '../components/lecturer/QuickStats';
import PendingApprovals from '../components/lecturer/PendingApprovals';
import RecentActivity from '../components/lecturer/RecentActivity';
import StudentOverview from '../components/lecturer/StudentOverview';

const CourseCard = ({ course }) => (
  <div className="bg-white border border-gray-100 rounded-lg p-4 hover:border-gray-200 transition-colors">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-gray-900">{course.course_code}</h3>
        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{course.course_title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">{course.department}</span>
          <span className="w-1 h-1 bg-gray-300 rounded-full" />
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
            L{course.level}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const LecturerDashboard = () => {
  const { profile, lecturer } = useAuth();
  const { 
    courses, 
    groupedCourses, 
    loading, 
    error: hookError, 
    stats, 
    refetch,
    getAllDepartmentStudents 
  } = useLecturerData(lecturer?.id);  

  const [selectedGroup, setSelectedGroup] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [showStudentOverview, setShowStudentOverview] = useState(false);

  const filterOptions = [
    { id: 'all', label: 'All', icon: Layers },
    ...Object.keys(groupedCourses).map(key => ({
      id: key,
      label: key.split(' - ')[1] || key,
      icon: BookMarked
    }))
  ];

  const filteredCourses = selectedGroup === 'all' 
    ? courses 
    : groupedCourses[selectedGroup]?.courses || [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-gray-900"></div>
        <p className="mt-4 text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Error Display */}
      {hookError && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{hookError}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {profile?.full_name?.split(' ')[0] || 'Lecturer'}
            </h1>
            <p className="text-sm text-gray-500">
              {courses.length} courses • {stats.departments.length} depts
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300"
            >
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="semester">Semester</option>
            </select>
            <button
              onClick={refetch}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
            >
              <RefreshCw size={16} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <QuickStats stats={stats} />

      {/* Student Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowStudentOverview(!showStudentOverview)}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
        >
          <Users size={16} className="text-gray-500" />
          <span>{showStudentOverview ? 'Hide' : 'View'} Students</span>
        </button>
      </div>

      {/* Student Overview */}
      {showStudentOverview && (
        <StudentOverview 
          lecturerId={lecturer?.id}
          courses={courses}
          getAllDepartmentStudents={getAllDepartmentStudents}
        />
      )}

      {/* Sessions */}
      <div className="bg-white border border-gray-100 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          Sessions
        </h3>
        <SessionOverview courses={courses} lecturerId={lecturer?.id} />
      </div>

      {/* Course Navigation */}
      {Object.keys(groupedCourses).length > 0 && (
        <div className="flex overflow-x-auto gap-1 pb-1">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedGroup(option.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${
                selectedGroup === option.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <option.icon size={14} />
              <span className="text-xs">{option.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Courses */}
        <div className="lg:col-span-2 space-y-4">
          {Object.keys(groupedCourses).length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center border border-gray-100">
              <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-500">No courses assigned</p>
            </div>
          ) : selectedGroup === 'all' ? (
            Object.entries(groupedCourses).map(([key, group]) => (
              <CourseGroup
                key={key}
                group={group}
                onViewGroup={() => setSelectedGroup(key)}
              />
            ))
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-gray-900">
                  {selectedGroup.split(' - ')[1] || selectedGroup}
                </h2>
                <span className="text-xs text-gray-400">
                  {groupedCourses[selectedGroup]?.courses.length} courses
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {groupedCourses[selectedGroup]?.courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Analytics */}
        <div className="space-y-4">
          {/* <PerformanceMetrics 
            courses={courses} 
            groupedCourses={groupedCourses}
            dateRange={dateRange}
          /> */}
          
          <PendingApprovals 
            courses={filteredCourses}
            onApprove={refetch}
          />
          
          <div className="bg-white border border-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <TrendingUp size={16} className="text-gray-400" />
              Activity
            </h3>
            <RecentActivity courses={filteredCourses} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;