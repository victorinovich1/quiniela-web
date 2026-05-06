import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { LeaderboardRow } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: top } = await supabase
    .from('leaderboard')
    .select('entry_id, user_id, display_name, alias, paid, match_points, special_points, total_points')
    .order('total_points', { ascending: false })
    .limit(5)

  const leaders = (top ?? []) as LeaderboardRow[]

  // Usuario logueado: Hero simplificado
  if (user) {
    return (
      <div className="min-h-screen bg-navy-deepest flex items-center justify-center py-20">
        <div className="text-center max-w-2xl px-4">
          <div className="inline-block bg-fifaGreen/15 border border-fifaGreen/40 px-4 py-1.5 rounded-full mb-6">
            <span className="text-fifaGreen text-xs font-bold uppercase tracking-[0.2em]">Bienvenido de nuevo</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tight mb-6 text-white">
            ¡Ya estás dentro!
          </h1>
          <p className="text-lg text-white/60 mb-10">
            Es hora de demostrar tus conocimientos futbolísticos
          </p>
          <Link href="/predictions" className="btn btn-primary text-xl px-12 py-4">
            IR A MIS PRONÓSTICOS
          </Link>
        </div>
      </div>
    )
  }

  // Usuario invitado: Landing completa
  return (
    <div className="-mx-4 sm:-mx-6 lg:-mx-8 -my-6 bg-navy-deepest">
      {/* Hero Section - Full Width */}
      <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        {/* Background Image con overlay */}
        <div className="absolute inset-0 z-0 w-full">
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/images/landing/hero.png)' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-navy-deepest/80 via-navy-deepest/60 to-navy-deepest" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-4xl px-4 py-20">
          <div className="inline-block bg-fifaGreen/15 border border-fifaGreen/40 px-4 py-1.5 rounded-full mb-6">
            <span className="text-fifaGreen text-xs font-bold uppercase tracking-[0.2em]">FIFA World Cup 2026</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight mb-6 leading-none">
            <span className="text-white">VIVÍ EL MUNDIAL</span>
            <br />
            <span className="bg-gradient-to-r from-fifaGreen via-fifaGreen-light to-gold bg-clip-text text-transparent">
              A TU MANERA
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto">
            Crea tu quiniela, competí con amigos y demostrá quién sabe más de fútbol
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn btn-primary text-lg px-10 py-4">
              EMPEZAR AHORA
            </Link>
            <Link href="/login" className="btn btn-outline text-lg px-10 py-4">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Sección: Cómo Participar */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
              Tu camino a la gloria
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Solo cuatro pasos te separan de competir con los mejores
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { 
                num: 1, 
                title: 'Registrate', 
                desc: 'Usa tu código de invitación', 
                img: '/images/landing/paso1.png' 
              },
              { 
                num: 2, 
                title: 'Crea tu quiniela', 
                desc: 'Dale un nombre creativo', 
                img: '/images/landing/paso2.png' 
              },
              { 
                num: 3, 
                title: 'Pronostica', 
                desc: 'Llena todos los marcadores', 
                img: '/images/landing/paso3.png' 
              },
              { 
                num: 4, 
                title: 'Compite', 
                desc: 'Sube en el ranking en vivo', 
                img: '/images/landing/paso4.png' 
              },
            ].map((paso) => (
              <div 
                key={paso.num}
                className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 hover:border-fifaGreen/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-fifaGreen/20"
              >
                {/* Imagen de fondo */}
                <div className="aspect-[3/4] relative overflow-hidden">
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{ backgroundImage: `url(${paso.img})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deepest via-navy-deepest/80 to-transparent" />
                  
                  {/* Número */}
                  <div className="absolute top-4 left-4 w-12 h-12 rounded-full bg-fifaGreen flex items-center justify-center">
                    <span className="text-2xl font-black text-navy-deepest">{paso.num}</span>
                  </div>

                  {/* Contenido */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-black uppercase text-white mb-2 tracking-tight">
                      {paso.title}
                    </h3>
                    <p className="text-sm text-white/70">
                      {paso.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ranking en vivo */}
      {leaders.length > 0 && (
        <section className="py-20 px-4 bg-white/5">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-4">
                Ranking en vivo
              </h2>
              <p className="text-white/60">Los mejores pronosticadores del momento</p>
            </div>

            <div className="card">
              <div className="space-y-2">
                {leaders.map((row, idx) => (
                  <div 
                    key={row.entry_id} 
                    className="flex items-center justify-between py-4 border-t border-white/5 first:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-extrabold w-8 ${
                        idx === 0 ? 'text-gold' : 
                        idx < 3 ? 'text-fifaGreen' : 
                        'text-white/40'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-base font-bold uppercase tracking-tight text-white">
                          {row.alias}
                        </div>
                        {row.display_name && (
                          <div className="text-xs text-white/40">{row.display_name}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-white">{row.total_points}</div>
                      <div className="text-xs text-white/40">puntos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <Link href="/signup" className="btn btn-primary">
                Únete al ranking
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* El Manual del Jugador */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
              El manual del jugador
            </h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto">
              Las reglas son simples, pero las conoce solo quien las lee
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fair Play */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-fifaGreen/50 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-fifaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase text-white mb-2">Fair Play</h3>
                  <p className="text-white/70 text-sm">
                    Bloqueo 15 minutos antes del pitazo inicial. No vale arrepentirse cuando el partido ya empezó.
                  </p>
                </div>
              </div>
            </div>

            {/* Doble Filo */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-fifaGreen/50 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-fifaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase text-white mb-2">Doble Filo</h3>
                  <p className="text-white/70 text-sm">
                    Sumas puntos por marcador exacto o solo por ganador. Mientras más preciso, más puntos.
                  </p>
                </div>
              </div>
            </div>

            {/* Podio Sagrado */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-fifaGreen/50 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase text-white mb-2">Podio Sagrado</h3>
                  <p className="text-white/70 text-sm">
                    Elegí tu Top 4 antes de que ruede la primera bola. Vale mucho más que cualquier partido.
                  </p>
                </div>
              </div>
            </div>

            {/* Multi-Vida */}
            <div className="group bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-fifaGreen/50 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-fifaGreen/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-fifaGreen" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black uppercase text-white mb-2">Multi-Vida</h3>
                  <p className="text-white/70 text-sm">
                    ¿Una sola oportunidad? No. Crea las quinielas que quieras con distintas estrategias.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Seguridad y Confianza */}
      <section className="py-20 px-4 bg-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Imagen */}
            <div className="relative aspect-square rounded-2xl overflow-hidden">
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: 'url(/images/landing/estadio.png)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-deepest/80 to-transparent" />
            </div>

            {/* Contenido */}
            <div>
              <div className="inline-block bg-fifaGreen/15 border border-fifaGreen/40 px-3 py-1 rounded-full mb-4">
                <span className="text-fifaGreen text-xs font-bold uppercase tracking-wider">Grupo cerrado</span>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white mb-6">
                Solo por invitación
              </h2>
              
              <div className="space-y-4 text-white/70">
                <p className="text-lg">
                  Esta no es una quiniela pública. Es un grupo selecto donde todos se conocen.
                </p>
                <p>
                  Necesitas un <span className="text-fifaGreen font-bold">código de activación</span> que solo el administrador puede generar. Sin código, no hay acceso.
                </p>
                <p>
                  Tus datos están protegidos y solo compites con gente de confianza.
                </p>
              </div>

              <div className="mt-8 flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
                <svg className="w-6 h-6 text-fifaGreen flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="text-sm">
                  <div className="font-bold text-white">100% privado y seguro</div>
                  <div className="text-white/60">Sin compartir datos con terceros</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 border-t border-white/10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6">
            <img 
              src="/images/landing/trofeo.png" 
              alt="Copa Mundial FIFA" 
              className="w-20 h-20 mx-auto object-contain opacity-80 grayscale hover:grayscale-0 transition-all duration-300"
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-fifaGreen font-black text-xl tracking-tight">QUINIELA</span>
            <span className="text-white/80 font-extrabold text-xl tracking-tight">2026</span>
          </div>

          <p className="text-white/40 text-sm mb-6">
            Viví el Mundial a tu manera
          </p>

          <div className="text-white/30 text-xs">
            © 2026 Quiniela Pro. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}
