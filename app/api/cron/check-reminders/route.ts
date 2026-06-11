import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// RECORDATORIOS AUTOMÁTICOS DESACTIVADOS
// El administrador puede enviar notificaciones manuales desde el panel de Admin
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Recordatorios automáticos desactivados',
    notificationsSent: 0,
  })
}

