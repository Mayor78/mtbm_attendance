import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const levels = ['100', '200', '300', '400'];

const LevelSelector = ({ 
  selectedLevels, 
  onLevelToggle, 
  expandedLevels, 
  onLevelExpand,
  coursesByLevel,
  onCourseToggle,
  loading 
}) => {
  return (
    <div className="space-y-4">
      <label className="block text-xs font-medium text-gray-600 mb-1">
        Select Levels & Courses You Teach
      </label>
      
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {levels.map(level => {
          const isSelected = selectedLevels.includes(level);
          const isExpanded = expandedLevels.includes(level);
          const availableCourses = coursesByLevel[level] || [];
          const selectedCount = availableCourses.filter(c => c.selected).length;
          
          return (
            <div key={level} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Level Header */}
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => onLevelExpand(level)}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      onLevelToggle(level, e.target.checked);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-medium text-gray-700">Level {level}</span>
                  {isSelected && selectedCount > 0 && (
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                      {selectedCount} course{selectedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <button type="button" className="text-gray-400">
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>

              {/* Courses for this level */}
              {isExpanded && isSelected && (
                <div className="p-3 bg-white border-t border-gray-200">
                  {loading ? (
                    <div className="text-center py-4">
                      <div className="w-6 h-6 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : availableCourses.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableCourses.map(course => (
                        <label 
                          key={course.id} 
                          className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={course.selected || false}
                            onChange={() => onCourseToggle(level, course)}
                            className="w-3.5 h-3.5 mt-0.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700">{course.course_code}</span>
                            <span className="text-xs text-gray-500 ml-2">{course.course_title}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-3">No courses available for this level</p>
                  )}
                </div>
              )}

              {/* Show selected courses summary when collapsed but level is selected */}
              {!isExpanded && isSelected && selectedCount > 0 && (
                <div className="px-3 pb-2 text-xs text-gray-500">
                  Selected: {availableCourses.filter(c => c.selected).map(c => c.course_code).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-2">
        Select levels first, then choose specific courses for each level
      </p>
    </div>
  );
};

export default LevelSelector;