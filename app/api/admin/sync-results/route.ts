import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createServerClient()
  
  // Verificar que el usuario es admin
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Solo admin' }, { status: 403 })
  }

  // Determinar URL base para llamar al endpoint de sync
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const host = process.env.VERCEL_URL || 'localhost:3000'
  const baseUrl = `${protocol}://${host}`
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET no configurado' }, { status: 500 })
  }

  try {
    const res = await fetch(`${baseUrl}/api/cron/sync-results`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
      },
      cache: 'no-store',
    })

    const data = await res.json()

    // Actualizar last_sync en settings
    const supabaseService = createServerClient()
    if (data.ok) {
      await supabaseService
        .from('settings')
        .update({ 
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
        })
        .eq('id', 1)
      
      return NextResponse.json({ 
        ok: true, 
        updated: data.updated || 0,
        details: data,
      })
    } else {
      await supabaseService
        .from('settings')
        .update({ 
          last_sync_error: data.error || 'Error desconocido',
        })
        .eq('id', 1)

      return NextResponse.json({ ok: false, error: data.error }, { status: 502 })
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Error al sincronizar'
    
    const supabaseService = await createServerClient()
    await supabaseService
      .from('settings')
      .update({ last_sync_error: errorMsg })
      .eq('id', 1)

    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 })
  }
}
