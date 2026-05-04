'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error: err } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (err) {
        if (err.message.toLowerCase().includes('invalid')) {
          throw new Error('Email o contraseña incorrectos')
        }
        throw err
      }
      router.push('/predictions')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-1">Entrar</h1>
        <p className="text-white/60 mb-6 text-sm">
          Ingresa con tu email y contraseña.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-up block mb-1.5">Correo electrónico</label>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="input"
              placeholder="tu@email.com" autoComplete="email" autoFocus />
          </div>
          <div>
            <label className="label-up block mb-1.5">Contraseña</label>
            <input type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)} className="input"
              autoComplete="current-password" />
            <div className="text-right mt-1.5">
              <Link href="/forgot-password" className="text-xs text-fifaGreen hover:text-fifaGreen-light font-bold uppercase tracking-wider">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>
          {error && (
            <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading || !email || !password} className="btn btn-primary w-full">
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-sm text-white/50 mt-6 text-center">
          ¿No tienes cuenta?{' '}
          <Link href="/signup" className="text-fifaGreen hover:text-fifaGreen-light font-bold uppercase tracking-wider text-xs">
            Regístrate con código
          </Link>
        </p>
      </div>
    </div>
  )
}
