'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '@/components/NotificationProvider'
import type { Notification } from '@/lib/types'
import { Bell, Trash2 } from 'lucide-react'

export default function NotificationBell() {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)
  
  const {
    notifications,
    unreadCount,
    deleteNotification,
    deleteAllNotifications,
    markAsRead,
    markAllAsRead,
    unlockAudio,
  } = useNotifications()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    function handleFirstClick() {
      unlockAudio()
      document.removeEventListener('click', handleFirstClick)
    }
    document.addEventListener('click', handleFirstClick)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('click', handleFirstClick)
    }
  }, [unlockAudio])

  async function handleNotificationClick(notif: Notification) {
    if (!notif.read) {
      await markAsRead(notif.id)
    }
    if (notif.link) {
      window.location.href = notif.link
    }
  }

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
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notif.id)
                    }}
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
                onClick={markAllAsRead}
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
