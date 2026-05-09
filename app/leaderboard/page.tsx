import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import LeaderboardClient from './LeaderboardClient'
import type { LeaderboardRow, Match, Team, Prediction } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let rows: LeaderboardRow[] = []
  let recentMatches: Match[] = []
  let teams: Team[] = []
  let predictions: Prediction[] = []
  let dataError: string | null = null

  try {
    // 1. Leaderboard principal
    const { data: leaderboardData, error: leaderboardError } = await supabase
      .from('leaderboard')
      .select('entry_id, user_id, display_name, alias, paid, avatar_perm_id, match_points, special_points, total_points, rank, display_avatar')
      .order('total_points', { ascending: false })

    if (leaderboardError) throw leaderboardError
    rows = (leaderboardData ?? []) as LeaderboardRow[]

    // 2. Partidos recientes: live + últimos 2 finished
    const { data: liveMatches, error: liveError } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'live')
      .not('kickoff_at', 'is', null)
      .gte('kickoff_at', '2000-01-01')
      .order('kickoff_at', { ascending: false })

    const { data: finishedMatches, error: finishedError } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .not('kickoff_at', 'is', null)
      .gte('kickoff_at', '2000-01-01')
      .order('kickoff_at', { ascending: false })
      .limit(2)

    if (liveError) console.error('[Leaderboard] Error fetching live matches:', liveError)
    if (finishedError) console.error('[Leaderboard] Error fetching finished matches:', finishedError)

    recentMatches = [...(liveMatches ?? []), ...(finishedMatches ?? [])] as Match[]
    const matchIds = recentMatches.map(m => m?.id).filter(Boolean) as number[]

    console.log('[Leaderboard] Recent matches:', {
      live: liveMatches?.length ?? 0,
      finished: finishedMatches?.length ?? 0,
      total: recentMatches.length,
      matchIds
    })

    // 3. Equipos para banderas
    const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*')
    if (teamsError) console.error('[Leaderboard] Error fetching teams:', teamsError)
    teams = (teamsData ?? []) as Team[]

    // 4. Pronósticos para partidos recientes
    if (matchIds.length > 0) {
      const { data: predsData, error: predsError } = await supabase
        .from('predictions')
        .select('entry_id, match_id, home_score, away_score, ko_winner_team_id')
        .in('match_id', matchIds)

      if (predsError) {
        console.error('[Leaderboard] Error fetching predictions:', predsError)
      } else {
        console.log('[Leaderboard] Predictions fetched:', predsData?.length ?? 0)
        predictions = (predsData ?? []) as Prediction[]
      }
    }
  } catch (err) {
    console.error('[Leaderboard Error]:', err)
    dataError = err instanceof Error ? err.message : 'Error desconocido al cargar datos'
  }

  const updatedAt = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="pb-24">
      <PageHeader
        label="Clasificación general"
        title="Ranking"
        subtitle={`Actualizado: ${updatedAt}`}
      />

      <LeaderboardClient
        user={{ id: user.id }}
        rows={rows}
        recentMatches={recentMatches}
        teams={teams}
        predictions={predictions}
        dataError={dataError}
      />
    </div>
  )
}
