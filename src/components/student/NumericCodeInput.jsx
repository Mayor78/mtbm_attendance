import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

const NumericCodeInput = ({ onClose, onSuccess, onError }) => {
  const { user } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);

  useEffect(() => {
    // Request location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {});
    }
  }, []);

  const handleCodeChange = (index, value) => {
    if (value.length > 1) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // When all 6 digits are entered, auto-submit
    if (index === 5 && value && newCode.every(d => d)) {
      handleSubmit();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async () => {
    const numericCode = code.join('');
    if (numericCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Looking for session with numeric code:', numericCode);

      // Find session by numeric code
      const { data: sessions, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          course_id,
          expires_at,
          is_active,
          courses (
            course_code,
            course_title
          )
        `)
        .eq('numeric_code', numericCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      if (sessionError) throw sessionError;

      if (!sessions || sessions.length === 0) {
        throw new Error('Invalid or expired code');
      }

      const session = sessions[0];
      console.log('Found session:', session);

      // Get student ID
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw new Error('Student record not found');

      // Check if already attended
      const { data: existing, error: existingError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (existing) {
        throw new Error('You have already marked attendance for this session');
      }

      // Submit attendance
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: student.id,
          scanned_at: new Date().toISOString()
        });

      if (error) throw error;

      setSessionInfo(session);
      onSuccess(`Attendance marked for ${session.courses?.course_code}!`);
      onClose();
    } catch (err) {
      console.error('Attendance error:', err);
      setError(err.message);
      // Clear code on error
      setCode(['', '', '', '', '', '']);
      // Focus first input
      document.getElementById('code-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const customActions = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" onClick={onClose}>
        Cancel
      </Button>
      <Button 
        onClick={handleSubmit}
        disabled={loading || code.some(d => !d)}
        loading={loading}
      >
        Submit
      </Button>
    </div>
  );

  return (
    <Modal isOpen={true} onClose={onClose} title="Enter Numeric Code" size="md" actions={customActions}>
      <div className="space-y-6">
        {/* Network Status */}
        <div className={`flex items-center p-3 rounded-lg ${
          navigator.onLine ? 'bg-green-50' : 'bg-yellow-50'
        }`}>
          {navigator.onLine ? (
            <>
              <Wifi className="text-green-600 mr-2" size={20} />
              <span className="text-sm text-green-700">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="text-yellow-600 mr-2" size={20} />
              <span className="text-sm text-yellow-700">Offline</span>
            </>
          )}
        </div>

        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Enter the 6-digit code from your HOC
          </label>
          <div className="flex justify-center space-x-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus={index === 0}
                disabled={loading}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 p-3 rounded-lg flex items-center">
            <AlertCircle className="text-red-600 mr-2" size={16} />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-center text-gray-500">
          Ask your HOC for the 6-digit numeric code
        </p>
      </div>
    </Modal>
  );
};

export default NumericCodeInput;