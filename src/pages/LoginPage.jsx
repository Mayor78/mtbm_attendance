import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  validateEmail, 
  validatePassword, 
  validateStaffId, 
  validateMatricNo, 
  getUserFriendlyError 
} from '../utils/Validation';

// Components
import AuthLayout from '../components/auth/AuthLayout';
import AuthToggle from '../components/auth/AuthToggle';
import LoginForm from '../components/auth/LoginForm';
import StudentSignupForm from '../components/auth/StudentSignupForm';
import LecturerSignupForm from '../components/auth/LecturerSignupForm';
import AlertMessage from '../components/auth/AlertMessage';

// Device ID utility
const generateDeviceId = () => {
  const userAgent = navigator.userAgent;
  const screenRes = `${window.screen.width}x${window.screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  const platform = navigator.platform;
  
  const fingerprint = `${userAgent}|${screenRes}|${timezone}|${language}|${platform}`;
  
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    hash = ((hash << 5) - hash) + fingerprint.charCodeAt(i);
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36) + Date.now().toString(36);
};

const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { userType } = useParams();
  const { invalidateCache } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!userType || !['student', 'lecturer', 'hoc'].includes(userType)) {
      navigate('/select-type');
    }
  }, [userType, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    matricNo: '',
    staffId: '',
    department: '',
    level: '',
    selectedCourses: []
  });

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const clearForm = () => {
    setFormData({
      email: '',
      password: '',
      fullName: '',
      matricNo: '',
      staffId: '',
      department: '',
      level: '',
      selectedCourses: []
    });
  };

  const getRoleInfo = () => {
    switch(userType) {
      case 'student':
        return {
          name: 'Student',
          color: 'text-blue-600',
      bg: 'bg-blue-50',
          icon: '👨‍🎓',
          description: 'Access your courses and mark attendance'
        };
      case 'lecturer':
        return {
          name: 'Lecturer',
          color: 'text-green-600',
          bg: 'bg-green-50',
          icon: '👨‍🏫',
          description: 'Take attendance and manage your courses'
        };
      case 'hoc':
        return {
          name: 'HOC',
          color: 'text-purple-600',
          bg: 'bg-purple-50',
          icon: '👑',
          description: 'Department oversight and session management'
        };
      default:
        return {};
    }
  };

  const roleInfo = getRoleInfo();

  const handleLogin = async () => {
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const deviceId = getOrCreateDeviceId();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      });

      if (error) throw error;

      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      if (userType === 'student' || userType === 'hoc') {
        if (profile.role !== 'student' && profile.role !== 'hoc') {
          await supabase.auth.signOut();
          throw new Error('This account is not registered as a student or HOC');
        }
      }

      if (userType === 'lecturer' && profile.role !== 'lecturer') {
        await supabase.auth.signOut();
        throw new Error('This account is not registered as a lecturer');
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('device_history')
        .eq('id', data.user.id)
        .single();

      const deviceHistory = existingProfile?.device_history || [];
      if (!deviceHistory.includes(deviceId)) {
        deviceHistory.push(deviceId);
      }

      await supabase
        .from('profiles')
        .update({
          last_device_id: deviceId,
          device_history: deviceHistory,
          last_login: new Date().toISOString()
        })
        .eq('id', data.user.id);

      invalidateCache();

      navigate('/dashboard');

    } catch (err) {
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignup = async () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validateMatricNo(formData.matricNo)) {
      setError('Matric number should be 5-20 characters');
      return;
    }

    if (!formData.department) {
      setError('Please select your department');
      return;
    }

    if (!formData.level) {
      setError('Please select your level');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: existingMatric } = await supabase
        .from('students')
        .select('id')
        .eq('matric_no', formData.matricNo.toUpperCase())
        .maybeSingle();

      if (existingMatric) {
        throw new Error('This matric number is already registered');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: userType === 'hoc' ? 'hoc' : 'student'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        throw authError;
      }
      
      if (!authData.user) throw new Error('Failed to create account');

      await new Promise(resolve => setTimeout(resolve, 2000));

      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: authData.user.id,
          matric_no: formData.matricNo.toUpperCase(),
          department: formData.department,
          level: formData.level,
          email: formData.email.trim().toLowerCase(),
          full_name: formData.fullName.trim(),
          created_at: new Date().toISOString()
        });

      if (studentError) {
        if (studentError.code === '23505') {
          throw new Error('This matric number is already registered');
        }
        throw studentError;
      }

      invalidateCache();

      setSuccess('Account created! You can now login.');
      setIsLogin(true);
      clearForm();

    } catch (err) {
      console.error('Signup error:', err);
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLecturerSignup = async () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!validateStaffId(formData.staffId)) {
      setError('Staff ID should be 3-20 characters');
      return;
    }

    if (!formData.department) {
      setError('Please select your department');
      return;
    }

    if (!formData.selectedCourses || formData.selectedCourses.length === 0) {
      setError('Please select at least one course you teach');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: existingStaff } = await supabase
        .from('lecturers')
        .select('id')
        .eq('staff_id', formData.staffId.toUpperCase())
        .maybeSingle();

      if (existingStaff) {
        throw new Error('This staff ID is already registered');
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: 'lecturer'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          throw new Error('This email is already registered. Please login instead.');
        }
        throw authError;
      }
      
      if (!authData.user) throw new Error('Failed to create account');

      await new Promise(resolve => setTimeout(resolve, 2000));

      const lecturerData = {
        user_id: authData.user.id,
        staff_id: formData.staffId.toUpperCase(),
        department: formData.department,
        created_at: new Date().toISOString()
      };

      if (formData.office) lecturerData.office = formData.office;
      if (formData.phone) lecturerData.phone = formData.phone;

      const { data: lecturer, error: lecturerError } = await supabase
        .from('lecturers')
        .insert(lecturerData)
        .select()
        .single();

      if (lecturerError) {
        console.error('Lecturer insert error:', lecturerError);
        throw new Error('Failed to create lecturer record');
      }

      const courseAssignments = formData.selectedCourses.map(course => ({
        lecturer_id: lecturer.id,
        course_id: course.course_id,
        created_at: new Date().toISOString()
      }));

      const { error: coursesError } = await supabase
        .from('course_lecturers')
        .insert(courseAssignments);

      if (coursesError) {
        console.error('Course assignment error:', coursesError);
        throw new Error('Failed to assign courses');
      }

      invalidateCache();

      setSuccess('Account created! You can now login.');
      setIsLogin(true);
      clearForm();

    } catch (err) {
      console.error('Signup error:', err);
      setError(getUserFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isLogin) {
      handleLogin();
    } else {
      if (userType === 'lecturer') {
        handleLecturerSignup();
      } else {
        handleStudentSignup();
      }
    }
  };

  const getTitle = () => {
    switch(userType) {
      case 'student': return 'Student Portal';
      case 'lecturer': return 'Lecturer Portal';
      case 'hoc': return 'HOC Portal';
      default: return 'Authentication';
    }
  };

  if (!userType) return null;

  return (
    <AuthLayout title={getTitle()} showBackButton={true}>
      {/* Role Indicator */}
      <div className={`mb-6 p-4 ${roleInfo.bg} rounded-lg text-center`}>
        <div className="text-3xl mb-2">{roleInfo.icon}</div>
        <h3 className={`font-bold ${roleInfo.color}`}>{roleInfo.name} Access</h3>
        <p className="text-xs text-gray-600 mt-1">{roleInfo.description}</p>
      </div>

      {/* Toggle between Login and Signup */}
      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              !isLogin ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create Account
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mt-2">
          {isLogin ? 'Already have an account? Sign in' : 'New user? Create your account'}
        </p>
      </div>

      {/* Alert Messages */}
      <AlertMessage type="error" message={error} onDismiss={() => setError('')} />
      <AlertMessage type="success" message={success} onDismiss={() => setSuccess('')} />

      {/* Forms */}
      {isLogin ? (
        <LoginForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : (
        userType === 'lecturer' ? (
          <LecturerSignupForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        ) : (
          <StudentSignupForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
            isHOC={userType === 'hoc'}
          />
        )
      )}

      {/* Help Text */}
      <div className="mt-6 text-center border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-400">
          Having trouble? Contact the IT Support Desk
        </p>
        <p className="text-xs text-gray-300 mt-1">
          support@maritime.edu • Ext. 1234
        </p>
      </div>
    </AuthLayout>
  );
};

export default LoginPage;