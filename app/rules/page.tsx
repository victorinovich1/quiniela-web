import { createClient } from '@/lib/supabase/server'
import type { Settings } from '@/lib/types'
import PageHeader from '@/components/PageHeader'
import { Trophy, Timer, ShieldCheck, ListChecks } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RulesPage() {
  const supabase = createClient()

  const { data: settings } = await supabase
    .from('settings')
    .select('*')
    .eq('id', 1)
    .single()

  const config = settings as Settings

  // Formatear fecha de bloqueo global
  const lockDate = config?.lock_at
    ? new Date(config.lock_at).toLocaleString('es-AR', {
        dateStyle: 'full',
        timeStyle: 'short',
      })
    : 'No definido'

  return (
    <div>
      <PageHeader title="Reglamento" label="Reglas del juego" />

      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Sistema de Puntuación */}
        <div className="card">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-fifaGreen" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Sistema de Puntuación
              </h2>
              <p className="text-white/60 text-sm">
                Cada pronóstico acertado suma puntos a tu quiniela
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Fase de Grupos */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifaGreen mb-3">
                Fase de Grupos
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-navy-dark/60 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    Marcador exacto
                  </div>
                  <div className="text-3xl font-black text-white">
                    {config?.pt_exact_group ?? 0}
                    <span className="text-sm text-white/60 ml-1">pts</span>
                  </div>
                </div>
                <div className="bg-navy-dark/60 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    Solo ganador
                  </div>
                  <div className="text-3xl font-black text-white">
                    {config?.pt_winner_group ?? 0}
                    <span className="text-sm text-white/60 ml-1">pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Eliminatorias */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fifaGreen mb-3">
                Eliminatorias (16avos → Final)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-navy-dark/60 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    Marcador exacto
                  </div>
                  <div className="text-3xl font-black text-white">
                    {config?.pt_exact_ko ?? 0}
                    <span className="text-sm text-white/60 ml-1">pts</span>
                  </div>
                </div>
                <div className="bg-navy-dark/60 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    Solo ganador
                  </div>
                  <div className="text-3xl font-black text-white">
                    {config?.pt_winner_ko ?? 0}
                    <span className="text-sm text-white/60 ml-1">pts</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Podio Final */}
            <div className="bg-gradient-to-br from-gold/20 to-fifaGreen/10 rounded-xl p-4 border border-gold/30">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gold mb-3">
                Podio Final
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-navy-dark/80 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    🥇 Campeón
                  </div>
                  <div className="text-2xl font-black text-gold">
                    {config?.pt_champion ?? 0}
                    <span className="text-xs text-white/60 ml-1">pts</span>
                  </div>
                </div>
                <div className="bg-navy-dark/80 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    🥈 2º Lugar
                  </div>
                  <div className="text-2xl font-black text-white">
                    {config?.pt_runner_up ?? 0}
                    <span className="text-xs text-white/60 ml-1">pts</span>
                  </div>
                </div>
                <div className="bg-navy-dark/80 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    🥉 3º Lugar
                  </div>
                  <div className="text-2xl font-black text-white">
                    {config?.pt_third ?? 0}
                    <span className="text-xs text-white/60 ml-1">pts</span>
                  </div>
                </div>
                <div className="bg-navy-dark/80 rounded-lg p-3">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    4º Lugar
                  </div>
                  <div className="text-2xl font-black text-white">
                    {config?.pt_fourth ?? 0}
                    <span className="text-xs text-white/60 ml-1">pts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Regla de los 15 Minutos */}
        <div className="card">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-fifaGreen" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Bloqueo por Partido
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Fair play: No vale arrepentirse cuando el partido ya empezó
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm leading-relaxed">
                  Cada partido se <span className="text-fifaGreen font-bold">bloquea automáticamente 15 minutos antes de su hora de inicio</span>. 
                  Una vez bloqueado, no podrás modificar tu pronóstico para ese partido específico.
                </p>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/60 text-xs">
                    💡 Ejemplo: Si un partido inicia a las 21:00, podrás modificar tu pronóstico hasta las 20:45.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cierre Global */}
        <div className="card">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Cierre Global
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Protección del podio y las quinielas activas
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm leading-relaxed mb-3">
                  El <span className="text-gold font-bold">podio final</span> (tu Top 4: Campeón, Subcampeón, 3º y 4º) 
                  y la <span className="text-gold font-bold">eliminación de quinielas</span> se bloquean cuando llega la fecha de cierre global:
                </p>
                <div className="bg-navy-dark/60 rounded-lg p-3 border border-gold/30">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">
                    Fecha de cierre global
                  </div>
                  <div className="text-lg font-bold text-gold">
                    {lockDate}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <p className="text-white/60 text-xs">
                    ⚠️ Después de esta fecha, no podrás modificar tu podio ni eliminar tus quinielas. Los pronósticos de partidos individuales siguen la regla de los 15 minutos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eliminatorias y Cruces */}
        <div className="card">
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-fifaGreen" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Fase Eliminatoria
              </h2>
              <p className="text-white/60 text-sm mb-4">
                Los cruces se habilitan conforme avanza el torneo
              </p>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <p className="text-white/80 text-sm leading-relaxed">
                  Los partidos de eliminatorias (16avos, octavos, cuartos, semis y final) se habilitan 
                  <span className="text-fifaGreen font-bold"> conforme la FIFA defina los rivales reales</span> tras finalizar la fase de grupos.
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  Podrás pronosticar cada partido hasta 15 minutos antes de su inicio, siguiendo la regla general de bloqueo.
                </p>
                <div className="bg-navy-dark/60 rounded-lg p-3">
                  <p className="text-white/60 text-xs">
                    🏆 El administrador sincroniza los resultados y define los cruces manualmente o mediante la API oficial de FIFA.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Nota Final */}
        <div className="bg-fifaGreen/10 border border-fifaGreen/30 rounded-xl p-4">
          <p className="text-white/80 text-sm text-center">
            <span className="font-bold text-fifaGreen">Recuerda:</span> Los valores de puntos pueden cambiar si el administrador los ajusta. 
            Esta página siempre muestra los valores actuales de la configuración.
          </p>
        </div>
      </div>
    </div>
  )
}
