import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'





import { ScanAttendance } from './pages/ScanAttendance'
import { Layout } from './components/common/layouts/Layout'
import StudentDashboard from './components/student/StudentDashboard'
import { ProtectedRoute } from './components/common/layouts/ProtectedRoute'


import HocDashboard from './components/lecturer/HocDashboard'
import { CourseAttendance } from './pages/CourseAttendance'
import StudentProfile from './pages/StudentProfile'
import LoginPage from './pages/LoginPage'
import { LecturerDashboard } from './pages/LecturerDashboard'


const DashboardRouter = () => {
  const { role } = useAuth()

  if (role === 'student') return <StudentDashboard />
//   if (role === 'lecturer') return <LecturerDashboard />
  if (role === 'hoc') return <HocDashboard /> // HOC uses same dashboard as lecturer
   if (role === 'lecturer') return <LecturerDashboard/>
  if (role === 'admin') return <div>Admin Dashboard (Coming Soon)</div>
  
  return <Navigate to="/login" />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <DashboardRouter />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <DashboardRouter />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/scan" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <ScanAttendance />
              </Layout>
            </ProtectedRoute>
          } />
          
          <Route path="/numeric-code" element={
            <ProtectedRoute allowedRoles={['student']}>
              <Layout>
                <ScanAttendance />
              </Layout>
            </ProtectedRoute>
          } />
          <Route 
  path="/course/:courseId/attendance" 
  element={
    <ProtectedRoute allowedRoles={['hoc', 'admin']}>
      <Layout>
        <CourseAttendance />
      </Layout>
    </ProtectedRoute>
  } 
/>
<Route 
  path="/profile" 
  element={
    <ProtectedRoute>
      <Layout>
        <StudentProfile />
      </Layout>
    </ProtectedRoute>
  } 
/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App