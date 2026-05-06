import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileClient from './ProfileClient'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: settings } = await supabase
    .from('settings')
    .select('lock_at')
    .eq('id', 1)
    .single()

  return <ProfileClient user={user} profile={profile} lockAt={settings?.lock_at || null} />
}
