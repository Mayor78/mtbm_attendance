import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'


export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, role, loading } = useAuth()

  // Add console logs to debug
//   console.log('ProtectedRoute - loading:', loading)
//   console.log('ProtectedRoute - user:', user)
//   console.log('ProtectedRoute - role:', role)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    console.log('No user, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // If we have allowedRoles and role exists, check if role is allowed
  if (allowedRoles.length > 0) {
    if (!role) {
      console.log('No role found, redirecting to dashboard')
      return <Navigate to="/dashboard" replace />
    }
    if (!allowedRoles.includes(role)) {
      console.log(`Role ${role} not allowed, redirecting to dashboard`)
      return <Navigate to="/dashboard" replace />
    }
  }

  return <>{children}</>
}