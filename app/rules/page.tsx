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

  // Formatear fecha de bloqueo global (renderizado en servidor)
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Imagen (arriba en móvil, derecha en desktop) */}
            <div className="lg:order-2">
              <img 
                src="/images/rules/rules-puntos.webp" 
                alt="Sistema de puntos" 
                className="w-full rounded-2xl border border-white/10 shadow-lg shadow-black/20"
              />
            </div>

            {/* Contenido (abajo en móvil, izquierda en desktop) */}
            <div className="lg:order-1 space-y-6">
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
            </div>
          </div>

          {/* Podio Final */}
          <div className="mt-6 space-y-4">
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

            {/* Banner Podio */}
            <div className="w-full">
              <img 
                src="/images/rules/rules-podio.webp" 
                alt="Podio del Mundial" 
                className="w-full rounded-2xl border border-white/10 shadow-lg shadow-black/20"
              />
            </div>
          </div>
        </div>

        {/* Regla de los 15 Minutos */}
        <div className="card">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
              <Timer className="w-6 h-6 text-fifaGreen" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Bloqueo por Partido
              </h2>
              <p className="text-white/60 text-sm">
                Fair play: No vale arrepentirse cuando el partido ya empezó
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Imagen (arriba en móvil, izquierda en desktop) */}
            <div className="lg:order-1">
              <img 
                src="/images/rules/rules-tiempo.webp" 
                alt="Regla de los 15 minutos" 
                className="w-full rounded-2xl border border-white/10 shadow-lg shadow-black/20"
              />
            </div>

            {/* Contenido (abajo en móvil, derecha en desktop) */}
            <div className="lg:order-2">
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
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-gold" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Cierre Global
              </h2>
              <p className="text-white/60 text-sm">
                Protección del podio y las quinielas activas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Imagen (arriba en móvil, izquierda en desktop) */}
            <div className="lg:order-1">
              <img 
                src="/images/rules/rules-cierre.webp" 
                alt="Cierre Global" 
                className="w-full rounded-2xl border border-white/10 shadow-lg shadow-black/20 object-cover"
              />
            </div>

            {/* Contenido (abajo en móvil, derecha en desktop) */}
            <div className="lg:order-2">
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
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
              <ListChecks className="w-6 h-6 text-fifaGreen" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Fase Eliminatoria
              </h2>
              <p className="text-white/60 text-sm">
                Los cruces se habilitan conforme avanza el torneo
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Imagen (arriba en móvil, derecha en desktop) */}
            <div className="lg:order-2">
              <img 
                src="/images/rules/rules-ko.webp" 
                alt="Fase Eliminatoria" 
                className="w-full rounded-2xl border border-white/10 shadow-lg shadow-black/20 object-cover"
              />
            </div>

            {/* Contenido (abajo en móvil, izquierda en desktop) */}
            <div className="lg:order-1 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <p className="text-white/80 text-sm leading-relaxed">
                  Los partidos de eliminatorias (16avos, octavos, cuartos, semis y final) se habilitan 
                  <span className="text-fifaGreen font-bold"> conforme la FIFA defina los rivales reales</span> tras finalizar la fase de grupos.
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  Podrás pronosticar cada partido hasta 15 minutos antes de su inicio, siguiendo la regla general de bloqueo.
                </p>
              </div>
              
              <div className="bg-navy-dark/60 border border-fifaGreen/30 rounded-lg p-3">
                <p className="text-white/60 text-xs">
                  🏆 El administrador sincroniza los resultados y define los cruces manualmente o mediante la API oficial de FIFA.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sistema de Penales */}
        <div className="card">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <div className="text-2xl">🎯</div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Penales en Eliminatorias
              </h2>
              <p className="text-white/60 text-sm">
                Cómo funcionan los desempates cuando hay empate en eliminatorias
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Imagen (arriba en móvil, izquierda en desktop) */}
            <div className="lg:order-1">
              <img 
                src="/images/rules/rules-penales.webp" 
                alt="Sistema de Penales" 
                className="w-full rounded-2xl border border-white/10 shadow-lg shadow-black/20 object-cover"
              />
            </div>

            {/* Contenido (abajo en móvil, derecha en desktop) */}
            <div className="lg:order-2 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
                <p className="text-white/80 text-sm leading-relaxed">
                  Si pronosticas un empate en eliminatorias (ej. 1-1, 2-2, 0-0), 
                  <span className="text-yellow-400 font-bold"> deberás elegir obligatoriamente quién avanza de ronda</span>.
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  Si cambias el marcador a victoria directa (ej. 2-1), el selector de &quot;quién avanza&quot; desaparece automáticamente.
                </p>
              </div>

              <div className="bg-navy-dark/60 border border-yellow-500/30 rounded-lg p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-3">
                  ¿Cómo se otorgan los puntos?
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-fifaGreen font-bold flex-shrink-0">•</span>
                    <p className="text-white/80">
                      <span className="font-bold text-fifaGreen">Marcador Exacto ({config?.pt_exact_ko ?? 0} pts)</span>: 
                      Si aciertas el marcador tras los 120 minutos, sin importar quién ganó en penales.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-400 font-bold flex-shrink-0">•</span>
                    <p className="text-white/80">
                      <span className="font-bold text-yellow-400">Ganador Correcto ({config?.pt_winner_ko ?? 0} pts)</span>:
                      Si predices victoria directa y aciertas quién gana (120&apos; o penales), 
                      O si predices empate y aciertas quién avanza en penales.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <p className="text-white/60 text-xs">
                  💡 <span className="font-bold text-yellow-400">Ejemplo:</span> Argentina 3-3 Francia (penales: Argentina).
                  <br />
                  • Predices 3-3 + Argentina → <span className="text-fifaGreen font-bold">{config?.pt_exact_ko ?? 0} pts</span> (marcador exacto)
                  <br />
                  • Predices 2-2 + Argentina → <span className="text-yellow-400 font-bold">{config?.pt_winner_ko ?? 0} pts</span> (ganador en penales)
                  <br />
                  • Predices 2-1 Argentina → <span className="text-yellow-400 font-bold">{config?.pt_winner_ko ?? 0} pts</span> (ganador correcto)
                  <br />
                  • Predices 2-2 + Francia → <span className="text-white/40 font-bold">0 pts</span> (ganador incorrecto)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Reglas de Desempate */}
        <div className="card">
          <div className="flex items-start gap-4 mb-6">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
              <div className="text-2xl">🏅</div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-2">
                Reglas de Desempate
              </h2>
              <p className="text-white/60 text-sm">
                Criterios para definir al ganador en caso de empate de puntos
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Imagen (arriba en móvil, izquierda en desktop) */}
            <div className="lg:order-1">
              <img 
                src="/images/rules/rules-desempate.webp" 
                alt="Reglas de Desempate" 
                className="w-full rounded-2xl border border-white/10 shadow-lg shadow-black/20 object-cover"
              />
            </div>

            {/* Contenido (abajo en móvil, derecha en desktop) */}
            <div className="lg:order-2 space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white/80 text-sm leading-relaxed mb-4">
                  En caso de empate en la clasificación general al finalizar el Mundial, 
                  se aplicarán los siguientes <span className="text-gold font-bold">criterios de desempate en el orden indicado</span>:
                </p>

                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fifaGreen/20 flex items-center justify-center text-xs font-bold text-fifaGreen">
                      1
                    </span>
                    <p className="text-white/80 pt-0.5">
                      Mayor cantidad de <span className="font-bold text-fifaGreen">resultados exactos acertados</span> durante todo el torneo.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fifaGreen/20 flex items-center justify-center text-xs font-bold text-fifaGreen">
                      2
                    </span>
                    <p className="text-white/80 pt-0.5">
                      Mayor cantidad de <span className="font-bold text-fifaGreen">aciertos de ganador en partidos eliminatorios</span>.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fifaGreen/20 flex items-center justify-center text-xs font-bold text-fifaGreen">
                      3
                    </span>
                    <p className="text-white/80 pt-0.5">
                      Mayor cantidad de <span className="font-bold text-fifaGreen">resultados exactos en partidos eliminatorios</span>.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-fifaGreen/20 flex items-center justify-center text-xs font-bold text-fifaGreen">
                      4
                    </span>
                    <p className="text-white/80 pt-0.5">
                      Mayor cantidad de <span className="font-bold text-fifaGreen">puntos obtenidos en la fase eliminatoria</span>.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                      5
                    </span>
                    <p className="text-white/80 pt-0.5">
                      <span className="font-bold text-gold">Acierto del campeón</span> del Mundial.
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                      6
                    </span>
                    <p className="text-white/80 pt-0.5">
                      <span className="font-bold text-gold">Acierto del subcampeón</span> del Mundial.
                    </p>
                  </li>
                </ol>
              </div>

              <div className="bg-gold/10 border border-gold/30 rounded-lg p-3">
                <p className="text-white/60 text-xs">
                  ⚖️ Si el empate persiste luego de aplicar todos los criterios anteriores, 
                  el <span className="font-bold text-gold">premio será dividido equitativamente</span> entre los participantes empatados.
                </p>
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
