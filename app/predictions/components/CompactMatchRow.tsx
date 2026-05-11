import type { Match, Team } from '@/lib/types'
import Flag from '@/components/Flag'
import { isMatchLocked, getMatchStatus } from '@/lib/utils'

type PredMap = Record<number, { home: number | null; away: number | null; ko: number | null }>

interface CompactMatchRowProps {
  match: Match
  preds: PredMap
  setScore: (matchId: number, key: 'home' | 'away', value: string) => void
  locked: boolean
  teamsById: Record<number, Team>
}

export default function CompactMatchRow({
  match,
  preds,
  setScore,
  locked,
  teamsById,
}: CompactMatchRowProps) {
  const p = preds[match.id] ?? { home: null, away: null, ko: null }
  const homeTeam = match.home_team_id ? teamsById[match.home_team_id] : null
  const awayTeam = match.away_team_id ? teamsById[match.away_team_id] : null
  const homeLabel = homeTeam?.name || match.home_team_label || 'TBD'
  const awayLabel = awayTeam?.name || match.away_team_label || 'TBD'

  const kickoff = match.kickoff_at ? new Date(match.kickoff_at) : null
  const timeStr = kickoff ? kickoff.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  const matchLocked = isMatchLocked(match, locked)
  
  // Usar función centralizada para determinar estado real
  const status = getMatchStatus(match)
  const showLive = status === 'live'
  const isLockedByStatus = status !== 'scheduled'

  const stadium = match.stadium || ''
  const stadiumParts = stadium.split(',').map((s) => s.trim())
  const cityShort = stadiumParts[1] || stadiumParts[0] || ''

  return (
    <div className={`card p-2 hover:bg-white/5 transition-colors ${matchLocked ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-2">
        <div className="text-[10px] font-black text-white/40 w-7 text-center">
          M{match.match_number}
        </div>

        <div className="text-[11px] font-bold w-12">
          {isLockedByStatus ? (
            <span className="text-white/40 text-[9px] uppercase tracking-wider">Cerrado</span>
          ) : showLive ? (
            <span className="text-red-500 animate-pulse">VIVO</span>
          ) : (
            <span className="text-white/60">{timeStr}</span>
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5">
          {homeTeam ? (
            <>
              <span className="text-[11px] font-bold text-white uppercase truncate text-right">{homeLabel}</span>
              <Flag team={homeTeam} size={12} />
            </>
          ) : (
            <span className="text-[11px] font-bold text-white/40 uppercase truncate text-right">{homeLabel}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={99}
            inputMode="numeric"
            value={p.home ?? ''}
            onChange={(e) => setScore(match.id, 'home', e.target.value)}
            disabled={matchLocked}
            className={`score-input w-8 h-8 text-sm ${matchLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Goles ${homeLabel}`}
          />
          <span className="text-white/30 text-xs">−</span>
          <input
            type="number"
            min={0}
            max={99}
            inputMode="numeric"
            value={p.away ?? ''}
            onChange={(e) => setScore(match.id, 'away', e.target.value)}
            disabled={matchLocked}
            className={`score-input w-8 h-8 text-sm ${matchLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Goles ${awayLabel}`}
          />
          {matchLocked && match.status !== 'scheduled' && (
            <svg className="w-3 h-3 text-white/40 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-1.5">
          {awayTeam ? (
            <>
              <Flag team={awayTeam} size={12} />
              <span className="text-[11px] font-bold text-white uppercase truncate">{awayLabel}</span>
            </>
          ) : (
            <span className="text-[11px] font-bold text-white/40 uppercase truncate">{awayLabel}</span>
          )}
        </div>

        {cityShort && (
          <div className="hidden md:block text-[10px] font-bold text-white/40 uppercase truncate w-20 text-right">
            {cityShort}
          </div>
        )}
      </div>
    </div>
  )
}
