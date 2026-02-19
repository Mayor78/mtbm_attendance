import React from 'react';
import Card from '../common/Card';

const LiveAttendanceCounter = ({ present, total }) => {
  const percentage = ((present / total) * 100).toFixed(1);

  return (
    <Card>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-600 mb-3">Live Attendance</h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-bold text-gray-800">
            {present}/{total}
          </span>
          <span className="text-lg font-semibold text-blue-600">
            {percentage}%
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        {/* Status */}
        <div className="flex justify-between mt-3 text-sm">
          <span className="text-green-600">Present: {present}</span>
          <span className="text-red-600">Absent: {total - present}</span>
        </div>
      </div>
    </Card>
  );
};

export default LiveAttendanceCounter;