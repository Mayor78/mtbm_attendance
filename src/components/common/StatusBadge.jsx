import React from 'react';
import StatusBadge from '../common/StatusBadge';

const StudentBadge = ({
  student = {}, // Provide default empty object
  size = 'md',
  variant = 'default',
  showId = true,
  showStatus = false,
  onClick,
  className = ''
}) => {
  // Safe access with default values
  const safeStudent = {
    name: student?.name || 'Unknown Student',
    id: student?.id || 'N/A',
    avatar: student?.avatar || '👤',
    status: student?.status || 'inactive',
    badge: student?.badge || null,
    details: student?.details || null,
    attendance: student?.attendance || 0,
    action: student?.action || null,
    ...student
  };

  const sizeClasses = {
    sm: {
      container: 'p-2',
      avatar: 'w-8 h-8 text-sm',
      name: 'text-xs',
      id: 'text-xs',
      details: 'text-xs'
    },
    md: {
      container: 'p-3',
      avatar: 'w-10 h-10 text-base',
      name: 'text-sm',
      id: 'text-xs',
      details: 'text-sm'
    },
    lg: {
      container: 'p-4',
      avatar: 'w-12 h-12 text-lg',
      name: 'text-base',
      id: 'text-sm',
      details: 'text-base'
    }
  };

  const variantClasses = {
    default: 'bg-white border border-gray-200 hover:bg-gray-50',
    primary: 'bg-blue-50 border border-blue-200 hover:bg-blue-100',
    success: 'bg-green-50 border border-green-200 hover:bg-green-100',
    warning: 'bg-yellow-50 border border-yellow-200 hover:bg-yellow-100',
    danger: 'bg-red-50 border border-red-200 hover:bg-red-100'
  };

  const statusColors = {
    present: 'bg-green-500',
    absent: 'bg-red-500',
    late: 'bg-yellow-500',
    excused: 'bg-gray-500',
    active: 'bg-green-500',
    inactive: 'bg-gray-500'
  };

  const handleClick = () => {
    if (onClick) {
      onClick(safeStudent);
    }
  };

  // Get size classes safely
  const currentSize = sizeClasses[size] || sizeClasses.md;
  const currentVariant = variantClasses[variant] || variantClasses.default;

  return (
    <div
      className={`
        rounded-lg transition-colors
        ${currentSize.container}
        ${currentVariant}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
        ${className}
      `.trim()}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        {/* Avatar with status dot */}
        <div className="relative">
          <div className={`
            ${currentSize.avatar} 
            bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold
          `}>
            {safeStudent.avatar}
          </div>
          {showStatus && safeStudent.status && (
            <span className={`
              absolute -bottom-0.5 -right-0.5 w-3 h-3 
              rounded-full border-2 border-white
              ${statusColors[safeStudent.status] || 'bg-gray-500'}
            `}></span>
          )}
        </div>

        {/* Student Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`${currentSize.name} font-medium text-gray-800 truncate`}>
              {safeStudent.name}
            </p>
            {safeStudent.badge && (
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-xs rounded">
                {safeStudent.badge}
              </span>
            )}
          </div>
          
          {showId && safeStudent.id && (
            <p className={`${currentSize.id} text-gray-500 font-mono`}>
              {safeStudent.id}
            </p>
          )}

          {safeStudent.details && (
            <p className={`${currentSize.details} text-gray-600 mt-0.5`}>
              {safeStudent.details}
            </p>
          )}

          {safeStudent.attendance > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(safeStudent.attendance, 100)}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500">{safeStudent.attendance}%</span>
            </div>
          )}
        </div>

        {/* Right icon/action */}
        {safeStudent.action && (
          <div className="text-gray-400">
            {safeStudent.action}
          </div>
        )}
      </div>
    </div>
  );
};

// Compact Student Badge (for lists)
export const CompactStudentBadge = ({ student = {}, onClick, className = '' }) => {
  const safeStudent = {
    name: student?.name || 'Unknown',
    id: student?.id || 'N/A',
    avatar: student?.avatar || '👤',
    status: student?.status || null,
    ...student
  };

  return (
    <div
      className={`
        flex items-center gap-2 p-1.5 rounded hover:bg-gray-100 cursor-pointer
        ${className}
      `.trim()}
      onClick={() => onClick && onClick(safeStudent)}
    >
      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs text-blue-600">
        {safeStudent.avatar}
      </div>
      <div>
        <p className="text-xs font-medium text-gray-800">{safeStudent.name}</p>
        <p className="text-xs text-gray-500">{safeStudent.id}</p>
      </div>
      {safeStudent.status && (
        <span className={`
          ml-auto w-2 h-2 rounded-full
          ${safeStudent.status === 'present' ? 'bg-green-500' : ''}
          ${safeStudent.status === 'absent' ? 'bg-red-500' : ''}
          ${safeStudent.status === 'late' ? 'bg-yellow-500' : ''}
        `}></span>
      )}
    </div>
  );
};

// Student Badge with QR (for attendance marking)
export const StudentQRBadge = ({ student = {}, onScan, className = '' }) => {
  const safeStudent = {
    name: student?.name || 'Unknown',
    id: student?.id || 'N/A',
    avatar: student?.avatar || '👤',
    course: student?.course || 'No Course',
    ...student
  };

  return (
    <div className={`
      bg-white border border-gray-200 rounded-lg p-4
      ${className}
    `.trim()}>
      <div className="flex items-center gap-4">
        {/* Student Info */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl text-blue-600">
            {safeStudent.avatar}
          </div>
          <div>
            <p className="font-medium text-gray-800">{safeStudent.name}</p>
            <p className="text-sm text-gray-500">{safeStudent.id}</p>
            <p className="text-xs text-gray-400 mt-1">{safeStudent.course}</p>
          </div>
        </div>

        {/* QR Code placeholder */}
        <div className="w-16 h-16 bg-gray-100 border border-gray-200 rounded p-1">
          <div className="grid grid-cols-3 gap-0.5">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`aspect-square ${Math.random() > 0.5 ? 'bg-black' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>

        {/* Scan button */}
        {onScan && (
          <button
            onClick={() => onScan(safeStudent)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
          >
            Scan
          </button>
        )}
      </div>
    </div>
  );
};

// Student Badge List
export const StudentBadgeList = ({ students = [], onSelect, className = '' }) => {
  const safeStudents = Array.isArray(students) ? students : [];

  return (
    <div className={`space-y-2 ${className}`}>
      {safeStudents.length > 0 ? (
        safeStudents.map((student, index) => (
          <StudentBadge
            key={student?.id || index}
            student={student || {}}
            size="md"
            onClick={onSelect}
          />
        ))
      ) : (
        <div className="text-center py-4 text-gray-400 text-sm">
          No students to display
        </div>
      )}
    </div>
  );
};

export default StudentBadge;