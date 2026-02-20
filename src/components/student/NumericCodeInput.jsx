import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { AlertCircle, Wifi, WifiOff, MapPin, MapPinOff, Loader } from 'lucide-react';

const NumericCodeInput = ({ onClose, onSuccess, onError }) => {
  const { user } = useAuth();
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationLoading, setLocationLoading] = useState(true);
  
  const isMounted = useRef(true);
  const isSubmitting = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    
    // Get user's location when component mounts
    getCurrentLocation();
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setLocationLoading(false);
      return;
    }

    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (isMounted.current) {
          const locationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString()
          };
          setLocation(locationData);
          setLocationError('');
          setLocationLoading(false);
          
          console.log('📍 Location captured:', locationData);
        }
      },
      (error) => {
        if (isMounted.current) {
          let message = 'Location access denied';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = 'Location permission denied. Please enable location services to mark attendance.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Location information unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              message = 'Location request timed out. Please try again.';
              break;
          }
          setLocationError(message);
          setLocationLoading(false);
          console.error('Location error:', error);
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
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    if (index === 5 && value && newCode.every(d => d) && !isSubmitting.current) {
      setTimeout(() => {
        if (!isSubmitting.current && isMounted.current) {
          handleSubmit();
        }
      }, 100);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting.current || loading) return;
    
    if (!location && !locationError) {
      setError('Still getting your location. Please wait a moment.');
      return;
    }

    const numericCode = code.join('');
    if (numericCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    isSubmitting.current = true;
    setLoading(true);
    setError('');

    try {
      console.log('Looking for session with numeric code:', numericCode);

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

      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw new Error('Student record not found');

      const { data: existing, error: existingError } = await supabase
        .from('attendance_records')
        .select('id')
        .eq('session_id', session.id)
        .eq('student_id', student.id)
        .maybeSingle();

      if (existing) {
        throw new Error('You have already marked attendance for this session');
      }

      // Prepare device info
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        vendor: navigator.vendor,
        timestamp: new Date().toISOString()
      };

      console.log('Submitting attendance with location:', location);
      console.log('Device info:', deviceInfo);

      // Submit attendance WITH location data
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: student.id,
          scanned_at: new Date().toISOString(),
          location_lat: location?.lat,
          location_lng: location?.lng,
          location_accuracy: location?.accuracy,
          device_info: deviceInfo
        });

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('✅ Attendance recorded successfully with location');

      if (isMounted.current) {
        onSuccess(`Attendance marked for ${session.courses?.course_code}!`);
        setTimeout(() => {
          if (isMounted.current) {
            onClose();
          }
        }, 500);
      }
    } catch (err) {
      console.error('Attendance error:', err);
      if (isMounted.current) {
        setError(err.message);
        setCode(['', '', '', '', '', '']);
        setTimeout(() => {
          if (isMounted.current) {
            document.getElementById('code-0')?.focus();
          }
        }, 100);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
      isSubmitting.current = false;
    }
  };

  const handleCancel = () => {
    if (loading) return;
    isMounted.current = false;
    onClose();
  };

  const customActions = (
    <div className="flex justify-end gap-3 w-full">
      <Button 
        variant="secondary" 
        onClick={handleCancel}
        disabled={loading}
      >
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
    <Modal isOpen={true} onClose={handleCancel} title="Enter Numeric Code" size="md" actions={customActions}>
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
              <span className="text-sm text-yellow-700">Getting your location...</span>
            </>
          ) : location ? (
            <>
              <MapPin className="text-green-600 mr-2" size={20} />
              <div className="flex-1">
                <span className="text-sm text-green-700">Location captured</span>
                <p className="text-xs text-green-600">
                  Accuracy: ±{Math.round(location.accuracy)}m
                </p>
              </div>
            </>
          ) : (
            <>
              <MapPinOff className="text-red-600 mr-2" size={20} />
              <span className="text-sm text-red-700">{locationError || 'Location unavailable'}</span>
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

        {/* Anti-cheating Info */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-xs text-blue-700 flex items-start">
            <MapPin size={14} className="mr-1 mt-0.5 flex-shrink-0" />
            <span>
              Your location is recorded with each attendance to prevent cheating.
              {!location && !locationError && ' Please allow location access.'}
            </span>
          </p>
        </div>

        {/* Help Text */}
        <p className="text-xs text-center text-gray-500">
          Ask your HOC for the 6-digit numeric code
        </p>
      </div>
    </Modal>
  );
};

export default NumericCodeInput;