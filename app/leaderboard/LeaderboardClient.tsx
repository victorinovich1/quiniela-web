'use client'

import Flag from '@/components/Flag'
import type { LeaderboardRow, Match, Team, Prediction } from '@/lib/types'
import { AVATAR_PATHS } from '@/lib/avatars'

interface Props {
  user: { id: string }
  rows: LeaderboardRow[]
  recentMatches: Match[]
  teams: Team[]
  predictions: Prediction[]
  dataError: string | null
}

export default function LeaderboardClient({ user, rows, recentMatches, teams, predictions, dataError }: Props) {
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

  const updatedAt = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

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

      <div className="card p-2 sm:p-3">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-white/40 uppercase tracking-wider text-sm">
            {dataError ? 'No se pudieron cargar los datos' : 'Aún no hay jugadas registradas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className={`grid items-center gap-2 px-2 py-2 label-up border-b border-white/10`}
                style={{
                  gridTemplateColumns: `36px 1fr 60px 60px 70px ${recentMatches.map(() => '72px').join(' ')}`
                }}>
                <div>#</div>
                <div>Jugada</div>
                <div className="text-right hidden sm:block">Partidos</div>
                <div className="text-right hidden sm:block">Esp.</div>
                <div className="text-right">Total</div>
                {recentMatches.map((m) => {
                  const homeTeam = m?.home_team_id ? teamsById[m.home_team_id] : null
                  const awayTeam = m?.away_team_id ? teamsById[m.away_team_id] : null
                  const isLive = m?.status === 'live'
                  const isFinished = m?.status === 'finished'
                  const hasScore = m?.home_score !== null && m?.away_score !== null
                  return (
                    <div key={m?.id ?? Math.random()} className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-0.5">
                        {homeTeam && <Flag team={homeTeam} size={10} />}
                        <span className="text-[8px] text-white/40">-</span>
                        {awayTeam && <Flag team={awayTeam} size={10} />}
                      </div>
                      {hasScore && (
                        <div className={`px-2 py-0.5 rounded text-sm font-black ${
                          isLive 
                            ? 'bg-red-600 text-white animate-pulse' 
                            : isFinished
                            ? 'bg-fifaGreen text-navy-deepest'
                            : 'text-white/60'
                        }`}>
                          {m.home_score}-{m.away_score}
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
                      gridTemplateColumns: `36px 1fr 60px 60px 70px ${recentMatches.map(() => '72px').join(' ')}`
                    }}>
                    <div className={`text-base font-extrabold ${medal}`}>{idx + 1}</div>
                    <div className="flex items-center gap-3 min-w-0">
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
                          <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight truncate">{row?.alias ?? 'Sin nombre'}</span>
                          {isMe && <span className="badge bg-gold text-navy-deepest">Tú</span>}
                          {!row?.paid && <span className="badge bg-danger/30 text-danger">Sin pagar</span>}
                        </div>
                        <div className="text-[10px] text-white/40 truncate">
                          {row?.display_name || 'Anónimo'}
                          <span className="sm:hidden"> · {row?.match_points ?? 0}G + {row?.special_points ?? 0}E</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-white/60 text-sm hidden sm:block">{row?.match_points ?? 0}</div>
                    <div className="text-right text-white/60 text-sm hidden sm:block">{row?.special_points ?? 0}</div>
                    <div className="text-right font-extrabold text-white text-base sm:text-lg">{row?.total_points ?? 0}</div>
                    {recentMatches.map((m) => {
                      const pred = row?.entry_id && m?.id ? predsByEntry[row.entry_id]?.[m.id] : null
                      const hasPred = pred && pred.home_score !== null && pred.away_score !== null
                      const isFinished = m?.status === 'finished'
                      const hasMatchScore = m?.home_score !== null && m?.away_score !== null
                      
                      // Calcular si el pronóstico acertó
                      let hasPoints = false
                      if (hasPred && isFinished && hasMatchScore) {
                        // Marcador exacto
                        const isExact = pred.home_score === m.home_score && pred.away_score === m.away_score
                        // Ganador correcto (mismo signo)
                        const predSign = Math.sign((pred.home_score ?? 0) - (pred.away_score ?? 0))
                        const matchSign = Math.sign((m.home_score ?? 0) - (m.away_score ?? 0))
                        const isWinnerCorrect = predSign === matchSign
                        hasPoints = isExact || isWinnerCorrect
                      }
                      
                      return (
                        <div key={m?.id ?? Math.random()} className="flex justify-center">
                          {hasPred ? (
                            <div className={`px-3 py-1 rounded-lg text-base font-bold bg-white/10 border ${
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
