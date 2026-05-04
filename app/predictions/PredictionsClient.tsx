'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { computeGroupStandings } from '@/lib/standings'
import Flag from '@/components/Flag'
import {
  GROUP_CODES,
  KO_PHASES,
  PHASE_LABELS,
  type Entry,
  type Match,
  type Phase,
  type Prediction,
  type SpecialPrediction,
  type Team,
} from '@/lib/types'

type Tab = 'grupos' | 'eliminatorias' | 'especiales'
type PredMap = Record<number, { home: number | null; away: number | null; ko: number | null }>
type SpecialState = {
  champion_team_id: number | null
  runner_up_team_id: number | null
  third_team_id: number | null
  fourth_team_id: number | null
  top_scorer: string
  mvp: string
  best_goalkeeper: string
  revelation_team_id: number | null
  disappointment_team_id: number | null
}

function emptySpecial(): SpecialState {
  return {
    champion_team_id: null, runner_up_team_id: null, third_team_id: null, fourth_team_id: null,
    top_scorer: '', mvp: '', best_goalkeeper: '',
    revelation_team_id: null, disappointment_team_id: null,
  }
}

export default function PredictionsClient({
  entries, activeEntryId, teams, matches, predictions, special, lockAt, locked,
}: {
  entries: Entry[]
  activeEntryId: number
  teams: Team[]
  matches: Match[]
  predictions: Prediction[]
  special: SpecialPrediction | null
  lockAt: string | null
  locked: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('grupos')
  const [activeGroup, setActiveGroup] = useState<string>(GROUP_CODES[0])
  const [activePhase, setActivePhase] = useState<Phase>('r32')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<string>('')

  const activeEntry = entries.find((e) => e.id === activeEntryId) || entries[0]

  const userTimeZone = useMemo(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone }
    catch { return 'UTC' }
  }, [])

  const initialPreds: PredMap = useMemo(() => {
    const m: PredMap = {}
    for (const p of predictions) {
      m[p.match_id] = { home: p.home_score, away: p.away_score, ko: p.ko_winner_team_id }
    }
    return m
  }, [predictions])

  const [preds, setPreds] = useState<PredMap>(initialPreds)
  const [specialState, setSpecialState] = useState<SpecialState>(() => {
    if (!special) return emptySpecial()
    return {
      champion_team_id: special.champion_team_id,
      runner_up_team_id: special.runner_up_team_id,
      third_team_id: special.third_team_id,
      fourth_team_id: special.fourth_team_id,
      top_scorer: special.top_scorer ?? '',
      mvp: special.mvp ?? '',
      best_goalkeeper: special.best_goalkeeper ?? '',
      revelation_team_id: special.revelation_team_id,
      disappointment_team_id: special.disappointment_team_id,
    }
  })

  useEffect(() => {
    if (!lockAt) return
    function tick() {
      const target = new Date(lockAt!).getTime()
      const diff = target - Date.now()
      if (diff <= 0) { setCountdown(''); return }
      const days = Math.floor(diff / (1000*60*60*24))
      const hours = Math.floor((diff/(1000*60*60))%24)
      const mins = Math.floor((diff/(1000*60))%60)
      const secs = Math.floor((diff/1000)%60)
      setCountdown(`${days}d ${hours}h ${mins}m ${secs}s`)
    }
    tick()
    const i = setInterval(tick, 1000)
    return () => clearInterval(i)
  }, [lockAt])

  const teamsById = useMemo(() => {
    const m: Record<number, Team> = {}
    for (const t of teams) m[t.id] = t
    return m
  }, [teams])

  function setScore(matchId: number, key: 'home' | 'away', value: string) {
    if (locked) return
    setPreds((prev) => {
      const cur = prev[matchId] ?? { home: null, away: null, ko: null }
      const num = value === '' ? null : Math.max(0, Math.min(99, Number(value)))
      const next = { ...cur, [key]: Number.isNaN(num as number) ? null : num }
      if (next.home !== null && next.away !== null && next.home !== next.away) next.ko = null
      return { ...prev, [matchId]: next }
    })
  }

  function setKoWinner(matchId: number, teamId: number | null) {
    if (locked) return
    setPreds((prev) => {
      const cur = prev[matchId] ?? { home: null, away: null, ko: null }
      return { ...prev, [matchId]: { ...cur, ko: teamId } }
    })
  }

  async function handleSave() {
    setError(null); setSaving(true)
    try {
      const supabase = createClient()
      const rows: Prediction[] = []
      for (const m of matches) {
        const p = preds[m.id]
        if (!p) continue
        if (p.home === null && p.away === null && p.ko === null) continue
        rows.push({ entry_id: activeEntryId, match_id: m.id, home_score: p.home, away_score: p.away, ko_winner_team_id: p.ko })
      }
      if (rows.length > 0) {
        const { error: predErr } = await supabase.from('predictions').upsert(rows, { onConflict: 'entry_id,match_id' })
        if (predErr) throw predErr
      }
      const { error: specErr } = await supabase.from('special_predictions').upsert({
        entry_id: activeEntryId,
        champion_team_id: specialState.champion_team_id,
        runner_up_team_id: specialState.runner_up_team_id,
        third_team_id: specialState.third_team_id,
        fourth_team_id: specialState.fourth_team_id,
        top_scorer: specialState.top_scorer || null,
        mvp: specialState.mvp || null,
        best_goalkeeper: specialState.best_goalkeeper || null,
        revelation_team_id: specialState.revelation_team_id,
        disappointment_team_id: specialState.disappointment_team_id,
      }, { onConflict: 'entry_id' })
      if (specErr) throw specErr
      setSavedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  function switchEntry(id: number) {
    router.push(`/predictions?entry=${id}`)
  }

  return (
    <div className="pb-32">
      {entries.length > 1 ? (
        <div className="mb-4 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-2">
          <span className="label-up px-2">Jugada</span>
          <select
            value={activeEntryId}
            onChange={(e) => switchEntry(Number(e.target.value))}
            className="flex-1 bg-transparent font-bold text-white focus:outline-none text-sm uppercase"
          >
            {entries.map((e) => (
              <option key={e.id} value={e.id} className="bg-navy-deepest text-white">{e.alias}</option>
            ))}
          </select>
          <a href="/entries" className="text-xs text-fifaGreen hover:text-fifaGreen-light whitespace-nowrap font-bold uppercase tracking-wider">Gestionar</a>
        </div>
      ) : (
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="text-white/60">
            <span className="label-up">Jugada</span>{' '}
            <span className="font-bold text-white uppercase">{activeEntry?.alias}</span>
          </span>
          <a href="/entries" className="text-xs text-fifaGreen hover:text-fifaGreen-light font-bold uppercase tracking-wider">+ Nueva</a>
        </div>
      )}

      {locked && (
        <div className="bg-danger/15 border border-danger/40 text-danger rounded-xl p-3 mb-4 text-sm font-bold uppercase tracking-wider">
          Pronósticos bloqueados — ya empezó el Mundial
        </div>
      )}

      {!locked && countdown && (
        <div className="bg-fifaGreen/10 border border-fifaGreen/30 rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="label-up text-fifaGreen">Tiempo para guardar</span>
          <span className="font-mono font-extrabold text-white text-lg">{countdown}</span>
        </div>
      )}

      <div className="bg-accent-blue/5 border border-white/10 rounded-xl px-3 py-2 mb-4 text-xs flex items-center gap-2 text-white/70">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
        <span>Horarios en tu hora local <span className="text-white/40 hidden sm:inline">({userTimeZone})</span></span>
      </div>

      <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-5 sticky top-14 z-30 backdrop-blur-md">
        {([['grupos','Grupos'],['eliminatorias','Eliminatorias'],['especiales','Especiales']] as [Tab,string][]).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
              tab === key ? 'bg-fifaGreen text-navy-deepest' : 'text-white/60 hover:text-white'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'grupos' && (
        <GruposTab
          activeGroup={activeGroup}
          setActiveGroup={setActiveGroup}
          teams={teams}
          matches={matches}
          preds={preds}
          setScore={setScore}
          locked={locked}
          teamsById={teamsById}
        />
      )}

      {tab === 'eliminatorias' && (
        <EliminatoriasTab
          activePhase={activePhase}
          setActivePhase={setActivePhase}
          matches={matches}
          teams={teams}
          preds={preds}
          setScore={setScore}
          setKoWinner={setKoWinner}
          locked={locked}
          teamsById={teamsById}
        />
      )}

      {tab === 'especiales' && (
        <EspecialesTab teams={teams} state={specialState} setState={setSpecialState} locked={locked} />
      )}

      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-navy-deepest/95 backdrop-blur-md border-t border-white/10 p-3 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="text-xs uppercase tracking-wider truncate">
            {error ? <span className="text-danger">{error}</span>
            : savedAt ? <span className="text-fifaGreen font-bold">✓ Guardado · {savedAt.toLocaleTimeString('es-ES')}</span>
            : locked ? <span className="text-white/40">Bloqueado</span>
            : <span className="text-white/40">Guarda tus cambios</span>}
          </div>
          <button onClick={handleSave} disabled={saving || locked} className="btn btn-primary whitespace-nowrap">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// GRUPOS — vista compacta tipo FIFA, un grupo por pantalla
// ============================================================
function GruposTab({
  activeGroup, setActiveGroup, teams, matches, preds, setScore, locked, teamsById,
}: {
  activeGroup: string
  setActiveGroup: (g: string) => void
  teams: Team[]
  matches: Match[]
  preds: PredMap
  setScore: (matchId: number, key: 'home' | 'away', value: string) => void
  locked: boolean
  teamsById: Record<number, Team>
}) {
  const groupTeams = teams
    .filter((t) => t.group_code === activeGroup)
    .sort((a, b) => (a.position_in_group ?? 0) - (b.position_in_group ?? 0))

  const groupMatches = matches
    .filter((m) => m.phase === 'group' && m.group_code === activeGroup)
    .sort((a, b) => {
      const ta = a.kickoff_at ? new Date(a.kickoff_at).getTime() : 0
      const tb = b.kickoff_at ? new Date(b.kickoff_at).getTime() : 0
      return ta - tb || a.match_number - b.match_number
    })

  // Group matches by date (for matchday separators)
  const matchdays: { label: string; matches: Match[] }[] = []
  for (const m of groupMatches) {
    if (!m.kickoff_at) continue
    const d = new Date(m.kickoff_at)
    const dayKey = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
    const last = matchdays[matchdays.length - 1]
    if (last && last.label === dayKey) last.matches.push(m)
    else matchdays.push({ label: dayKey, matches: [m] })
  }

  const standings = computeGroupStandings(
    activeGroup, teams, matches,
    Object.fromEntries(Object.entries(preds).map(([id, v]) => [Number(id), { home: v.home, away: v.away }]))
  )

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-5">
        {GROUP_CODES.map((g) => (
          <button key={g} onClick={() => setActiveGroup(g)}
            className={`min-w-[40px] h-10 rounded-lg font-extrabold transition-all ${
              activeGroup === g
                ? 'bg-fifaGreen text-navy-deepest scale-105'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10'
            }`}>
            {g}
          </button>
        ))}
      </div>

      <div className="bg-fifaGreen/10 border border-fifaGreen/30 rounded-2xl p-4 mb-5 relative overflow-hidden">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="bg-fifaGreen rounded-lg px-3 py-2 sm:px-4 sm:py-3 flex flex-col items-center flex-shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold text-navy-deepest tracking-widest leading-none">GRUPO</span>
            <span className="text-2xl sm:text-3xl font-black text-navy-deepest leading-none mt-0.5">{activeGroup}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 flex-1 min-w-0">
            {groupTeams.map((t) => (
              <div key={t.id} className="bg-white rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 inline-flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Flag team={t} size={14} />
                <span className="text-[10px] sm:text-xs font-extrabold text-slate-900 uppercase tracking-tight truncate">{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {matchdays.map((md, idx) => (
        <div key={md.label}>
          <div className="divider-with-label">
            <span>Jornada {idx + 1} · {md.label.toUpperCase()}</span>
          </div>
          <div className="space-y-2">
            {md.matches.map((m) => (
              <FifaMatchRow key={m.id} match={m} preds={preds} setScore={setScore}
                locked={locked} teamsById={teamsById} />
            ))}
          </div>
        </div>
      ))}

      <div className="divider-with-label mt-8">
        <span>Tabla Grupo {activeGroup}</span>
      </div>
      <div className="card p-3">
        <table className="w-full text-sm">
          <thead className="text-[10px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="text-left py-2 pl-1">#</th>
              <th className="text-left py-2">Equipo</th>
              <th className="text-center py-2 w-8">PJ</th>
              <th className="text-center py-2 w-8">G</th>
              <th className="text-center py-2 w-8">E</th>
              <th className="text-center py-2 w-8">P</th>
              <th className="text-center py-2 w-10">DG</th>
              <th className="text-center py-2 w-10">PTS</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((s, i) => {
              const t = groupTeams.find((tt) => tt.id === s.team_id)
              const top2 = i < 2
              return (
                <tr key={s.team_id} className="border-t border-white/5">
                  <td className="py-2 pl-1">
                    <span className={`text-xs font-extrabold ${top2 ? 'text-fifaGreen' : 'text-white/40'}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      {t && <Flag team={t} size={14} />}
                      <span className="text-xs font-bold text-white uppercase truncate">{s.team_name}</span>
                    </div>
                  </td>
                  <td className="text-center text-white/60">{s.pj}</td>
                  <td className="text-center text-white/80">{s.pg}</td>
                  <td className="text-center text-white/80">{s.pe}</td>
                  <td className="text-center text-white/80">{s.pp}</td>
                  <td className="text-center text-white/80">{s.dg}</td>
                  <td className="text-center font-extrabold text-white">{s.pts}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================================
// ELIMINATORIAS — una fase por pantalla
// ============================================================
function EliminatoriasTab({
  activePhase, setActivePhase, matches, teams, preds, setScore, setKoWinner, locked, teamsById,
}: {
  activePhase: Phase
  setActivePhase: (p: Phase) => void
  matches: Match[]
  teams: Team[]
  preds: PredMap
  setScore: (matchId: number, key: 'home' | 'away', value: string) => void
  setKoWinner: (matchId: number, teamId: number | null) => void
  locked: boolean
  teamsById: Record<number, Team>
}) {
  const phaseMatches = matches
    .filter((m) => m.phase === activePhase)
    .sort((a, b) => a.match_number - b.match_number)

  const SHORT: Record<Phase, string> = {
    group: '', r32: '16avos', r16: 'Octavos', qf: 'Cuartos', sf: 'Semis', third: '3er', final: 'Final',
  }

  return (
    <div>
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {KO_PHASES.map((p) => (
          <button key={p} onClick={() => setActivePhase(p)}
            className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-extrabold uppercase tracking-wider whitespace-nowrap transition-all ${
              activePhase === p
                ? 'bg-fifaGreen text-navy-deepest'
                : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
            }`}>
            {SHORT[p]}
          </button>
        ))}
      </div>

      <div className="text-center mb-5">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">{PHASE_LABELS[activePhase]}</h2>
        <p className="label-up mt-1">{phaseMatches.length} {phaseMatches.length === 1 ? 'partido' : 'partidos'}</p>
      </div>

      <div className="space-y-2">
        {phaseMatches.map((m) => (
          <FifaMatchRow key={m.id} match={m} preds={preds} setScore={setScore}
            locked={locked} teamsById={teamsById} showKoWinner setKoWinner={setKoWinner} teamsForKo={teams} />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// FILA DE PARTIDO — diseño FIFA con pills, hora izquierda, ciudad derecha
// ============================================================
function FifaMatchRow({
  match, preds, setScore, locked, teamsById, showKoWinner, setKoWinner, teamsForKo,
}: {
  match: Match
  preds: PredMap
  setScore: (matchId: number, key: 'home' | 'away', value: string) => void
  locked: boolean
  teamsById: Record<number, Team>
  showKoWinner?: boolean
  setKoWinner?: (matchId: number, teamId: number | null) => void
  teamsForKo?: Team[]
}) {
  const p = preds[match.id] ?? { home: null, away: null, ko: null }
  const homeTeam = match.home_team_id ? teamsById[match.home_team_id] : null
  const awayTeam = match.away_team_id ? teamsById[match.away_team_id] : null
  const homeLabel = homeTeam?.name || match.home_team_label || 'Por definir'
  const awayLabel = awayTeam?.name || match.away_team_label || 'Por definir'

  const showKoSelect = showKoWinner && p.home !== null && p.away !== null && p.home === p.away

  let koOptions: { id: number; name: string }[] = []
  if (showKoSelect) {
    if (homeTeam && awayTeam) {
      koOptions = [
        { id: homeTeam.id, name: homeTeam.name },
        { id: awayTeam.id, name: awayTeam.name },
      ]
    } else if (teamsForKo) {
      koOptions = teamsForKo.map((t) => ({ id: t.id, name: t.name }))
    }
  }

  const kickoff = match.kickoff_at ? new Date(match.kickoff_at) : null
  const timeStr = kickoff ? kickoff.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  const tzShort = kickoff ? kickoff.toLocaleTimeString('es-ES', { timeZoneName: 'short' }).split(' ').pop() : ''
  const dayStr = kickoff ? kickoff.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase() : ''

  // Compact stadium info
  const stadium = match.stadium || ''
  const stadiumParts = stadium.split(',').map((s) => s.trim())
  const cityShort = stadiumParts[1] || stadiumParts[0] || ''
  const venueShort = stadiumParts[0] || ''

  return (
    <div className="card p-3">
      <div className="grid grid-cols-[68px_1fr_auto_1fr_80px] sm:grid-cols-[80px_1fr_auto_1fr_100px] items-center gap-2 sm:gap-3">
        <div className="min-w-0">
          <div className="text-white font-extrabold text-sm sm:text-base leading-tight">{timeStr}</div>
          <div className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider">{tzShort} {dayStr && `· ${dayStr}`}</div>
        </div>

        {homeTeam ? (
          <div className="bg-white rounded-full px-2 py-1 sm:px-3 sm:py-1.5 inline-flex items-center gap-1.5 sm:gap-2 min-w-0 justify-end flex-row-reverse">
            <Flag team={homeTeam} size={14} />
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-900 uppercase tracking-tight truncate">{homeLabel}</span>
          </div>
        ) : (
          <div className="bg-white/10 rounded-full px-3 py-1.5 text-[10px] sm:text-xs text-white/50 font-bold uppercase truncate text-right">
            {homeLabel}
          </div>
        )}

        <div className="flex items-center gap-1">
          <input type="number" min={0} max={99} inputMode="numeric"
            value={p.home ?? ''}
            onChange={(e) => setScore(match.id, 'home', e.target.value)}
            disabled={locked}
            className="score-input w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg"
            aria-label={`Goles ${homeLabel}`} />
          <span className="text-white/30 text-xs">−</span>
          <input type="number" min={0} max={99} inputMode="numeric"
            value={p.away ?? ''}
            onChange={(e) => setScore(match.id, 'away', e.target.value)}
            disabled={locked}
            className="score-input w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg"
            aria-label={`Goles ${awayLabel}`} />
        </div>

        {awayTeam ? (
          <div className="bg-white rounded-full px-2 py-1 sm:px-3 sm:py-1.5 inline-flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Flag team={awayTeam} size={14} />
            <span className="text-[10px] sm:text-xs font-extrabold text-slate-900 uppercase tracking-tight truncate">{awayLabel}</span>
          </div>
        ) : (
          <div className="bg-white/10 rounded-full px-3 py-1.5 text-[10px] sm:text-xs text-white/50 font-bold uppercase truncate">
            {awayLabel}
          </div>
        )}

        <div className="text-right min-w-0">
          {cityShort && (
            <div className="text-[9px] sm:text-[10px] font-extrabold text-white uppercase truncate">{cityShort}</div>
          )}
          {venueShort && venueShort !== cityShort && (
            <div className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase truncate">{venueShort}</div>
          )}
        </div>
      </div>

      {showKoSelect && setKoWinner && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="label-up">Penales:</span>
          <select value={p.ko ?? ''}
            onChange={(e) => setKoWinner(match.id, e.target.value ? Number(e.target.value) : null)}
            disabled={locked}
            className="input flex-1 text-xs">
            <option value="" className="bg-navy-deepest">Selecciona ganador</option>
            {koOptions.map((t) => (
              <option key={t.id} value={t.id} className="bg-navy-deepest">{t.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}

// ============================================================
// ESPECIALES
// ============================================================
function EspecialesTab({
  teams, state, setState, locked,
}: {
  teams: Team[]
  state: SpecialState
  setState: (updater: (s: SpecialState) => SpecialState) => void
  locked: boolean
}) {
  const teamOptions = teams.slice().sort((a, b) => a.name.localeCompare(b.name))

  function teamSelect(label: string, field: keyof SpecialState) {
    const value = state[field]
    return (
      <div>
        <label className="label-up block mb-1.5">{label}</label>
        <select value={(value as number | null) ?? ''}
          onChange={(e) => setState((s) => ({ ...s, [field]: e.target.value ? Number(e.target.value) : null }))}
          disabled={locked}
          className="input">
          <option value="" className="bg-navy-deepest">Selecciona equipo</option>
          {teamOptions.map((t) => (
            <option key={t.id} value={t.id} className="bg-navy-deepest">{t.name}</option>
          ))}
        </select>
      </div>
    )
  }

  function textInput(label: string, field: 'top_scorer' | 'mvp' | 'best_goalkeeper') {
    return (
      <div>
        <label className="label-up block mb-1.5">{label}</label>
        <input type="text" value={state[field]}
          onChange={(e) => setState((s) => ({ ...s, [field]: e.target.value }))}
          disabled={locked} className="input" placeholder="Nombre del jugador" />
      </div>
    )
  }

  return (
    <div className="card p-5 space-y-5">
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Predicciones especiales</h2>
        <p className="label-up mt-1">Vale más puntos al final del torneo</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {teamSelect('Campeón', 'champion_team_id')}
        {teamSelect('Subcampeón', 'runner_up_team_id')}
        {teamSelect('Tercer lugar', 'third_team_id')}
        {teamSelect('Cuarto lugar', 'fourth_team_id')}
        {textInput('Goleador del torneo', 'top_scorer')}
        {textInput('Mejor jugador (MVP)', 'mvp')}
        {textInput('Mejor portero', 'best_goalkeeper')}
        {teamSelect('Equipo revelación', 'revelation_team_id')}
        {teamSelect('Equipo decepción', 'disappointment_team_id')}
      </div>
    </div>
  )
}
