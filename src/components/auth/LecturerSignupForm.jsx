import React, { useState } from 'react';
import { User, Mail, Hash, Lock, Briefcase, Phone, MapPin } from 'lucide-react';
import InputField from '../common/InputField';
import CourseSelection from './CourseSelection';

const departments = [
  'Maritime Transport & Business Management (MTBM)',
  'Nautical Science',
  'Marine Engineering',  
  'Electrical Engineering',
  'Computer Science',
  'Data Science',
  'Software Engineering',
  'Business Administration'
];

const LecturerSignupForm = ({ formData, onChange, onSubmit, loading }) => {
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [departmentSelected, setDepartmentSelected] = useState(false);

  const handleDepartmentChange = (e) => {
    const dept = e.target.value;
    console.log('Selected department:', dept); // Debug log
    onChange('department', dept);
    setDepartmentSelected(!!dept);
    setSelectedCourses([]); // Reset courses when department changes
  };

  const handleCoursesChange = (courses) => {
    console.log('Courses selected:', courses); // Debug log
    setSelectedCourses(courses);
    onChange('selectedCourses', courses);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (selectedCourses.length === 0) {
      alert('Please select at least one course you teach');
      return;
    }
    
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        <InputField
          id="lecturerName"
          label="Full Name"
          value={formData.fullName}
          onChange={(e) => onChange('fullName', e.target.value)}
          placeholder="Dr. John Doe"
          icon={User}
          required
          disabled={loading}
        />

        <InputField
          id="lecturerEmail"
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="john.doe@university.edu"
          icon={Mail}
          required
          disabled={loading}
        />

        <InputField
          id="staffId"
          label="Staff ID"
          value={formData.staffId}
          onChange={(e) => onChange('staffId', e.target.value.toUpperCase())}
          placeholder="LEC2024001"
          icon={Hash}
          required
          disabled={loading}
        />

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
          <select
            value={formData.department}
            onChange={handleDepartmentChange}
            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
            required
            disabled={loading}
          >
            <option value="">Select Department</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>

        {/* Course Selection Section */}
        {departmentSelected && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Your Courses</h3>
            <CourseSelection
              department={formData.department}
              onCoursesChange={handleCoursesChange}
              disabled={loading}
            />
          </div>
        )}

        {/* Optional fields */}
        <InputField
          id="office"
          label="Office Location (Optional)"
          value={formData.office || ''}
          onChange={(e) => onChange('office', e.target.value)}
          placeholder="e.g., Room 301, CS Building"
          icon={MapPin}
          disabled={loading}
        />

        <InputField
          id="phone"
          label="Phone Number (Optional)"
          value={formData.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          placeholder="+234 800 000 0000"
          icon={Phone}
          disabled={loading}
        />

        <InputField
          id="lecturerPassword"
          label="Password"
          type="password"
          value={formData.password}
          onChange={(e) => onChange('password', e.target.value)}
          placeholder="Minimum 6 characters"
          icon={Lock}
          required
          disabled={loading}
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={loading || (departmentSelected && selectedCourses.length === 0)}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          'Create Lecturer Account'
        )}
      </button>

      {departmentSelected && selectedCourses.length === 0 && (
        <p className="text-xs text-amber-600 text-center">
          Please select at least one course to continue
        </p>
      )}
    </form>
  );
};

export default LecturerSignupForm;