'use client'

import { useEffect, useState, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, Profile } from '@/lib/types'
import { Bell, Trash2 } from 'lucide-react'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const channelRef = useRef<any>(null)
  const isSubscribedRef = useRef(false)
  
  // Cliente estable de Supabase (no cambia en cada render)
  const supabase = useMemo(() => createClient(), [])

  // Pre-desbloquear audio en el primer clic del usuario
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

  // Cargar notificaciones y suscribirse UNA SOLA VEZ
  useEffect(() => {
    if (!userId || isSubscribedRef.current) return
    
    async function init() {
      await loadNotifications()
      await subscribeToNotifications()
    }

    init()

    // Cerrar dropdown al hacer clic fuera
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    // Desbloquear audio en el primer clic del usuario
    function handleFirstClick() {
      unlockAudio()
      document.removeEventListener('click', handleFirstClick)
    }
    document.addEventListener('click', handleFirstClick)

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        isSubscribedRef.current = false
      }
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('click', handleFirstClick)
    }
  }, [userId, supabase])

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setNotifications(data)
  }

  async function subscribeToNotifications() {
    if (isSubscribedRef.current) return
    
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
          playNotificationSound()
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

  function playNotificationSound() {
    if (!audioEnabled) return
    
    const audioEl = document.getElementById('notification-sound') as HTMLAudioElement
    if (!audioEl) return

    audioEl.volume = 0.5
    audioEl.currentTime = 0
    audioEl.play().catch(() => {})
  }

  async function deleteNotification(notifId: string, e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation()
    }
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notifId)
    
    setNotifications((prev) => prev.filter((n) => n.id !== notifId))
  }

  async function deleteAllNotifications() {
    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
    
    setNotifications([])
  }

  async function markAsRead(notifId: string) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notifId)
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    )
  }

  async function handleNotificationClick(notif: Notification) {
    if (!notif.read) {
      await markAsRead(notif.id)
    }
    if (notif.link) {
      window.location.href = notif.link
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const notificationTypeStyles = {
    info: 'border-l-4 border-blue-400',
    success: 'border-l-4 border-fifaGreen',
    warning: 'border-l-4 border-yellow-500',
    error: 'border-l-4 border-danger',
    match_update: 'border-l-4 border-fifaGreen',
    ranking_update: 'border-l-4 border-yellow-400',
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Elemento de audio oculto con pre-carga */}
      <audio id="notification-sound" preload="auto" className="hidden">
        <source src="/sounds/notification.mp3" type="audio/mpeg" />
      </audio>

      <button
        onClick={() => {
          setShowDropdown(!showDropdown)
          unlockAudio()
        }}
        className="relative p-2 text-white/60 hover:text-white transition-colors"
        aria-label="Notificaciones"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-screen max-w-[calc(100vw-2rem)] sm:w-80 sm:max-w-sm bg-[#0f1437] border border-white/10 rounded-lg shadow-2xl overflow-hidden z-50">
          <div className="bg-[#080b22] px-4 py-3 border-b border-white/15">
            <h3 className="font-bold text-white uppercase tracking-wider text-sm">
              Notificaciones
            </h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-white/40 text-sm">
                No hay notificaciones
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`relative group border-b border-white/10 transition-colors ${
                    !notif.read ? 'bg-[#1a2050]' : 'bg-transparent hover:bg-white/5'
                  } ${notificationTypeStyles[notif.type]}`}
                >
                  <button
                    onClick={() => handleNotificationClick(notif)}
                    className="w-full text-left p-3 pr-10"
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-white text-sm">{notif.title}</h4>
                        <p className="text-xs text-white/70 mt-1">{notif.message}</p>
                        <p className="text-xs text-white/40 mt-1">
                          {new Date(notif.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2.5 h-2.5 bg-fifaGreen rounded-full flex-shrink-0 mt-1 shadow-lg shadow-fifaGreen/50" />
                      )}
                    </div>
                  </button>
                  
                  {/* Botón de borrado individual */}
                  <button
                    onClick={(e) => deleteNotification(notif.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-danger hover:bg-danger/10 rounded transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Eliminar notificación"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="bg-[#080b22] px-4 py-2 border-t border-white/15 flex items-center justify-between gap-2">
              <button
                onClick={async () => {
                  const unread = notifications.filter((n) => !n.read)
                  if (unread.length > 0) {
                    await supabase
                      .from('notifications')
                      .update({ read: true })
                      .in('id', unread.map((n) => n.id))
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
                  }
                }}
                className="text-xs text-fifaGreen hover:text-fifaGreen/80 font-bold uppercase tracking-wider transition-colors"
              >
                Marcar leídas
              </button>
              
              <button
                onClick={deleteAllNotifications}
                className="text-xs text-danger hover:text-danger/80 font-bold uppercase tracking-wider transition-colors"
              >
                Limpiar todo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
