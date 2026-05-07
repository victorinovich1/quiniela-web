'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen w-screen fixed inset-0 -mx-4 sm:-mx-6 lg:-mx-8 -my-6 flex items-center justify-center p-4">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/login-bg.jpg)' }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-navy-deepest/70 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-10">
          {/* Logo y Eslogan */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-fifaGreen font-black text-2xl tracking-tight">QUINIELA</span>
              <span className="text-white font-extrabold text-2xl tracking-tight">MUNDIAL</span>
            </div>
            <div className="text-white font-extrabold text-xl tracking-tight mb-4">2026</div>
            <p className="text-fifaGreen/80 text-sm font-bold uppercase tracking-wider">
              VIVE CADA PARTIDO. GANA LA GLORIA
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label className="label-up block mb-2">Correo electrónico</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Mail size={18} />
                </div>
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-fifaGreen/50 focus:bg-white/10 transition-all"
                  placeholder="tu@email.com" 
                  autoComplete="email" 
                  autoFocus 
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="label-up block mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-white/30 focus:outline-none focus:border-fifaGreen/50 focus:bg-white/10 transition-all"
                  autoComplete="current-password" 
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-white/60 hover:text-fifaGreen font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-danger/15 border border-danger/40 text-danger rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading || !email || !password} 
              className="btn btn-primary w-full rounded-xl text-base"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/60">
              ¿No tienes cuenta?{' '}
              <Link 
                href="/signup" 
                className="text-white/80 hover:text-fifaGreen font-bold transition-colors"
              >
                Regístrate ahora
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
