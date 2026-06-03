import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
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
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https'
  const host = request.headers.get('host') || 'localhost:3000'
  const baseUrl = `${protocol}://${host}`
  const cronSecret = process.env.CRON_SECRET
  const vercelBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

  if (!cronSecret) {
    return NextResponse.json({ ok: false, error: 'CRON_SECRET no configurado' }, { status: 500 })
  }

  try {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${cronSecret}`,
    }
    
    // Bypass de protección de Vercel Preview
    if (vercelBypass) {
      headers['x-vercel-protection-bypass'] = vercelBypass
    }

    const res = await fetch(`${baseUrl}/api/cron/sync-results`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[admin/sync-results] Error response:', res.status, errorText.slice(0, 500))
      
      let errorMsg = `Error del servidor (${res.status}). Revisa los logs de Vercel.`
      if (res.status === 401) {
        errorMsg = 'Error 401: La llave CRON_SECRET no coincide o Vercel bloqueó la conexión'
      }
      
      return NextResponse.json({ 
        ok: false, 
        error: errorMsg,
      }, { status: res.status })
    }

    let data
    try {
      data = await res.json()
    } catch (parseErr) {
      console.error('[admin/sync-results] Error parsing JSON:', parseErr)
      return NextResponse.json({ 
        ok: false, 
        error: 'Respuesta no es JSON válido',
      }, { status: 502 })
    }

    // Actualizar last_sync en settings
    if (data.ok) {
      await supabase
        .from('settings')
        .update({ 
          last_sync_at: new Date().toISOString(),
          last_sync_error: null,
        })
        .eq('id', 1)
      
      return NextResponse.json({ 
        ok: true, 
        updated: data.updated || 0,
        upstreamCount: data.upstreamCount || 0,
        matchedByTeams: data.matchedByTeams || 0,
        matchedByDateStage: data.matchedByDateStage || 0,
        autoAssignedTeams: data.autoAssignedTeams || 0,
        details: data,
      })
    } else {
      await supabase
        .from('settings')
        .update({ 
          last_sync_error: data.error || 'Error desconocido',
        })
        .eq('id', 1)

      return NextResponse.json({ ok: false, error: data.error }, { status: 502 })
    }
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : 'Error al sincronizar'
    console.error('[admin/sync-results] Exception:', e)
    
    await supabase
      .from('settings')
      .update({ last_sync_error: errorMsg })
      .eq('id', 1)

    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 })
  }
}
