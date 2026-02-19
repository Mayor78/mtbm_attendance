import React, { useState } from 'react';
import Button from '../common/Button';
import Card from '../common/Card';
import { ConfirmModal, InfoModal } from '../common/Modal';

const SessionControls = ({
  onStartSession,
  onCloseSession,
  onPauseSession,
  onResumeSession,
  onExtendSession,
  sessionStatus = 'inactive', // 'inactive', 'active', 'paused', 'ended'
  sessionData = null,
  className = ''
}) => {
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showPauseConfirm, setShowPauseConfirm] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState(15);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Session timer (mock)
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);

  React.useEffect(() => {
    if (sessionStatus === 'active' && !timerInterval) {
      const interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else if (sessionStatus !== 'active' && timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [sessionStatus, timerInterval]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSession = () => {
    setShowStartConfirm(true);
  };

  const confirmStartSession = () => {
    setShowStartConfirm(false);
    setElapsedTime(0);
    onStartSession();
    setSuccessMessage('Session started successfully');
    setShowSuccess(true);
  };

  const handleCloseSession = () => {
    setShowCloseConfirm(true);
  };

  const confirmCloseSession = () => {
    setShowCloseConfirm(false);
    onCloseSession();
    setSuccessMessage('Session ended successfully');
    setShowSuccess(true);
  };

  const handlePauseSession = () => {
    setShowPauseConfirm(true);
  };

  const confirmPauseSession = () => {
    setShowPauseConfirm(false);
    onPauseSession();
    setSuccessMessage('Session paused');
    setShowSuccess(true);
  };

  const handleResumeSession = () => {
    onResumeSession();
    setSuccessMessage('Session resumed');
    setShowSuccess(true);
  };

  const handleExtendSession = () => {
    onExtendSession(extendMinutes);
    setShowExtendModal(false);
    setSuccessMessage(`Session extended by ${extendMinutes} minutes`);
    setShowSuccess(true);
  };

  const statusColors = {
    inactive: 'bg-gray-100 text-gray-600',
    active: 'bg-green-100 text-green-600',
    paused: 'bg-yellow-100 text-yellow-600',
    ended: 'bg-red-100 text-red-600'
  };

  const statusLabels = {
    inactive: 'No Active Session',
    active: 'Session Active',
    paused: 'Session Paused',
    ended: 'Session Ended'
  };

  return (
    <>
      <Card className={className}>
        <div className="p-6">
          {/* Session Status Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Session Control</h3>
              <p className="text-sm text-gray-500 mt-1">Manage your attendance session</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${statusColors[sessionStatus]}`}>
              <span className="text-sm font-medium">{statusLabels[sessionStatus]}</span>
            </div>
          </div>

          {/* Active Session Info */}
          {sessionStatus !== 'inactive' && sessionStatus !== 'ended' && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-blue-600">Session ID</p>
                  <p className="text-sm font-medium text-gray-800">{sessionData?.sessionId || 'SESS-001'}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Course</p>
                  <p className="text-sm font-medium text-gray-800">{sessionData?.course || 'CS101'}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Started</p>
                  <p className="text-sm font-medium text-gray-800">{sessionData?.startTime || '10:00 AM'}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Duration</p>
                  <p className="text-sm font-medium text-gray-800">{formatTime(elapsedTime)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="space-y-4">
            {/* Start Session */}
            {sessionStatus === 'inactive' && (
              <Button
                variant="primary"
                size="lg"
                fullWidth
                icon="▶"
                onClick={handleStartSession}
              >
                Start New Session
              </Button>
            )}

            {/* Active Session Controls */}
            {sessionStatus === 'active' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="warning"
                    icon="⏸"
                    onClick={handlePauseSession}
                  >
                    Pause
                  </Button>
                  <Button
                    variant="secondary"
                    icon="⏱"
                    onClick={() => setShowExtendModal(true)}
                  >
                    Extend
                  </Button>
                </div>
                <Button
                  variant="danger"
                  icon="⏹"
                  fullWidth
                  onClick={handleCloseSession}
                >
                  End Session
                </Button>
              </div>
            )}

            {/* Paused Session Controls */}
            {sessionStatus === 'paused' && (
              <div className="space-y-3">
                <Button
                  variant="primary"
                  icon="▶"
                  fullWidth
                  onClick={handleResumeSession}
                >
                  Resume Session
                </Button>
                <Button
                  variant="danger"
                  icon="⏹"
                  fullWidth
                  onClick={handleCloseSession}
                >
                  End Session
                </Button>
              </div>
            )}

            {/* Ended Session */}
            {sessionStatus === 'ended' && (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-3">This session has ended</p>
                <Button
                  variant="primary"
                  icon="🔄"
                  fullWidth
                  onClick={handleStartSession}
                >
                  Start New Session
                </Button>
              </div>
            )}
          </div>

          {/* Session Info Footer */}
          {sessionData && sessionStatus !== 'inactive' && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">QR Code:</span>
                <span className="font-mono text-gray-800">{sessionData.qrCode || 'QR-001'}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Numeric Code:</span>
                <span className="font-mono text-gray-800">{sessionData.numericCode || '482195'}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-500">Present / Total:</span>
                <span className="font-medium text-gray-800">{sessionData.present || 0} / {sessionData.total || 45}</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Start Session Confirmation */}
      <ConfirmModal
        isOpen={showStartConfirm}
        onClose={() => setShowStartConfirm(false)}
        onConfirm={confirmStartSession}
        title="Start Attendance Session"
        message="This will generate a new QR code and numeric code for students to mark their attendance. Do you want to proceed?"
        confirmText="Yes, Start Session"
        cancelText="Cancel"
        confirmVariant="primary"
      />

      {/* Close Session Confirmation */}
      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={confirmCloseSession}
        title="End Attendance Session"
        message="Are you sure you want to end this session? Students will no longer be able to mark attendance."
        confirmText="Yes, End Session"
        cancelText="No, Keep Open"
        confirmVariant="danger"
      />

      {/* Pause Session Confirmation */}
      <ConfirmModal
        isOpen={showPauseConfirm}
        onClose={() => setShowPauseConfirm(false)}
        onConfirm={confirmPauseSession}
        title="Pause Session"
        message="Students will not be able to mark attendance while the session is paused. You can resume anytime."
        confirmText="Yes, Pause"
        cancelText="No, Continue"
        confirmVariant="warning"
      />

      {/* Extend Session Modal */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Extend Session</h3>
              <p className="text-sm text-gray-600 mb-4">
                How many extra minutes would you like to add?
              </p>

              <div className="space-y-4">
                <div className="flex gap-2">
                  {[5, 10, 15, 30].map(minutes => (
                    <button
                      key={minutes}
                      onClick={() => setExtendMinutes(minutes)}
                      className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                        extendMinutes === minutes
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      +{minutes}m
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Custom minutes</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={extendMinutes}
                    onChange={(e) => setExtendMinutes(parseInt(e.target.value) || 15)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={handleExtendSession}
                  >
                    Extend by {extendMinutes} min
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => setShowExtendModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Success Notification */}
      <InfoModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Success"
        message={successMessage}
        type="success"
      />
    </>
  );
};

// Quick Session Stats Component
export const SessionStats = ({ sessionData, className = '' }) => {
  if (!sessionData) return null;

  const attendanceRate = sessionData.total > 0 
    ? Math.round((sessionData.present / sessionData.total) * 100) 
    : 0;

  return (
    <Card className={className}>
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-600 mb-3">Session Statistics</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Present</span>
            <span className="text-sm font-medium text-green-600">{sessionData.present || 0}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Absent</span>
            <span className="text-sm font-medium text-red-600">
              {(sessionData.total || 0) - (sessionData.present || 0)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Late</span>
            <span className="text-sm font-medium text-yellow-600">{sessionData.late || 0}</span>
          </div>
          
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
              <span className={`text-sm font-bold ${
                attendanceRate >= 75 ? 'text-green-600' : 
                attendanceRate >= 50 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {attendanceRate}%
              </span>
            </div>
            
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-2">
              <div 
                className={`h-full rounded-full ${
                  attendanceRate >= 75 ? 'bg-green-600' : 
                  attendanceRate >= 50 ? 'bg-yellow-600' : 
                  'bg-red-600'
                }`}
                style={{ width: `${attendanceRate}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Session History Component
export const SessionHistory = ({ sessions, onViewSession, className = '' }) => {
  return (
    <Card title="Recent Sessions" className={className}>
      <div className="divide-y divide-gray-100">
        {sessions && sessions.length > 0 ? (
          sessions.map((session, index) => (
            <div 
              key={index}
              onClick={() => onViewSession && onViewSession(session)}
              className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded cursor-pointer transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{session.course}</p>
                <p className="text-xs text-gray-500">
                  {session.date} • {session.time} • {session.duration}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">
                  {session.present}/{session.total}
                </p>
                <p className={`text-xs ${
                  session.rate >= 75 ? 'text-green-600' : 
                  session.rate >= 50 ? 'text-yellow-600' : 
                  'text-red-600'
                }`}>
                  {session.rate}%
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-400">
            <p className="text-sm">No recent sessions</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SessionControls;