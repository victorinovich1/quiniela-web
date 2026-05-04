import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'
import type { Team, Match, Profile, Invitation, Settings, Entry } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  if (profile?.role !== 'admin') redirect('/predictions')

  const [
    { data: teams },
    { data: matches },
    { data: profiles },
    { data: invitations },
    { data: settings },
    { data: entries },
  ] = await Promise.all([
    supabase.from('teams').select('*').order('group_code').order('position_in_group'),
    supabase.from('matches').select('*').order('match_number'),
    supabase.from('profiles').select('*').order('created_at'),
    supabase.from('invitations').select('*').order('created_at', { ascending: false }),
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
    supabase.from('entries').select('*').order('created_at'),
  ])

  return (
    <AdminClient
      teams={(teams ?? []) as Team[]}
      matches={(matches ?? []) as Match[]}
      profiles={(profiles ?? []) as Profile[]}
      invitations={(invitations ?? []) as Invitation[]}
      settings={(settings ?? null) as Settings | null}
      entries={(entries ?? []) as Entry[]}
    />
  )
}
