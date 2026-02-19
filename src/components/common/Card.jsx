import React from 'react';

const Card = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  bodyClassName = '',
  headerClassName = '',
  footerClassName = '',
  hoverable = false,
  bordered = true,
  padded = true,
  onClick
}) => {
  const baseClasses = 'bg-white rounded-lg overflow-hidden';
  
  const borderClasses = bordered ? 'border border-gray-200' : '';
  
  const hoverClasses = hoverable 
    ? 'transition-all duration-200 hover:shadow-lg hover:border-gray-300 cursor-pointer' 
    : '';
  
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  const cardClasses = `
    ${baseClasses}
    ${borderClasses}
    ${hoverClasses}
    ${clickableClasses}
    ${className}
  `.trim();

  return (
    <div className={cardClasses} onClick={onClick}>
      {/* Header */}
      {(title || subtitle || actions) && (
        <div className={`px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
          <div className="flex items-start justify-between">
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="ml-4">{actions}</div>}
          </div>
        </div>
      )}

      {/* Body */}
      <div className={`${padded ? 'px-6 py-4' : ''} ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

// Stats Card Component
export const StatsCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      iconBg: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600',
      iconBg: 'bg-green-100'
    },
    red: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      iconBg: 'bg-red-100'
    },
    yellow: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
      iconBg: 'bg-yellow-100'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      iconBg: 'bg-purple-100'
    }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <Card className={`${colors.bg} border-none ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
          {trend && (
            <p className={`text-xs mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue} from last week
            </p>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 ${colors.iconBg} rounded-lg flex items-center justify-center text-2xl`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// Course Card Component
export const CourseCard = ({
  code,
  name,
  instructor,
  schedule,
  students,
  attendance,
  onClick,
  className = ''
}) => {
  return (
    <Card hoverable onClick={onClick} className={className}>
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
              {code}
            </span>
            <h4 className="font-semibold text-gray-800 mt-2">{name}</h4>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <span>👤</span>
            <span>{instructor}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>📅</span>
            <span>{schedule}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <span>👥</span>
            <span>{students} students</span>
          </div>
        </div>

        {attendance && (
          <div className="pt-3 border-t border-gray-100">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-500">Attendance</span>
              <span className="text-xs font-medium text-gray-700">{attendance}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${attendance}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

// Session Card Component
export const SessionCard = ({
  course,
  date,
  time,
  present,
  total,
  status,
  onClick,
  className = ''
}) => {
  const percentage = Math.round((present / total) * 100);
  
  const statusColors = {
    active: 'bg-green-100 text-green-600',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-600'
  };

  return (
    <Card hoverable onClick={onClick} className={className}>
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-gray-800">{course}</h4>
            <p className="text-sm text-gray-500 mt-1">{date} • {time}</p>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status] || statusColors.completed}`}>
            {status}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Present</p>
            <p className="text-lg font-semibold text-gray-800">{present}/{total}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Rate</p>
            <p className="text-lg font-semibold text-gray-800">{percentage}%</p>
          </div>
        </div>

        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${
              percentage >= 75 ? 'bg-green-600' : 
              percentage >= 50 ? 'bg-yellow-600' : 
              'bg-red-600'
            }`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </Card>
  );
};

// Notification Card Component
export const NotificationCard = ({
  message,
  time,
  read = false,
  type = 'info',
  onDismiss,
  onClick,
  className = ''
}) => {
  const typeIcons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const typeColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div 
      className={`
        ${typeColors[type]} border rounded-lg p-4 
        ${!read ? 'border-l-4' : ''} 
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        transition-all duration-200
        ${className}
      `.trim()}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <span className="text-xl">{typeIcons[type]}</span>
        <div className="flex-1">
          <p className="text-sm text-gray-800">{message}</p>
          <p className="text-xs text-gray-500 mt-1">{time}</p>
        </div>
        {onDismiss && (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// Profile Card Component
export const ProfileCard = ({
  name,
  role,
  id,
  email,
  avatar,
  stats,
  onEdit,
  className = ''
}) => {
  return (
    <Card className={className}>
      <div className="text-center">
        {/* Avatar */}
        <div className="relative inline-block">
          <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-4xl mx-auto">
            {avatar || '👤'}
          </div>
          {onEdit && (
            <button 
              onClick={onEdit}
              className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center hover:bg-blue-700"
            >
              ✎
            </button>
          )}
        </div>

        {/* Info */}
        <h3 className="text-xl font-semibold text-gray-800 mt-4">{name}</h3>
        <p className="text-sm text-blue-600">{role}</p>
        <p className="text-xs text-gray-500 mt-1">{id}</p>
        <p className="text-xs text-gray-500">{email}</p>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
            {stats.map((stat, index) => (
              <div key={index}>
                <p className="text-lg font-semibold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default Card;