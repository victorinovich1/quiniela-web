'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export default function ProfileClient({
  user,
  profile,
}: {
  user: User
  profile: Profile | null
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSaveProfile() {
    if (!user) return
    setSavingProfile(true)
    setProfileMsg(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName.trim() || null })
      .eq('id', user.id)

    setSavingProfile(false)

    if (error) {
      setProfileMsg({ type: 'error', text: `Error: ${error.message}` })
    } else {
      setProfileMsg({ type: 'success', text: 'Perfil actualizado correctamente' })
      setTimeout(() => setProfileMsg(null), 3000)
    }
  }

  async function handleChangePassword() {
    if (!user) return

    // Validaciones
    if (!newPassword || newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contraseñas no coinciden' })
      return
    }

    setSavingPassword(true)
    setPasswordMsg(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setSavingPassword(false)

    if (error) {
      setPasswordMsg({ type: 'error', text: `Error: ${error.message}` })
    } else {
      setPasswordMsg({ type: 'success', text: 'Contraseña actualizada correctamente' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMsg(null), 3000)
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6">
      <h1 className="text-2xl font-extrabold uppercase tracking-tight text-white">Mi perfil</h1>

      {/* Información de cuenta */}
      <div className="card p-4 space-y-4">
        <h2 className="font-extrabold uppercase tracking-tight text-white text-lg">Información de cuenta</h2>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Email (no editable)</label>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="input opacity-60 cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Nombre de pantalla
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Cómo quieres que te vean los demás"
            className="input"
            maxLength={50}
          />
          <p className="text-xs text-white/50 mt-1">
            Este nombre aparecerá en el ranking y en tus jugadas
          </p>
        </div>

        {profileMsg && (
          <div
            className={`text-sm p-3 rounded ${
              profileMsg.type === 'success'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {profileMsg.text}
          </div>
        )}

        <button
          onClick={handleSaveProfile}
          disabled={savingProfile}
          className="btn btn-primary w-full md:w-auto"
        >
          {savingProfile ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Cambio de contraseña */}
      <div className="card p-4 space-y-4">
        <h2 className="font-extrabold uppercase tracking-tight text-white text-lg">Cambiar contraseña</h2>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Nueva contraseña</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            className="input"
            minLength={6}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Confirmar contraseña</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la nueva contraseña"
            className="input"
          />
        </div>

        {passwordMsg && (
          <div
            className={`text-sm p-3 rounded ${
              passwordMsg.type === 'success'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {passwordMsg.text}
          </div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={savingPassword || !newPassword || !confirmPassword}
          className="btn btn-primary w-full md:w-auto"
        >
          {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
        </button>
      </div>

      {/* Información adicional */}
      <div className="card p-4">
        <h2 className="font-extrabold uppercase tracking-tight text-white text-lg mb-3">Estado de la cuenta</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-white/60">Rol:</span>
            <span className="text-white font-medium">
              {profile?.role === 'admin' ? 'Administrador' : 'Participante'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/60">Cuenta creada:</span>
            <span className="text-white font-medium">
              {user.created_at ? new Date(user.created_at).toLocaleDateString('es-MX') : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
