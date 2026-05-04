import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EntriesClient from './EntriesClient'
import type { Entry } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function EntriesPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: entries }, { data: locked }] = await Promise.all([
    supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at'),
    supabase.rpc('predictions_locked'),
  ])

  return (
    <EntriesClient
      entries={(entries ?? []) as Entry[]}
      locked={!!locked}
      userId={user.id}
    />
  )
}
