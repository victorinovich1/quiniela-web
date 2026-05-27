import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configurar VAPID keys
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@quinielamundial.com',
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export const dynamic = 'force-dynamic'

// Margen de búsqueda: 30-50 minutos
// Con cron job cada 10 min, siempre 'caza' el partido
const REMINDER_MIN_MINUTES = 30
const REMINDER_MAX_MINUTES = 50

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Verificar autenticación: puede ser cron job O admin/manager
  let isAuthorized = false
  let debugInfo = { userId: '', role: '', method: '' }
  
  // Opción 1: Cron job con secret
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    isAuthorized = true
    debugInfo.method = 'cron-secret'
    console.log('[Auth Success] Cron job autorizado')
  }
  
  // Opción 2: Usuario admin/manager desde frontend
  if (!isAuthorized) {
    const serverClient = createServerClient()
    const { data: { user }, error: userError } = await serverClient.auth.getUser()
    
    if (userError) {
      console.error('[Auth Error] Error al obtener usuario:', userError.message)
    }
    
    if (user) {
      debugInfo.userId = user.id
      debugInfo.method = 'session'
      
      // Obtener perfil del usuario para verificar rol
      const { data: profile, error: profileError } = await serverClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profileError) {
        console.error('[Auth Error] Error al obtener perfil:', profileError.message)
      }
      
      if (profile) {
        debugInfo.role = profile.role || 'ninguno'
        
        // Permitir tanto admin como manager
        if (profile.role === 'admin' || profile.role === 'manager') {
          isAuthorized = true
          console.log(`[Auth Success] Usuario autorizado - User: ${user.id}, Role: ${profile.role}`)
        } else {
          console.warn(`[Auth Error] Rol insuficiente - User: ${user.id}, Role: ${profile.role}`)
        }
      } else {
        console.warn(`[Auth Error] Perfil no encontrado - User: ${user.id}`)
      }
    } else {
      console.warn('[Auth Error] Usuario no autenticado')
    }
  }
  
  if (!isAuthorized) {
    console.error('[Auth Error] Acceso denegado:', debugInfo)
    return NextResponse.json(
      { ok: false, error: 'Solo administradores pueden ejecutar pruebas', debug: debugInfo },
      { status: 403 }
    )
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Generar batch_id único para este lote de recordatorios
    const batchId = `auto-reminder-${new Date().toISOString()}`
    
    // Calcular ventana de tiempo: ahora + 30 a 50 minutos
    const now = new Date()
    const futureStart = new Date(now.getTime() + REMINDER_MIN_MINUTES * 60 * 1000)
    const futureEnd = new Date(now.getTime() + REMINDER_MAX_MINUTES * 60 * 1000)

    // Obtener partidos que empiezan en la ventana de tiempo
    const { data: upcomingMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, match_number, kickoff_at, home_team_id, away_team_id')
      .eq('status', 'scheduled')
      .gte('kickoff_at', futureStart.toISOString())
      .lte('kickoff_at', futureEnd.toISOString())

    if (matchesError || !upcomingMatches) {
      console.error('Error fetching upcoming matches:', matchesError)
      return NextResponse.json({ ok: false, error: matchesError?.message })
    }

    if (upcomingMatches.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No upcoming matches within reminder window',
        sent: 0,
      })
    }

    let totalSent = 0

    for (const match of upcomingMatches) {
      // Obtener todas las entries activas
      const { data: entries } = await supabase
        .from('entries')
        .select('id, user_id, alias')

      if (!entries || entries.length === 0) continue

      for (const entry of entries) {
        // Verificar si ya tiene predicción para este partido (home_score null = no pronosticado)
        const { data: existingPrediction } = await supabase
          .from('predictions')
          .select('id, home_score')
          .eq('entry_id', entry.id)
          .eq('match_id', match.id)
          .maybeSingle()

        // Si ya tiene predicción con score, skip
        if (existingPrediction && existingPrediction.home_score !== null) continue

        // ANTI-SPAM: Verificar si ya se envió recordatorio para este partido/usuario
        // Búsqueda robusta: user_id + match_number en mensaje + últimas 2 horas
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        const { data: recentReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', entry.user_id)
          .ilike('message', `%Partido #${match.match_number}%`)
          .gte('created_at', twoHoursAgo.toISOString())
          .maybeSingle()

        // Si ya se envió recordatorio para este partido, skip
        if (recentReminder) continue

        // Verificar si el usuario tiene notificaciones habilitadas
        const { data: profile } = await supabase
          .from('profiles')
          .select('notifications_enabled')
          .eq('id', entry.user_id)
          .single()

        if (!profile?.notifications_enabled) continue

        // Calcular minutos faltantes
        const matchTime = new Date(match.kickoff_at)
        const minutesLeft = Math.round((matchTime.getTime() - now.getTime()) / (60 * 1000))

        // Crear notificación con batch_id para historial admin
        const message = `Partido #${match.match_number} comienza en ${minutesLeft} minutos. ¡No olvides pronosticar con tu jugada "${entry.alias}"!`

        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: entry.user_id,
            title: '⏰ Partido por comenzar',
            message,
            type: 'warning',
            link: '/predictions',
            batch_id: batchId, // ← Compartido por todos los recordatorios de esta ejecución
          })

        if (!insertError) {
          totalSent += 1

          // Enviar Web Push si el usuario está suscrito
          const { data: pushSubs } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', entry.user_id)

          if (pushSubs && pushSubs.length > 0) {
            for (const sub of pushSubs) {
              try {
                await webpush.sendNotification(
                  sub.subscription as any,
                  JSON.stringify({
                    title: '⏰ Partido por comenzar',
                    message,
                    link: '/predictions',
                  })
                )
                console.log('[Push] Push enviado con éxito (recordatorio) a:', entry.user_id)
              } catch (pushError: any) {
                // Si el endpoint ya no es válido (410 Gone), eliminar la suscripción
                if (pushError.statusCode === 410) {
                  console.log('[Push] Suscripción expirada, eliminando:', sub.id)
                  await supabase
                    .from('push_subscriptions')
                    .delete()
                    .eq('id', sub.id)
                }
                console.error('[Push] Error enviando recordatorio:', pushError.message)
              }
            }
          }
        }
      }
    }

    return NextResponse.json({
      ok: true,
      matchesChecked: upcomingMatches.length,
      remindersSent: totalSent,
    })
  } catch (err) {
    console.error('Error in check-reminders:', err)
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    )
  }
}
