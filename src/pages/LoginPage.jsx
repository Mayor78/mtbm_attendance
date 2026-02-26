import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import UserTypeSelector from '../components/auth/UserTypeSelector';
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



 const LoginPage = () => {
  const navigate = useNavigate();
  const { invalidateCache } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [userType, setUserType] = useState('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    matricNo: '',
    staffId: '',
    department: '',
    level: ''
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
      level: ''
    });
  };

  const getOrCreateDeviceId = () => {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
};
  const handleLogin = async () => {
    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email');
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

      // Wait for AuthContext to fetch profile
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Get profile to check role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Verify user type matches based on role
      if (userType === 'student') {
        // Students and HOCs can both use student login
        if (profile.role !== 'student' && profile.role !== 'hoc') {
          await supabase.auth.signOut();
          throw new Error('Invalid credentials for student login');
        }
      }

      if (userType === 'lecturer' && profile.role !== 'lecturer') {
        await supabase.auth.signOut();
        throw new Error('Invalid credentials for lecturer login');
      }

      // Get current device history
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('device_history')
        .eq('id', data.user.id)
        .single();

      const deviceHistory = existingProfile?.device_history || [];
      if (!deviceHistory.includes(deviceId)) {
        deviceHistory.push(deviceId);
      }

      // Update device info
      await supabase
        .from('profiles')
        .update({
          last_device_id: deviceId,
          device_history: deviceHistory,
          last_login: new Date().toISOString()
        })
        .eq('id', data.user.id);

      // Invalidate cache to refresh context
      invalidateCache();

      // Navigate based on role
      if (profile.role === 'lecturer') {
        navigate('/dashboard');
      } else {
        navigate('/dashboard');
      }

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
      setError('Please enter a valid email');
      return;
    }

    if (!validateMatricNo(formData.matricNo)) {
      setError('Please enter a valid matric number (5-20 characters)');
      return;
    }

    if (!formData.department) {
      setError('Department is required');
      return;
    }

    if (!formData.level) {
      setError('Level is required');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Check if matric exists
      const { data: existingMatric } = await supabase
        .from('students')
        .select('id')
        .eq('matric_no', formData.matricNo.toUpperCase())
        .maybeSingle();

      if (existingMatric) {
        throw new Error('Matric number already exists');
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: 'student'
          }
        }
      });

      if (authError) {
        if (authError.message.includes('User already registered')) {
          throw new Error('Email already registered');
        }
        throw authError;
      }
      
      if (!authData.user) throw new Error('Failed to create account');

      // Wait for AuthContext to catch the SIGNED_IN event and create profile
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Insert student record
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
          throw new Error('Matric number already exists');
        }
        throw studentError;
      }

      // Invalidate cache so AuthContext fetches fresh data
      invalidateCache();

      setSuccess('Account created successfully! You can now login.');
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
    setError('Please enter a valid email');
    return;
  }

  if (!validateStaffId(formData.staffId)) {
    setError('Please enter a valid staff ID');
    return;
  }

  if (!formData.department) {
    setError('Department is required');
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
    // Check if staff ID exists
    const { data: existingStaff } = await supabase
      .from('lecturers')
      .select('id')
      .eq('staff_id', formData.staffId.toUpperCase())
      .maybeSingle();

    if (existingStaff) {
      throw new Error('Staff ID already exists');
    }

    // Create auth user
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
        throw new Error('Email already registered');
      }
      throw authError;
    }
    
    if (!authData.user) throw new Error('Failed to create account');

    // Wait for AuthContext to catch the SIGNED_IN event and create profile
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Insert lecturer record
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

    // Insert course assignments
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

    // Invalidate cache so AuthContext fetches fresh data
    invalidateCache();

    setSuccess('Account created successfully! You can now login.');
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
      if (userType === 'student') {
        handleStudentSignup();
      } else {
        handleLecturerSignup();
      }
    }
  };

  return (
    <AuthLayout>
      <AuthToggle isLogin={isLogin} onToggle={setIsLogin} />
      <UserTypeSelector userType={userType} onSelect={setUserType} isLogin={isLogin} />

      <AlertMessage 
        type="error" 
        message={error} 
        onDismiss={() => setError('')} 
      />
      
      <AlertMessage 
        type="success" 
        message={success} 
        onDismiss={() => setSuccess('')} 
      />

      {isLogin ? (
        <LoginForm
          formData={formData}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          loading={loading}
        />
      ) : (
        userType === 'student' ? (
          <StudentSignupForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        ) : (
          <LecturerSignupForm
            formData={formData}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
            loading={loading}
          />
        )
      )}
    </AuthLayout>
  );
};

export default LoginPage;