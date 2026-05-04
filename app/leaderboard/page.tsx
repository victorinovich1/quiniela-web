import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PageHeader from '@/components/PageHeader'
import type { LeaderboardRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default async function LeaderboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data, error } = await supabase
    .from('leaderboard')
    .select('entry_id, user_id, display_name, alias, paid, match_points, special_points, total_points')
    .order('total_points', { ascending: false })

  const rows = (data ?? []) as LeaderboardRow[]
  const updatedAt = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="pb-24">
      <PageHeader
        label="Clasificación general"
        title="Ranking"
        subtitle={`Actualizado: ${updatedAt}`}
      />

      {error && (
        <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 mb-4 text-sm">
          {error.message}
        </div>
      )}

      <div className="card p-2 sm:p-3">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-white/40 uppercase tracking-wider text-sm">
            Aún no hay jugadas registradas
          </div>
        ) : (
          <div>
            <div className="grid grid-cols-[36px_1fr_60px_60px_64px] sm:grid-cols-[40px_1fr_80px_80px_80px] items-center gap-2 px-2 py-2 label-up border-b border-white/10">
              <div>#</div>
              <div>Jugada</div>
              <div className="text-right hidden sm:block">Partidos</div>
              <div className="text-right hidden sm:block">Esp.</div>
              <div className="text-right">Total</div>
            </div>
            {rows.map((row, idx) => {
              const isMe = row.user_id === user.id
              const medal = idx === 0 ? 'text-gold' : idx < 3 ? 'text-fifaGreen' : 'text-white/40'
              return (
                <div key={row.entry_id}
                  className={`grid grid-cols-[36px_1fr_60px_60px_64px] sm:grid-cols-[40px_1fr_80px_80px_80px] items-center gap-2 px-2 py-3 border-b border-white/5 last:border-0 ${
                    isMe ? 'bg-gold/10 rounded-lg' : ''
                  }`}>
                  <div className={`text-base font-extrabold ${medal}`}>{idx + 1}</div>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-extrabold flex-shrink-0 ${
                      idx === 0 ? 'bg-gold text-navy-deepest' : idx < 3 ? 'bg-fifaGreen text-navy-deepest' : 'bg-white/10 text-white/80'
                    }`}>
                      {initials(row.alias)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight truncate">{row.alias}</span>
                        {isMe && <span className="badge bg-gold text-navy-deepest">Tú</span>}
                        {!row.paid && <span className="badge bg-danger/30 text-danger">Sin pagar</span>}
                      </div>
                      <div className="text-[10px] text-white/40 truncate">
                        {row.display_name || 'Anónimo'}
                        <span className="sm:hidden"> · {row.match_points}G + {row.special_points}E</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-white/60 text-sm hidden sm:block">{row.match_points}</div>
                  <div className="text-right text-white/60 text-sm hidden sm:block">{row.special_points}</div>
                  <div className="text-right font-extrabold text-white text-base sm:text-lg">{row.total_points}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
