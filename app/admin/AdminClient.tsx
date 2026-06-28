'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toLocalDateTimeInput, getMatchStatus, getMatchScores } from '@/lib/utils'
import { DEFAULT_SETTINGS_ID } from '@/lib/constants'
import PageHeader from '@/components/PageHeader'
import Flag from '@/components/Flag'
import type { Team, Match, Profile, Invitation, Settings, Phase, Entry, Role, BestThirdPlacedTeam } from '@/lib/types'
import { PHASE_LABELS, KO_PHASES, GROUP_CODES } from '@/lib/types'
import NotificationsTab from './components/NotificationsTab'

type Tab = 'teams' | 'matches' | 'invitations' | 'participants' | 'settings' | 'notifications'

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
    { key: 'notifications', label: 'Notificaciones' },
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
      {tab === 'matches' && !isManager && <MatchesTab initialMatches={initialMatches} teams={initialTeams} settings={initialSettings} />}
      {tab === 'invitations' && <InvitationsTab initialInvitations={initialInvitations} />}
      {tab === 'participants' && <ParticipantsTab initialProfiles={initialProfiles} initialEntries={initialEntries} isManager={isManager} />}
      {tab === 'notifications' && !isManager && <NotificationsTab />}
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
function MatchesTab({ initialMatches, teams, settings }: { 
  initialMatches: Match[]
  teams: Team[]
  settings: Settings | null
}) {
  const [matches, setMatches] = useState(initialMatches)
  const [phase, setPhase] = useState<Phase>('group')
  const [groupFilter, setGroupFilter] = useState<string>('A')
  const [matchSearch, setMatchSearch] = useState<string>('')
  const [savingId, setSavingId] = useState<number | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [thirdPlaceTeams, setThirdPlaceTeams] = useState<BestThirdPlacedTeam[]>([])
  const [showThirds, setShowThirds] = useState(false)

  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams])

  // Cargar ranking de terceros
  useEffect(() => {
    async function loadThirds() {
      const supabase = createClient()
      const { data } = await supabase
        .from('best_third_placed_teams')
        .select('*')
        .order('third_place_rank', { ascending: true })
      
      if (data) setThirdPlaceTeams(data as BestThirdPlacedTeam[])
    }
    loadThirds()
  }, [matches]) // Recargar cuando cambien los partidos

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
    
    // SNAPSHOT: Guardar ranking actual antes de modificar marcador
    await supabase.rpc('update_ranking_memory')
    
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

  const syncInterval = settings?.sync_interval_minutes || 10

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-white/70">
          Captura los marcadores oficiales tras cada partido. Marca como &quot;finalizado&quot; para que cuente en el ranking.
        </p>
        {settings?.api_sync_enabled && (
          <div className="text-xs text-fifaGreen font-bold uppercase tracking-wider flex items-center gap-1.5 bg-fifaGreen/10 px-3 py-1.5 rounded-full border border-fifaGreen/30">
            <span className="animate-pulse">🔄</span>
            Sincronizando cada {syncInterval} min
          </div>
        )}
      </div>
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

          const effectiveStatus = getMatchStatus(m)
          const isVirtualLive = effectiveStatus === 'live' && m.status === 'scheduled'
          const [effectiveHomeScore, effectiveAwayScore] = getMatchScores(m)

          return (
            <div key={m.id} className="card p-3">
              <div className="flex items-center justify-between mb-2 text-xs text-white/60">
                <span>M{m.match_number} · {PHASE_LABELS[m.phase]}{m.group_code ? ` · Grupo ${m.group_code}` : ''}</span>
                <div className="flex items-center gap-2">
                  {isVirtualLive && (
                    <span className="px-2 py-0.5 rounded-full bg-fifaGreen/20 text-fifaGreen border border-fifaGreen/30 text-xs font-bold uppercase tracking-wider">
                      VIVO (Virtual)
                    </span>
                  )}
                  <select
                    value={m.status}
                    onChange={(e) => update(m.id, { status: e.target.value as Match['status'] })}
                    onBlur={() => save(m)}
                    className="input text-xs [color-scheme:dark] bg-[#080b22] text-white"
                  >
                    <option value="scheduled" className="bg-[#080b22] text-white">Programado</option>
                    <option value="live" className="bg-[#080b22] text-white">En vivo</option>
                    <option value="finished" className="bg-[#080b22] text-white">Finalizado</option>
                  </select>
                </div>
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
                  placeholder={m.home_score === null && effectiveStatus === 'live' ? '0' : ''}
                  className={`input w-14 text-center ${m.home_score === null && effectiveStatus === 'live' ? 'placeholder:text-fifaGreen/60 placeholder:font-bold' : ''}`}
                />
                <span className="text-white/40">-</span>
                <input
                  type="number"
                  min={0}
                  value={m.away_score ?? ''}
                  onChange={(e) => update(m.id, { away_score: e.target.value === '' ? null : Number(e.target.value) })}
                  onBlur={() => save(m)}
                  placeholder={m.away_score === null && effectiveStatus === 'live' ? '0' : ''}
                  className={`input w-14 text-center ${m.away_score === null && effectiveStatus === 'live' ? 'placeholder:text-fifaGreen/60 placeholder:font-bold' : ''}`}
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
                  <span className="text-white/40 ml-auto" suppressHydrationWarning>
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

      {/* Sección: Ranking de Terceros Lugares */}
      {phase === 'group' && thirdPlaceTeams.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowThirds(!showThirds)}
            className="w-full flex items-center justify-between bg-gold/10 hover:bg-gold/20 border border-gold/30 rounded-lg p-3 mb-3 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥉</span>
              <div className="text-left">
                <h3 className="font-black uppercase tracking-tight text-gold">
                  Ranking de Terceros Lugares
                </h3>
                <p className="text-xs text-white/60">
                  Los 8 primeros clasifican a Dieciseisavos (Round of 32)
                </p>
              </div>
            </div>
            <span className="text-gold">
              {showThirds ? '▼' : '►'}
            </span>
          </button>

          {showThirds && (
            <div className="card p-4 space-y-3">
              <div className="text-xs text-white/60 bg-navy-dark/60 rounded px-3 py-2 border-l-2 border-gold">
                <strong className="text-gold">Criterios de desempate:</strong> 1. Puntos · 2. Diferencia de goles · 3. Goles a favor
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-white/60 text-xs uppercase border-b border-white/10">
                      <th className="text-left py-2">Pos</th>
                      <th className="text-left py-2">Equipo</th>
                      <th className="text-center py-2">Grupo</th>
                      <th className="text-center py-2">PJ</th>
                      <th className="text-center py-2">Pts</th>
                      <th className="text-center py-2">GF</th>
                      <th className="text-center py-2">GC</th>
                      <th className="text-center py-2">Dif</th>
                      <th className="text-left py-2">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {thirdPlaceTeams.map((t) => {
                      const qualified = t.third_place_rank <= 8
                      return (
                        <tr 
                          key={t.team_id} 
                          className={`border-b border-white/5 ${qualified ? 'bg-fifaGreen/10' : ''}`}
                        >
                          <td className="py-2 font-bold">
                            <span className={qualified ? 'text-fifaGreen' : 'text-white/60'}>
                              {t.third_place_rank}°
                            </span>
                          </td>
                          <td className="py-2">
                            <div className="flex items-center gap-2">
                              <Flag team={{ iso_code: t.iso_code, name: t.name }} size={16} />
                              <span className="font-medium">{t.name}</span>
                            </div>
                          </td>
                          <td className="py-2 text-center font-bold text-gold">{t.group_code}</td>
                          <td className="py-2 text-center text-white/60">{t.matches_played}</td>
                          <td className="py-2 text-center font-bold">{t.points}</td>
                          <td className="py-2 text-center">{t.goals_for}</td>
                          <td className="py-2 text-center">{t.goals_against}</td>
                          <td className="py-2 text-center">
                            <span className={t.goal_difference > 0 ? 'text-fifaGreen' : t.goal_difference < 0 ? 'text-danger' : ''}>
                              {t.goal_difference > 0 ? '+' : ''}{t.goal_difference}
                            </span>
                          </td>
                          <td className="py-2">
                            {qualified ? (
                              <span className="text-xs bg-fifaGreen/20 text-fifaGreen px-2 py-1 rounded-full font-bold">
                                ✓ CLASIFICA
                              </span>
                            ) : (
                              <span className="text-xs bg-white/10 text-white/60 px-2 py-1 rounded-full">
                                Eliminado
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="text-xs text-white/60 bg-navy-dark/60 rounded px-3 py-2 border-l-2 border-fifaGreen">
                💡 <strong>Asignación manual:</strong> Una vez definidos los 8 mejores terceros, usa los selectores de equipos en los partidos M74, M75, M77, M79, M80, M81, M82, M84, M85 y M87 para asignar los cruces según las etiquetas oficiales FIFA.
              </div>
            </div>
          )}
        </div>
      )}
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

  async function deleteUser(p: Profile) {
    if (isManager) {
      setMsg('Los managers no pueden eliminar usuarios')
      setTimeout(() => setMsg(null), 2000)
      return
    }

    const userEntries = entriesByUser[p.id] || []
    const entryText = userEntries.length > 0 
      ? ` y sus ${userEntries.length} jugada${userEntries.length > 1 ? 's' : ''}`
      : ''
    
    if (!confirm(`¿Eliminar permanentemente a ${p.display_name || p.email}${entryText}? Esta acción no se puede deshacer.`)) return
    
    try {
      const res = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: p.id }),
      })
      
      const data = await res.json()
      
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Error al eliminar usuario')
      }
      
      setProfiles(profiles.filter((x) => x.id !== p.id))
      setEntries(entries.filter((e) => e.user_id !== p.id))
      setMsg(`✅ Usuario ${p.display_name || p.email} eliminado`)
      setTimeout(() => setMsg(null), 3000)
    } catch (err) {
      setMsg(`Error: ${err instanceof Error ? err.message : 'No se pudo eliminar el usuario'}`)
      setTimeout(() => setMsg(null), 3000)
    }
  }

  async function deleteEntry(e: Entry) {
    if (!confirm(`¿Eliminar la jugada "${e.alias}"? Esta acción no se puede deshacer.`)) return
    
    try {
      const supabase = createClient()
      const { error } = await supabase.from('entries').delete().eq('id', e.id)
      
      if (error) throw error
      
      setEntries(entries.filter((x) => x.id !== e.id))
      setMsg(`✅ Jugada "${e.alias}" eliminada`)
      setTimeout(() => setMsg(null), 2000)
    } catch (err) {
      setMsg(`Error: ${err instanceof Error ? err.message : 'No se pudo eliminar la jugada'}`)
      setTimeout(() => setMsg(null), 3000)
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
                  <button
                    onClick={() => deleteUser(p)}
                    disabled={isManager}
                    className="p-2 rounded hover:bg-danger/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Eliminar usuario y todas sus jugadas"
                  >
                    <svg className="h-4 w-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <select
                    value={p.role}
                    onChange={(e) => setRole(p, e.target.value as Role)}
                    disabled={isManager}
                    className="input text-xs [color-scheme:dark] bg-[#080b22] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="participant" className="bg-[#080b22] text-white">Participante</option>
                    <option value="manager" className="bg-[#080b22] text-white">Manager</option>
                    <option value="admin" className="bg-[#080b22] text-white">Admin</option>
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
                      <div className="flex items-center gap-2">
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
                        <button
                          onClick={() => deleteEntry(e)}
                          className="p-1 rounded hover:bg-danger/20 transition-colors"
                          title="Eliminar esta jugada"
                        >
                          <svg className="h-3.5 w-3.5 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
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
  const [lastSyncClick, setLastSyncClick] = useState(0)
  const SYNC_DEBOUNCE_MS = 5000 // 5 segundos
  const [msg, setMsg] = useState<string | null>(null)
  const [recentSyncs, setRecentSyncs] = useState<Match[]>([])
  const [currentTime, setCurrentTime] = useState(0)

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

  // Realtime: Suscripción a cambios en la tabla settings
  useEffect(() => {
    const supabase = createClient()
    
    const channel = supabase
      .channel('settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'settings',
          filter: 'id=eq.1',
        },
        (payload) => {
          setS(payload.new as Settings)
          // Recargar partidos recientes si cambió last_sync_at
          if (payload.new.last_sync_at) {
            loadRecentSyncs()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Timer: Actualizar currentTime cada segundo para cuenta regresiva
  useEffect(() => {
    setCurrentTime(Date.now())
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (s) {
      loadRecentSyncs()
    }
  }, [s])

  if (!s) return <div>No hay configuración cargada.</div>

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((curr) => (curr ? { ...curr, [key]: value } : curr))
  }

  async function toggleApiSync(enabled: boolean) {
    if (!s) return
    // Actualizar estado local inmediatamente para feedback visual
    setS((curr) => (curr ? { ...curr, api_sync_enabled: enabled } : curr))
    
    // Persistir en BD
    const supabase = createClient()
    const { error } = await supabase
      .from('settings')
      .update({ api_sync_enabled: enabled })
      .eq('id', DEFAULT_SETTINGS_ID)
    
    if (error) {
      // Revertir estado local si falla
      setS((curr) => (curr ? { ...curr, api_sync_enabled: !enabled } : curr))
      setMsg(`Error al cambiar sincronización: ${error.message}`)
      setTimeout(() => setMsg(null), 3000)
    } else {
      setMsg(`Sincronización ${enabled ? 'activada' : 'pausada'}`)
      setTimeout(() => setMsg(null), 2000)
    }
  }

  async function syncResults() {
    // Debounce: prevenir clics rápidos
    const now = Date.now()
    if (now - lastSyncClick < SYNC_DEBOUNCE_MS) {
      const remaining = Math.ceil((SYNC_DEBOUNCE_MS - (now - lastSyncClick)) / 1000)
      setSyncError(`Espera ${remaining}s antes de sincronizar nuevamente`)
      setTimeout(() => setSyncError(null), 2000)
      return
    }
    setLastSyncClick(now)
    
    setSyncing(true)
    setSyncMsg(null)
    setSyncError(null)
    const supabase = createClient()
    try {
      const res = await fetch('/api/admin/sync-results?full_scan=true', { method: 'POST' })
      
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
        const totalReceived = data.total_received || data.upstreamCount || 0
        const totalUpdated = data.total_updated || data.updated || 0
        const totalSkipped = data.total_skipped || 0
        const lastMatch = data.last_match_number || 0
        
        let msg = `✅ Sincronización exitosa: ${totalReceived} partidos verificados (${totalUpdated} cambios necesarios)`
        
        if (totalSkipped > 0) {
          msg += `. ${totalSkipped} partidos sin cambios (ahorro de recursos)`
        }
        
        if (lastMatch > 0) {
          msg += `. El robot llegó hasta el partido M${lastMatch}`
        }
        
        const byTeams = data.matchedByTeams || 0
        const byDateStage = data.matchedByDateStage || 0
        const autoAssigned = data.autoAssignedTeams || 0
        
        if (byTeams > 0 || byDateStage > 0) {
          msg += ` • Emparejados: ${byTeams} por equipos, ${byDateStage} por fecha/fase`
        }
        if (autoAssigned > 0) {
          msg += ` • ${autoAssigned} equipos auto-asignados`
        }
        
        setSyncMsg(msg)
        // Recargar settings para obtener last_sync_at actualizado
        const { data: updatedSettings } = await supabase.from('settings').select('*').eq('id', DEFAULT_SETTINGS_ID).single()
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
    const { error } = await supabase.from('settings').update(rest).eq('id', DEFAULT_SETTINGS_ID)
    setSaving(false)
    setMsg(error ? `Error: ${error.message}` : 'Configuración guardada')
    setTimeout(() => setMsg(null), 2000)
  }

  const ptFields: { key: keyof Settings; label: string }[] = [
    { key: 'pt_exact_group', label: 'Marcador exacto - Grupos' },
    { key: 'pt_winner_group', label: 'Solo ganador - Grupos' },
    { key: 'pt_exact_ko', label: 'Marcador exacto - Eliminatorias' },
    { key: 'pt_winner_ko', label: 'Solo ganador - Eliminatorias' },
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
              onChange={(e) => toggleApiSync(e.target.checked)}
              className="w-5 h-5 rounded bg-white/10 border-white/20 text-fifaGreen focus:ring-fifaGreen"
            />
            <span className="text-sm font-medium">Sincronización Automática con FIFA</span>
          </label>
          <span className={`text-xs px-2 py-1 rounded ${s.api_sync_enabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
            {s.api_sync_enabled ? 'ACTIVA' : 'PAUSADA'}
          </span>
        </div>

        {/* Nota sobre plan gratuito */}
        <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
          <div className="flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <div className="flex-1 text-xs text-yellow-200/90">
              <strong>Plan Gratuito de Vercel:</strong> La sincronización automática se ejecuta <strong>una vez al día a medianoche (00:00)</strong>. 
              Durante los partidos, usa el botón <strong>&quot;🔄 Sincronizar Resultados (API)&quot;</strong> para actualizar en tiempo real sin límites.
            </div>
          </div>
        </div>

        {/* Control de intervalo y estado de conexión */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {/* Intervalo de sincronización */}
          <div className="p-3 bg-white/5 rounded">
            <label className="label-up block mb-2">Intervalo de sincronización manual</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={60}
                value={s.sync_interval_minutes}
                onChange={(e) => update('sync_interval_minutes', parseInt(e.target.value) || 10)}
                className="input flex-1"
              />
              <span className="text-sm text-white/60">minutos</span>
            </div>
            <p className="text-xs text-white/40 mt-1">
              Tiempo mínimo entre sincronizaciones manuales (botón 🔄)
            </p>
          </div>

          {/* Estado de conexión */}
          <div className="p-3 bg-white/5 rounded">
            <label className="label-up block mb-2">Estado de Conexión</label>
            {(() => {
              const status = s.last_sync_status
              const lastSync = s.last_sync_at ? new Date(s.last_sync_at).getTime() : null
              const now = Date.now()
              const intervalMs = (s.sync_interval_minutes || 10) * 60 * 1000
              const isHealthy = status === 'online' && lastSync && (now - lastSync) < (intervalMs * 2)
              
              return (
                <div className={`flex items-center gap-2 px-3 py-2 rounded ${
                  isHealthy 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  <span className="text-2xl">{isHealthy ? '🟢' : '🔴'}</span>
                  <div className="flex-1">
                    <div className={`text-sm font-bold uppercase tracking-wider ${
                      isHealthy ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {isHealthy ? 'SISTEMA ONLINE' : 'ERROR DE CONEXIÓN'}
                    </div>
                    {!isHealthy && status && status !== 'online' && (
                      <div className="text-xs text-white/80 mt-1 font-mono break-words">
                        {status.slice(0, 120)}
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}
            {/* Próxima ejecución con cuenta regresiva en tiempo real */}
            {s.last_sync_at && s.api_sync_enabled && (
              <div className="mt-2 text-xs text-white/60">
                {(() => {
                  const lastSync = new Date(s.last_sync_at).getTime()
                  const intervalMs = (s.sync_interval_minutes || 10) * 60 * 1000
                  const nextSyncTime = lastSync + intervalMs
                  const remainingMs = nextSyncTime - currentTime
                  
                  if (remainingMs > 0) {
                    const minutes = Math.floor(remainingMs / 60000)
                    const seconds = Math.floor((remainingMs % 60000) / 1000)
                    return (
                      <>
                        Próxima actualización en:{' '}
                        <span className="text-fifaGreen font-bold font-mono">
                          {minutes}:{seconds.toString().padStart(2, '0')}
                        </span>
                      </>
                    )
                  } else {
                    return (
                      <span className="text-yellow-400 font-medium animate-pulse">
                        ⏱️ Sincronización en proceso...
                      </span>
                    )
                  }
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Panel de diagnóstico de errores */}
        {s.last_sync_status && s.last_sync_status !== 'online' && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <span className="text-2xl">🔍</span>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-2">
                  Diagnóstico de Conexión API
                </h4>
                <div className="bg-black/40 rounded p-3 font-mono text-sm text-red-300 break-words border border-red-500/20">
                  {s.last_sync_status}
                </div>
                <div className="mt-3 text-xs text-white/70 space-y-2">
                  <div>
                    <p className="font-bold text-white/90 mb-1">💡 Soluciones comunes:</p>
                    <ul className="space-y-1 ml-2">
                      {s.last_sync_status.includes('403') && (
                        <li className="text-yellow-300">
                          → Verifica tu API Key en <a href="https://www.football-data.org/client/home" target="_blank" rel="noopener" className="underline">football-data.org</a>
                        </li>
                      )}
                      {s.last_sync_status.includes('404') && (
                        <li className="text-yellow-300">
                          → El Mundial 2026 puede no estar disponible aún. El sistema intentará con 2022 como fallback
                        </li>
                      )}
                      {s.last_sync_status.includes('429') && (
                        <li className="text-yellow-300">
                          → Límite de llamadas excedido. Aumenta el intervalo de sincronización a 15-30 minutos
                        </li>
                      )}
                      {s.last_sync_status.includes('401') && (
                        <li className="text-yellow-300">
                          → Revisa que FOOTBALL_DATA_API_KEY esté configurada en las variables de entorno de Vercel
                        </li>
                      )}
                      {!s.last_sync_status.match(/40[134]|429/) && (
                        <li className="text-white/60">
                          → Revisa los logs de Vercel para más detalles del error
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2 text-sm">
          {s.last_sync_at && (
            <div className="text-white/70" suppressHydrationWarning>
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
                  <span className="text-white/40" suppressHydrationWarning>
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
          value={s.lock_at ? toLocalDateTimeInput(s.lock_at) : ''}
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
                <option value="" className="bg-[#080b22] text-white">— sin definir —</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id} className="bg-[#080b22] text-white">{t.name}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4 bg-fifaGreen/5 border border-fifaGreen/20">
        <h3 className="font-extrabold uppercase tracking-tight text-fifaGreen mb-2">Configuración de Niveles (Avatares)</h3>
        <p className="text-xs text-white/60 mb-4">
          Un nivel se desbloquea si el usuario cumple el requisito de Puntos <strong>O</strong> el de Marcadores Exactos.
        </p>
        <div className="space-y-4">
          {/* Nivel Especial */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-sm font-bold text-yellow-400 mb-2">🌟 ESPECIAL</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Puntos requeridos</label>
                <input
                  type="number"
                  min={0}
                  value={s.req_pts_special ?? 30}
                  onChange={(e) => update('req_pts_special', Number(e.target.value))}
                  className="input w-full text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Exactos requeridos</label>
                <input
                  type="number"
                  min={0}
                  value={s.req_exact_special ?? 3}
                  onChange={(e) => update('req_exact_special', Number(e.target.value))}
                  className="input w-full text-center"
                />
              </div>
            </div>
          </div>

          {/* Nivel Premium */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-sm font-bold text-purple-400 mb-2">💎 PREMIUM</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Puntos requeridos</label>
                <input
                  type="number"
                  min={0}
                  value={s.req_pts_premium ?? 70}
                  onChange={(e) => update('req_pts_premium', Number(e.target.value))}
                  className="input w-full text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Exactos requeridos</label>
                <input
                  type="number"
                  min={0}
                  value={s.req_exact_premium ?? 7}
                  onChange={(e) => update('req_exact_premium', Number(e.target.value))}
                  className="input w-full text-center"
                />
              </div>
            </div>
          </div>

          {/* Nivel Leyenda */}
          <div className="bg-white/5 rounded-lg p-3">
            <h4 className="text-sm font-bold text-orange-400 mb-2">🏆 LEYENDA</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/60 mb-1">Puntos requeridos</label>
                <input
                  type="number"
                  min={0}
                  value={s.req_pts_legend ?? 120}
                  onChange={(e) => update('req_pts_legend', Number(e.target.value))}
                  className="input w-full text-center"
                />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1">Exactos requeridos</label>
                <input
                  type="number"
                  min={0}
                  value={s.req_exact_legend ?? 12}
                  onChange={(e) => update('req_exact_legend', Number(e.target.value))}
                  className="input w-full text-center"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn btn-primary w-full md:w-auto">
        {saving ? 'Guardando...' : 'Guardar toda la configuración'}
      </button>
    </div>
  )
}
