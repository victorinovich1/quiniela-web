import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const REMINDER_MARGIN_MINUTES = 45

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Verificar autenticación
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // Calcular ventana de tiempo: ahora + REMINDER_MARGIN_MINUTES
    const now = new Date()
    const futureLimit = new Date(now.getTime() + REMINDER_MARGIN_MINUTES * 60 * 1000)

    // Obtener partidos que empiezan pronto y aún no han comenzado
    const { data: upcomingMatches, error: matchesError } = await supabase
      .from('matches')
      .select('id, match_number, kickoff_at, home_team_id, away_team_id')
      .eq('status', 'scheduled')
      .gte('kickoff_at', now.toISOString())
      .lte('kickoff_at', futureLimit.toISOString())

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
        // Verificar si ya tiene predicción para este partido
        const { data: existingPrediction } = await supabase
          .from('predictions')
          .select('id')
          .eq('entry_id', entry.id)
          .eq('match_id', match.id)
          .single()

        // Si ya tiene predicción, skip
        if (existingPrediction) continue

        // Verificar si ya se envió recordatorio reciente (últimas 2 horas)
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
        const reminderTitle = `⏰ Partido por comenzar`
        const { data: recentReminder } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', entry.user_id)
          .eq('title', reminderTitle)
          .ilike('message', `%Partido #${match.match_number}%`)
          .gte('created_at', twoHoursAgo.toISOString())
          .limit(1)
          .single()

        // Si ya se envió, skip
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

        // Crear notificación
        const message = `Partido #${match.match_number} comienza en ${minutesLeft} minutos. ¡No olvides pronosticar con tu jugada "${entry.alias}"!`

        const { error: insertError } = await supabase
          .from('notifications')
          .insert({
            user_id: entry.user_id,
            title: reminderTitle,
            message,
            type: 'warning',
            link: '/predictions',
          })

        if (!insertError) {
          totalSent += 1
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
