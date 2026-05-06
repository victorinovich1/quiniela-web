'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import PageHeader from '@/components/PageHeader'
import Flag from '@/components/Flag'
import type { Team, Match, Profile, Invitation, Settings, Phase, Entry, Role } from '@/lib/types'
import { PHASE_LABELS, KO_PHASES, GROUP_CODES } from '@/lib/types'

type Tab = 'teams' | 'matches' | 'invitations' | 'participants' | 'settings'

// Convierte ISO UTC string a formato 'YYYY-MM-DDTHH:mm' en hora LOCAL
// (que es lo que <input type="datetime-local"> espera)
function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function AdminClient({
  userRole,
  teams: initialTeams,
  matches: initialMatches,
  profiles: initialProfiles,
  invitations: initialInvitations,
  settings: initialSettings,
  entries: initialEntries,
}: {
  userRole: Role
  teams: Team[]
  matches: Match[]
  profiles: Profile[]
  invitations: Invitation[]
  settings: Settings | null
  entries: Entry[]
}) {
  const isManager = userRole === 'manager'
  const [tab, setTab] = useState<Tab>(isManager ? 'invitations' : 'teams')

  const allTabs: { key: Tab; label: string }[] = [
    { key: 'teams', label: 'Equipos' },
    { key: 'matches', label: 'Resultados' },
    { key: 'invitations', label: 'Invitaciones' },
    { key: 'participants', label: 'Participantes' },
    { key: 'settings', label: 'Configuración' },
  ]

  const tabs = isManager
    ? allTabs.filter((t) => ['invitations', 'participants'].includes(t.key))
    : allTabs

  return (
    <div>
      <PageHeader
        label="Administrador"
        title="Panel de administración"
        subtitle="Gestiona equipos, resultados, invitaciones y participantes"
      />

      <div className="flex gap-1 mb-6 border-b border-white/15 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              tab === t.key
                ? 'border-fifaGreen text-fifaGreen'
                : 'border-transparent text-white/60 hover:text-fifaGreen'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'teams' && !isManager && <TeamsTab initialTeams={initialTeams} />}
      {tab === 'matches' && !isManager && <MatchesTab initialMatches={initialMatches} teams={initialTeams} />}
      {tab === 'invitations' && <InvitationsTab initialInvitations={initialInvitations} />}
      {tab === 'participants' && <ParticipantsTab initialProfiles={initialProfiles} initialEntries={initialEntries} isManager={isManager} />}
      {tab === 'settings' && !isManager && <SettingsTab initialSettings={initialSettings} teams={initialTeams} />}
    </div>
  )
}

// =============================================================
// TEAMS TAB
// =============================================================
function TeamsTab({ initialTeams }: { initialTeams: Team[] }) {
  const [teams, setTeams] = useState(initialTeams)
  const [saving, setSaving] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  function update(id: number, patch: Partial<Team>) {
    setTeams((curr) => curr.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  async function save(team: Team) {
    setSaving(team.id)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('teams')
      .update({ name: team.name, flag_emoji: team.flag_emoji })
      .eq('id', team.id)
    setSaving(null)
    setMsg(error ? `Error: ${error.message}` : `Equipo ${team.code} guardado`)
    setTimeout(() => setMsg(null), 2000)
  }

  return (
    <div>
      <p className="text-sm text-white/70 mb-3">
        Edita los nombres de los 48 equipos según el sorteo del Mundial. La bandera es opcional (un emoji).
      </p>
      {msg && <div className="mb-3 text-sm text-success">{msg}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {GROUP_CODES.map((g) => (
          <div key={g} className="card p-3">
            <h3 className="font-extrabold uppercase tracking-tight text-white mb-2">Grupo {g}</h3>
            <div className="space-y-2">
              {teams
                .filter((t) => t.group_code === g)
                .map((t) => (
                  <div key={t.id} className="flex gap-2 items-center">
                    <span className="text-xs text-white/60 w-6">{t.code}</span>
                    <Flag team={t} size={16} />
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => update(t.id, { name: e.target.value })}
                      onBlur={() => save(t)}
                      className="input flex-1"
                    />
                    {saving === t.id && <span className="text-xs text-white/40">...</span>}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================
// MATCHES TAB
// =============================================================
function MatchesTab({ initialMatches, teams }: { initialMatches: Match[]; teams: Team[] }) {
  const [matches, setMatches] = useState(initialMatches)
  const [phase, setPhase] = useState<Phase>('group')
  const [groupFilter, setGroupFilter] = useState<string>('A')
  const [matchSearch, setMatchSearch] = useState<string>('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams])

  const filtered = matches.filter((m) => {
    const phaseMatch = phase === 'group' ? m.group_code === groupFilter : m.phase === phase
    if (!phaseMatch) return false
    if (!matchSearch) return true
    return m.match_number.toString().includes(matchSearch)
  })

  function update(id: number, patch: Partial<Match>) {
    setMatches((curr) => curr.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  async function save(m: Match) {
    setSavingId(m.id)
    setMsg(null)
    const supabase = createClient()
    const { error } = await supabase
      .from('matches')
      .update({
        home_team_id: m.home_team_id,
        away_team_id: m.away_team_id,
        home_team_label: m.home_team_label,
        away_team_label: m.away_team_label,
        home_score: m.home_score,
        away_score: m.away_score,
        shootout_winner_team_id: m.shootout_winner_team_id,
        status: m.status,
        kickoff_at: m.kickoff_at,
        stadium: m.stadium,
        manual_override: m.manual_override,
      })
      .eq('id', m.id)
    setSavingId(null)
    setMsg(error ? `Error: ${error.message}` : `Partido M${m.match_number} guardado`)
    setTimeout(() => setMsg(null), 2000)
  }

  return (
    <div>
      <p className="text-sm text-white/70 mb-3">
        Captura los marcadores oficiales tras cada partido. Marca como &quot;finalizado&quot; para que cuente en el ranking.
      </p>
      {msg && <div className="mb-3 text-sm text-success">{msg}</div>}

      {/* Búsqueda por # de partido */}
      <div className="mb-3 flex items-center gap-2">
        <label className="text-sm text-white/70">Buscar partido:</label>
        <input
          type="text"
          placeholder="ej: 73"
          value={matchSearch}
          onChange={(e) => setMatchSearch(e.target.value)}
          className="input text-sm w-24"
        />
        {matchSearch && (
          <button
            onClick={() => setMatchSearch('')}
            className="text-xs text-white/60 hover:text-white"
          >
            Limpiar
          </button>
        )}
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto">
        <button
          onClick={() => setPhase('group')}
          className={`px-3 py-1 text-sm rounded ${phase === 'group' ? 'bg-fifaGreen text-navy-deepest' : 'bg-white/10'}`}
        >
          Grupos
        </button>
        {KO_PHASES.map((p) => (
          <button
            key={p}
            onClick={() => setPhase(p)}
            className={`px-3 py-1 text-sm rounded ${phase === p ? 'bg-fifaGreen text-navy-deepest' : 'bg-white/10'}`}
          >
            {PHASE_LABELS[p]}
          </button>
        ))}
      </div>

      {phase === 'group' && (
        <div className="flex gap-1 mb-3 overflow-x-auto">
          {GROUP_CODES.map((g) => (
            <button
              key={g}
              onClick={() => setGroupFilter(g)}
              className={`px-3 py-1 text-sm rounded ${groupFilter === g ? 'bg-gold text-navy-deepest font-bold' : 'bg-white/10'}`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((m) => {
          const home = m.home_team_id ? teamById[m.home_team_id]?.name : m.home_team_label
          const away = m.away_team_id ? teamById[m.away_team_id]?.name : m.away_team_label
          const isDraw = (m.home_score ?? 0) === (m.away_score ?? 0) && m.home_score !== null

          const homeTeam = m.home_team_id ? teamById[m.home_team_id] : null
          const awayTeam = m.away_team_id ? teamById[m.away_team_id] : null

          return (
            <div key={m.id} className="card p-3">
              <div className="flex items-center justify-between mb-2 text-xs text-white/60">
                <span>M{m.match_number} · {PHASE_LABELS[m.phase]}{m.group_code ? ` · Grupo ${m.group_code}` : ''}</span>
                <select
                  value={m.status}
                  onChange={(e) => update(m.id, { status: e.target.value as Match['status'] })}
                  onBlur={() => save(m)}
                  className="input text-xs [color-scheme:dark] bg-[#080b22] text-white"
                >
                  <option value="scheduled">Programado</option>
                  <option value="live">En vivo</option>
                  <option value="finished">Finalizado</option>
                </select>
              </div>

              <div className="mb-2 flex items-center gap-2">
                <label className="text-xs text-white/60 whitespace-nowrap">Fecha y hora (tu zona):</label>
                <input
                  type="datetime-local"
                  value={m.kickoff_at ? toLocalDateTimeInput(m.kickoff_at) : ''}
                  onChange={(e) => update(m.id, { kickoff_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  onBlur={() => save(m)}
                  className="input text-xs flex-1"
                />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <label className="text-xs text-white/60 whitespace-nowrap">Estadio:</label>
                <input
                  type="text"
                  value={m.stadium ?? ''}
                  onChange={(e) => update(m.id, { stadium: e.target.value || null })}
                  onBlur={() => save(m)}
                  className="input text-xs flex-1"
                  placeholder="Estadio, Ciudad"
                />
              </div>

              {phase !== 'group' && (
                <div className="flex gap-2 mb-2">
                  <select
                    value={m.home_team_id ?? ''}
                    onChange={(e) => update(m.id, { home_team_id: e.target.value ? Number(e.target.value) : null })}
                    onBlur={() => save(m)}
                    className="input flex-1 text-sm [color-scheme:dark] bg-[#080b22] text-white"
                  >
                    <option value="">— Equipo local — ({m.home_team_label})</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={m.away_team_id ?? ''}
                    onChange={(e) => update(m.id, { away_team_id: e.target.value ? Number(e.target.value) : null })}
                    onBlur={() => save(m)}
                    className="input flex-1 text-sm [color-scheme:dark] bg-[#080b22] text-white"
                  >
                    <option value="">— Equipo visitante — ({m.away_team_label})</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center justify-end gap-1.5">
                  {homeTeam && <Flag team={homeTeam} size={14} />}
                  <span className="font-medium text-right">{home}</span>
                </div>
                <input
                  type="number"
                  min={0}
                  value={m.home_score ?? ''}
                  onChange={(e) => update(m.id, { home_score: e.target.value === '' ? null : Number(e.target.value) })}
                  onBlur={() => save(m)}
                  className="input w-14 text-center"
                />
                <span className="text-white/40">-</span>
                <input
                  type="number"
                  min={0}
                  value={m.away_score ?? ''}
                  onChange={(e) => update(m.id, { away_score: e.target.value === '' ? null : Number(e.target.value) })}
                  onBlur={() => save(m)}
                  className="input w-14 text-center"
                />
                <div className="flex-1 flex items-center gap-1.5">
                  {awayTeam && <Flag team={awayTeam} size={14} />}
                  <span className="font-medium">{away}</span>
                </div>
                {savingId === m.id && <span className="text-xs text-white/40">...</span>}
              </div>

              {phase !== 'group' && isDraw && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-white/60">Gana en penales:</span>
                  <select
                    value={m.shootout_winner_team_id ?? ''}
                    onChange={(e) => update(m.id, { shootout_winner_team_id: e.target.value ? Number(e.target.value) : null })}
                    onBlur={() => save(m)}
                    className="input text-sm [color-scheme:dark] bg-[#080b22] text-white"
                  >
                    <option value="">—</option>
                    {m.home_team_id && <option value={m.home_team_id}>{teamById[m.home_team_id]?.name}</option>}
                    {m.away_team_id && <option value={m.away_team_id}>{teamById[m.away_team_id]?.name}</option>}
                  </select>
                </div>
              )}

              {/* Control manual override */}
              <div className="mt-2 flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-white/60 hover:text-white">
                  <input
                    type="checkbox"
                    checked={m.manual_override}
                    onChange={(e) => update(m.id, { manual_override: e.target.checked })}
                    onBlur={() => save(m)}
                    className="w-4 h-4 rounded bg-white/10 border-white/20"
                  />
                  <span>🔒 Fijar resultado (Ignorar API)</span>
                </label>
                {m.last_synced_at && (
                  <span className="text-white/40 ml-auto">
                    Última sync: {new Date(m.last_synced_at).toLocaleString('es-ES', { 
                      day: 'numeric', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================
// INVITATIONS TAB
// =============================================================
function InvitationsTab({ initialInvitations }: { initialInvitations: Invitation[] }) {
  const [invs, setInvs] = useState(initialInvitations)
  const [code, setCode] = useState('')
  const [note, setNote] = useState('')
  const [email, setEmail] = useState('')
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function genCode() {
    const r = Math.random().toString(36).substring(2, 6).toUpperCase()
    setCode(`MUNDIAL-${r}`)
  }

  async function create() {
    if (!code) return
    setCreating(true)
    setMsg(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('invitations')
      .insert({ code, note: note || null, email: email || null })
      .select()
      .single()
    setCreating(false)
    if (error) {
      setMsg(`Error: ${error.message}`)
      return
    }
    if (data) setInvs([data as Invitation, ...invs])
    setCode('')
    setNote('')
    setEmail('')
    setMsg('Invitación creada')
    setTimeout(() => setMsg(null), 2000)
  }

  async function remove(c: string) {
    if (!confirm(`¿Eliminar invitación ${c}?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('invitations').delete().eq('code', c)
    if (!error) setInvs(invs.filter((i) => i.code !== c))
  }

  return (
    <div>
      <p className="text-sm text-white/70 mb-3">
        Genera códigos de invitación y compártelos por WhatsApp. Cada código solo sirve para una persona.
      </p>
      {msg && <div className="mb-3 text-sm text-success">{msg}</div>}

      <div className="card p-3 mb-4">
        <h3 className="font-bold mb-2">Crear nueva invitación</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <div className="flex gap-1">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Código"
              className="input flex-1"
            />
            <button onClick={genCode} className="btn btn-secondary text-sm">Generar</button>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (a quién va)"
            className="input"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (opcional, restringe el código)"
            className="input"
          />
        </div>
        <button onClick={create} disabled={!code || creating} className="btn btn-primary text-sm">
          {creating ? 'Creando...' : 'Crear invitación'}
        </button>
      </div>

      <div className="card p-3">
        <h3 className="font-bold mb-2">Invitaciones ({invs.length})</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/60 text-xs uppercase">
              <th className="text-left py-1">Código</th>
              <th className="text-left py-1">Nota</th>
              <th className="text-left py-1">Email</th>
              <th className="text-left py-1">Estado</th>
              <th className="text-right py-1">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invs.map((i) => (
              <tr key={i.code} className="border-t border-white/10">
                <td className="py-2 font-mono font-bold">{i.code}</td>
                <td className="py-2">{i.note || '—'}</td>
                <td className="py-2">{i.email || '—'}</td>
                <td className="py-2">
                  {i.used_by ? (
                    <span className="text-xs bg-white/10 px-2 py-1 rounded">Usada</span>
                  ) : (
                    <span className="text-xs bg-fifaGreen/20 text-fifaGreen px-2 py-1 rounded">Disponible</span>
                  )}
                </td>
                <td className="py-2 text-right">
                  {!i.used_by && (
                    <button onClick={() => remove(i.code)} className="text-xs text-danger hover:underline">
                      Eliminar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// =============================================================
// PARTICIPANTS TAB - personas con sus jugadas
// =============================================================
function ParticipantsTab({
  initialProfiles,
  initialEntries,
  isManager,
}: {
  initialProfiles: Profile[]
  initialEntries: Entry[]
  isManager: boolean
}) {
  const [profiles, setProfiles] = useState(initialProfiles)
  const [entries, setEntries] = useState(initialEntries)
  const [msg, setMsg] = useState<string | null>(null)
  const [sendingResetTo, setSendingResetTo] = useState<string | null>(null)

  // Agrupar entries por user_id
  const entriesByUser = useMemo(() => {
    const map: Record<string, Entry[]> = {}
    for (const e of entries) {
      if (!map[e.user_id]) map[e.user_id] = []
      map[e.user_id].push(e)
    }
    return map
  }, [entries])

  async function toggleEntryPaid(e: Entry) {
    const supabase = createClient()
    const { error } = await supabase.from('entries').update({ paid: !e.paid }).eq('id', e.id)
    if (!error) {
      setEntries(entries.map((x) => (x.id === e.id ? { ...x, paid: !e.paid } : x)))
      setMsg(`Jugada "${e.alias}" marcada como ${!e.paid ? 'pagada' : 'no pagada'}`)
      setTimeout(() => setMsg(null), 1500)
    }
  }

  async function setRole(p: Profile, role: Role) {
    if (isManager) {
      setMsg('Los managers no pueden cambiar roles')
      setTimeout(() => setMsg(null), 2000)
      return
    }
    if (!confirm(`¿Cambiar rol de ${p.display_name || p.email} a ${role}?`)) return
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ role }).eq('id', p.id)
    if (error) {
      setMsg(`Error: ${error.message}`)
      setTimeout(() => setMsg(null), 2000)
    } else {
      setProfiles(profiles.map((x) => (x.id === p.id ? { ...x, role } : x)))
      setMsg(`Rol actualizado a ${role}`)
      setTimeout(() => setMsg(null), 1500)
    }
  }

  async function sendPasswordReset(p: Profile) {
    if (!p.email) {
      setMsg('Este usuario no tiene email registrado')
      setTimeout(() => setMsg(null), 2000)
      return
    }
    
    if (!confirm(`¿Enviar correo de recuperación de contraseña a ${p.email}?`)) return
    
    setSendingResetTo(p.id)
    setMsg(null)
    
    try {
      const supabase = createClient()
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error } = await supabase.auth.resetPasswordForEmail(p.email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`
      })
      
      if (error && !error.message.includes('User not found')) {
        throw error
      }
      
      setMsg(`✉️ Correo de recuperación enviado a ${p.email}`)
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg(`Error: ${err instanceof Error ? err.message : 'No se pudo enviar el correo'}`)
      setTimeout(() => setMsg(null), 3000)
    } finally {
      setSendingResetTo(null)
    }
  }

  const totalEntries = entries.length
  const paidEntries = entries.filter((e) => e.paid).length

  return (
    <div>
      <p className="text-sm text-white/70 mb-3">
        <strong>{profiles.length}</strong> participantes registrados con un total de <strong>{totalEntries}</strong> jugadas
        ({paidEntries} pagadas / {totalEntries - paidEntries} pendientes).
      </p>
      {msg && <div className="mb-3 text-sm text-success">{msg}</div>}

      <div className="space-y-3">
        {profiles.map((p) => {
          const userEntries = entriesByUser[p.id] || []
          return (
            <div key={p.id} className="card">
              <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-fifaGreen truncate">
                    {p.display_name || p.email || 'Sin nombre'}
                  </div>
                  <div className="text-xs text-white/60 truncate">{p.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => sendPasswordReset(p)}
                    disabled={sendingResetTo === p.id || !p.email}
                    className="p-2 rounded hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Enviar correo de recuperación de contraseña"
                  >
                    {sendingResetTo === p.id ? (
                      <svg className="animate-spin h-4 w-4 text-white/60" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-white/60 hover:text-fifaGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                  <select
                    value={p.role}
                    onChange={(e) => setRole(p, e.target.value as Role)}
                    disabled={isManager}
                    className="input text-xs [color-scheme:dark] bg-[#080b22] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="participant">Participante</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              {userEntries.length === 0 ? (
                <div className="text-xs text-white/40 italic">Aún no ha creado ninguna jugada</div>
              ) : (
                <div className="border-t border-white/10 pt-2 space-y-1">
                  {userEntries.map((e) => (
                    <div key={e.id} className="flex items-center justify-between text-sm py-1">
                      <span>{e.alias}</span>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={e.paid}
                          onChange={() => toggleEntryPaid(e)}
                          className="w-4 h-4"
                        />
                        <span className={`text-xs ${e.paid ? 'text-success' : 'text-white/60'}`}>
                          {e.paid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// =============================================================
// SETTINGS TAB
// =============================================================
function SettingsTab({ initialSettings, teams }: { initialSettings: Settings | null; teams: Team[] }) {
  const [s, setS] = useState<Settings | null>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [recentSyncs, setRecentSyncs] = useState<Match[]>([])

  async function loadRecentSyncs() {
    const supabase = createClient()
    const { data } = await supabase
      .from('matches')
      .select('id, match_number, home_score, away_score, status, last_synced_at')
      .not('last_synced_at', 'is', null)
      .order('last_synced_at', { ascending: false })
      .limit(5)
    if (data) setRecentSyncs(data as Match[])
  }

  useEffect(() => {
    if (s) {
      loadRecentSyncs()
    }
  }, [s])

  if (!s) return <div>No hay configuración cargada.</div>

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((curr) => (curr ? { ...curr, [key]: value } : curr))
  }

  async function syncResults() {
    setSyncing(true)
    setSyncMsg(null)
    setSyncError(null)
    const supabase = createClient()
    try {
      const res = await fetch('/api/admin/sync-results', { method: 'POST' })
      
      // Verificar res.ok ANTES de parsear JSON para evitar 'Unexpected token <'
      if (!res.ok) {
        const errorText = await res.text()
        setSyncError(`Error HTTP ${res.status}: ${errorText.slice(0, 200)}`)
        return
      }

      let data
      try {
        data = await res.json()
      } catch (parseErr) {
        setSyncError('Respuesta del servidor no es JSON válido')
        return
      }
      
      if (data.ok) {
        setSyncMsg(`Sincronización completada: ${data.updated} partidos actualizados`)
        // Recargar settings para obtener last_sync_at actualizado
        const { data: updatedSettings } = await supabase.from('settings').select('*').eq('id', 1).single()
        if (updatedSettings) setS(updatedSettings)
        // Recargar partidos recientes
        await loadRecentSyncs()
      } else {
        setSyncError(data.error || 'Error en sincronización')
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : 'Error de red')
    } finally {
      setSyncing(false)
      setTimeout(() => {
        setSyncMsg(null)
        setSyncError(null)
      }, 5000)
    }
  }

  async function save() {
    if (!s) return
    setSaving(true)
    setMsg(null)
    const supabase = createClient()
    const { id: _id, ...rest } = s
    void _id
    const { error } = await supabase.from('settings').update(rest).eq('id', 1)
    setSaving(false)
    setMsg(error ? `Error: ${error.message}` : 'Configuración guardada')
    setTimeout(() => setMsg(null), 2000)
  }

  const ptFields: { key: keyof Settings; label: string }[] = [
    { key: 'pt_exact_group', label: 'Marcador exacto - Grupos' },
    { key: 'pt_winner_group', label: 'Solo ganador - Grupos' },
    { key: 'pt_exact_ko', label: 'Marcador exacto - Eliminatorias' },
    { key: 'pt_winner_ko', label: 'Solo ganador - Eliminatorias' },
    { key: 'pt_round_of_16', label: 'Equipo en Octavos (bonus)' },
    { key: 'pt_quarters', label: 'Equipo en Cuartos (bonus)' },
    { key: 'pt_semis', label: 'Equipo en Semis (bonus)' },
    { key: 'pt_champion', label: 'Acertar Campeón' },
    { key: 'pt_runner_up', label: 'Acertar Subcampeón' },
    { key: 'pt_third', label: 'Acertar Tercer lugar' },
    { key: 'pt_fourth', label: 'Acertar Cuarto lugar' },
  ]

  const teamSelectFields: { key: keyof Settings; label: string }[] = [
    { key: 'champion_team_id', label: 'Campeón' },
    { key: 'runner_up_team_id', label: 'Subcampeón' },
    { key: 'third_team_id', label: 'Tercer lugar' },
    { key: 'fourth_team_id', label: 'Cuarto lugar' },
  ]

  return (
    <div className="space-y-6">
      <p className="text-sm text-white/70">
        Configura la fecha de cierre de pronósticos, los puntajes y los resultados especiales (al final del torneo).
      </p>
      {msg && <div className="text-sm text-success">{msg}</div>}

      {/* Sincronización API */}
      <div className="card p-4 bg-fifaGreen/5 border border-fifaGreen/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold uppercase tracking-tight text-fifaGreen">Sincronización API</h3>
          <button 
            onClick={syncResults} 
            disabled={syncing}
            className="btn btn-primary flex items-center gap-2"
          >
            <span className={syncing ? 'animate-spin' : ''}>🔄</span>
            {syncing ? 'Sincronizando...' : 'Sincronizar Resultados (API)'}
          </button>
        </div>
        
        {/* Interruptor maestro */}
        <div className="mb-4 flex items-center gap-3 p-3 bg-white/5 rounded">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <input
              type="checkbox"
              checked={s.api_sync_enabled}
              onChange={(e) => update('api_sync_enabled', e.target.checked)}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-fifaGreen focus:ring-fifaGreen"
            />
            <span className="text-sm font-medium">Sincronización Automática con FIFA</span>
          </label>
          <span className={`text-xs px-2 py-1 rounded ${s.api_sync_enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {s.api_sync_enabled ? 'ACTIVA' : 'PAUSADA'}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          {s.last_sync_at && (
            <div className="text-white/70">
              Última sincronización oficial: <span className="text-white font-medium">
                {new Date(s.last_sync_at).toLocaleString('es-ES', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
          )}
          {!s.last_sync_at && (
            <div className="text-white/50">Aún no se ha realizado ninguna sincronización</div>
          )}
          {s.last_sync_error && (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              ⚠️ Error en última sincronización: {s.last_sync_error}
            </div>
          )}
          {syncMsg && (
            <div className="text-green-400 bg-green-500/10 border border-green-500/20 rounded px-3 py-2">
              ✅ {syncMsg}
            </div>
          )}
          {syncError && (
            <div className="text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              ❌ {syncError}
            </div>
          )}
        </div>

        {/* Últimos 5 partidos sincronizados */}
        {recentSyncs.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Últimos partidos sincronizados</h4>
            <div className="space-y-1">
              {recentSyncs.map((m) => (
                <div key={m.id} className="flex items-center justify-between text-xs bg-white/5 rounded px-2 py-1.5">
                  <span className="text-white/60">M{m.match_number}</span>
                  <span className="font-mono text-white">
                    {m.home_score ?? '-'} - {m.away_score ?? '-'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    m.status === 'finished' ? 'bg-green-500/20 text-green-400' :
                    m.status === 'live' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {m.status === 'finished' ? 'FIN' : m.status === 'live' ? 'VIVO' : 'PROG'}
                  </span>
                  <span className="text-white/40">
                    {m.last_synced_at && new Date(m.last_synced_at).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="card p-4">
        <h3 className="font-extrabold uppercase tracking-tight text-white mb-3">Cierre Global (Podio y Borrado de Jugadas)</h3>
        <label className="block text-sm text-white/70 mb-1">
          Fecha y hora del primer partido. Al llegar este momento se bloquean las predicciones especiales (podio) y el borrado de jugadas. Los marcadores de partidos individuales se bloquean 15 minutos antes de cada inicio.
        </label>
        <input
          type="datetime-local"
          value={s.lock_at ? s.lock_at.slice(0, 16) : ''}
          onChange={(e) => update('lock_at', e.target.value ? new Date(e.target.value).toISOString() : null)}
          className="input"
        />
      </div>

      <div className="card p-4">
        <h3 className="font-extrabold uppercase tracking-tight text-white mb-3">Sistema de puntos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ptFields.map((f) => (
            <div key={f.key as string} className="flex items-center gap-2">
              <label className="flex-1 text-sm">{f.label}</label>
              <input
                type="number"
                min={0}
                value={(s[f.key] as number) ?? 0}
                onChange={(e) => update(f.key, Number(e.target.value) as Settings[typeof f.key])}
                className="input w-20 text-center"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-extrabold uppercase tracking-tight text-white mb-3">Resultados especiales (cargar al final del torneo)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {teamSelectFields.map((f) => (
            <div key={f.key as string} className="flex items-center gap-2">
              <label className="flex-1 text-sm">{f.label}</label>
              <select
                value={(s[f.key] as number) ?? ''}
                onChange={(e) => update(f.key, (e.target.value ? Number(e.target.value) : null) as Settings[typeof f.key])}
                className="input flex-1 [color-scheme:dark] bg-[#080b22] text-white"
              >
                <option value="">— sin definir —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn btn-primary w-full md:w-auto">
        {saving ? 'Guardando...' : 'Guardar toda la configuración'}
      </button>
    </div>
  )
}
