import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const invite = url.searchParams.get('invite')
  const next = url.searchParams.get('next') || '/predictions'

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const errorUrl = new URL('/login', request.url)
      errorUrl.searchParams.set('error', error.message)
      return NextResponse.redirect(errorUrl)
    }
  }

  // Si el destino es reset-password, ir directo (flujo de recuperación de contraseña)
  // No necesita pasar por /auth/finish porque no hay invitación que canjear
  if (next === '/reset-password') {
    const target = new URL(next, request.url)
    return NextResponse.redirect(target)
  }

  // Para otros casos (signup con invitación), redirect to /auth/finish
  // para canjear invitación desde localStorage
  const target = new URL('/auth/finish', request.url)
  if (invite) target.searchParams.set('invite', invite)
  target.searchParams.set('next', next)
  return NextResponse.redirect(target)
}
