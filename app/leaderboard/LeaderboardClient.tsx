'use client'

import { useState } from 'react'
import { Info } from 'lucide-react'
import Flag from '@/components/Flag'
import type { LeaderboardRow, Match, Team, Prediction } from '@/lib/types'
import { AVATAR_PATHS } from '@/lib/avatars'
import { getMatchStatus, getMatchScores } from '@/lib/utils'

interface Props {
  user: { id: string }
  rows: LeaderboardRow[]
  recentMatches: Match[]
  teams: Team[]
  predictions: Prediction[]
  dataError: string | null
}

export default function LeaderboardClient({ user, rows, recentMatches, teams, predictions, dataError }: Props) {
  const [showTooltip, setShowTooltip] = useState(false)

  const teamsById = teams.reduce((acc, t) => {
    if (t?.id) acc[t.id] = t
    return acc
  }, {} as Record<number, Team>)

  const predsByEntry = predictions.reduce((acc, p) => {
    if (p?.entry_id && p?.match_id) {
      if (!acc[p.entry_id]) acc[p.entry_id] = {}
      acc[p.entry_id][p.match_id] = p
    }
    return acc
  }, {} as Record<number, Record<number, Prediction>>)

  return (
    <>
      {dataError && (
        <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 mb-4 text-sm">
          <div className="font-bold mb-1">Error al cargar datos</div>
          <div className="text-xs opacity-80">{dataError}</div>
          <div className="text-xs opacity-60 mt-2">
            Si el problema persiste, contacta al administrador.
          </div>
        </div>
      )}

      {/* Tooltip de Reglas de Desempate */}
      <div className="relative inline-block mb-6">
        <button
          className="flex items-center gap-2 text-white/60 hover:text-fifaGreen transition-colors text-xs uppercase tracking-wider"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={14} />
          <span>Criterios de Desempate</span>
        </button>
        {showTooltip && (
          <div className="absolute left-0 top-full mt-2 w-80 bg-navy-dark border border-fifaGreen/30 rounded-lg p-4 shadow-xl z-50">
            <h4 className="text-xs font-bold uppercase tracking-wider text-fifaGreen mb-3">Reglas de Desempate</h4>
            <ol className="space-y-2 text-[10px] text-white/80">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 text-fifaGreen font-bold">1.</span>
                <span>Mayor cantidad de resultados exactos acertados durante todo el torneo.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 text-fifaGreen font-bold">2.</span>
                <span>Mayor cantidad de aciertos de ganador en partidos eliminatorios.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 text-fifaGreen font-bold">3.</span>
                <span>Mayor cantidad de resultados exactos en partidos eliminatorios.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 text-fifaGreen font-bold">4.</span>
                <span>Mayor cantidad de puntos obtenidos en la fase eliminatoria.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 text-gold font-bold">5.</span>
                <span>Acierto del campeón del Mundial.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 text-gold font-bold">6.</span>
                <span>Acierto del subcampeón del Mundial.</span>
              </li>
            </ol>
          </div>
        )}
      </div>

      <div className="card p-2 sm:p-3">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-white/40 uppercase tracking-wider text-sm">
            {dataError ? 'No se pudieron cargar los datos' : 'Aún no hay jugadas registradas'}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-hide">
            <div className="min-w-[700px]">
              <div className={`grid items-center gap-2 px-2 py-2 label-up border-b border-white/10`}
                style={{
                  gridTemplateColumns: `36px 1fr 40px 40px 60px 60px 70px ${recentMatches.map(() => '72px').join(' ')}`
                }}>
                <div>#</div>
                <div className="min-w-[140px]">Quiniela</div>
                <div className="text-center text-lg hidden md:table-cell" title="Exactos totales">🎯</div>
                <div className="text-center text-lg hidden md:table-cell" title="Aciertos en eliminatorias">🔥</div>
                <div className="text-right hidden md:table-cell">Partidos</div>
                <div className="text-right hidden md:table-cell">Esp.</div>
                <div className="text-right">Total</div>
                {recentMatches.map((m) => {
                  const homeTeam = m?.home_team_id ? teamsById[m.home_team_id] : null
                  const awayTeam = m?.away_team_id ? teamsById[m.away_team_id] : null
                  
                  // Usar funciones centralizadas para estado y marcador
                  const status = getMatchStatus(m)
                  const [homeScore, awayScore] = getMatchScores(m)
                  const isLive = status === 'live'
                  const isFinished = status === 'finished'
                  const hasScore = homeScore !== null && awayScore !== null
                  
                  return (
                    <div key={m?.id ?? Math.random()} className="flex flex-col items-center gap-1 min-w-[60px]">
                      <div className="flex items-center gap-0.5">
                        {homeTeam && <Flag team={homeTeam} size={8} className="md:w-[10px] md:h-[10px]" />}
                        <span className="text-[8px] text-white/40">-</span>
                        {awayTeam && <Flag team={awayTeam} size={8} className="md:w-[10px] md:h-[10px]" />}
                      </div>
                      {hasScore && (
                        <div className={`px-1.5 py-0.5 md:px-2 rounded text-[11px] md:text-sm font-black ${
                          isLive 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : isFinished
                            ? 'bg-fifaGreen text-navy-deepest'
                            : 'text-white/60'
                        }`}>
                          {homeScore}-{awayScore}
                        </div>
                      )}
                      {isLive && (
                        <div className="text-[7px] text-red-500 uppercase font-bold">EN VIVO</div>
                      )}
                    </div>
                  )
                })}
              </div>
              {rows.map((row, idx) => {
                const isMe = row?.user_id === user?.id
                const medal = idx === 0 ? 'text-gold' : idx < 3 ? 'text-fifaGreen' : 'text-white/40'
                return (
                  <div key={row?.entry_id ?? idx}
                    className={`grid items-center gap-2 px-2 py-4 border-b border-white/5 last:border-0 ${
                      isMe ? 'bg-gold/10 rounded-lg' : ''
                    }`}
                    style={{
                      gridTemplateColumns: `36px 1fr 40px 40px 60px 60px 70px ${recentMatches.map(() => '72px').join(' ')}`
                    }}>
                    <div className="flex items-center gap-1">
                      <span className={`text-base font-extrabold ${medal}`}>{idx + 1}</span>
                      {row.previous_rank && row.rank_movement !== 0 && (
                        <span className={`text-[10px] font-black ${
                          row.rank_movement > 0 ? 'text-green-400' : 'text-red-400'
                        }`} title={`${row.rank_movement > 0 ? 'Subió' : 'Bajó'} ${Math.abs(row.rank_movement)} posiciones`}>
                          {row.rank_movement > 0 ? '▲' : '▼'}{Math.abs(row.rank_movement)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 min-w-[140px]">
                      {/* Avatar con bandera */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 ${
                          row?.rank === 1 
                            ? 'border-gold shadow-lg shadow-gold/50' 
                            : 'border-white/20'
                        } bg-white/10`}>
                          <img
                            src={row?.display_avatar ?? AVATAR_PATHS.default}
                            alt={row?.alias ?? 'Avatar'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = AVATAR_PATHS.default
                            }}
                          />
                        </div>
                        {/* Bandera superpuesta */}
                        {row?.country_code && (
                          <Flag 
                            team={{ iso_code: row.country_code }} 
                            size={16} 
                            className="absolute -bottom-0.5 -right-0.5 drop-shadow-md"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <a 
                            href={`/predictions/summary?entry=${row?.entry_id}`}
                            className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight truncate hover:text-fifaGreen transition-colors cursor-pointer"
                          >
                            {row?.alias ?? 'Sin nombre'}
                          </a>
                          {isMe && <span className="badge bg-gold text-navy-deepest">Tú</span>}
                          {!row?.paid && <span className="badge bg-danger/30 text-danger">Sin pagar</span>}
                        </div>
                        <div className="text-[10px] text-white/40 truncate">
                          {row?.display_name || 'Anónimo'}
                          <span className="sm:hidden"> · {row?.match_points ?? 0}G + {row?.special_points ?? 0}E</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-white/60 text-base font-semibold hidden md:table-cell" title="Exactos totales">{row?.total_exact ?? 0}</div>
                    <div className="text-center text-white/60 text-base font-semibold hidden md:table-cell" title="Aciertos en eliminatorias">{row?.ko_winner_count ?? 0}</div>
                    <div className="text-right text-white/60 text-sm hidden md:table-cell">{row?.match_points ?? 0}</div>
                    <div className="text-right text-white/60 text-sm hidden md:table-cell">{row?.special_points ?? 0}</div>
                    <div className="text-right font-extrabold text-white text-base sm:text-lg">{row?.total_points ?? 0}</div>
                    {recentMatches.map((m) => {
                      const pred = row?.entry_id && m?.id ? predsByEntry[row.entry_id]?.[m.id] : null
                      const hasPred = pred && pred.home_score !== null && pred.away_score !== null
                      
                      // Usar funciones centralizadas para estado y marcador
                      const status = getMatchStatus(m)
                      const [homeScore, awayScore] = getMatchScores(m)
                      const isFinished = status === 'finished'
                      const hasMatchScore = homeScore !== null && awayScore !== null
                      
                      // Calcular si el pronóstico acertó
                      let hasPoints = false
                      if (hasPred && isFinished && hasMatchScore) {
                        // Marcador exacto
                        const isExact = pred.home_score === homeScore && pred.away_score === awayScore
                        // Ganador correcto (mismo signo)
                        const predSign = Math.sign((pred.home_score ?? 0) - (pred.away_score ?? 0))
                        const matchSign = Math.sign((homeScore ?? 0) - (awayScore ?? 0))
                        const isWinnerCorrect = predSign === matchSign
                        hasPoints = isExact || isWinnerCorrect
                      }
                      
                      return (
                        <div key={m?.id ?? Math.random()} className="flex justify-center min-w-[60px]">
                          {hasPred ? (
                            <div className={`px-1.5 py-0.5 md:px-3 md:py-1 rounded-lg text-xs md:text-base font-bold bg-white/10 border ${
                              hasPoints
                                ? 'border-fifaGreen text-fifaGreen'
                                : isFinished
                                ? 'border-white/20 text-white/40'
                                : 'border-white/20 text-white/70'
                            }`}>
                              {pred.home_score}-{pred.away_score}
                            </div>
                          ) : (
                            <div className="text-sm text-white/20">-/-</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
