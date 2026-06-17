import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_SETTINGS_ID } from '@/lib/constants'
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
    .select('*')
    .eq('id', 1)
    .single()

  // Obtener stats del usuario desde leaderboard
  const { data: userStats } = await supabase
    .from('leaderboard')
    .select('total_points, total_exact')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <ProfileClient 
      user={user} 
      profile={profile} 
      settings={settings}
      totalPoints={userStats?.total_points ?? 0}
      exactCount={userStats?.total_exact ?? 0}
    />
  )
}
