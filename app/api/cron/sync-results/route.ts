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
  kickoff_at: string
  stage: string
  status: MatchStatus
  manual_override: boolean
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
  stage?: string | null
  matchday?: number | null
  homeTeam?: FdTeam | null
  awayTeam?: FdTeam | null
  score?: FdScore | null
}

const FOOTBALL_DATA_BASE = 'https://api.football-data.org/v4'

function mapStatus(raw: string | null | undefined): MatchStatus {
  if (!raw) return 'scheduled'
  const normalized = raw.toUpperCase()
  // Estados en vivo
  if (normalized === 'IN_PLAY' || normalized === 'PAUSED' || normalized === 'LIVE') return 'live'
  // Estados finalizados
  if (normalized === 'FINISHED' || normalized === 'AWARDED') return 'finished'
  // Estados pendientes
  if (normalized === 'TIMED' || normalized === 'SCHEDULED') return 'scheduled'
  // Default fallback
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
  const authHeader = request.headers.get('authorization')
  
  if (!secret) return null
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

  try {
    // Verificar interruptor maestro y configuración de intervalo
    const { data: settings } = await supabase
      .from('settings')
      .select('api_sync_enabled, sync_interval_minutes, last_sync_at')
      .eq('id', 1)
      .single()

    if (!settings?.api_sync_enabled) {
      return NextResponse.json({
        ok: true,
        message: 'Sincronización deshabilitada por configuración',
        updated: 0,
      })
    }

    // Validar intervalo: solo sincronizar si ha pasado el tiempo configurado
    // Margen de tolerancia de 30 segundos para evitar perder ciclos de Vercel Cron
    const intervalMinutes = settings.sync_interval_minutes || 10
    if (settings.last_sync_at) {
      const lastSync = new Date(settings.last_sync_at).getTime()
      const now = Date.now()
      const elapsedMinutes = (now - lastSync) / (1000 * 60)
      const minInterval = intervalMinutes - 0.5 // Margen de 30 segundos
      
      if (elapsedMinutes < minInterval) {
        const remainingMinutes = Math.ceil(intervalMinutes - elapsedMinutes)
        return NextResponse.json({
          ok: true,
          message: 'Sincronización omitida por configuración de intervalo',
          nextSyncIn: `${remainingMinutes} minutos`,
          intervalMinutes,
          updated: 0,
        })
      }
    }

    const [{ data: teams, error: teamsErr }, { data: matches, error: matchesErr }] = await Promise.all([
      supabase.from('teams').select('id, code'),
      supabase.from('matches').select('id, match_number, home_team_id, away_team_id, kickoff_at, stage, status, manual_override'),
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

  // MAPEO HÍBRIDO:
  // 1. Por equipos: para fase de grupos (ya asignados)
  const matchByTeams = new Map<string, MatchRow>()
  for (const m of matches as MatchRow[]) {
    if (m.home_team_id && m.away_team_id) {
      matchByTeams.set(`${m.home_team_id}-${m.away_team_id}`, m)
    }
  }

  // 2. Por fecha+fase: para eliminatorias (equipos NULL hasta que clasifiquen)
  const matchByDateStage = new Map<string, MatchRow>()
  for (const m of matches as MatchRow[]) {
    const dateKey = new Date(m.kickoff_at).toISOString()
    const key = `${m.stage}-${dateKey}`
    matchByDateStage.set(key, m)
  }

    // Construir URL y hacer llamada a la API
    let fixtureUrl = buildFixtureUrl(competitionCode, season)
    let currentSeason = season
    
    // LOG DETALLADO: URL y configuración
    console.log('[cron/sync-results] === INICIO DE SINCRONIZACIÓN ===')
    console.log('[cron/sync-results] URL completa:', fixtureUrl)
    console.log('[cron/sync-results] API Key configurada:', footballDataKey ? 'SÍ' : 'NO')
    console.log('[cron/sync-results] Competición:', competitionCode, '| Temporada:', season)
    
    let upstreamRes = await fetch(fixtureUrl, {
      headers: {
        'X-Auth-Token': footballDataKey,
      },
      cache: 'no-store',
    })

    // LOG DETALLADO: Respuesta inicial
    console.log('[cron/sync-results] Response status:', upstreamRes.status, upstreamRes.statusText)
    console.log('[cron/sync-results] Response ok:', upstreamRes.ok)

    // Modo de prueba: Si season=2026 falla (400/403/404), reintentar con 2022 para validar conexión
    if (!upstreamRes.ok && [400, 403, 404].includes(upstreamRes.status) && season === '2026') {
      console.log('[cron/sync-results] ⚠️  Season 2026 falló (' + upstreamRes.status + '), activando modo de prueba con 2022...')
      currentSeason = '2022'
      fixtureUrl = buildFixtureUrl(competitionCode, currentSeason)
      console.log('[cron/sync-results] Nueva URL (fallback):', fixtureUrl)
      
      upstreamRes = await fetch(fixtureUrl, {
        headers: {
          'X-Auth-Token': footballDataKey,
        },
        cache: 'no-store',
      })
      
      console.log('[cron/sync-results] Fallback response status:', upstreamRes.status, upstreamRes.statusText)
    }

    if (!upstreamRes.ok) {
      const txt = await upstreamRes.text()
      const statusText = upstreamRes.statusText || 'Error'
      
      // Mensajes específicos según código HTTP
      let userMessage = ''
      if (upstreamRes.status === 403) {
        userMessage = currentSeason === '2026' 
          ? 'Error 403: Tu API Key no soporta el Mundial 2026 o está inválida. Verifica en football-data.org'
          : 'Error 403: API Key inválida o expirada. Verifica en football-data.org'
      } else if (upstreamRes.status === 404) {
        userMessage = 'Error 404: Temporada no encontrada. El Mundial 2026 puede no estar disponible aún'
      } else if (upstreamRes.status === 429) {
        userMessage = 'Error 429: Límite de llamadas excedido. Intenta de nuevo en unos minutos'
      } else if (upstreamRes.status === 401) {
        userMessage = 'Error 401: Header X-Auth-Token incorrecto o faltante'
      } else if (upstreamRes.status === 400) {
        userMessage = `Error 400: Solicitud inválida. ${txt.slice(0, 100)}`
      } else {
        userMessage = `${upstreamRes.status} ${statusText}: ${txt.slice(0, 100)}`
      }
      
      // LOG DETALLADO: Error completo
      console.error('[cron/sync-results] ❌ ERROR DE API:')
      console.error('[cron/sync-results] Status:', upstreamRes.status, statusText)
      console.error('[cron/sync-results] URL que falló:', fixtureUrl)
      console.error('[cron/sync-results] Mensaje para usuario:', userMessage)
      console.error('[cron/sync-results] Respuesta completa (primeros 500 chars):')
      console.error(txt.slice(0, 500))
      console.error('[cron/sync-results] === FIN DE LOG DE ERROR ===')
      
      // Registrar error en BD con mensaje específico
      await supabase
        .from('settings')
        .update({ last_sync_status: userMessage })
        .eq('id', 1)
      
      return NextResponse.json(
        {
          ok: false,
          error: userMessage,
          details: txt.slice(0, 500),
          url: fixtureUrl,
          debugInfo: {
            status: upstreamRes.status,
            statusText: upstreamRes.statusText,
            season: currentSeason,
            isFallback: currentSeason !== season,
          },
        },
        { status: 502 }
      )
    }

    let payload: { matches?: FdMatch[] }
    try {
      payload = await upstreamRes.json()
    } catch (parseErr) {
      const txt = await upstreamRes.text()
      console.error('[cron/sync-results] ❌ ERROR: Respuesta no es JSON válido')
      console.error('[cron/sync-results] Respuesta recibida:', txt.slice(0, 500))
      return NextResponse.json(
        {
          ok: false,
          error: 'API devolvió respuesta no-JSON (posiblemente HTML)',
          details: txt.slice(0, 500),
        },
        { status: 502 }
      )
    }

    const externalMatches = payload.matches ?? []
    
    // LOG DETALLADO: Estructura de respuesta
    console.log('[cron/sync-results] ✅ Respuesta JSON recibida correctamente')
    console.log('[cron/sync-results] Partidos en respuesta:', externalMatches.length)
    if (externalMatches.length === 0) {
      console.warn('[cron/sync-results] ⚠️  La API devolvió 0 partidos. Posibles causas:')
      console.warn('[cron/sync-results]    - La temporada aún no tiene fixture cargado')
      console.warn('[cron/sync-results]    - El código de competición es incorrecto')
      console.warn('[cron/sync-results] Estructura recibida:', JSON.stringify(payload).slice(0, 300))
    }

    let updated = 0
    let autoAssignedTeams = 0
    let skippedNoTeams = 0
    let skippedNoMapping = 0
    let skippedUnknownCode = 0
    const sampleUnmapped: Array<{ home: string; away: string; status: string | null | undefined }> = []

    for (const fm of externalMatches) {
      const homeCode = fm.homeTeam?.tla?.toUpperCase()
      const awayCode = fm.awayTeam?.tla?.toUpperCase()
      
      // Intentar mapeo por equipos (si ambos existen en la API)
      let mapped: MatchRow | undefined
      let swapped = false
      let extHomeId: number | undefined
      let extAwayId: number | undefined

      if (homeCode && awayCode) {
        extHomeId = teamByCode.get(homeCode)
        extAwayId = teamByCode.get(awayCode)
        
        if (extHomeId && extAwayId) {
          mapped = matchByTeams.get(`${extHomeId}-${extAwayId}`)
          if (!mapped) {
            mapped = matchByTeams.get(`${extAwayId}-${extHomeId}`)
            swapped = !!mapped
          }
        } else if (!extHomeId || !extAwayId) {
          skippedUnknownCode += 1
        }
      }

      // Si no se encontró por equipos, intentar mapeo por fecha+fase
      if (!mapped && fm.utcDate && fm.stage) {
        const apiDate = new Date(fm.utcDate)
        const apiStage = fm.stage.toUpperCase()
        
        // Buscar match con margen de ±1 minuto en la fecha
        for (const [key, m] of matchByDateStage) {
          const [stage, dateStr] = key.split('-', 2)
          if (stage !== apiStage) continue
          
          const dbDate = new Date(dateStr)
          const diffMinutes = Math.abs(apiDate.getTime() - dbDate.getTime()) / (1000 * 60)
          
          if (diffMinutes <= 1) {
            mapped = m
            break
          }
        }
      }

      if (!mapped) {
        skippedNoMapping += 1
        if (homeCode && awayCode && sampleUnmapped.length < 10) {
          sampleUnmapped.push({ home: homeCode, away: awayCode, status: fm.status })
        }
        continue
      }

      // AUTO-ASIGNACIÓN: Si BD tiene NULL pero API tiene equipos, asignar
      if ((!mapped.home_team_id || !mapped.away_team_id) && homeCode && awayCode && extHomeId && extAwayId) {
        const assignPatch = {
          home_team_id: swapped ? extAwayId : extHomeId,
          away_team_id: swapped ? extHomeId : extAwayId,
        }
        
        const { error: assignErr } = await supabase
          .from('matches')
          .update(assignPatch)
          .eq('id', mapped.id)
        
        if (!assignErr) {
          autoAssignedTeams += 1
          mapped.home_team_id = assignPatch.home_team_id
          mapped.away_team_id = assignPatch.away_team_id
        }
      }

      // No actualizar si el Admin fijó el resultado manualmente
      if (mapped.manual_override) continue

      const rawHome = parseScore(fm.score?.fullTime?.home)
      const rawAway = parseScore(fm.score?.fullTime?.away)
      const homeScore = swapped ? rawAway : rawHome
      const awayScore = swapped ? rawHome : rawAway

      let shootoutWinner: number | null = null
      if (fm.score?.duration === 'PENALTY_SHOOTOUT' && mapped.home_team_id && mapped.away_team_id) {
        if (fm.score.winner === 'HOME_TEAM') shootoutWinner = swapped ? mapped.away_team_id : mapped.home_team_id
        if (fm.score.winner === 'AWAY_TEAM') shootoutWinner = swapped ? mapped.home_team_id : mapped.away_team_id
      }

      // Actualiza scores, status y stadium desde la API
      // Si la API marca el partido como FINISHED, el status pasa a 'finished' automáticamente
      // y las views de puntos (entry_scores, etc.) recalculan los puntajes
      const updatePatch = {
        home_score: homeScore,
        away_score: awayScore,
        shootout_winner_team_id: shootoutWinner,
        status: mapStatus(fm.status), // scheduled | live | finished
        stadium: fm.venue ?? null,
        last_synced_at: new Date().toISOString(),
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

    // Actualizar timestamp y estado de última sincronización exitosa
    await supabase
      .from('settings')
      .update({ 
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'online',
        last_sync_error: null,
      })
      .eq('id', 1)

    // LOG DETALLADO: Resumen de sincronización
    console.log('[cron/sync-results] ✅ === SINCRONIZACIÓN COMPLETADA ===')
    console.log('[cron/sync-results] Partidos actualizados:', updated)
    console.log('[cron/sync-results] Equipos auto-asignados:', autoAssignedTeams)
    console.log('[cron/sync-results] Partidos recibidos de la API:', externalMatches.length)
    console.log('[cron/sync-results] Omitidos (sin equipos):', skippedNoTeams)
    console.log('[cron/sync-results] Omitidos (código desconocido):', skippedUnknownCode)
    console.log('[cron/sync-results] Omitidos (sin mapeo):', skippedNoMapping)
    if (currentSeason !== season) {
      console.log('[cron/sync-results] ⚠️  MODO FALLBACK: usando temporada', currentSeason, 'en lugar de', season)
    }
    console.log('[cron/sync-results] === FIN DE SINCRONIZACIÓN ===')

    return NextResponse.json({
      ok: true,
      source: 'football-data.org',
      competitionCode,
      season: currentSeason,
      fallbackMode: currentSeason !== season,
      upstreamCount: externalMatches.length,
      updated,
      autoAssignedTeams,
      skippedNoTeams,
      skippedUnknownCode,
      skippedNoMapping,
      sampleUnmapped,
      at: new Date().toISOString(),
    })
  } catch (error) {
    // Captura cualquier error inesperado y devuelve JSON, nunca HTML
    const errorMsg = error instanceof Error ? error.message : 'Error desconocido en sincronización'
    
    // LOG DETALLADO: Error inesperado
    console.error('[cron/sync-results] ❌ === ERROR INESPERADO ===')
    console.error('[cron/sync-results] Mensaje:', errorMsg)
    if (error instanceof Error && error.stack) {
      console.error('[cron/sync-results] Stack trace:')
      console.error(error.stack)
    }
    console.error('[cron/sync-results] === FIN DE ERROR ===')
    
    // Intentar actualizar error en BD
    try {
      await supabase
        .from('settings')
        .update({ 
          last_sync_status: errorMsg,
          last_sync_error: errorMsg,
        })
        .eq('id', 1)
    } catch {
      // Ignorar error al guardar error
    }

    return NextResponse.json(
      {
        ok: false,
        error: errorMsg,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined,
      },
      { status: 500 }
    )
  }
}

