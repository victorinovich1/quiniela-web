'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import Flag from '@/components/Flag'
import type { User } from '@supabase/supabase-js'
import type { Profile, Settings } from '@/lib/types'
import { TOTAL_AVATARS, AVATAR_PATHS } from '@/lib/avatars'
import { COUNTRIES } from '@/lib/countries'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProfileClient({
  user,
  profile,
  settings,
  totalPoints,
  exactCount,
}: {
  user: User
  profile: Profile | null
  settings: Settings | null
  totalPoints: number
  exactCount: number
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [avatarPermId, setAvatarPermId] = useState(profile?.avatar_perm_id || null)
  const [avatarCategory, setAvatarCategory] = useState(profile?.avatar_category || 'permanentes')
  const [countryCode, setCountryCode] = useState(profile?.country_code || '')
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [podiumLocked, setPodiumLocked] = useState(false)
  const lockAt = settings?.lock_at || null
  
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
  
  // Lógica de desbloqueo de niveles
  const unlockSpecial = (totalPoints >= (settings?.req_pts_special ?? 30)) || (exactCount >= (settings?.req_exact_special ?? 3))
  const unlockPremium = (totalPoints >= (settings?.req_pts_premium ?? 70)) || (exactCount >= (settings?.req_exact_premium ?? 7))
  const unlockLegend = (totalPoints >= (settings?.req_pts_legend ?? 120)) || (exactCount >= (settings?.req_exact_legend ?? 12))
  
  // Avatares por categoría
  const avatarsByCategory = {
    permanentes: Array.from({ length: 39 }, (_, i) => i + 1),
    especiales: Array.from({ length: 12 }, (_, i) => i + 1),
    premium: Array.from({ length: 12 }, (_, i) => i + 1),
    leyendas: Array.from({ length: 12 }, (_, i) => i + 1),
  }
  
  // Avatares ocupados por categoría
  const [occupiedAvatars, setOccupiedAvatars] = useState<Map<string, Set<number>>>(new Map())
  const [loadingAvatars, setLoadingAvatars] = useState(true)
  
  // Acordeón de seguridad
  const [securityOpen, setSecurityOpen] = useState(false)
  
  // Preferencias de notificaciones
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true)
  const [notificationsSound, setNotificationsSound] = useState(profile?.notifications_sound ?? true)
  const [savingNotifications, setSavingNotifications] = useState(false)
  
  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showInstallButton, setShowInstallButton] = useState(false)
  
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowInstallButton(true)
    }
    
    window.addEventListener('beforeinstallprompt', handler)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])
  
  async function handleInstallApp() {
    if (!deferredPrompt) return
    
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      setShowInstallButton(false)
    }
    
    setDeferredPrompt(null)
  }

  // Verificar bloqueo de podio
  useEffect(() => {
    if (lockAt) {
      setPodiumLocked(Date.now() > new Date(lockAt).getTime())
    }
  }, [lockAt])

  // Cargar avatares ocupados por categoría
  useEffect(() => {
    async function fetchOccupiedAvatars() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_perm_id, avatar_category')
        .not('avatar_perm_id', 'is', null)
        .neq('id', user.id)

      if (!error && data) {
        const occupiedMap = new Map<string, Set<number>>()
        data.forEach(p => {
          const cat = p.avatar_category || 'permanentes'
          if (!occupiedMap.has(cat)) occupiedMap.set(cat, new Set())
          if (p.avatar_perm_id) occupiedMap.get(cat)!.add(p.avatar_perm_id)
        })
        setOccupiedAvatars(occupiedMap)
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
        avatar_category: avatarCategory,
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

  async function updateNotificationPreference(field: 'notifications_enabled' | 'notifications_sound', value: boolean) {
    if (!user) return
    setSavingNotifications(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ [field]: value })
      .eq('id', user.id)
    setSavingNotifications(false)
    if (error) {
      console.error('Error actualizando preferencias:', error)
    }
  }

  function handleSelectAvatar(id: number, category: string) {
    setAvatarPermId(id)
    setAvatarCategory(category)
    setShowAvatarModal(false)
  }

  const selectedCountry = COUNTRIES.find(c => c.code === countryCode)
  
  const roleLabel = profile?.role === 'admin' ? 'Administrador' : profile?.role === 'manager' ? 'Manager' : 'Participante'
  const memberSince = user.created_at ? new Date(user.created_at).toLocaleDateString('es-MX', { year: 'numeric', month: 'long' }) : '—'

  return (
    <>
      <PageHeader
        label="Tu cuenta"
        title="Mi perfil"
        subtitle="Gestiona tu información personal y seguridad"
      />

      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Grid principal: Avatar izquierda + Info derecha */}
        <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-8">
          {/* COLUMNA IZQUIERDA: Identidad Visual */}
          <div className="space-y-4">
            {/* Avatar clickeable */}
            <div className="flex flex-col items-center lg:items-start">
              <button
                onClick={() => setShowAvatarModal(true)}
                className={`group relative w-40 h-40 rounded-full overflow-hidden border-4 ${
                  avatarPermId ? 'border-fifaGreen shadow-lg shadow-fifaGreen/30' : 'border-white/20'
                } bg-white/10 mb-3 cursor-pointer transition-all hover:scale-105`}
              >
                <img
                  src={
                    avatarPermId && avatarCategory
                      ? `/images/avatars/${avatarCategory}/${avatarPermId}.webp`
                      : AVATAR_PATHS.default
                  }
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = AVATAR_PATHS.default
                  }}
                />
                {/* Overlay con icono */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </button>
            </div>

            {/* Badges */}
            <div className="space-y-2">
              <div className="badge bg-fifaGreen/20 text-fifaGreen border border-fifaGreen/30 w-full justify-center py-2">
                {roleLabel}
              </div>
              <div className="badge bg-white/10 text-white/70 border border-white/20 w-full justify-center py-2 text-xs">
                Miembro desde {memberSince}
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: Información y Formularios */}
          <div className="space-y-6">
            {/* Datos personales */}
            <div className="card p-6 space-y-4">
              <h2 className="font-extrabold uppercase tracking-tight text-white text-sm">Datos Personales</h2>
              
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
            </div>

            {/* Ubicación */}
            <div className="card p-6 space-y-4">
              <h2 className="font-extrabold uppercase tracking-tight text-white text-sm">Ubicación</h2>
              
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-white/70 mb-1">País</label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="input appearance-none [color-scheme:dark] bg-[#080b22] text-white"
                  >
                    <option value="" className="bg-[#080b22] text-white">Selecciona tu país</option>
                    {COUNTRIES.map((country) => (
                      <option key={country.code} value={country.code} className="bg-[#080b22] text-white">
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCountry && (
                  <div className="flex-shrink-0 mb-1">
                    <Flag team={{ iso_code: selectedCountry.code }} size={32} />
                  </div>
                )}
              </div>

              <p className="text-xs text-white/50">
                Tu bandera aparecerá junto a tu avatar en el ranking
              </p>
            </div>

            {/* Mensajes y botón guardar */}
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
              className="btn btn-primary w-full"
            >
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>

        {/* BOTÓN DE INSTALACIÓN PWA */}
        {showInstallButton && (
          <div className="card bg-gradient-to-r from-fifaGreen/20 to-blue-500/20 border border-fifaGreen/30 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="font-extrabold uppercase tracking-tight text-white text-sm mb-1">
                  📲 Instala la App
                </h3>
                <p className="text-xs text-white/70">
                  Accede más rápido y recibe notificaciones instalando la aplicación en tu dispositivo
                </p>
              </div>
              <button
                onClick={handleInstallApp}
                className="btn btn-primary whitespace-nowrap"
              >
                📲 INSTALAR APLICACIÓN
              </button>
            </div>
          </div>
        )}

        {/* AJUSTES DE NOTIFICACIONES */}
        <div className="card border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h2 className="font-extrabold uppercase tracking-tight text-white text-lg">Notificaciones</h2>
          </div>

          <div className="space-y-4">
            {/* Switch: Recibir notificaciones */}
            <div className="flex items-center justify-between p-4 bg-navy-medium/30 rounded-lg">
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm mb-1">Recibir notificaciones</h3>
                <p className="text-xs text-white/60">Recibe alertas sobre partidos, ranking y actualizaciones</p>
              </div>
              <button
                onClick={() => {
                  const newValue = !notificationsEnabled
                  setNotificationsEnabled(newValue)
                  updateNotificationPreference('notifications_enabled', newValue)
                }}
                disabled={savingNotifications}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-fifaGreen' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Switch: Sonido de alerta */}
            <div className="flex items-center justify-between p-4 bg-navy-medium/30 rounded-lg">
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm mb-1">Sonido de alerta</h3>
                <p className="text-xs text-white/60">Reproduce un sonido al recibir notificaciones</p>
              </div>
              <button
                onClick={() => {
                  const newValue = !notificationsSound
                  setNotificationsSound(newValue)
                  updateNotificationPreference('notifications_sound', newValue)
                }}
                disabled={savingNotifications || !notificationsEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsSound && notificationsEnabled ? 'bg-fifaGreen' : 'bg-white/20'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsSound ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {!notificationsEnabled && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-sm text-yellow-400">
                ⚠️ Las notificaciones están desactivadas. No recibirás alertas.
              </div>
            )}
          </div>
        </div>

        {/* ZONA DE SEGURIDAD (fuera del grid) - Acordeón */}
        <div className="card border border-white/10">
          <button
            onClick={() => setSecurityOpen(!securityOpen)}
            className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h2 className="font-extrabold uppercase tracking-tight text-white text-lg">Seguridad</h2>
            </div>
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
            <div className="px-6 pb-6 space-y-6 border-t border-white/10">
              {/* Cambiar contraseña */}
              <div className="space-y-4 pt-6 pb-6 border-b border-white/10">
                <h3 className="font-bold text-white/90 text-sm">Cambiar contraseña</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="Repite la contraseña"
                      className="input"
                    />
                  </div>
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
                  className="btn btn-primary"
                >
                  {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
                </button>
              </div>

              {/* Eliminar cuenta */}
              <div className="space-y-4">
                <h3 className="font-bold text-danger text-sm">Zona de peligro</h3>
                <p className="text-sm text-white/60">
                  Eliminar tu cuenta es permanente. Se borrarán todas tus jugadas y pronósticos.
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

                      await supabase.auth.signOut()
                      window.location.href = '/'
                    } catch (err) {
                      alert(err instanceof Error ? err.message : 'Error al eliminar la cuenta')
                      setDeletingAccount(false)
                    }
                  }}
                  disabled={podiumLocked || deletingAccount}
                  className="btn bg-danger/20 border border-danger text-danger hover:bg-danger hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingAccount ? 'Eliminando cuenta...' : 'Eliminar mi cuenta'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de selección de avatar por niveles */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div
            className="card max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-extrabold uppercase tracking-tight text-white text-xl mb-1">
                  Selecciona tu avatar
                </h2>
                <p className="text-xs text-white/60">
                  Tus stats: {totalPoints} pts · {exactCount} exactos
                </p>
              </div>
              <button
                onClick={() => setShowAvatarModal(false)}
                className="text-white/70 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Opción para quitar avatar */}
            <button
              onClick={() => {
                setAvatarPermId(null)
                setAvatarCategory('permanentes')
                setShowAvatarModal(false)
              }}
              className="w-full mb-6 p-4 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-white/40 rounded-lg transition-all flex items-center justify-center gap-3 text-white/70 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-medium">Quitar avatar (usar predeterminado)</span>
            </button>

            {loadingAvatars ? (
              <div className="text-center py-8 text-white/50">Cargando avatares...</div>
            ) : (
              <div className="space-y-6">
                {/* Básicos - Siempre desbloqueados */}
                <AvatarTierSection
                  title="⚪ BÁSICOS"
                  subtitle="Siempre disponibles"
                  category="permanentes"
                  avatarIds={avatarsByCategory.permanentes}
                  isUnlocked={true}
                  currentId={avatarPermId}
                  currentCategory={avatarCategory}
                  occupiedSet={occupiedAvatars.get('permanentes') || new Set()}
                  onSelect={(id) => handleSelectAvatar(id, 'permanentes')}
                  userId={user.id}
                  reqText=""
                />

                {/* Especiales */}
                <AvatarTierSection
                  title="🌟 ESPECIALES"
                  subtitle={unlockSpecial ? 'Desbloqueados' : 'Bloqueados'}
                  category="especiales"
                  avatarIds={avatarsByCategory.especiales}
                  isUnlocked={unlockSpecial}
                  currentId={avatarPermId}
                  currentCategory={avatarCategory}
                  occupiedSet={occupiedAvatars.get('especiales') || new Set()}
                  onSelect={(id) => handleSelectAvatar(id, 'especiales')}
                  userId={user.id}
                  reqText={unlockSpecial ? '' : `Requiere de ${settings?.req_pts_special ?? 30} ptos o acertar ${settings?.req_exact_special ?? 3} marcadores exactos`}
                />

                {/* Premium */}
                <AvatarTierSection
                  title="💎 PREMIUM"
                  subtitle={unlockPremium ? 'Desbloqueados' : 'Bloqueados'}
                  category="premium"
                  avatarIds={avatarsByCategory.premium}
                  isUnlocked={unlockPremium}
                  currentId={avatarPermId}
                  currentCategory={avatarCategory}
                  occupiedSet={occupiedAvatars.get('premium') || new Set()}
                  onSelect={(id) => handleSelectAvatar(id, 'premium')}
                  userId={user.id}
                  reqText={unlockPremium ? '' : `Requiere de ${settings?.req_pts_premium ?? 70} ptos o acertar ${settings?.req_exact_premium ?? 7} marcadores exactos`}
                />

                {/* Leyendas */}
                <AvatarTierSection
                  title="🏆 LEYENDAS"
                  subtitle={unlockLegend ? 'Desbloqueados' : 'Bloqueados'}
                  category="leyendas"
                  avatarIds={avatarsByCategory.leyendas}
                  isUnlocked={unlockLegend}
                  currentId={avatarPermId}
                  currentCategory={avatarCategory}
                  occupiedSet={occupiedAvatars.get('leyendas') || new Set()}
                  onSelect={(id) => handleSelectAvatar(id, 'leyendas')}
                  userId={user.id}
                  reqText={unlockLegend ? '' : `Requiere de ${settings?.req_pts_legend ?? 120} ptos o acertar ${settings?.req_exact_legend ?? 12} marcadores exactos`}
                />
              </div>
            )}

            <p className="text-xs text-white/50 mt-6 text-center">
              Los avatares son únicos por categoría. No podrás elegir uno que ya esté en uso.
            </p>
          </div>
        </div>
      )}
    </>
  )
}

// Componente auxiliar para cada sección de avatares
function AvatarTierSection({
  title,
  subtitle,
  category,
  avatarIds,
  isUnlocked,
  currentId,
  currentCategory,
  occupiedSet,
  onSelect,
  userId,
  reqText,
}: {
  title: string
  subtitle: string
  category: string
  avatarIds: number[]
  isUnlocked: boolean
  currentId: number | null
  currentCategory: string
  occupiedSet: Set<number>
  onSelect: (id: number) => void
  userId: string
  reqText: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollButtons = () => {
    if (containerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = containerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      return () => container.removeEventListener('scroll', updateScrollButtons)
    }
  }, [avatarIds])

  const scroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = 300
      containerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const getAvatarPath = (id: number) => `/images/avatars/${category}/${id}.webp`

  return (
    <div className={`border rounded-lg p-4 ${isUnlocked ? 'border-white/20 bg-white/5' : 'border-white/10 bg-white/[0.02]'}`}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider">{title}</h3>
          <p className={`text-xs ${isUnlocked ? 'text-fifaGreen' : 'text-white/50'}`}>{subtitle}</p>
        </div>
        {!isUnlocked && (
          <div className="text-2xl opacity-50">🔒</div>
        )}
      </div>

      {reqText && (
        <p className="text-xs text-yellow-400/70 mb-3 text-center">{reqText}</p>
      )}

      <div className="relative group">
        {/* Flecha izquierda */}
        <button
          onClick={() => scroll('left')}
          disabled={!canScrollLeft}
          className={`hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-navy-dark/80 border border-white/10 text-fifaGreen hover:bg-navy-dark hover:border-fifaGreen/50 transition-all disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover:opacity-100`}
        >
          <ChevronLeft size={20} />
        </button>

        {/* Flecha derecha */}
        <button
          onClick={() => scroll('right')}
          disabled={!canScrollRight}
          className={`hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-navy-dark/80 border border-white/10 text-fifaGreen hover:bg-navy-dark hover:border-fifaGreen/50 transition-all disabled:opacity-0 disabled:pointer-events-none opacity-0 group-hover:opacity-100`}
        >
          <ChevronRight size={20} />
        </button>

        <div
          ref={containerRef} 
          className="flex flex-nowrap overflow-x-auto snap-x snap-mandatory gap-3 pb-6 px-10 md:px-12 -mx-1 cursor-grab active:cursor-grabbing scrollbar-hide md:scrollbar-styled touch-pan-x"
          style={{ WebkitOverflowScrolling: 'touch' }}
          onWheel={(e) => {
            // Solo para PC, no interferir con touch en móviles
            if (e.deltaY !== 0 && !('ontouchstart' in window)) {
              e.currentTarget.scrollLeft += e.deltaY
            }
          }}
        >
        {avatarIds.map((id) => {
          const isOccupied = occupiedSet.has(id)
          const isSelected = currentId === id && currentCategory === category
          const canSelect = isUnlocked && (!isOccupied || isSelected)

          return (
            <button
              key={id}
              onClick={() => canSelect && onSelect(id)}
              disabled={!canSelect}
              className={`relative w-20 h-20 flex-shrink-0 snap-start rounded-lg overflow-hidden border-2 transition-all ${
                isSelected
                  ? 'border-fifaGreen scale-105'
                  : !isUnlocked
                  ? 'border-white/5 opacity-30 cursor-not-allowed'
                  : isOccupied
                  ? 'border-white/10 opacity-40 cursor-not-allowed'
                  : 'border-white/20 hover:border-white/40 hover:scale-105'
              }`}
            >
              <img
                src={getAvatarPath(id)}
                alt={`${category} ${id}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/avatars/default.webp'
                }}
              />
              {isSelected && (
                <div className="absolute inset-0 bg-fifaGreen/20 flex items-center justify-center">
                  <div className="text-fifaGreen text-2xl font-black">✓</div>
                </div>
              )}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-white/50 text-lg">🔒</div>
                </div>
              )}
              {isUnlocked && isOccupied && !isSelected && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-white/70 text-xl">🔒</div>
                </div>
              )}
            </button>
          )
        })}
        </div>
      </div>
    </div>
  )
}
