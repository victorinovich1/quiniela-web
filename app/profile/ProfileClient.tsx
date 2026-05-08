'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { TOTAL_PERM_AVATARS, AVATAR_PATHS } from '@/lib/avatars'

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
  const [avatarPermId, setAvatarPermId] = useState(profile?.avatar_perm_id || null)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const podiumLocked = lockAt ? Date.now() > new Date(lockAt).getTime() : false
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Avatares permanentes disponibles (dinámico)
  const permanentAvatars = Array.from({ length: TOTAL_PERM_AVATARS }, (_, i) => i + 1)
  const isPunished = profile?.avatar_temp_id !== null
  
  // Estado para avatares ocupados por otros usuarios
  const [occupiedAvatars, setOccupiedAvatars] = useState<Set<number>>(new Set())
  const [loadingAvatars, setLoadingAvatars] = useState(true)

  // Cargar avatares ocupados
  useEffect(() => {
    async function fetchOccupiedAvatars() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_perm_id')
        .not('avatar_perm_id', 'is', null)
        .neq('id', user.id) // Excluir el usuario actual

      if (!error && data) {
        const occupied = new Set(data.map(p => p.avatar_perm_id).filter(Boolean) as number[])
        setOccupiedAvatars(occupied)
      }
      setLoadingAvatars(false)
    }

    fetchOccupiedAvatars()
  }, [user.id])

  async function handleSaveProfile() {
    if (!user) return
    setSavingProfile(true)
    setProfileMsg(null)

    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ 
        display_name: displayName.trim() || null,
        avatar_perm_id: avatarPermId
      })
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

      {/* Avatar */}
      <div className="card p-4 space-y-4">
        <h2 className="font-extrabold uppercase tracking-tight text-white text-lg">Avatar</h2>

        {isPunished && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤡</span>
              <div>
                <p className="text-yellow-400 font-bold text-sm">¡Has sido castigado por el Rey!</p>
                <p className="text-white/60 text-xs mt-1">
                  Tu avatar real volverá cuando inicie el próximo partido en vivo.
                </p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-white/70 mb-3">
            Selecciona tu avatar permanente
          </label>
          {loadingAvatars ? (
            <div className="text-center py-8 text-white/50">Cargando avatares disponibles...</div>
          ) : (
            <>
              {/* Preview del avatar seleccionado */}
              {avatarPermId && (
                <div className="flex justify-center mb-4">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-fifaGreen shadow-lg shadow-fifaGreen/30 bg-white/10">
                    <img
                      src={AVATAR_PATHS.permanent(avatarPermId)}
                      alt="Avatar seleccionado"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = AVATAR_PATHS.default
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {permanentAvatars.map((id) => {
                const isOccupied = occupiedAvatars.has(id)
                const isSelected = avatarPermId === id
                const canSelect = !isOccupied || isSelected
                
                return (
                  <button
                    key={id}
                    onClick={() => canSelect && setAvatarPermId(id)}
                    disabled={isOccupied && !isSelected}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? 'border-fifaGreen scale-105'
                        : isOccupied
                        ? 'border-white/10 opacity-40 cursor-not-allowed'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <img
                      src={AVATAR_PATHS.permanent(id)}
                      alt={`Avatar ${id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = AVATAR_PATHS.default
                      }}
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-fifaGreen/20 flex items-center justify-center">
                        <div className="text-fifaGreen text-2xl font-black">✓</div>
                      </div>
                    )}
                    {isOccupied && !isSelected && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white/70 text-xl">🔒</div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            </>
          )}
          <p className="text-xs text-white/50 mt-2">
            Los avatares son únicos. No podrás elegir uno que ya esté en uso por otro participante.
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
