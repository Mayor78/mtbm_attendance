import React from 'react';
import { QrCode, X, MapPin } from 'lucide-react';

const SessionModal = ({ 
  isOpen, 
  onClose, 
  courses, 
  selectedCourse, 
  onCourseChange, 
  onStartSession, 
  isCreatingSession,
  newSession 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[110]">
      <div className="bg-white rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-md p-8 animate-in slide-in-from-bottom-10">
        <div className="flex justify-between items-center mb-8">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <QrCode size={28} />
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900">Broadcasting</h3>
            <p className="text-slate-500 text-sm font-medium">Select a course to generate a unique entry key.</p>
          </div>
          
          <select 
            value={selectedCourse} 
            onChange={(e) => onCourseChange(e.target.value)} 
            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none"
          >
            <option value="">Select active course...</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code} - {c.course_title}
              </option>
            ))}
          </select>

          {newSession?.location && (
            <div className="mt-4 p-3 bg-blue-50 rounded-xl text-left">
              <p className="text-xs font-medium text-blue-700 flex items-center gap-1">
                <MapPin size={12} />
                Session location
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {newSession.location.address || `${newSession.location.lat.toFixed(4)}, ${newSession.location.lng.toFixed(4)}`}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Accuracy: ±{Math.round(newSession.location.accuracy)}m • Students must be within 200m
              </p>
            </div>
          )}
          
          <button 
            onClick={onStartSession} 
            disabled={!selectedCourse || isCreatingSession} 
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreatingSession ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating session...</span>
              </>
            ) : (
              'Generate QR Code'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;