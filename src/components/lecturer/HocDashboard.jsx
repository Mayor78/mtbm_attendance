import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useHOCData } from '../../hooks/useHOCData';
import { useLocation } from '../../hooks/useLocation';
import { supabase } from '../../lib/supabase';
import { api } from '../../lib/api';

// Import components
import HOCHeader from '../hoc/HOCHeader';
import NotificationBar from '../hoc/NotificationBar';
import LiveSessionCard from '../hoc/LiveSessionCard';
import LiveActivityFeed from '../hoc/LiveActivityFeed';
import CourseGrid from '../hoc/CourseGrid';
import CourseModal from '../hoc/CourseModal';
import SessionModal from '../hoc/SessionModal';
import QRModal from '../hoc/QRModal';
import ManualAttendanceModal from '../hoc/ManualAttendanceModal';
import AttendanceSkeleton from '../common/AttendanceSkeleton';
import HOCStats from '../hoc/HOCStats';

export const HocDashboard = () => {
  const { user, profile } = useAuth();
  const { 
    courses, 
    hocInfo,
    loading, 
    error: hookError, 
    stats,
    liveActivity,
    refetch 
  } = useHOCData(user?.id);
  
  const { getCurrentLocation } = useLocation();
  
  // Modal States
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [newSession, setNewSession] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showLiveFeed, setShowLiveFeed] = useState(true);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 6;

  // Department and Course Options
  const departments = [
    'Maritime Transport & Business Management (MTBM)',
    'Nautical Science',
    'Marine Engineering',
    'Electrical Engineering',
    'Mechanical Engineering',
    'Computer Science',
    'Business Administration'
  ];

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
  ];

  const semesters = ['First Semester', 'Second Semester', 'Summer Semester'];

  // Check active sessions
  const checkActiveSessions = async () => {
    if (!courses.length) return;
    
    const courseIds = courses.map(c => c.id);
    const sessions = await api.fetchActiveSessionsWithRecords(courseIds);
    setActiveSessions(sessions);
  };

  // Use effect to check active sessions when courses change
  React.useEffect(() => {
    if (courses.length > 0) {
      checkActiveSessions();
    }
  }, [courses]);

  // Auto-refresh active sessions every 30 seconds
  React.useEffect(() => {
    if (!courses.length) return;
    
    const interval = setInterval(() => {
      checkActiveSessions();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [courses]);

  const handleCourseSubmit = async (formData) => {
    setError(''); 
    setSuccess('');
    
    try {
      if (editingCourse) {
        await api.updateCourse(editingCourse.id, {
          course_code: formData.course_code,
          course_title: formData.course_title,
          department: formData.department,
          semester: formData.semester
        });
        setSuccess('Course updated successfully!');
      } else {
        // Create new course with HOC's level
        const newCourse = await api.createCourse({
          course_code: formData.course_code,
          course_title: formData.course_title,
          department: formData.department,
          semester: formData.semester,
          level: hocInfo?.level
        });
        
        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (studentData) {
          try {
            await api.addCourseRepresentative(studentData.id, newCourse.id);
            setSuccess('Course created successfully!');
          } catch (repError) {
            console.error('Rep insert error:', repError);
            setSuccess('Course created! But you may need to manually assign yourself as HOC.');
          }
        }
      }
      
      setEditingCourse(null); 
      setShowCourseModal(false); 
      refetch();
      
    } catch (error) { 
      setError(error.message); 
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;
    try {
      await api.deleteCourse(id);
      setSuccess('Course deleted successfully');
      refetch();
    } catch (e) { 
      setError('Delete failed'); 
    }
  };

  const startSession = async () => {
    if (!selectedCourse) return;
    
    try {
      setError('');
      setIsCreatingSession(true);

      const hocLocation = await getCurrentLocation();
      
      if (!hocLocation) {
        throw new Error('Cannot create session without location. Please enable GPS to set the attendance boundary.');
      }

      // Verify course matches HOC's department and level
      const course = courses.find(c => c.id === selectedCourse);
      
      if (course.department !== hocInfo?.department) {
        throw new Error(`You can only create sessions for ${hocInfo?.department} department courses.`);
      }

      if (course.level !== hocInfo?.level) {
        throw new Error(`You can only create sessions for ${hocInfo?.level} level courses.`);
      }
      
      const token = crypto.randomUUID();
      const numeric_code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Set expiry to 1 hour from now
      const ONE_HOUR = 60 * 60 * 1000;
      const expires_at = new Date(Date.now() + ONE_HOUR).toISOString();
      
      const sessionData = {
        course_id: selectedCourse,
        created_by: user.id,
        token: token,
        start_time: new Date().toISOString(),
        expires_at: expires_at,
        is_active: true,
        numeric_code: numeric_code,
        allowed_location_lat: hocLocation.lat,
        allowed_location_lng: hocLocation.lng,
        allowed_radius_meters: 500,
        strict_location: true
      };
      
      const data = await api.createSession(sessionData);

      if (data) {
        const course = courses.find(c => c.id === selectedCourse);
        
        setSuccess(`Session started for 1 hour at ${hocLocation.address || 'your location'} (${Math.round(hocLocation.accuracy)}m accuracy)`);
        
        setNewSession({ 
          ...data, 
          course_code: course?.course_code, 
          course_title: course?.course_title,
          location: hocLocation
        });
        
        // Update active sessions
        setActiveSessions(prev => ({
          ...prev,
          [selectedCourse]: data
        }));
        
        setShowQRModal(true);
        setShowSessionModal(false);
        refetch();

        // Auto-end session after 1 hour
        setTimeout(() => {
          autoEndSession(data.id);
        }, ONE_HOUR);
      }
    } catch (error) { 
      console.error('Start session error:', error);
      setError(error.message || 'Failed to start session.'); 
    } finally {
      setIsCreatingSession(false);
    }
  };

  const autoEndSession = async (sessionId) => {
    try {
      console.log('⏰ Auto-ending session:', sessionId);
      
      // Check if session is still active before ending
      const { data: session } = await supabase
        .from('attendance_sessions')
        .select('is_active')
        .eq('id', sessionId)
        .single();

      if (session && session.is_active) {
        await api.endSession(sessionId);
        console.log('✅ Session auto-ended successfully');
        
        // Refresh active sessions
        checkActiveSessions();
        refetch();
        setSuccess('Session ended automatically (1 hour elapsed)');
      }
    } catch (error) {
      console.error('Error auto-ending session:', error);
    }
  };

  const endSession = async (id) => {
    try {
      await api.endSession(id);
      setSuccess('Session ended manually');
      checkActiveSessions(); 
      refetch();
    } catch (error) {
      console.error('Error ending session:', error);
      setError('Failed to end session');
    }
  };

  const downloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `qr-${newSession?.course_code}.png`;
      link.click();
    }
  };

  const editCourse = (course) => {
    setEditingCourse(course);
    setShowCourseModal(true);
  };

  // Pagination
  const paginatedCourses = useMemo(() => {
    const startIndex = (currentPage - 1) * coursesPerPage;
    return courses.slice(startIndex, startIndex + coursesPerPage);
  }, [courses, currentPage]);

  const totalPages = Math.ceil(courses.length / coursesPerPage);

  if (loading) return <AttendanceSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 text-slate-900 space-y-8">
      
      {/* Header with HOC Info */}
      <HOCHeader
        profile={profile}
        hocInfo={hocInfo}
        onNewCourse={() => {
          setEditingCourse(null);
          setShowCourseModal(true);
        }}
        onStartSession={() => setShowSessionModal(true)}
        onManualAttendance={() => setShowManualModal(true)}
      />

      {/* Quick Stats */}
      <HOCStats stats={stats} />

      {/* Notifications */}
      {(error || hookError || success) && (
        <NotificationBar
          error={error}
          hookError={hookError}
          success={success}
          onClearError={() => setError('')}
          onClearSuccess={() => setSuccess('')}
        />
      )}

      {/* Live Sessions */}
      {Object.keys(activeSessions).length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Broadcasts</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(activeSessions).map(([courseId, session]) => {
              const course = courses.find(c => c.id === courseId);
              const count = session?.attendance_records?.length || 0;
              
              return (
                <LiveSessionCard
                  key={session.id}
                  session={session}
                  course={course}
                  count={count}
                  liveActivity={liveActivity}
                  onEndSession={endSession}
                  onShowQR={(session, course) => {
                    setNewSession({...session, course_code: course?.course_code, course_title: course?.course_title});
                    setShowQRModal(true);
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Live Activity Feed */}
      {showLiveFeed && liveActivity.length > 0 && (
        <LiveActivityFeed
          activities={liveActivity}
          onClose={() => setShowLiveFeed(false)}
        />
      )}

      {/* Course Grid */}
      <CourseGrid
        courses={courses}
        paginatedCourses={paginatedCourses}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        onRefresh={refetch}
        onAddCourse={() => {
          setEditingCourse(null);
          setShowCourseModal(true);
        }}
        onEditCourse={editCourse}
        onDeleteCourse={deleteCourse}
        hocLevel={hocInfo?.level}
        hocDepartment={hocInfo?.department}
      />

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false);
          setEditingCourse(null);
        }}
        onSubmit={handleCourseSubmit}
        editingCourse={editingCourse}
        departments={departments}
        mtbmCourseOptions={mtbmCourseOptions}
        semesters={semesters}
        user={user}
        hocLevel={hocInfo?.level}
      />

      {/* Session Modal */}
      <SessionModal
        isOpen={showSessionModal && !showQRModal}
        onClose={() => setShowSessionModal(false)}
        courses={courses}
        selectedCourse={selectedCourse}
        onCourseChange={setSelectedCourse}
        onStartSession={startSession}
        isCreatingSession={isCreatingSession}
      />

      {/* QR Modal */}
      <QRModal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setNewSession(null);
        }}
        session={newSession}
        onDownload={downloadQR}
      />

      {/* Manual Attendance Modal */}
      <ManualAttendanceModal
        isOpen={showManualModal}
        onClose={() => setShowManualModal(false)}
        courses={courses}
        user={user}
        profile={profile}
        onSuccess={() => {
          setShowManualModal(false);
          refetch();
        }}
        supabase={supabase}
        setError={setError}
        setSuccess={setSuccess}
        refetch={refetch}
      />
    </div>
  );
};

export default HocDashboard;