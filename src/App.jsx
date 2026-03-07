import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
import UserTypePage from './pages/UserTypePage'
import NotFoundPage from './pages/NotFoundPage'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 2,
    },
  },
})

const DashboardRouter = () => {
  const { role } = useAuth()

  if (role === 'student') return <StudentDashboard />
  if (role === 'hoc') return <HocDashboard />
  if (role === 'lecturer') return <LecturerDashboard/>
  if (role === 'admin') return <div>Admin Dashboard (Coming Soon)</div>
  
  return <Navigate to="/select-type" />
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/select-type" element={<UserTypePage/>} />
            <Route path="/login/:userType" element={<LoginPage />} />
            
            {/* Protected Routes */}
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
                <ProtectedRoute allowedRoles={['hoc', 'lecturer', 'admin']}>
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
            
            {/* 404 Route - Catch all unmatched routes */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
            
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App