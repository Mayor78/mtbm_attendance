import React, { useState } from 'react';
import Layout from '../components/common/layouts/Layout';
import LecturerDashboard from '../components/lecturer/LecturerDashboard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const LecturerPage = () => {
  const [selectedCourse, setSelectedCourse] = useState('CS101');

  // Mock lecturer data
  const lecturerInfo = {
    name: 'Dr. Sarah Smith',
    id: 'LEC2024012',
    email: 's.smith@university.edu',
    department: 'Computer Science'
  };

  // Mock courses taught
  const courses = [
    { code: 'CS101', name: 'Introduction to Programming', schedule: 'Mon/Wed 10:00 AM', students: 45 },
    { code: 'CS301', name: 'Database Systems', schedule: 'Tue/Thu 2:00 PM', students: 38 },
    { code: 'CS401', name: 'Machine Learning', schedule: 'Fri 9:00 AM', students: 32 }
  ];

  return (
    <Layout userRole="lecturer">
      {/* Header with Course Selector */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              {lecturerInfo.name}
            </h2>
            <p className="text-gray-600">
              {lecturerInfo.department} • ID: {lecturerInfo.id}
            </p>
          </div>
          
          {/* Course Selector */}
          <div className="mt-4 md:mt-0">
            <label className="block text-sm text-gray-600 mb-1">Select Course</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              {courses.map(course => (
                <option key={course.code} value={course.code}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Course Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {courses.find(c => c.code === selectedCourse) && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Schedule:</span>
                <span className="font-medium text-gray-700">
                  {courses.find(c => c.code === selectedCourse).schedule}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Total Students:</span>
                <span className="font-medium text-gray-700">
                  {courses.find(c => c.code === selectedCourse).students}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Today's Attendance:</span>
                <span className="font-medium text-green-600">In Progress</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Dashboard Content */}
      <LecturerDashboard courseCode={selectedCourse} />
    </Layout>
  );
};

export default LecturerPage;