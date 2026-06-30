'use client'

import Flag from '@/components/Flag'
import type { Team, Match } from '@/lib/types'

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

  // Flujo correcto del bracket:
  // LLAVE IZQUIERDA (SF 101): R32 [73-80] → R16 [89-92] → QF [97-98] → SF 101
  // LLAVE DERECHA (SF 102): R32 [81-88] → R16 [93-96] → QF [99-100] → SF 102
  
  const r32Left = r32Matches.slice(0, 8)   // 73-80
  const r32Right = r32Matches.slice(8, 16) // 81-88
  
  const r16Left = r16Matches.slice(0, 4)   // 89-92
  const r16Right = r16Matches.slice(4, 8)  // 93-96
  
  const qfLeft = qfMatches.slice(0, 2)     // 97-98
  const qfRight = qfMatches.slice(2, 4)    // 99-100
  
  const sfLeft = sfMatches[0]   // 101
  const sfRight = sfMatches[1]  // 102

  return (
    <div className="space-y-6">
      {/* Bracket compacto simétrico */}
      <div className="relative overflow-x-auto">
        <div className="min-w-[1200px] max-w-full mx-auto py-6">
          <div className="grid grid-cols-[repeat(5,auto)] gap-x-3 items-center justify-center">
            
            {/* COLUMNA 1: R32 + R16 IZQUIERDA */}
            <div className="space-y-2">
              <div className="text-[8px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-3 h-4">
                DIECISEISAVOS
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                {/* R32 Izquierda - Agrupados por pares que alimentan cada R16 */}
                <div className="space-y-1">
                  {r32Left.map((m, idx) => (
                    <div key={m.id} className={idx % 2 === 1 ? 'mb-4' : ''}>
                      <MicroMatch match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
                    </div>
                  ))}
                </div>
                
                {/* R16 Izquierda - Alineados con sus 2 partidos R32 */}
                <div className="space-y-1 flex flex-col">
                  <div className="text-[8px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-1 h-4">
                    OCTAVOS
                  </div>
                  {r16Left.map((m, idx) => (
                    <div key={m.id} className="flex items-center" style={{ marginTop: idx === 0 ? '0' : '3.25rem' }}>
                      <MiniMatch match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* COLUMNA 2: QF IZQUIERDA */}
            <div className="space-y-2">
              <div className="text-[8px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-3 h-4">
                CUARTOS
              </div>
              <div className="flex flex-col space-y-1">
                {qfLeft.map((m, idx) => (
                  <div key={m.id} style={{ marginTop: idx === 0 ? '2rem' : '7rem' }}>
                    <MiniMatch match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA 3: SEMIFINALES + FINAL (CENTRO) */}
            <div className="space-y-4 px-4">
              <div className="text-[9px] uppercase tracking-wider text-gold/70 font-black text-center mb-2 h-4">
                🏆 FINAL
              </div>
              
              {/* Semifinal Izquierda */}
              {sfLeft && (
                <div className="mb-4" style={{ marginTop: '8rem' }}>
                  <div className="text-[7px] uppercase tracking-wider text-fifaGreen/40 font-bold text-center mb-1">SF</div>
                  <CompactMatch match={sfLeft} homeTeam={teamsById[sfLeft.home_team_id!]} awayTeam={teamsById[sfLeft.away_team_id!]} />
                </div>
              )}

              {/* Final */}
              {finalMatch && (
                <div className="relative my-6">
                  <div className="absolute -inset-2 bg-gold/5 rounded-lg"></div>
                  <FinalMatch match={finalMatch} homeTeam={teamsById[finalMatch.home_team_id!]} awayTeam={teamsById[finalMatch.away_team_id!]} />
                </div>
              )}

              {/* Semifinal Derecha */}
              {sfRight && (
                <div className="mt-4">
                  <div className="text-[7px] uppercase tracking-wider text-fifaGreen/40 font-bold text-center mb-1">SF</div>
                  <CompactMatch match={sfRight} homeTeam={teamsById[sfRight.home_team_id!]} awayTeam={teamsById[sfRight.away_team_id!]} />
                </div>
              )}
            </div>

            {/* COLUMNA 4: QF DERECHA */}
            <div className="space-y-2">
              <div className="text-[8px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-3 h-4">
                CUARTOS
              </div>
              <div className="flex flex-col space-y-1">
                {qfRight.map((m, idx) => (
                  <div key={m.id} style={{ marginTop: idx === 0 ? '2rem' : '7rem' }}>
                    <MiniMatch match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
                  </div>
                ))}
              </div>
            </div>

            {/* COLUMNA 5: R16 + R32 DERECHA */}
            <div className="space-y-2">
              <div className="text-[8px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-3 h-4">
                DIECISEISAVOS
              </div>
              <div className="grid grid-cols-2 gap-x-3">
                {/* R16 Derecha - Alineados con sus 2 partidos R32 */}
                <div className="space-y-1 flex flex-col">
                  <div className="text-[8px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-1 h-4">
                    OCTAVOS
                  </div>
                  {r16Right.map((m, idx) => (
                    <div key={m.id} className="flex items-center" style={{ marginTop: idx === 0 ? '0' : '3.25rem' }}>
                      <MiniMatch match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
                    </div>
                  ))}
                </div>
                
                {/* R32 Derecha - Agrupados por pares */}
                <div className="space-y-1">
                  {r32Right.map((m, idx) => (
                    <div key={m.id} className={idx % 2 === 1 ? 'mb-4' : ''}>
                      <MicroMatch match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
        
        <div className="text-center text-[10px] text-white/30 mt-3">
          Desliza horizontalmente para ver todo el cuadro
        </div>

        {/* Leyenda de flujo */}
        <div className="mt-4 text-center">
          <details className="inline-block text-left">
            <summary className="text-[9px] uppercase tracking-wider text-fifaGreen/60 font-bold cursor-pointer hover:text-fifaGreen transition-colors">
              Ver flujo de partidos
            </summary>
            <div className="mt-2 p-3 bg-navy-dark border border-white/10 rounded-lg text-[9px] text-white/70 space-y-1 max-w-md mx-auto">
              <div className="font-bold text-fifaGreen/80 mb-2">LLAVE IZQUIERDA → SF M101:</div>
              <div>• M73, M74 → M89 │ M75, M76 → M90 → M97</div>
              <div>• M77, M78 → M91 │ M79, M80 → M92 → M98</div>
              <div className="font-bold text-fifaGreen/80 mt-2 mb-2">LLAVE DERECHA → SF M102:</div>
              <div>• M81, M82 → M93 │ M83, M84 → M94 → M99</div>
              <div>• M85, M86 → M95 │ M87, M88 → M96 → M100</div>
              <div className="font-bold text-gold/80 mt-2">FINAL M104: M101 vs M102</div>
            </div>
          </details>
        </div>
      </div>

      {/* Tercer Lugar */}
      {thirdPlaceMatch && (
        <div className="flex justify-center pt-4 border-t border-white/10">
          <div className="w-full max-w-xs">
            <div className="text-[9px] uppercase tracking-wider text-yellow-500/60 font-bold text-center mb-2">
              🥉 Tercer Lugar
            </div>
            <CompactMatch match={thirdPlaceMatch} homeTeam={teamsById[thirdPlaceMatch.home_team_id!]} awayTeam={teamsById[thirdPlaceMatch.away_team_id!]} />
          </div>
        </div>
      )}
    </div>
  )
}

// Componente micro para R32 (ultra compacto)
function MicroMatch({ match, homeTeam, awayTeam }: { match: Match, homeTeam: Team | null, awayTeam: Team | null }) {
  const isFinished = match.status === 'finished'
  const hasScore = match.home_score !== null && match.away_score !== null
  
  const homeWon = isFinished && hasScore && (
    match.home_score! > match.away_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.home_team_id)
  )
  const awayWon = isFinished && hasScore && (
    match.away_score! > match.home_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.away_team_id)
  )

  return (
    <div className="w-24 bg-navy-dark border border-white/5 rounded overflow-hidden hover:border-fifaGreen/30 transition-all">
      {/* Header con número de partido */}
      <div className="bg-white/5 px-1 py-0.5">
        <span className="text-[7px] uppercase tracking-wider text-white/30 font-mono">M{match.match_number}</span>
      </div>
      <div className="p-1 space-y-0.5">
        <TeamRow team={homeTeam} score={match.home_score} isWinner={homeWon} size="micro" label={match.home_team_label} />
        <TeamRow team={awayTeam} score={match.away_score} isWinner={awayWon} size="micro" label={match.away_team_label} />
      </div>
    </div>
  )
}

// Componente mini para R16 y QF
function MiniMatch({ match, homeTeam, awayTeam }: { match: Match, homeTeam: Team | null, awayTeam: Team | null }) {
  const isFinished = match.status === 'finished'
  const hasScore = match.home_score !== null && match.away_score !== null
  const isLive = match.status === 'live'
  
  const homeWon = isFinished && hasScore && (
    match.home_score! > match.away_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.home_team_id)
  )
  const awayWon = isFinished && hasScore && (
    match.away_score! > match.home_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.away_team_id)
  )

  return (
    <div className={`w-32 bg-navy-dark border rounded overflow-hidden hover:border-fifaGreen/40 transition-all ${
      isLive ? 'border-red-500/50 animate-pulse' : 'border-white/10'
    }`}>
      {/* Header con número de partido */}
      <div className="bg-white/5 px-1.5 py-0.5 flex items-center justify-between">
        <span className="text-[7px] uppercase tracking-wider text-white/30 font-mono">M{match.match_number}</span>
        {isLive && <span className="text-[7px] uppercase text-red-500 font-bold">LIVE</span>}
      </div>
      <div className="p-1.5 space-y-1">
        <TeamRow team={homeTeam} score={match.home_score} isWinner={homeWon} size="mini" label={match.home_team_label} />
        <TeamRow team={awayTeam} score={match.away_score} isWinner={awayWon} size="mini" label={match.away_team_label} />
      </div>
    </div>
  )
}

// Componente compacto para SF y tercer lugar
function CompactMatch({ match, homeTeam, awayTeam }: { match: Match, homeTeam: Team | null, awayTeam: Team | null }) {
  const isFinished = match.status === 'finished'
  const hasScore = match.home_score !== null && match.away_score !== null
  const isLive = match.status === 'live'
  
  const homeWon = isFinished && hasScore && (
    match.home_score! > match.away_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.home_team_id)
  )
  const awayWon = isFinished && hasScore && (
    match.away_score! > match.home_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.away_team_id)
  )

  const isPenalties = hasScore && match.home_score === match.away_score && match.shootout_winner_team_id

  return (
    <div className={`w-40 bg-navy-dark border rounded-lg overflow-hidden hover:border-fifaGreen/50 transition-all ${
      isLive ? 'border-red-500/60 shadow-lg shadow-red-500/20' : 'border-fifaGreen/20'
    }`}>
      <div className="bg-white/5 px-2 py-0.5 flex items-center justify-between">
        <span className="text-[7px] uppercase tracking-wider text-white/30 font-mono">M{match.match_number}</span>
        {isLive && <span className="text-[7px] uppercase text-red-500 font-bold">LIVE</span>}
        {isPenalties && <span className="text-[7px] uppercase text-yellow-500 font-bold">PEN</span>}
      </div>
      <div className="p-2 space-y-1">
        <TeamRow team={homeTeam} score={match.home_score} isWinner={homeWon} size="compact" label={match.home_team_label} />
        <TeamRow team={awayTeam} score={match.away_score} isWinner={awayWon} size="compact" label={match.away_team_label} />
      </div>
    </div>
  )
}

// Componente para la FINAL
function FinalMatch({ match, homeTeam, awayTeam }: { match: Match, homeTeam: Team | null, awayTeam: Team | null }) {
  const isFinished = match.status === 'finished'
  const hasScore = match.home_score !== null && match.away_score !== null
  const isLive = match.status === 'live'
  
  const homeWon = isFinished && hasScore && (
    match.home_score! > match.away_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.home_team_id)
  )
  const awayWon = isFinished && hasScore && (
    match.away_score! > match.home_score! || 
    (match.home_score === match.away_score && match.shootout_winner_team_id === match.away_team_id)
  )

  const isPenalties = hasScore && match.home_score === match.away_score && match.shootout_winner_team_id
  const champion = homeWon ? homeTeam : awayWon ? awayTeam : null

  return (
    <div className={`w-48 bg-gradient-to-br from-navy-dark via-navy-deepest to-navy-dark border-2 rounded-xl overflow-hidden shadow-2xl transition-all ${
      isLive ? 'border-red-500 shadow-red-500/30' : 'border-gold/50 shadow-gold/20'
    }`}>
      <div className="bg-gradient-to-r from-gold/20 via-gold/10 to-gold/20 px-3 py-1 flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-wider text-gold/80 font-black">FINAL 2026</span>
        {isLive && <span className="text-[8px] uppercase text-red-500 font-bold animate-pulse">● LIVE</span>}
        {isPenalties && <span className="text-[8px] uppercase text-yellow-500 font-bold">PENALES</span>}
      </div>
      <div className="p-3 space-y-1.5">
        <TeamRow team={homeTeam} score={match.home_score} isWinner={homeWon} size="final" label={match.home_team_label} />
        <TeamRow team={awayTeam} score={match.away_score} isWinner={awayWon} size="final" label={match.away_team_label} />
      </div>
      {champion && isFinished && (
        <div className="bg-gold/20 border-t border-gold/30 px-3 py-1 text-center">
          <span className="text-[8px] uppercase tracking-wider text-gold font-black">
            🏆 {champion.name}
          </span>
        </div>
      )}
    </div>
  )
}

// Componente reutilizable para fila de equipo
function TeamRow({ 
  team, 
  score, 
  isWinner, 
  size, 
  label 
}: { 
  team: Team | null
  score: number | null
  isWinner: boolean
  size: 'micro' | 'mini' | 'compact' | 'final'
  label?: string | null
}) {
  const flagSize = size === 'micro' ? 8 : size === 'mini' ? 10 : size === 'compact' ? 12 : 14
  const textSize = size === 'micro' ? 'text-[8px]' : size === 'mini' ? 'text-[9px]' : size === 'compact' ? 'text-[10px]' : 'text-xs'
  const scoreSize = size === 'micro' ? 'text-[10px]' : size === 'mini' ? 'text-xs' : size === 'compact' ? 'text-sm' : 'text-base'
  
  return (
    <div className={`flex items-center justify-between rounded px-1 py-0.5 ${
      isWinner ? 'bg-fifaGreen/20 border border-fifaGreen/40' : 'bg-white/5'
    }`}>
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {team ? (
          <>
            <Flag team={team} size={flagSize} className="flex-shrink-0" />
            <span className={`${textSize} font-bold uppercase tracking-tight truncate ${
              isWinner ? 'text-fifaGreen' : 'text-white/80'
            }`}>
              {size === 'micro' ? team.iso_code : team.name}
            </span>
          </>
        ) : (
          <span className={`${textSize} text-white/30 italic`}>{label || 'TBD'}</span>
        )}
      </div>
      {score !== null && (
        <span className={`${scoreSize} font-black ml-1 ${
          isWinner ? 'text-fifaGreen' : 'text-white/50'
        }`}>
          {score}
        </span>
      )}
    </div>
  )
}
