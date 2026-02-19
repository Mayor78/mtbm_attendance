import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useOfflineQueue } from '../hooks/useOfflineQueue'
import { QrCode, Hash, History, WifiOff, CheckCircle, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

export const StudentPage = () => {
  const { user } = useAuth()
  const { queueLength, processing } = useOfflineQueue()
  const [courses, setCourses] = useState([])
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeSessions, setActiveSessions] = useState({})

  useEffect(() => {
    fetchCourses()
    fetchRecentAttendance()
  }, [])

  const fetchCourses = async () => {
    const { data, error } = await supabase.functions.invoke('courses')
    if (!error && data) {
      setCourses(data.courses)
      checkActiveSessions(data.courses)
    }
    setLoading(false)
  }

  const fetchRecentAttendance = async () => {
    const { data } = await supabase
      .from('attendance_records')
      .select(`
        id,
        scanned_at,
        attendance_sessions (
          course_id,
          courses (
            course_code,
            course_title
          )
        )
      `)
      .order('scanned_at', { ascending: false })
      .limit(5)

    if (data) {
      setRecentAttendance(data)
    }
  }

  const checkActiveSessions = async (coursesList) => {
    const sessions = {}
    
    for (const course of coursesList) {
      const { data } = await supabase.functions.invoke('get-active-session', {
        body: { course_id: course.id }
      })
      if (data?.active) {
        sessions[course.id] = true
      }
    }
    
    setActiveSessions(sessions)
  }

  return (
    <div className="space-y-6">
      {queueLength > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <WifiOff className="text-yellow-600" size={20} />
              <span className="text-yellow-800">
                You have {queueLength} attendance record{queueLength > 1 ? 's' : ''} waiting to sync
              </span>
            </div>
            {processing && (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                <span className="text-sm text-yellow-600">Syncing...</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/scan"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <QrCode className="text-primary-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Scan QR Code</h3>
              <p className="text-gray-500 text-sm">Mark your attendance by scanning QR</p>
            </div>
          </div>
        </Link>

        <Link
          to="/numeric-code"
          className="card hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Hash className="text-green-600" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Enter Numeric Code</h3>
              <p className="text-gray-500 text-sm">Use backup code to mark attendance</p>
            </div>
          </div>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">My Courses</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{course.course_code}</h3>
                    <p className="text-sm text-gray-600">{course.course_title}</p>
                    <p className="text-xs text-gray-500 mt-1">{course.department}</p>
                  </div>
                  {activeSessions[course.id] && (
                    <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full flex items-center">
                      <Clock size={12} className="mr-1" />
                      Active
                    </span>
                  )}
                </div>
                <Link
                  to={`/course/${course.id}`}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium inline-block"
                >
                  View History →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Attendance</h2>
        {recentAttendance.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No attendance records yet</p>
        ) : (
          <div className="space-y-3">
            {recentAttendance.map((record) => (
              <div key={record.id} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <div>
                    <p className="font-medium">
                      {record.attendance_sessions.courses.course_code}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.scanned_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}