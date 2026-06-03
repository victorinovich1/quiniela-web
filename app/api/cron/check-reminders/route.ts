import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { DEFAULT_VAPID_EMAIL } from '@/lib/constants'
import webpush from 'web-push'

// Configurar VAPID keys
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_KEY) {
  const vapidEmail = process.env.VAPID_CONTACT_EMAIL || DEFAULT_VAPID_EMAIL
  webpush.setVapidDetails(
    vapidEmail,
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
        
        // Solo admin puede ejecutar manualmente
        if (profile.role === 'admin') {
          isAuthorized = true
        }
      }
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

    // OPTIMIZACIÓN BULK: Obtener todos los datos necesarios en una sola pasada
    const matchIds = upcomingMatches.map(m => m.id)
    const matchNumbers = upcomingMatches.map(m => m.match_number)

    // 1. Obtener TODAS las entries activas
    const { data: allEntries, error: entriesError } = await supabase
      .from('entries')
      .select('id, user_id, alias')

    if (entriesError || !allEntries || allEntries.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'No active entries found',
        sent: 0,
      })
    }

    const allUserIds = [...new Set(allEntries.map(e => e.user_id))]

    // 2. Obtener TODAS las predictions para estos matches
    const { data: allPredictions } = await supabase
      .from('predictions')
      .select('entry_id, match_id, home_score')
      .in('match_id', matchIds)

    // Crear índice: `${entry_id}_${match_id}` -> prediction
    const predictionIndex = new Map<string, { home_score: number | null }>()
    if (allPredictions) {
      for (const pred of allPredictions) {
        predictionIndex.set(`${pred.entry_id}_${pred.match_id}`, pred)
      }
    }

    // 3. Obtener TODOS los profiles (notificaciones habilitadas)
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, notifications_enabled')
      .in('id', allUserIds)

    const profileIndex = new Map<string, boolean>()
    if (allProfiles) {
      for (const p of allProfiles) {
        profileIndex.set(p.id, p.notifications_enabled ?? true)
      }
    }

    // 4. ANTI-SPAM: Obtener TODAS las notificaciones recientes (últimas 2 horas)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const { data: recentNotifs } = await supabase
      .from('notifications')
      .select('user_id, message, created_at')
      .in('user_id', allUserIds)
      .gte('created_at', twoHoursAgo.toISOString())

    // Crear índice: user_id -> Set de match_numbers ya notificados
    const notifiedMatchesByUser = new Map<string, Set<number>>()
    if (recentNotifs) {
      for (const notif of recentNotifs) {
        // Extraer match_number del mensaje (formato: "Partido #42 comienza...")
        const match = notif.message.match(/Partido #(\d+)/)
        if (match) {
          const matchNum = parseInt(match[1], 10)
          if (!notifiedMatchesByUser.has(notif.user_id)) {
            notifiedMatchesByUser.set(notif.user_id, new Set())
          }
          notifiedMatchesByUser.get(notif.user_id)!.add(matchNum)
        }
      }
    }

    // 5. Obtener TODAS las push subscriptions de una vez
    const { data: allPushSubs } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', allUserIds)

    const pushSubsByUser = new Map<string, any[]>()
    if (allPushSubs) {
      for (const sub of allPushSubs) {
        if (!pushSubsByUser.has(sub.user_id)) {
          pushSubsByUser.set(sub.user_id, [])
        }
        pushSubsByUser.get(sub.user_id)!.push(sub)
      }
    }

    // 6. CRUZAR DATOS EN MEMORIA
    let totalSent = 0
    const notificationsToInsert: any[] = []

    for (const match of upcomingMatches) {
      for (const entry of allEntries) {
        // Skip si ya tiene predicción con score
        const pred = predictionIndex.get(`${entry.id}_${match.id}`)
        if (pred && pred.home_score !== null) continue

        // Skip si ya se notificó este partido a este usuario
        const notifiedMatches = notifiedMatchesByUser.get(entry.user_id)
        if (notifiedMatches?.has(match.match_number)) continue

        // Skip si el usuario tiene notificaciones deshabilitadas
        if (!profileIndex.get(entry.user_id)) continue

        // Calcular minutos faltantes
        const matchTime = new Date(match.kickoff_at)
        const minutesLeft = Math.round((matchTime.getTime() - now.getTime()) / (60 * 1000))

        const message = `Partido #${match.match_number} comienza en ${minutesLeft} minutos. ¡No olvides pronosticar con tu jugada "${entry.alias}"!`

        notificationsToInsert.push({
          user_id: entry.user_id,
          title: '⏰ Partido por comenzar',
          message,
          type: 'warning',
          link: '/predictions',
          batch_id: batchId,
        })
      }
    }

    // 7. INSERTAR NOTIFICACIONES EN LOTE
    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)

      if (!insertError) {
        totalSent = notificationsToInsert.length

        // 8. ENVIAR WEB PUSH EN PARALELO
        const pushPromises: Promise<any>[] = []
        for (const notif of notificationsToInsert) {
          const subs = pushSubsByUser.get(notif.user_id) || []
          for (const sub of subs) {
            pushPromises.push(
              webpush.sendNotification(
                sub.subscription as any,
                JSON.stringify({
                  title: notif.title,
                  message: notif.message,
                  link: notif.link,
                })
              ).catch((pushError: any) => {
                if (pushError.statusCode === 410) {
                  // Eliminar suscripción expirada
                  supabase.from('push_subscriptions').delete().eq('id', sub.id).then()
                }
                console.error('[Push] Error:', pushError.message)
              })
            )
          }
        }

        await Promise.allSettled(pushPromises)
      } else {
        console.error('[Bulk Insert] Error al insertar notificaciones:', insertError)
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
