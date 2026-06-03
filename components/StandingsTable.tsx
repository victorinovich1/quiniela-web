'use client'

import Flag from './Flag'
import type { Team } from '@/lib/types'

interface Standing {
  team_id: number
  team_name: string
  pj: number
  pts: number
  dg: number
  gf: number
  gc: number
}

interface StandingsTableProps {
  standings: Standing[]
  teams: Team[]
  className?: string
}

/**
 * Componente reutilizable para mostrar tabla de posiciones de un grupo
 * Usado en desktop (sidebar sticky) y móvil (al final) en PredictionsClient
 */
export default function StandingsTable({ standings, teams, className = '' }: StandingsTableProps) {
  return (
    <div className={className}>
      <div className="text-xs font-bold uppercase tracking-wider text-fifaGreen mb-2">Tabla en Vivo</div>
      <table className="w-full text-xs">
        <thead className="text-[9px] uppercase tracking-wider text-white/40">
          <tr>
            <th className="text-left py-1.5 pl-1">#</th>
            <th className="text-left py-1.5">Equipo</th>
            <th className="text-center py-1.5 w-7">PJ</th>
            <th className="text-center py-1.5 w-7">DG</th>
            <th className="text-center py-1.5 w-8">PTS</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((s, i) => {
            const t = teams.find((tt) => tt.id === s.team_id)
            const top2 = i < 2
            return (
              <tr key={s.team_id} className="border-t border-white/5">
                <td className="py-1.5 pl-1">
                  <span className={`text-xs font-extrabold ${top2 ? 'text-fifaGreen' : 'text-white/40'}`}>
                    {i + 1}
                  </span>
                </td>
                <td className="py-1.5">
                  <div className="flex items-center gap-1.5">
                    {t && <Flag team={t} size={12} />}
                    <span className="text-[10px] font-bold text-white uppercase truncate">{s.team_name}</span>
                  </div>
                </td>
                <td className="text-center text-white/60 text-[11px]">{s.pj}</td>
                <td className="text-center text-white/70 text-[11px]">{s.dg > 0 ? '+' : ''}{s.dg}</td>
                <td className="text-center font-extrabold text-white">{s.pts}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
