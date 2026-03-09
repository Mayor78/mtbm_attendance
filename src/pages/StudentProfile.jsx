// pages/StudentProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { User, Mail, Hash, BookOpen, GraduationCap, Save, AlertCircle, CheckCircle, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentProfile = () => {
  const { user, profile, student, signOut, refreshData } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  
  const [fullName, setFullName] = useState('');
  const [matricNo, setMatricNo] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [email] = useState(user?.email || '');

  useEffect(() => {
    if (profile && student) {
      setFullName(profile.full_name || '');
      setMatricNo(student.matric_no || '');
      setDepartment(student.department || '');
      setLevel(student.level || '');
    }
  }, [profile, student]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: studentError } = await supabase
        .from('students')
        .update({
          matric_no: matricNo.toUpperCase(),
          department,
          level
        })
        .eq('user_id', user.id);

      if (studentError) throw studentError;

      await refreshData();
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="max-w-xl mx-auto px-6 py-12">
      {/* Header Section */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Settings</h1>
        <p className="text-gray-500 mt-2 font-medium">Keep your academic information up to date.</p>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-2xl flex items-center gap-3 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
          <CheckCircle size={20} className="text-emerald-500" />
          <span className="font-bold text-sm">{success}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-rose-50 text-rose-700 p-4 rounded-2xl flex items-center gap-3 border border-rose-100 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={20} className="text-rose-500" />
          <span className="font-bold text-sm">{error}</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Section: Personal Info */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Personal Details</h2>
          
          <div className="space-y-4">
            {/* Email - Read Only */}
            <div className="group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Email Address (Fixed)</label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 transition-all">
                <Mail size={18} strokeWidth={2.5} />
                <span className="text-sm font-bold">{email}</span>
              </div>
            </div>

            {/* Full Name */}
            <div className="group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-4 text-gray-400" size={18} strokeWidth={2.5} />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:border-gray-900 focus:ring-4 focus:ring-gray-50 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Academic Info */}
        <section className="space-y-4 pt-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1">Academic Info</h2>
          
          <div className="space-y-4">
            {/* Matric No */}
            <div className="group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Matric Number</label>
              <div className="relative flex items-center">
                <Hash className="absolute left-4 text-gray-400" size={18} strokeWidth={2.5} />
                <input
                  type="text"
                  value={matricNo}
                  onChange={(e) => setMatricNo(e.target.value)}
                  placeholder="e.g. CS2024001"
                  className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:border-gray-900 focus:ring-4 focus:ring-gray-50 outline-none transition-all uppercase"
                />
              </div>
            </div>

            {/* Department */}
            <div className="group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Department</label>
              <div className="relative flex items-center">
                <BookOpen className="absolute left-4 text-gray-400 pointer-events-none" size={18} strokeWidth={2.5} />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-12 pr-10 py-4 bg-white border border-gray-200 rounded-2xl text-sm font-bold focus:border-gray-900 focus:ring-4 focus:ring-gray-50 outline-none transition-all appearance-none"
                >
                  <option value="">Choose Department</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown className="absolute right-4 text-gray-400 pointer-events-none" size={16} />
              </div>
            </div>

            {/* Level */}
            <div className="group">
              <label className="block text-[11px] font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">Level / Year</label>
              <div className="grid grid-cols-5 gap-2">
                {['100', '200', '300', '400', '500'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={`py-3 rounded-xl text-xs font-black transition-all border ${
                      level === l 
                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg shadow-gray-200' 
                        : 'bg-white text-gray-400 border-gray-100 hover:border-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Action Area */}
        <div className="pt-8 space-y-4">
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-gray-100"
          >
            {loading ? 'Saving Changes...' : <><Save size={16} /> Save My Profile</>}
          </button>

          <button
            onClick={async () => { await signOut(); navigate('/login'); }}
            className="w-full bg-white text-rose-500 border border-rose-50 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-50 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;