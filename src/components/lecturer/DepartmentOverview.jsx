// components/lecturer/DepartmentOverview.jsx
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, BookOpen, TrendingUp, TrendingDown,
  Clock, AlertCircle, ChevronRight, BarChart2, GraduationCap,
  Calendar, Download, Filter, Eye
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

const DepartmentOverview = ({ courses, groupedCourses }) => {
  const [expandedDept, setExpandedDept] = useState(null);
  const [departmentStats, setDepartmentStats] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Object.keys(groupedCourses).length) {
      calculateDepartmentStats();
    }
  }, [groupedCourses]);

  const calculateDepartmentStats = async () => {
    setLoading(true);
    const stats = {};

    for (const [key, group] of Object.entries(groupedCourses)) {
      const [department, level] = key.split(' - ');
      
      if (!stats[department]) {
        stats[department] = {
          name: department,
          levels: [],
          totalCourses: 0,
          totalStudents: 0,
          avgAttendance: 0,
          activeSessions: 0,
          pendingApprovals: 0,
          performance: 'good', // 'good', 'average', 'poor'
          courses: []
        };
      }

      stats[department].levels.push(level);
      stats[department].totalCourses += group.courses.length;
      stats[department].totalStudents += group.totalStudents || 0;
      stats[department].avgAttendance = 
        (stats[department].avgAttendance + (group.avgAttendance || 0)) / 2;
      stats[department].courses.push(...group.courses);
    }

    // Calculate performance rating
    Object.keys(stats).forEach(dept => {
      const attendance = stats[dept].avgAttendance;
      stats[dept].performance = 
        attendance >= 75 ? 'good' :
        attendance >= 50 ? 'average' : 'poor';
    });

    setDepartmentStats(stats);
    setLoading(false);
  };

  const getPerformanceColor = (performance) => {
    switch(performance) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'average': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getAttendanceColor = (attendance) => {
    if (attendance >= 75) return 'text-green-600';
    if (attendance >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Building2 size={20} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Departments</p>
              <p className="text-2xl font-bold text-slate-900">
                {Object.keys(departmentStats).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Students</p>
              <p className="text-2xl font-bold text-slate-900">
                {Object.values(departmentStats).reduce((acc, dept) => acc + dept.totalStudents, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <BookOpen size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Courses</p>
              <p className="text-2xl font-bold text-slate-900">
                {courses.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Avg Attendance</p>
              <p className="text-2xl font-bold text-slate-900">
                {Math.round(Object.values(departmentStats).reduce((acc, dept) => acc + dept.avgAttendance, 0) / 
                  Object.keys(departmentStats).length || 0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Department List */}
      <div className="space-y-3">
        {Object.values(departmentStats).map((dept) => (
          <div
            key={dept.name}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-indigo-200 transition-colors"
          >
            {/* Department Header */}
            <div
              onClick={() => setExpandedDept(expandedDept === dept.name ? null : dept.name)}
              className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  dept.performance === 'good' ? 'bg-green-50' :
                  dept.performance === 'average' ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <Building2 size={20} className={
                    dept.performance === 'good' ? 'text-green-600' :
                    dept.performance === 'average' ? 'text-yellow-600' : 'text-red-600'
                  } />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{dept.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {dept.levels.map(level => (
                      <span key={level} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                        {level}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-500">Courses</p>
                  <p className="font-semibold">{dept.totalCourses}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Students</p>
                  <p className="font-semibold">{dept.totalStudents}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Attendance</p>
                  <p className={`font-semibold ${getAttendanceColor(dept.avgAttendance)}`}>
                    {Math.round(dept.avgAttendance)}%
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${getPerformanceColor(dept.performance)}`}>
                  {dept.performance.charAt(0).toUpperCase() + dept.performance.slice(1)}
                </div>
                <ChevronRight
                  size={20}
                  className={`text-slate-400 transition-transform ${
                    expandedDept === dept.name ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </div>

            {/* Expanded Details */}
            {expandedDept === dept.name && (
              <div className="p-4 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Courses by Level */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Courses by Level</h4>
                    <div className="space-y-3">
                      {dept.levels.map(level => {
                        const levelCourses = dept.courses.filter(c => c.level === level);
                        return (
                          <div key={level} className="bg-white p-3 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-slate-800">Level {level}</span>
                              <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full">
                                {levelCourses.length} courses
                              </span>
                            </div>
                            <div className="space-y-2">
                              {levelCourses.slice(0, 3).map(course => (
                                <div key={course.id} className="flex justify-between text-sm">
                                  <span className="text-slate-600">{course.course_code}</span>
                                  <span className="text-slate-900">{course.course_title}</span>
                                </div>
                              ))}
                              {levelCourses.length > 3 && (
                                <button className="text-xs text-indigo-600 hover:text-indigo-700">
                                  +{levelCourses.length - 3} more
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Department Insights</h4>
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-lg">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-600">Attendance Trend</span>
                          <span className="text-sm font-medium">{Math.round(dept.avgAttendance)}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              dept.avgAttendance >= 75 ? 'bg-green-500' :
                              dept.avgAttendance >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${dept.avgAttendance}%` }}
                          />
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-sm text-slate-600 mb-2">Student Distribution</p>
                        <div className="space-y-2">
                          {dept.levels.map(level => {
                            const levelCourses = dept.courses.filter(c => c.level === level);
                            const levelStudents = levelCourses.reduce((acc, c) => acc + (c.students || 0), 0);
                            return (
                              <div key={level} className="flex justify-between text-sm">
                                <span className="text-slate-500">Level {level}</span>
                                <span className="font-medium">{levelStudents} students</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="bg-white p-3 rounded-lg">
                        <p className="text-sm text-slate-600 mb-2">Active Issues</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Pending Approvals</span>
                            <span className="font-medium text-yellow-600">3</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">At-Risk Students</span>
                            <span className="font-medium text-red-600">8</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Active Sessions</span>
                            <span className="font-medium text-green-600">2</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
                  <Link
                    to={`/department/${dept.name}/attendance`}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2"
                  >
                    <Eye size={16} />
                    View Department Report
                  </Link>
                  <button className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 flex items-center gap-2">
                    <Download size={16} />
                    Export Data
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(departmentStats).length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900">No Departments Found</h3>
          <p className="text-sm text-slate-500 mt-1">
            You haven't been assigned to any departments yet.
          </p>
        </div>
      )}
    </div>
  );
};

export default DepartmentOverview;