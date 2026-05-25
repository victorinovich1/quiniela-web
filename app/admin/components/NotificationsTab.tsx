'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

type SimpleProfile = {
  id: string
  display_name: string | null
  alias: string | null
  email: string | null
}

type NotificationBatch = {
  batch_id: string
  title: string
  message: string
  sent_count: number
  created_at: string
}

export default function NotificationsTab() {
  const [profiles, setProfiles] = useState<SimpleProfile[]>([])
  const [sentBatches, setSentBatches] = useState<NotificationBatch[]>([])
  const [sendMode, setSendMode] = useState<'all' | 'specific'>('all')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [testingReminders, setTestingReminders] = useState(false)
  const [testingSound, setTestingSound] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadProfiles()
    loadSentBatches()
  }, [])

  async function loadProfiles() {
    const supabase = createClient()
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, alias, email')
      .order('display_name')
    if (data) setProfiles(data)
  }

  async function loadSentBatches() {
    const supabase = createClient()
    
    // Query agrupada por batch_id para mostrar solo una fila por envío
    const { data } = await supabase
      .from('notifications')
      .select('batch_id, title, message, created_at')
      .not('batch_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (data) {
      // Agrupar por batch_id y contar
      const grouped = data.reduce((acc, notif) => {
        const existing = acc.find(b => b.batch_id === notif.batch_id)
        if (existing) {
          existing.sent_count += 1
        } else {
          acc.push({
            batch_id: notif.batch_id!,
            title: notif.title,
            message: notif.message,
            sent_count: 1,
            created_at: notif.created_at,
          })
        }
        return acc
      }, [] as NotificationBatch[])
      
      setSentBatches(grouped)
    }
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
      // Generar batch_id único para este envío
      const batchId = crypto.randomUUID()
      
      // Obtener IDs de usuarios destino
      const targetIds = sendMode === 'all' 
        ? profiles.map(p => p.id)
        : [selectedUserId]

      // Insertar notificaciones con batch_id
      const notifications = targetIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type: 'info',
        read: false,
        batch_id: batchId,
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
        loadSentBatches() // Recargar historial
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

  async function handleTestSound() {
    setTestingSound(true)
    setResult({ type: 'success', text: '🔊 Intentando reproducir sonido...' })

    try {
      const audioEl = document.getElementById('notification-sound') as HTMLAudioElement
      
      if (!audioEl) {
        setResult({ 
          type: 'error', 
          text: '❌ Elemento de audio no encontrado. Asegúrate de que NotificationBell esté en la página.' 
        })
      } else {
        audioEl.volume = 0.5
        await audioEl.play()
        setResult({ type: 'success', text: '✅ Sonido reproducido correctamente' })
      }
    } catch (err: any) {
      setResult({ 
        type: 'error', 
        text: `⚠️ Error: ${err.message || 'No se pudo reproducir'}. Verifica la ruta del archivo.` 
      })
    }

    setTestingSound(false)
    setTimeout(() => setResult(null), 4000)
  }

  async function handleDeleteBatch(batchId: string) {
    if (!confirm('¿Eliminar este lote de notificaciones? Se borrarán de todas las cuentas de usuarios.')) {
      return
    }

    setDeleting(batchId)

    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('admin_delete_notification_batch', {
        p_batch_id: batchId,
      })

      if (error) {
        setResult({ type: 'error', text: `Error: ${error.message}` })
      } else {
        setResult({ type: 'success', text: '✅ Lote eliminado correctamente' })
        loadSentBatches()
        setTimeout(() => setResult(null), 3000)
      }
    } catch (err: any) {
      setResult({ type: 'error', text: `Error: ${err.message}` })
    }

    setDeleting(null)
  }

  async function handleClearAll() {
    if (!confirm('⚠️ ¿VACIAR TODAS LAS NOTIFICACIONES DEL SISTEMA?\n\nEsto eliminará TODAS las notificaciones de TODOS los usuarios. Esta acción NO se puede deshacer.')) {
      return
    }

    if (!confirm('CONFIRMACIÓN FINAL: ¿Estás completamente seguro? Se borrarán todas las notificaciones.')) {
      return
    }

    setClearingAll(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('admin_clear_all_notifications')

      if (error) {
        setResult({ type: 'error', text: `Error: ${error.message}` })
      } else {
        setResult({ type: 'success', text: '✅ Sistema de notificaciones vaciado completamente' })
        setSentBatches([])
        setTimeout(() => setResult(null), 3000)
      }
    } catch (err: any) {
      setResult({ type: 'error', text: `Error: ${err.message}` })
    }

    setClearingAll(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-white/70">
          Envía notificaciones instantáneas a los participantes. Las notificaciones aparecerán en la campanita.
        </p>
        <button
          onClick={handleClearAll}
          disabled={clearingAll || sentBatches.length === 0}
          className="btn btn-outline text-danger hover:bg-danger/10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {clearingAll ? 'Vaciando...' : '🗑️ VACIAR TODO'}
        </button>
      </div>

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
      {/* Historial de Envíos */}
      {sentBatches.length > 0 && (
        <div className="card p-6 max-w-4xl mt-6">
          <h3 className="font-extrabold uppercase tracking-tight text-white text-lg mb-4">
            📋 Historial de Envíos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-bold text-white/70 uppercase tracking-wider">Título</th>
                  <th className="text-left py-3 px-4 text-sm font-bold text-white/70 uppercase tracking-wider">Mensaje</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-white/70 uppercase tracking-wider">Origen</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-white/70 uppercase tracking-wider">Usuarios</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-white/70 uppercase tracking-wider">Fecha</th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-white/70 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody>
                {sentBatches.map((batch) => {
                  const isAutomatic = batch.batch_id.startsWith('auto-reminder-')
                  return (
                    <tr key={batch.batch_id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 text-sm text-white font-medium">{batch.title}</td>
                      <td className="py-3 px-4 text-sm text-white/70 max-w-md truncate">{batch.message}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                          isAutomatic 
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-400/30' 
                            : 'bg-fifaGreen/20 text-fifaGreen border border-fifaGreen/30'
                        }`}>
                          {isAutomatic ? '🤖 Automático' : '👤 Manual'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-white/70 text-center">{batch.sent_count}</td>
                      <td className="py-3 px-4 text-sm text-white/70 text-center">
                        {new Date(batch.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteBatch(batch.batch_id)}
                          disabled={deleting === batch.batch_id}
                          className="text-danger hover:text-danger/70 disabled:opacity-50 text-sm font-bold"
                          title="Eliminar lote"
                        >
                          {deleting === batch.batch_id ? '...' : '✕'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Herramienta de prueba de sonido */}
      <div className="card p-6 max-w-2xl mt-6">
        <h3 className="font-extrabold uppercase tracking-tight text-white text-lg mb-4">
          🔔 Prueba de Sonido
        </h3>
        <p className="text-sm text-white/70 mb-4">
          Verifica que el audio de notificaciones funcione correctamente. Este botón reproducirá el sonido directamente.
        </p>
        <button
          onClick={handleTestSound}
          disabled={testingSound}
          className="btn btn-outline w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {testingSound ? 'Reproduciendo...' : '🔔 PROBAR SONIDO'}
        </button>
      </div>
    </div>
  )
}
