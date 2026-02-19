import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = ({ userRole, isMobile = false, onClose }) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: '📊', label: 'Dashboard' }
    ];

    const studentItems = [
      { path: '/student/courses', icon: '📚', label: 'My Courses' },
      { path: '/student/attendance', icon: '✅', label: 'Attendance' },
      { path: '/student/timetable', icon: '📅', label: 'Timetable' },
      { path: '/student/notifications', icon: '🔔', label: 'Notifications' },
      { path: '/student/profile', icon: '👤', label: 'Profile' }
    ];

    const lecturerItems = [
      { path: '/lecturer/courses', icon: '📚', label: 'My Courses' },
      { path: '/lecturer/sessions', icon: '📅', label: 'Sessions' },
      { path: '/lecturer/students', icon: '👥', label: 'Students' },
      { path: '/lecturer/reports', icon: '📈', label: 'Reports' },
      { path: '/lecturer/notifications', icon: '🔔', label: 'Notifications' },
      { path: '/lecturer/profile', icon: '👤', label: 'Profile' }
    ];

    const adminItems = [
      { path: '/admin/users', icon: '👥', label: 'Users' },
      { path: '/admin/courses', icon: '📚', label: 'Courses' },
      { path: '/admin/sessions', icon: '📅', label: 'Sessions' },
      { path: '/admin/departments', icon: '🏛️', label: 'Departments' },
      { path: '/admin/reports', icon: '📊', label: 'Analytics' },
      { path: '/admin/settings', icon: '⚙️', label: 'Settings' }
    ];

    switch(userRole) {
      case 'student':
        return [...commonItems, ...studentItems];
      case 'lecturer':
        return [...commonItems, ...lecturerItems];
      case 'admin':
        return [...commonItems, ...adminItems];
      default:
        return commonItems;
    }
  };

  const navItems = getNavItems();

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const sidebarClasses = `
    fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 transition-all duration-300 z-20
    ${collapsed ? 'w-20' : 'w-64'}
    ${isMobile ? 'block' : 'hidden lg:block'}
  `;

  return (
    <aside className={sidebarClasses}>
      {/* Collapse toggle button (desktop only) */}
      {!isMobile && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-5 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50"
        >
          <svg 
            className={`h-4 w-4 text-gray-500 transform transition-transform ${collapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Navigation */}
      <nav className="p-4 h-full overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => handleNavigation(item.path)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                  ${window.location.pathname === item.path 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-100'
                  }
                `}
                title={collapsed ? item.label : ''}
              >
                <span className="text-xl">{item.icon}</span>
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>

        {/* Quick Stats (only when expanded) */}
        {!collapsed && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-3">
              Quick Stats
            </h4>
            
            {userRole === 'student' && (
              <div className="space-y-3 px-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Attendance</span>
                    <span className="font-medium text-green-600">87%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: '87%' }}></div>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Next Class</p>
                  <p className="text-sm font-medium text-gray-800">CS101 - 10:00 AM</p>
                </div>
              </div>
            )}

            {userRole === 'lecturer' && (
              <div className="space-y-3 px-3">
                <div>
                  <p className="text-xs text-gray-500">Today's Sessions</p>
                  <p className="text-sm font-medium text-gray-800">2 sessions</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total Students</p>
                  <p className="text-sm font-medium text-gray-800">127 enrolled</p>
                </div>
              </div>
            )}

            {userRole === 'admin' && (
              <div className="space-y-3 px-3">
                <div>
                  <p className="text-xs text-gray-500">Active Users</p>
                  <p className="text-sm font-medium text-gray-800">1,250 online</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">System Health</p>
                  <p className="text-sm font-medium text-green-600">99.9% uptime</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help section */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💬</span>
                <span className="text-xs font-medium text-gray-700">Need Help?</span>
              </div>
              <p className="text-xs text-gray-500 mb-2">Contact support or check documentation</p>
              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                View Help Center →
              </button>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

// Mobile Sidebar Component
export const MobileSidebar = ({ userRole, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="lg:hidden fixed inset-0 z-40">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <div className="fixed top-0 left-0 bottom-0 w-64 bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📚</span>
            <span className="text-lg font-bold text-gray-800">UniAttend</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <Sidebar userRole={userRole} isMobile={true} onClose={onClose} />
      </div>
    </div>
  );
};

export default Sidebar;