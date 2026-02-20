import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useHOCAttendance, useCourseAttendance } from '../../hooks/useAttendance'
import { 
  QrCode, Copy, Check, Clock, Eye, X, Calendar, Users, 
  Download, RefreshCw, Plus, Edit, Trash2, BookOpen, 
  GraduationCap, Hash, BookMarked, ChevronRight, AlertCircle,
  ChevronLeft, LayoutDashboard, Search,
  Activity
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import AttendanceSkeleton from '../common/AttendanceSkeleton'

export const HocDashboard = () => {
  const { user, profile } = useAuth()
  const {  courses, 
    loading, 
    error: hookError, 
  
    liveActivity,
    refetch  } = useHOCAttendance(user?.id)
  const [studentLevel, setStudentLevel] = useState('');
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [selectedCourse, setSelectedCourse] = useState('')
  const [newSession, setNewSession] = useState(null)
  const [copied, setCopied] = useState(false)
  const [activeSessions, setActiveSessions] = useState({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showLiveFeed, setShowLiveFeed] = useState(true)
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const coursesPerPage = 6

  const [courseForm, setCourseForm] = useState({
    course_code: '',
    course_title: '',
    department: '',
    semester: ''
  })

  // --- LOGIC PRESERVATION (UNCHANGED) ---
  const departments = [
    'Maritime Transport & Business Management (MTBM)',
    'Nautical Science',
    'Marine Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Computer Science',
    'Business Administration'
  ]

  const mtbmCourseOptions = [
    { code: 'MBM311', title: 'Personnel Management' },
    { code: 'PAS324', title: 'Physical Distribution and Transport Management' },
    { code: 'ACC313', title: 'Financial Management' },
    { code: 'BAM311', title: 'Practice of Management' },
    { code: 'MBM301', title: 'Health Safety and Environmental Risk Management' },
    { code: 'GNS301', title: 'Use of English' },
    { code: 'MBM324', title: 'Introduction to Shipping' },
    { code: 'ACC326', title: 'Management Information System' },
    { code: 'BAM314', title: 'Ship Management' },
    { code: 'MBM312', title: 'Marine Insurance II' }
  ]

  const semesters = ['First Semester', 'Second Semester', 'Summer Semester']

  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value
    setCourseForm({ 
      ...courseForm, 
      department: selectedDept,
      course_code: '', 
      course_title: ''
    })
  }

  const handleCourseCodeChange = (e) => {
    const selectedCode = e.target.value
    if (courseForm.department.includes('MTBM')) {
      const selectedCourse = mtbmCourseOptions.find(c => c.code === selectedCode)
      setCourseForm({ 
        ...courseForm, 
        course_code: selectedCode,
        course_title: selectedCourse ? selectedCourse.title : ''
      })
    } else {
      setCourseForm({ ...courseForm, course_code: selectedCode })
    }
  }

  // Add this state


// Fetch student level when modal opens
useEffect(() => {
  if (showCourseModal && !editingCourse) {
    const fetchStudentLevel = async () => {
      const { data } = await supabase
        .from('students')
        .select('level')
        .eq('user_id', user.id)
        .single();
      if (data) setStudentLevel(data.level);
    };
    fetchStudentLevel();
  }
}, [showCourseModal, editingCourse, user.id]);
  const handleTitleChange = (e) => setCourseForm({ ...courseForm, course_title: e.target.value })

  React.useEffect(() => {
    if (courses.length > 0) checkActiveSessions()
  }, [courses])

  const checkActiveSessions = async () => {
    const sessions = {}
    for (const course of courses) {
      const { data } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('course_id', course.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()
      if (data) sessions[course.id] = data
    }
    setActiveSessions(sessions)
  }

  const handleCourseSubmit = async (e) => {
  e.preventDefault()
  setError(''); 
  setSuccess('')
  
  try {
    // Get HOC's level from students table
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('level')
      .eq('user_id', user.id)
      .single();

    if (studentError) throw new Error('Could not fetch your level information');

    if (editingCourse) {
      // When editing, we should preserve the original level or allow change? 
      // For now, we'll keep the existing level
      const { error } = await supabase
        .from('courses')
        .update({
          course_code: courseForm.course_code,
          course_title: courseForm.course_title,
          department: courseForm.department,
          semester: courseForm.semester
          // level is not updated - preserve original
        })
        .eq('id', editingCourse.id)
      
      if (error) throw error
      setSuccess('Course updated successfully!')
    } else {
      // Create new course with HOC's level auto-populated
      const { data, error } = await supabase
        .from('courses')
        .insert({
          course_code: courseForm.course_code,
          course_title: courseForm.course_title,
          department: courseForm.department,
          semester: courseForm.semester,
          level: student.level // Auto-populate from HOC's level
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Get student ID for course representative
      const { data: studentData, error: studentIdError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (studentIdError) throw studentIdError
      
      if (studentData) {
        const { error: repError } = await supabase
          .from('course_representatives')
          .insert({ 
            student_id: studentData.id, 
            course_id: data.id 
          })
        
        if (repError) {
          console.error('Rep insert error:', repError)
          setSuccess('Course created! But you may need to manually assign yourself as HOC.')
        } else {
          setSuccess('Course created successfully!')
        }
      }
    }
    
    setCourseForm({ course_code: '', course_title: '', department: '', semester: '' })
    setEditingCourse(null); 
    setShowCourseModal(false); 
    refetch()
    
  } catch (error) { 
    setError(error.message) 
  }
}

  const deleteCourse = async (id) => {
    if (!confirm('Are you sure?')) return
    try {
      await supabase.from('courses').delete().eq('id', id)
      setSuccess('Course deleted'); refetch()
    } catch (e) { setError('Delete failed') }
  }

 const startSession = async () => {
  if (!selectedCourse) return
  
  try {
    setError('')
    
    // Get HOC's department and level
    const { data: student } = await supabase
      .from('students')
      .select('department, level')
      .eq('user_id', user.id)
      .single();

    // Get course details to verify
    const { data: course } = await supabase
      .from('courses')
      .select('department, level')
      .eq('id', selectedCourse)
      .single();

    // Verify HOC can create session for this course
    if (course.department !== student.department) {
      throw new Error(`You can only create sessions for ${student.department} department courses.`);
    }

    if (course.level !== student.level) {
      throw new Error(`You can only create sessions for ${student.level} level courses.`);
    }
    
    const token = crypto.randomUUID()
    const numeric_code = Math.floor(100000 + Math.random() * 900000).toString()
    const expires_at = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
    
    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert({
        course_id: selectedCourse,
        created_by: user.id,
        token: token,
        start_time: new Date().toISOString(),
        expires_at: expires_at,
        is_active: true,
        numeric_code: numeric_code
      })
      .select()
      .single()

    if (error) throw error

    if (data) {
      const course = courses.find(c => c.id === selectedCourse)
      setNewSession({ 
        ...data, 
        course_code: course?.course_code, 
        course_title: course?.course_title 
      })
      
      setActiveSessions(prev => ({
        ...prev,
        [selectedCourse]: data
      }))
      
      setShowQRModal(true)
      setShowSessionModal(false)
      refetch()
    }
  } catch (error) { 
    console.error('Start session error:', error)
    setError(error.message || 'Failed to start session.') 
  }
}

  const endSession = async (id) => {
    await supabase.from('attendance_sessions').update({ is_active: false }).eq('id', id)
    checkActiveSessions(); refetch()
  }

  const downloadQR = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `qr-${newSession?.course_code}.png`
      link.click()
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const editCourse = (course) => {
    setEditingCourse(course); setCourseForm(course); setShowCourseModal(true)
  }

  // --- UI CALCULATION ---
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * coursesPerPage
    return courses.slice(startIndex, startIndex + coursesPerPage)
  }, [courses, currentPage])

  const totalPages = Math.ceil(courses.length / coursesPerPage)

  if (loading) return <AttendanceSkeleton/>
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 text-slate-900 space-y-8">
      
      {/* --- REFINED HEADER --- */}
      <header className="relative overflow-hidden bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-800">
              Welcome, <span className="text-indigo-600">{profile?.full_name?.split(' ')[0] || 'HOC'}</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2">
              <Calendar size={14} className="text-indigo-400" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setEditingCourse(null); setCourseForm({ course_code: '', course_title: '', department: '', semester: '' }); setShowCourseModal(true); }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 px-5 py-3 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <Plus size={18} /> New Course
            </button>
            <button
              onClick={() => setShowSessionModal(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
            >
              <QrCode size={18} /> Start Session
            </button>
          </div>
        </div>
        {/* Background Decorative Element */}
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
      </header>

      {/* Notifications */}
      {(error || hookError) && (
        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={20} />
          <span className="flex-1 text-sm font-medium">{error || hookError}</span>
          <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg"><X size={18} /></button>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-5 py-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Check size={20} />
          <span className="flex-1 text-sm font-medium">{success}</span>
          <button onClick={() => setSuccess('')} className="p-1 hover:bg-emerald-100 rounded-lg"><X size={18} /></button>
        </div>
      )}

      {/* --- LIVE SESSIONS (MOBILE OPTIMIZED) --- */}
     {/* --- LIVE SESSIONS WITH COUNT ANIMATION --- */}
{Object.keys(activeSessions).length > 0 && (
  <section className="space-y-4">
    <div className="flex items-center gap-2 px-2">
      <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Broadcasts</h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Object.entries(activeSessions).map(([courseId, session]) => {
        const course = courses.find(c => c.id === courseId)
        const count = course?.attendanceRecords?.filter(r => r.session_id === session.id).length || 0
        
        return (
          <div 
            key={session.id} 
            className="bg-indigo-600 rounded-3xl p-5 text-white shadow-xl shadow-indigo-200 overflow-hidden relative group hover:shadow-2xl transition-all duration-300"
          >
            {/* Animated background pulse */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 space-y-4">
              <div className="flex justify-between items-start">
                <div className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
                  🟢 Live
                </div>
                <button 
                  onClick={() => endSession(session.id)} 
                  className="text-xs bg-rose-500 hover:bg-rose-600 px-4 py-1.5 rounded-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                >
                  End Session
                </button>
              </div>
              
              <div>
                <h3 className="text-lg font-black leading-tight line-clamp-1">{course?.course_code}</h3>
                <p className="text-indigo-100 text-xs font-medium line-clamp-1">{course?.course_title}</p>
                <p className="text-indigo-200 text-[10px] mt-1 font-mono">
                  Started {new Date(session.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              
              <div className="flex items-end justify-between border-t border-white/10 pt-4">
                <div className="flex items-baseline gap-2">
                  {/* Animated Counter */}
                  <div className="relative">
                    <span 
                      key={count} 
                      className="text-4xl font-black tabular-nums inline-block animate-number-pop"
                    >
                      {count}
                    </span>
                    <span className="absolute -top-1 -right-2 text-[10px] bg-white/20 px-1 rounded-full">
                      {count === 1 ? 'student' : 'students'}
                    </span>
                  </div>
                  <span className="text-indigo-200 text-xs font-bold uppercase tracking-tighter ml-2">
                    Checked-in
                  </span>
                </div>
                
                {/* Live Activity Indicator */}
                {liveActivity.filter(a => a.courseCode === course?.course_code).length > 0 && (
                  <div className="flex items-center gap-1 animate-slide-in-right">
                    <div className="flex -space-x-2">
                      {liveActivity
                        .filter(a => a.courseCode === course?.course_code)
                        .slice(0, 3)
                        .map((activity, i) => (
                          <div 
                            key={i} 
                            className="w-6 h-6 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-[8px] font-bold animate-fade-in"
                            style={{ animationDelay: `${i * 100}ms` }}
                          >
                            {activity.studentName.charAt(0)}
                          </div>
                        ))}
                    </div>
                    <span className="text-[10px] text-white/80 animate-pulse">
                      +{liveActivity.filter(a => a.courseCode === course?.course_code).length}
                    </span>
                  </div>
                )}
                
                <button 
                  onClick={() => { 
                    setNewSession({...session, course_code: course?.course_code, course_title: course?.course_title}); 
                    setShowQRModal(true); 
                  }}
                  className="p-3 bg-white text-indigo-600 rounded-2xl hover:scale-110 transition-transform duration-300 shadow-lg hover:rotate-3 active:scale-95"
                >
                  <QrCode size={20} />
                </button>
              </div>
            </div>
            
            {/* Decorative QR Background */}
            <QrCode className="absolute -right-4 -bottom-4 text-white/5 rotate-12 transition-all duration-500 group-hover:scale-125 group-hover:rotate-6" size={160} />
            
            {/* Scanning Line Animation */}
            <div className="absolute inset-x-0 h-0.5 bg-white/30 animate-scan-line"></div>
          </div>
        )
      })}
    </div>
  </section>
)}

{/* Live Activity Feed */}
{showLiveFeed && liveActivity.length > 0 && (
  <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-indigo-100 overflow-hidden z-50 animate-slide-in-right">
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-3 text-white flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Activity size={16} className="animate-pulse" />
        <span className="font-bold text-sm">Live Activity</span>
      </div>
      <button 
        onClick={() => setShowLiveFeed(false)}
        className="hover:bg-white/20 p-1 rounded-lg transition-colors"
      >
        <X size={16} />
      </button>
    </div>
    <div className="max-h-80 overflow-y-auto p-2 space-y-2">
      {liveActivity.map((item) => (
        <div 
          key={item.id} 
          className="bg-slate-50 rounded-xl p-3 text-sm animate-slide-in-bottom hover:bg-indigo-50 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold group-hover:scale-110 transition-transform">
              {item.studentName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{item.studentName}</p>
              <p className="text-xs text-slate-500">{item.matricNo} • {item.courseCode}</p>
              <p className="text-[10px] text-indigo-400 mt-1">{item.time}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Add these styles to your component or global CSS */}
<style jsx>{`
  @keyframes numberPop {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
      color: #fff;
    }
    100% {
      transform: scale(1);
    }
  }
  
  @keyframes scanLine {
    0% {
      top: 0%;
      opacity: 0;
    }
    10% {
      opacity: 1;
    }
    90% {
      opacity: 1;
    }
    100% {
      top: 100%;
      opacity: 0;
    }
  }
  
  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes slideInBottom {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-number-pop {
    animation: numberPop 0.3s ease-out;
  }
  
  .animate-scan-line {
    animation: scanLine 3s linear infinite;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.3s ease-out;
  }
  
  .animate-slide-in-bottom {
    animation: slideInBottom 0.3s ease-out;
  }
  
  .animate-fade-in {
    animation: fadeIn 0.3s ease-out forwards;
  }
  
  /* Tabular numbers for consistent width */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }
`}</style>

      {/* --- COURSE GRID WITH PAGINATION --- */}
      <section className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BookMarked size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">My Courses</h2>
          </div>
          <button onClick={refetch} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
        
        {courses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-slate-300">
              <GraduationCap size={40} />
            </div>
            <h3 className="text-slate-900 font-black text-xl">No courses registered</h3>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">Build your academic portfolio by adding your first course today.</p>
            <button onClick={() => setShowCourseModal(true)} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-bold hover:shadow-xl transition-all">
              Add First Course
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {paginatedCourses.map((course) => (
                <div key={course.id} className="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs">
                      {course.course_code?.substring(0,3)}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editCourse(course)} className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                        <Edit size={16}/>
                      </button>
                      <button onClick={() => deleteCourse(course.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-black text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{course.course_title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase tracking-wider">{course.course_code}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-400 font-medium">{course.semester}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-50">
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Success Rate</p>
                      <p className="text-2xl font-black text-indigo-600 tracking-tighter">{course.overallPercentage}%</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Student Count</p>
                      <p className="text-2xl font-black text-slate-800 tracking-tighter">{course.uniqueStudents}</p>
                    </div>
                  </div>

                  <Link 
                    to={`/course/${course.id}/attendance`}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-slate-50 text-slate-700 rounded-2xl font-black text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                  >
                    Manage Attendance <ChevronRight size={16} />
                  </Link>
                </div>
              ))}
            </div>

            {/* --- PAGINATION CONTROLS --- */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-8">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-3 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                        currentPage === i + 1 ? 'bg-indigo-600 text-white scale-110 shadow-lg' : 'bg-white text-slate-400 border border-slate-200'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-3 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50 transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* --- MODALS (Enhanced Styling) --- */}
      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[110] transition-all">
          <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl w-full max-w-lg p-8 animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-inner">
                <BookOpen size={28}/>
              </div>
              <button onClick={() => { setShowCourseModal(false); setEditingCourse(null); }} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                <X size={20}/>
              </button>
            </div>
            

            <form onSubmit={handleCourseSubmit} className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">{editingCourse ? 'Modify Course' : 'Launch New Course'}</h3>
                <p className="text-slate-500 text-sm font-medium">Please provide accurate academic details below.</p>
              </div>
              
              <div className="grid gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                  <select 
                    required value={courseForm.department} onChange={handleDepartmentChange} 
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:bg-white outline-none transition-all font-medium appearance-none"
                  >
                    <option value="">Select Faculty...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Code</label>
                    {courseForm.department.includes('MTBM') ? (
                      <select required value={courseForm.course_code} onChange={handleCourseCodeChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold">
                        <option value="">Code</option>
                        {mtbmCourseOptions.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                      </select>
                    ) : (
                      <input type="text" required value={courseForm.course_code} onChange={handleCourseCodeChange} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold" placeholder="CS301"/>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Semester</label>
                    <select required value={courseForm.semester} onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium">
                      <option value="">Select...</option>
                      {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Course Title</label>
                  <input 
                    type="text" required value={courseForm.course_title} onChange={handleTitleChange} 
                    readOnly={courseForm.department.includes('MTBM')}
                    className={`w-full px-5 py-4 rounded-2xl font-bold transition-all ${courseForm.department.includes('MTBM') ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-transparent' : 'bg-slate-50 border border-slate-100 focus:bg-white'}`}
                    placeholder="Enter course name..."
                  />
                </div>
              </div>

              <button type="submit" className="w-full mt-4 bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 uppercase tracking-widest text-xs">
                {editingCourse ? 'Save Changes' : 'Confirm Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Session/QR Modals - Consistent Premium Styling */}
      {showSessionModal && !showQRModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[110]">
          <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom-10">
            <div className="flex justify-between items-center mb-8">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <QrCode size={28}/>
              </div>
              <button onClick={() => setShowSessionModal(false)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900"><X size={20}/></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black text-slate-900">Broadcasting</h3>
                <p className="text-slate-500 text-sm font-medium">Select a course to generate a unique entry key.</p>
              </div>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)} 
                className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
              >
                <option value="">Select active course...</option>
                {courses.map((c) => (<option key={c.id} value={c.id}>{c.course_code} - {c.course_title}</option>))}
              </select>
              <button 
                onClick={startSession} disabled={!selectedCourse} 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-xl hover:bg-black transition-all disabled:opacity-30 uppercase tracking-widest text-xs"
              >
                Launch QR Terminal
              </button>
            </div>
          </div>
        </div>
      )}

  {/* QR Modal */}
      {showQRModal && newSession && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 z-[120]">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center shadow-2xl relative">
            <button onClick={() => { setShowQRModal(false); setNewSession(null); }} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100">
              <X size={20}/>
            </button>
            
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{newSession.course_code}</h3>
              <p className="text-slate-500 text-sm">{newSession.course_title}</p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border-4 border-slate-50 flex justify-center shadow-inner mb-6">
              <QRCodeCanvas 
                value={JSON.stringify({ session_id: newSession.id, token: newSession.token })} 
                size={220} 
                level="H" 
              />
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 mb-6">
              <div className="flex flex-col items-center">
                <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Backup Code</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-indigo-600 tracking-widest">{newSession.numeric_code}</span>
                  <button onClick={() => copyToClipboard(newSession.numeric_code)} className="p-1.5 bg-white rounded-lg text-indigo-600 shadow-sm">
                    {copied ? <Check size={16}/> : <Copy size={16}/>}
                  </button>
                </div>
              </div>
            </div>

            <button onClick={downloadQR} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all">
              <Download size={20}/> Save QR Code
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default HocDashboard