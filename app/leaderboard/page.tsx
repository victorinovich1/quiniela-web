import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import Flag from '@/components/Flag'
import type { LeaderboardRow, Match, Team, Prediction } from '@/lib/types'

export const dynamic = 'force-dynamic'

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function LeaderboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('leaderboard')
    .select('entry_id, user_id, display_name, alias, paid, match_points, special_points, total_points')
    .order('total_points', { ascending: false })

  const rows = (data ?? []) as LeaderboardRow[]
  
  // Partidos de interés: live + últimos 2 finished (ordenados por kickoff_at DESC)
  const { data: liveMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'live')
    .not('kickoff_at', 'is', null)
    .gte('kickoff_at', '2000-01-01') // Asegurar que kickoff_at existe
    .order('kickoff_at', { ascending: false })
  
  const { data: finishedMatches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished')
    .not('kickoff_at', 'is', null)
    .gte('kickoff_at', '2000-01-01') // Asegurar que kickoff_at exists
    .order('kickoff_at', { ascending: false })
    .limit(2)
  
  const recentMatches = [...(liveMatches ?? []), ...(finishedMatches ?? [])] as Match[]
  const matchIds = recentMatches.map(m => m.id)
  
  // Debug logging (server-side)
  console.log('[Leaderboard] Recent matches:', {
    live: liveMatches?.length ?? 0,
    finished: finishedMatches?.length ?? 0,
    total: recentMatches.length,
    matchIds
  })
  
  // Traer todos los equipos para mostrar banderas
  const { data: teams } = await supabase.from('teams').select('*')
  const teamsById = (teams ?? []).reduce((acc, t: Team) => ({ ...acc, [t.id]: t }), {} as Record<number, Team>)
  
  // Traer pronósticos de todos para estos partidos
  const { data: predictions } = matchIds.length > 0
    ? await supabase
        .from('predictions')
        .select('entry_id, match_id, home_score, away_score, ko_winner_team_id')
        .in('match_id', matchIds)
    : { data: [] }
  
  console.log('[Leaderboard] Predictions fetched:', predictions?.length ?? 0)
  
  const predsByEntry = (predictions ?? []).reduce((acc, p: Prediction) => {
    if (!acc[p.entry_id]) acc[p.entry_id] = {}
    acc[p.entry_id][p.match_id] = p
    return acc
  }, {} as Record<number, Record<number, Prediction>>)

  const updatedAt = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="pb-24">
      <PageHeader
        label="Clasificación general"
        title="Ranking"
        subtitle={`Actualizado: ${updatedAt}`}
      />

      {error && (
        <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 mb-4 text-sm">
          {error.message}
        </div>
      )}

      <div className="card p-2 sm:p-3">
        {/* Debug: {recentMatches.length} partidos recientes (live: {liveMatches?.length ?? 0}, finished: {finishedMatches?.length ?? 0}) */}
        {rows.length === 0 ? (
          <div className="py-10 text-center text-white/40 uppercase tracking-wider text-sm">
            Aún no hay jugadas registradas
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
                  const homeTeam = m.home_team_id ? teamsById[m.home_team_id] : null
                  const awayTeam = m.away_team_id ? teamsById[m.away_team_id] : null
                  return (
                    <div key={m.id} className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-0.5">
                        {homeTeam && <Flag team={homeTeam} size={10} />}
                        <span className="text-[8px] text-white/40">-</span>
                        {awayTeam && <Flag team={awayTeam} size={10} />}
                      </div>
                      {(m.home_score !== null && m.away_score !== null) && (
                        <div className={`text-[9px] font-bold ${m.status === 'live' ? 'text-red-500' : 'text-fifaGreen'}`}>
                          {m.home_score}-{m.away_score}
                        </div>
                      )}
                      {m.status === 'live' && (
                        <div className="text-[7px] text-red-500 uppercase font-bold animate-pulse">Vivo</div>
                      )}
                    </div>
                  )
                })}
              </div>
              {rows.map((row, idx) => {
                const isMe = row.user_id === user.id
                const medal = idx === 0 ? 'text-gold' : idx < 3 ? 'text-fifaGreen' : 'text-white/40'
                return (
                  <div key={row.entry_id}
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
                        {initials(row.alias)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight truncate">{row.alias}</span>
                          {isMe && <span className="badge bg-gold text-navy-deepest">Tú</span>}
                          {!row.paid && <span className="badge bg-danger/30 text-danger">Sin pagar</span>}
                        </div>
                        <div className="text-[10px] text-white/40 truncate">
                          {row.display_name || 'Anónimo'}
                          <span className="sm:hidden"> · {row.match_points}G + {row.special_points}E</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-white/60 text-sm hidden sm:block">{row.match_points}</div>
                    <div className="text-right text-white/60 text-sm hidden sm:block">{row.special_points}</div>
                    <div className="text-right font-extrabold text-white text-base sm:text-lg">{row.total_points}</div>
                    {recentMatches.map((m) => {
                      const pred = predsByEntry[row.entry_id]?.[m.id]
                      return (
                        <div key={m.id} className="text-center">
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
    </div>
  )
}
