'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
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
      if (redeemErr) {
        // No bloqueamos: el usuario ya tiene cuenta, solo se queda sin "redimir"
        console.warn('Error al canjear invitación:', redeemErr)
      }

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
    <div className="max-w-md mx-auto mt-10">
      <div className="card">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-1">Crear cuenta</h1>
        <p className="text-white/60 mb-6 text-sm">
          Necesitas un código de invitación.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label-up block mb-1.5">Tu nombre</label>
            <input type="text" required value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} className="input"
              placeholder="Cómo te conocen" autoComplete="name" />
          </div>
          <div>
            <label className="label-up block mb-1.5">Correo electrónico</label>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className="input"
              placeholder="tu@email.com" autoComplete="email" />
          </div>
          <div>
            <label className="label-up block mb-1.5">Contraseña</label>
            <input type="password" required minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)} className="input"
              placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>
          <div>
            <label className="label-up block mb-1.5">Confirma contraseña</label>
            <input type="password" required minLength={6} value={password2}
              onChange={(e) => setPassword2(e.target.value)} className="input"
              autoComplete="new-password" />
          </div>
          <div>
            <label className="label-up block mb-1.5">Código de invitación</label>
            <input type="text" required value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input font-mono uppercase" placeholder="MUNDIAL-XXXX" />
          </div>
          {error && (
            <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 text-sm">
              {error}
            </div>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? 'Creando cuenta...' : 'Crear cuenta y entrar'}
          </button>
        </form>

        <p className="text-sm text-white/50 mt-6 text-center">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-fifaGreen hover:text-fifaGreen-light font-bold uppercase tracking-wider text-xs">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
