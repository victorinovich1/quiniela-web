'use client'

import { useState } from 'react'
import Flag from '@/components/Flag'
import { createClient } from '@/lib/supabase/client'
import type { LeaderboardRow, Match, Team, Prediction } from '@/lib/types'
import { TOTAL_JOKE_AVATARS, AVATAR_PATHS } from '@/lib/avatars'

interface Props {
  user: { id: string }
  rows: LeaderboardRow[]
  recentMatches: Match[]
  teams: Team[]
  predictions: Prediction[]
  dataError: string | null
}

export default function LeaderboardClient({ user, rows, recentMatches, teams, predictions, dataError }: Props) {
  const [showPunishModal, setShowPunishModal] = useState(false)
  const [punishing, setPunishing] = useState(false)
  const [selectedVictims, setSelectedVictims] = useState<string[]>([])
  const [punishError, setPunishError] = useState<string | null>(null)

  const teamsById = teams.reduce((acc, t) => {
    if (t?.id) acc[t.id] = t
    return acc
  }, {} as Record<number, Team>)

  const predsByEntry = predictions.reduce((acc, p) => {
    if (p?.entry_id && p?.match_id) {
      if (!acc[p.entry_id]) acc[p.entry_id] = {}
      acc[p.entry_id][p.match_id] = p
    }
    return acc
  }, {} as Record<number, Record<number, Prediction>>)

  const updatedAt = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })

  // Verificar si el usuario actual es el Rey (#1)
  const myRow = rows.find(r => r.user_id === user.id)
  const isKing = myRow?.rank === 1

  // Avatares de broma disponibles (dinámico)
  const jokeAvatars = Array.from({ length: TOTAL_JOKE_AVATARS }, (_, i) => i + 1)

  // Usuarios elegibles para castigo (todos excepto el Rey)
  const eligibleVictims = rows.filter(r => r.user_id !== user.id)

  async function handlePunish() {
    if (selectedVictims.length !== 2) {
      setPunishError('Debes seleccionar exactamente 2 usuarios')
      return
    }

    setPunishing(true)
    setPunishError(null)

    try {
      const supabase = createClient()
      
      // Asignar avatares de broma aleatorios a los 2 seleccionados
      const victim1 = selectedVictims[0]
      const victim2 = selectedVictims[1]
      const jokeId1 = jokeAvatars[Math.floor(Math.random() * jokeAvatars.length)]
      const jokeId2 = jokeAvatars[Math.floor(Math.random() * jokeAvatars.length)]

      const { error: err1 } = await supabase
        .from('profiles')
        .update({ avatar_temp_id: jokeId1 })
        .eq('id', victim1)

      if (err1) throw err1

      const { error: err2 } = await supabase
        .from('profiles')
        .update({ avatar_temp_id: jokeId2 })
        .eq('id', victim2)

      if (err2) throw err2

      setShowPunishModal(false)
      setSelectedVictims([])
      
      // Recargar página para ver los cambios
      window.location.reload()
    } catch (e) {
      setPunishError(e instanceof Error ? e.message : 'Error al castigar')
    } finally {
      setPunishing(false)
    }
  }

  function toggleVictim(userId: string) {
    setSelectedVictims(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else if (prev.length < 2) {
        return [...prev, userId]
      }
      return prev
    })
  }

  return (
    <>
      {dataError && (
        <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 mb-4 text-sm">
          <div className="font-bold mb-1">Error al cargar datos</div>
          <div className="text-xs opacity-80">{dataError}</div>
          <div className="text-xs opacity-60 mt-2">
            Si el problema persiste, contacta al administrador.
          </div>
        </div>
      )}

      {/* Botón del Rey */}
      {isKing && (
        <div className="bg-gradient-to-r from-gold/20 to-yellow-500/10 border-2 border-gold rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-gold font-black uppercase tracking-wider text-sm flex items-center gap-2">
                <span className="text-2xl">👑</span>
                TRONO DEL REY
              </h3>
              <p className="text-white/60 text-xs mt-1">
                Como líder del ranking, puedes castigar a 2 usuarios con avatares de broma
              </p>
            </div>
            <button
              onClick={() => setShowPunishModal(true)}
              className="btn bg-gold hover:bg-gold/80 text-navy-deepest font-black whitespace-nowrap"
            >
              👑 CASTIGAR (2)
            </button>
          </div>
        </div>
      )}

      <div className="card p-2 sm:p-3">
        {rows.length === 0 ? (
          <div className="py-10 text-center text-white/40 uppercase tracking-wider text-sm">
            {dataError ? 'No se pudieron cargar los datos' : 'Aún no hay jugadas registradas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className={`grid items-center gap-2 px-2 py-2 label-up border-b border-white/10`}
                style={{
                  gridTemplateColumns: `36px 1fr 60px 60px 64px ${recentMatches.map(() => '56px').join(' ')}`
                }}>
                <div>#</div>
                <div>Jugada</div>
                <div className="text-right hidden sm:block">Partidos</div>
                <div className="text-right hidden sm:block">Esp.</div>
                <div className="text-right">Total</div>
                {recentMatches.map((m) => {
                  const homeTeam = m?.home_team_id ? teamsById[m.home_team_id] : null
                  const awayTeam = m?.away_team_id ? teamsById[m.away_team_id] : null
                  return (
                    <div key={m?.id ?? Math.random()} className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-0.5">
                        {homeTeam && <Flag team={homeTeam} size={10} />}
                        <span className="text-[8px] text-white/40">-</span>
                        {awayTeam && <Flag team={awayTeam} size={10} />}
                      </div>
                      {(m?.home_score !== null && m?.away_score !== null) && (
                        <div className={`text-[9px] font-bold ${m?.status === 'live' ? 'text-red-500' : 'text-fifaGreen'}`}>
                          {m.home_score}-{m.away_score}
                        </div>
                      )}
                      {m?.status === 'live' && (
                        <div className="text-[7px] text-red-500 uppercase font-bold animate-pulse">Vivo</div>
                      )}
                    </div>
                  )
                })}
              </div>
              {rows.map((row, idx) => {
                const isMe = row?.user_id === user?.id
                const medal = idx === 0 ? 'text-gold' : idx < 3 ? 'text-fifaGreen' : 'text-white/40'
                return (
                  <div key={row?.entry_id ?? idx}
                    className={`grid items-center gap-2 px-2 py-3 border-b border-white/5 last:border-0 ${
                      isMe ? 'bg-gold/10 rounded-lg' : ''
                    }`}
                    style={{
                      gridTemplateColumns: `36px 1fr 60px 60px 64px ${recentMatches.map(() => '56px').join(' ')}`
                    }}>
                    <div className={`text-base font-extrabold ${medal}`}>{idx + 1}</div>
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden border-2 border-white/20 bg-white/10">
                        <img
                          src={row?.display_avatar ?? AVATAR_PATHS.default}
                          alt={row?.alias ?? 'Avatar'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback si la imagen no existe
                            (e.target as HTMLImageElement).src = AVATAR_PATHS.default
                          }}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-white uppercase tracking-tight truncate">{row?.alias ?? 'Sin nombre'}</span>
                          {isMe && <span className="badge bg-gold text-navy-deepest">Tú</span>}
                          {row?.rank === 1 && <span className="badge bg-gold text-navy-deepest">👑 REY</span>}
                          {!row?.paid && <span className="badge bg-danger/30 text-danger">Sin pagar</span>}
                          {row?.avatar_temp_id && <span className="badge bg-yellow-500/30 text-yellow-400">🤡 Castigado</span>}
                        </div>
                        <div className="text-[10px] text-white/40 truncate">
                          {row?.display_name || 'Anónimo'}
                          <span className="sm:hidden"> · {row?.match_points ?? 0}G + {row?.special_points ?? 0}E</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-white/60 text-sm hidden sm:block">{row?.match_points ?? 0}</div>
                    <div className="text-right text-white/60 text-sm hidden sm:block">{row?.special_points ?? 0}</div>
                    <div className="text-right font-extrabold text-white text-base sm:text-lg">{row?.total_points ?? 0}</div>
                    {recentMatches.map((m) => {
                      const pred = row?.entry_id && m?.id ? predsByEntry[row.entry_id]?.[m.id] : null
                      return (
                        <div key={m?.id ?? Math.random()} className="text-center">
                          {pred && pred.home_score !== null && pred.away_score !== null ? (
                            <div className="text-[10px] text-white/70 font-mono">
                              {pred.home_score}-{pred.away_score}
                            </div>
                          ) : (
                            <div className="text-[10px] text-white/30">-/-</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Castigo */}
      {showPunishModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-navy-deepest border-2 border-gold rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gold font-black uppercase tracking-wider text-lg flex items-center gap-2">
                <span className="text-2xl">👑</span>
                Castigo del Rey
              </h3>
              <button
                onClick={() => setShowPunishModal(false)}
                className="text-white/40 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>

            <p className="text-white/70 text-sm mb-4">
              Selecciona 2 usuarios para asignarles avatares de broma. El castigo durará hasta el próximo partido en vivo.
            </p>

            {punishError && (
              <div className="bg-danger/15 border border-danger/40 text-danger rounded-lg p-3 mb-4 text-sm">
                {punishError}
              </div>
            )}

            <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
              {eligibleVictims.map((victim) => (
                <button
                  key={victim.user_id}
                  onClick={() => toggleVictim(victim.user_id)}
                  disabled={punishing || (!selectedVictims.includes(victim.user_id) && selectedVictims.length >= 2)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedVictims.includes(victim.user_id)
                      ? 'bg-gold/20 border-gold'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  } ${
                    punishing || (!selectedVictims.includes(victim.user_id) && selectedVictims.length >= 2)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/20 bg-white/10 flex-shrink-0">
                      <img
                        src={victim.display_avatar}
                        alt={victim.alias}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = AVATAR_PATHS.default
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-bold text-sm truncate">{victim.alias}</div>
                      <div className="text-white/40 text-xs truncate">{victim.display_name}</div>
                    </div>
                    {selectedVictims.includes(victim.user_id) && (
                      <div className="text-gold text-xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="text-white/60 text-xs mb-4">
              Seleccionados: {selectedVictims.length} / 2
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPunishModal(false)}
                disabled={punishing}
                className="flex-1 btn btn-outline"
              >
                Cancelar
              </button>
              <button
                onClick={handlePunish}
                disabled={punishing || selectedVictims.length !== 2}
                className="flex-1 btn bg-gold hover:bg-gold/80 text-navy-deepest font-black"
              >
                {punishing ? 'Castigando...' : '👑 Castigar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
