'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Flag from '@/components/Flag'
import { PHASE_LABELS, type Phase, type Team } from '@/lib/types'
import { getMatchStatus, getMatchScores } from '@/lib/utils'

interface SpecialPrediction {
  champion_team_id: number | null
  runner_up_team_id: number | null
  third_team_id: number | null
  fourth_team_id: number | null
}

interface MatchWithScore {
  id: number
  phase: Phase
  group_code: string | null
  match_number: number
  kickoff_at: string | null
  home_team_id: number | null
  away_team_id: number | null
  home_team_label: string | null
  away_team_label: string | null
  home_score: number | null
  away_score: number | null
  shootout_winner_team_id: number | null
  status: string
  home_team?: Team
  away_team?: Team
  prediction: {
    home_score: number | null
    away_score: number | null
    ko_winner_team_id: number | null
  } | null
  score: {
    points: number
  } | null
}

interface SummaryStats {
  totalPoints: number
  exactMatches: number
  partialMatches: number
  rank: number
}

type Filter = 'all' | 'hits' | 'misses'

export default function SummaryClient({
  entryAlias,
  ownerName,
  isOwner,
  matches,
  teams,
  specialPredictions,
  showSpecialPredictions,
  stats,
}: {
  entryAlias: string
  ownerName: string
  isOwner: boolean
  matches: MatchWithScore[]
  teams: Team[]
  specialPredictions: SpecialPrediction | null
  showSpecialPredictions: boolean
  stats: SummaryStats
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<Filter>('all')

  // Agrupar partidos por fase
  const matchesByPhase = useMemo(() => {
    const phases: Phase[] = ['group', 'r32', 'r16', 'qf', 'sf', 'third', 'final']
    return phases.map((phase) => ({
      phase,
      matches: matches.filter((m) => m.phase === phase),
    })).filter((g) => g.matches.length > 0)
  }, [matches])

  // Filtrar partidos según filtro activo
  const filteredMatchesByPhase = useMemo(() => {
    if (filter === 'all') return matchesByPhase

    return matchesByPhase.map((group) => ({
      ...group,
      matches: group.matches.filter((m) => {
        if (m.status !== 'finished') return true // Mostrar partidos no finalizados siempre
        const points = m.score?.points || 0
        if (filter === 'hits') return points > 0
        if (filter === 'misses') return points === 0
        return true
      }),
    })).filter((g) => g.matches.length > 0)
  }, [matchesByPhase, filter])

  const isExactMatch = (m: MatchWithScore): boolean => {
    if (!m.prediction || m.status !== 'finished') return false
    return m.prediction.home_score === m.home_score && m.prediction.away_score === m.away_score
  }

  const formatScore = (home: number | null, away: number | null): string => {
    if (home === null || away === null) return '- : -'
    return `${home} - ${away}`
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/entries"
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-fifaGreen mb-3 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Mis Quinielas
        </Link>
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
          {isOwner ? 'Resumen Detallado' : 'Expediente de Juego'}
        </h1>
        <p className="text-white/60 text-sm">
          <span className="label-up">{isOwner ? 'Quiniela' : 'Jugador'}:</span>{' '}
          <span className="text-white font-bold uppercase">{isOwner ? entryAlias : ownerName}</span>
          {!isOwner && (
            <>
              {' · '}
              <span className="text-white/80">Jugada: {entryAlias}</span>
            </>
          )}
        </p>
      </div>

      {/* Panel de Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="card p-4 text-center">
          <div className="text-3xl font-black text-fifaGreen mb-1">
            {stats.totalPoints}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Puntos Totales
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-3xl font-black text-white mb-1">
            {stats.exactMatches}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Plenos
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-3xl font-black text-white mb-1">
            {stats.partialMatches}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Aciertos
          </div>
        </div>
        
        <div className="card p-4 text-center">
          <div className="text-3xl font-black text-fifaGreen mb-1">
            #{stats.rank}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/40">
            Posición
          </div>
        </div>
      </div>

      {/* Sección de Podio */}
      {showSpecialPredictions && specialPredictions && (
        <div className="card p-5 mb-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-white mb-4">
            🏆 Podio Pronosticado
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: '🥇 Campeón', teamId: specialPredictions.champion_team_id },
              { label: '🥈 Subcampeón', teamId: specialPredictions.runner_up_team_id },
              { label: '🥉 Tercer Lugar', teamId: specialPredictions.third_team_id },
              { label: '4° Lugar', teamId: specialPredictions.fourth_team_id },
            ].map((item, idx) => {
              const team = teams.find(t => t.id === item.teamId)
              return (
                <div key={idx} className="bg-white/5 rounded-lg p-3 text-center">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-white/60 mb-2">
                    {item.label}
                  </div>
                  {team ? (
                    <div className="flex flex-col items-center gap-2">
                      <Flag team={team} size={24} />
                      <div className="text-xs font-bold text-white">{team.name}</div>
                    </div>
                  ) : (
                    <div className="text-xs text-white/40">Sin elegir</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'all'
              ? 'bg-fifaGreen text-navy-deepest'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('hits')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'hits'
              ? 'bg-fifaGreen text-navy-deepest'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
          }`}
        >
          Aciertos
        </button>
        <button
          onClick={() => setFilter('misses')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            filter === 'misses'
              ? 'bg-fifaGreen text-navy-deepest'
              : 'bg-white/5 border border-white/10 text-white/60 hover:text-white'
          }`}
        >
          Fallos
        </button>
      </div>

      {/* Gran Tabla de Auditoría */}
      <div className="space-y-6">
        {filteredMatchesByPhase.map((group) => (
          <div key={group.phase}>
            <h2 className="text-lg font-black uppercase tracking-tight text-white mb-3 flex items-center gap-2">
              <span className="bg-fifaGreen/20 text-fifaGreen px-3 py-1 rounded-lg text-sm">
                {PHASE_LABELS[group.phase]}
              </span>
              <span className="text-xs text-white/40 font-normal">
                {group.matches.length} {group.matches.length === 1 ? 'partido' : 'partidos'}
              </span>
            </h2>

            <div className="space-y-2">
              {group.matches.map((m) => {
                const isExact = isExactMatch(m)
                const points = m.score?.points || 0
                const hasPoints = points > 0
                
                // Usar funciones centralizadas para estado y marcador
                const status = getMatchStatus(m)
                const [homeScore, awayScore] = getMatchScores(m)
                const isFinished = status === 'finished'
                const isLive = status === 'live'
                const hasScore = homeScore !== null && awayScore !== null
                const hasPrediction = m.prediction && m.prediction.home_score !== null && m.prediction.away_score !== null

                return (
                  <div
                    key={m.id}
                    className={`card p-3 transition-all ${
                      isExact
                        ? 'border-2 border-fifaGreen bg-fifaGreen/5'
                        : hasPoints && isFinished
                        ? 'border border-green-500/30 bg-green-500/5'
                        : ''
                    }`}
                  >
                    <div className="grid grid-cols-[50px_1fr_auto_1fr_80px] gap-3 items-center">
                      {/* Match Number */}
                      <div className="text-center">
                        <div className="text-xs font-black text-white/40">
                          M{m.match_number}
                        </div>
                        {isLive && (
                          <div className="text-[9px] text-red-500 uppercase font-bold mt-1">EN VIVO</div>
                        )}
                      </div>

                      {/* Equipos */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {m.home_team && <Flag team={m.home_team} size={14} />}
                          <span className="text-xs font-bold text-white truncate">
                            {m.home_team?.name || m.home_team_label || 'TBD'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.away_team && <Flag team={m.away_team} size={14} />}
                          <span className="text-xs font-bold text-white truncate">
                            {m.away_team?.name || m.away_team_label || 'TBD'}
                          </span>
                        </div>
                      </div>

                      {/* Pronóstico vs Resultado */}
                      <div className="text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          {isOwner ? 'Mi Pronóstico' : 'Su Pronóstico'}
                        </div>
                        {!isOwner && status === 'scheduled' ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-2xl">🔒</div>
                            <div className="text-[9px] text-white/40 text-center max-w-[100px]">
                              Privado hasta el inicio
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className={`text-sm font-mono font-bold ${
                              hasPrediction ? 'text-white' : 'text-white/20'
                            }`}>
                              {hasPrediction
                                ? formatScore(m.prediction!.home_score, m.prediction!.away_score)
                                : '- : -'}
                            </div>
                            {m.prediction?.ko_winner_team_id && m.prediction.home_score === m.prediction.away_score && (
                              <div className="text-[9px] text-yellow-400 mt-1">
                                Penales: {teams.find(t => t.id === m.prediction!.ko_winner_team_id)?.name}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      <div className="text-center">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                          Resultado Real
                        </div>
                        <div className={`text-sm font-mono font-bold ${
                          hasScore ? (isLive ? 'text-red-500 animate-pulse' : 'text-white') : 'text-white/20'
                        }`}>
                          {hasScore
                            ? formatScore(homeScore, awayScore)
                            : '- : -'}
                        </div>
                        {m.shootout_winner_team_id && m.home_score === m.away_score && (
                          <div className="text-[9px] text-yellow-400 mt-1">
                            Penales: {teams.find(t => t.id === m.shootout_winner_team_id)?.name}
                          </div>
                        )}
                      </div>

                      {/* Puntos */}
                      <div className="text-center">
                        {isExact && (
                          <div className="bg-fifaGreen text-navy-deepest text-[9px] font-black uppercase px-2 py-0.5 rounded-full mb-1">
                            ¡PLENO!
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-1">
                          {isFinished && (
                            <>
                              {hasPoints ? (
                                <svg className="w-4 h-4 text-fifaGreen" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4 text-red-500/50" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              )}
                            </>
                          )}
                          <span className={`text-xl font-black ${
                            hasPoints
                              ? isExact
                                ? 'text-fifaGreen'
                                : 'text-green-400'
                              : isFinished
                              ? 'text-white/20'
                              : 'text-white/40'
                          }`}>
                            {isFinished ? (points > 0 ? `+${points}` : '0') : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredMatchesByPhase.length === 0 && (
        <div className="card p-8 text-center">
          <p className="text-white/60">
            No hay partidos que mostrar con el filtro seleccionado.
          </p>
        </div>
      )}
    </div>
  )
}
