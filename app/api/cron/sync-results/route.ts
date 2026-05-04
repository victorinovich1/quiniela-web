import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { MatchStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

type TeamRow = {
  id: number
  code: string
}

type MatchRow = {
  id: number
  match_number: number
  home_team_id: number | null
  away_team_id: number | null
  status: MatchStatus
}

type FdTeam = {
  tla?: string | null
}

type FdScore = {
  winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null
  duration?: string | null
  fullTime?: {
    home?: number | null
    away?: number | null
  } | null
}

type FdMatch = {
  id: number
  status?: string | null
  utcDate?: string | null
  venue?: string | null
  homeTeam?: FdTeam | null
  awayTeam?: FdTeam | null
  score?: FdScore | null
}

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4'

function mapStatus(raw: string | null | undefined): MatchStatus {
  if (!raw) return 'scheduled'
  if (raw === 'IN_PLAY' || raw === 'PAUSED' || raw === 'LIVE') return 'live'
  if (raw === 'FINISHED') return 'finished'
  return 'scheduled'
}

function parseScore(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function buildFixtureUrl(
  competitionCode: string,
  season: string
): string {
  const code = encodeURIComponent(competitionCode)
  const year = encodeURIComponent(season)
  return `${FOOTBALL_DATA_BASE}/competitions/${code}/matches?season=${year}`
}

function assertCronAuthorized(request: NextRequest): string | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return null

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return null

  return 'Unauthorized cron call'
}

export async function GET(request: NextRequest) {
  const unauthorizedReason = assertCronAuthorized(request)
  if (unauthorizedReason) {
    return NextResponse.json({ ok: false, error: unauthorizedReason }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  const footballDataKey = process.env.FOOTBALL_DATA_API_KEY
  const competitionCode = process.env.FOOTBALL_DATA_COMPETITION_CODE ?? 'WC'
  const season = process.env.FOOTBALL_DATA_SEASON ?? '2026'

  if (!supabaseUrl || !serviceRole) {
    return NextResponse.json(
      { ok: false, error: 'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' },
      { status: 500 }
    )
  }
  if (!footballDataKey) {
    return NextResponse.json(
      { ok: false, error: 'Missing FOOTBALL_DATA_API_KEY' },
      { status: 500 }
    )
  }

  const supabase = createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [{ data: teams, error: teamsErr }, { data: matches, error: matchesErr }] = await Promise.all([
    supabase.from('teams').select('id, code'),
    supabase.from('matches').select('id, match_number, home_team_id, away_team_id, status'),
  ])

  if (teamsErr || matchesErr || !teams || !matches) {
    return NextResponse.json(
      {
        ok: false,
        error: teamsErr?.message || matchesErr?.message || 'Could not load teams/matches',
      },
      { status: 500 }
    )
  }

  const teamByCode = new Map<string, number>()
  for (const t of teams as TeamRow[]) {
    teamByCode.set(t.code.toUpperCase(), t.id)
  }

  const matchByTeams = new Map<string, MatchRow>()
  for (const m of matches as MatchRow[]) {
    if (m.home_team_id && m.away_team_id) {
      matchByTeams.set(`${m.home_team_id}-${m.away_team_id}`, m)
    }
  }

  const fixtureUrl = buildFixtureUrl(competitionCode, season)
  const upstreamRes = await fetch(fixtureUrl, {
    headers: {
      'X-Auth-Token': footballDataKey,
    },
    cache: 'no-store',
  })

  if (!upstreamRes.ok) {
    const txt = await upstreamRes.text()
    return NextResponse.json(
      {
        ok: false,
        error: `football-data error ${upstreamRes.status}`,
        details: txt.slice(0, 500),
      },
      { status: 502 }
    )
  }

  const payload = (await upstreamRes.json()) as { matches?: FdMatch[] }
  const externalMatches = payload.matches ?? []

  let updated = 0
  let skippedNoTeams = 0
  let skippedNoMapping = 0
  let skippedUnknownCode = 0
  const sampleUnmapped: Array<{ home: string; away: string; status: string | null | undefined }> = []

  for (const fm of externalMatches) {
    const homeCode = fm.homeTeam?.tla?.toUpperCase()
    const awayCode = fm.awayTeam?.tla?.toUpperCase()
    if (!homeCode || !awayCode) {
      skippedNoTeams += 1
      continue
    }

    const extHomeId = teamByCode.get(homeCode)
    const extAwayId = teamByCode.get(awayCode)
    if (!extHomeId || !extAwayId) {
      skippedUnknownCode += 1
      continue
    }

    let mapped = matchByTeams.get(`${extHomeId}-${extAwayId}`)
    let swapped = false
    if (!mapped) {
      mapped = matchByTeams.get(`${extAwayId}-${extHomeId}`)
      swapped = !!mapped
    }

    if (!mapped) {
      skippedNoMapping += 1
      if (sampleUnmapped.length < 10) {
        sampleUnmapped.push({ home: homeCode, away: awayCode, status: fm.status })
      }
      continue
    }

    const rawHome = parseScore(fm.score?.fullTime?.home)
    const rawAway = parseScore(fm.score?.fullTime?.away)
    const homeScore = swapped ? rawAway : rawHome
    const awayScore = swapped ? rawHome : rawAway

    let shootoutWinner: number | null = null
    if (fm.score?.duration === 'PENALTY_SHOOTOUT') {
      if (fm.score.winner === 'HOME_TEAM') shootoutWinner = extHomeId
      if (fm.score.winner === 'AWAY_TEAM') shootoutWinner = extAwayId
    }

    const updatePatch = {
      home_score: homeScore,
      away_score: awayScore,
      shootout_winner_team_id: shootoutWinner,
      status: mapStatus(fm.status),
      stadium: fm.venue ?? null,
    }

    const { error: updateErr } = await supabase
      .from('matches')
      .update(updatePatch)
      .eq('id', mapped.id)

    if (updateErr) {
      return NextResponse.json(
        {
          ok: false,
          error: `Failed updating match ${mapped.match_number}: ${updateErr.message}`,
        },
        { status: 500 }
      )
    }

    updated += 1
  }

  return NextResponse.json({
    ok: true,
    source: 'football-data.org',
    competitionCode,
    season,
    upstreamCount: externalMatches.length,
    updated,
    skippedNoTeams,
    skippedUnknownCode,
    skippedNoMapping,
    sampleUnmapped,
    at: new Date().toISOString(),
  })
}

