'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Cuando el usuario llega aquí desde el email, Supabase establece una sesión
    // de "recovery" automáticamente. Esperamos a confirmarla.
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      setReady(!!data.session)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.updateUser({ password })
      if (err) throw err
      setSuccess(true)
      setTimeout(() => {
        router.push('/predictions')
        router.refresh()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-1">Nueva contraseña</h1>
        <p className="text-white/60 mb-6 text-sm">Escoge una nueva contraseña.</p>
        {!ready ? (
          <div className="text-white/50 text-sm">Verificando enlace...</div>
        ) : success ? (
          <div className="bg-fifaGreen/15 border border-fifaGreen/40 rounded-lg p-4">
            <p className="font-bold uppercase tracking-wider text-fifaGreen text-xs">¡Contraseña actualizada!</p>
            <p className="text-sm mt-2 text-white/80">Te llevamos a tus pronósticos...</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label-up block mb-1.5">Nueva contraseña</label>
              <input type="password" required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)} className="input"
                placeholder="Mínimo 6 caracteres" autoComplete="new-password" autoFocus />
            </div>
            <div>
              <label className="label-up block mb-1.5">Confirma contraseña</label>
              <input type="password" required minLength={6} value={password2}
                onChange={(e) => setPassword2(e.target.value)} className="input"
                autoComplete="new-password" />
            </div>
            {error && (
              <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
