'use client'

import PageHeader from '@/components/PageHeader'
import Flag from '@/components/Flag'
import type { Team } from '@/lib/types'

interface OfficialStanding {
  team_id: number
  team_name: string
  group_code: string
  iso_code: string
  pj: number
  pg: number
  pe: number
  pp: number
  gf: number
  gc: number
  dg: number
  pts: number
}

interface BestThird extends OfficialStanding {
  third_place_rank: number
}

export default function TournamentClient({
  standingsByGroup,
  bestThirds,
  teams,
}: {
  standingsByGroup: Record<string, OfficialStanding[]>
  bestThirds: BestThird[]
  teams: Team[]
}) {
  const groupCodes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

  return (
    <>
      <PageHeader
        label="Mundial FIFA 2026"
        title="Resultados Oficiales"
        subtitle="Posiciones actualizadas en tiempo real"
      />

      <div className="max-w-7xl mx-auto space-y-8 pb-24">
        {/* Badge de datos oficiales */}
        <div className="flex items-center justify-center">
          <div className="badge bg-fifaGreen/20 text-fifaGreen border border-fifaGreen/30 px-4 py-2">
            <svg className="w-4 h-4 inline mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            DATOS OFICIALES FIFA
          </div>
        </div>

        {/* Grupos Oficiales */}
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-6 flex items-center gap-3">
            <span className="bg-fifaGreen/20 text-fifaGreen px-3 py-1 rounded-lg">Fase de Grupos</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groupCodes.map((code) => (
              <GroupCard
                key={code}
                groupCode={code}
                standings={standingsByGroup[code] || []}
                teams={teams}
              />
            ))}
          </div>
        </div>

        {/* Batalla de Terceros */}
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-4 flex items-center gap-3">
            <span className="bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-lg">⚔️ Batalla de los Terceros</span>
          </h2>
          <p className="text-sm text-white/60 mb-6">
            Los <span className="text-fifaGreen font-bold">primeros 8 equipos</span> clasifican a octavos de final
          </p>
          
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wider text-white/60">
                <tr>
                  <th className="text-center py-3 px-2 w-12">#</th>
                  <th className="text-left py-3 px-2">Equipo</th>
                  <th className="text-center py-3 px-2 w-16">Grupo</th>
                  <th className="text-center py-3 px-2 w-12">PJ</th>
                  <th className="text-center py-3 px-2 w-12">PG</th>
                  <th className="text-center py-3 px-2 w-12">PE</th>
                  <th className="text-center py-3 px-2 w-12">PP</th>
                  <th className="text-center py-3 px-2 w-12">GF</th>
                  <th className="text-center py-3 px-2 w-12">GC</th>
                  <th className="text-center py-3 px-2 w-12">DG</th>
                  <th className="text-center py-3 px-2 w-16 font-extrabold">PTS</th>
                </tr>
              </thead>
              <tbody>
                {bestThirds.map((t) => {
                  const team = teams.find(tm => tm.id === t.team_id)
                  const isQualified = t.third_place_rank <= 8
                  const isEliminated = t.third_place_rank > 8
                  
                  return (
                    <tr 
                      key={t.team_id} 
                      className={`border-t border-white/10 ${
                        isQualified 
                          ? 'bg-green-500/10 hover:bg-green-500/20' 
                          : isEliminated 
                          ? 'bg-red-500/5 opacity-60 hover:opacity-80'
                          : ''
                      } transition-all`}
                    >
                      <td className="text-center py-3 px-2">
                        <span className={`font-extrabold ${
                          isQualified ? 'text-green-400' : isEliminated ? 'text-red-400/70' : 'text-white/60'
                        }`}>
                          {t.third_place_rank}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          {team && <Flag team={team} size={16} />}
                          <span className="font-bold text-white">{t.team_name}</span>
                          {isQualified && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold">
                              CLASIFICADO
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className="badge bg-white/10 text-white/80 font-mono font-bold">{t.group_code}</span>
                      </td>
                      <td className="text-center text-white/70 py-3 px-2">{t.pj}</td>
                      <td className="text-center text-white/70 py-3 px-2">{t.pg}</td>
                      <td className="text-center text-white/70 py-3 px-2">{t.pe}</td>
                      <td className="text-center text-white/70 py-3 px-2">{t.pp}</td>
                      <td className="text-center text-white/70 py-3 px-2">{t.gf}</td>
                      <td className="text-center text-white/70 py-3 px-2">{t.gc}</td>
                      <td className="text-center text-white/80 py-3 px-2 font-semibold">
                        {t.dg > 0 ? '+' : ''}{t.dg}
                      </td>
                      <td className="text-center py-3 px-2">
                        <span className={`font-extrabold text-lg ${
                          isQualified ? 'text-fifaGreen' : 'text-white/60'
                        }`}>
                          {t.pts}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

function GroupCard({
  groupCode,
  standings,
  teams,
}: {
  groupCode: string
  standings: OfficialStanding[]
  teams: Team[]
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-black uppercase tracking-tight text-white">
          Grupo {groupCode}
        </h3>
      </div>
      
      <table className="w-full text-xs">
        <thead className="text-[9px] uppercase tracking-wider text-white/40">
          <tr>
            <th className="text-left py-1.5">#</th>
            <th className="text-left py-1.5">Equipo</th>
            <th className="text-center py-1.5 w-7">PJ</th>
            <th className="text-center py-1.5 w-7">DG</th>
            <th className="text-center py-1.5 w-8">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const team = teams.find(t => t.id === s.team_id)
            const top2 = i < 2
            const third = i === 2
            
            return (
              <tr key={s.team_id} className="border-t border-white/5">
                <td className="py-1.5">
                  <span className={`text-xs font-extrabold ${
                    top2 ? 'text-fifaGreen' : third ? 'text-yellow-500' : 'text-white/40'
                  }`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-1.5">
                  <div className="flex items-center gap-1.5">
                    {team && <Flag team={team} size={12} />}
                    <span className="text-[10px] font-bold text-white uppercase truncate">
                      {s.team_name}
                    </span>
                  </div>
                </td>
                <td className="text-center text-white/60 text-[11px]">{s.pj}</td>
                <td className="text-center text-white/70 text-[11px]">
                  {s.dg > 0 ? '+' : ''}{s.dg}
                </td>
                <td className="text-center font-extrabold text-white">{s.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
