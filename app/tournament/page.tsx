import { createClient } from '@/lib/supabase/server'
import TournamentClient from './TournamentClient'
import type { Team, Match } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface OfficialStanding {
  team_id: number
  team_name: string
  group_code: string
  iso_code: string
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
  pts: number
}

interface BestThird extends OfficialStanding {
  third_place_rank: number
}

export default async function TournamentPage() {
  const supabase = createClient()

  // Consultar resultados oficiales
  const [
    { data: standings },
    { data: bestThirds },
    { data: teams },
    { data: matches },
  ] = await Promise.all([
    supabase.from('official_group_standings').select('*'),
    supabase.from('official_best_thirds').select('*'),
    supabase.from('teams').select('*'),
    supabase.from('matches').select('*').eq('phase', 'group'),
  ])

  // Agrupar por grupo (A-L)
  const groupCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
  const standingsByGroup = groupCodes.reduce((acc, code) => {
    acc[code] = (standings || []).filter(s => s.group_code === code)
    return acc
  }, {} as Record<string, OfficialStanding[]>)

  return (
    <TournamentClient
      standingsByGroup={standingsByGroup}
      bestThirds={(bestThirds || []) as BestThird[]}
      teams={teams || []}
      matches={(matches || []) as Match[]}
    />
  )
}
