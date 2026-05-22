'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type SimpleProfile = {
  id: string
  display_name: string | null
  alias: string | null
  email: string | null
}

export default function NotificationsTab() {
  const [profiles, setProfiles] = useState<SimpleProfile[]>([])
  const [sendMode, setSendMode] = useState<'all' | 'specific'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [testingReminders, setTestingReminders] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadProfiles()
  }, [])

  async function loadProfiles() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, alias, email')
      .order('display_name')
    if (data) setProfiles(data)
  }

  async function handleSendNotification() {
    if (!title.trim() || !message.trim()) {
      setResult({ type: 'error', text: 'Título y mensaje son obligatorios' })
      return
    }

    if (sendMode === 'specific' && !selectedUserId) {
      setResult({ type: 'error', text: 'Selecciona un usuario' })
      return
    }

    setSending(true)
    setResult(null)

    const supabase = createClient()

    try {
      // Obtener IDs de usuarios destino
      const targetIds = sendMode === 'all' 
        ? profiles.map(p => p.id)
        : [selectedUserId]

      // Insertar notificaciones
      const notifications = targetIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type: 'info',
        read: false,
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) {
        setResult({ type: 'error', text: `Error: ${error.message}` })
      } else {
        setResult({ 
          type: 'success', 
          text: `✅ Notificación enviada a ${targetIds.length} usuario(s)` 
        })
        setTitle('')
        setMessage('')
        setTimeout(() => setResult(null), 4000)
      }
    } catch (err) {
      setResult({ type: 'error', text: 'Error inesperado al enviar notificaciones' })
    }

    setSending(false)
  }

  async function handleTestReminders() {
    setTestingReminders(true)
    setResult({ type: 'success', text: '🔍 Iniciando escaneo de partidos cercanos...' })

    try {
      const res = await fetch('/api/cron/check-reminders', {
        method: 'GET',
      })

      const data = await res.json()

      if (data.ok) {
        setResult({
          type: 'success',
          text: `✅ Recordatorios enviados: ${data.remindersSent || 0} (${data.matchesChecked || 0} partidos revisados)`,
        })
      } else {
        setResult({ type: 'error', text: `Error: ${data.error || 'Unknown'}` })
      }
    } catch (err) {
      setResult({ type: 'error', text: 'Error al ejecutar prueba de recordatorios' })
    }

    setTestingReminders(false)
    setTimeout(() => setResult(null), 6000)
  }

  return (
    <div>
      <p className="text-sm text-white/70 mb-6">
        Envía notificaciones instantáneas a los participantes. Las notificaciones aparecerán en la campanita.
      </p>

      <div className="card p-6 max-w-2xl">
        <h3 className="font-extrabold uppercase tracking-tight text-white text-lg mb-6">
          Enviar notificación
        </h3>

        <div className="space-y-6">
          {/* Selector: Todos o Usuario específico */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Destinatario</label>
            <div className="flex gap-4">
              <button
                onClick={() => setSendMode('all')}
                className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors ${
                  sendMode === 'all'
                    ? 'bg-fifaGreen text-navy-deepest'
                    : 'bg-navy-medium text-white/60 hover:text-white'
                }`}
              >
                📢 Todos
              </button>
              <button
                onClick={() => setSendMode('specific')}
                className={`flex-1 py-3 px-4 rounded-lg font-bold uppercase tracking-wider text-sm transition-colors ${
                  sendMode === 'specific'
                    ? 'bg-fifaGreen text-navy-deepest'
                    : 'bg-navy-medium text-white/60 hover:text-white'
                }`}
              >
                👤 Usuario específico
              </button>
            </div>
          </div>

          {/* Selector de usuario (si modo específico) */}
          {sendMode === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Usuario</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="input"
              >
                <option value="">Selecciona un usuario</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.display_name || p.alias || p.email || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: ¡Actualización importante!"
              className="input"
              maxLength={100}
            />
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">Mensaje</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe el mensaje que verán los usuarios..."
              className="input min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-white/40 mt-1">{message.length}/500 caracteres</p>
          </div>

          {/* Resultado */}
          {result && (
            <div
              className={`p-4 rounded-lg text-sm ${
                result.type === 'success'
                  ? 'bg-fifaGreen/20 text-fifaGreen border border-fifaGreen/30'
                  : 'bg-danger/20 text-danger border border-danger/30'
              }`}
            >              {result.text}
            </div>
          )}

          {/* Botón de envío */}
          <button
            onClick={handleSendNotification}
            disabled={sending}
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Enviando...' : '📤 ENVIAR NOTIFICACIÓN'}
          </button>
        </div>
      </div>

      {/* Herramienta de prueba de recordatorios */}
      <div className="card p-6 max-w-2xl mt-6">
        <h3 className="font-extrabold uppercase tracking-tight text-white text-lg mb-4">
          🧪 Prueba de Recordatorios
        </h3>
        <p className="text-sm text-white/70 mb-4">
          Ejecuta manualmente la lógica de recordatorios de partidos cercanos. Envía alertas a usuarios que no han pronosticado partidos que comienzan en menos de 45 minutos.
        </p>
        <button
          onClick={handleTestReminders}
          disabled={testingReminders}
          className="btn btn-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testingReminders ? 'Ejecutando...' : '🧪 PROBAR RECORDATORIOS DE 30 MIN'}
        </button>
      </div>
    </div>
  )
}
