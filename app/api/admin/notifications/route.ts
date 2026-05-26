import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configurar VAPID keys (solo una vez)
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_KEY) {
  webpush.setVapidDetails(
    'mailto:admin@quinielamundial.com',
    process.env.NEXT_PUBLIC_VAPID_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verificar que el usuario sea admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { title, message, link, userIds, sendPush = true } = body

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message required' }, { status: 400 })
    }

    const batch_id = crypto.randomUUID()
    const targetUserIds = userIds || []

    // Si no hay userIds específicos, enviar a todos los usuarios activos
    let targetUsers = targetUserIds
    if (targetUsers.length === 0) {
      const { data: allUsers } = await supabase
        .from('profiles')
        .select('id')
        .eq('notifications_enabled', true)
      
      targetUsers = allUsers?.map(u => u.id) || []
    }

    // Crear notificaciones en la BD
    const notifications = targetUsers.map((userId: string) => ({
      user_id: userId,
      title,
      message,
      type: 'info' as const,
      read: false,
      link: link || null,
      batch_id,
    }))

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (insertError) {
      console.error('Error inserting notifications:', insertError)
      return NextResponse.json({ error: 'Failed to create notifications' }, { status: 500 })
    }

    // Enviar Web Push si está habilitado
    if (sendPush) {
      const { data: subscriptions } = await supabase
        .from('push_subscriptions')
        .select('*')
        .in('user_id', targetUsers)

      if (subscriptions && subscriptions.length > 0) {
        const pushPromises = subscriptions.map(async (sub) => {
          try {
            await webpush.sendNotification(
              sub.subscription as any,
              JSON.stringify({
                title,
                message,
                link: link || '/',
              })
            )
          } catch (err: any) {
            // Si el endpoint ya no es válido (410 Gone), eliminar la suscripción
            if (err.statusCode === 410) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id)
            }
            console.error('Push error:', err)
          }
        })

        await Promise.allSettled(pushPromises)
      }
    }

    return NextResponse.json({ 
      success: true, 
      batch_id,
      notificationsSent: targetUsers.length 
    })

  } catch (error) {
    console.error('Notification route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
