import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export const useOfflineQueue = () => {
  const [queue, setQueue] = useState([])
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('attendance_queue')
    if (saved) {
      setQueue(JSON.parse(saved))
    }

    window.addEventListener('online', processQueue)

    return () => {
      window.removeEventListener('online', processQueue)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('attendance_queue', JSON.stringify(queue))
  }, [queue])

  const addToQueue = async (attendanceData) => {
    const newItem = {
      ...attendanceData,
      id: crypto.randomUUID(),
      attempts: 0
    }
    
    setQueue(prev => [...prev, newItem])
    
    if (navigator.onLine) {
      await processQueue()
    }
    
    return newItem
  }

  const processQueue = async () => {
    if (processing || queue.length === 0 || !navigator.onLine) return

    setProcessing(true)
    
    for (const item of [...queue]) {
      try {
        const { error } = await supabase.functions.invoke('mark-attendance', {
          body: {
            session_id: item.session_id,
            token: item.token,
            numeric_code: item.numeric_code,
            scanned_at: item.scanned_at
          }
        })

        if (error) throw error

        setQueue(prev => prev.filter(q => q.id !== item.id))
        
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Attendance Marked', {
            body: 'Your attendance has been recorded successfully'
          })
        }
      } catch (error) {
        console.error('Failed to process attendance:', error)
        
        setQueue(prev => 
          prev.map(q => 
            q.id === item.id 
              ? { ...q, attempts: q.attempts + 1 } 
              : q
          )
        )
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    setProcessing(false)
  }

  useEffect(() => {
    if (navigator.onLine) {
      processQueue()
    }
  }, [navigator.onLine])

  return {
    queue,
    queueLength: queue.length,
    addToQueue,
    processQueue,
    processing
  }
}