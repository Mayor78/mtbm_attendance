import React from 'react';

const InputField = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Icon size={16} />
          </div>
        )}
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full 
            ${Icon ? 'pl-9' : 'px-3'} 
            pr-3 py-2.5 
            bg-white 
            border border-gray-200 
            rounded-lg 
            text-gray-900 text-sm
            focus:outline-none focus:ring-1 focus:ring-gray-400 
            disabled:bg-gray-50 disabled:text-gray-500
            transition-colors
            ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};

export default InputField;