// components/NumericCodeInput.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertCircle, Wifi, WifiOff, MapPin, Loader, CheckCircle } from 'lucide-react';
import { useLocation } from '../../hooks/useLocation';

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
  const [retryCount, setRetryCount] = useState(0);
  const [useManualLocation, setUseManualLocation] = useState(false);
  
  // Use the location hook
  const { 
    getCurrentLocation, 
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

  // Get location display status
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
      const cacheStatus = isCached ? ' (cached)' : '';
      return { 
        icon: CheckCircle, 
        text: `Location ready (${method}, ±${accuracy}m)${cacheStatus}`,
        className: 'text-green-600'
      };
    }
    if (useManualLocation) {
      return {
        icon: AlertCircle,
        text: 'Manual location confirmation needed',
        className: 'text-amber-600'
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

  // Manual location confirmation
  const confirmManualLocation = () => {
    setUseManualLocation(false);
    // Create a manual location object that will bypass geofencing
    const manualLocation = {
      lat: 0,
      lng: 0,
      accuracy: 999999,
      method: 'manual',
      confirmed: true,
      timestamp: new Date().toISOString()
    };
    // You would need to set this in your location hook's cache
    // This is a simplified version - you might need to update your location hook
    setUseManualLocation(false);
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
    
    // Rate limiting
    const now = Date.now();
    
    if (now - lastSubmissionTime.current > 30000) {
      submissionCount.current = 0;
    }
    
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
    
    // Check if we have location
    if (!cachedLocation && locationStatus !== 'loading' && !useManualLocation) {
      setError('Getting location...');
      refreshLocation();
      return;
    }

    if (locationStatus === 'loading') {
      setError('Please wait for location to load');
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

      // Geofencing check (skip if manual location)
    // In handleSubmit function, replace the geofencing section with this:

// Geofencing check - TEMPORARILY DISABLED
// Comment out the entire geofencing check for now
/*
if (!useManualLocation && session.allowed_location_lat && session.allowed_location_lng) {
  if (!cachedLocation) {
    throw new Error('Location required for this session. Please enable GPS.');
  }

  const distance = calculateDistance(
    cachedLocation.lat,
    cachedLocation.lng,
    session.allowed_location_lat,
    session.allowed_location_lng
  );

  // Calculate allowed radius
  const baseRadius = session.allowed_radius_meters || 500;
  const accuracyBuffer = (cachedLocation.accuracy || 20) * 3;
  const walkingBuffer = 150;
  const buildingBuffer = 100;
  
  const allowedRadius = Math.max(
    baseRadius + accuracyBuffer + walkingBuffer + buildingBuffer,
    400
  );
  
  if (distance > allowedRadius) {
    const distanceInMeters = Math.round(distance);
    throw new Error(
      `You are ${distanceInMeters}m away from the classroom (within ${Math.round(allowedRadius)}m allowed). ` +
      `Please move closer or ask your lecturer for manual marking.`
    );
  }
}
*/

// Just log the location but don't enforce
if (cachedLocation) {
  console.log('📍 Location received (geofencing disabled):', {
    lat: cachedLocation.lat,
    lng: cachedLocation.lng,
    accuracy: cachedLocation.accuracy
  });
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

      // Check if the RPC function exists, otherwise use direct insert
      let result;
      try {
        // Try to use RPC first
        const { data: rpcResult, error: rpcError } = await supabase
          .rpc('mark_attendance', {
            p_session_id: session.id,
            p_student_id: student.id,
            p_location_lat: cachedLocation?.lat,
            p_location_lng: cachedLocation?.lng,
            p_location_accuracy: cachedLocation?.accuracy,
            p_device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              timestamp: new Date().toISOString(),
              locationMethod: cachedLocation?.method,
              isCached,
              manualOverride: useManualLocation
            }
          });

        if (rpcError) throw rpcError;
        result = rpcResult;
      } catch (rpcErr) {
        // Fallback to direct insert if RPC doesn't exist
        console.log('RPC failed, using direct insert:', rpcErr);
        const { data: insertData, error: insertError } = await supabase
          .from('attendance_records')
          .insert({
            session_id: session.id,
            student_id: student.id,
            scanned_at: new Date().toISOString(),
            location_lat: cachedLocation?.lat,
            location_lng: cachedLocation?.lng,
            location_accuracy: cachedLocation?.accuracy,
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              timestamp: new Date().toISOString(),
              locationMethod: cachedLocation?.method,
              isCached,
              manualOverride: useManualLocation
            }
          });

        if (insertError) throw insertError;
        result = { success: true };
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
        disabled={loading || code.some(d => !d) || (locationStatus === 'loading' && !useManualLocation)}
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
          locationStatus === 'loading' ? 'bg-amber-50' :
          cachedLocation ? 'bg-green-50' :
          useManualLocation ? 'bg-amber-50' :
          'bg-gray-50'
        }`}>
          <LocationIcon 
            size={20} 
            className={`${locationDisplay.className} mr-2 ${locationDisplay.animate ? 'animate-spin' : ''}`} 
          />
          <div className="flex-1">
            <span className={`text-sm ${locationDisplay.className}`}>
              {locationDisplay.text}
            </span>
            {cachedLocation && cachedLocation.accuracy && (
              <p className="text-xs text-green-600">
                Accuracy: ±{Math.round(cachedLocation.accuracy)}m
              </p>
            )}
          </div>
          {!cachedLocation && locationStatus === 'error' && !useManualLocation && (
            <button
              onClick={() => setUseManualLocation(true)}
              className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-lg hover:bg-amber-200 ml-2"
            >
              Use Manual
            </button>
          )}
          {useManualLocation && (
            <button
              onClick={confirmManualLocation}
              className="text-xs bg-amber-100 text-amber-700 px-3 py-1 rounded-lg hover:bg-amber-200 ml-2"
            >
              Confirm
            </button>
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