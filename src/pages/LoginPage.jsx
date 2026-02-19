import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { LogIn, Mail, Lock, ShieldCheck, UserPlus, User, Hash, AlertCircle, GraduationCap, Crown, Loader } from 'lucide-react'

export const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [matricNo, setMatricNo] = useState('')
  const [department, setDepartment] = useState('')
  const [level, setLevel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const { signIn } = useAuth()
  const navigate = useNavigate()

 const departments = [
    'Maritime Transport & Business Management (MTBM)',
    'Nautical Science',
    'Marine Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Computer Science',
    'Business Administration'
  ]

  const levels = ['100', '200', '300', '400', '500']

  // Debounced login handler with retry logic
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    setRetryCount(0)

    const attemptLogin = async (retryAttempt = 0) => {
      try {
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim().toLowerCase(), 
          password 
        })

        if (error) throw error
        navigate('/dashboard')
        
      } catch (err) {
        if (err.message?.includes('rate limit') && retryAttempt < 3) {
          // Exponential backoff for rate limiting
          const delay = Math.pow(2, retryAttempt) * 1000
          setTimeout(() => attemptLogin(retryAttempt + 1), delay)
          setError(`Rate limited. Retrying in ${delay/1000}s...`)
        } else {
          throw err
        }
      }
    }

    try {
      await attemptLogin()
    } catch (err) {
      setError(getUserFriendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Validate inputs
    if (!validateInputs()) return

    try {
      // Use a transaction-like approach with retries
      const result = await executeWithRetry(async () => {
        // 1. Quick check if email exists (cached check)
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email.trim().toLowerCase())
          .maybeSingle()

        if (existingUser) {
          throw new Error('Email already registered')
        }

        // 2. Quick check if matric exists
        const { data: existingMatric } = await supabase
          .from('students')
          .select('matric_no')
          .eq('matric_no', matricNo.toUpperCase())
          .maybeSingle()

        if (existingMatric) {
          throw new Error('Matric number already exists')
        }

        // 3. Create auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: 'student'
            }
          }
        })

        if (authError) throw authError
        if (!authData.user) throw new Error('Failed to create account')

        // 4. Create student record (with retry for race conditions)
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: authData.user.id,
            matric_no: matricNo.toUpperCase(),
            department,
            level,
            email: email.trim().toLowerCase(),
            full_name: fullName.trim()
          })

        if (studentError) {
          // If student insert fails, attempt to clean up auth user
          await supabase.auth.admin.deleteUser(authData.user.id)
            .catch(console.error)
          throw studentError
        }

        return authData
      }, 3) // Max 3 retries

      setSuccess('Account created successfully! You can now login.')
      setIsLogin(true)
      clearForm()

    } catch (err) {
      console.error('Signup error:', err)
      setError(getUserFriendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  // Helper function for retry logic with exponential backoff
  const executeWithRetry = async (fn, maxRetries = 3) => {
    let lastError
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (err) {
        lastError = err
        
        // Don't retry certain errors
        if (err.message?.includes('already exists') || 
            err.message?.includes('invalid')) {
          throw err
        }

        // Exponential backoff
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    throw lastError
  }

  // Input validation
  const validateInputs = () => {
    if (!fullName.trim()) {
      setError('Full name is required')
      setLoading(false)
      return false
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address')
      setLoading(false)
      return false
    }

    if (!matricNo.match(/^[A-Z0-9]{7,15}$/i)) {
      setError('Please enter a valid matric number (7-15 alphanumeric characters)')
      setLoading(false)
      return false
    }

    if (!department) {
      setError('Department is required')
      setLoading(false)
      return false
    }

    if (!level) {
      setError('Level is required')
      setLoading(false)
      return false
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return false
    }

    return true
  }

  // User-friendly error messages
  const getUserFriendlyError = (error) => {
    const message = error.message?.toLowerCase() || ''
    
    if (message.includes('rate limit')) {
      return 'Too many attempts. Please wait a moment and try again.'
    }
    if (message.includes('already registered')) {
      return 'Email already registered. Please login instead.'
    }
    if (message.includes('invalid login')) {
      return 'Invalid email or password.'
    }
    if (message.includes('duplicate key') || message.includes('23505')) {
      return 'Matric number already exists.'
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection.'
    }
    
    return error.message || 'An error occurred. Please try again.'
  }

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setFullName('')
    setMatricNo('')
    setDepartment('')
    setLevel('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-200 mb-4 transform hover:scale-105 transition-transform">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
            HND1Attendance
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Secure • Fast • Reliable
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-lg p-8 rounded-3xl shadow-2xl shadow-indigo-100/50 border border-white/20">
          
          {/* Toggle Buttons */}
          <div className="flex gap-2 mb-8 p-1 bg-slate-100/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                isLogin 
                  ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${
                !isLogin 
                  ? 'bg-white text-indigo-600 shadow-md shadow-indigo-100' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r-lg text-sm animate-slide-in">
              <div className="flex items-center">
                <AlertCircle size={18} className="mr-2 flex-shrink-0" />
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border-l-4 border-green-500 text-green-700 px-4 py-3 rounded-r-lg text-sm animate-slide-in">
              <p className="font-medium">Success!</p>
              <p className="opacity-90">{success}</p>
            </div>
          )}

          {/* Login Form */}
          {isLogin ? (
            <form className="space-y-5" onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                      placeholder="your.email@university.edu"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                      <Lock size={18} />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={20} className="mr-2" />
                    Sign In
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Signup Form */
            <form className="space-y-5" onSubmit={handleSignup}>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                      <User size={18} />
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="John Doe"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="signupEmail" className="block text-sm font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                      <Mail size={18} />
                    </div>
                    <input
                      id="signupEmail"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="john.doe@university.edu"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Matric Number */}
                <div>
                  <label htmlFor="matricNo" className="block text-sm font-semibold text-slate-700 mb-1">
                    Matric Number
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                      <Hash size={18} />
                    </div>
                    <input
                      id="matricNo"
                      type="text"
                      required
                      value={matricNo}
                      onChange={(e) => setMatricNo(e.target.value.toUpperCase())}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all uppercase"
                      placeholder="CS2024001"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Department */}
                <div>
                  <label htmlFor="department" className="block text-sm font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <select
                    id="department"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    disabled={loading}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label htmlFor="level" className="block text-sm font-semibold text-slate-700 mb-1">
                    Level
                  </label>
                  <select
                    id="level"
                    required
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    disabled={loading}
                  >
                    <option value="">Select Level</option>
                    {levels.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="signupPassword" className="block text-sm font-semibold text-slate-700 mb-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500">
                      <Lock size={18} />
                    </div>
                    <input
                      id="signupPassword"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                      placeholder="•••••••• (min. 6 characters)"
                      minLength={6}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-[1.02]"
              >
                {loading ? (
                  <Loader size={20} className="animate-spin" />
                ) : (
                  <>
                    <UserPlus size={20} className="mr-2" />
                    Create Account
                  </>
                )}
              </button>
            </form>
          )}
        </div>
        
        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} University Registrar Office. All rights reserved.
        </p>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}