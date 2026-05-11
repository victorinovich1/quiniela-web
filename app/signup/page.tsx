'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { User, Mail, Lock, Key, Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const [code, setCode] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const cleanEmail = email.trim().toLowerCase()
    const cleanCode = code.trim().toUpperCase()
    const cleanName = displayName.trim()

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== password2) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (!cleanName) {
      setError('Pon tu nombre para que el organizador te identifique')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // 1) Validar el código antes de crear cuenta
      const { data: valid, error: rpcErr } = await supabase.rpc('validate_invite', {
        p_code: cleanCode,
        p_email: cleanEmail,
      })
      if (rpcErr) throw rpcErr
      if (!valid) {
        throw new Error('El código de invitación no es válido o ya fue usado')
      }

      // 2) Crear la cuenta (signUp). Con "Confirm email" desactivado en Supabase
      //    devuelve sesión inmediatamente.
      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { display_name: cleanName },
        },
      })
      if (signUpErr) {
        if (signUpErr.message.toLowerCase().includes('already')) {
          throw new Error('Ya existe una cuenta con ese email. Inicia sesión.')
        }
        throw signUpErr
      }

      // Si por alguna razón Supabase exige confirmación de email, el usuario aún
      // no tiene sesión. En ese caso le mostramos un mensaje claro.
      if (!signUpData.session) {
        throw new Error(
          'Tu cuenta se creó pero requiere confirmación de email. ' +
          'Pídele al organizador que desactive "Confirm email" en Supabase.'
        )
      }

      // 3) Ya estamos autenticados, canjear el código
      const { error: redeemErr } = await supabase.rpc('redeem_invite', {
        p_code: cleanCode,
      })
      // Ignorar error de redeem si ya fue usado - el usuario ya tiene cuenta

      // 4) Actualizar el display_name en su profile (el trigger ya lo creó con default)
      if (signUpData.user) {
        await supabase
          .from('profiles')
          .update({ display_name: cleanName })
          .eq('id', signUpData.user.id)
      }

      router.push('/entries')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-screen fixed inset-0 -mx-4 sm:-mx-6 lg:-mx-8 -my-6 flex items-center justify-center lg:justify-end p-4 lg:pr-32">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/images/signup-bg.webp)' }}
      />
      <div className="absolute inset-0 bg-black/30" />

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-navy-deepest/70 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 sm:p-10">
          {/* Logo y Título */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-fifaGreen font-black text-2xl tracking-tight">QUINIELA</span>
              <span className="text-white font-extrabold text-2xl tracking-tight">MUNDIAL</span>
            </div>
            <div className="text-white font-extrabold text-xl tracking-tight mb-4">2026</div>
            <p className="text-fifaGreen/80 text-sm font-bold uppercase tracking-wider">
              ÚNETE A LA EXPERIENCIA
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="label-up block mb-2">Tu nombre</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  required 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-fifaGreen/50 focus:bg-white/10 transition-all"
                  placeholder="Cómo te conocen" 
                  autoComplete="name" 
                />
              </div>
            </div>

            {/* Email */}
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
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="label-up block mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-white/30 focus:outline-none focus:border-fifaGreen/50 focus:bg-white/10 transition-all"
                  placeholder="Mínimo 6 caracteres" 
                  autoComplete="new-password" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="label-up block mb-2">Confirma contraseña</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Lock size={18} />
                </div>
                <input 
                  type={showPassword2 ? 'text' : 'password'} 
                  required 
                  minLength={6}
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)} 
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 text-white placeholder-white/30 focus:outline-none focus:border-fifaGreen/50 focus:bg-white/10 transition-all"
                  placeholder="••••••••"
                  autoComplete="new-password" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword2(!showPassword2)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword2 ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Código de Invitación */}
            <div>
              <label className="label-up block mb-2">Código de invitación</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                  <Key size={18} />
                </div>
                <input 
                  type="text" 
                  required 
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-fifaGreen/50 focus:bg-white/10 transition-all font-mono uppercase"
                  placeholder="MUNDIAL-XXXX" 
                />
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
              disabled={loading} 
              className="btn btn-primary w-full rounded-xl text-base mt-6"
            >
              {loading ? 'Creando cuenta...' : 'CREAR MI CUENTA'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-white/60">
              ¿Ya tienes cuenta?{' '}
              <Link 
                href="/login" 
                className="text-white/80 hover:text-fifaGreen font-bold transition-colors"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
