'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Navbar({
  isAuthed,
  isAdmin,
}: {
  isAuthed: boolean
  isAdmin: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const isHomePage = pathname === '/' && !isAuthed

  useEffect(() => {
    if (!isHomePage) return

    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHomePage])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const linkClass = (href: string) => {
    const active = pathname?.startsWith(href)
    return `px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${
      active
        ? 'text-fifaGreen'
        : 'text-white/60 hover:text-white'
    }`
  }

  const navbarClass = isHomePage
    ? `sticky top-0 z-40 transition-all duration-300 ${
        scrolled 
          ? 'backdrop-blur-md bg-navy-deepest/95 border-b border-white/10 shadow-lg' 
          : 'bg-transparent'
      }`
    : 'sticky top-0 z-40 backdrop-blur-md bg-navy-deepest/80 border-b border-white/10'

  return (
    <nav className={navbarClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href={isAuthed ? '/predictions' : '/'} className="flex items-center gap-2">
            <span className="text-fifaGreen font-black text-lg tracking-tight">QUINIELA</span>
            <span className="text-white/80 font-extrabold text-lg tracking-tight">2026</span>
          </Link>

          {isAuthed ? (
            <div className="hidden md:flex items-center gap-1">
              <Link href="/predictions" className={linkClass('/predictions')}>Pronósticos</Link>
              <Link href="/leaderboard" className={linkClass('/leaderboard')}>Ranking</Link>
              <Link href="/entries" className={linkClass('/entries')}>Mis jugadas</Link>
              <Link href="/profile" className={linkClass('/profile')}>Perfil</Link>
              {isAdmin && (
                <Link href="/admin" className={linkClass('/admin')}>Admin</Link>
              )}
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-danger"
              >
                Salir
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="text-xs text-white/80 hover:text-white px-3 py-2 font-bold uppercase tracking-wider">
                Entrar
              </Link>
            </div>
          )}

          {isAuthed && (
            <button
              onClick={handleLogout}
              className="md:hidden text-xs text-white/60 hover:text-white px-2 py-1 font-bold uppercase tracking-wider"
            >
              Salir
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}
