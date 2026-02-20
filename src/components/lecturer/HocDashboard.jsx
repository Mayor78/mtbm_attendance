import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { useHOCAttendance, useCourseAttendance } from '../../hooks/useAttendance'
import { 
  QrCode, Copy, Check, Clock, Eye, X, Calendar, Users, 
  Download, RefreshCw, Plus, Edit, Trash2, BookOpen, 
  GraduationCap, Hash, BookMarked, ChevronRight, AlertCircle
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

export const HocDashboard = () => {
  const { user, profile } = useAuth()
  const { courses, loading, error: hookError, refetch } = useHOCAttendance(user?.id)
  
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
  
  const [courseForm, setCourseForm] = useState({
    course_code: '',
    course_title: '',
    department: '',
    semester: ''
  })

  // Departments
  const departments = [
    'Maritime Transport & Business Management (MTBM)',
    'Nautical Science',
    'Marine Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Computer Science',
    'Business Administration'
  ]

  // MTBM Course Options (only these courses)
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

  // Handle department change
  const handleDepartmentChange = (e) => {
    const selectedDept = e.target.value
    setCourseForm({ 
      ...courseForm, 
      department: selectedDept,
      course_code: '', // Reset course code when department changes
      course_title: ''
    })
  }

  // Handle course code selection
  const handleCourseCodeChange = (e) => {
    const selectedCode = e.target.value
    
    // Only show MTBM courses if MTBM department is selected
    if (courseForm.department.includes('MTBM')) {
      const selectedCourse = mtbmCourseOptions.find(c => c.code === selectedCode)
      setCourseForm({ 
        ...courseForm, 
        course_code: selectedCode,
        course_title: selectedCourse ? selectedCourse.title : ''
      })
    } else {
      // For other departments, allow manual entry
      setCourseForm({ 
        ...courseForm, 
        course_code: selectedCode,
        course_title: courseForm.course_title
      })
    }
  }

  // Handle manual title input for other departments
  const handleTitleChange = (e) => {
    setCourseForm({ 
      ...courseForm, 
      course_title: e.target.value 
    })
  }

  // Check for active sessions
  React.useEffect(() => {
    if (courses.length > 0) {
      checkActiveSessions()
    }
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
    setError('')
    setSuccess('')
    
    try {
      let courseId
      
      if (editingCourse) {
        const { error } = await supabase
          .from('courses')
          .update({ 
            course_code: courseForm.course_code, 
            course_title: courseForm.course_title, 
            department: courseForm.department, 
            semester: courseForm.semester 
          })
          .eq('id', editingCourse.id)
          
        if (error) throw error
        setSuccess('Course updated successfully!')
      } else {
        const { data, error } = await supabase
          .from('courses')
          .insert({ 
            course_code: courseForm.course_code, 
            course_title: courseForm.course_title, 
            department: courseForm.department, 
            semester: courseForm.semester 
          })
          .select()
          .single()
          
        if (error) throw error
        
        courseId = data.id
        
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()
          
        if (studentError) throw studentError
        
        if (student) {
          const { error: repError } = await supabase
            .from('course_representatives')
            .insert({ 
              student_id: student.id, 
              course_id: courseId 
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
      setEditingCourse(null)
      setShowCourseModal(false)
      refetch() // Refresh the hook data
      
    } catch (error) { 
      console.error('Course save error:', error)
      setError(error.message || 'Failed to save course') 
    }
  }

  const deleteCourse = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return
    try {
      const { error } = await supabase.from('courses').delete().eq('id', courseId)
      if (error) throw error
      setSuccess('Course deleted successfully')
      refetch()
    } catch (error) { 
      setError('Failed to delete course') 
    }
  }

  const startSession = async () => {
    if (!selectedCourse) return
    
    try {
      setError('')
      
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
        setShowQRModal(true)
        setShowSessionModal(false)
        checkActiveSessions()
        refetch() // Refresh the hook data
      }
    } catch (error) { 
      console.error('Start session error:', error)
      setError(error.message || 'Failed to start session.') 
    }
  }

  const endSession = async (sessionId) => {
    try {
      await supabase.from('attendance_sessions').update({ is_active: false }).eq('id', sessionId)
      checkActiveSessions()
      refetch()
    } catch (error) { 
      console.error(error) 
    }
  }

  const downloadQR = () => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      const pngUrl = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.href = pngUrl
      downloadLink.download = `qr-${newSession?.course_code}.png`
      downloadLink.click()
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const editCourse = (course) => {
    setEditingCourse(course)
    setCourseForm({
      course_code: course.course_code,
      course_title: course.course_title,
      department: course.department,
      semester: course.semester
    })
    setShowCourseModal(true)
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 text-slate-900">
      
      {/* --- HEADER SECTION --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">HOC Command</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            Welcome, {profile?.full_name?.split(' ')[0] || 'HOC'} • Managing {courses.length} Course{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setEditingCourse(null); setCourseForm({ course_code: '', course_title: '', department: '', semester: '' }); setShowCourseModal(true); }}
            className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm hover:bg-slate-50 transition-all"
          >
            <Plus size={18} /> New Course
          </button>
          <button
            onClick={() => setShowSessionModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <QrCode size={18} /> Start Session
          </button>
        </div>
      </header>

      {/* Error/Success Notifications */}
      {(error || hookError) && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error || hookError}</span>
          <button onClick={() => setError('')}><X size={18} /></button>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X size={18} /></button>
        </div>
      )}

      {/* --- ACTIVE SESSIONS --- */}
      {Object.keys(activeSessions).length > 0 && (
        <section className="bg-indigo-900 rounded-3xl p-1 shadow-xl overflow-hidden">
          <div className="bg-indigo-800/50 px-6 py-3 flex items-center justify-between">
            <h2 className="text-white text-sm font-bold flex items-center gap-2">
              <Clock size={16} className="animate-pulse" /> LIVE SESSIONS
            </h2>
          </div>
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(activeSessions).map(([courseId, session]) => {
              const course = courses.find(c => c.id === courseId)
              return (
                <div key={session.id} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-bold px-2 py-0.5 bg-green-500 rounded-full">ACTIVE</span>
                    <button onClick={() => endSession(session.id)} className="text-xs font-bold text-indigo-200 hover:text-white uppercase tracking-wider">End</button>
                  </div>
                  <h3 className="font-bold truncate">{course?.course_code}: {course?.course_title}</h3>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-indigo-200 uppercase font-bold">Scanned</p>
                      <p className="text-2xl font-black">
                        {course?.attendanceRecords?.filter(r => r.session_id === session.id).length || 0}
                        <span className="text-indigo-300 text-sm font-normal"> / {course?.totalStudents || 0}</span>
                      </p>
                    </div>
                    <button 
                      onClick={() => { setNewSession({...session, course_code: course?.course_code, course_title: course?.course_title}); setShowQRModal(true); }}
                      className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* --- COURSE GRID --- */}
      {/* --- COURSE GRID --- */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookMarked size={22} className="text-indigo-600" />
            My Courses
          </h2>
          <button
            onClick={refetch}
            className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
        
        {courses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
             <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
               <GraduationCap size={32} />
             </div>
             <h3 className="text-slate-900 font-bold text-lg">No courses found</h3>
             <p className="text-slate-500 mb-6">Start by creating your first course.</p>
             <button onClick={() => setShowCourseModal(true)} className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all">
               Create Course
             </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const totalAttendance = course.attendanceRecords?.length || 0
              const totalPossible = course.totalSessions * course.totalStudents
              const attendanceRate = totalPossible > 0 
                ? Math.round((totalAttendance / totalPossible) * 100) 
                : 0
              
              return (
                <div key={course.id} className="group bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                      {course.course_code?.substring(0,2)}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => editCourse(course)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg">
                        <Edit size={16}/>
                      </button>
                      <button onClick={() => deleteCourse(course.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{course.course_title}</h3>
                    <p className="text-slate-500 text-sm mt-1 font-medium">{course.course_code} • {course.semester}</p>
                  </div>

                 {/* In the course card section, update the stats display */}
<div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-50">
  <div>
    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Attendance</p>
    <p className="text-xl font-black text-indigo-600">{course.overallPercentage}%</p>
    <p className="text-xs text-slate-400">
      {course.attendanceRecords.length} / {course.totalSessions * course.totalStudents} marks
    </p>
  </div>
  <div>
    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Students</p>
    <p className="text-xl font-black text-slate-800">{course.todayAttendance}</p>
    <p className="text-xs text-slate-400">
      {course.uniqueStudents} unique attendees
    </p>
  </div>
</div>



                  <Link 
                    to={`/course/${course.id}/attendance`}
                    className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-700 rounded-xl font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"
                  >
                    View Details <ChevronRight size={16} />
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Course Modal */}
      {showCourseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <BookOpen size={24}/>
              </div>
              <button onClick={() => { setShowCourseModal(false); setEditingCourse(null); }} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <h3 className="text-2xl font-bold text-slate-900">{editingCourse ? 'Update Course' : 'Add New Course'}</h3>
              
              <div className="space-y-4">
                {/* Department Dropdown */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Department</label>
                  <select 
                    required 
                    value={courseForm.department} 
                    onChange={handleDepartmentChange} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value="">Select Department...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {/* Course Code - Dropdown for MTBM, Input for others */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Course Code</label>
                  {courseForm.department.includes('MTBM') ? (
                    <select 
                      required 
                      value={courseForm.course_code} 
                      onChange={handleCourseCodeChange} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none"
                    >
                      <option value="">Select Course Code...</option>
                      {mtbmCourseOptions.map(course => (
                        <option key={course.code} value={course.code}>
                          {course.code} - {course.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input 
                      type="text" 
                      required 
                      value={courseForm.course_code} 
                      onChange={handleCourseCodeChange} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none" 
                      placeholder="e.g., CS301"
                    />
                  )}
                </div>

                {/* Course Title - Auto-filled for MTBM, Input for others */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Course Title</label>
                  {courseForm.department.includes('MTBM') ? (
                    <input 
                      type="text" 
                      required 
                      value={courseForm.course_title} 
                      readOnly
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-slate-600 cursor-not-allowed" 
                      placeholder="Auto-filled from selection"
                    />
                  ) : (
                    <input 
                      type="text" 
                      required 
                      value={courseForm.course_title} 
                      onChange={handleTitleChange} 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none" 
                      placeholder="Course Title"
                    />
                  )}
                </div>

                {/* Semester Dropdown */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Semester</label>
                  <select 
                    required 
                    value={courseForm.semester} 
                    onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })} 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none"
                  >
                    <option value="">Select Semester...</option>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full mt-6 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
                {editingCourse ? 'Save Changes' : 'Create Course'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Session Modal */}
      {showSessionModal && !showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[110]">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <QrCode size={24}/>
              </div>
              <button onClick={() => setShowSessionModal(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X size={20}/>
              </button>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-900">Start Session</h3>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Select Course</label>
                <select 
                  value={selectedCourse} 
                  onChange={(e) => setSelectedCourse(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.course_code} - {course.course_title}
                    </option>
                  ))}
                </select>
              </div>
              <button 
                onClick={startSession} 
                disabled={!selectedCourse} 
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                Generate QR Code
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