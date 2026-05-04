'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
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
      setError(err.message.includes('duplicate') ? 'Ya tienes una jugada con ese alias.' : err.message)
      return
    }
    if (data) {
      setEntries([...entries, data as Entry])
      setAlias('')
      router.push(`/predictions?entry=${(data as Entry).id}`)
    }
  }

  async function deleteEntry(id: number) {
    if (!confirm('¿Eliminar esta jugada y todos sus pronósticos? No se puede deshacer.')) return
    const supabase = createClient()
    const { error: err } = await supabase.from('entries').delete().eq('id', id)
    if (!err) {
      setEntries(entries.filter((e) => e.id !== id))
    }
  }

  return (
    <div>
      <div className="text-center mb-6">
        <span className="label-up">Tus participaciones</span>
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white mt-1">Mis jugadas</h1>
        <p className="text-sm text-white/60 mt-2 max-w-md mx-auto">
          Puedes tener varias jugadas con alias distintos. Cada una compite por separado y paga su cuota.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="card text-center py-10 mb-6">
          <p className="text-white/60 text-sm uppercase tracking-wider font-bold mb-2">Aún no tienes ninguna jugada</p>
          <p className="text-white/40 text-xs">Crea la primera abajo para empezar a pronosticar.</p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {entries.map((e) => (
            <div key={e.id} className="card flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-extrabold text-white uppercase tracking-tight truncate">{e.alias}</h3>
                <div className="text-[10px] text-white/40 uppercase tracking-wider mt-0.5 flex items-center gap-2">
                  <span>{new Date(e.created_at).toLocaleDateString('es-ES')}</span>
                  <span>·</span>
                  {e.paid
                    ? <span className="text-fifaGreen font-bold">Pagada</span>
                    : <span className="text-warning font-bold">Pendiente</span>}
                </div>
              </div>
              <Link href={`/predictions?entry=${e.id}`} className="btn btn-primary text-xs whitespace-nowrap !py-2 !px-3 !min-h-0">
                {locked ? 'Ver' : 'Llenar'}
              </Link>
              {!locked && (
                <button onClick={() => deleteEntry(e.id)}
                  className="text-[10px] text-danger hover:opacity-80 uppercase tracking-wider font-bold px-2"
                  aria-label="Eliminar">
                  Eliminar
                </button>
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
                Cada jugada paga su cuota. El organizador la marca como &quot;pagada&quot; al recibirla.
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
            Pronósticos cerrados — no puedes crear más jugadas
          </p>
        </div>
      )}
    </div>
  )
}
