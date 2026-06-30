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

  // Mapeo de partidos por ID (estructura de llaves lógica, no orden numérico)
  const matchesById = matches.reduce((acc, m) => {
    acc[m.match_number] = m
    return acc
  }, {} as Record<number, Match>)

  // DISTRIBUCIÓN POR COLUMNAS (orden visual de arriba a abajo)
  // Columna 1 - R32 Extremo Izquierdo
  const col1Ids = [74, 77, 73, 75, 83, 84, 81, 82]
  
  // Columna 2 - R16 Interior Izquierdo
  const col2Ids = [89, 90, 93, 94]
  
  // Columna 3 - QF Cerca del Centro Izquierda
  const col3Ids = [97, 98]
  
  // Columna 4 - CENTRO (SF1, Final, SF2, 3er lugar)
  const col4Ids = [101, 104, 102, 103]
  
  // Columna 5 - QF Cerca del Centro Derecha
  const col5Ids = [99, 100]
  
  // Columna 6 - R16 Interior Derecho
  const col6Ids = [91, 92, 95, 96]
  
  // Columna 7 - R32 Extremo Derecho
  const col7Ids = [76, 78, 79, 80, 86, 88, 85, 87]
  
  const finalMatch = matchesById[104]
  const thirdPlaceMatch = matchesById[103]

  return (
    <div className="space-y-6">
      {/* Bracket de 7 columnas con llaves simétricas */}
      <div className="relative overflow-x-auto pb-4">
        <div className="min-w-[1400px] max-w-full mx-auto py-6">
          <div className="grid grid-cols-7 gap-x-4 items-center justify-center">
            
            {/* COLUMNA 1: R32 Extremo Izquierdo */}
            <div className="flex flex-col justify-around space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-2">
                DIECISEISAVOS
              </div>
              {col1Ids.map(id => {
                const m = matchesById[id]
                if (!m) return null
                return <MatchCard key={id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
              })}
            </div>

            {/* COLUMNA 2: R16 Interior Izquierdo */}
            <div className="flex flex-col justify-around space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-2">
                OCTAVOS
              </div>
              {col2Ids.map(id => {
                const m = matchesById[id]
                if (!m) return null
                return <MatchCard key={id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
              })}
            </div>

            {/* COLUMNA 3: QF Cerca del Centro Izquierda */}
            <div className="flex flex-col justify-around space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-2">
                CUARTOS
              </div>
              {col3Ids.map(id => {
                const m = matchesById[id]
                if (!m) return null
                return <MatchCard key={id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
              })}
            </div>

            {/* COLUMNA 4: CENTRO (SF1 → Final → SF2 → 3er lugar) */}
            <div className="flex flex-col justify-around space-y-4 px-2">
              <div className="text-[10px] uppercase tracking-wider text-gold/70 font-black text-center mb-2">
                🏆 FINAL 2026
              </div>
              
              {/* Semifinal 1 */}
              {matchesById[101] && (
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-fifaGreen/40 font-bold text-center mb-1">SF1</div>
                  <MatchCard match={matchesById[101]} homeTeam={teamsById[matchesById[101].home_team_id!]} awayTeam={teamsById[matchesById[101].away_team_id!]} />
                </div>
              )}

              {/* Gran Final - Destacada */}
              {finalMatch && (
                <div className="relative my-4">
                  <div className="absolute -inset-3 bg-gold/5 rounded-xl blur-sm"></div>
                  <FinalMatch match={finalMatch} homeTeam={teamsById[finalMatch.home_team_id!]} awayTeam={teamsById[finalMatch.away_team_id!]} />
                </div>
              )}

              {/* Semifinal 2 */}
              {matchesById[102] && (
                <div>
                  <div className="text-[8px] uppercase tracking-wider text-fifaGreen/40 font-bold text-center mb-1">SF2</div>
                  <MatchCard match={matchesById[102]} homeTeam={teamsById[matchesById[102].home_team_id!]} awayTeam={teamsById[matchesById[102].away_team_id!]} />
                </div>
              )}

              {/* Tercer Lugar - Discreto */}
              {thirdPlaceMatch && (
                <div className="mt-6 opacity-70">
                  <div className="text-[8px] uppercase tracking-wider text-yellow-500/50 font-bold text-center mb-1">🥉 3ER LUGAR</div>
                  <MatchCard match={thirdPlaceMatch} homeTeam={teamsById[thirdPlaceMatch.home_team_id!]} awayTeam={teamsById[thirdPlaceMatch.away_team_id!]} />
                </div>
              )}
            </div>

            {/* COLUMNA 5: QF Cerca del Centro Derecha */}
            <div className="flex flex-col justify-around space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-2">
                CUARTOS
              </div>
              {col5Ids.map(id => {
                const m = matchesById[id]
                if (!m) return null
                return <MatchCard key={id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
              })}
            </div>

            {/* COLUMNA 6: R16 Interior Derecho */}
            <div className="flex flex-col justify-around space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-2">
                OCTAVOS
              </div>
              {col6Ids.map(id => {
                const m = matchesById[id]
                if (!m) return null
                return <MatchCard key={id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
              })}
            </div>

            {/* COLUMNA 7: R32 Extremo Derecho */}
            <div className="flex flex-col justify-around space-y-3">
              <div className="text-[9px] uppercase tracking-wider text-fifaGreen/50 font-bold text-center mb-2">
                DIECISEISAVOS
              </div>
              {col7Ids.map(id => {
                const m = matchesById[id]
                if (!m) return null
                return <MatchCard key={id} match={m} homeTeam={teamsById[m.home_team_id!]} awayTeam={teamsById[m.away_team_id!]} />
              })}
            </div>

          </div>
        </div>
        
        <div className="text-center text-[10px] text-white/30 mt-4">
          Desliza horizontalmente para ver el cuadro completo
        </div>
      </div>
    </div>
  )
}

// Componente unificado para partidos estándar (150px)
function MatchCard({ match, homeTeam, awayTeam }: { match: Match, homeTeam: Team | null, awayTeam: Team | null }) {
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
    <div className={`w-[150px] bg-navy-dark border rounded-lg overflow-hidden transition-all hover:border-fifaGreen/50 ${
      isLive ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' : 'border-white/10'
    }`}>
      {/* Header con # partido e indicadores */}
      <div className="bg-white/5 px-2 py-1 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-white/40 font-bold">#{match.match_number}</span>
        <div className="flex items-center gap-1">
          {isLive && <span className="text-[8px] uppercase text-red-500 font-black">● LIVE</span>}
          {isPenalties && <span className="text-[8px] uppercase text-yellow-500 font-bold">PEN</span>}
        </div>
      </div>
      
      {/* Teams */}
      <div className="p-2 space-y-1.5">
        <TeamRow team={homeTeam} score={match.home_score} isWinner={homeWon} label={match.home_team_label} />
        <TeamRow team={awayTeam} score={match.away_score} isWinner={awayWon} label={match.away_team_label} />
      </div>
    </div>
  )
}

// Componente especial para la FINAL (diseño destacado)
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
    <div className={`w-[180px] bg-gradient-to-br from-navy-dark via-navy-deepest to-navy-dark border-2 rounded-xl overflow-hidden shadow-2xl transition-all ${
      isLive ? 'border-red-500 shadow-red-500/40 animate-pulse' : 'border-gold shadow-gold/30'
    }`}>
      <div className="bg-gradient-to-r from-gold/30 via-gold/20 to-gold/30 px-3 py-1.5 flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest text-gold font-black">FINAL 2026</span>
        {isLive && <span className="text-[9px] uppercase text-red-500 font-black">● LIVE</span>}
        {isPenalties && <span className="text-[8px] uppercase text-yellow-400 font-bold">PEN</span>}
      </div>
      <div className="p-3 space-y-2">
        <FinalTeamRow team={homeTeam} score={match.home_score} isWinner={homeWon} label={match.home_team_label} />
        <FinalTeamRow team={awayTeam} score={match.away_score} isWinner={awayWon} label={match.away_team_label} />
      </div>
      {champion && isFinished && (
        <div className="bg-gold/20 border-t border-gold/40 px-3 py-1.5 text-center">
          <span className="text-[9px] uppercase tracking-widest text-gold font-black">
            🏆 CAMPEÓN: {champion.name}
          </span>
        </div>
      )}
    </div>
  )
}

// TeamRow para partidos estándar
function TeamRow({ 
  team, 
  score, 
  isWinner, 
  label 
}: { 
  team: Team | null
  score: number | null
  isWinner: boolean
  label?: string | null
}) {
  return (
    <div className={`flex items-center justify-between rounded px-2 py-1.5 transition-all ${
      isWinner ? 'bg-fifaGreen/20 border border-fifaGreen/50' : 'bg-white/5 border border-transparent'
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {team ? (
          <>
            <Flag team={team} size={12} className="flex-shrink-0" />
            <span className={`text-[10px] font-black uppercase tracking-tight truncate ${
              isWinner ? 'text-fifaGreen' : 'text-white/90'
            }`}>
              {team.name}
            </span>
          </>
        ) : (
          <span className="text-[10px] text-white/40 italic truncate">{label || 'Ganador MXX'}</span>
        )}
      </div>
      {score !== null && (
        <span className={`text-sm font-black ml-2 tabular-nums ${
          isWinner ? 'text-fifaGreen' : 'text-white/60'
        }`}>
          {score}
        </span>
      )}
    </div>
  )
}

// TeamRow especial para la Final
function FinalTeamRow({ 
  team, 
  score, 
  isWinner, 
  label 
}: { 
  team: Team | null
  score: number | null
  isWinner: boolean
  label?: string | null
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition-all ${
      isWinner ? 'bg-gold/20 border-2 border-gold/60' : 'bg-white/10 border-2 border-white/20'
    }`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {team ? (
          <>
            <Flag team={team} size={16} className="flex-shrink-0" />
            <span className={`text-xs font-black uppercase tracking-tight truncate ${
              isWinner ? 'text-gold' : 'text-white'
            }`}>
              {team.name}
            </span>
          </>
        ) : (
          <span className="text-xs text-white/50 italic truncate">{label || 'TBD'}</span>
        )}
      </div>
      {score !== null && (
        <span className={`text-lg font-black ml-2 tabular-nums ${
          isWinner ? 'text-gold' : 'text-white/70'
        }`}>
          {score}
        </span>
      )}
    </div>
  )
}
