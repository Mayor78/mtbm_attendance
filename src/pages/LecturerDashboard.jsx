import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLecturerData } from '../hooks/useLecturerData';
import { 
  BookOpen, Users, TrendingUp, AlertCircle, Download,
  Calendar, Clock, CheckCircle, XCircle, Eye, Filter,
  BarChart2, GraduationCap, RefreshCw, ChevronRight,
  UserCheck, UserX, FileText, Settings, Layers,
  School, BookMarked, PieChart
} from 'lucide-react';

// Import components
import CourseGroup from '../components/lecturer/CourseGroup';
import DepartmentOverview from '../components/lecturer/DepartmentOverview';
import TeachingSchedule from '../components/lecturer/TeachingSchedule';
import PerformanceMetrics from '../components/lecturer/PerformanceMetrics';
import QuickStats from '../components/lecturer/QuickStats';
import PendingApprovals from '../components/lecturer/PendingApprovals';
import RecentActivity from '../components/lecturer/RecentActivity';
import StudentOverview from '../components/lecturer/StudentOverview'; // Import StudentOverview

const CourseCard = ({ course }) => (
  <div className="bg-white border border-slate-200 rounded-lg p-4 hover:border-indigo-200 transition-colors">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="font-medium text-slate-900">{course.course_code}</h3>
        <p className="text-sm text-slate-600 mt-1">{course.course_title}</p>
        <p className="text-xs text-slate-400 mt-1">{course.department} • Level {course.level}</p>
      </div>
      <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
        {course.semester || 'N/A'}
      </span>
    </div>
  </div>
);

export const LecturerDashboard = () => {
  const { user, profile, lecturer } = useAuth();
  const { 
    courses, 
    groupedCourses, 
    loading, 
    error: hookError, 
    stats, 
    refetch,
    getAllDepartmentStudents  // Get the function from hook
  } = useLecturerData(lecturer?.id);  

  const [selectedGroup, setSelectedGroup] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [showStudentOverview, setShowStudentOverview] = useState(false); // State for toggling student view

  const filterOptions = [
    { id: 'all', label: 'All Courses', icon: Layers },
    ...Object.keys(groupedCourses).map(key => ({
      id: key,
      label: key,
      icon: BookMarked
    }))
  ];

  const filteredCourses = selectedGroup === 'all' 
    ? courses 
    : groupedCourses[selectedGroup]?.courses || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Error Display */}
      {hookError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {hookError}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome, {profile?.full_name?.split(' ')[0] || 'Lecturer'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lecturer?.department || 'Academic Staff'} • Staff ID: {lecturer?.staff_id || 'N/A'}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {stats.departments.map(dept => (
              <span key={dept} className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                {dept}
              </span>
            ))}
            {stats.levels.map(level => (
              <span key={level} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">
                Level {level}
              </span>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
          </select>
          <button
            onClick={refetch}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            title="Refresh Data"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={stats} />

      {/* Department Students Toggle Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowStudentOverview(!showStudentOverview)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <Users size={16} className={showStudentOverview ? 'text-indigo-600' : 'text-gray-600'} />
          <span className={showStudentOverview ? 'text-indigo-600 font-medium' : 'text-gray-700'}>
            {showStudentOverview ? 'Hide Department Students' : 'View Department Students'}
          </span>
        </button>
      </div>

      {/* Student Overview Section */}
      {showStudentOverview && (
        <StudentOverview 
          lecturerId={lecturer?.id}
          courses={courses}
          getAllDepartmentStudents={getAllDepartmentStudents} // Pass the function
        />
      )}

      {/* Filter Tabs */}
      {Object.keys(groupedCourses).length > 0 && (
        <div className="flex overflow-x-auto gap-2 pb-2">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedGroup(option.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedGroup === option.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <option.icon size={16} />
              {option.label.length > 30 ? option.label.substring(0, 30) + '...' : option.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Courses and Groups */}
        <div className="lg:col-span-2 space-y-6">
          {Object.keys(groupedCourses).length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
              <BookOpen size={40} className="mx-auto text-slate-300 mb-3" />
              <h3 className="text-lg font-medium text-slate-900">No Courses Found</h3>
              <p className="text-sm text-slate-500 mt-1">
                There are no courses in the system yet.
              </p>
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
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <BookMarked size={20} className="text-indigo-600" />
                {selectedGroup}
              </h2>
              <div className="grid grid-cols-1 gap-4">
                {groupedCourses[selectedGroup]?.courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Analytics and Activity */}
        <div className="space-y-6">
          <TeachingSchedule courses={filteredCourses} />
          <PerformanceMetrics 
            courses={courses} 
            groupedCourses={groupedCourses}
            dateRange={dateRange}
          />
          <PendingApprovals 
            courses={filteredCourses}
            onApprove={refetch}
          />
          <RecentActivity courses={filteredCourses} />
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;