'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import Flag from '@/components/Flag'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/types'
import { TOTAL_AVATARS, AVATAR_PATHS } from '@/lib/avatars'
import { COUNTRIES } from '@/lib/countries'

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
  const [countryCode, setCountryCode] = useState(profile?.country_code || '')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const podiumLocked = lockAt ? Date.now() > new Date(lockAt).getTime() : false
  
  // Estados de contraseña
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Estados de guardado
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  // Modal de avatares
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const [tempAvatarId, setTempAvatarId] = useState<number | null>(null)
  
  // Avatares disponibles
  const permanentAvatars = Array.from({ length: TOTAL_AVATARS }, (_, i) => i + 1)
  const [occupiedAvatars, setOccupiedAvatars] = useState<Set<number>>(new Set())
  const [loadingAvatars, setLoadingAvatars] = useState(true)
  
  // Acordeón de seguridad
  const [securityOpen, setSecurityOpen] = useState(false)

  // Cargar avatares ocupados
  useEffect(() => {
    async function fetchOccupiedAvatars() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_perm_id')
        .not('avatar_perm_id', 'is', null)
        .neq('id', user.id)

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
        avatar_perm_id: avatarPermId,
        country_code: countryCode || null
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
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordMsg(null), 3000)
    }
  }

  function handleSelectAvatar(id: number) {
    setTempAvatarId(id)
    setAvatarPermId(id)
    setShowAvatarModal(false)
  }

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode)
  
  const roleLabel = profile?.role === 'admin' ? 'Administrador' : profile?.role === 'manager' ? 'Manager' : 'Participante'
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }) : '—'

  return (
    <div className="space-y-6">
      <PageHeader
        label="Tu cuenta"
        title="Mi perfil"
        subtitle="Gestiona tu información personal y seguridad"
      />

      {/* SECCIÓN A: IDENTIDAD */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar con botón editar */}
          <div className="flex-shrink-0">
            <div className="relative group">
              <div className={`w-30 h-30 rounded-full overflow-hidden border-4 ${
                avatarPermId ? 'border-fifaGreen' : 'border-white/20'
              } bg-white/10`}>
                <img
                  src={avatarPermId ? AVATAR_PATHS.permanent(avatarPermId) : AVATAR_PATHS.default}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = AVATAR_PATHS.default
                  }}
                />
              </div>
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-0 right-0 bg-fifaGreen hover:bg-fifaGreen/80 text-navy-deepest rounded-full p-2 shadow-lg transition-all"
                title="Cambiar avatar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Info básica */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Nombre de pantalla</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="¿Cómo quieres que te vean?"
                className="input"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="input opacity-60 cursor-not-allowed"
              />
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <div className="badge bg-fifaGreen/20 text-fifaGreen border border-fifaGreen/30">
                {roleLabel}
              </div>
              <div className="badge bg-white/10 text-white/70 border border-white/20">
                Miembro desde: {memberSince}
              </div>
            </div>
          </div>
        </div>

        {profileMsg && (
          <div
            className={`mt-4 text-sm p-3 rounded ${
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
          className="btn btn-primary mt-4 w-full md:w-auto"
        >
          {savingProfile ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* SECCIÓN B: LOCALIZACIÓN */}
      <div className="card p-6">
        <h2 className="font-extrabold uppercase tracking-tight text-white text-lg mb-4">Ubicación</h2>
        
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-white/70 mb-1">País</label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="input"
            >
              <option value="">Selecciona tu país</option>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>

          {selectedCountry && (
            <div className="flex-shrink-0 mb-1">
              <Flag team={{ iso_code: selectedCountry.code } as any} size={32} />
            </div>
          )}
        </div>

        <p className="text-xs text-white/50 mt-2">
          Tu bandera aparecerá junto a tu avatar en el ranking
        </p>
      </div>

      {/* SECCIÓN C: SEGURIDAD */}
      <div className="card border-2 border-white/10">
        <button
          onClick={() => setSecurityOpen(!securityOpen)}
          className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <h2 className="font-extrabold uppercase tracking-tight text-white text-lg">
            Seguridad
          </h2>
          <svg
            className={`w-5 h-5 text-white/70 transition-transform ${securityOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {securityOpen && (
          <div className="p-6 pt-0 space-y-6 border-t border-white/10">
            {/* Cambiar contraseña */}
            <div className="space-y-4">
              <h3 className="font-bold text-white uppercase text-sm tracking-wider">Cambiar contraseña</h3>

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

            {/* Eliminar cuenta */}
            <div className="pt-6 border-t border-danger/20">
              <h3 className="font-bold text-danger uppercase text-sm tracking-wider mb-3">Zona de peligro</h3>
              <p className="text-sm text-white/70 mb-4">
                Eliminar tu cuenta es una acción permanente. Se borrarán todas tus jugadas y pronósticos.
              </p>

              {podiumLocked && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400 mb-4">
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
        )}
      </div>

      {/* Modal de selección de avatar */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            className="card max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-extrabold uppercase tracking-tight text-white text-xl">
                Selecciona tu avatar
              </h2>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-white/70 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            {loadingAvatars ? (
              <div className="text-center py-8 text-white/50">Cargando avatares...</div>
            ) : (
              <div className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-3">
                {permanentAvatars.map((id) => {
                  const isOccupied = occupiedAvatars.has(id)
                  const isSelected = avatarPermId === id
                  const canSelect = !isOccupied || isSelected

                  return (
                    <button
                      key={id}
                      onClick={() => canSelect && handleSelectAvatar(id)}
                      disabled={isOccupied && !isSelected}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        isSelected
                          ? 'border-fifaGreen scale-105'
                          : isOccupied
                          ? 'border-white/10 opacity-40 cursor-not-allowed'
                          : 'border-white/20 hover:border-white/40 hover:scale-105'
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
            )}

            <p className="text-xs text-white/50 mt-4 text-center">
              Los avatares son únicos. No podrás elegir uno que ya esté en uso.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
