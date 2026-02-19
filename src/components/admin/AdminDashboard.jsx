import React, { useState } from 'react';
import Card from '../common/Card';
import SearchBar from '../common/SearchBar';
import FilterPanel from './FilterPanel';
import CoursesOverview from './CoursesOverview';
import StudentsOverview from './StudentsOverview';
import SessionsOverview from './SessionsOverview';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('courses');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});

  const stats = {
    totalCourses: 24,
    totalStudents: 1250,
    activeSessions: 8,
    averageAttendance: '87%'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">System Overview & Management</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Total Courses</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalCourses}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Total Students</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Active Sessions</p>
            <p className="text-2xl font-bold text-gray-800">{stats.activeSessions}</p>
          </div>
        </Card>
        <Card className="bg-white">
          <div className="p-4">
            <p className="text-sm text-gray-500">Avg. Attendance</p>
            <p className="text-2xl font-bold text-gray-800">{stats.averageAttendance}</p>
          </div>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search courses, students, or sessions..."
          />
        </div>
        <FilterPanel filters={filters} onChange={setFilters} />
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'courses'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Students
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'sessions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Sessions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <Card>
        {activeTab === 'courses' && <CoursesOverview searchQuery={searchQuery} filters={filters} />}
        {activeTab === 'students' && <StudentsOverview searchQuery={searchQuery} filters={filters} />}
        {activeTab === 'sessions' && <SessionsOverview searchQuery={searchQuery} filters={filters} />}
      </Card>
    </div>
  );
};

export default AdminDashboard;