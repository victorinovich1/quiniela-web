'use client'

import Flag from '@/components/Flag'
import type { LeaderboardRow, Match, Team, Prediction } from '@/lib/types'

interface Props {
  user: { id: string }
  rows: LeaderboardRow[]
  recentMatches: Match[]
  teams: Team[]
  predictions: Prediction[]
  dataError: string | null
}

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
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
                  gridTemplateColumns: `36px 1fr 60px 60px 64px ${recentMatches.map(() => '56px').join(' ')}`
                }}>
                <div>#</div>
                <div>Jugada</div>
                <div className="text-right hidden sm:block">Partidos</div>
                <div className="text-right hidden sm:block">Esp.</div>
                <div className="text-right">Total</div>
                {recentMatches.map((m) => {
                  const homeTeam = m?.home_team_id ? teamsById[m.home_team_id] : null
                  const awayTeam = m?.away_team_id ? teamsById[m.away_team_id] : null
                  return (
                    <div key={m?.id ?? Math.random()} className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-0.5">
                        {homeTeam && <Flag team={homeTeam} size={10} />}
                        <span className="text-[8px] text-white/40">-</span>
                        {awayTeam && <Flag team={awayTeam} size={10} />}
                      </div>
                      {(m?.home_score !== null && m?.away_score !== null) && (
                        <div className={`text-[9px] font-bold ${m?.status === 'live' ? 'text-red-500' : 'text-fifaGreen'}`}>
                          {m.home_score}-{m.away_score}
                        </div>
                      )}
                      {m?.status === 'live' && (
                        <div className="text-[7px] text-red-500 uppercase font-bold animate-pulse">Vivo</div>
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
                    className={`grid items-center gap-2 px-2 py-3 border-b border-white/5 last:border-0 ${
                      isMe ? 'bg-gold/10 rounded-lg' : ''
                    }`}
                    style={{
                      gridTemplateColumns: `36px 1fr 60px 60px 64px ${recentMatches.map(() => '56px').join(' ')}`
                    }}>
                    <div className={`text-base font-extrabold ${medal}`}>{idx + 1}</div>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                        idx === 0 ? 'bg-gold text-navy-deepest' : idx < 3 ? 'bg-fifaGreen text-navy-deepest' : 'bg-white/10 text-white/80'
                      }`}>
                        {initials(row?.alias)}
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
                      return (
                        <div key={m?.id ?? Math.random()} className="text-center">
                          {pred && pred.home_score !== null && pred.away_score !== null ? (
                            <div className="text-[10px] text-white/70 font-mono">
                              {pred.home_score}-{pred.away_score}
                            </div>
                          ) : (
                            <div className="text-[10px] text-white/30">-/-</div>
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
