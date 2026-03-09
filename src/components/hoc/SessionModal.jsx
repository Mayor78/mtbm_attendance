import React, { useState } from 'react';
import { X, Clock, MapPin } from 'lucide-react';

const SessionModal = ({ 
  isOpen, 
  onClose, 
  courses, 
  selectedCourse, 
  onCourseChange, 
  onStartSession, 
  isCreatingSession,
  newSession 
}) => {
  const [duration, setDuration] = useState(3); // Default 3 minutes

  const durationOptions = [3, 5, 10, 15];

  if (!isOpen) return null;

  const handleStartSession = () => {
    onStartSession(duration);
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">Start New Session</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Course Selection */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Select Course</label>
            <select 
              value={selectedCourse} 
              onChange={(e) => onCourseChange(e.target.value)} 
              className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-gray-300"
            >
              <option value="">Choose a course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_title}
                </option>
              ))}
            </select>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Clock size={12} />
              Session Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {durationOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => setDuration(option)}
                  className={`py-2 text-sm rounded-lg transition-colors ${
                    duration === option
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {option}m
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Session will auto-end after {duration} minutes
            </p>
          </div>

          {/* Location Info (if available) */}
          {newSession?.location && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                <MapPin size={12} />
                Session location
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {newSession.location.address || `${newSession.location.lat.toFixed(4)}, ${newSession.location.lng.toFixed(4)}`}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Accuracy: ±{Math.round(newSession.location.accuracy)}m
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleStartSession}
              disabled={!selectedCourse || isCreatingSession}
              className="flex-1 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isCreatingSession ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>Starting...</span>
                </>
              ) : (
                'Start Session'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;