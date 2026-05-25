'use client'

import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  deleteNotification: (id: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  playSound: () => void
  unlockAudio: () => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications debe usarse dentro de NotificationProvider')
  }
  return context
}

export default function NotificationProvider({
  userId,
  children,
}: {
  userId: string | null
  children: React.ReactNode
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [audioEnabled, setAudioEnabled] = useState(false)
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!userId || isSubscribedRef.current) return

    async function init() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) setNotifications(data)

      // Suscripción Realtime
      const channelName = `unique-notifs-${userId}`
      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification
            setNotifications(prev => [newNotif, ...prev])
            playSound()
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribedRef.current = true
            channelRef.current = channel
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`❌ [Realtime] Error: ${status}`)
          }
        })
    }

    init()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        isSubscribedRef.current = false
      }
    }
  }, [userId, supabase])

  function unlockAudio() {
    if (!audioEnabled) {
      const audioEl = document.getElementById('notification-sound') as HTMLAudioElement
      if (audioEl) {
        audioEl.volume = 0.5
        audioEl.play().then(() => {
          audioEl.pause()
          audioEl.currentTime = 0
          setAudioEnabled(true)
        }).catch(() => {
          setAudioEnabled(true)
        })
      }
    }
  }

  function playSound() {
    if (!audioEnabled) return
    const audioEl = document.getElementById('notification-sound') as HTMLAudioElement
    if (!audioEl) return
    audioEl.volume = 0.5
    audioEl.currentTime = 0
    audioEl.play().catch(() => {})
  }

  async function deleteNotification(id: string) {
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function deleteAllNotifications() {
    if (!userId) return
    await supabase.from('notifications').delete().eq('user_id', userId)
    setNotifications([])
  }

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function markAllAsRead() {
    const unread = notifications.filter(n => !n.read)
    if (unread.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unread.map(n => n.id))
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value = {
    notifications,
    unreadCount,
    deleteNotification,
    deleteAllNotifications,
    markAsRead,
    markAllAsRead,
    playSound,
    unlockAudio,
  }

  return (
    <NotificationContext.Provider value={value}>
      <audio id="notification-sound" preload="auto" className="hidden">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
      </audio>
      {children}
    </NotificationContext.Provider>
  )
}
