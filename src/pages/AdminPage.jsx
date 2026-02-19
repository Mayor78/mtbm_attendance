import React, { useState } from 'react';
import Layout from '../components/common/layouts/Layout';
import AdminDashboard from '../components/admin/AdminDashboard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const AdminPage = () => {
  const [dateRange, setDateRange] = useState('week');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Mock admin data
  const adminInfo = {
    name: 'Dr. Michael Chen',
    role: 'System Administrator',
    email: 'm.chen@university.edu',
    lastLogin: '2024-01-15 08:30 AM'
  };

  // Mock system stats
  const systemStats = {
    activeUsers: 1250,
    activeSessions: 8,
    todaysAttendance: 892,
    systemUptime: '99.9%'
  };

  // Mock departments
  const departments = [
    'All Departments',
    'Computer Science',
    'Mathematics',
    'Physics',
    'Chemistry',
    'English',
    'History'
  ];

  // Mock recent activities
  const recentActivities = [
    { time: '2 min ago', action: 'Attendance session started', course: 'CS101', by: 'Dr. Smith' },
    { time: '15 min ago', action: 'Session closed', course: 'MATH202', by: 'Prof. Johnson' },
    { time: '1 hour ago', action: 'New student enrolled', course: 'PHY101', by: 'Admin' },
    { time: '2 hours ago', action: 'Report exported', course: 'ENG205', by: 'Dr. Williams' }
  ];

  return (
    <Layout userRole="admin">
      {/* Admin Header */}
      <div className="mb-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-1">Admin Control Panel</h2>
            <p className="text-gray-300">
              {adminInfo.name} • {adminInfo.role} • Last login: {adminInfo.lastLogin}
            </p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30">
              📊 Generate Report
            </Button>
            <Button variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30 hover:bg-opacity-30">
              ⚙️ System Settings
            </Button>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-xs text-gray-300">Active Users</p>
            <p className="text-xl font-semibold">{systemStats.activeUsers}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-xs text-gray-300">Active Sessions</p>
            <p className="text-xl font-semibold">{systemStats.activeSessions}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-xs text-gray-300">Today's Attendance</p>
            <p className="text-xl font-semibold">{systemStats.todaysAttendance}</p>
          </div>
          <div className="bg-white bg-opacity-10 rounded-lg p-3">
            <p className="text-xs text-gray-300">System Uptime</p>
            <p className="text-xl font-semibold">{systemStats.systemUptime}</p>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Department</label>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            {departments.map(dept => (
              <option key={dept} value={dept.toLowerCase()}>{dept}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Date Range</label>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="semester">This Semester</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-600 mb-1">Attendance Status</label>
          <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none">
            <option>All</option>
            <option>Present</option>
            <option>Absent</option>
            <option>Late</option>
            <option>Excused</option>
          </select>
        </div>

        <div className="flex items-end">
          <Button variant="primary" className="w-full">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <AdminDashboard />

      {/* Recent Activity Section */}
      <div className="mt-8">
        <Card title="Recent System Activity">
          <div className="divide-y divide-gray-100">
            {recentActivities.map((activity, index) => (
              <div key={index} className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm text-gray-800">{activity.action}</p>
                    <p className="text-xs text-gray-500">
                      {activity.course} • by {activity.by}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:text-blue-700">
              View All Activity →
            </button>
          </div>
        </Card>
      </div>

      {/* Quick Access Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-800">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">Manage students, lecturers, and staff accounts</p>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">📚</span>
            </div>
            <h3 className="font-semibold text-gray-800">Course Management</h3>
            <p className="text-sm text-gray-600 mt-1">Create and manage courses, schedules, and enrollments</p>
          </div>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <div className="p-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
              <span className="text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-800">Analytics Dashboard</h3>
            <p className="text-sm text-gray-600 mt-1">View detailed attendance analytics and reports</p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminPage;