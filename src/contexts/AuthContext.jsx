import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId, retryCount = 0) => {
    try {
      // console.log('Fetching profile for user:', userId)
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        // console.error('Error fetching profile:', error)
        if (retryCount < 3) {
          // Retry after 1 second
          setTimeout(() => fetchProfile(userId, retryCount + 1), 1000)
          return
        }
        setProfile(null)
        setRole(null)
      } else if (data) {
        // console.log('Profile found:', data)
        setProfile(data)
        setRole(data.role)
      } else {
        // console.log('No profile found for user:', userId)
        setProfile(null)
        setRole(null)
      }
    } catch (error) {
      console.error('Error in fetchProfile:', error)
      setProfile(null)
      setRole(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // console.log('Initial session:', session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        if (event === 'SIGNED_IN') {
          // For new sign-ins, wait a bit for trigger
          setTimeout(() => {
            fetchProfile(session.user.id)
          }, 1500)
        } else {
          fetchProfile(session.user.id)
        }
      } else {
        setProfile(null)
        setRole(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
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
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, role, loading, signIn, signOut }}>
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