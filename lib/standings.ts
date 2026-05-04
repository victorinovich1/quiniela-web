import type { Match, Team } from './types'

export interface StandingRow {
  team_id: number
  team_name: string
  flag: string | null
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
  pts: number
}

export function computeGroupStandings(
  groupCode: string,
  teams: Team[],
  matches: Match[],
  predictedScores: Record<number, { home: number | null; away: number | null }>
): StandingRow[] {
  const groupTeams = teams.filter((t) => t.group_code === groupCode)
  const rows: Record<number, StandingRow> = {}
  for (const t of groupTeams) {
    rows[t.id] = {
      team_id: t.id,
      team_name: t.name,
      flag: t.flag_emoji,
      pj: 0,
      pg: 0,
      pe: 0,
      pp: 0,
      gf: 0,
      gc: 0,
      dg: 0,
      pts: 0,
    }
  }

  const groupMatches = matches.filter(
    (m) => m.phase === 'group' && m.group_code === groupCode
  )

  for (const m of groupMatches) {
    const pred = predictedScores[m.id]
    if (
      !pred ||
      pred.home === null ||
      pred.away === null ||
      m.home_team_id === null ||
      m.away_team_id === null
    ) {
      continue
    }
    const home = rows[m.home_team_id]
    const away = rows[m.away_team_id]
    if (!home || !away) continue
    home.pj += 1
    away.pj += 1
    home.gf += pred.home
    home.gc += pred.away
    away.gf += pred.away
    away.gc += pred.home
    if (pred.home > pred.away) {
      home.pg += 1
      home.pts += 3
      away.pp += 1
    } else if (pred.home < pred.away) {
      away.pg += 1
      away.pts += 3
      home.pp += 1
    } else {
      home.pe += 1
      away.pe += 1
      home.pts += 1
      away.pts += 1
    }
  }

  for (const id in rows) {
    rows[id].dg = rows[id].gf - rows[id].gc
  }

  return Object.values(rows).sort(
    (a, b) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf || a.team_name.localeCompare(b.team_name)
  )
}
