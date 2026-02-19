import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Camera, AlertCircle, Wifi, WifiOff, X, Loader2 } from 'lucide-react';
import jsQR from 'jsqr';
import Button from '../common/Button';

const QRScanner = ({ onClose, onSuccess, onError }) => {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const requestRef = useRef(null);
  const scanIntervalRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      try {
        // First stop any existing streams
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          
          // Wait for video to be ready before playing
          videoRef.current.onloadedmetadata = () => {
            if (mounted) {
              videoRef.current.play()
                .then(() => {
                  setCameraReady(true);
                  startScanning();
                })
                .catch(err => {
                  console.error('Play error:', err);
                  setError('Failed to start camera. Please try again.');
                });
            }
          };
        }
      } catch (err) {
        console.error('Camera error:', err);
        if (mounted) {
          setError('Please enable camera access in your browser settings.');
        }
      }
    };

    initCamera();

    return () => {
      mounted = false;
      stopCamera();
    };
  }, []);

  const startScanning = () => {
    // Clear any existing intervals
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }

    // Use interval instead of animation frame for better performance
    scanIntervalRef.current = setInterval(() => {
      if (!cameraReady || !scanning || processing) return;
      scanQR();
    }, 500); // Scan every 500ms
  };

  const stopCamera = () => {
    setCameraReady(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const scanQR = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      
      // Set canvas dimensions to match video
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, canvas.width, canvas.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code) {
        try {
          const data = JSON.parse(code.data);
          if (data.session_id) {
            handleAttendance(data.session_id);
          }
        } catch (e) {
          // Fallback if the QR is just a raw UUID string
          if (code.data.length > 20) {
            handleAttendance(code.data);
          }
        }
      }
    }
  };

  const handleAttendance = async (sessionId) => {
    setProcessing(true);
    setScanning(false);
    
    try {
      // 1. Get Student Reference
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) throw new Error('Student profile not found');

      // 2. Insert Attendance
      const { error: insertError } = await supabase
        .from('attendance_records')
        .insert({
          session_id: sessionId,
          student_id: student.id,
          status: 'present',
          scanned_at: new Date().toISOString()
        });

      if (insertError) {
        if (insertError.code === '23505') throw new Error('Attendance already marked for this class.');
        throw insertError;
      }

      onSuccess('Check-in successful! ⚓');
      stopCamera();
      onClose();
    } catch (err) {
      setError(err.message);
      setProcessing(false);
      setScanning(true); // Allow retry
    }
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-6 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">FCFMT Scanner</h3>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-0.5">Check-in Terminal</p>
          </div>
          <button onClick={handleClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-8 space-y-6">
          {/* Viewport */}
          <div className="relative aspect-square rounded-[2rem] bg-slate-800 overflow-hidden shadow-inner group">
            {!cameraReady && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                <Loader2 className="animate-spin text-white" size={40} />
              </div>
            )}
            
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning UI Overlay */}
            {cameraReady && !processing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-48 h-48 sm:w-64 sm:h-64">
                  {/* Corner Borders */}
                  <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-2xl shadow-glow"></div>
                  <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-2xl shadow-glow"></div>
                  <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-2xl shadow-glow"></div>
                  <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-2xl shadow-glow"></div>
                  
                  {/* Animated Scan Line */}
                  <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
                </div>
              </div>
            )}

            {/* Processing State */}
            {processing && (
              <div className="absolute inset-0 bg-blue-700/40 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <Loader2 className="animate-spin mb-3" size={40} />
                <p className="font-bold text-sm uppercase tracking-widest">Validating...</p>
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="space-y-3">
            <div className={`flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-colors ${
              navigator.onLine ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
            }`}>
              {navigator.onLine ? <Wifi size={14} /> : <WifiOff size={14} />}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {navigator.onLine ? 'Server Connection Active' : 'Offline Mode Enabled'}
              </span>
            </div>

            {error && (
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-xs font-bold text-rose-700 leading-relaxed">{error}</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
          <Button variant="secondary" fullWidth onClick={handleClose} className="rounded-2xl font-bold py-4">
            Close Terminal
          </Button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;