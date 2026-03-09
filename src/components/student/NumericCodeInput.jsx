import React, { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertCircle, Wifi, WifiOff, MapPin, Loader, CheckCircle, Clock } from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';

// Retry utility with exponential backoff
const executeWithRetry = async (fn, maxRetries = 3) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err?.code === '53300' || err?.message?.includes('too many connections')) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error('Max retries exceeded');
};

const NumericCodeInput = ({ onClose, onSuccess, onError }) => {
  const { user } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [validationStatus, setValidationStatus] = useState('idle'); // idle, validating, valid, invalid
  
  // Use the location hook
  const { 
    cachedLocation, 
    locationStatus,
    isCached,
    refreshLocation,
    isLoading: locationLoading 
  } = useLocation();

  const isMounted = useRef(true);
  const isSubmitting = useRef(false);
  const timeoutRef = useRef(null);
  
  // Rate limiting refs
  const submissionCount = useRef(0);
  const lastSubmissionTime = useRef(Date.now());

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-validate code as user types
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !isSubmitting.current && !loading) {
      // Debounce validation
      const timer = setTimeout(() => {
        validateCode(fullCode);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setValidationStatus('idle');
      setSessionInfo(null);
    }
  }, [code]);

  // TanStack Query mutation for attendance
  const attendanceMutation = useMutation({
    mutationFn: async ({ numericCode, location, manualOverride }) => {
      // Find session with retry logic
      const { data: sessions } = await executeWithRetry(() =>
        supabase
          .from('attendance_sessions')
          .select(`
            id,
            course_id,
            expires_at,
            is_active,
            allowed_location_lat,
            allowed_location_lng,
            allowed_radius_meters,
            strict_location,
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
        throw new Error('invalid_code');
      }

      const session = sessions[0];

      // Get student info
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
        throw new Error('wrong_department');
      }

      if (session.courses.level !== student.level) {
        throw new Error('wrong_level');
      }

      // Check for duplicate
      const { data: existing } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (existing) {
        throw new Error('already_marked');
      }

      // Insert attendance record
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: student.id,
          scanned_at: new Date().toISOString(),
          location_lat: location?.lat,
          location_lng: location?.lng,
          location_accuracy: location?.accuracy,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString(),
            locationMethod: location?.method,
            isCached,
            manualOverride
          }
        });

      if (insertError) throw insertError;

      return {
        session,
        courseCode: session.courses.course_code,
        courseTitle: session.courses.course_title
      };
    },
    onSuccess: (data) => {
      submissionCount.current = 0;
      onSuccess(`Attendance marked for ${data.courseCode}`);
      setTimeout(() => onClose(), 500);
    },
    onError: (err) => {
      let errorMessage = '';
      
      switch(err.message) {
        case 'invalid_code':
          errorMessage = 'Invalid or expired code. Please check and try again.';
          break;
        case 'wrong_department':
          errorMessage = 'This code is for a different department.';
          break;
        case 'wrong_level':
          errorMessage = 'This code is for a different level.';
          break;
        case 'already_marked':
          errorMessage = 'You have already marked attendance for this session.';
          break;
        default:
          errorMessage = err.message || 'Failed to mark attendance. Please try again.';
      }
      
      setError(errorMessage);
      setCode(['', '', '', '', '', '']);
      setValidationStatus('idle');
      document.getElementById('code-0')?.focus();
    }
  });

  const validateCode = async (fullCode) => {
    setValidationStatus('validating');
    
    try {
      const { data: sessions } = await supabase
        .from('attendance_sessions')
        .select(`
          id,
          expires_at,
          is_active,
          courses (
            course_code,
            course_title,
            department,
            level
          )
        `)
        .eq('numeric_code', fullCode)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .limit(1);

      if (sessions?.length) {
        const session = sessions[0];
        const expiryTime = new Date(session.expires_at);
        const now = new Date();
        const timeLeft = Math.round((expiryTime - now) / 60000); // minutes
        
        setSessionInfo({
          courseCode: session.courses.course_code,
          courseTitle: session.courses.course_title,
          department: session.courses.department,
          level: session.courses.level,
          expiresIn: timeLeft > 0 ? `${timeLeft} min` : 'less than a minute'
        });
        setValidationStatus('valid');
        setError('');
      } else {
        setSessionInfo(null);
        setValidationStatus('invalid');
      }
    } catch (err) {
      console.error('Validation error:', err);
      setValidationStatus('idle');
    }
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1 || attendanceMutation.isPending || isSubmitting.current) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    // Rate limiting check
    const now = Date.now();
    if (now - lastSubmissionTime.current > 30000) {
      submissionCount.current = 0;
    }
    
    if (submissionCount.current >= 5) { // Reduced to 5 attempts per minute
      const waitTime = Math.ceil((60000 - (now - lastSubmissionTime.current)) / 1000);
      if (waitTime > 0) {
        setError(`Too many attempts. Please wait ${waitTime} seconds.`);
        return;
      }
    }

    const numericCode = code.join('');
    if (numericCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    submissionCount.current++;
    lastSubmissionTime.current = now;

    // Execute mutation
    attendanceMutation.mutate({
      numericCode,
      location: cachedLocation,
      manualOverride: useManualLocation
    });
  };

  const getLocationDisplay = () => {
    if (locationStatus === 'loading') {
      return { 
        icon: Loader, 
        text: 'Getting location...', 
        className: 'text-amber-600',
        animate: true 
      };
    }
    if (cachedLocation) {
      const accuracy = cachedLocation.accuracy ? Math.round(cachedLocation.accuracy) : 'approx';
      const method = cachedLocation.method === 'gps' ? 'GPS' : 'IP';
      return { 
        icon: CheckCircle, 
        text: `Location ready (${method})`,
        className: 'text-green-600'
      };
    }
    return { 
      icon: MapPin, 
      text: 'Waiting for location...', 
      className: 'text-amber-600' 
    };
  };

  const locationDisplay = getLocationDisplay();
  const LocationIcon = locationDisplay.icon;
  const loading = attendanceMutation.isPending || locationLoading;

  return (
    <Modal isOpen={true} onClose={onClose} title="Enter Attendance Code" size="md">
      <div className="space-y-4 p-1">
        {/* Network Status */}
        <div className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
          navigator.onLine ? 'text-green-600' : 'text-amber-600'
        }`}>
          {navigator.onLine ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
        </div>

        {/* Location Status */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <LocationIcon size={16} className={locationDisplay.animate ? 'animate-spin' : ''} />
          <span>{locationDisplay.text}</span>
        </div>

        {/* Code Input */}
        <div>
          <div className="flex justify-center gap-2">
            {code.map((digit, index) => (
              <input
                key={index}
                id={`code-${index}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-12 text-center text-lg font-medium border rounded-lg outline-none transition-colors ${
                  loading 
                    ? 'bg-gray-50 border-gray-200 text-gray-400' 
                    : validationStatus === 'valid' && code.join('').length === 6
                    ? 'border-green-500 bg-green-50'
                    : validationStatus === 'invalid' && code.join('').length === 6
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-gray-900'
                }`}
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus={index === 0}
                disabled={loading}
              />
            ))}
          </div>

          {/* Session Info Preview */}
          {sessionInfo && validationStatus === 'valid' && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">{sessionInfo.courseCode}</p>
              <p className="text-xs text-green-600 mt-1">{sessionInfo.courseTitle}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-700">
                <Clock size={12} />
                <span>Expires in {sessionInfo.expiresIn}</span>
              </div>
            </div>
          )}

          {validationStatus === 'invalid' && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">Invalid or expired code</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Manual Location Option */}
        {!cachedLocation && locationStatus === 'error' && !useManualLocation && (
          <button
            onClick={() => setUseManualLocation(true)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Continue without location?
          </button>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || code.some(d => !d) || validationStatus === 'invalid'}
            className="flex-1 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              'Submit'
            )}
          </button>
        </div>

        {/* Info */}
        <p className="text-xs text-center text-gray-400">
          Your location will be recorded with your attendance
        </p>
      </div>
    </Modal>
  );
};

export default NumericCodeInput;