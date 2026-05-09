'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import type { Entry } from '@/lib/types'

export default function EntriesClient({
  entries: initial,
  locked,
  userId,
}: {
  entries: Entry[]
  locked: boolean
  userId: string
}) {
  const router = useRouter()
  const [entries, setEntries] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [alias, setAlias] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  // Estado para edición de alias
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingAlias, setEditingAlias] = useState('')
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function createEntry(e: React.FormEvent) {
    e.preventDefault()
    if (!alias.trim()) return
    setCreating(true)
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase
      .from('entries')
      .insert({ user_id: userId, alias: alias.trim() })
      .select()
      .single()
    setCreating(false)
    if (err) {
      setError(err.message.includes('duplicate') ? 'Ya tienes una quiniela con ese alias.' : err.message)
      return
    }
    if (data) {
      setEntries([...entries, data as Entry])
      setAlias('')
      router.push(`/predictions?entry=${(data as Entry).id}`)
    }
  }

  async function deleteEntry(id: number) {
    if (!confirm('¿Eliminar esta quiniela y todos sus pronósticos? No se puede deshacer.')) return
    const supabase = createClient()
    const { error: err } = await supabase.from('entries').delete().eq('id', id)
    if (!err) {
      setEntries(entries.filter((e) => e.id !== id))
    }
  }

  function startEditing(entry: Entry) {
    setEditingId(entry.id)
    setEditingAlias(entry.alias)
    setEditError(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingAlias('')
    setEditError(null)
  }

  async function saveAlias(id: number) {
    const trimmedAlias = editingAlias.trim()
    if (!trimmedAlias) {
      setEditError('El alias no puede estar vacío')
      return
    }
    
    setSaving(true)
    setEditError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('entries')
      .update({ alias: trimmedAlias })
      .eq('id', id)
    
    setSaving(false)
    
    if (err) {
      setEditError(err.message.includes('duplicate') ? 'Ya tienes una quiniela con ese alias.' : err.message)
      return
    }
    
    // Actualizar estado local
    setEntries(entries.map((e) => (e.id === id ? { ...e, alias: trimmedAlias } : e)))
    setEditingId(null)
    setEditingAlias('')
  }

  return (
    <div>
      <PageHeader
        label="Tus participaciones"
        title="MIS QUINIELAS"
        subtitle="Puedes tener varias quinielas con alias distintos. Cada una compite por separado y paga su cuota."
      />

      {entries.length === 0 ? (
        <div className="card text-center py-10 mb-6">
          <p className="text-white/60 text-sm uppercase tracking-wider font-bold mb-2">Aún no tienes ninguna quiniela</p>
          <p className="text-white/40 text-xs">Crea la primera abajo para empezar a pronosticar.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {entries.map((e) => (
            <div key={e.id} className="card">
              {editingId === e.id ? (
                // Modo edición
                <div className="space-y-3">
                  <div>
                    <label className="label-up block mb-1.5">Nuevo nombre</label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={editingAlias}
                      onChange={(ev) => setEditingAlias(ev.target.value)}
                      className="input"
                      placeholder="Nombre de la quiniela"
                      autoFocus
                    />
                  </div>
                  {editError && (
                    <div className="text-danger text-xs">{editError}</div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveAlias(e.id)}
                      disabled={saving || !editingAlias.trim()}
                      className="btn btn-primary text-xs !py-2 !px-3 !min-h-0"
                    >
                      {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      className="btn btn-outline text-xs !py-2 !px-3 !min-h-0"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-white uppercase tracking-tight truncate">
                        {e.alias}
                      </h3>
                      <button
                        onClick={() => startEditing(e)}
                        className="text-white/40 hover:text-fifaGreen transition-colors"
                        aria-label="Editar nombre"
                        title="Editar nombre"
                      >
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 flex items-center gap-2">
                      <span>{new Date(e.created_at).toLocaleDateString('es-ES')}</span>
                      <span>·</span>
                      {e.paid ? (
                        <span className="text-fifaGreen font-bold">Pagada</span>
                      ) : (
                        <span className="text-warning font-bold">Pendiente</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/predictions?entry=${e.id}`}
                      className="btn btn-primary text-xs whitespace-nowrap !py-2 !px-3 !min-h-0"
                    >
                      {locked ? 'Ver' : 'Llenar'}
                    </Link>
                    <Link
                      href={`/predictions/summary?entry=${e.id}`}
                      className="btn btn-outline text-xs whitespace-nowrap !py-2 !px-3 !min-h-0 flex items-center gap-1"
                      title="Ver resumen de puntos"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <span className="hidden sm:inline">Resultados</span>
                    </Link>
                    {!locked && (
                      <button
                        onClick={() => deleteEntry(e.id)}
                        className="text-[10px] text-danger hover:opacity-80 uppercase tracking-wider font-bold px-2"
                        aria-label="Eliminar"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!locked && (
        <div className="card">
          <h3 className="label-up mb-1">Nueva quiniela</h3>
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-3">
            Crea un nuevo pronóstico independiente para generar una nueva participación en el ranking
          </p>
          <form onSubmit={createEntry} className="space-y-3">
            <div>
              <label className="label-up block mb-1.5">Alias</label>
              <input type="text" required maxLength={40} value={alias}
                onChange={(ev) => setAlias(ev.target.value)} className="input"
                placeholder='Ej: "Casa", "Oficina", "Conservadora"' />
              <p className="text-[10px] text-white/40 mt-1.5 uppercase tracking-wider">
                Cada quiniela paga su cuota. El organizador la marca como &quot;pagada&quot; al recibirla.
              </p>
            </div>
            {error && <div className="text-danger text-sm">{error}</div>}
            <button type="submit" disabled={creating || !alias.trim()} className="btn btn-primary">
              {creating ? 'Creando...' : '+ Quiniela'}
            </button>
          </form>
        </div>
      )}

      {locked && (
        <div className="card text-center">
          <p className="text-warning text-sm uppercase tracking-wider font-bold">
            Pronósticos cerrados — no puedes crear más quinielas
          </p>
        </div>
      )}
    </div>
  )
}
