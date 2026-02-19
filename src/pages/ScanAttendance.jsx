import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import { supabase } from '../lib/supabase'
import { Camera, X, Hash, Wifi, WifiOff } from 'lucide-react'
import jsQR from 'jsqr'

export const ScanAttendance = () => {
  const navigate = useNavigate()
  const { addToQueue, queueLength, processing } = useOfflineQueue()
  const [scanning, setScanning] = useState(false)
  const [mode, setMode] = useState('qr')
  const [numericCode, setNumericCode] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (scanning && mode === 'qr') {
      startCamera()
    }
    return () => {
      stopCamera()
    }
  }, [scanning, mode])

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        requestAnimationFrame(scanQR)
      }
    } catch (err) {
      setError('Could not access camera')
    }
  }

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject
      stream.getTracks().forEach(track => track.stop())
    }
  }

  const scanQR = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight
      canvas.width = video.videoWidth
      context?.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = context?.getImageData(0, 0, canvas.width, canvas.height)
      if (imageData) {
        const code = jsQR(imageData.data, canvas.width, canvas.height)
        if (code) {
          try {
            const data = JSON.parse(code.data)
            if (data.session_id && data.token) {
              handleAttendance(data.session_id, data.token)
            }
          } catch (e) {
            // Not a valid QR code
          }
        }
      }
    }
    requestAnimationFrame(scanQR)
  }

  const handleAttendance = async (sid, token, code) => {
    const scanned_at = new Date().toISOString()
    
    try {
      const { data, error } = await supabase.functions.invoke('mark-attendance', {
        body: {
          session_id: sid,
          token,
          numeric_code: code,
          scanned_at
        }
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      if (!navigator.onLine || err.message?.includes('Failed to fetch')) {
        await addToQueue({
          session_id: sid,
          token,
          numeric_code: code,
          scanned_at
        })
        setSuccess(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } else {
        setError(err.message)
      }
    }
  }

  const handleNumericSubmit = async (e) => {
    e.preventDefault()
    if (!sessionId || !numericCode) {
      setError('Session ID and numeric code are required')
      return
    }
    await handleAttendance(sessionId, null, numericCode)
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Mark Attendance</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <div className={`mb-4 p-3 rounded-lg flex items-center justify-between ${
          navigator.onLine ? 'bg-green-50' : 'bg-yellow-50'
        }`}>
          <div className="flex items-center space-x-2">
            {navigator.onLine ? (
              <>
                <Wifi className="text-green-600" size={20} />
                <span className="text-green-700">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="text-yellow-600" size={20} />
                <span className="text-yellow-700">Offline - Will queue attendance</span>
              </>
            )}
          </div>
          {queueLength > 0 && (
            <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              {queueLength} pending
            </span>
          )}
        </div>

        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setMode('qr')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
              mode === 'qr'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Camera size={20} />
            <span>Scan QR</span>
          </button>
          <button
            onClick={() => setMode('numeric')}
            className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 ${
              mode === 'numeric'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Hash size={20} />
            <span>Numeric Code</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
            Attendance marked successfully! {!navigator.onLine && '(Queued for sync)'}
          </div>
        )}

        {mode === 'qr' ? (
          <div>
            {!scanning ? (
              <button
                onClick={() => setScanning(true)}
                className="w-full btn-primary py-4 flex items-center justify-center space-x-2"
              >
                <Camera size={24} />
                <span>Start Camera</span>
              </button>
            ) : (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg"
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                <button
                  onClick={() => {
                    setScanning(false)
                    stopCamera()
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleNumericSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Session ID
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="input-field"
                placeholder="Enter session ID"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numeric Code
              </label>
              <input
                type="text"
                value={numericCode}
                onChange={(e) => setNumericCode(e.target.value)}
                className="input-field"
                placeholder="Enter 6-digit code"
                maxLength={6}
                pattern="[0-9]{6}"
                required
              />
            </div>
            <button
              type="submit"
              disabled={processing}
              className="w-full btn-primary py-3"
            >
              {processing ? 'Processing...' : 'Submit Attendance'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}