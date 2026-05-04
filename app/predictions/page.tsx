import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PredictionsClient from './PredictionsClient'
import type {
  Match,
  Team,
  Prediction,
  SpecialPrediction,
  Settings,
  Entry,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PredictionsPage({
  searchParams,
}: {
  searchParams: { entry?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Cargar las jugadas del usuario
  const { data: entriesRaw } = await supabase
    .from('entries')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at')
  const entries = (entriesRaw ?? []) as Entry[]

  if (entries.length === 0) {
    redirect('/entries')
  }

  // Resolver entry activa: ?entry=N o la primera
  const requestedId = searchParams.entry ? Number(searchParams.entry) : null
  const activeEntry =
    (requestedId && entries.find((e) => e.id === requestedId)) || entries[0]

  if (!activeEntry) redirect('/entries')

  const [
    { data: teams },
    { data: matches },
    { data: predictions },
    { data: special },
    { data: settings },
    { data: lockedRpc },
  ] = await Promise.all([
    supabase.from('teams').select('*').order('group_code').order('position_in_group'),
    supabase.from('matches').select('*').order('match_number', { ascending: true }),
    supabase.from('predictions').select('*').eq('entry_id', activeEntry.id),
    supabase.from('special_predictions').select('*').eq('entry_id', activeEntry.id).maybeSingle(),
    supabase.from('settings').select('lock_at').eq('id', 1).maybeSingle(),
    supabase.rpc('predictions_locked'),
  ])

  return (
    <PredictionsClient
      entries={entries}
      activeEntryId={activeEntry.id}
      teams={(teams ?? []) as Team[]}
      matches={(matches ?? []) as Match[]}
      predictions={(predictions ?? []) as Prediction[]}
      special={special as SpecialPrediction | null}
      lockAt={(settings as Pick<Settings, 'lock_at'> | null)?.lock_at ?? null}
      locked={!!lockedRpc}
    />
  )
}
