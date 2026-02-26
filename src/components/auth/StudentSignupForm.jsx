import React from 'react';
import { User, Mail, Hash, Lock } from 'lucide-react';
import InputField from '../common/InputField';

const departments = [
  'Maritime Transport & Business Management (MTBM)',
  'Nautical Science',
  'Marine Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Computer Science',
  'Business Administration'
];

const levels = ['100', '200', '300', '400', '500'];

const StudentSignupForm = ({ formData, onChange, onSubmit, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField
        id="studentName"
        label="Full Name"
        value={formData.fullName}
        onChange={(e) => onChange('fullName', e.target.value)}
        placeholder="John Doe"
        icon={User}
        required
        disabled={loading}
      />

      <InputField
        id="studentEmail"
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
        id="matricNo"
        label="Matric Number"
        value={formData.matricNo}
        onChange={(e) => onChange('matricNo', e.target.value.toUpperCase())}
        placeholder="CS2024001"
        icon={Hash}
        required
        disabled={loading}
      />

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
        <select
          value={formData.department}
          onChange={(e) => onChange('department', e.target.value)}
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

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Level</label>
        <select
          value={formData.level}
          onChange={(e) => onChange('level', e.target.value)}
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          required
          disabled={loading}
        >
          <option value="">Select Level</option>
          {levels.map(lvl => (
            <option key={lvl} value={lvl}>{lvl}</option>
          ))}
        </select>
      </div>

      <InputField
        id="studentPassword"
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Creating account...
          </span>
        ) : (
          'Create Student Account'
        )}
      </button>
    </form>
  );
};

export default StudentSignupForm;