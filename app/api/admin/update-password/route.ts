import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    // Validar sesión y rol de admin
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ ok: false, error: 'Solo los administradores pueden cambiar contraseñas' }, { status: 403 })
    }

    // Obtener parámetros
    const { userId, newPassword } = await req.json()

    if (!userId || !newPassword) {
      return NextResponse.json({ ok: false, error: 'userId y newPassword son requeridos' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    // Usar service role para actualizar contraseña
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json({ ok: false, error: 'Configuración del servidor incompleta' }, { status: 500 })
    }

    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 })
    }

    // Log de la acción (opcional: podrías guardar esto en una tabla de auditoría)
    console.log(`[ADMIN] ${user.email} cambió la contraseña del usuario ${userId}`)

    return NextResponse.json({ 
      ok: true, 
      message: 'Contraseña actualizada correctamente' 
    })

  } catch (error) {
    console.error('Error en update-password:', error)
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}
