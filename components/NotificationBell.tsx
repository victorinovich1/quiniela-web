'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, Profile } from '@/lib/types'
import { Bell } from 'lucide-react'

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  const supabase = createClient()

  // Cargar notificaciones y perfil
  useEffect(() => {
    async function init() {
      await loadNotifications()
      await loadProfile()
      subscribeToNotifications()
    }

    init()

    // Crear audio element
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3')
      audioRef.current.volume = 0.5
    }

    // Cerrar dropdown al hacer clic fuera
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  async function loadNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (data) setNotifications(data)
  }

  function subscribeToNotifications() {
    const channel = supabase
      .channel('notifications')
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
          setNotifications((prev) => [newNotif, ...prev.slice(0, 9)])
          
          // Reproducir sonido si está habilitado
          if (profile?.notifications_enabled && profile?.notifications_sound && audioEnabled) {
            audioRef.current?.play().catch(() => {
              // Autoplay bloqueado, ignorar silenciosamente
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
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

  function enableAudio() {
    setAudioEnabled(true)
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  const notificationTypeStyles = {
    info: 'bg-navy-medium/40 border-l-4 border-blue-400',
    success: 'bg-navy-medium/40 border-l-4 border-fifaGreen',
    warning: 'bg-navy-medium/40 border-l-4 border-yellow-500',
    error: 'bg-navy-medium/40 border-l-4 border-danger',
    match_update: 'bg-navy-medium/40 border-l-4 border-fifaGreen',
    ranking_update: 'bg-navy-medium/40 border-l-4 border-yellow-400',
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown(!showDropdown)
          enableAudio()
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
        <div className="absolute right-0 mt-2 w-80 bg-navy-deep border border-white/15 rounded-lg shadow-xl overflow-hidden z-50">
          <div className="bg-navy-medium px-4 py-3 border-b border-white/15">
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
                <button
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full text-left p-3 border-b border-white/10 transition-colors hover:bg-navy-medium/60 ${
                    !notif.read ? 'bg-navy-medium/20' : ''
                  } ${notificationTypeStyles[notif.type]}`}
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
                      <div className="w-2 h-2 bg-fifaGreen rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="bg-navy-medium px-4 py-2 border-t border-white/15">
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
                className="text-xs text-fifaGreen hover:text-fifaGreen/80 font-bold uppercase tracking-wider"
              >
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
