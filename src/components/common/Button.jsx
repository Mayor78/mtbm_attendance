import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  className = '',
  ...props 
}) => {
  
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 disabled:bg-yellow-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 disabled:border-blue-300 disabled:text-blue-300',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400',
    link: 'text-blue-600 hover:text-blue-700 underline-offset-2 hover:underline focus:ring-blue-500 disabled:text-blue-300 p-0'
  };

  // Size classes
  const sizeClasses = {
    xs: 'px-2.5 py-1.5 text-xs',
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  // Loading spinner sizes
  const spinnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  // Width class
  const widthClass = fullWidth ? 'w-full' : '';

  // Disabled class
  const disabledClass = disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer';

  // Combine all classes
  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${variant !== 'link' ? sizeClasses[size] : ''}
    ${widthClass}
    ${disabledClass}
    ${className}
  `.trim();

  // Loading spinner component
  const Spinner = () => (
    <svg 
      className={`animate-spin ${spinnerSizes[size]} text-current`} 
      xmlns="http://www.w3.org/2000/svg" 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // Render icon based on position
  const renderIcon = () => {
    if (loading) {
      return <Spinner />;
    }
    if (icon) {
      return <span className="text-current">{icon}</span>;
    }
    return null;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Icon on left */}
      {icon && iconPosition === 'left' && !loading && (
        <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>
      )}
      
      {/* Loading spinner on left */}
      {loading && iconPosition === 'left' && (
        <span className={`${children ? 'mr-2' : ''}`}>
          <Spinner />
        </span>
      )}
      
      {/* Button text */}
      {children && (
        <span className={loading ? 'opacity-75' : ''}>{children}</span>
      )}
      
      {/* Icon on right */}
      {icon && iconPosition === 'right' && !loading && (
        <span className={`${children ? 'ml-2' : ''}`}>{icon}</span>
      )}
      
      {/* Loading spinner on right */}
      {loading && iconPosition === 'right' && (
        <span className={`${children ? 'ml-2' : ''}`}>
          <Spinner />
        </span>
      )}
    </button>
  );
};

// Button Group Component for multiple buttons
export const ButtonGroup = ({ children, orientation = 'horizontal', className = '' }) => {
  const orientationClasses = {
    horizontal: 'flex flex-row -space-x-px',
    vertical: 'flex flex-col -space-y-px'
  };

  // Add specific styling for grouped buttons
  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (!React.isValidElement(child)) return child;

    // Determine border radius based on position in group
    let roundedClasses = '';
    if (orientation === 'horizontal') {
      if (index === 0) roundedClasses = 'rounded-r-none';
      else if (index === React.Children.count(children) - 1) roundedClasses = 'rounded-l-none';
      else roundedClasses = 'rounded-none';
    } else {
      if (index === 0) roundedClasses = 'rounded-b-none';
      else if (index === React.Children.count(children) - 1) roundedClasses = 'rounded-t-none';
      else roundedClasses = 'rounded-none';
    }

    return React.cloneElement(child, {
      className: `${child.props.className || ''} ${roundedClasses}`
    });
  });

  return (
    <div className={`${orientationClasses[orientation]} ${className}`}>
      {childrenWithProps}
    </div>
  );
};

// Icon Button Component (circular button with just icon)
export const IconButton = ({ 
  icon, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  label,
  ...props 
}) => {
  
  const baseClasses = 'inline-flex items-center justify-center rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 disabled:bg-yellow-300',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 disabled:border-blue-300 disabled:text-blue-300',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-400'
  };

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-14 h-14 text-xl'
  };

  const spinnerSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  const disabledClass = disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer';

  const buttonClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${disabledClass}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={label}
      {...props}
    >
      {loading ? (
        <svg 
          className={`animate-spin ${spinnerSizes[size]} text-current`} 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <span>{icon}</span>
      )}
    </button>
  );
};

export default Button;