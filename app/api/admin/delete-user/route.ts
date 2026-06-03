import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  // Verificar autenticación
  const { data: { user }, error: authErr } = await supabase.auth.getUser()
  if (authErr || !user) {
    return NextResponse.json({ ok: false, error: 'No autenticado' }, { status: 401 })
  }

  // Verificar que el usuario es admin (NO manager)
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ ok: false, error: 'Solo admin puede eliminar usuarios' }, { status: 403 })
  }

  // Obtener target_user_id del body
  const { target_user_id } = await request.json()
  
  if (!target_user_id) {
    return NextResponse.json({ ok: false, error: 'target_user_id requerido' }, { status: 400 })
  }

  // Crear cliente admin con service_role
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: 'Configuración de servidor incompleta' },
      { status: 500 }
    )
  }

  const adminClient = createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    // Eliminar usuario usando admin client
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(target_user_id)

    if (deleteError) {
      console.error('[delete-user] Error:', deleteError)
      return NextResponse.json(
        { ok: false, error: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[delete-user] Exception:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Error desconocido' },
      { status: 500 }
    )
  }
}
