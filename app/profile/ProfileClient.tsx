'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'

export default function ProfileClient({
  user,
  profile,
  lockAt,
}: {
  user: User
  profile: Profile | null
  lockAt: string | null
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const podiumLocked = lockAt ? Date.now() > new Date(lockAt).getTime() : false
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
    <div className="space-y-6">
      <PageHeader
        label="Tu cuenta"
        title="Mi perfil"
        subtitle="Gestiona tu información personal y seguridad"
      />

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
                ? 'bg-fifaGreen/20 text-fifaGreen'
                : 'bg-danger/20 text-danger'
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
                ? 'bg-fifaGreen/20 text-fifaGreen'
                : 'bg-danger/20 text-danger'
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

      {/* Zona de Peligro */}
      <div className="card p-4 space-y-4 border-2 border-danger/30">
        <h2 className="font-extrabold uppercase tracking-tight text-danger text-lg">Zona de Peligro</h2>
        <p className="text-sm text-white/70">
          Eliminar tu cuenta es una acción permanente. Se borrarán todas tus jugadas y pronósticos.
        </p>
        
        {podiumLocked && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
            ⚠️ No puedes eliminar tu cuenta una vez iniciado el mundial
          </div>
        )}

        <button
          onClick={async () => {
            if (!confirm('¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return
            if (!confirm('¿Realmente quieres continuar? Se borrarán todas tus jugadas y pronósticos de forma permanente.')) return
            
            setDeletingAccount(true)
            const supabase = createClient()
            
            try {
              const { error } = await supabase.rpc('delete_user_self')
              
              if (error) throw error
              
              // Cerrar sesión y redirigir
              await supabase.auth.signOut()
              window.location.href = '/'
            } catch (err) {
              alert(err instanceof Error ? err.message : 'Error al eliminar la cuenta')
              setDeletingAccount(false)
            }
          }}
          disabled={podiumLocked || deletingAccount}
          className="btn bg-danger/20 border-danger text-danger hover:bg-danger hover:text-white disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
        >
          {deletingAccount ? 'Eliminando cuenta...' : 'Eliminar mi cuenta'}
        </button>
      </div>
    </div>
  )
}
