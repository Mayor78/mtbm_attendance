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
  const [locationMethod, setLocationMethod] = useState('gps');
  const [ipLocation, setIpLocation] = useState(null);
  const [wifiInfo, setWifiInfo] = useState(null);
  const [useManualLocation, setUseManualLocation] = useState(false);
  
  const isMounted = useRef(true);
  const isSubmitting = useRef(false);
  const timeoutRef = useRef(null);
  
  // Rate limiting refs - moved inside component
  const submissionCount = useRef(0);
  const lastSubmissionTime = useRef(Date.now());

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

  // Get IP-based location as fallback
  const getIpLocation = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      return {
        lat: data.latitude,
        lng: data.longitude,
        accuracy: 5000,
        city: data.city,
        region: data.region,
        country: data.country_name,
        method: 'ip'
      };
    } catch (error) {
      console.error('IP location error:', error);
      return null;
    }
  };

  // Get WiFi info (if available)
  const getWifiInfo = () => {
    if (navigator.connection) {
      return {
        type: navigator.connection.type,
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  };

  // Enhanced location capture
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      getIpLocation().then(ipLoc => {
        if (ipLoc) {
          setIpLocation(ipLoc);
          setLocation(ipLoc);
          setLocationMethod('ip');
          setLocationLoading(false);
        }
      });
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          method: 'gps',
          timestamp: new Date().toISOString()
        });
        setWifiInfo(getWifiInfo());
        setLocationError('');
        setLocationLoading(false);
      },
      (err) => {
        console.warn('GPS error:', err);
        getIpLocation().then(ipLoc => {
          if (ipLoc) {
            setIpLocation(ipLoc);
            setLocation(ipLoc);
            setLocationMethod('ip');
            setLocationError('Using approximate location (GPS unavailable)');
          } else {
            setLocationError('Location unavailable. You can manually confirm your location.');
            setUseManualLocation(true);
          }
          setLocationLoading(false);
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Manual location confirmation
  const confirmManualLocation = () => {
    setUseManualLocation(false);
    setLocation({
      lat: 0,
      lng: 0,
      accuracy: 999999,
      method: 'manual',
      confirmed: true,
      timestamp: new Date().toISOString()
    });
    setLocationError('');
  };

  const handleCodeChange = (index, value) => {
    if (value.length > 1 || loading || isSubmitting.current) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    if (value && index < 5) {
      document.getElementById(`code-${index + 1}`)?.focus();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (newCode.every(d => d !== '') && !isSubmitting.current && !loading) {
      timeoutRef.current = setTimeout(() => {
        if (!isSubmitting.current && isMounted.current && newCode.every(d => d !== '')) {
          handleSubmit();
        }
      }, 500);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      document.getElementById(`code-${index - 1}`)?.focus();
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2 - lat1) * Math.PI/180;
    const Δλ = (lon2 - lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting.current || loading) return;
    
    // Rate limiting - now inside the function where it belongs
    const now = Date.now();
    
    // Reset counter after 30 seconds of inactivity
    if (now - lastSubmissionTime.current > 30000) {
      submissionCount.current = 0;
    }
    
    // Allow up to 10 attempts per minute
    if (submissionCount.current >= 10) {
      const waitTime = Math.ceil((60000 - (now - lastSubmissionTime.current)) / 1000);
      if (waitTime > 0) {
        setError(`Too many attempts. Please wait ${waitTime} seconds.`);
        return;
      } else {
        submissionCount.current = 0;
      }
    }

    submissionCount.current++;
    lastSubmissionTime.current = now;
    
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
        throw new Error('Invalid or expired code');
      }

      const session = sessions[0];

      // Geofencing check
    // In handleSubmit, modify the geofencing check
if (session.allowed_location_lat && session.allowed_location_lng) {
  if (!location) {
    throw new Error('Location required for this session. Please enable GPS.');
  }

  const distance = calculateDistance(
    location.lat,
    location.lng,
    session.allowed_location_lat,
    session.allowed_location_lng
  );

  // Use a dynamic radius based on GPS accuracy
  const baseRadius = session.allowed_radius_meters || 500;
  const accuracyBuffer = Math.max(location.accuracy || 0, session.accuracy || 0) * 1.5;
  const effectiveRadius = baseRadius + accuracyBuffer;
  
  if (distance > effectiveRadius) {
    const distanceInMeters = Math.round(distance);
    throw new Error(
      `You are ${distanceInMeters}m away from the allowed location (within ${Math.round(effectiveRadius)}m allowed). ` +
      `Please ensure you're in the classroom and GPS is accurate.`
    );
  }
}

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

      // Reset rate limit on success
      submissionCount.current = 0;

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
          location ? 'bg-green-50' : useManualLocation ? 'bg-yellow-50' : locationError ? 'bg-red-50' : 'bg-yellow-50'
        }`}>
          {locationLoading ? (
            <>
              <Loader size={20} className="text-yellow-600 mr-2 animate-spin" />
              <span className="text-sm text-yellow-700">Getting location...</span>
            </>
          ) : location ? (
            <>
              <MapPin className="text-green-600 mr-2" size={20} />
              <div className="flex-1">
                <span className="text-sm text-green-700">
                  {location.method === 'gps' ? 'GPS location' : 
                   location.method === 'ip' ? 'Approximate location' : 
                   'Manual confirmation'}
                </span>
                <p className="text-xs text-green-600">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
              </div>
            </>
          ) : useManualLocation ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                <AlertCircle className="text-yellow-600 mr-2" size={20} />
                <span className="text-sm text-yellow-700">Location unavailable</span>
              </div>
              <button
                onClick={confirmManualLocation}
                className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg hover:bg-yellow-200"
              >
                Confirm Manually
              </button>
            </div>
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

        {/* Retry Count (for debugging) */}
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