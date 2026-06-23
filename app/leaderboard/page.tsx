import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import LiveTimestamp from '@/components/LiveTimestamp'
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
      .select('entry_id, user_id, display_name, alias, paid, avatar_perm_id, avatar_category, country_code, match_points, special_points, total_points, total_exact, ko_winner_count, rank, previous_rank, rank_movement, display_avatar')
      .order('total_points', { ascending: false })

    if (leaderboardError) throw leaderboardError
    rows = (leaderboardData ?? []) as LeaderboardRow[]

    // 2. Partidos recientes: live + finished + virtualmente en vivo (kicked off pero aún scheduled)
    const now = new Date().toISOString()
    const { data: recentMatchesData, error: recentError } = await supabase
      .from('matches')
      .select('*')
      .not('kickoff_at', 'is', null)
      .gte('kickoff_at', '2000-01-01')
      .or(`status.eq.live,status.eq.finished,and(status.eq.scheduled,kickoff_at.lte.${now})`)
      .order('kickoff_at', { ascending: false })
      .limit(10)

    if (recentError) throw recentError
    recentMatches = (recentMatchesData ?? []) as Match[]
    const matchIds = recentMatches.map(m => m?.id).filter(Boolean) as number[]

    // 3. Equipos para banderas
    const { data: teamsData, error: teamsError } = await supabase.from('teams').select('*')
    if (teamsError) throw teamsError
    teams = (teamsData ?? []) as Team[]

    // 4. Pronósticos para partidos recientes
    if (matchIds.length > 0) {
      const { data: predsData, error: predsError } = await supabase
        .from('predictions')
        .select('entry_id, match_id, home_score, away_score, ko_winner_team_id')
        .in('match_id', matchIds)

      if (predsError) throw predsError
      predictions = (predsData ?? []) as Prediction[]
    }
  } catch (err) {
    dataError = err instanceof Error ? err.message : 'Error desconocido al cargar datos'
  }

  return (
    <div className="pb-24">
      <PageHeader
        label="Clasificación general"
        title="Ranking"
        subtitle={<LiveTimestamp />}
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
