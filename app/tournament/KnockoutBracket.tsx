'use client'

import Flag from '@/components/Flag'
import type { Team, Match } from '@/lib/types'

interface BracketMatch {
  match: Match
  homeTeam: Team | null
  awayTeam: Team | null
}

interface Props {
  matches: Match[]
  teams: Team[]
}

export default function KnockoutBracket({ matches, teams }: Props) {
  const teamsById = teams.reduce((acc, t) => {
    acc[t.id] = t
    return acc
  }, {} as Record<number, Team>)

  // Organizar partidos por fase
  const r32Matches = matches.filter(m => m.phase === 'r32').sort((a, b) => a.match_number - b.match_number)
  const r16Matches = matches.filter(m => m.phase === 'r16').sort((a, b) => a.match_number - b.match_number)
  const qfMatches = matches.filter(m => m.phase === 'qf').sort((a, b) => a.match_number - b.match_number)
  const sfMatches = matches.filter(m => m.phase === 'sf').sort((a, b) => a.match_number - b.match_number)
  const finalMatch = matches.find(m => m.phase === 'final')
  const thirdPlaceMatch = matches.find(m => m.phase === 'third')

  // Dividir partidos en mitades (superior e inferior del bracket)
  const r32Top = r32Matches.slice(0, 8)
  const r32Bottom = r32Matches.slice(8, 16)
  
  const r16Top = r16Matches.slice(0, 4)
  const r16Bottom = r16Matches.slice(4, 8)
  
  const qfTop = qfMatches.slice(0, 2)
  const qfBottom = qfMatches.slice(2, 4)
  
  const sfTop = sfMatches[0]
  const sfBottom = sfMatches[1]

  return (
    <div className="space-y-8">
      {/* Bracket Principal */}
      <div className="relative overflow-x-auto pb-8">
        <div className="min-w-[1400px] flex items-center justify-center gap-4 py-8">
          {/* Columna 1: Dieciseisavos Izquierda Superior */}
          <div className="flex flex-col gap-3">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              DIECISEISAVOS
            </div>
            {r32Top.map(m => (
              <BracketMatchCard key={m.id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} compact />
            ))}
          </div>

          {/* Conector visual */}
          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>

          {/* Columna 2: Octavos Izquierda */}
          <div className="flex flex-col gap-6">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              OCTAVOS
            </div>
            {r16Top.map(m => (
              <BracketMatchCard key={m.id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
            ))}
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>

          {/* Columna 3: Cuartos Izquierda */}
          <div className="flex flex-col gap-12">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              CUARTOS
            </div>
            {qfTop.map(m => (
              <BracketMatchCard key={m.id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
            ))}
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>

          {/* Columna 4: Semifinal Izquierda */}
          <div className="flex flex-col gap-24">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              SEMIFINAL
            </div>
            {sfTop && <BracketMatchCard match={sfTop} homeTeam={teamsById[sfTop.home_team_id!]} awayTeam={teamsById[sfTop.away_team_id!]} highlighted />}
          </div>

          <div className="flex items-center">
            <div className="w-12 h-0.5 bg-gradient-to-r from-white/30 to-transparent"></div>
          </div>

          {/* Columna 5: FINAL (Centro) */}
          <div className="flex flex-col items-center gap-4 px-6">
            <div className="text-xs uppercase tracking-widest text-gold font-black text-center mb-2">
              🏆 FINAL
            </div>
            {finalMatch && (
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 rounded-2xl blur-xl"></div>
                <BracketMatchCard 
                  match={finalMatch} 
                  homeTeam={teamsById[finalMatch.home_team_id!]} 
                  awayTeam={teamsById[finalMatch.away_team_id!]} 
                  isFinal 
                />
              </div>
            )}
          </div>

          <div className="flex items-center">
            <div className="w-12 h-0.5 bg-gradient-to-l from-white/30 to-transparent"></div>
          </div>

          {/* Columna 6: Semifinal Derecha */}
          <div className="flex flex-col gap-24">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              SEMIFINAL
            </div>
            {sfBottom && <BracketMatchCard match={sfBottom} homeTeam={teamsById[sfBottom.home_team_id!]} awayTeam={teamsById[sfBottom.away_team_id!]} highlighted />}
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gradient-to-l from-white/20 to-transparent"></div>
          </div>

          {/* Columna 7: Cuartos Derecha */}
          <div className="flex flex-col gap-12">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              CUARTOS
            </div>
            {qfBottom.map(m => (
              <BracketMatchCard key={m.id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
            ))}
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gradient-to-l from-white/20 to-transparent"></div>
          </div>

          {/* Columna 8: Octavos Derecha */}
          <div className="flex flex-col gap-6">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              OCTAVOS
            </div>
            {r16Bottom.map(m => (
              <BracketMatchCard key={m.id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
            ))}
          </div>

          <div className="flex items-center">
            <div className="w-8 h-0.5 bg-gradient-to-l from-white/20 to-transparent"></div>
          </div>

          {/* Columna 9: Dieciseisavos Derecha Inferior */}
          <div className="flex flex-col gap-3">
            <div className="text-[10px] uppercase tracking-widest text-fifaGreen/60 font-bold text-center mb-2">
              DIECISEISAVOS
            </div>
            {r32Bottom.map(m => (
              <BracketMatchCard key={m.id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} compact />
            ))}
          </div>
        </div>

        {/* Indicador de scroll */}
        <div className="text-center text-xs text-white/40 mt-4">
          ← Desliza para ver el bracket completo →
        </div>
      </div>

      {/* Tercer Lugar */}
      {thirdPlaceMatch && (
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <div className="text-sm uppercase tracking-widest text-yellow-500/80 font-bold text-center mb-4">
              🥉 Tercer Lugar
            </div>
            <BracketMatchCard 
              match={thirdPlaceMatch} 
              homeTeam={teamsById[thirdPlaceMatch.home_team_id!]} 
              awayTeam={teamsById[thirdPlaceMatch.away_team_id!]} 
            />
          </div>
        </div>
      )}
    </div>
  )
}

function BracketMatchCard({ 
  match, 
  homeTeam, 
  awayTeam, 
  compact = false,
  highlighted = false,
  isFinal = false
}: { 
  match: Match
  homeTeam: Team | null
  awayTeam: Team | null
  compact?: boolean
  highlighted?: boolean
  isFinal?: boolean
}) {
  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'
  const hasScore = match.home_score !== null && match.away_score !== null

  const homeWon = isFinished && hasScore && (
    match.home_score! > match.away_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.home_team_id)
  )
  const awayWon = isFinished && hasScore && (
    match.away_score! > match.home_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.away_team_id)
  )

  const cardWidth = compact ? 'w-36' : isFinal ? 'w-64' : 'w-48'
  const borderColor = isFinal 
    ? 'border-gold/50' 
    : highlighted 
    ? 'border-fifaGreen/40' 
    : 'border-white/10'
  const bgColor = isFinal 
    ? 'bg-gradient-to-br from-gold/5 via-navy-dark to-navy-deepest' 
    : 'bg-navy-dark'

  return (
    <div className={`${cardWidth} ${bgColor} border ${borderColor} rounded-lg overflow-hidden transition-all hover:border-white/30 ${
      isLive ? 'animate-pulse' : ''
    }`}>
      {/* Header */}
      {!compact && (
        <div className="bg-white/5 px-2 py-1 flex items-center justify-between">
          <span className="text-[8px] uppercase tracking-wider text-white/40 font-mono">
            #{match.match_number}
          </span>
          {isLive && (
            <span className="text-[8px] uppercase tracking-wider text-red-500 font-bold">
              EN VIVO
            </span>
          )}
          {hasScore && match.home_score === match.away_score && match.shootout_winner_team_id && (
            <span className="text-[8px] uppercase tracking-wider text-yellow-500 font-bold">
              PENALES
            </span>
          )}
        </div>
      )}

      {/* Teams */}
      <div className="p-2 space-y-1">
        {/* Home */}
        <div className={`flex items-center justify-between p-1.5 rounded ${
          homeWon ? 'bg-fifaGreen/20 border border-fifaGreen/40' : 'bg-white/5'
        } transition-all`}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {homeTeam ? (
              <>
                <Flag team={homeTeam} size={compact ? 12 : isFinal ? 20 : 16} />
                <span className={`${compact ? 'text-[9px]' : isFinal ? 'text-sm' : 'text-xs'} font-bold text-white truncate ${
                  homeWon ? 'text-fifaGreen' : ''
                }`}>
                  {homeTeam.name}
                </span>
              </>
            ) : (
              <span className="text-[9px] text-white/40 italic">{match.home_team_label || 'TBD'}</span>
            )}
          </div>
          {hasScore && (
            <span className={`${isFinal ? 'text-xl' : 'text-base'} font-black ${
              homeWon ? 'text-fifaGreen' : 'text-white/60'
            } ml-2`}>
              {match.home_score}
            </span>
          )}
        </div>

        {/* Away */}
        <div className={`flex items-center justify-between p-1.5 rounded ${
          awayWon ? 'bg-fifaGreen/20 border border-fifaGreen/40' : 'bg-white/5'
        } transition-all`}>
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {awayTeam ? (
              <>
                <Flag team={awayTeam} size={compact ? 12 : isFinal ? 20 : 16} />
                <span className={`${compact ? 'text-[9px]' : isFinal ? 'text-sm' : 'text-xs'} font-bold text-white truncate ${
                  awayWon ? 'text-fifaGreen' : ''
                }`}>
                  {awayTeam.name}
                </span>
              </>
            ) : (
              <span className="text-[9px] text-white/40 italic">{match.away_team_label || 'TBD'}</span>
            )}
          </div>
          {hasScore && (
            <span className={`${isFinal ? 'text-xl' : 'text-base'} font-black ${
              awayWon ? 'text-fifaGreen' : 'text-white/60'
            } ml-2`}>
              {match.away_score}
            </span>
          )}
        </div>
      </div>

      {/* Footer - Solo en final */}
      {isFinal && isFinished && (
        <div className="bg-gold/10 border-t border-gold/30 px-2 py-1 text-center">
          <span className="text-[9px] uppercase tracking-wider text-gold font-bold">
            CAMPEÓN: {homeWon ? homeTeam?.name : awayTeam?.name}
          </span>
        </div>
      )}
    </div>
  )
}
