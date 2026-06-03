'use client'

import { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  deleteNotification: (id: string) => Promise<void>
  deleteAllNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  loadMoreNotifications: () => Promise<void>
  hasMore: boolean
  isLoadingMore: boolean
  playSound: () => void
  unlockAudio: () => void
  error: string | null
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
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const isSubscribedRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUnlockedRef = useRef(false)
  const supabase = useMemo(() => createClient(), [])

  // Inicializar audio y desbloquear con primer click
  useEffect(() => {
    // Crear instancia única de Audio
    audioRef.current = new Audio('/sounds/notification.mp3')
    audioRef.current.volume = 1
    
    // Desbloquear audio con primer click/touchstart
    function unlockAudioOnInteraction() {
      if (!audioUnlockedRef.current && audioRef.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current!.pause()
            audioRef.current!.currentTime = 0
            audioRef.current!.volume = 1
            audioUnlockedRef.current = true
          })
          .catch(() => {
            audioUnlockedRef.current = true
          })
        
        document.removeEventListener('click', unlockAudioOnInteraction)
        document.removeEventListener('touchstart', unlockAudioOnInteraction)
      }
    }
    
    document.addEventListener('click', unlockAudioOnInteraction)
    document.addEventListener('touchstart', unlockAudioOnInteraction)
    
    return () => {
      document.removeEventListener('click', unlockAudioOnInteraction)
      document.removeEventListener('touchstart', unlockAudioOnInteraction)
    }
  }, [])

  useEffect(() => {
    if (!userId || isSubscribedRef.current) return

    async function init() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      if (data) {
        setNotifications(data)
        setHasMore(data.length === 10)
      }

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
            isSubscribedRef.current = false
          } else if (status === 'CLOSED') {
            isSubscribedRef.current = false
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
    // Ya no es necesario - se desbloquea automáticamente con el primer click
  }

  function playSound() {
    if (!audioUnlockedRef.current || !audioRef.current) return
    
    audioRef.current.currentTime = 0
    audioRef.current.play().catch(() => {})
  }

  async function deleteNotification(id: string) {
    // Optimistic update
    const prevNotifications = notifications
    setNotifications(prev => prev.filter(n => n.id !== id))
    setError(null)

    // Realizar la operación
    const { error: deleteError } = await supabase.from('notifications').delete().eq('id', id)
    
    if (deleteError) {
      // Rollback en caso de error
      setNotifications(prevNotifications)
      setError('Error al eliminar notificación')
      console.error('[deleteNotification] Error:', deleteError)
    }
  }

  async function deleteAllNotifications() {
    if (!userId) return
    
    const prevNotifications = notifications
    setNotifications([])
    setError(null)

    const { error: deleteError } = await supabase.from('notifications').delete().eq('user_id', userId)
    
    if (deleteError) {
      setNotifications(prevNotifications)
      setError('Error al eliminar notificaciones')
      console.error('[deleteAllNotifications] Error:', deleteError)
    }
  }

  async function markAsRead(id: string) {
    // Optimistic update
    const prevNotifications = notifications
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setError(null)

    const { error: updateError } = await supabase.from('notifications').update({ read: true }).eq('id', id)
    
    if (updateError) {
      // Rollback en caso de error
      setNotifications(prevNotifications)
      setError('Error al marcar como leída')
      console.error('[markAsRead] Error:', updateError)
    }
  }

  async function markAllAsRead() {
    const unread = notifications.filter(n => !n.read)
    if (unread.length > 0) {
      await supabase.from('notifications').update({ read: true }).in('id', unread.map(n => n.id))
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    }
  }

  async function loadMoreNotifications() {
    if (!userId || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setError(null)

    const { data, error: loadError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(notifications.length, notifications.length + 9)

    if (loadError) {
      setError('Error al cargar más notificaciones')
      console.error('[loadMoreNotifications] Error:', loadError)
    } else if (data) {
      setNotifications(prev => [...prev, ...data])
      setHasMore(data.length === 10)
    }

    setIsLoadingMore(false)
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const value = {
    notifications,
    unreadCount,
    deleteNotification,
    deleteAllNotifications,
    markAsRead,
    markAllAsRead,
    loadMoreNotifications,
    hasMore,
    isLoadingMore,
    playSound,
    unlockAudio,
    error,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
