import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLecturerData } from '../hooks/useLecturerData';
import { 
  BookOpen, Users, TrendingUp, AlertCircle, Download,
  Calendar, Clock, CheckCircle, XCircle, Eye, Filter,
  BarChart2, GraduationCap, RefreshCw, ChevronRight,
  UserCheck, UserX, FileText, Settings, Layers,
  School, BookMarked, PieChart, Sparkles
} from 'lucide-react';

// Import components
import CourseGroup from '../components/lecturer/CourseGroup';
import DepartmentOverview from '../components/lecturer/DepartmentOverview';
import TeachingSchedule from '../components/lecturer/TeachingSchedule';
import SessionOverview from '../components/lecturer/SessionOverview';
import PerformanceMetrics from '../components/lecturer/PerformanceMetrics';
import QuickStats from '../components/lecturer/QuickStats';
import PendingApprovals from '../components/lecturer/PendingApprovals';
import RecentActivity from '../components/lecturer/RecentActivity';
import StudentOverview from '../components/lecturer/StudentOverview';

const CourseCard = ({ course }) => (
  <div className="group bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all cursor-pointer">
    <div className="flex justify-between items-start">
      <div className="space-y-1">
        <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{course.course_code}</h3>
        <p className="text-sm font-medium text-gray-600 leading-snug">{course.course_title}</p>
        <div className="flex items-center gap-2 pt-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{course.department}</span>
          <span className="w-1 h-1 rounded-full bg-gray-200" />
          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">Level {course.level}</span>
        </div>
      </div>
      <span className="text-[10px] font-black px-2.5 py-1 bg-gray-900 text-white rounded-lg uppercase tracking-widest">
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
    getAllDepartmentStudents 
  } = useLecturerData(lecturer?.id);  

  const [selectedGroup, setSelectedGroup] = useState('all');
  const [dateRange, setDateRange] = useState('week');
  const [showStudentOverview, setShowStudentOverview] = useState(false);

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
            <div className="h-12 w-12 border-4 border-indigo-50 rounded-full" />
            <div className="absolute top-0 h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-400 animate-pulse uppercase tracking-widest">Initializing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8 bg-gray-50/30 min-h-screen">
      {/* Error Display */}
      {hookError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-2xl flex items-center gap-3">
          <AlertCircle size={18} />
          <p className="text-sm font-medium">{hookError}</p>
        </div>
      )}

      {/* Header Section */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <Sparkles size={120} className="text-indigo-600" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <span className="h-2 w-8 bg-indigo-600 rounded-full" />
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                  Hello, {profile?.full_name?.split(' ')[0] || 'Lecturer'}!
                </h1>
            </div>
            <p className="text-gray-500 font-medium max-w-md">
              Managing <span className="text-indigo-600 font-bold">{courses.length} courses</span> across {stats.departments.length} departments today.
            </p>
            <div className="flex flex-wrap gap-2 mt-4">
              {stats.departments.map(dept => (
                <span key={dept} className="text-[10px] font-bold px-3 py-1 bg-white border border-gray-100 text-gray-600 rounded-full shadow-sm">
                  {dept}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-3 pr-8 py-2 bg-transparent text-sm font-bold text-gray-700 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="week">Weekly View</option>
              <option value="month">Monthly View</option>
              <option value="semester">Full Semester</option>
            </select>
            <button
              onClick={refetch}
              className="p-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:text-indigo-600 transition-all"
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <QuickStats stats={stats} />

      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-gray-900">Academic Hub</h2>
        <button
          onClick={() => setShowStudentOverview(!showStudentOverview)}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg ${
            showStudentOverview 
              ? 'bg-gray-900 text-white shadow-gray-200' 
              : 'bg-white text-indigo-600 border border-indigo-50 shadow-indigo-100 hover:shadow-indigo-200'
          }`}
        >
          {showStudentOverview ? <UserX size={18} /> : <UserCheck size={18} />}
          {showStudentOverview ? 'Close Student List' : 'Department Students'}
        </button>
      </div>

        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-1 overflow-hidden shadow-sm">
                <div className="p-6">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
                        <PieChart size={16} className="text-indigo-600" />
                        Live Sessions
                    </h3>
                </div>
                <SessionOverview courses={courses} lecturerId={lecturer?.id} />
            </div>

      {/* Student Overview Section */}
      {showStudentOverview && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          <StudentOverview 
            lecturerId={lecturer?.id}
            courses={courses}
            getAllDepartmentStudents={getAllDepartmentStudents}
          />
        </div>
      )}

      {/* Navigation Tabs */}
      {Object.keys(groupedCourses).length > 0 && (
        <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar">
          {filterOptions.map(option => (
            <button
              key={option.id}
              onClick={() => setSelectedGroup(option.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                selectedGroup === option.id
                  ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200 translate-y-[-2px]'
                  : 'bg-white text-gray-400 hover:text-gray-600 border border-gray-100'
              }`}
            >
              <option.icon size={14} strokeWidth={3} />
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Dashboard Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Main Feed: Courses */}
        <div className="lg:col-span-8 space-y-6">
          {Object.keys(groupedCourses).length === 0 ? (
            <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-gray-200">
              <div className="bg-gray-50 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen size={32} className="text-gray-300" />
              </div>
              <h3 className="text-xl font-black text-gray-900">No Assigned Courses</h3>
              <p className="text-gray-500 mt-2 font-medium">Your course list will appear here once assigned.</p>
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
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black flex items-center gap-3 text-gray-900 uppercase tracking-tight">
                  <div className="h-8 w-1 bg-indigo-600 rounded-full" />
                  {selectedGroup}
                </h2>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  {groupedCourses[selectedGroup]?.courses.length} Courses
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {groupedCourses[selectedGroup]?.courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Intelligence Column: Analytics & Approvals */}
        <div className="lg:col-span-4 space-y-8">
          

            <PerformanceMetrics 
                courses={courses} 
                groupedCourses={groupedCourses}
                dateRange={dateRange}
            />
            
            <PendingApprovals 
                courses={filteredCourses}
                onApprove={refetch}
            />
            
            <div className="bg-indigo-900 rounded-[2rem] p-6 text-white shadow-2xl shadow-indigo-200">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                    <TrendingUp size={18} />
                    System Activity
                </h3>
                <RecentActivity courses={filteredCourses} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;