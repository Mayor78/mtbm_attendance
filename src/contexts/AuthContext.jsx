import React, { createContext, useContext, useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [student, setStudent] = useState(null)
  const [lecturer, setLecturer] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Cache refs to store data and timestamps
  const cache = useRef({
    profile: { data: null, timestamp: 0 },
    student: { data: null, timestamp: 0 },
    lecturer: { data: null, timestamp: 0 }
  })

  const isCacheValid = (type) => {
    const item = cache.current[type]
    return item.data && (Date.now() - item.timestamp) < CACHE_TTL
  }

  const fetchProfile = async (userId, retryCount = 0) => {
    try {
      // Check cache first
      if (isCacheValid('profile') && cache.current.profile.data?.id === userId) {
        console.log('📦 Using cached profile')
        const cachedProfile = cache.current.profile.data
        setProfile(cachedProfile)
        setRole(cachedProfile.role)
        
        // Fetch role-specific data based on cached role
        if (cachedProfile.role === 'student') {
          await fetchStudent(userId, true)
        } else if (cachedProfile.role === 'lecturer') {
          await fetchLecturer(userId, true)
        } else {
          setLoading(false)
        }
        return
      }

      console.log('🌐 Fetching profile from DB')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Profile fetch error:', error)
        if (retryCount < 3) {
          setTimeout(() => fetchProfile(userId, retryCount + 1), 1000)
          return
        }
        setProfile(null)
        setRole(null)
        setLoading(false)
        return
      }

      if (data) {
        // Update cache
        cache.current.profile = {
          data,
          timestamp: Date.now()
        }
        
        setProfile(data)
        setRole(data.role)
        
        // Fetch role-specific data
        if (data.role === 'student') {
          await fetchStudent(userId)
        } else if (data.role === 'lecturer') {
          await fetchLecturer(userId)
        } else {
          setLoading(false)
        }
      } else {
        setProfile(null)
        setRole(null)
        setLoading(false)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setProfile(null)
      setRole(null)
      setLoading(false)
    }
  }

  const fetchStudent = async (userId, fromCache = false) => {
    try {
      // Check cache first
      if (!fromCache && isCacheValid('student') && cache.current.student.data?.user_id === userId) {
        console.log('📦 Using cached student')
        setStudent(cache.current.student.data)
        setLoading(false)
        return
      }

      console.log('🌐 Fetching student from DB')
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching student:', error)
        setStudent(null)
      } else if (data) {
        // Update cache
        cache.current.student = {
          data,
          timestamp: Date.now()
        }
        setStudent(data)
      } else {
        setStudent(null)
      }
    } catch (error) {
      console.error('Error in fetchStudent:', error)
      setStudent(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchLecturer = async (userId, fromCache = false) => {
    try {
      // Check cache first
      if (!fromCache && isCacheValid('lecturer') && cache.current.lecturer.data?.user_id === userId) {
        console.log('📦 Using cached lecturer')
        setLecturer(cache.current.lecturer.data)
        setLoading(false)
        return
      }

      console.log('🌐 Fetching lecturer from DB')
      const { data, error } = await supabase
        .from('lecturers')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching lecturer:', error)
        setLecturer(null)
      } else if (data) {
        // Update cache
        cache.current.lecturer = {
          data,
          timestamp: Date.now()
        }
        setLecturer(data)
      } else {
        setLecturer(null)
      }
    } catch (error) {
      console.error('Error in fetchLecturer:', error)
      setLecturer(null)
    } finally {
      setLoading(false)
    }
  }

  // Function to manually invalidate cache
  const invalidateCache = (type) => {
    if (type) {
      cache.current[type] = { data: null, timestamp: 0 }
    } else {
      cache.current = {
        profile: { data: null, timestamp: 0 },
        student: { data: null, timestamp: 0 },
        lecturer: { data: null, timestamp: 0 }
      }
    }
  }

  // Function to refresh data
  const refreshData = async () => {
    if (!user) return
    
    invalidateCache('profile')
    invalidateCache('student')
    invalidateCache('lecturer')
    await fetchProfile(user.id)
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setLoading(false)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) setLoading(false)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session)
      
      if (!mounted) return
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        if (event === 'SIGNED_IN') {
          invalidateCache()
          setTimeout(async () => {
            if (mounted) await fetchProfile(session.user.id)
          }, 1500)
        } else if (event === 'TOKEN_REFRESHED') {
          if (isCacheValid('profile')) {
            setProfile(cache.current.profile.data)
            setRole(cache.current.profile.data?.role)
            
            if (cache.current.profile.data?.role === 'student' && isCacheValid('student')) {
              setStudent(cache.current.student.data)
              setLoading(false)
            } else if (cache.current.profile.data?.role === 'lecturer' && isCacheValid('lecturer')) {
              setLecturer(cache.current.lecturer.data)
              setLoading(false)
            } else {
              setLoading(false)
            }
          } else {
            await fetchProfile(session.user.id)
          }
        } else {
          await fetchProfile(session.user.id)
        }
      } else {
        setProfile(null)
        setStudent(null)
        setLecturer(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (error) {
      setLoading(false)
      throw error
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      invalidateCache()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      student,
      lecturer, 
      role, 
      loading, 
      signIn, 
      signOut,
      refreshData,
      invalidateCache
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}