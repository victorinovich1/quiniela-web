import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SummaryClient from './SummaryClient'
import type { Match, Team, Prediction, MatchScore } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface MatchWithScore extends Match {
  prediction: Prediction | null
  score: MatchScore | null
  home_team?: Team
  away_team?: Team
}

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: { entry?: string }
}) {
  const entryId = searchParams.entry ? parseInt(searchParams.entry) : null

  if (!entryId) {
    redirect('/entries')
  }

  const supabase = createClient()

  // Verificar que el usuario tiene acceso a esta entry
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: entry } = await supabase
    .from('entries')
    .select('id, alias, user_id')
    .eq('id', entryId)
    .single()

  if (!entry || entry.user_id !== user.id) {
    redirect('/entries')
  }

  // Consultar matches, predictions, scores y teams en paralelo
  const [
    { data: matches },
    { data: predictions },
    { data: matchScores },
    { data: teams },
    { data: leaderboardData },
  ] = await Promise.all([
    supabase.from('matches').select('*').order('match_number'),
    supabase.from('predictions').select('*').eq('entry_id', entryId),
    supabase.from('match_scores').select('*').eq('entry_id', entryId),
    supabase.from('teams').select('*'),
    supabase.from('leaderboard').select('*').eq('entry_id', entryId).single(),
  ])

  // Crear maps para lookups rápidos
  const predMap = new Map(predictions?.map((p) => [p.match_id, p]) || [])
  const scoreMap = new Map(matchScores?.map((s) => [s.match_id, s]) || [])
  const teamMap = new Map(teams?.map((t) => [t.id, t]) || [])

  // Combinar datos
  const matchesWithData: MatchWithScore[] = (matches || []).map((m) => ({
    ...m,
    prediction: predMap.get(m.id) || null,
    score: scoreMap.get(m.id) || null,
    home_team: m.home_team_id ? teamMap.get(m.home_team_id) : undefined,
    away_team: m.away_team_id ? teamMap.get(m.away_team_id) : undefined,
  }))

  // Calcular estadísticas rápidas
  const totalPoints = leaderboardData?.total_points || 0
  const exactMatches = matchScores?.filter((s) => {
    const match = matches?.find((m) => m.id === s.match_id)
    const pred = predMap.get(s.match_id)
    if (!match || !pred || match.status !== 'finished') return false
    return pred.home_score === match.home_score && pred.away_score === match.away_score
  }).length || 0

  const partialMatches = matchScores?.filter((s) => {
    const match = matches?.find((m) => m.id === s.match_id)
    const pred = predMap.get(s.match_id)
    if (!match || !pred || match.status !== 'finished' || s.points === 0) return false
    // Es acierto parcial si tiene puntos pero no es marcador exacto
    return !(pred.home_score === match.home_score && pred.away_score === match.away_score)
  }).length || 0

  const rank = leaderboardData?.rank || 0

  return (
    <SummaryClient
      entryAlias={entry.alias}
      matches={matchesWithData}
      teams={teams || []}
      stats={{
        totalPoints,
        exactMatches,
        partialMatches,
        rank,
      }}
    />
  )
}
