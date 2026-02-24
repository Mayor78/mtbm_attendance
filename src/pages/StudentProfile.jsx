// pages/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Hash, BookOpen, GraduationCap, Save, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentProfile = () => {
  const { user, profile, student, signOut, refreshData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  // Form states - pre-filled with existing data
  const [fullName, setFullName] = useState('');
  const [matricNo, setMatricNo] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [email] = useState(user?.email || ''); // Email is fixed

  useEffect(() => {
    if (profile && student) {
      setFullName(profile.full_name || 'hh');
      setMatricNo(student.matric_no || '');
      setDepartment(student.department || '');
      setLevel(student.level || '');
    }
  }, [profile, student]);

 
  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    await refreshData();

    try {
      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update students table
      const { error: studentError } = await supabase
        .from('students')
        .update({
          matric_no: matricNo.toUpperCase(),
          department,
          level
        })
        .eq('user_id', user.id);

      if (studentError) throw studentError;

      setSuccess('Profile updated!');
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      {success && (
        <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border p-6 space-y-6">
        {/* Email - Read Only */}
        <div>
          <label className="text-sm font-medium text-gray-600">Email</label>
          <div className="flex items-center gap-2 mt-1 p-3 bg-gray-50 rounded-lg text-gray-500">
            <Mail size={18} />
            <span>{email}</span>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="text-sm font-medium text-gray-600">Full Name</label>
          <div className="flex items-center gap-2 mt-1">
            <User size={18} className="text-gray-400" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="flex-1 p-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Matric Number */}
        <div>
          <label className="text-sm font-medium text-gray-600">Matric Number</label>
          <div className="flex items-center gap-2 mt-1">
            <Hash size={18} className="text-gray-400" />
            <input
              type="text"
              value={matricNo}
              onChange={(e) => setMatricNo(e.target.value)}
              className="flex-1 p-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
              placeholder="e.g., CS2024001"
            />
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="text-sm font-medium text-gray-600">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full mt-1 p-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select Department</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Level */}
        <div>
          <label className="text-sm font-medium text-gray-600">Level</label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="w-full mt-1 p-3 bg-gray-50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="">Select Level</option>
            {levels.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        {/* Save Button */}
        <button
          onClick={handleUpdateProfile}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default StudentProfile;