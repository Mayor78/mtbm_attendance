import React from 'react';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';

const ErrorPage = ({ type = '404' }) => {
  const navigate = useNavigate();

  const errorContent = {
    '404': {
      title: 'Page Not Found',
      message: "The page you're looking for doesn't exist or has been moved.",
      icon: '🔍'
    },
    '403': {
      title: 'Access Denied',
      message: "You don't have permission to access this page.",
      icon: '🚫'
    },
    '500': {
      title: 'Server Error',
      message: 'Something went wrong on our end. Please try again later.',
      icon: '⚠️'
    }
  };

  const content = errorContent[type] || errorContent['404'];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* Error Icon */}
        <div className="mb-6">
          <span className="text-8xl">{content.icon}</span>
        </div>

        {/* Error Code */}
        <h1 className="text-6xl font-bold text-gray-800 mb-2">{type}</h1>
        
        {/* Error Title */}
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">
          {content.title}
        </h2>

        {/* Error Message */}
        <p className="text-gray-600 mb-8">
          {content.message}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
            fullWidth
          >
            Go to Dashboard
          </Button>
          
          <Button 
            variant="secondary" 
            onClick={() => navigate(-1)}
            fullWidth
          >
            Go Back
          </Button>
        </div>

        {/* Help Link */}
        <p className="mt-6 text-sm text-gray-500">
          Need help? <a href="#" className="text-blue-600 hover:text-blue-700">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default ErrorPage;