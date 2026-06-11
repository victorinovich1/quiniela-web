import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { MatchStatus } from '@/lib/types'

export const dynamic = 'force-dynamic'

type TeamRow = {
  id: number
  code: string
  name: string
}

type MatchRow = {
  id: number
  match_number: number
  home_team_id: number | null
  away_team_id: number | null
  kickoff_at: string
  phase: string
  status: MatchStatus
  manual_override: boolean
  stadium: string | null
  home_score: number | null
  away_score: number | null
  shootout_winner_team_id: number | null
}

type FdTeam = {
  tla?: string | null
  name?: string | null
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

// Mapeo de nombres de fase: API → BD
function mapPhaseApiToDB(apiStage: string | null | undefined): string | null {
  if (!apiStage) return null
  const normalized = apiStage.toUpperCase()
  
  // Mapeo directo de football-data.org a nuestra BD
  const mapping: Record<string, string> = {
    'GROUP_STAGE': 'group',
    'LAST_32': 'r32',
    'ROUND_OF_32': 'r32',
    'LAST_16': 'r16',
    'ROUND_OF_16': 'r16',
    'QUARTER_FINALS': 'qf',
    'QUARTER_FINAL': 'qf',
    'SEMI_FINALS': 'sf',
    'SEMI_FINAL': 'sf',
    'THIRD_PLACE': 'third',
    'FINAL': 'final',
  }
  
  return mapping[normalized] || null
}

function mapStatus(raw: string | null | undefined): MatchStatus {
  if (!raw) return 'scheduled'
  const normalized = raw.toUpperCase()
  // Estados en vivo (ampliado)
  if (
    normalized === 'IN_PLAY' || 
    normalized === 'LIVE' || 
    normalized === 'PAUSED' ||
    normalized === 'FIRST_HALF' ||
    normalized === 'SECOND_HALF' ||
    normalized === 'EXTRA_TIME'
  ) return 'live'
  // Estados finalizados (ampliado)
  if (
    normalized === 'FINISHED' || 
    normalized === 'AWARDED' ||
    normalized === 'ENDED'
  ) return 'finished'
  // Estados pendientes (ampliado)
  if (
    normalized === 'TIMED' || 
    normalized === 'SCHEDULED' ||
    normalized === 'ANNOUNCED'
  ) return 'scheduled'
  // Default fallback
  return 'scheduled'
}

function parseScore(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function normalizeTeamName(name: string | null | undefined): string {
  if (!name) return ''
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .trim()
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
  
  if (!secret) return 'CRON_SECRET not configured - access denied'
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
      supabase.from('teams').select('id, code, name'),
      supabase.from('matches').select('id, match_number, home_team_id, away_team_id, kickoff_at, phase, status, manual_override, stadium, home_score, away_score, shootout_winner_team_id'),
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

  // MAPEO HÍBRIDO: Por equipos (grupos) + Por fecha+fase (eliminatorias)
  const matchByTeams = new Map<string, MatchRow>()
  const matchByDatePhase = new Map<string, MatchRow>()
  
  for (const m of matches as MatchRow[]) {
    // Mapeo 1: Por equipos (cuando ambos asignados)
    if (m.home_team_id && m.away_team_id) {
      matchByTeams.set(`${m.home_team_id}-${m.away_team_id}`, m)
    }
    // Mapeo 2: Por fecha+fase (para eliminatorias con equipos NULL)
    // Usar ||| como separador para evitar conflictos con guiones en ISO date
    const dateKey = new Date(m.kickoff_at).toISOString()
    const key = `${m.phase}|||${dateKey}`
    matchByDatePhase.set(key, m)
  }

    // Construir URL y hacer llamada a la API
    let fixtureUrl = buildFixtureUrl(competitionCode, season)
    let currentSeason = season
    
    let upstreamRes = await fetch(fixtureUrl, {
      headers: {
        'X-Auth-Token': footballDataKey,
      },
      cache: 'no-store',
    })

    // Fallback: Si season=2026 falla (400/403/404), reintentar con 2022
    if (!upstreamRes.ok && [400, 403, 404].includes(upstreamRes.status) && season === '2026') {
      currentSeason = '2022'
      fixtureUrl = buildFixtureUrl(competitionCode, currentSeason)
      
      upstreamRes = await fetch(fixtureUrl, {
        headers: {
          'X-Auth-Token': footballDataKey,
        },
        cache: 'no-store',
      })
    }

    // Fallback: Si obtuvimos respuesta OK pero devuelve 0 partidos, reintentar sin season
    let payload: { matches?: FdMatch[] } = {}
    if (upstreamRes.ok) {
      try {
        payload = await upstreamRes.json()
      } catch {
        // Se maneja abajo
      }

      if ((payload.matches ?? []).length === 0) {
        console.log('[Sync Scan] Season específica devolvió 0 partidos, reintentando sin season...')
        const urlNoSeason = `${FOOTBALL_DATA_BASE}/competitions/${encodeURIComponent(competitionCode)}/matches`
        
        const retryRes = await fetch(urlNoSeason, {
          headers: {
            'X-Auth-Token': footballDataKey,
          },
          cache: 'no-store',
        })

        if (retryRes.ok) {
          try {
            const retryPayload = await retryRes.json()
            if ((retryPayload.matches ?? []).length > 0) {
              payload = retryPayload
              currentSeason = 'default'
              console.log(`[Sync Scan] Fallback sin season exitoso: ${payload.matches?.length ?? 0} partidos`)
            }
          } catch {
            // Ignorar error de parsing
          }
        }
      }
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

    // Parsear respuesta (si no se parseó en el fallback)
    if (!payload.matches) {
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
    }

    const externalMatches = payload.matches ?? []
    
    // LOG DIAGNÓSTICO: Primer partido de la respuesta
    if (externalMatches.length > 0) {
      console.log('[API Response] Primer partido:', JSON.stringify(externalMatches[0], null, 2))
    }
    
    if (externalMatches.length === 0) {
      console.log('[Sync Scan] API devolvió 0 partidos')
      return NextResponse.json({ 
        ok: true, 
        source: 'football-data.org',
        total_received: 0,
        total_updated: 0,
        total_skipped: 0,
        last_match_number: null,
        message: 'La API no devolvió partidos' 
      })
    }

    console.log(`[Sync Scan] Verificando ${externalMatches.length} partidos... OK`)

    let updated = 0
    let skipped = 0
    let lastMatchNumber = 0
    let matchedByTeams = 0
    let matchedByDateStage = 0
    let autoAssignedTeams = 0
    let skippedNoTeams = 0
    let skippedNoMapping = 0
    let skippedUnknownCode = 0
    const sampleUnmapped: Array<{ home: string; away: string; status: string | null | undefined }> = []

    for (const fm of externalMatches) {
      const homeCode = fm.homeTeam?.tla?.toUpperCase()
      const awayCode = fm.awayTeam?.tla?.toUpperCase()
      const homeName = fm.homeTeam?.name
      const awayName = fm.awayTeam?.name
      
      // MAPEO HÍBRIDO
      let mapped: MatchRow | undefined
      let swapped = false
      let matchingMethod: 'teams' | 'dateStage' | null = null
      let extHomeId: number | undefined
      let extAwayId: number | undefined

      // 1. Intentar mapeo por equipos usando TLA (código FIFA de 3 letras)
      if (homeCode && awayCode) {
        extHomeId = teamByCode.get(homeCode)
        extAwayId = teamByCode.get(awayCode)
        
        if (extHomeId && extAwayId) {
          mapped = matchByTeams.get(`${extHomeId}-${extAwayId}`)
          if (!mapped) {
            mapped = matchByTeams.get(`${extAwayId}-${extHomeId}`)
            swapped = !!mapped
          }
          if (mapped) matchingMethod = 'teams'
        } else {
          // Log: código TLA no encontrado en BD
          if (!extHomeId) console.log(`[Sync Warning] Código TLA no encontrado en BD: ${homeCode}`)
          if (!extAwayId) console.log(`[Sync Warning] Código TLA no encontrado en BD: ${awayCode}`)
          skippedUnknownCode += 1
        }
      }

      // 2. Si no se encontró por equipos, intentar mapeo por fecha+fase
      if (!mapped && fm.utcDate && fm.stage) {
        const apiDate = new Date(fm.utcDate)
        const dbPhase = mapPhaseApiToDB(fm.stage)
        
        if (!dbPhase) {
          // Fase de API desconocida, omitir
          continue
        }
        
        // Buscar match con margen de ±3 horas en la fecha (para ajustes de horario)
        for (const [key, m] of matchByDatePhase) {
          const parts = key.split('|||')
          if (parts.length !== 2) continue
          
          const [phase, dateStr] = parts
          if (phase !== dbPhase) continue
          
          const dbDate = new Date(dateStr)
          const diffMinutes = Math.abs(apiDate.getTime() - dbDate.getTime()) / (1000 * 60)
          
          // Margen de 120 minutos (2 horas) para capturar discrepancias de horario
          if (diffMinutes <= 120) {
            mapped = m
            matchingMethod = 'dateStage'
            console.log(`[Sync Match] Partido M${m.match_number} emparejado por fecha+fase (diff: ${Math.round(diffMinutes)}min)`)
            break
          }
        }
      }

      if (!mapped) {
        skippedNoMapping += 1
        
        // Log detallado de partido no encontrado
        const homeDisplay = `${homeCode || '???'}${homeName ? ` (${homeName})` : ''}`
        const awayDisplay = `${awayCode || '???'}${awayName ? ` (${awayName})` : ''}`
        const timeDisplay = fm.utcDate ? new Date(fm.utcDate).toISOString() : 'Sin hora'
        const phaseDisplay = fm.stage ? `[${fm.stage}]` : '[Sin fase]'
        console.log(`[Sync Fail] ${phaseDisplay} No se encontró pareja para: ${homeDisplay} vs ${awayDisplay} a las ${timeDisplay}`)
        
        if ((homeCode || homeName) && (awayCode || awayName) && sampleUnmapped.length < 10) {
          sampleUnmapped.push({ home: homeDisplay, away: awayDisplay, status: fm.status })
        }
        continue
      }

      // Contadores por método de mapeo
      if (matchingMethod === 'teams') matchedByTeams += 1
      if (matchingMethod === 'dateStage') matchedByDateStage += 1

      // AUTO-ASIGNACIÓN: Si BD tiene NULL pero API tiene equipos, asignar
      if ((!mapped.home_team_id || !mapped.away_team_id) && homeCode && awayCode && extHomeId && extAwayId) {
        const assignPatch: { home_team_id: number; away_team_id: number } = {
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
      if (mapped.manual_override) {
        skipped += 1
        continue
      }

      const rawHome = parseScore(fm.score?.fullTime?.home)
      const rawAway = parseScore(fm.score?.fullTime?.away)
      const homeScore = swapped ? rawAway : rawHome
      const awayScore = swapped ? rawHome : rawAway

      let shootoutWinner: number | null = null
      if (fm.score?.duration === 'PENALTY_SHOOTOUT' && mapped.home_team_id && mapped.away_team_id) {
        if (fm.score.winner === 'HOME_TEAM') shootoutWinner = swapped ? mapped.away_team_id : mapped.home_team_id
        if (fm.score.winner === 'AWAY_TEAM') shootoutWinner = swapped ? mapped.home_team_id : mapped.away_team_id
      }

      // Detectar si hay cambios reales antes de actualizar
      const newStatus = mapStatus(fm.status)
      
      // LÓGICA BLINDADA: Solo considerar cambios si la API envía datos válidos
      const scoreChanged = (
        (typeof homeScore === 'number' && mapped.home_score !== homeScore) ||
        (typeof awayScore === 'number' && mapped.away_score !== awayScore)
      )
      const shootoutChanged = shootoutWinner !== null && mapped.shootout_winner_team_id !== shootoutWinner
      const statusChanged = mapped.status !== newStatus
      
      const hasChanges = scoreChanged || shootoutChanged || statusChanged

      // Siempre actualizar last_synced_at para confirmar verificación con FIFA
      const updatePatch: Record<string, unknown> = {
        last_synced_at: new Date().toISOString(),
      }

      if (!hasChanges) {
        // Actualizar solo timestamp de verificación
        await supabase
          .from('matches')
          .update(updatePatch)
          .eq('id', mapped.id)
        
        skipped += 1
        lastMatchNumber = Math.max(lastMatchNumber, mapped.match_number)
        continue
      }

      // ACTUALIZACIÓN BLINDADA: Solo actualizar scores si la API envía números reales
      // REGLA DE ORO: Nunca sobrescribir scores existentes con null
      
      // Siempre actualizar status (crítico para detección de partidos en vivo)
      updatePatch.status = newStatus
      
      // Solo actualizar scores si la API trae números válidos (no null, no undefined)
      if (typeof homeScore === 'number') updatePatch.home_score = homeScore
      if (typeof awayScore === 'number') updatePatch.away_score = awayScore
      
      // Solo actualizar ganador de penales si hay valor válido
      if (shootoutWinner !== null) updatePatch.shootout_winner_team_id = shootoutWinner
      
      // Actualizar stadium solo si la API lo envía
      if (fm.venue) updatePatch.stadium = fm.venue

      // Guardar team labels si vienen de la API (TBD, Winner SF1, etc.)
      if (homeName) updatePatch.home_team_label = swapped ? awayName : homeName
      if (awayName) updatePatch.away_team_label = swapped ? homeName : awayName

      // Log de diagnóstico antes del update
      const scoreDisplay = homeScore !== null && awayScore !== null ? `${homeScore}-${awayScore}` : 'null-null'
      const statusChange = mapped.status !== newStatus ? `${mapped.status}→${newStatus}` : newStatus
      console.log(`[Shield Check M${mapped.match_number}]: API scores are ${homeScore}-${awayScore}`)
      console.log(`[Sync Update] M${mapped.match_number}: ${scoreDisplay} [${statusChange}] ${homeCode || '???'} vs ${awayCode || '???'}`)

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

      // NOTIFICACIONES AUTOMÁTICAS DESACTIVADAS
      // El administrador puede enviar notificaciones manuales desde /api/admin/notifications
      /*
      if (newStatus === 'finished' && mapped.status !== 'finished') {
        const teamHome = homeName || homeCode || 'Equipo A'
        const teamAway = awayName || awayCode || 'Equipo B'
        const scoreText = homeScore !== null && awayScore !== null
          ? `${homeScore}-${awayScore}`
          : 'Resultado actualizado'

        const { data: usersToNotify } = await supabase
          .from('profiles')
          .select('id')
          .eq('notifications_enabled', true)

        if (usersToNotify && usersToNotify.length > 0) {
          const notifications = usersToNotify.map((u) => ({
            user_id: u.id,
            title: '⚽ Partido finalizado',
            message: `${teamHome} ${scoreText} ${teamAway}`,
            type: 'match_update',
            link: '/leaderboard',
          }))

          await supabase.from('notifications').insert(notifications)
        }
      }
      */

      updated += 1
      lastMatchNumber = Math.max(lastMatchNumber, mapped.match_number)
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

    console.log(`[Sync Scan] Completado: ${updated} actualizaciones, ${skipped} sin cambios`)

    return NextResponse.json({
      ok: true,
      source: 'football-data.org',
      competitionCode,
      season: currentSeason,
      fallbackMode: currentSeason !== season,
      total_received: externalMatches.length,
      total_updated: updated,
      total_skipped: skipped,
      last_match_number: lastMatchNumber,
      upstreamCount: externalMatches.length,
      updated,
      matchedByTeams,
      matchedByDateStage,
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

