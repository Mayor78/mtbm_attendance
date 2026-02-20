// components/NumericCodeInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertCircle, Wifi, WifiOff, MapPin, Loader, CheckCircle } from 'lucide-react';

// Retry utility
const executeWithRetry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err?.code === '53300' || err?.message?.includes('too many connections')) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
};

const NumericCodeInput = ({ onClose, onSuccess, onError }) => {
  const { user } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  const isMounted = useRef(true);
  const isSubmitting = useRef(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    isMounted.current = true;
    getCurrentLocation();
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted.current) {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
          setLocationError('');
          setLocationLoading(false);
        }
      },
      (err) => {
        if (isMounted.current) {
          setLocationError('Location access denied');
          setLocationLoading(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1 || loading || isSubmitting.current) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }

    if (index === 5 && value && newCode.every(d => d) && !isSubmitting.current) {
      timeoutRef.current = setTimeout(() => {
        if (!isSubmitting.current && isMounted.current) {
          handleSubmit();
        }
      }, 300);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting.current || loading) return;
    
    if (!location && !locationError) {
      setError('Getting location...');
      return;
    }

    const numericCode = code.join('');
    if (numericCode.length !== 6) {
      setError('Enter all 6 digits');
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    setError('');

    try {
      // Find session
      const { data: sessions } = await executeWithRetry(() =>
        supabase
          .from('attendance_sessions')
          .select(`
            id,
            course_id,
            expires_at,
            is_active,
            courses (
              course_code,
              course_title,
              department,
              level
            )
          `)
          .eq('numeric_code', numericCode)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())
      );

      if (!sessions?.length) {
        throw new Error('Invalid or expired code');
      }

      const session = sessions[0];

      // Get student
      const { data: student } = await executeWithRetry(() =>
        supabase
          .from('students')
          .select('id, department, level')
          .eq('user_id', user.id)
          .single()
      );

      if (!student) throw new Error('Student not found');

      // Validate department/level
      if (session.courses.department !== student.department) {
        throw new Error(`This session is for ${session.courses.department} only`);
      }

      if (session.courses.level !== student.level) {
        throw new Error(`This session is for Level ${session.courses.level} only`);
      }

      // Use atomic database function
      const { data: result, error } = await supabase
        .rpc('mark_attendance', {
          p_session_id: session.id,
          p_student_id: student.id,
          p_location_lat: location?.lat,
          p_location_lng: location?.lng,
          p_location_accuracy: location?.accuracy,
          p_device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      if (!result.success) {
        throw new Error(result.error);
      }

      if (isMounted.current) {
        onSuccess(`Attendance marked for ${session.courses?.course_code}`);
        setTimeout(() => {
          if (isMounted.current) onClose();
        }, 500);
      }

    } catch (err) {
      console.error('Attendance error:', err);
      if (isMounted.current) {
        setError(err.message);
        setCode(['', '', '', '', '', '']);
        setRetryCount(prev => prev + 1);
        document.getElementById('code-0')?.focus();
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isSubmitting.current = false;
    }
  };

  const customActions = (
    <div className="flex justify-end gap-3 w-full">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Cancel
      </Button>
      <Button 
        onClick={handleSubmit}
        disabled={loading || code.some(d => !d) || locationLoading}
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

        {/* Location Status */}
        <div className={`flex items-center p-3 rounded-lg ${
          location ? 'bg-green-50' : locationError ? 'bg-red-50' : 'bg-yellow-50'
        }`}>
          {locationLoading ? (
            <>
              <Loader size={20} className="text-yellow-600 mr-2 animate-spin" />
              <span className="text-sm text-yellow-700">Getting location...</span>
            </>
          ) : location ? (
            <>
              <MapPin className="text-green-600 mr-2" size={20} />
              <span className="text-sm text-green-700">
                Location captured (±{Math.round(location.accuracy)}m)
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="text-red-600 mr-2" size={20} />
              <span className="text-sm text-red-700">{locationError}</span>
            </>
          )}
        </div>

        {/* Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
            Enter 6-digit code
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
                className={`w-12 h-12 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all ${
                  loading 
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'
                }`}
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
            <AlertCircle className="text-red-600 mr-2 flex-shrink-0" size={16} />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Retry Count (for debugging, remove in production) */}
        {retryCount > 0 && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-gray-400 text-center">
            Retry attempts: {retryCount}
          </p>
        )}

        {/* Anti-cheating Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700 flex items-start">
            <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
            <span>Location and timestamp recorded to prevent cheating</span>
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default NumericCodeInput;