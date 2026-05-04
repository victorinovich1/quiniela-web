'use client'

import { useState, FormEvent } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const origin = window.location.origin
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${origin}/auth/callback?next=/reset-password` }
      )
      if (err) throw err
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-1">Recuperar</h1>
        <p className="text-white/60 mb-6 text-sm">
          Te enviamos un enlace para que escojas una nueva contraseña.
        </p>
        {sent ? (
          <div className="bg-fifaGreen/15 border border-fifaGreen/40 rounded-lg p-4">
            <p className="font-bold uppercase tracking-wider text-fifaGreen text-xs">Correo enviado</p>
            <p className="text-sm mt-2 text-white/80">
              Revisa la bandeja de <strong className="text-white">{email}</strong>. El enlace caduca en 1 hora.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="label-up block mb-1.5">Correo electrónico</label>
              <input type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)} className="input"
                placeholder="tu@email.com" autoComplete="email" autoFocus />
            </div>
            {error && (
              <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading || !email} className="btn btn-primary w-full">
              {loading ? 'Enviando...' : 'Enviar enlace'}
            </button>
          </form>
        )}
        <p className="text-sm text-white/50 mt-6 text-center">
          <Link href="/login" className="text-fifaGreen hover:text-fifaGreen-light font-bold uppercase tracking-wider text-xs">
            Volver al login
          </Link>
        </p>
      </div>
    </div>
  )
}
