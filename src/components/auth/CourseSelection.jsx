import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import LevelSelector from './LevelSelector';
import { useLecturerData } from '../../hooks/useLecturerData';

const CourseSelection = ({ 
  department, 
  onCoursesChange,
  disabled = false 
}) => {
  const [selectedLevels, setSelectedLevels] = useState([]);
  const [expandedLevels, setExpandedLevels] = useState([]);
  const [coursesByLevel, setCoursesByLevel] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const {course} = useLecturerData()
  console.log(course)
  // Fetch courses when department changes
  useEffect(() => {
    if (department) {
      console.log('🟢 Department selected in CourseSelection:', department);
      fetchCoursesForDepartment();
    } else {
      setCoursesByLevel({});
      setSelectedLevels([]);
    }
  }, [department]);

 const fetchCoursesForDepartment = async () => {
  setLoading(true);
  setError('');
  setDebugInfo('');
  
  try {
    console.log('🔵 Fetching courses for department:', department);
    console.log('🔵 Department string length:', department.length);
    
    // Trim the department name to remove any hidden spaces
    const trimmedDept = department.trim();
    console.log('🔵 Trimmed department:', trimmedDept);
    
    const { data, error } = await supabase
      .from('courses')
      .select('id, course_code, course_title, level')
      .eq('department', trimmedDept)
      .order('level')
      .order('course_code');

    if (error) throw error;

    console.log('📦 Raw data from Supabase:', data);
    console.log('📊 Number of courses found:', data?.length || 0);

    if (!data || data.length === 0) {
      console.warn('⚠️ No courses found for department:', trimmedDept);
      
      // Try a case-insensitive search as fallback
      const { data: fallbackData } = await supabase
        .from('courses')
        .select('id, course_code, course_title, level')
        .ilike('department', `%${trimmedDept}%`)
        .order('level')
        .order('course_code');
      
      console.log('🔄 Fallback search results:', fallbackData);
      
      if (fallbackData && fallbackData.length > 0) {
        setCoursesByLevel(groupCoursesByLevel(fallbackData));
        setLoading(false);
        return;
      }
      
      setDebugInfo(`No courses found for "${trimmedDept}"`);
      setCoursesByLevel({});
      setLoading(false);
      return;
    }

    // Group courses by level
    const grouped = {};
    data.forEach(course => {
      if (!grouped[course.level]) {
        grouped[course.level] = [];
      }
      grouped[course.level].push({
        ...course,
        selected: false
      });
    });

    console.log('📚 Grouped courses by level:', grouped);
    setCoursesByLevel(grouped);
    
    // Auto-expand first level that has courses
    const levelsWithCourses = Object.keys(grouped).sort();
    if (levelsWithCourses.length > 0) {
      setExpandedLevels([levelsWithCourses[0]]);
    }
    
  } catch (err) {
    console.error('❌ Error fetching courses:', err);
    setError('Failed to load courses: ' + err.message);
  } finally {
    setLoading(false);
  }
};

// Helper function to group courses
const groupCoursesByLevel = (courses) => {
  const grouped = {};
  courses.forEach(course => {
    if (!grouped[course.level]) {
      grouped[course.level] = [];
    }
    grouped[course.level].push({
      ...course,
      selected: false
    });
  });
  return grouped;
};

  const handleLevelToggle = (level, checked) => {
    let newSelectedLevels;
    if (checked) {
      newSelectedLevels = [...selectedLevels, level].sort();
      if (!expandedLevels.includes(level)) {
        setExpandedLevels([...expandedLevels, level]);
      }
    } else {
      newSelectedLevels = selectedLevels.filter(l => l !== level);
      const updatedCourses = { ...coursesByLevel };
      if (updatedCourses[level]) {
        updatedCourses[level] = updatedCourses[level].map(c => ({
          ...c,
          selected: false
        }));
        setCoursesByLevel(updatedCourses);
      }
    }
    
    setSelectedLevels(newSelectedLevels);
    notifyParent(newSelectedLevels, coursesByLevel);
  };

  const handleCourseToggle = (level, course) => {
    const updatedCourses = { ...coursesByLevel };
    const courseIndex = updatedCourses[level].findIndex(c => c.id === course.id);
    
    if (courseIndex !== -1) {
      updatedCourses[level][courseIndex] = {
        ...updatedCourses[level][courseIndex],
        selected: !updatedCourses[level][courseIndex].selected
      };
      
      setCoursesByLevel(updatedCourses);
      notifyParent(selectedLevels, updatedCourses);
    }
  };

  const handleLevelExpand = (level) => {
    if (expandedLevels.includes(level)) {
      setExpandedLevels(expandedLevels.filter(l => l !== level));
    } else {
      setExpandedLevels([...expandedLevels, level]);
    }
  };

  const notifyParent = (levels, courses) => {
    const selectedCourses = [];
    levels.forEach(level => {
      if (courses[level]) {
        courses[level].forEach(course => {
          if (course.selected) {
            selectedCourses.push({
              course_id: course.id,
              course_code: course.course_code,
              course_title: course.course_title,
              level: level
            });
          }
        });
      }
    });
    
    console.log('📤 Notifying parent of selected courses:', selectedCourses);
    onCoursesChange(selectedCourses);
  };

  const getSelectedCount = () => {
    let count = 0;
    selectedLevels.forEach(level => {
      if (coursesByLevel[level]) {
        count += coursesByLevel[level].filter(c => c.selected).length;
      }
    });
    return count;
  };

  if (!department) {
    return (
      <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 rounded-lg">
        Please select a department first to see available courses
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Loading courses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6 text-sm text-red-600 bg-red-50 rounded-lg">
        {error}
      </div>
    );
  }

  const hasCourses = Object.keys(coursesByLevel).length > 0;

  if (!hasCourses) {
    return (
      <div className="text-center py-6 text-sm text-amber-600 bg-amber-50 rounded-lg">
        <p>No courses found for "{department}"</p>
        {debugInfo && (
          <p className="text-xs text-gray-500 mt-2">{debugInfo}</p>
        )}
        <button 
          onClick={fetchCoursesForDepartment}
          className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LevelSelector
        selectedLevels={selectedLevels}
        onLevelToggle={handleLevelToggle}
        expandedLevels={expandedLevels}
        onLevelExpand={handleLevelExpand}
        coursesByLevel={coursesByLevel}
        onCourseToggle={handleCourseToggle}
        loading={false}
      />

      {selectedLevels.length > 0 && getSelectedCount() > 0 && (
        <div className="text-xs text-green-600 bg-green-50 p-3 rounded-lg">
          <span className="font-medium">✓ {getSelectedCount()} course{getSelectedCount() !== 1 ? 's' : ''} selected</span>
          <div className="mt-1 text-gray-600">
            {selectedLevels.map(level => {
              const levelCourses = coursesByLevel[level]?.filter(c => c.selected) || [];
              if (levelCourses.length === 0) return null;
              return (
                <div key={level} className="text-xs mt-1">
                  <span className="font-medium">Level {level}:</span>{' '}
                  {levelCourses.map(c => c.course_code).join(', ')}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseSelection;