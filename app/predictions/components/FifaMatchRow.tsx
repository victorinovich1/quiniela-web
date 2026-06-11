'use client'

import { useState, useEffect } from 'react'
import type { Match, Team } from '@/lib/types'
import Flag from '@/components/Flag'
import { isMatchLocked, getMatchStatus, parseUTCDate } from '@/lib/utils'

type PredMap = Record<number, { home: number | null; away: number | null; ko: number | null }>

interface FifaMatchRowProps {
  match: Match
  preds: PredMap
  setScore: (matchId: number, key: 'home' | 'away', value: string) => void
  locked: boolean
  teamsById: Record<number, Team>
  showKoWinner?: boolean
  setKoWinner?: (matchId: number, teamId: number | null) => void
  teamsForKo?: Team[]
}

export default function FifaMatchRow({
  match,
  preds,
  setScore,
  locked,
  teamsById,
  showKoWinner,
  setKoWinner,
  teamsForKo,
}: FifaMatchRowProps) {
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const p = preds[match.id] ?? { home: null, away: null, ko: null }
  const homeTeam = match.home_team_id ? teamsById[match.home_team_id] : null
  const awayTeam = match.away_team_id ? teamsById[match.away_team_id] : null
  const homeLabel = homeTeam?.name || match.home_team_label || 'Por definir'
  const awayLabel = awayTeam?.name || match.away_team_label || 'Por definir'

  const isKnockout = match.phase !== 'group'
  const teamsNotDefined = !match.home_team_id || !match.away_team_id
  const matchLocked = isMatchLocked(match)
  const disableInputs = matchLocked || (isKnockout && teamsNotDefined)
  
  // Usar función centralizada para determinar estado real
  const status = getMatchStatus(match)
  const showLive = status === 'live'
  const isLockedByStatus = status !== 'scheduled'

  const showKoSelect = showKoWinner && p.home !== null && p.away !== null && p.home === p.away

  let koOptions: { id: number; name: string }[] = []
  if (showKoSelect) {
    if (homeTeam && awayTeam) {
      koOptions = [
        { id: homeTeam.id, name: homeTeam.name },
        { id: awayTeam.id, name: awayTeam.name },
      ]
    } else if (teamsForKo) {
      koOptions = teamsForKo.map((t) => ({ id: t.id, name: t.name }))
    }
  }

  const kickoff = match.kickoff_at ? parseUTCDate(match.kickoff_at) : null
  const timeStr = kickoff ? kickoff.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'
  const tzShort = kickoff ? kickoff.toLocaleTimeString('es-ES', { timeZoneName: 'short' }).split(' ').pop() : ''
  const dayStr = kickoff ? kickoff.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase() : ''

  const stadium = match.stadium || ''
  const stadiumParts = stadium.split(',').map((s) => s.trim())
  const cityShort = stadiumParts[1] || stadiumParts[0] || ''
  const venueShort = stadiumParts[0] || ''

  return (
    <div className={`card p-3 ${matchLocked ? 'opacity-60' : ''}`}>
      <div className="grid grid-cols-[60px_1fr_auto_1fr_1px] sm:grid-cols-[80px_1fr_auto_1fr_100px] items-center gap-2 sm:gap-3">
        <div className="min-w-0">
          {!isMounted ? (
            <div className="text-white/40 font-bold text-xs sm:text-base">••:••</div>
          ) : (
            <>
              <div className="text-white font-extrabold text-xs sm:text-base leading-tight">
                {isLockedByStatus ? (
                  <span className="text-white/40 text-[10px] sm:text-xs uppercase tracking-wider">Cerrado</span>
                ) : showLive ? (
                  <span className="text-red-500 animate-pulse">EN VIVO</span>
                ) : (
                  timeStr
                )}
              </div>
              <div className="text-[9px] sm:text-[10px] font-bold text-white/40 uppercase tracking-wider hidden sm:block">{tzShort} {dayStr && `· ${dayStr}`}</div>
            </>
          )}
        </div>

        {homeTeam ? (
          <div className="bg-white rounded-full px-2 py-1 sm:px-3 sm:py-1.5 inline-flex items-center gap-1.5 sm:gap-2 min-w-0 justify-end flex-row-reverse">
            <Flag team={homeTeam} size={14} />
            <span className="text-xs sm:text-xs font-extrabold text-slate-900 uppercase tracking-tight truncate">{homeLabel}</span>
          </div>
        ) : (
          <div className="bg-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-xs text-white/50 font-bold uppercase truncate text-right">
            {homeLabel}
          </div>
        )}

        <div className="flex items-center gap-1">
          <input type="number" min={0} max={99} inputMode="numeric"
            value={p.home ?? ''}
            onChange={(e) => setScore(match.id, 'home', e.target.value)}
            disabled={disableInputs}
            className={`score-input w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg ${disableInputs ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Goles ${homeLabel}`} />
          <span className="text-white/30 text-xs">−</span>
          <input type="number" min={0} max={99} inputMode="numeric"
            value={p.away ?? ''}
            onChange={(e) => setScore(match.id, 'away', e.target.value)}
            disabled={disableInputs}
            className={`score-input w-9 h-9 sm:w-11 sm:h-11 text-base sm:text-lg ${disableInputs ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={`Goles ${awayLabel}`} />
          {matchLocked && match.status !== 'scheduled' && (
            <svg className="w-3 h-3 text-white/40 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {awayTeam ? (
          <div className="bg-white rounded-full px-2 py-1 sm:px-3 sm:py-1.5 inline-flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Flag team={awayTeam} size={14} />
            <span className="text-xs sm:text-xs font-extrabold text-slate-900 uppercase tracking-tight truncate">{awayLabel}</span>
          </div>
        ) : (
          <div className="bg-white/10 rounded-full px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-xs text-white/50 font-bold uppercase truncate">
            {awayLabel}
          </div>
        )}

        <div className="hidden md:block text-right min-w-0">
          {cityShort && (
            <div className="text-[9px] sm:text-[10px] font-extrabold text-white uppercase truncate">{cityShort}</div>
          )}
          {venueShort && venueShort !== cityShort && (
            <div className="text-[8px] sm:text-[9px] font-bold text-white/40 uppercase truncate">{venueShort}</div>
          )}
        </div>
      </div>

      {isKnockout && teamsNotDefined && (
        <div className="mt-2 text-xs text-white/50 text-center italic">
          Esperando rivales...
        </div>
      )}

      {showKoSelect && setKoWinner && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span className="label-up">Penales:</span>
          <select value={p.ko ?? ''}
            onChange={(e) => setKoWinner(match.id, e.target.value ? Number(e.target.value) : null)}
            disabled={disableInputs}
            className={`input flex-1 text-xs ${disableInputs ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <option value="" className="bg-navy-deepest">Selecciona ganador</option>
            {koOptions.map((t) => (
              <option key={t.id} value={t.id} className="bg-navy-deepest">{t.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
