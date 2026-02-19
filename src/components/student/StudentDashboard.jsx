import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  QrCode, 
  Keyboard, 
  BookOpen, 
  History, 
  CheckCircle2, 
  LayoutDashboard,
  GraduationCap
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Toast from '../common/Toast';
import EnrolledCourses from './EnrolledCourses';
import AttendanceHistory from './AttendanceHistory';
import QRScanner from './QRScanner';
import NumericCodeInput from './NumericCodeInput';
import { useStudentAttendance } from '../../hooks/useAttendance';

const StudentDashboard = () => {
  const { user, student, profile } = useAuth();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [toast, setToast] = useState(null);
  
  const { records, loading, stats, error, refetch } = useStudentAttendance(user?.id);

  const handleShowToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAttendanceSuccess = (message) => {
    setShowQRScanner(false);
    setShowCodeInput(false);
    handleShowToast(message || 'Attendance marked successfully!', 'success');
    refetch();
  };

  const handleAttendanceError = (err) => {
    handleShowToast(err.message || 'Failed to mark attendance', 'error');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 space-y-8 px-4 sm:px-0">
      
      {/* Welcome Header */}
      <header className="relative overflow-hidden rounded-3xl bg-indigo-600 p-6 sm:p-8 text-white shadow-xl shadow-indigo-100">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 backdrop-blur-sm text-xs font-bold uppercase tracking-wider">
              <GraduationCap size={14} />
              MTBM HND1 Attendance 
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hey, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-indigo-100 text-sm sm:text-base max-w-md opacity-90 leading-relaxed">
              {student?.matric_no} • {student?.department}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQRScanner(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white text-indigo-600 rounded-2xl font-bold shadow-lg hover:bg-indigo-50 transition-all active:scale-95"
            >
              <QrCode size={20} />
              Scan QR
            </button>
            <button
              onClick={() => setShowCodeInput(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-indigo-500 text-white rounded-2xl font-bold border border-indigo-400 hover:bg-indigo-400 transition-all active:scale-95"
            >
              <Keyboard size={20} />
              Code
            </button>
          </div>
        </div>
        
        {/* Decorative Background Circles */}
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-indigo-800/20 rounded-full blur-3xl"></div>
      </header>

      {/* Stats Section */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <QuickStat 
          label="Attendance" 
          value={`${stats.percentage}%`} 
          sub="Overall average"
          icon={<CheckCircle2 className="text-emerald-600" />}
          theme="emerald"
        />
        <QuickStat 
          label="Present" 
          value={stats.attended} 
          sub="Classes attended"
          icon={<LayoutDashboard className="text-blue-600" />}
          theme="blue"
        />
        <div className="col-span-2 md:col-span-1">
          <QuickStat 
            label="Total Classes" 
            value={stats.totalClasses} 
            sub="Semester sessions"
            icon={<BookOpen className="text-indigo-600" />}
            theme="indigo"
          />
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Courses */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <BookOpen size={20} className="text-indigo-600" />
              My Courses
            </h2>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-2">
             <EnrolledCourses userId={user?.id} />
          </div>
        </div>

        {/* Right Column: Recent History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <History size={20} className="text-indigo-600" />
              Recent Activity
            </h2>
          </div>
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-4 sm:p-6">
            <AttendanceHistory records={records} loading={loading} />
          </div>
        </div>
      </div>

      {/* Modals & Alerts */}
      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onSuccess={handleAttendanceSuccess}
          onError={handleAttendanceError}
          userId={user?.id}
        />
      )}

      {showCodeInput && (
        <NumericCodeInput
          onClose={() => setShowCodeInput(false)}
          onSuccess={handleAttendanceSuccess}
          onError={handleAttendanceError}
          userId={user?.id}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        </div>
      )}
    </div>
  );
};

// Minimalistic Stat Component
const QuickStat = ({ label, value, sub, icon, theme }) => {
  const themes = {
    indigo: "bg-indigo-50 text-indigo-600",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600"
  };

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors group">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${themes[theme]}`}>
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">{label}</p>
      <p className="text-[10px] text-slate-400 font-medium mt-1">{sub}</p>
    </div>
  );
};

export default StudentDashboard;