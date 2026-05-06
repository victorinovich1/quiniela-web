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
    <div className="bg-navy-deepest">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image con overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/images/landing/hero.jpg)' }}
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
                img: '/images/landing/paso1.jpg' 
              },
              { 
                num: 2, 
                title: 'Crea tu quiniela', 
                desc: 'Dale un nombre creativo', 
                img: '/images/landing/paso2.jpg' 
              },
              { 
                num: 3, 
                title: 'Pronostica', 
                desc: 'Llena todos los marcadores', 
                img: '/images/landing/paso3.jpg' 
              },
              { 
                num: 4, 
                title: 'Compite', 
                desc: 'Sube en el ranking en vivo', 
                img: '/images/landing/paso4.jpg' 
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
    </div>
  )
}
