import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { LeaderboardRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) redirect('/predictions')

  const { data: top } = await supabase
    .from('leaderboard')
    .select('entry_id, user_id, display_name, alias, paid, match_points, special_points, total_points')
    .order('total_points', { ascending: false })
    .limit(5)

  const leaders = (top ?? []) as LeaderboardRow[]

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center py-10">
      <div className="max-w-2xl w-full">
        <div className="inline-block bg-fifaGreen/15 border border-fifaGreen/40 px-4 py-1.5 rounded-full mb-6">
          <span className="text-fifaGreen text-xs font-bold uppercase tracking-[0.2em]">FIFA World Cup 2026</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4">
          <span className="text-white">QUINIELA</span>
          <br />
          <span className="bg-gradient-to-r from-fifaGreen via-fifaGreen-light to-gold bg-clip-text text-transparent">MUNDIAL 2026</span>
        </h1>

        <p className="text-base md:text-lg text-white/60 mb-10 max-w-md mx-auto">
          Pronostica los partidos, sube en el ranking, gana la quiniela.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link href="/login" className="btn btn-primary">
            Ya tengo cuenta
          </Link>
          <Link href="/signup" className="btn btn-outline">
            Tengo código de invitación
          </Link>
        </div>

        {leaders.length > 0 && (
          <div className="card text-left max-w-md mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="label-up">Top 5 del ranking</span>
              <span className="text-fifaGreen text-[10px] font-bold uppercase tracking-wider">EN VIVO</span>
            </div>
            <div className="space-y-2">
              {leaders.map((row, idx) => (
                <div key={row.entry_id} className="flex items-center justify-between py-2 border-t border-white/5 first:border-0">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-extrabold w-5 ${idx === 0 ? 'text-gold' : idx < 3 ? 'text-fifaGreen' : 'text-white/40'}`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm text-white font-bold uppercase tracking-tight">{row.alias}</span>
                  </div>
                  <span className="text-sm font-extrabold text-white">{row.total_points}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
