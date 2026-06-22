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

/**
 * Calcula enfrentamiento directo entre equipos empatados en puntos
 * Retorna >0 si teamA gana, <0 si teamB gana, 0 si siguen empatados
 */
function compareHeadToHead(
  teamA: StandingRow,
  teamB: StandingRow,
  matches: Match[],
  predictedScores: Record<number, { home: number | null; away: number | null }>
): number {
  // Buscar partido entre estos dos equipos
  const h2h = matches.find(
    (m) =>
      (m.home_team_id === teamA.team_id && m.away_team_id === teamB.team_id) ||
      (m.home_team_id === teamB.team_id && m.away_team_id === teamA.team_id)
  )

  if (!h2h) return 0

  const pred = predictedScores[h2h.id]
  if (!pred || pred.home === null || pred.away === null) return 0

  const teamAScore =
    h2h.home_team_id === teamA.team_id ? pred.home : pred.away
  const teamBScore =
    h2h.home_team_id === teamB.team_id ? pred.home : pred.away

  // Si teamA ganó el partido directo
  if (teamAScore > teamBScore) return 1
  // Si teamB ganó el partido directo
  if (teamBScore > teamAScore) return -1

  // Si empataron, mantener otros criterios
  return 0
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

  // Ordenar con criterios FIFA + enfrentamiento directo
  return Object.values(rows).sort((a, b) => {
    // 1. Puntos
    if (a.pts !== b.pts) return b.pts - a.pts

    // 2. Diferencia de goles
    if (a.dg !== b.dg) return b.dg - a.dg

    // 3. Goles a favor
    if (a.gf !== b.gf) return b.gf - a.gf

    // 4. Enfrentamiento directo
    const h2h = compareHeadToHead(a, b, groupMatches, predictedScores)
    if (h2h !== 0) return h2h

    // 5. Alfabético (último recurso)
    return a.team_name.localeCompare(b.team_name)
  })
}
