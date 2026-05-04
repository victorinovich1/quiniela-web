'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function AuthFinishInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [message, setMessage] = useState('Iniciando sesión...')

  useEffect(() => {
    let cancelled = false
    async function run() {
      const supabase = createClient()
      const next = params.get('next') || '/predictions'
      const inviteParam = params.get('invite')
      const stored = typeof window !== 'undefined' ? window.localStorage.getItem('pending_invite') : null
      const code = (inviteParam || stored || '').trim().toUpperCase()

      if (code) {
        setMessage('Aplicando código de invitación...')
        const { error } = await supabase.rpc('redeem_invite', { p_code: code })
        if (!error) {
          window.localStorage.removeItem('pending_invite')
        }
      }

      if (!cancelled) {
        router.replace(next)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [params, router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-fifaGreen border-t-transparent mb-4"></div>
        <p className="text-white/60 text-sm uppercase tracking-wider font-bold">{message}</p>
      </div>
    </div>
  )
}

export default function AuthFinishPage() {
  return (
    <Suspense fallback={<div className="text-center py-10 text-white/40 uppercase tracking-wider text-sm">Cargando...</div>}>
      <AuthFinishInner />
    </Suspense>
  )
}
